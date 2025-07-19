package com.primos.service;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class TrenchService {
    public void add(String publicKey, String contract) {
        TrenchContract tc = TrenchContract.find("contract", contract).firstResult();
        if (tc == null) {
            tc = new TrenchContract();
            tc.setContract(contract);
            tc.setCount(1);
            tc.persist();
        } else {
            tc.setCount(tc.getCount() + 1);
            tc.persistOrUpdate();
        }

        TrenchUser tu = TrenchUser.find("publicKey", publicKey).firstResult();
        if (tu == null) {
            tu = new TrenchUser();
            tu.setPublicKey(publicKey);
            tu.setCount(1);
            tu.persist();
        } else {
            tu.setCount(tu.getCount() + 1);
            tu.persistOrUpdate();
        }
    }

    public List<TrenchContract> getContracts() {
        return TrenchContract.listAll();
    }

    public List<TrenchUser> getUsers() {
        return TrenchUser.listAll();
    }
}
