package com.weys.service;

import com.weys.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class PfpService {
    public User updatePfp(String publicKey, String walletKey, String pfpUrl) {
        if (walletKey == null || !walletKey.equals(publicKey)) {
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null) {
            user.setPfp(pfpUrl);
            user.persistOrUpdate();
        }
        return user;
    }
}
