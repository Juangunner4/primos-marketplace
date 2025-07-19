package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "trenchUsers")
public class TrenchUser extends PanacheMongoEntity {
    private String publicKey;
    private int count;
    private long lastSubmittedAt;

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public long getLastSubmittedAt() {
        return lastSubmittedAt;
    }

    public void setLastSubmittedAt(long lastSubmittedAt) {
        this.lastSubmittedAt = lastSubmittedAt;
    }
}
