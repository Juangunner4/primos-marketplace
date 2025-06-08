package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection="primo")
public class User extends PanacheMongoEntity {
    private String publicKey;
    private String bio;
    private SocialLinks socials = new SocialLinks();
    private String pfp;
    private int points = 0;
    private int pesos = 1000;
    private boolean primoHolder = false;
    private long createdAt = System.currentTimeMillis();

    // Getters and Setters
    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public SocialLinks getSocials() { return socials; }
    public void setSocials(SocialLinks socials) { this.socials = socials; }

    public String getPfp() { return pfp; }
    public void setPfp(String pfp) { this.pfp = pfp; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public int getPesos() { return pesos; }
    public void setPesos(int pesos) { this.pesos = pesos; }

    public boolean isPrimoHolder() { return primoHolder; }
    public void setPrimoHolder(boolean primoHolder) { this.primoHolder = primoHolder; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public static class SocialLinks {
        private String twitter = "";
        private String discord = "";
        private String website = "";

        public String getTwitter() { return twitter; }
        public void setTwitter(String twitter) { this.twitter = twitter; }

        public String getDiscord() { return discord; }
        public void setDiscord(String discord) { this.discord = discord; }

        public String getWebsite() { return website; }
        public void setWebsite(String website) { this.website = website; }
    }
}
