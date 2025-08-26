package com.primos.resource;

import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.UUID;

import com.primos.model.BetaCode;
import com.primos.model.User;
import com.primos.service.HeliusService;
import com.primos.service.PrimoTokensService;

import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonReader;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminResource {

    public static final String ADMIN_WALLET = System.getenv().getOrDefault("ADMIN_WALLET",
            "EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6");

    @Inject
    HeliusService heliusService;

    @Inject
    PrimoTokensService primoTokensService;

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

    private void ensureAdmin(String wallet) {
        if (wallet == null || !ADMIN_WALLET.equals(wallet)) {
            throw new ForbiddenException();
        }
    }

    @GET
    @Path("/beta")
    public List<BetaCode> listCodes(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return BetaCode.listAll();
    }

    @GET
    @Path("/beta/active")
    public List<BetaCode> listActiveCodes(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return BetaCode.list("redeemed", false);
    }

    @GET
    @Path("/beta/inactive")
    public List<BetaCode> listInactiveCodes(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return BetaCode.list("redeemed", true);
    }

    public record Stats(long totalWallets, long totalPoints, long primoHolders,
            long betaCodes, long betaCodesRedeemed, long primosHeld,
            long walletsWithPrimos, long dbMarketCap, long floorPrice) {
    }

    @GET
    @Path("/stats")
    public Stats getStats(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        long totalWallets = User.count();
        long totalPoints = User.streamAll()
                .map(u -> (User) u)
                .mapToInt(User::getPoints)
                .sum();
        long primoHolders = User.count("primoHolder", true);
        long betaCodes = BetaCode.count();
        long betaCodesRedeemed = BetaCode.count("redeemed", true);

        long primosHeld = 0;
        long walletsWithPrimos = 0;
        String heliusKey = System.getenv("REACT_APP_HELIUS_API_KEY");
        String collection = System.getenv().getOrDefault("REACT_APP_PRIMOS_COLLECTION", "primos");
        if (heliusKey != null && !heliusKey.isEmpty()) {
            List<User> users = User.listAll();
            for (User u : users) {
                int count = fetchPrimoCount(u.getPublicKey(), heliusKey, collection);
                if (count > 0) {
                    walletsWithPrimos++;
                    primosHeld += count;
                }
            }
        }

        long floorPrice = fetchFloorPrice();
        long dbMarketCap = primosHeld * floorPrice;

        return new Stats(totalWallets, totalPoints, primoHolders, betaCodes,
                betaCodesRedeemed, primosHeld, walletsWithPrimos, dbMarketCap, floorPrice);
    }

    private int fetchPrimoCount(String wallet, String apiKey, String collection) {
        try {
            int page = 1;
            int limit = 100;
            int total = 0;
            while (true) {
                String body = String.format(
                        "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"searchAssets\",\"params\":{\"ownerAddress\":\"%s\",\"grouping\":[\"collection\",\"%s\"],\"tokenType\":\"regularNft\",\"page\":%d,\"limit\":%d}}",
                        wallet, collection, page, limit);
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create("https://mainnet.helius-rpc.com/?api-key=" + apiKey))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();
                HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() != 200) {
                    break;
                }
                try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                    var obj = reader.readObject();
                    var result = obj.getJsonObject("result");
                    if (result == null)
                        break;
                    var items = result.getJsonArray("items");
                    if (items == null)
                        break;
                    total += items.size();
                    if (items.size() < limit) {
                        break;
                    }
                    page++;
                }
            }
            return total;
        } catch (Exception e) {
            return 0;
        }
    }

    private long fetchFloorPrice() {
        try {
            String url = "https://api-mainnet.magiceden.dev/v2/collections/primos/stats";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                return 0L;
            }
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                var obj = reader.readObject();
                var num = obj.get("floorPrice");
                if (num == null || num.getValueType() != jakarta.json.JsonValue.ValueType.NUMBER) {
                    return 0L;
                }
                return obj.getJsonNumber("floorPrice").longValue();
            }
        } catch (Exception e) {
            return 0L;
        }
    }

    @POST
    @Path("/beta")
    public BetaCode createCode(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        BetaCode code = new BetaCode();
        code.setCode("BETA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        code.persist();
        return code;
    }

    /**
     * Discovers tokens held by Primo holders and adds them to Trenches.
     * This endpoint fetches all tokens held by Primo community members
     * and automatically adds popular tokens to the Trenches for community tracking.
     */
    @POST
    @Path("/discover-primo-tokens")
    public String discoverPrimoTokens(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return primoTokensService.discoverAndAddPrimoTokens();
    }
}
