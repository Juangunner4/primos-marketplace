package com.primos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.primos.model.MemberStats;

class StatsServiceTest {

    static class TestService extends StatsService {
        int calls = 0;
        MemberStats stored;

        @Override
        protected int fetchNftCount(String publicKey) {
            calls++;
            return 2;
        }

        @Override
        protected MemberStats findStoredStats(String publicKey) {
            return stored != null && stored.getPublicKey().equals(publicKey) ? stored : null;
        }

        @Override
        protected void persistStats(MemberStats stats) {
            this.stored = stats;
        }
    }

    @Test
    void cachesResults() {
        TestService service = new TestService();
        MemberStats first = service.getMemberStats("abc");
        MemberStats second = service.getMemberStats("abc");
        assertEquals(2, first.getCount());
        assertEquals(first.getCount(), second.getCount());
        assertEquals(1, service.calls);
    }
}
