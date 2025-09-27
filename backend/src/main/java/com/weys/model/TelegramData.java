package com.weys.model;

public class TelegramData {
    private String tokenAddress;
    private Double priceUsd;
    private Double fdvUsd;
    private Double volume24hUsd;
    private Double change1hPercent;
    // First ticker info
    private String tickerBase;
    private String tickerTarget;
    private String tickerMarketName;
    private String tickerMarketIdentifier;
    private Boolean hasTradingIncentive;
    // Comma-separated percentages of top token holders
    private String topHolderPercentages;
    // On-chain market cap from simple API
    private Double marketCap;
    // Number of unique holders
    private Integer holders;
    // Number of buys in last 24h
    private Integer buys24h;

    public String getTokenAddress() {
        return tokenAddress;
    }

    public void setTokenAddress(String tokenAddress) {
        this.tokenAddress = tokenAddress;
    }

    public Double getPriceUsd() {
        return priceUsd;
    }

    public void setPriceUsd(Double priceUsd) {
        this.priceUsd = priceUsd;
    }

    public Double getFdvUsd() {
        return fdvUsd;
    }

    public void setFdvUsd(Double fdvUsd) {
        this.fdvUsd = fdvUsd;
    }

    public Double getVolume24hUsd() {
        return volume24hUsd;
    }

    public void setVolume24hUsd(Double volume24hUsd) {
        this.volume24hUsd = volume24hUsd;
    }

    public Double getChange1hPercent() {
        return change1hPercent;
    }

    public void setChange1hPercent(Double change1hPercent) {
        this.change1hPercent = change1hPercent;
    }

    public String getTickerBase() {
        return tickerBase;
    }

    public void setTickerBase(String tickerBase) {
        this.tickerBase = tickerBase;
    }

    public String getTickerTarget() {
        return tickerTarget;
    }

    public void setTickerTarget(String tickerTarget) {
        this.tickerTarget = tickerTarget;
    }

    public String getTickerMarketName() {
        return tickerMarketName;
    }

    public void setTickerMarketName(String tickerMarketName) {
        this.tickerMarketName = tickerMarketName;
    }

    public String getTickerMarketIdentifier() {
        return tickerMarketIdentifier;
    }

    public void setTickerMarketIdentifier(String tickerMarketIdentifier) {
        this.tickerMarketIdentifier = tickerMarketIdentifier;
    }

    public Boolean getHasTradingIncentive() {
        return hasTradingIncentive;
    }

    public void setHasTradingIncentive(Boolean hasTradingIncentive) {
        this.hasTradingIncentive = hasTradingIncentive;
    }

    public String getTopHolderPercentages() {
        return topHolderPercentages;
    }

    public void setTopHolderPercentages(String topHolderPercentages) {
        this.topHolderPercentages = topHolderPercentages;
    }

    public Double getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(Double marketCap) {
        this.marketCap = marketCap;
    }

    public Integer getHolders() {
        return holders;
    }

    public void setHolders(Integer holders) {
        this.holders = holders;
    }

    public Integer getBuys24h() {
        return buys24h;
    }

    public void setBuys24h(Integer buys24h) {
        this.buys24h = buys24h;
    }
}
