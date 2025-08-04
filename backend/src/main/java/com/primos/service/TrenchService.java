package com.primos.service;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import com.primos.model.User;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.ArrayList;
import jakarta.ws.rs.BadRequestException;

@ApplicationScoped
public class TrenchService {
    private static final long MIN_SUBMIT_INTERVAL_MS = 60_000; // 1 minute cooldown
    public void add(String publicKey, String contract, String source, String model) {
        TrenchContract tc = TrenchContract.find("contract", contract).firstResult();
        if (tc == null) {
            tc = new TrenchContract();
            tc.setContract(contract);
            tc.setCount(1);
            tc.setSource(source);
            tc.setModel(model);
            tc.setFirstCaller(publicKey);
            tc.persist();
        } else {
            tc.setCount(tc.getCount() + 1);
            tc.persistOrUpdate();
        }

        TrenchUser tu = TrenchUser.find("publicKey", publicKey).firstResult();
        long now = System.currentTimeMillis();
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
            long since = now - tu.getLastSubmittedAt();
            if (since < MIN_SUBMIT_INTERVAL_MS) {
                throw new BadRequestException();
            }
            tu.setCount(tu.getCount() + 1);
            java.util.List<String> list = tu.getContracts();
            if (list == null) list = new ArrayList<>();
            if (!list.contains(contract)) {
                list.add(contract);
            }
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
        return TrenchContract.listAll();
    }

    public List<TrenchUser> getUsers() {
        return TrenchUser.listAll();
    }
}
