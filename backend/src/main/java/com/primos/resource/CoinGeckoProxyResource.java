package com.primos.resource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Proxy resource for CoinGecko API to handle CORS issues
 */
@Path("/api/coingecko")
public class CoinGeckoProxyResource {

    private static final String COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @GET
    @Path("/simple/token_price/{network}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSimpleTokenPrice(
            @PathParam("network") String network,
            @QueryParam("contract_addresses") String contractAddresses,
            @QueryParam("vs_currencies") String vsCurrencies,
            @QueryParam("include_market_cap") String includeMarketCap,
            @QueryParam("include_24hr_vol") String include24hrVol,
            @QueryParam("include_24hr_change") String include24hrChange,
            @QueryParam("include_last_updated_at") String includeLastUpdatedAt) {

        try {
            StringBuilder urlBuilder = new StringBuilder()
                    .append(COINGECKO_BASE_URL)
                    .append("/simple/token_price/")
                    .append(network)
                    .append("?");

            if (contractAddresses != null) {
                urlBuilder.append("contract_addresses=").append(contractAddresses).append("&");
            }
            if (vsCurrencies != null) {
                urlBuilder.append("vs_currencies=").append(vsCurrencies).append("&");
            }
            if (includeMarketCap != null) {
                urlBuilder.append("include_market_cap=").append(includeMarketCap).append("&");
            }
            if (include24hrVol != null) {
                urlBuilder.append("include_24hr_vol=").append(include24hrVol).append("&");
            }
            if (include24hrChange != null) {
                urlBuilder.append("include_24hr_change=").append(include24hrChange).append("&");
            }
            if (includeLastUpdatedAt != null) {
                urlBuilder.append("include_last_updated_at=").append(includeLastUpdatedAt).append("&");
            }

            String url = urlBuilder.toString();
            if (url.endsWith("&")) {
                url = url.substring(0, url.length() - 1);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Accept", "application/json")
                    .header("User-Agent", "PrimosMarketplace/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return Response.status(response.statusCode())
                    .entity(response.body())
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET")
                    .header("Access-Control-Allow-Headers", "Content-Type")
                    .build();

        } catch (java.io.IOException | java.lang.InterruptedException e) {
            System.err.println("Error proxying CoinGecko request: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to fetch data from CoinGecko\"}")
                    .header("Access-Control-Allow-Origin", "*")
                    .build();
        }
    }
}
