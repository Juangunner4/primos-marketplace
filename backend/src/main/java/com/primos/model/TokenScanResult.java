package com.primos.model;

import org.bson.codecs.pojo.annotations.BsonDiscriminator;
import org.bson.codecs.pojo.annotations.BsonId;

import java.time.Instant;

@BsonDiscriminator
public class TokenScanResult {
    @BsonId
    private String tokenAddress;
    private String name;
    private String symbol;
    private Boolean mintAuthorityRevoked;
    private Boolean freezeAuthorityRevoked;
    private Boolean lpBurned;
    private Double liquidityUSD;
    private Double volume24h;
    private Integer holders;
    private Boolean isVerifiedPrimos;
    private Boolean daoEligible;
    private Integer riskScore;
    private String honeypotRisk;
    private Instant scanTimestamp;

    public String getTokenAddress() {
        return tokenAddress;
    }

    public void setTokenAddress(String tokenAddress) {
        this.tokenAddress = tokenAddress;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Boolean getMintAuthorityRevoked() {
        return mintAuthorityRevoked;
    }

    public void setMintAuthorityRevoked(Boolean mintAuthorityRevoked) {
        this.mintAuthorityRevoked = mintAuthorityRevoked;
    }

    public Boolean getFreezeAuthorityRevoked() {
        return freezeAuthorityRevoked;
    }

    public void setFreezeAuthorityRevoked(Boolean freezeAuthorityRevoked) {
        this.freezeAuthorityRevoked = freezeAuthorityRevoked;
    }

    public Boolean getLpBurned() {
        return lpBurned;
    }

    public void setLpBurned(Boolean lpBurned) {
        this.lpBurned = lpBurned;
    }

    public Double getLiquidityUSD() {
        return liquidityUSD;
    }

    public void setLiquidityUSD(Double liquidityUSD) {
        this.liquidityUSD = liquidityUSD;
    }

    public Double getVolume24h() {
        return volume24h;
    }

    public void setVolume24h(Double volume24h) {
        this.volume24h = volume24h;
    }

    public Integer getHolders() {
        return holders;
    }

    public void setHolders(Integer holders) {
        this.holders = holders;
    }

    public Boolean getIsVerifiedPrimos() {
        return isVerifiedPrimos;
    }

    public void setIsVerifiedPrimos(Boolean isVerifiedPrimos) {
        this.isVerifiedPrimos = isVerifiedPrimos;
    }

    public Boolean getDaoEligible() {
        return daoEligible;
    }

    public void setDaoEligible(Boolean daoEligible) {
        this.daoEligible = daoEligible;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getHoneypotRisk() {
        return honeypotRisk;
    }

    public void setHoneypotRisk(String honeypotRisk) {
        this.honeypotRisk = honeypotRisk;
    }

    public Instant getScanTimestamp() {
        return scanTimestamp;
    }

    public void setScanTimestamp(Instant scanTimestamp) {
        this.scanTimestamp = scanTimestamp;
    }
}
