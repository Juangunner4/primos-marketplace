package com.weys.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.weys.model.TrenchContract;
import com.weys.model.TrenchContractCaller;
import com.weys.model.TrenchUser;

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
