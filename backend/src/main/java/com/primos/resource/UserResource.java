package com.primos.resource;

import com.primos.model.User;
import com.primos.service.LoginService;
import com.primos.service.PfpService;
import com.primos.service.PointService;
import com.primos.service.ProfileService;
import com.primos.service.UserService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
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

    @Inject
    private LoginService loginService;
    @Inject
    private UserService userService;
    @Inject
    private PfpService pfpService;
    @Inject
    private ProfileService profileService;
    @Inject
    private PointService pointService;

    @POST
    @Path("/login")
    public User login(LoginRequest req) {
        return loginService.login(req);
    }

    @GET
    @Path("/{publicKey}")
    public User getUser(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey) {
        return userService.getUser(publicKey, walletKey);
    }

    @PUT
    @Path("/{publicKey}/pfp")
    @Consumes(MediaType.TEXT_PLAIN)
    public User updatePfp(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey,
            String pfpUrl) {
        return pfpService.updatePfp(publicKey, walletKey, pfpUrl);
    }

    @PUT
    @Path("/{publicKey}")
    public User updateProfile(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey,
            User updated) {
        return profileService.updateProfile(publicKey, walletKey, updated);
    }

    @POST
    @Path("/{publicKey}/points")
    @Consumes(MediaType.APPLICATION_JSON)
    public User addPoint(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey) {
        return pointService.addPoint(publicKey, walletKey);
    }

    @GET
    @Path("/primos")
    public java.util.List<User> getDaoMembers(@HeaderParam("X-Public-Key") String walletKey) {
        return userService.getDaoMembers(walletKey);
    }

}
