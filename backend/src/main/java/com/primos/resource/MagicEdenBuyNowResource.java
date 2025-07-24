package com.primos.resource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.jboss.logging.Logger;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Fetches "Buy Now" instructions from the Magic Eden API. The backend adds the
 * required API key so the frontend does not expose it.
 */
@Path("/api/magiceden/buy_now")
@Produces(MediaType.APPLICATION_JSON)
public class MagicEdenBuyNowResource {

    private static final Logger LOG = Logger.getLogger(MagicEdenBuyNowResource.class);

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

    private static final String DEFAULT_AUCTION_HOUSE = "E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe";
    // additional payee for community and operations fees
    private static final String FEE_ACCOUNT = "EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6";
    private static final int COMMUNITY_BPS = 240; // 2.4%
    private static final int OPERATIONS_BPS = 140; // 1.4%

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
        String ah = (auctionHouse == null || auctionHouse.isBlank()) ? DEFAULT_AUCTION_HOUSE : auctionHouse;
        StringBuilder url = new StringBuilder(API_BASE)
                .append("/v2/instructions/buy_now?buyer=").append(buyer)
                .append("&seller=").append(seller)
                .append("&tokenMint=").append(tokenMint)
                .append("&tokenATA=").append(tokenATA)
                .append("&price=").append(price)
                .append("&auctionHouseAddress=").append(ah);
        // add additional payees for community and operations
        url.append("&additionalPayees=").append(FEE_ACCOUNT).append(":").append(COMMUNITY_BPS)
                .append("&additionalPayees=").append(FEE_ACCOUNT).append(":").append(OPERATIONS_BPS);
        if (sellerReferral != null && !sellerReferral.isBlank()) {
            url.append("&sellerReferral=").append(sellerReferral);
        }
        if (sellerExpiry != null && !sellerExpiry.isBlank()) {
            url.append("&sellerExpiry=").append(sellerExpiry);
        }
        LOG.infof("Requesting buy now tx buyer=%s tokenMint=%s price=%s", buyer, tokenMint, price);
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url.toString()))
                .GET();
        if (API_KEY != null && !API_KEY.isBlank()) {
            builder.header("Authorization", "Bearer " + API_KEY);
        }
        HttpResponse<String> resp;
        try {
            resp = CLIENT.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            LOG.error("Failed to fetch buy now instructions", e);
            throw e;
        }

        int status = resp.statusCode() == 304 ? 200 : resp.statusCode();
        LOG.debugf("Magic Eden response status: %d", status);
        return Response.status(status).entity(resp.body()).build();
    }
}
