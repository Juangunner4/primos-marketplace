package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "workrequests")
public class WorkRequest extends PanacheMongoEntity {
    private String requester;
    private String description;
    private long createdAt = System.currentTimeMillis();

    public String getRequester() { return requester; }
    public void setRequester(String requester) { this.requester = requester; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
