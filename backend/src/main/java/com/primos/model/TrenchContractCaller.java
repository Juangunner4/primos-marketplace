package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "trench_contract_callers")
public class TrenchContractCaller extends PanacheMongoEntity {
    private String contract;
    private String caller;
    private Long calledAt;
    private Double marketCapAtCall;
    private String domainAtCall;

    public String getContract() {
        return contract;
    }

    public void setContract(String contract) {
        this.contract = contract;
    }

    public String getCaller() {
        return caller;
    }

    public void setCaller(String caller) {
        this.caller = caller;
    }

    public Long getCalledAt() {
        return calledAt;
    }

    public void setCalledAt(Long calledAt) {
        this.calledAt = calledAt;
    }

    public Double getMarketCapAtCall() {
        return marketCapAtCall;
    }

    public void setMarketCapAtCall(Double marketCapAtCall) {
        this.marketCapAtCall = marketCapAtCall;
    }

    public String getDomainAtCall() {
        return domainAtCall;
    }

    public void setDomainAtCall(String domainAtCall) {
        this.domainAtCall = domainAtCall;
    }
}
