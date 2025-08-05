package com.primos.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import org.junit.jupiter.api.Test;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchContractCaller;
import com.primos.model.TrenchUser;

class TrenchServiceTest {
    @Test
    void testAddIncrementsCounts() {
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
    void testRetriesMarketCapUntilSuccess() {
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
    void testGetContractsDoesNotFetchMarketCap() {
        TrenchService svc = new TrenchService();
        svc.coinGeckoService = new CoinGeckoService() {
            @Override
            public Double fetchMarketCap(String contract) {
                fail("fetchMarketCap should not be called");
                return null; // unreachable
            }
        };
        TrenchContract tc = new TrenchContract();
        tc.setContract("ca3");
        tc.setCount(1);
        tc.persist();
        java.util.List<TrenchContract> list = svc.getContracts();
        TrenchContract result = list.stream().filter(c -> "ca3".equals(c.getContract())).findFirst().orElse(null);
        assertNotNull(result);
        assertNull(result.getFirstCallerMarketCap());
    }

    @Test
    void testGetLatestCallersForContract() {
        // Setup test data
        String contract = "test-contract";
        String caller1 = "caller1";
        String caller2 = "caller2";
        String caller3 = "caller3";

        // Create test callers with different timestamps
        TrenchContractCaller tcCaller1 = new TrenchContractCaller();
        tcCaller1.setContract(contract);
        tcCaller1.setCaller(caller1);
        tcCaller1.setCalledAt(System.currentTimeMillis() - 10000); // 10 seconds ago
        tcCaller1.setMarketCapAtCall(1000000.0);
        tcCaller1.setDomainAtCall("testdomain1");
        tcCaller1.persist();

        TrenchContractCaller tcCaller2 = new TrenchContractCaller();
        tcCaller2.setContract(contract);
        tcCaller2.setCaller(caller2);
        tcCaller2.setCalledAt(System.currentTimeMillis() - 5000); // 5 seconds ago
        tcCaller2.setMarketCapAtCall(2000000.0);
        tcCaller2.setDomainAtCall("testdomain2");
        tcCaller2.persist();

        TrenchContractCaller tcCaller3 = new TrenchContractCaller();
        tcCaller3.setContract(contract);
        tcCaller3.setCaller(caller3);
        tcCaller3.setCalledAt(System.currentTimeMillis()); // Most recent
        tcCaller3.setMarketCapAtCall(3000000.0);
        tcCaller3.setDomainAtCall("testdomain3");
        tcCaller3.persist();

        TrenchService svc = new TrenchService();

        // Test getting latest callers (should be ordered by timestamp descending)
        List<TrenchContractCaller> latestCallers = svc.getLatestCallersForContract(contract, 3);

        assertEquals(3, latestCallers.size());
        assertEquals(caller3, latestCallers.get(0).getCaller()); // Most recent first
        assertEquals(caller2, latestCallers.get(1).getCaller());
        assertEquals(caller1, latestCallers.get(2).getCaller()); // Oldest last

        // Test with limit
        List<TrenchContractCaller> limitedCallers = svc.getLatestCallersForContract(contract, 2);
        assertEquals(2, limitedCallers.size());
        assertEquals(caller3, limitedCallers.get(0).getCaller());
        assertEquals(caller2, limitedCallers.get(1).getCaller());
    }

    @Test
    void testAddRecordsCallerHistory() {
        TrenchService svc = new TrenchService();
        svc.coinGeckoService = new CoinGeckoService() {
            @Override
            public Double fetchMarketCap(String contract) {
                return 5000000.0;
            }
        };

        String publicKey = "test-caller";
        String contract = "test-contract-callers";
        String domain = "testdomain";

        // Add a call
        svc.add(publicKey, contract, "website", "model1", domain);

        // Verify that caller history was recorded
        List<TrenchContractCaller> callers = svc.getLatestCallersForContract(contract, 10);
        assertEquals(1, callers.size());

        TrenchContractCaller caller = callers.get(0);
        assertEquals(contract, caller.getContract());
        assertEquals(publicKey, caller.getCaller());
        assertEquals(5000000.0, caller.getMarketCapAtCall());
        assertEquals(domain, caller.getDomainAtCall());
        assertTrue(caller.getCalledAt() > 0);

        // Add another call from different user
        svc.add("test-caller-2", contract, "website", "model2", domain);

        // Verify both callers are recorded
        List<TrenchContractCaller> allCallers = svc.getLatestCallersForContract(contract, 10);
        assertEquals(2, allCallers.size());

        // The most recent should be first
        assertEquals("test-caller-2", allCallers.get(0).getCaller());
        assertEquals(publicKey, allCallers.get(1).getCaller());
    }

    @Test
    void testGetLatestCallersForNonExistentContract() {
        TrenchService svc = new TrenchService();

        List<TrenchContractCaller> callers = svc.getLatestCallersForContract("non-existent-contract", 10);

        assertNotNull(callers);
        assertTrue(callers.isEmpty());
    }
}
