package com.primos.model;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/user")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @POST
    @Path("/login")
    public User login(User req) {
        User user = User.find("publicKey", req.publicKey).firstResult();
        if (user == null) {
            user = new User();
            user.publicKey = req.publicKey;
            user.bio = "";
            user.socials = new User.SocialLinks();
            user.pfp = "";
            user.points = 0;
            user.pesos = 1000;
            user.createdAt = System.currentTimeMillis();
            user.persist();
        }
        return user;
    }

    @PUT
    @Path("/profile")
    public User updateProfile(User req) {
        User user = User.find("publicKey", req.publicKey).firstResult();
        if (user == null) throw new NotFoundException();
        user.bio = req.bio;
        user.socials = req.socials;
        user.pfp = req.pfp;
        user.update();
        return user;
    }

    @POST
    @Path("/points")
    public User addPoints(@QueryParam("publicKey") String publicKey, @QueryParam("points") int points) {
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) throw new NotFoundException();
        user.points += points;
        user.update();
        return user;
    }

    @GET
    @Path("/{publicKey}")
    public User getUser(@PathParam("publicKey") String publicKey) {
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) throw new NotFoundException();
        return user;
    }
}
