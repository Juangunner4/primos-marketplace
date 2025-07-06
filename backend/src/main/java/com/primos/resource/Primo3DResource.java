package com.primos.resource;

import com.primos.model.Primo3D;
import com.primos.service.Primo3DService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/primo3d")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class Primo3DResource {

    @Inject
    Primo3DService service;

    @POST
    public Primo3D renderPrimo(Primo3D req) {
        return service.create(req);
    }

    @GET
    @Path("/{token}")
    public Primo3D get(@PathParam("token") String token) {
        return Primo3D.find("tokenAddress", token).firstResult();
    }
}
