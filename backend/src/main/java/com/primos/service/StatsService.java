package com.primos.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import com.primos.model.MemberStats;
import com.primos.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@ApplicationScoped
public class StatsService {

    private static final long CACHE_TTL = Duration.ofMinutes(10).toMillis();
    private final Map<String, MemberStats> cache = new ConcurrentHashMap<>();

    @Inject
    ObjectMapper mapper;

    /**
     * Returns NFT count stats for the given public key, fetching from the
     * external API when the cached value is expired.
     */
    public MemberStats getMemberStats(String publicKey) {
        MemberStats cached = cache.get(publicKey);
        long now = System.currentTimeMillis();
        if (cached != null && now - cached.getUpdatedAt() < CACHE_TTL) {
            return cached;
        }

        MemberStats stored = findStoredStats(publicKey);
        if (stored != null && now - stored.getUpdatedAt() < CACHE_TTL) {
            cache.put(publicKey, stored);
            return stored;
        }

        int count = fetchNftCount(publicKey);
        MemberStats stats = stored == null ? new MemberStats(publicKey, count, now)
                : stored;
        stats.setCount(count);
        stats.setUpdatedAt(now);
        persistStats(stats);
        cache.put(publicKey, stats);
        return stats;
    }

    /**
     * Returns stats for all DAO members.
     */
    public List<MemberStats> getAllMemberStats() {
        List<User> members = User.list("daoMember", true);
        List<MemberStats> result = new ArrayList<>();
        for (User u : members) {
            result.add(getMemberStats(u.getPublicKey()));
        }
        return result;
    }

    protected MemberStats findStoredStats(String publicKey) {
        try {
            return MemberStats.find("publicKey", publicKey).firstResult();
        } catch (Exception e) {
            return null;
        }
    }

    protected void persistStats(MemberStats stats) {
        try {
            if (stats.isPersistent()) {
                stats.persistOrUpdate();
            } else {
                stats.persist();
            }
        } catch (Exception e) {
            // ignore persistence errors in environments without MongoDB
        }
    }

    /**
     * Fetch NFT count for a user from an external service like Helius.
     * This implementation should call the service and return the count.
     * In tests it can be overridden to return mock values.
     */
    protected int fetchNftCount(String publicKey) {
        String apiKey = System.getenv("HELIUS_API_KEY");
        if (apiKey == null || apiKey.isEmpty()) {
            return 0;
        }
        String url = String.format(
                "https://api.helius.xyz/v0/addresses/%s/nfts?api-key=%s",
                publicKey, apiKey);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        try {
            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return 0;
            }
            JsonNode json = mapper.readTree(response.body());
            JsonNode nfts = json.get("nfts");
            if (nfts != null && nfts.isArray()) {
                return nfts.size();
            }
        } catch (IOException | InterruptedException e) {
            // log and ignore
        }
        return 0;
    }
}
