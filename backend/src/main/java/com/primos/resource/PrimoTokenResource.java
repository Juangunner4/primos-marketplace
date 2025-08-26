package com.primos.resource;

import java.util.List;

import com.primos.model.PrimoToken;
import com.primos.service.PrimoTokensService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/primo-tokens")
@Produces(MediaType.APPLICATION_JSON)
public class PrimoTokenResource {

    @Inject
    PrimoTokensService primoTokensService;

    @GET
    public List<PrimoToken> getTokens() {
        return primoTokensService.updateAndGetPrimoTokens();
    }
}
