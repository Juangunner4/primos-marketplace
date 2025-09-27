package com.weys.resource;

import com.weys.model.User;
import com.weys.service.LoginService;
import com.weys.service.PfpService;
import com.weys.service.PointService;
import com.weys.service.ProfileService;
import com.weys.service.UserService;

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
    public User getUser(@PathParam("publicKey") String publicKey) {
        return userService.getUser(publicKey);
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
    @Path("/weys")
    public java.util.List<User> getDaoMembers() {
        return userService.getDaoMembers();
    }

    @GET
    @Path("/holders")
    public java.util.List<User> getWeyHolders() {
        return userService.getWeyHolders();
    }

    @GET
    @Path("/domain/{name}")
    public User getByDomain(@PathParam("name") String name) {
        return userService.getByDomain(name);
    }

}
