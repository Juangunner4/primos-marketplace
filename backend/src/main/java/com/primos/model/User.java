package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "primo")
public class User extends PanacheMongoEntity {
    private String publicKey;
    private String bio;
    private SocialLinks socials = new SocialLinks();
    private String pfp;
    private String domain = "";
    private int points = 0;
    private int pointsToday = 0;
    private String pointsDate = java.time.LocalDate.now().toString();
    private int nftCount = 0;
    private int pesos = 1;
    private boolean primoHolder = false;
    private boolean daoMember = true;
    private boolean artTeam = false;
    private java.util.List<String> workGroups = new java.util.ArrayList<>();
    private String betaCode;
    private boolean betaRedeemed = false;
    private long createdAt = System.currentTimeMillis();

    // Getters and Setters
    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public SocialLinks getSocials() {
        return socials;
    }

    public void setSocials(SocialLinks socials) {
        this.socials = socials;
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

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public int getPointsToday() {
        return pointsToday;
    }

    public void setPointsToday(int pointsToday) {
        this.pointsToday = pointsToday;
    }

    public String getPointsDate() {
        return pointsDate;
    }

    public void setPointsDate(String pointsDate) {
        this.pointsDate = pointsDate;
    }

    public int getNftCount() {
        return nftCount;
    }

    public void setNftCount(int nftCount) {
        this.nftCount = nftCount;
    }

    public int getPesos() {
        return pesos;
    }

    public void setPesos(int pesos) {
        this.pesos = pesos;
    }

    public boolean isPrimoHolder() {
        return primoHolder;
    }

    public void setPrimoHolder(boolean primoHolder) {
        this.primoHolder = primoHolder;
    }

    public boolean isDaoMember() {
        return daoMember;
    }

    public void setDaoMember(boolean daoMember) {
        this.daoMember = daoMember;
    }

    public boolean isArtTeam() {
        return artTeam;
    }

    public void setArtTeam(boolean artTeam) {
        this.artTeam = artTeam;
    }

    public java.util.List<String> getWorkGroups() {
        return workGroups;
    }

    public void setWorkGroups(java.util.List<String> workGroups) {
        this.workGroups = workGroups;
    }

    public String getBetaCode() {
        return betaCode;
    }

    public void setBetaCode(String betaCode) {
        this.betaCode = betaCode;
    }

    public boolean isBetaRedeemed() {
        return betaRedeemed;
    }

    public void setBetaRedeemed(boolean betaRedeemed) {
        this.betaRedeemed = betaRedeemed;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public static class SocialLinks {
        private String twitter = "";
        private String discord = "";
        private String website = "";

        public String getTwitter() {
            return twitter;
        }

        public void setTwitter(String twitter) {
            this.twitter = twitter;
        }

        public String getDiscord() {
            return discord;
        }

        public void setDiscord(String discord) {
            this.discord = discord;
        }

        public String getWebsite() {
            return website;
        }

        public void setWebsite(String website) {
            this.website = website;
        }
    }
}
