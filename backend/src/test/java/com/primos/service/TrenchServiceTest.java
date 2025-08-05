package com.primos.service;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class TrenchServiceTest {
    @Test
    public void testAddIncrementsCounts() {
        TrenchService svc = new TrenchService();
        svc.coinGeckoService = new CoinGeckoService() {
            @Override
            public Double fetchMarketCap(String contract) {
                return 1000.0;
            }
        };
        svc.add("u1", "ca1", "website", null);
        TrenchUser u1 = TrenchUser.find("publicKey", "u1").firstResult();
        u1.setLastSubmittedAt(0L); // bypass cooldown
        u1.persistOrUpdate();
        assertThrows(jakarta.ws.rs.BadRequestException.class, () -> svc.add("u1", "ca1", "website", null));
        svc.add("u2", "ca1", "website", null);

        TrenchContract tc = TrenchContract.find("contract", "ca1").firstResult();
        assertEquals(2, tc.getCount());

        u1 = TrenchUser.find("publicKey", "u1").firstResult();
        assertEquals(1, u1.getCount());
        assertTrue(u1.getContracts().contains("ca1"));
        TrenchUser u2 = TrenchUser.find("publicKey", "u2").firstResult();
        assertEquals(1, u2.getCount());
    }

    @Test
    public void testRetriesMarketCapUntilSuccess() {
        TrenchService svc = new TrenchService();
        svc.coinGeckoService = new CoinGeckoService() {
            int attempts = 0;

            @Override
            protected Double fetchMarketCapOnce(String contract) {
                attempts++;
                if (attempts < 3) {
                    return null;
                }
                return 5000.0;
            }
        };
        svc.add("u3", "ca2", "website", null);
        TrenchContract tc = TrenchContract.find("contract", "ca2").firstResult();
        assertEquals(5000.0, tc.getFirstCallerMarketCap());
    }

    @Test
    public void testGetContractsPopulatesMissingMarketCap() {
        TrenchService svc = new TrenchService();
        svc.coinGeckoService = new CoinGeckoService() {
            @Override
            public Double fetchMarketCap(String contract) {
                return 42.0;
            }
        };
        TrenchContract tc = new TrenchContract();
        tc.setContract("ca3");
        tc.setCount(1);
        tc.persist();
        java.util.List<TrenchContract> list = svc.getContracts();
        TrenchContract updated = list.stream().filter(c -> "ca3".equals(c.getContract())).findFirst().orElse(null);
        assertNotNull(updated);
        assertEquals(42.0, updated.getFirstCallerMarketCap());
        TrenchContract fromDb = TrenchContract.find("contract", "ca3").firstResult();
        assertEquals(42.0, fromDb.getFirstCallerMarketCap());
    }
}
