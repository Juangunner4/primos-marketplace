package com.weys.resource;

import com.weys.service.TransactionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.DefaultValue;
import java.util.List;

@Path("/api/transactions")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TransactionResource {

    @Inject TransactionService service;

    @POST
    public Response recordTx(TransactionDTO tx) {
        service.recordTransaction(tx);
        return Response.status(Response.Status.CREATED).build();
    }

    @GET
    @Path("/recent")
    public List<com.weys.model.Transaction> recent(@QueryParam("hours") @DefaultValue("24") int hours) {
        return service.recentTransactions(hours);
    }

    @GET
    @Path("/volume24h")
    public Response volume24h() {
        double vol = service.volumeLast24h();
        var json = jakarta.json.Json.createObjectBuilder().add("volume", vol).build();
        return Response.ok(json).build();
    }
}
