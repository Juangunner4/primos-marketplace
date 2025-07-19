package com.primos.service;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.primos.model.TokenScanResult;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class TokenScanService {

    @Inject
    MongoClient mongoClient;

    private MongoCollection<TokenScanResult> collection;

    @PostConstruct
    void init() {
        MongoDatabase db = mongoClient.getDatabase("primos-db");
        collection = db.getCollection("token_scans", TokenScanResult.class);
        collection.createIndex(Indexes.ascending("scanTimestamp"),
                new IndexOptions().expireAfter(3L, TimeUnit.DAYS));
    }

    public TokenScanResult scanToken(String tokenAddress) {
        TokenScanResult existing = collection.find(Filters.eq("_id", tokenAddress)).first();
        if (existing != null) {
            return existing;
        }
        TokenScanResult result = ExternalScanLogic.performScan(tokenAddress);
        collection.insertOne(result);
        return result;
    }
}
