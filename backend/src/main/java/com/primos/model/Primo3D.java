package com.primos.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "primos3D")
public class Primo3D extends PanacheMongoEntity {
    private String tokenAddress;
    private String name;
    private String image;
    private String stlUrl;

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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getStlUrl() {
        return stlUrl;
    }

    public void setStlUrl(String stlUrl) {
        this.stlUrl = stlUrl;
    }
}
