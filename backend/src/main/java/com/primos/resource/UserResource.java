package com.primos.resource;

import java.util.logging.Logger;

import com.primos.model.User;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/user")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    private static final Logger LOGGER = Logger.getLogger(UserResource.class.getName());
    private static final String PUBLIC_KEY_FIELD = "publicKey";

    @POST
    @Path("/login")
    public User login(LoginRequest req) {
        validateLoginRequest(req);

        boolean holder = req.primoHolder;

        User user = User.find(PUBLIC_KEY_FIELD, req.publicKey)
                .firstResult();
        if (user == null) {
            validateBetaCodeOrThrow(req.betaCode);
            user = createNewUser(req.publicKey, holder);
            user.setBetaRedeemed(true);
            user.persist();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] Created new user for publicKey: %s", req.publicKey));
            }
        } else {
            updateHolderStatus(user, holder);
            if (!user.isBetaRedeemed() && req.betaCode != null && !req.betaCode.isEmpty()) {
                validateBetaCodeOrThrow(req.betaCode);
                user.setBetaRedeemed(true);
            }
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] User already exists for publicKey: %s", req.publicKey));
            }
        }
        user.persistOrUpdate();
        return user;
    }

    private void validateLoginRequest(LoginRequest req) {
        if (req == null || req.publicKey == null || req.publicKey.isEmpty()) {
            LOGGER.info("[UserResource] Login attempt with missing publicKey");
            throw new jakarta.ws.rs.BadRequestException("publicKey is required");
        }
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[UserResource] Login attempt for publicKey: %s", req.publicKey));
        }
    }

    private void validateBetaCodeOrThrow(String betaCode) {
        if (betaCode == null || betaCode.isEmpty()) {
            LOGGER.info("[UserResource] Missing beta code for new user");
            throw new ForbiddenException();
        }
        com.primos.model.BetaCode beta = io.quarkus.mongodb.panache.PanacheMongoEntityBase
                .find("code", betaCode).firstResult();
        if (beta == null) {
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] Invalid beta code: %s", betaCode));
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

    @GET
    @Path("/{publicKey}")
    public User getUser(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey) {
        if (walletKey == null || walletKey.isEmpty()) {
            throw new ForbiddenException();
        }
        User user = User.find(PUBLIC_KEY_FIELD, publicKey).firstResult();
        if (user == null)
            throw new NotFoundException();
        return user;
    }

    @PUT
    @Path("/{publicKey}/pfp")
    @Consumes(MediaType.TEXT_PLAIN)
    public User updatePfp(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey,
            String pfpUrl) {
        if (walletKey == null || !walletKey.equals(publicKey)) {
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null) {
            user.setPfp(pfpUrl);
            user.persistOrUpdate();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] Updated PFP for publicKey: %s to %s", publicKey, pfpUrl));
            }
        }
        return user;
    }

    @PUT
    @Path("/{publicKey}")
    public User updateProfile(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey,
            User updated) {
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
            user.persistOrUpdate();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] Updated profile for %s", publicKey));
            }
        }
        return user;
    }

    @POST
    @Path("/{publicKey}/points")
    @Consumes(MediaType.APPLICATION_JSON) // Explicitly expect JSON, even if body is empty
    public User addPoint(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey) {
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[addPoint] Called for publicKey: %s with walletKey: %s", publicKey, walletKey));
        }
        if (walletKey == null || !walletKey.equals(publicKey)) {
            LOGGER.warning("[addPoint] Forbidden: walletKey missing or does not match publicKey");
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) {
            if (LOGGER.isLoggable(java.util.logging.Level.WARNING)) {
                LOGGER.warning(String.format("[addPoint] User not found for publicKey: %s", publicKey));
            }
            throw new NotFoundException();
        }
        String today = java.time.LocalDate.now().toString();
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[addPoint] User %s, today: %s, user.pointsDate: %s, user.pointsToday: %d",
                    publicKey, today, user.getPointsDate(), user.getPointsToday()));
        }
        if (!today.equals(user.getPointsDate())) {
            user.setPointsDate(today);
            user.setPointsToday(0);
            LOGGER.info("[addPoint] Reset pointsToday for new day");
        }
        if (user.getPointsToday() >= 4) {
            if (LOGGER.isLoggable(java.util.logging.Level.WARNING)) {
                LOGGER.warning(String.format("[addPoint] Daily limit reached for user: %s", publicKey));
            }
            throw new jakarta.ws.rs.BadRequestException("Daily limit reached");
        }
        user.setPoints(user.getPoints() + 1);
        user.setPointsToday(user.getPointsToday() + 1);
        user.persistOrUpdate();
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[addPoint] Updated points: %d, pointsToday: %d for user: %s",
                    user.getPoints(), user.getPointsToday(), publicKey));
        }
        return user;
    }

    @GET
    @Path("/primos")
    public java.util.List<User> getDaoMembers(@HeaderParam("X-Public-Key") String walletKey) {
        if (walletKey == null || walletKey.isEmpty()) {
            throw new ForbiddenException();
        }
        return User.list("primoHolder", true);
    }

}
