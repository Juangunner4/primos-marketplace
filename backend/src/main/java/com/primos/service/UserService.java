package com.primos.service;

import java.util.List;

import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class UserService {

    public User getUser(String publicKey, String walletKey) {
        if (walletKey == null || walletKey.isEmpty()) {
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) {
            throw new NotFoundException();
        }
        return user;
    }

    public List<User> getDaoMembers(String walletKey) {
        if (walletKey == null || walletKey.isEmpty()) {
            throw new ForbiddenException();
        }
        return User.list("primoHolder", true);
    }

    public User getByDomain(String domain) {
        if (domain == null || domain.isEmpty()) {
            throw new NotFoundException();
        }
        return User.find("domain", domain.toLowerCase()).firstResult();
    }
}
