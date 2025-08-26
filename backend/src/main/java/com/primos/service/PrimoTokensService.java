package com.primos.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class PrimoTokensService {
    private static final Logger LOG = Logger.getLogger(PrimoTokensService.class.getName());

    @Inject
    HeliusService heliusService;

    @Inject
    TrenchService trenchService;

    /**
     * Fetches all tokens held by Primo holders from database and adds them to
     * Trenches.
     * This method gets all Primo holders from the database, fetches their token
     * holdings,
     * and automatically adds interesting tokens to the Trenches.
     *
     * @return A summary of tokens discovered and added
     */
    public String discoverAndAddPrimoTokens() {
        LOG.info("Starting Primo token discovery process using database holders...");

        try {
            // Get all Primo holders from database instead of blockchain
            List<User> primoHolders = User.<User>list("daoMember", true);

            if (primoHolders.isEmpty()) {
                return "No Primo holders found in database";
            }

            final int totalHolders = primoHolders.size();
            LOG.info(() -> String.format("Found %d Primo holders in database, fetching their token holdings...",
                    totalHolders));

            Set<String> discoveredTokens = new HashSet<>();
            Map<String, Integer> tokenHolderCount = new HashMap<>();
            final int[] processedHolders = { 0 }; // Use array to make it effectively final
            int maxHoldersToProcess = Math.min(50, primoHolders.size()); // Limit to avoid rate limits

            // Process a subset of holders to discover tokens
            for (User holder : primoHolders) {
                if (processedHolders[0] >= maxHoldersToProcess) {
                    break;
                }

                String holderAddress = holder.getPublicKey();
                if (holderAddress == null || holderAddress.isEmpty()) {
                    continue;
                }

                try {
                    // Get tokens for this holder using Helius API
                    List<String> holderTokens = fetchTokensForHolder(holderAddress);

                    for (String token : holderTokens) {
                        discoveredTokens.add(token);
                        tokenHolderCount.put(token, tokenHolderCount.getOrDefault(token, 0) + 1);
                    }

                    processedHolders[0]++;

                    // Add small delay to avoid rate limiting
                    if (processedHolders[0] % 10 == 0) {
                        Thread.sleep(1000);
                    }

                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Token discovery interrupted", ie);
                } catch (Exception e) {
                    LOG.warning(String.format("Failed to fetch tokens for holder %s: %s", holderAddress,
                            e.getMessage()));
                }
            }

            LOG.info(() -> String.format("Discovered %d unique tokens from %d holders", discoveredTokens.size(),
                    processedHolders[0]));

            // Add popular tokens to Trenches (tokens held by multiple Primo holders)
            int addedTokens = 0;
            for (Map.Entry<String, Integer> entry : tokenHolderCount.entrySet()) {
                String token = entry.getKey();
                int holderCount = entry.getValue();

                // Only add tokens held by multiple Primo holders (indicates community interest)
                if (holderCount >= 2) {
                    try {
                        // Use the first Primo holder as the "caller" for this token
                        String firstCaller = primoHolders.get(0).getPublicKey();

                        // Check if token is already in Trenches
                        if (!isTokenAlreadyInTrenches(token)) {
                            trenchService.add(firstCaller, token, "primo-discovery", "community", null);
                            addedTokens++;

                            LOG.info(() -> String.format("Added token %s to Trenches (held by %d Primo holders)", token,
                                    holderCount));
                        }
                    } catch (Exception e) {
                        LOG.warning(
                                () -> String.format("Failed to add token %s to Trenches: %s", token, e.getMessage()));
                    }
                }
            }

            String result = String.format(
                    "Processed %d Primo holders, discovered %d tokens, added %d new tokens to Trenches",
                    processedHolders[0], discoveredTokens.size(), addedTokens);
            LOG.info(result);
            return result;

        } catch (Exception e) {
            String error = "Failed to discover Primo tokens: " + e.getMessage();
            LOG.severe(error);
            return error;
        }
    }

    /**
     * Fetches token holdings for a specific wallet address using Helius API.
     * This method calls the Helius API to get fungible tokens held by the wallet.
     *
     * @param walletAddress The wallet address to fetch tokens for
     * @return List of token mint addresses
     */
    private List<String> fetchTokensForHolder(String walletAddress) {
        // This will be implemented using a call to Helius API
        // For now, return empty list - we'll implement this in the HeliusService
        return heliusService.getTokensForWallet(walletAddress);
    }

    /**
     * Checks if a token is already added to Trenches.
     *
     * @param tokenAddress The token contract address
     * @return true if token is already in Trenches
     */
    private boolean isTokenAlreadyInTrenches(String tokenAddress) {
        return trenchService.findByContract(tokenAddress) != null;
    }
}
