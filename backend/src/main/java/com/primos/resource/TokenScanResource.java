package com.primos.resource;

import com.primos.model.TokenScanResult;
import com.primos.service.TokenScanService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.MediaType;

@Path("/api/token/scan")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TokenScanResource {

    @Inject
    TokenScanService scanService;

    @GET
    @Path("/{tokenAddress}")
    public TokenScanResult scanToken(@PathParam("tokenAddress") String tokenAddress) {
        return scanService.scanToken(tokenAddress);
    }
}
