package com.primos.resource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.jboss.logging.Logger;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Fetches "list" instructions from the Magic Eden API. The backend adds the
 * required API key so the frontend does not expose it.
 */
@Path("/api/magiceden/list")
@Produces(MediaType.APPLICATION_JSON)
public class MagicEdenListResource {

    private static final Logger LOG = Logger.getLogger(MagicEdenListResource.class);

    private static final String API_BASE = "https://api-mainnet.magiceden.dev";
    private static final String API_KEY = System.getenv("MAGICEDEN_API_KEY");
    private static final HttpClient CLIENT = createClient();
    private static final ObjectMapper MAPPER = new ObjectMapper();

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

    private static void encodeBuffer(ObjectNode parent, String field) {
        JsonNode node = parent.get(field);
        if (node instanceof ObjectNode obj) {
            JsonNode data = obj.get("data");
            if (data != null && data.isArray()) {
                byte[] bytes = new byte[data.size()];
                for (int i = 0; i < data.size(); i++) {
                    bytes[i] = (byte) data.get(i).asInt();
                }
                obj.put("data", Base64.getEncoder().encodeToString(bytes));
                obj.remove("type");
            }
        }
    }

    private static void processBuffers(ObjectNode node) {
        encodeBuffer(node, "txSigned");
        encodeBuffer(node, "txUnsigned");
        JsonNode v0 = node.get("v0");
        if (v0 instanceof ObjectNode obj) {
            encodeBuffer(obj, "txSigned");
            encodeBuffer(obj, "txUnsigned");
        }
    }

    private static final String DEFAULT_AUCTION_HOUSE = "E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe";

    @GET
    public Response list(@QueryParam("seller") String seller,
            @QueryParam("tokenMint") String tokenMint,
            @QueryParam("tokenATA") String tokenATA,
            @QueryParam("price") String price,
            @QueryParam("auctionHouseAddress") String auctionHouse)
            throws IOException, InterruptedException {
        String ah = (auctionHouse == null || auctionHouse.isBlank()) ? DEFAULT_AUCTION_HOUSE : auctionHouse;
        String url = API_BASE
                + "/v2/instructions/sell?seller=" + seller
                + "&tokenMint=" + tokenMint
                + "&tokenATA=" + tokenATA
                + "&price=" + price
                + "&auctionHouseAddress=" + ah;
        LOG.infof("Requesting list tx seller=%s tokenMint=%s price=%s", seller, tokenMint, price);
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET();
        if (API_KEY != null && !API_KEY.isBlank()) {
            builder.header("Authorization", "Bearer " + API_KEY);
        }
        HttpResponse<String> resp;
        try {
            resp = CLIENT.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            LOG.error("Failed to fetch list instructions", e);
            throw e;
        }

        int status = resp.statusCode() == 304 ? 200 : resp.statusCode();
        LOG.debugf("Magic Eden response status: %d", status);
        String body = resp.body();
        if (body != null && !body.isEmpty()) {
            try {
                ObjectNode json = (ObjectNode) MAPPER.readTree(body);
                processBuffers(json);
                body = MAPPER.writeValueAsString(json);
            } catch (Exception e) {
                LOG.error("Failed to parse Magic Eden response", e);
            }
        }
        return Response.status(status).entity(body).build();
    }
}
