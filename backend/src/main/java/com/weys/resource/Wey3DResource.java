package com.weys.resource;

import com.weys.model.Wey3D;
import com.weys.service.Wey3DService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/wey3d")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class Wey3DResource {

    @Inject
    Wey3DService service;

    @POST
    public Wey3D renderWey(@HeaderParam("X-Public-Key") String publicKey, Wey3D req) {
        return service.create(publicKey, req);
    }

    @GET
    @Path("/{token}")
    public Wey3D get(@PathParam("token") String token) {
        return Wey3D.find("tokenAddress", token).firstResult();
    }
}
