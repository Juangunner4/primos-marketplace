package com.primos.service;

import java.util.logging.Logger;

import com.primos.model.BetaCode;
import com.primos.model.User;
import com.primos.resource.AdminResource;
import com.primos.resource.LoginRequest;

import jakarta.inject.Inject;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class LoginService {
    private static final Logger LOGGER = Logger.getLogger(LoginService.class.getName());
    private static final String PUBLIC_KEY_FIELD = "publicKey";
    private static final String ADMIN_WALLET = AdminResource.ADMIN_WALLET;

    @Inject
    HeliusService heliusService;

    public User login(LoginRequest req) {
        validateLoginRequest(req);

        boolean holder = req.primoHolder;
        boolean isAdminWallet = ADMIN_WALLET.equals(req.publicKey);
        // Admin wallet bypass: always created and logged in without beta code
        if (isAdminWallet) {
            User adminUser = User.find(PUBLIC_KEY_FIELD, req.publicKey).firstResult();
            if (adminUser == null) {
                adminUser = createNewUser(req.publicKey, true);
                adminUser.setBetaRedeemed(true);
            } else {
                adminUser.setBetaRedeemed(true);
            }
            adminUser.persistOrUpdate();
            return adminUser;
        }

        User user = User.find(PUBLIC_KEY_FIELD, req.publicKey)
                .firstResult();
        if (user == null) {
            validateBetaCodeOrThrow(req.betaCode);
            // If beta code was provided, treat user as primo holder
            boolean newHolder = holder || (req.betaCode != null && !req.betaCode.isEmpty());
            user = createNewUser(req.publicKey, newHolder);
            user.setBetaRedeemed(true);
            if (req.betaCode != null && !req.betaCode.isEmpty()) {
                user.setBetaCode(req.betaCode);
            }
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] Created new user for publicKey: %s", req.publicKey));
            }
        } else {
            updateHolderStatus(user, holder);
            if (!user.isBetaRedeemed() && req.betaCode != null && !req.betaCode.isEmpty()) {
                // Redeemed a beta code: grant betaRedeemed, primoHolder, and store code
                validateBetaCodeOrThrow(req.betaCode);
                user.setBetaRedeemed(true);
                user.setPrimoHolder(true);
                user.setBetaCode(req.betaCode);
            }
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] User already exists for publicKey: %s", req.publicKey));
            }
        }
        user.persistOrUpdate();

        // Update NFT count from the blockchain on each login
        int count = heliusService.getPrimoCount(user.getPublicKey());
        user.setNftCount(count);
        updateHolderStatus(user, count > 0);

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
        // Mark beta code as redeemed
        beta.setRedeemed(true);
        beta.persistOrUpdate();
    }

    private User createNewUser(String publicKey, boolean holder) {
        User user = new User();
        user.setPublicKey(publicKey);
        user.setBio("");
        user.setSocials(new User.SocialLinks());
        user.setPfp("");
        user.setDomain("");
        user.setPoints(0);
        user.setPesos(1);
        user.setCreatedAt(System.currentTimeMillis());
        user.setDaoMember(holder);
        user.setPrimoHolder(holder);
        user.setArtTeam(false);
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
