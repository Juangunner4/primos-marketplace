package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

@MongoEntity(collection = "workrequests")
public class WorkRequest extends PanacheMongoEntity {
    private String requester;
    private String worker;
    private String group;
    private String description;
    private long createdAt = System.currentTimeMillis();

    public String getRequester() { return requester; }
    public void setRequester(String requester) { this.requester = requester; }

    public String getWorker() { return worker; }
    public void setWorker(String worker) { this.worker = worker; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGroup() { return group; }
    public void setGroup(String group) { this.group = group; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public ObjectId getId() { return id; }
}
