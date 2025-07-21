package com.primos.model;

public class TelegramData {
    private String tokenAddress;
    private Double priceUsd;
    private Double fdvUsd;
    private Double volume24hUsd;
    private Double change1hPercent;

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
}
