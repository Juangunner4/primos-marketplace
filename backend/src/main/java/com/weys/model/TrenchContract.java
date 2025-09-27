package com.weys.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "trenches")
public class TrenchContract extends PanacheMongoEntity {
    private String contract;
    private int count;
    private String source;
    private String model;
    private String firstCaller;
    private Long firstCallerAt;
    private Double firstCallerMarketCap;
    private String firstCallerDomain;

    public String getContract() {
        return contract;
    }

    public void setContract(String contract) {
        this.contract = contract;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getFirstCaller() {
        return firstCaller;
    }

    public void setFirstCaller(String firstCaller) {
        this.firstCaller = firstCaller;
    }

    public Long getFirstCallerAt() {
        return firstCallerAt;
    }

    public void setFirstCallerAt(Long firstCallerAt) {
        this.firstCallerAt = firstCallerAt;
    }

    public Double getFirstCallerMarketCap() {
        return firstCallerMarketCap;
    }

    public void setFirstCallerMarketCap(Double firstCallerMarketCap) {
        this.firstCallerMarketCap = firstCallerMarketCap;
    }

    public String getFirstCallerDomain() {
        return firstCallerDomain;
    }

    public void setFirstCallerDomain(String firstCallerDomain) {
        this.firstCallerDomain = firstCallerDomain;
    }
}
