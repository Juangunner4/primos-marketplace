package com.weys.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import com.weys.model.WeyToken;
import com.weys.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class WeyTokensService {
    private static final Logger LOG = Logger.getLogger(WeyTokensService.class.getName());

    @Inject
    HeliusService heliusService;

    /**
     * Updates and returns the list of all tokens held by Wey members.
     * This method discovers tokens from Wey wallets and stores them separately
     * from Trenches contracts (which are used for AI features).
     *
     * @return List of WeyToken entities with enhanced metadata
     */
    public List<WeyToken> updateAndGetWeyTokens() {
        LOG.info("Starting Wey token discovery process (separate from Trenches AI contracts)...");

        try {
            // Get all Wey holders from database
            List<User> weyHolders = User.<User>list("daoMember", true);

            if (weyHolders.isEmpty()) {
                LOG.warning("No Wey holders found in database");
                return Collections.emptyList();
            }

            final int totalHolders = weyHolders.size();
            LOG.info(String.format("Found %d Wey holders, discovering their token holdings...", totalHolders));

            Map<String, Integer> tokenHolderCount = new HashMap<>();
            Map<String, List<String>> tokenHolders = new HashMap<>(); // Track which holders have each token
            Map<String, List<WeyToken.HolderInfo>> tokenHolderDetails = new HashMap<>(); // Track detailed holder info
            Map<String, Map<String, Object>> tokenMetadata = new HashMap<>(); // Store enhanced metadata
            Map<String, User> holderUserMap = new HashMap<>(); // Cache for holder user data
            int processedHolders = 0;
            int maxHoldersToProcess = Math.min(50, weyHolders.size()); // Process up to 50 holders

            // Process Wey holders to discover their token holdings
            for (User holder : weyHolders) {
                if (processedHolders >= maxHoldersToProcess) {
                    break;
                }

                String holderAddress = holder.getPublicKey();
                if (holderAddress == null || holderAddress.isEmpty()) {
                    continue;
                }

                // Cache user data for later use
                holderUserMap.put(holderAddress, holder);

                try {
                    LOG.info(String.format("Processing holder %d/%d: %s",
                            processedHolders + 1, maxHoldersToProcess, holderAddress));

                    // Get enhanced tokens for this holder using comprehensive API integration
                    Map<String, Object> holderTokenData = heliusService.getEnhancedTokensForWallet(holderAddress);

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> holderTokens = (List<Map<String, Object>>) holderTokenData.get("tokens");

                    if (holderTokens != null) {
                        for (Map<String, Object> tokenData : holderTokens) {
                            String mint = (String) tokenData.get("mint");
                            if (mint != null && !mint.isEmpty()) {
                                // Count holders for this token
                                tokenHolderCount.put(mint, tokenHolderCount.getOrDefault(mint, 0) + 1);

                                // Track which holders have this token
                                tokenHolders.computeIfAbsent(mint, k -> new ArrayList<>()).add(holderAddress);

                                // Create detailed holder info with PFP data
                                WeyToken.HolderInfo holderInfo = new WeyToken.HolderInfo(
                                        holderAddress,
                                        holder.getPfp(),
                                        holder.getDomain(),
                                        true // All users in this context are Weys
                                );
                                tokenHolderDetails.computeIfAbsent(mint, k -> new ArrayList<>()).add(holderInfo);

                                // Store the most complete metadata we've seen for this token
                                if (!tokenMetadata.containsKey(mint) ||
                                        isMoreCompleteMetadata(tokenData, tokenMetadata.get(mint))) {
                                    tokenMetadata.put(mint, new HashMap<>(tokenData));
                                }
                            }
                        }
                    }

                    processedHolders++;

                    // Add delay to respect rate limits for multiple API calls
                    if (processedHolders % 5 == 0) {
                        LOG.info(String.format("Processed %d/%d holders, found %d unique tokens so far",
                                processedHolders, maxHoldersToProcess, tokenHolderCount.size()));
                        Thread.sleep(2000); // Longer delay for enhanced API calls
                    }

                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Wey token discovery interrupted", ie);
                } catch (Exception e) {
                    LOG.warning(String.format("Failed to fetch tokens for holder %s: %s", holderAddress,
                            e.getMessage()));
                }
            }

            LOG.info(String.format("Discovery completed: Found %d unique tokens from %d holders",
                    tokenHolderCount.size(), processedHolders));

            // Update database with discovered tokens
            long now = System.currentTimeMillis();

            for (Map.Entry<String, Integer> entry : tokenHolderCount.entrySet()) {
                String tokenContract = entry.getKey();
                int holderCount = entry.getValue();

                // Find existing token or create new one
                WeyToken token = WeyToken.find("contract", tokenContract).firstResult();
                if (token == null) {
                    token = new WeyToken();
                    token.setContract(tokenContract);
                }

                // Update basic information
                token.setHolderCount(holderCount);
                token.setUpdatedAt(now);
                token.setHolders(tokenHolders.get(tokenContract));
                token.setHolderDetails(tokenHolderDetails.get(tokenContract));

                // Set enhanced metadata if available
                Map<String, Object> metadata = tokenMetadata.get(tokenContract);
                if (metadata != null) {
                    token.setName((String) metadata.get("name"));
                    token.setSymbol((String) metadata.get("symbol"));
                    token.setImage((String) metadata.get("logoURI"));

                    // Set price data if available
                    Object priceChange = metadata.get("priceChange24h");
                    if (priceChange instanceof Number) {
                        token.setPriceChange24h(((Number) priceChange).doubleValue());
                    }

                    Object marketCap = metadata.get("marketCap");
                    if (marketCap instanceof Number) {
                        token.setMarketCap(((Number) marketCap).doubleValue());
                    }

                    // Set TradingView chart data if available
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> charts = (List<Map<String, Object>>) metadata.get("tradingViewCharts");
                    if (charts != null && !charts.isEmpty()) {
                        token.setTradingViewCharts(charts);
                    }
                }

                token.persistOrUpdate();
            }

            // Remove tokens that are no longer held by any Wey
            long cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
            List<WeyToken> existing = WeyToken.listAll();
            for (WeyToken token : existing) {
                if (!tokenHolderCount.containsKey(token.getContract()) && token.getUpdatedAt() < cutoffTime) {
                    LOG.info(String.format("Removing token %s - no longer held by Weys", token.getContract()));
                    token.delete();
                }
            }

            // Return all current tokens sorted by holder count
            List<WeyToken> result = WeyToken.<WeyToken>listAll().stream()
                    .sorted(Comparator.comparingInt(WeyToken::getHolderCount).reversed())
                    .collect(Collectors.toList());

            LOG.info(String.format("Wey token discovery complete: %d tokens in database", result.size()));
            return result;

        } catch (Exception e) {
            LOG.severe("Failed to update Wey tokens: " + e.getMessage());
            e.printStackTrace();
            // Return existing tokens from database on error
            return WeyToken.<WeyToken>listAll().stream()
                    .sorted(Comparator.comparingInt(WeyToken::getHolderCount).reversed())
                    .collect(Collectors.toList());
        }
    }

    /**
     * Checks if one metadata object is more complete than another
     */
    private boolean isMoreCompleteMetadata(Map<String, Object> newData, Map<String, Object> existingData) {
        if (existingData == null)
            return true;

        // Count non-null/non-empty fields in each metadata object
        int newFields = 0;
        int existingFields = 0;

        String[] importantFields = { "name", "symbol", "logoURI", "verified", "priceChange24h", "marketCap" };

        for (String field : importantFields) {
            if (hasValidValue(newData, field))
                newFields++;
            if (hasValidValue(existingData, field))
                existingFields++;
        }

        return newFields > existingFields;
    }

    /**
     * Checks if a map has a valid (non-null, non-empty) value for a field
     */
    private boolean hasValidValue(Map<String, Object> data, String field) {
        Object value = data.get(field);
        if (value == null)
            return false;
        if (value instanceof String) {
            String str = (String) value;
            return !str.isEmpty() && !"null".equals(str) && !"undefined".equals(str);
        }
        return true;
    }

    /**
     * Discovers and adds Wey tokens, returning a summary message.
     * This method wraps updateAndGetWeyTokens() to provide a string result
     * suitable for API responses.
     *
     * @return A summary message of the discovery operation
     */
    public String discoverAndAddWeyTokens() {
        try {
            List<WeyToken> tokens = updateAndGetWeyTokens();
            return String.format("Successfully discovered and updated %d Wey tokens", tokens.size());
        } catch (Exception e) {
            LOG.severe("Error during Wey token discovery: " + e.getMessage());
            throw new RuntimeException("Failed to discover Wey tokens: " + e.getMessage(), e);
        }
    }
}
