package com.weys.resource;

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
    private static final String CORS_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    private static final String CORS_ALLOW_METHODS = "Access-Control-Allow-Methods";
    private static final String CORS_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    private static final String CONTENT_TYPE = "Content-Type";
    private static final String WILDCARD_ORIGIN = "*";
    private static final String GET_METHOD = "GET";

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
            @QueryParam("include_last_updated_at") String includeLastUpdatedAt,
            @QueryParam("x_cg_demo_api_key") String demoApiKey) {

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
            if (demoApiKey != null) {
                urlBuilder.append("x_cg_demo_api_key=").append(demoApiKey).append("&");
            }

            String url = urlBuilder.toString();
            if (url.endsWith("&")) {
                url = url.substring(0, url.length() - 1);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Accept", "application/json")
                    .header("User-Agent", "WeysMarketplace/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return Response.status(response.statusCode())
                    .entity(response.body())
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .header(CORS_ALLOW_METHODS, GET_METHOD)
                    .header(CORS_ALLOW_HEADERS, CONTENT_TYPE)
                    .build();

        } catch (java.io.IOException e) {
            System.err.println("Error proxying CoinGecko request: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to fetch data from CoinGecko\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        } catch (java.lang.InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("CoinGecko request interrupted: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Request interrupted\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        }
    }

    @GET
    @Path("/coins/{network}/contract/{contractAddress}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getTokenByContract(
            @PathParam("network") String network,
            @PathParam("contractAddress") String contractAddress,
            @QueryParam("x_cg_demo_api_key") String demoApiKey) {

        try {
            String url = COINGECKO_BASE_URL + "/coins/" + network + "/contract/" + contractAddress;
            if (demoApiKey != null) {
                url += "?x_cg_demo_api_key=" + demoApiKey;
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Accept", "application/json")
                    .header("User-Agent", "WeysMarketplace/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return Response.status(response.statusCode())
                    .entity(response.body())
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .header(CORS_ALLOW_METHODS, GET_METHOD)
                    .header(CORS_ALLOW_HEADERS, CONTENT_TYPE)
                    .build();

        } catch (java.io.IOException e) {
            System.err.println("Error proxying CoinGecko token request: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to fetch data from CoinGecko\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        } catch (java.lang.InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("CoinGecko token request interrupted: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Request interrupted\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        }
    }

    @GET
    @Path("/pools/{tokenAddress}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getTokenPools(
            @PathParam("tokenAddress") String tokenAddress,
            @QueryParam("network") String network,
            @QueryParam("limit") String limit,
            @QueryParam("api_key") String apiKey) {

        try {
            // Note: This is a placeholder endpoint since CoinGecko doesn't have
            // a direct pools API in their public API. This would need to be
            // implemented with a different data source like DexScreener or Jupiter

            String responseBody = "{\"pools\": [], \"message\": \"Liquidity pools data coming soon\"}";

            return Response.status(200)
                    .entity(responseBody)
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .header(CORS_ALLOW_METHODS, GET_METHOD)
                    .header(CORS_ALLOW_HEADERS, CONTENT_TYPE)
                    .build();

        } catch (Exception e) {
            System.err.println("Error in pools endpoint: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to fetch pools data\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        }
    }

    @GET
    @Path("/nfts/{collectionId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getNFTCollectionData(
            @PathParam("collectionId") String collectionId,
            @QueryParam("platform") String platform,
            @QueryParam("api_key") String apiKey) {

        try {
            StringBuilder urlBuilder = new StringBuilder()
                    .append(COINGECKO_BASE_URL)
                    .append("/nfts/")
                    .append(collectionId)
                    .append("?");

            if (platform != null) {
                urlBuilder.append("platform=").append(platform).append("&");
            }
            if (apiKey != null) {
                urlBuilder.append("x_cg_demo_api_key=").append(apiKey).append("&");
            }

            String url = urlBuilder.toString();
            if (url.endsWith("&")) {
                url = url.substring(0, url.length() - 1);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Accept", "application/json")
                    .header("User-Agent", "WeysMarketplace/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return Response.status(response.statusCode())
                    .entity(response.body())
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .header(CORS_ALLOW_METHODS, GET_METHOD)
                    .header(CORS_ALLOW_HEADERS, CONTENT_TYPE)
                    .build();

        } catch (java.io.IOException e) {
            System.err.println("Error proxying CoinGecko NFT request: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"Failed to fetch NFT collection data from CoinGecko\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        } catch (java.lang.InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("CoinGecko NFT request interrupted: " + e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"NFT request interrupted\"}")
                    .header(CORS_ALLOW_ORIGIN, WILDCARD_ORIGIN)
                    .build();
        }
    }
}
