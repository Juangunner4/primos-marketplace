package com.primos.model;

import java.util.List;
import java.util.Map;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "primoTokens")
public class PrimoToken extends PanacheMongoEntity {
    private String contract;
    private int holderCount;
    private long updatedAt;
    private List<String> holders; // List of wallet addresses holding this token
    private List<HolderInfo> holderDetails; // Detailed information about holders including PFP
    private List<Map<String, Object>> tradingViewCharts; // TradingView chart data for CEX listings
    private Double priceChange24h; // 24h price change percentage
    private Double marketCap; // Market capitalization
    private String name; // Token name
    private String symbol; // Token symbol
    private String image; // Token image URL

    // Inner class for holder information
    public static class HolderInfo {
        private String publicKey;
        private String pfp;
        private String domain;
        private boolean isPrimo;

        public HolderInfo() {
        }

        public HolderInfo(String publicKey, String pfp, String domain, boolean isPrimo) {
            this.publicKey = publicKey;
            this.pfp = pfp;
            this.domain = domain;
            this.isPrimo = isPrimo;
        }

        public String getPublicKey() {
            return publicKey;
        }

        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }

        public String getPfp() {
            return pfp;
        }

        public void setPfp(String pfp) {
            this.pfp = pfp;
        }

        public String getDomain() {
            return domain;
        }

        public void setDomain(String domain) {
            this.domain = domain;
        }

        public boolean isPrimo() {
            return isPrimo;
        }

        public void setPrimo(boolean isPrimo) {
            this.isPrimo = isPrimo;
        }
    }

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

    public List<String> getHolders() {
        return holders;
    }

    public void setHolders(List<String> holders) {
        this.holders = holders;
    }

    public List<HolderInfo> getHolderDetails() {
        return holderDetails;
    }

    public void setHolderDetails(List<HolderInfo> holderDetails) {
        this.holderDetails = holderDetails;
    }

    public List<Map<String, Object>> getTradingViewCharts() {
        return tradingViewCharts;
    }

    public void setTradingViewCharts(List<Map<String, Object>> tradingViewCharts) {
        this.tradingViewCharts = tradingViewCharts;
    }

    public Double getPriceChange24h() {
        return priceChange24h;
    }

    public void setPriceChange24h(Double priceChange24h) {
        this.priceChange24h = priceChange24h;
    }

    public Double getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(Double marketCap) {
        this.marketCap = marketCap;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
