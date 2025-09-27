package com.weys.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Logger;

import com.weys.model.TrenchContract;
import com.weys.model.TrenchContractCaller;
import com.weys.model.TrenchUser;
import com.weys.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;

@ApplicationScoped
public class TrenchService {
    private static final long MIN_SUBMIT_INTERVAL_MS = 60_000; // 1 minute cooldown
    private static final Logger LOG = Logger.getLogger(TrenchService.class.getName());

    @Inject
    CoinGeckoService coinGeckoService;

    public void setCoinGeckoService(CoinGeckoService coinGeckoService) {
        this.coinGeckoService = coinGeckoService;
    }

    public void add(String publicKey, String contract, String source, String model) {
        add(publicKey, contract, source, model, null);
    }

    public void add(String publicKey, String contract, String source, String model, String domain) {
        long now = System.currentTimeMillis();

        TrenchUser tu = TrenchUser.find("publicKey", publicKey).firstResult();
        if (tu != null) {
            Set<String> set = tu.getContracts();
            if (set != null && set.contains(contract)) {
                throw new BadRequestException("Contract already added");
            }
            long since = now - tu.getLastSubmittedAt();
            if (since < MIN_SUBMIT_INTERVAL_MS) {
                throw new BadRequestException();
            }
        }

        TrenchContract tc = TrenchContract.find("contract", contract).firstResult();
        if (tc == null) {
            tc = new TrenchContract();
            tc.setContract(contract);
            tc.setCount(1);
            tc.setSource(source);
            tc.setModel(model);
            tc.setFirstCaller(publicKey);
            tc.setFirstCallerAt(now);
            LOG.log(java.util.logging.Level.INFO, "Fetching market cap for new contract: {0}", contract);
            Double marketCap = coinGeckoService.fetchMarketCap(contract);
            if (marketCap != null) {
                LOG.log(java.util.logging.Level.INFO, "Successfully fetched market cap for new contract {0}: {1}",
                        new Object[] { contract, marketCap });
            } else {
                LOG.log(java.util.logging.Level.WARNING, "Could not fetch market cap for new contract: {0}", contract);
            }
            tc.setFirstCallerMarketCap(marketCap);
            tc.setFirstCallerDomain(domain);
            tc.persist();

            // Add the first caller record
            TrenchContractCaller caller = new TrenchContractCaller();
            caller.setContract(contract);
            caller.setCaller(publicKey);
            caller.setCalledAt(now);
            caller.setMarketCapAtCall(marketCap);
            caller.setDomainAtCall(domain);
            caller.persist();
            LOG.log(java.util.logging.Level.INFO, "Added first caller record for contract {0} with market cap: {1}",
                    new Object[] { contract, marketCap });
        } else {
            tc.setCount(tc.getCount() + 1);
            tc.persistOrUpdate();

            // Add caller record for existing contract
            TrenchContractCaller caller = new TrenchContractCaller();
            caller.setContract(contract);
            caller.setCaller(publicKey);
            caller.setCalledAt(now);
            LOG.log(java.util.logging.Level.INFO, "Fetching market cap for existing contract: {0}", contract);
            Double marketCap = coinGeckoService.fetchMarketCap(contract);
            if (marketCap != null) {
                LOG.log(java.util.logging.Level.INFO, "Successfully fetched market cap for existing contract {0}: {1}",
                        new Object[] { contract, marketCap });
            } else {
                LOG.log(java.util.logging.Level.WARNING, "Could not fetch market cap for existing contract: {0}",
                        contract);
            }
            caller.setMarketCapAtCall(marketCap);
            caller.setDomainAtCall(domain);
            caller.persist();
            LOG.log(java.util.logging.Level.INFO, "Added caller record for existing contract {0} with market cap: {1}",
                    new Object[] { contract, marketCap });
        }

        if (tu == null) {
            tu = new TrenchUser();
            tu.setPublicKey(publicKey);
            tu.setCount(1);
            Set<String> set = new HashSet<>();
            set.add(contract);
            tu.setContracts(set);
            tu.setLastSubmittedAt(now);
            tu.persist();
        } else {
            tu.setCount(tu.getCount() + 1);
            Set<String> set = tu.getContracts();
            if (set == null)
                set = new HashSet<>();
            set.add(contract);
            tu.setContracts(set);
            tu.setLastSubmittedAt(now);
            tu.persistOrUpdate();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null) {
            user.addBadge("trenches");
            user.persistOrUpdate();
        }
    }

