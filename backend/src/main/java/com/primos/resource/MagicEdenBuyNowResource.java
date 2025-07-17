package com.primos.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.ProxySelector;
import java.net.InetSocketAddress;

/**
 * Fetches "Buy Now" instructions from the Magic Eden API. The backend adds the
 * required API key so the frontend does not expose it.
 */
@Path("/api/magiceden/buy_now")
@Produces(MediaType.APPLICATION_JSON)
public class MagicEdenBuyNowResource {

    private static final String API_BASE = "https://api-mainnet.magiceden.dev";
    private static final String API_KEY = System.getenv("MAGICEDEN_API_KEY");
    private static final HttpClient CLIENT = createClient();

    private static HttpClient createClient() {
        String proxy = System.getenv("https_proxy");
        if (proxy == null || proxy.isEmpty()) {
            proxy = System.getenv("HTTPS_PROXY");
        }
        if (proxy != null && !proxy.isEmpty()) {
            try {
                URI uri = URI.create(proxy);
                return HttpClient.newBuilder()
                        .proxy(ProxySelector.of(new InetSocketAddress(uri.getHost(), uri.getPort())))
                        .build();
            } catch (Exception ignored) {
            }
        }
        return HttpClient.newHttpClient();
    }

    @GET
    public Response buyNow(@QueryParam("buyer") String buyer,
                           @QueryParam("seller") String seller,
                           @QueryParam("tokenMint") String tokenMint,
                           @QueryParam("tokenATA") String tokenATA,
                           @QueryParam("price") String price,
                           @QueryParam("auctionHouseAddress") String auctionHouse,
                           @QueryParam("sellerReferral") String sellerReferral,
                           @QueryParam("sellerExpiry") String sellerExpiry)
            throws IOException, InterruptedException {
        StringBuilder url = new StringBuilder(API_BASE)
                .append("/v2/instructions/buy_now?buyer=").append(buyer)
                .append("&seller=").append(seller)
                .append("&tokenMint=").append(tokenMint)
                .append("&tokenATA=").append(tokenATA)
                .append("&price=").append(price)
                .append("&auctionHouseAddress=").append(auctionHouse);
        if (sellerReferral != null && !sellerReferral.isBlank()) {
            url.append("&sellerReferral=").append(sellerReferral);
        }
        if (sellerExpiry != null && !sellerExpiry.isBlank()) {
            url.append("&sellerExpiry=").append(sellerExpiry);
        }
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url.toString()))
                .GET();
        if (API_KEY != null && !API_KEY.isBlank()) {
            builder.header("Authorization", "Bearer " + API_KEY);
        }
        HttpResponse<String> resp = CLIENT.send(builder.build(), HttpResponse.BodyHandlers.ofString());

        int status = resp.statusCode() == 304 ? 200 : resp.statusCode();
        return Response.status(status).entity(resp.body()).build();
    }
}
