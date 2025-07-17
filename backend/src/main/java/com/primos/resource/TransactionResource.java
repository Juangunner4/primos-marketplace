package com.primos.resource;

import com.primos.service.TransactionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

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
}
