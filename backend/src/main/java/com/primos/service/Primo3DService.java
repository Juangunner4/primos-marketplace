package com.primos.service;

import com.primos.model.Primo3D;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class Primo3DService {
    public Primo3D create(Primo3D primo) {
        Primo3D existing = Primo3D.find("tokenAddress", primo.getTokenAddress()).firstResult();
        if (existing != null) {
            return existing;
        }
        primo.persist();
        return primo;
    }
}
