package com.weys.resource;

import java.util.ArrayList;
import java.util.List;

import com.weys.model.WeyToken;
import com.weys.service.WeyTokensService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/wey-tokens")
@Produces(MediaType.APPLICATION_JSON)
public class WeyTokenResource {

    @Inject
    WeyTokensService weyTokensService;

    @GET
    public List<WeyToken> getTokens() {
        return weyTokensService.updateAndGetWeyTokens();
    }

    @GET
    @Path("/top-by-change")
    public List<WeyToken> getTopTokensByChange(@QueryParam("limit") Integer limit) {
        int maxResults = limit != null && limit > 0 ? Math.min(limit, 50) : 10;

        List<WeyToken> allTokens = weyTokensService.updateAndGetWeyTokens();

        // First try to get tokens with price change data
        List<WeyToken> tokensWithPriceChange = allTokens.stream()
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
            List<WeyToken> remainingTokens = allTokens.stream()
                    .filter(token -> token.getPriceChange24h() == null)
                    .sorted((a, b) -> Integer.compare(b.getHolderCount(), a.getHolderCount()))
                    .toList();

            // Combine the lists
            List<WeyToken> result = new ArrayList<>(tokensWithPriceChange);
            int needed = maxResults - tokensWithPriceChange.size();
            result.addAll(remainingTokens.stream().limit(needed).toList());
            return result;
        }

        return tokensWithPriceChange.stream().limit(maxResults).toList();
    }
}
