package com.primos.service;

import java.util.ArrayList;
import java.util.List;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;

@ApplicationScoped
public class TrenchService {
    private static final long MIN_SUBMIT_INTERVAL_MS = 60_000; // 1 minute cooldown

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
            java.util.List<String> list = tu.getContracts();
            if (list != null && list.contains(contract)) {
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
            Double marketCap = coinGeckoService.fetchMarketCap(contract);
            tc.setFirstCallerMarketCap(marketCap);
            tc.setFirstCallerDomain(domain);
            tc.persist();
        } else {
            tc.setCount(tc.getCount() + 1);
            tc.persistOrUpdate();
        }

        if (tu == null) {
            tu = new TrenchUser();
            tu.setPublicKey(publicKey);
            tu.setCount(1);
            java.util.List<String> list = new ArrayList<>();
            list.add(contract);
            tu.setContracts(list);
            tu.setLastSubmittedAt(now);
            tu.persist();
        } else {
            tu.setCount(tu.getCount() + 1);
            java.util.List<String> list = tu.getContracts();
            if (list == null)
                list = new ArrayList<>();
            list.add(contract);
            tu.setContracts(list);
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
        List<TrenchContract> contracts = TrenchContract.listAll();
        for (TrenchContract tc : contracts) {
            if (tc.getFirstCallerMarketCap() == null) {
                Double marketCap = coinGeckoService.fetchMarketCap(tc.getContract());
                if (marketCap != null) {
                    tc.setFirstCallerMarketCap(marketCap);
                    tc.persistOrUpdate();
                }
            }
        }
        return contracts;
    }

    public List<TrenchUser> getUsers() {
        return TrenchUser.listAll();
    }
}
