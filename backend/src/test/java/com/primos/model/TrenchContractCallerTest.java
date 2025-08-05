package com.primos.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;

class TrenchContractCallerTest {

    @Test
    void testTrenchContractCallerCreation() {
        TrenchContractCaller caller = new TrenchContractCaller();

        // Test setters and getters
        String contract = "test-contract-address";
        String callerKey = "test-caller-public-key";
        Long timestamp = System.currentTimeMillis();
        Double marketCap = 1500000.0;
        String domain = "testdomain.com";

        caller.setContract(contract);
        caller.setCaller(callerKey);
        caller.setCalledAt(timestamp);
        caller.setMarketCapAtCall(marketCap);
        caller.setDomainAtCall(domain);

        assertEquals(contract, caller.getContract());
        assertEquals(callerKey, caller.getCaller());
        assertEquals(timestamp, caller.getCalledAt());
        assertEquals(marketCap, caller.getMarketCapAtCall());
        assertEquals(domain, caller.getDomainAtCall());
    }

    @Test
    void testTrenchContractCallerDefaults() {
        TrenchContractCaller caller = new TrenchContractCaller();

        // Test default values
        assertNull(caller.getContract());
        assertNull(caller.getCaller());
        assertNull(caller.getCalledAt());
        assertNull(caller.getMarketCapAtCall());
        assertNull(caller.getDomainAtCall());
    }

    @Test
    void testTrenchContractCallerPersistence() {
        TrenchContractCaller caller = new TrenchContractCaller();
        caller.setContract("persistence-test-contract");
        caller.setCaller("persistence-test-caller");
        caller.setCalledAt(System.currentTimeMillis());
        caller.setMarketCapAtCall(2000000.0);
        caller.setDomainAtCall("persistence.test");

        // Test persistence
        caller.persist();
        assertNotNull(caller.id);

        // Test retrieval
        TrenchContractCaller retrieved = TrenchContractCaller.findById(caller.id);
        assertNotNull(retrieved);
        assertEquals(caller.getContract(), retrieved.getContract());
        assertEquals(caller.getCaller(), retrieved.getCaller());
        assertEquals(caller.getCalledAt(), retrieved.getCalledAt());
        assertEquals(caller.getMarketCapAtCall(), retrieved.getMarketCapAtCall());
        assertEquals(caller.getDomainAtCall(), retrieved.getDomainAtCall());

        // Clean up
        caller.delete();
    }

    @Test
    void testFindByContract() {
        String testContract = "find-by-contract-test";

        // Create test data
        TrenchContractCaller caller1 = new TrenchContractCaller();
        caller1.setContract(testContract);
        caller1.setCaller("caller1");
        caller1.setCalledAt(System.currentTimeMillis() - 10000);
        caller1.persist();

        TrenchContractCaller caller2 = new TrenchContractCaller();
        caller2.setContract(testContract);
        caller2.setCaller("caller2");
        caller2.setCalledAt(System.currentTimeMillis());
        caller2.persist();

        // Test find by contract
        var callers = TrenchContractCaller.<TrenchContractCaller>find("contract", testContract).list();
        assertEquals(2, callers.size());

        // Test ordered query
        var orderedCallers = TrenchContractCaller
                .<TrenchContractCaller>find("contract = ?1 order by calledAt desc", testContract).list();
        assertEquals(2, orderedCallers.size());
        assertEquals("caller2", orderedCallers.get(0).getCaller()); // Most recent first
        assertEquals("caller1", orderedCallers.get(1).getCaller());

        // Clean up
        caller1.delete();
        caller2.delete();
    }

    @Test
    void testTimestampOrdering() {
        String testContract = "timestamp-ordering-test";
        long baseTime = System.currentTimeMillis();

        // Create callers with different timestamps
        TrenchContractCaller caller1 = new TrenchContractCaller();
        caller1.setContract(testContract);
        caller1.setCaller("earliest");
        caller1.setCalledAt(baseTime - 30000); // 30 seconds ago
        caller1.persist();

        TrenchContractCaller caller2 = new TrenchContractCaller();
        caller2.setContract(testContract);
        caller2.setCaller("middle");
        caller2.setCalledAt(baseTime - 15000); // 15 seconds ago
        caller2.persist();

        TrenchContractCaller caller3 = new TrenchContractCaller();
        caller3.setContract(testContract);
        caller3.setCaller("latest");
        caller3.setCalledAt(baseTime); // Most recent
        caller3.persist();

        // Test descending order (latest first)
        var callersDesc = TrenchContractCaller
                .<TrenchContractCaller>find("contract = ?1 order by calledAt desc", testContract).list();
        assertEquals(3, callersDesc.size());
        assertEquals("latest", callersDesc.get(0).getCaller());
        assertEquals("middle", callersDesc.get(1).getCaller());
        assertEquals("earliest", callersDesc.get(2).getCaller());

        // Clean up
        caller1.delete();
        caller2.delete();
        caller3.delete();
    }
}
