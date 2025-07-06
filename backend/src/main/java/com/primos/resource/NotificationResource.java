package com.primos.resource;

import com.primos.model.Notification;
import com.primos.service.NotificationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    NotificationService service;

    @GET
    public List<Notification> get(@HeaderParam("X-Public-Key") String publicKey) {
        return service.forUser(publicKey);
    }

    @PUT
    @Path("/{id}/read")
    public Notification markRead(@PathParam("id") Long id) {
        return service.markRead(id);
    }
}
