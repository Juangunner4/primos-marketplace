package com.primos.resource;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.primos.model.User;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/stats")
@Produces(MediaType.APPLICATION_JSON)
public class StatsResource {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private static final String MAGIC_EDEN_SYMBOL = "primos";
    private static final String SOL_PRICE_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0fcfac8c280b56d";

    @GET
    @Path("/overview")
    public Map<String, Object> getOverview() throws IOException, InterruptedException {
        Map<String, Object> result = new HashMap<>();
        result.put("daoMembers", User.count("daoMember", true));

        Map<String, Object> me = fetchMagicEdenStats();
        result.putAll(me);

        Double sol = fetchSolPrice();
        result.put("solPrice", sol);

        return result;
    }

    private Map<String, Object> fetchMagicEdenStats() throws IOException, InterruptedException {
        Map<String, Object> map = new HashMap<>();
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api-mainnet.magiceden.dev/v2/collections/" + MAGIC_EDEN_SYMBOL + "/stats"))
                .GET()
                .build();
        HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() == 200) {
            JsonNode node = MAPPER.readTree(resp.body());
            map.put("floorPrice", node.path("floorPrice").asDouble());
            map.put("listedCount", node.path("listedCount").asInt());
            map.put("volume24hr", node.path("volume24hr").asDouble());
            map.put("listedTotalValue", node.path("listedTotalValue").asDouble());
        }
        return map;
    }

    private Double fetchSolPrice() throws IOException, InterruptedException {
        String url = "https://hermes.pyth.network/api/latest_price_feeds?ids[]=" + SOL_PRICE_FEED_ID;
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() == 200) {
            JsonNode arr = MAPPER.readTree(resp.body());
            if (arr.isArray() && arr.size() > 0) {
                JsonNode p = arr.get(0).path("price");
                if (p.has("price") && p.has("expo")) {
                    double price = p.path("price").asDouble();
                    int expo = p.path("expo").asInt();
                    return price * Math.pow(10, expo);
                }
            }
        }
        return null;
    }
}
