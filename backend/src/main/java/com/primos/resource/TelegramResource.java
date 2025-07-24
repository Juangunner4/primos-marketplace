package com.primos.resource;

import com.primos.model.TelegramData;
import com.primos.service.CoingeckoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/telegram")
@Produces(MediaType.APPLICATION_JSON)
public class TelegramResource {

    @Inject
    CoingeckoService coingeckoService;

    @GET
    @Path("/{contract}")
    public TelegramData getData(@PathParam("contract") String contract) {
        TelegramData data = coingeckoService.fetchTokenData(contract);
        if (data == null) {
            return new TelegramData();
        }
        return data;
    }
}
