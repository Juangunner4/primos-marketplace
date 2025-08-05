package com.primos.resource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import com.primos.service.TrenchService;
import com.primos.service.CoinGeckoService;

class TrenchResourceTest {
    @Test
    void testAddAndGet() {
        TrenchResource res = new TrenchResource();
        TrenchService service = new TrenchService();
        service.coinGeckoService = new CoinGeckoService() {
            @Override
            public Double fetchMarketCap(String contract) {
                return 77.0;
            }
        };
        res.service = service;
        res.add("w1", java.util.Map.of("contract", "ca1", "source", "website"));
        TrenchResource.TrenchData data = res.get();
        assertEquals(1, data.contracts.size());
        assertEquals("ca1", data.contracts.get(0).getContract());
        assertEquals("w1", data.contracts.get(0).getFirstCaller());
        assertEquals(1, data.users.size());
        assertEquals("w1", data.users.get(0).publicKey);
        assertTrue(data.users.get(0).contracts.contains("ca1"));
    }
}
