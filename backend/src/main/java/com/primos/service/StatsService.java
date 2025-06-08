package com.primos.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.enterprise.context.ApplicationScoped;

import com.primos.model.MemberStats;
import com.primos.model.User;

@ApplicationScoped
public class StatsService {

    private static final long CACHE_TTL = Duration.ofMinutes(10).toMillis();
    private final Map<String, MemberStats> cache = new ConcurrentHashMap<>();

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
        int count = fetchNftCount(publicKey);
        MemberStats stats = new MemberStats(publicKey, count, now);
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

    /**
     * Fetch NFT count for a user from an external service like Helius.
     * This implementation should call the service and return the count.
     * In tests it can be overridden to return mock values.
     */
    protected int fetchNftCount(String publicKey) {
        // TODO: integrate with Helius or other Solana API
        return 0;
    }
}
