package com.primos.resource;

import com.primos.model.WorkRequest;
import com.primos.service.WorkRequestService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/work")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkResource {

    @Inject
    WorkRequestService service;

    @GET
    public List<WorkRequest> list() {
        return service.list();
    }

    @POST
    public WorkRequest create(@HeaderParam("X-Public-Key") String publicKey, WorkRequest req) {
        if (publicKey == null || publicKey.isEmpty()) {
            throw new BadRequestException();
        }
        String desc = req != null ? req.getDescription() : null;
        return service.add(publicKey, desc == null ? "" : desc);
    }
}
