package com.primos.resource;

import java.util.logging.Logger;

import com.primos.model.User;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
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

    @POST
    @Path("/login")
    public User login(LoginRequest req) {
        if (req == null || req.publicKey == null || req.publicKey.isEmpty()) {
            System.out.println("[UserResource] Login attempt with missing publicKey");
            throw new jakarta.ws.rs.BadRequestException("publicKey is required");
        }
        System.out.println("[UserResource] Login attempt for publicKey: " + req.publicKey);
        User user = User.find("publicKey", req.publicKey).firstResult();
        if (user == null) {
            user = new User();
            user.setPublicKey(req.publicKey);
            user.setBio("");
            user.setSocials(new User.SocialLinks());
            user.setPfp("");
            user.setPoints(0);
            user.setPesos(1000);
            user.setCreatedAt(System.currentTimeMillis());
            user.persist();
            System.out.println("[UserResource] Created new user for publicKey: " + req.publicKey);
        } else {
            System.out.println("[UserResource] User already exists for publicKey: " + req.publicKey);
        }
        return user;
    }

    @GET
    @Path("/{publicKey}")
    public User getUser(@PathParam("publicKey") String publicKey) {
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) throw new NotFoundException();
        return user;
    }

    @PUT
    @Path("/{publicKey}/pfp")
    @Consumes(MediaType.TEXT_PLAIN)
    public User updatePfp(@PathParam("publicKey") String publicKey, String pfpUrl) {
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
    public User updateProfile(@PathParam("publicKey") String publicKey, User updated) {
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null && updated != null) {
            user.setBio(updated.getBio());
            user.setSocials(updated.getSocials());
            user.persistOrUpdate();
            LOGGER.info(String.format("[UserResource] Updated profile for %s", publicKey));
        }
        return user;
    }
}