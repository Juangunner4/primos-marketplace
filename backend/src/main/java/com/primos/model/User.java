package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection="primo")
public class User extends PanacheMongoEntity {
    public String publicKey;
    public String bio;
    public SocialLinks socials = new SocialLinks();
    public String pfp;
    public int points = 0;
    public int pesos = 1000;
    public long createdAt = System.currentTimeMillis();

    public static class SocialLinks {
        public String twitter = "";
        public String discord = "";
        public String website = "";
    }
}