    public List<TrenchContract> getContracts() {
        return TrenchContract.listAll();
    }

    public List<TrenchUser> getUsers() {
        return TrenchUser.listAll();
    }

    public List<TrenchContractCaller> getLatestCallersForContract(String contract, int limit) {
        return TrenchContractCaller.find("contract = ?1 order by calledAt desc", contract)
                .page(0, limit)
                .list();
    }

    public boolean updateFirstCallerMarketCap(String contract, Double marketCap) {
        TrenchContract tc = TrenchContract.find("contract", contract).firstResult();
        if (tc != null && tc.getFirstCallerMarketCap() == null && marketCap != null) {
            tc.setFirstCallerMarketCap(marketCap);
            tc.persistOrUpdate();
            return true;
        }
        return false;
    }

    /**
     * Update missing market cap data for existing caller records
     * 
     * @param contract The contract address
     * @return Number of records updated
     */
    public int updateMissingMarketCapsForCallers(String contract) {
        // Get all callers for this contract that don't have market cap data
        List<TrenchContractCaller> callersWithoutMarketCap = TrenchContractCaller
                .find("contract = ?1 and marketCapAtCall is null", contract)
                .list();

        if (callersWithoutMarketCap.isEmpty()) {
            return 0;
        }

        // Fetch current market cap
        Double currentMarketCap = coinGeckoService.fetchMarketCap(contract);
        if (currentMarketCap == null) {
            LOG.log(java.util.logging.Level.WARNING, "Could not fetch market cap for contract: {0}", contract);
            return 0;
        }

        int updatedCount = 0;
        for (TrenchContractCaller caller : callersWithoutMarketCap) {
            caller.setMarketCapAtCall(currentMarketCap);
            caller.persistOrUpdate();
            updatedCount++;
            LOG.log(java.util.logging.Level.INFO, "Updated market cap for caller {0} on contract {1}: {2}",
                    new Object[] { caller.getCaller(), contract, currentMarketCap });
        }

        LOG.log(java.util.logging.Level.INFO, "Updated market cap for {0} caller records for contract: {1}",
                new Object[] { updatedCount, contract });
        return updatedCount;
    }

    /**
     * Backfill missing market cap data for all contracts and their callers
     * This method can be called periodically to ensure data consistency
     */
    public void backfillMissingMarketCaps() {
        LOG.log(java.util.logging.Level.INFO, "Starting backfill of missing market cap data");

        // Get all contracts that don't have first caller market cap
        List<TrenchContract> contractsWithoutMarketCap = TrenchContract
                .find("firstCallerMarketCap is null")
                .list();

        int totalUpdatedContracts = 0;
        int totalUpdatedCallers = 0;

        for (TrenchContract contract : contractsWithoutMarketCap) {
            String contractAddress = contract.getContract();

            // Fetch market cap for the contract
            Double marketCap = coinGeckoService.fetchMarketCap(contractAddress);
            if (marketCap != null) {
                // Update first caller market cap
                contract.setFirstCallerMarketCap(marketCap);
                contract.persistOrUpdate();
                totalUpdatedContracts++;

                // Update all callers for this contract
                int updatedCallers = updateMissingMarketCapsForCallers(contractAddress);
                totalUpdatedCallers += updatedCallers;

                LOG.log(java.util.logging.Level.INFO,
                        "Backfilled market cap for contract {0}: {1} (updated {2} caller records)",
                        new Object[] { contractAddress, marketCap, updatedCallers });
            } else {
                LOG.log(java.util.logging.Level.WARNING, "Could not fetch market cap during backfill for contract: {0}",
                        contractAddress);
            }
        }

        LOG.log(java.util.logging.Level.INFO, "Completed backfill: updated {0} contracts and {1} caller records",
                new Object[] { totalUpdatedContracts, totalUpdatedCallers });
    }

    /**
     * Finds a trench contract by its address.
     *
     * @param contractAddress The contract address to search for
     * @return The TrenchContract if found, null otherwise
     */
    public TrenchContract findByContract(String contractAddress) {
        return TrenchContract.find("contract", contractAddress).firstResult();
    }
}
