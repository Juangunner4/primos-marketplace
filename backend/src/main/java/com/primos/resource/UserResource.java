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
        if (req == null || req.publicKey == null || req.publicKey.isEmpty()) {
            LOGGER.info("[UserResource] Login attempt with missing publicKey");
            throw new jakarta.ws.rs.BadRequestException("publicKey is required");
        }
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[UserResource] Login attempt for publicKey: %s", req.publicKey));
        }

        // The frontend provides the Primo holder status
        boolean holder = req.primoHolder;

        User user = User.find(PUBLIC_KEY_FIELD, req.publicKey).firstResult();
        if (user == null) {
            user = new User();
            user.setPublicKey(req.publicKey);
            user.setBio("");
            user.setSocials(new User.SocialLinks());
            user.setPfp("");
            user.setPoints(0);
            user.setPesos(1000);
            user.setCreatedAt(System.currentTimeMillis());
            user.setDaoMember(holder);
            user.setPrimoHolder(holder);
            user.persist();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] Created new user for publicKey: %s", req.publicKey));
            }
        } else {
            user.setPrimoHolder(holder);
            if (holder && !user.isDaoMember()) {
                user.setDaoMember(true);
            }
            if (!holder && user.isDaoMember()) {
                user.setDaoMember(false);
            }
            user.persistOrUpdate();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] User already exists for publicKey: %s", req.publicKey));
            }
        }
        return user;
    }

    @GET
    @Path("/{publicKey}")
    public User getUser(@PathParam("publicKey") String publicKey) {
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
            LOGGER.info(String.format("[UserResource] Updated PFP for publicKey: %s to %s", publicKey, pfpUrl));
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
            LOGGER.info(String.format("[UserResource] Updated profile for %s", publicKey));
        }
        return user;
    }

    @GET
    @Path("/primos")
    public java.util.List<User> getDaoMembers() {
        return User.list("primoHolder", true);
    }

}
