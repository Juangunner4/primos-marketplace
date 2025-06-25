package com.primos.service;

import java.util.logging.Logger;

import com.primos.model.BetaCode;
import com.primos.model.User;
import com.primos.resource.AdminResource;
import com.primos.resource.LoginRequest;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class LoginService {
    private static final Logger LOGGER = Logger.getLogger(LoginService.class.getName());
    private static final String PUBLIC_KEY_FIELD = "publicKey";
    private static final String ADMIN_WALLET = AdminResource.ADMIN_WALLET;

    public User login(LoginRequest req) {
        validateLoginRequest(req);

        boolean holder = req.primoHolder;
        boolean isAdminWallet = ADMIN_WALLET.equals(req.publicKey);

        User user = User.find(PUBLIC_KEY_FIELD, req.publicKey)
                .firstResult();
        if (user == null) {
            if (!isAdminWallet) {
                validateBetaCodeOrThrow(req.betaCode);
            }
            user = createNewUser(req.publicKey, holder);
            user.setBetaRedeemed(true);
            user.persist();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] Created new user for publicKey: %s", req.publicKey));
            }
        } else {
            updateHolderStatus(user, holder);
            if (isAdminWallet) {
                user.setBetaRedeemed(true);
            } else if (!user.isBetaRedeemed() && req.betaCode != null && !req.betaCode.isEmpty()) {
                validateBetaCodeOrThrow(req.betaCode);
                user.setBetaRedeemed(true);
            }
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] User already exists for publicKey: %s", req.publicKey));
            }
        }
        user.persistOrUpdate();
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            if (user.isPrimoHolder()) {
                LOGGER.info(String.format("[LoginService] Primo holder login for publicKey: %s", req.publicKey));
            } else {
                LOGGER.info(String.format("[LoginService] Non-primo login for publicKey: %s", req.publicKey));
            }
        }
        return user;
    }

    private void validateLoginRequest(LoginRequest req) {
        if (req == null || req.publicKey == null || req.publicKey.isEmpty()) {
            LOGGER.info("[LoginService] Login attempt with missing publicKey");
            throw new BadRequestException("publicKey is required");
        }
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[LoginService] Login attempt for publicKey: %s", req.publicKey));
        }
    }

    private void validateBetaCodeOrThrow(String betaCode) {
        if (betaCode == null || betaCode.isEmpty()) {
            LOGGER.info("[LoginService] Missing beta code for new user");
            throw new ForbiddenException();
        }
        BetaCode beta = BetaCode.find("code", betaCode).firstResult();
        if (beta == null) {
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] Invalid beta code: %s", betaCode));
            }
            throw new ForbiddenException();
        }
        beta.delete();
    }

    private User createNewUser(String publicKey, boolean holder) {
        User user = new User();
        user.setPublicKey(publicKey);
        user.setBio("");
        user.setSocials(new User.SocialLinks());
        user.setPfp("");
        user.setPoints(0);
        user.setPesos(1000);
        user.setCreatedAt(System.currentTimeMillis());
        user.setDaoMember(holder);
        user.setPrimoHolder(holder);
        user.persist();
        return user;
    }

    private void updateHolderStatus(User user, boolean holder) {
        user.setPrimoHolder(holder);
        if (holder && !user.isDaoMember()) {
            user.setDaoMember(true);
        }
        if (!holder && user.isDaoMember()) {
            user.setDaoMember(false);
        }
        user.persistOrUpdate();
    }
}
