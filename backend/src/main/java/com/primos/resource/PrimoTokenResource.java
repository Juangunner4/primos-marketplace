package com.primos.resource;

import java.util.ArrayList;
import java.util.List;

import com.primos.model.PrimoToken;
import com.primos.service.PrimoTokensService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
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

    @GET
    @Path("/top-by-change")
    public List<PrimoToken> getTopTokensByChange(@QueryParam("limit") Integer limit) {
        int maxResults = limit != null && limit > 0 ? Math.min(limit, 50) : 10;

        List<PrimoToken> allTokens = primoTokensService.updateAndGetPrimoTokens();

        // First try to get tokens with price change data
        List<PrimoToken> tokensWithPriceChange = allTokens.stream()
                .filter(token -> token.getPriceChange24h() != null)
                .sorted((a, b) -> {
                    Double aPriceChange = a.getPriceChange24h();
                    Double bPriceChange = b.getPriceChange24h();
                    if (aPriceChange == null)
                        aPriceChange = 0.0;
                    if (bPriceChange == null)
                        bPriceChange = 0.0;
                    return Double.compare(bPriceChange, aPriceChange);
                })
                .toList();

        // If we don't have enough tokens with price change, add tokens without price
        // change
        // sorted by holder count
        if (tokensWithPriceChange.size() < maxResults) {
            List<PrimoToken> remainingTokens = allTokens.stream()
                    .filter(token -> token.getPriceChange24h() == null)
                    .sorted((a, b) -> Integer.compare(b.getHolderCount(), a.getHolderCount()))
                    .toList();

            // Combine the lists
            List<PrimoToken> result = new ArrayList<>(tokensWithPriceChange);
            int needed = maxResults - tokensWithPriceChange.size();
            result.addAll(remainingTokens.stream().limit(needed).toList());
            return result;
        }

        return tokensWithPriceChange.stream().limit(maxResults).toList();
    }
}
