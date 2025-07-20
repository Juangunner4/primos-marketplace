package com.primos.resource;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class TrenchResourceTest {
    @Test
    public void testAddAndGet() {
        TrenchResource res = new TrenchResource();
        res.add("w1", java.util.Map.of("contract", "ca1", "source", "website"));
        TrenchResource.TrenchData data = res.get();
        assertEquals(1, data.contracts.size());
        assertEquals("ca1", data.contracts.get(0).getContract());
        assertEquals(1, data.users.size());
        assertEquals("w1", data.users.get(0).publicKey);
        assertTrue(data.users.get(0).contracts.contains("ca1"));
    }
}
