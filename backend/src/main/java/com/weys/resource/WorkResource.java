package com.weys.resource;

import com.weys.model.WorkRequest;
import com.weys.service.WorkRequestService;
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
    public List<WorkRequest> list(@QueryParam("group") String group) {
        return service.list(group);
    }

    @POST
    public WorkRequest create(@HeaderParam("X-Public-Key") String publicKey, WorkRequest req) {
        if (publicKey == null || publicKey.isEmpty()) {
            throw new BadRequestException();
        }
        String desc = req != null ? req.getDescription() : null;
        String group = req != null ? req.getGroup() : null;
        return service.add(publicKey, group == null ? "" : group, desc == null ? "" : desc);
    }

    @PUT
    @Path("/{id}/assign")
    public WorkRequest assign(@PathParam("id") String id,
            @HeaderParam("X-Public-Key") String worker) {
        if (worker == null || worker.isEmpty()) {
            throw new BadRequestException();
        }
        return service.assign(id, worker);
    }
}
