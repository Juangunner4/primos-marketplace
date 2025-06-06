package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import org.bson.types.ObjectId;

public class User extends PanacheMongoEntity {
    public String publicKey;
    public String bio;
    public SocialLinks socials = new SocialLinks();
    public String pfp;
    public int points;
    public int pesos;
    public long createdAt;

    public static class SocialLinks {
        public String twitter = "";
        public String discord = "";
        public String website = "";
    }
}
