package com.weys.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

@MongoEntity(collection = "transactions")
public class Transaction extends PanacheMongoEntity {
    private String txId;
    private String buyer;
    private String seller;
    private String mint;
    private Double price;
    private String collection;
    private String source;
    private String timestamp;
    private String status;
    private Double solSpent;

    /**
     * Expose the MongoDB generated identifier so tests can verify the
     * entity was persisted correctly. PanacheMongoEntity provides the
     * {@code id} field but not a getter, so we add one here.
     */
    public ObjectId getId() {
        return id;
    }

    public String getTxId() {
        return txId;
    }

    public void setTxId(String txId) {
        this.txId = txId;
    }

    public String getBuyer() {
        return buyer;
    }

    public void setBuyer(String buyer) {
        this.buyer = buyer;
    }

    public String getSeller() {
        return seller;
    }

    public void setSeller(String seller) {
        this.seller = seller;
    }

    public String getMint() {
        return mint;
    }

    public void setMint(String mint) {
        this.mint = mint;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getCollection() {
        return collection;
    }

    public void setCollection(String collection) {
        this.collection = collection;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getSolSpent() {
        return solSpent;
    }

    public void setSolSpent(Double solSpent) {
        this.solSpent = solSpent;
    }
}
