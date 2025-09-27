package com.weys.resource;

import com.weys.model.Notification;
import com.weys.service.NotificationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import org.bson.types.ObjectId;

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
    public Notification markRead(@PathParam("id") String id) {
        return service.markRead(new ObjectId(id));
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") String id) {
        service.delete(new ObjectId(id));
    }

    @DELETE
    public void deleteAll(@HeaderParam("X-Public-Key") String publicKey) {
        service.deleteAll(publicKey);
    }
}
