package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection="member_stats")
public class MemberStats extends PanacheMongoEntity {
    private String publicKey;
    private int count;
    private long updatedAt;

    public MemberStats() {}

    public MemberStats(String publicKey, int count, long updatedAt) {
        this.publicKey = publicKey;
        this.count = count;
        this.updatedAt = updatedAt;
    }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
