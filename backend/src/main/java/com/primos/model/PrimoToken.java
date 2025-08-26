package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "primoTokens")
public class PrimoToken extends PanacheMongoEntity {
    private String contract;
    private int holderCount;
    private long updatedAt;

    public String getContract() {
        return contract;
    }

    public void setContract(String contract) {
        this.contract = contract;
    }

    public int getHolderCount() {
        return holderCount;
    }

    public void setHolderCount(int holderCount) {
        this.holderCount = holderCount;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}

