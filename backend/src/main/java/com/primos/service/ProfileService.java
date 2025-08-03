package com.primos.service;

import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class ProfileService {

    public User updateProfile(String publicKey, String walletKey, User updated) {
        if (walletKey == null || !walletKey.equals(publicKey)) {
            throw new ForbiddenException();
        }
        if (updated == null || !publicKey.equals(updated.getPublicKey())) {
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null) {
            user.setBio(updated.getBio());
            if (updated.getSocials() != null) {
                user.setSocials(updated.getSocials());
            }
            if (updated.getDomain() != null) {
                String lower = updated.getDomain().toLowerCase();
                User taken = User.find("domain", lower).firstResult();
                if (taken != null && !publicKey.equals(taken.getPublicKey())) {
                    throw new jakarta.ws.rs.BadRequestException();
                }
                user.setDomain(lower);
                if (lower.endsWith(".sol")) {
                    user.addBadge("sns");
                }
            }
            if (updated.getWorkGroups() != null) {
                user.setWorkGroups(updated.getWorkGroups());
                user.setArtTeam(updated.getWorkGroups().contains("art"));
            } else {
                user.setArtTeam(updated.isArtTeam());
            }
            user.persistOrUpdate();
        }
        return user;
    }
}
