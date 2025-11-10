package com.primos.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.primos.model.TrenchContract;
import com.primos.model.TrenchContractCaller;
import com.primos.model.TrenchUser;

@ApplicationScoped
public class TrenchIndexesInitializer {

    @PostConstruct
    void initIndexes() {
        TrenchContract.mongoCollection()
                .createIndex(Indexes.ascending("contract"), new IndexOptions().unique(true));
        TrenchUser.mongoCollection()
                .createIndex(Indexes.ascending("publicKey"), new IndexOptions().unique(true));
        TrenchContractCaller.mongoCollection()
                .createIndex(Indexes.compoundIndex(Indexes.ascending("contract"), Indexes.descending("calledAt")));
        TrenchContractCaller.mongoCollection()
                .createIndex(Indexes.ascending("caller"));
    }
}
