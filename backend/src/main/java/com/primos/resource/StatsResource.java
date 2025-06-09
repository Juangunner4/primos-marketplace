package com.primos.resource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

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
    private static final Logger LOGGER = Logger.getLogger(StatsResource.class.getName());
    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String COLLECTION_MINT = "2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb";
    private static final String API_KEY = System.getenv().getOrDefault("HELIUS_API_KEY", "");
    private static final long CACHE_TTL = 60_000; // 1 minute

    private static final Map<String, CacheEntry> CACHE = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final int count;
        final long ts;
        CacheEntry(int c) { this.count = c; this.ts = System.currentTimeMillis(); }
    }

    @GET
    @Path("/member-nft-counts")
    public Map<String, Integer> getMemberNftCounts() {
        List<User> members = User.list("daoMember", true);
        Map<String, Integer> result = new HashMap<>();
        for (User u : members) {
            String pk = u.getPublicKey();
            CacheEntry cached = CACHE.get(pk);
            if (cached != null && System.currentTimeMillis() - cached.ts < CACHE_TTL) {
                result.put(pk, cached.count);
                continue;
            }
            int count = fetchCount(pk);
            CACHE.put(pk, new CacheEntry(count));
            result.put(pk, count);
        }
        return result;
    }

    protected int fetchCount(String owner) {
        int page = 1;
        int limit = 100;
        int count = 0;
        boolean hasMore = true;
        while (hasMore) {
            try {
                String body = String.format(
                    "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"getAssetsByGroup\",\"params\":{\"groupKey\":\"collection\",\"groupValue\":\"%s\",\"page\":%d,\"limit\":%d}}",
                    COLLECTION_MINT, page, limit);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://mainnet.helius-rpc.com/?api-key=" + API_KEY))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();
                HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() != 200) break;
                JsonNode items = MAPPER.readTree(response.body()).path("result").path("items");
                if (!items.isArray()) break;
                for (JsonNode item : items) {
                    String ownerKey = item.path("ownership").path("owner").asText();
                    if (owner.equals(ownerKey)) {
                        count += 1;
                    }
                }
                hasMore = items.size() == limit;
                page += 1;
            } catch (Exception e) {
                LOGGER.warning("Failed to fetch count for " + owner + ": " + e.getMessage());
                break;
            }
        }
        return count;
    }
}
