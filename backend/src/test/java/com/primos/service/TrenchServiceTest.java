package com.primos.service;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class TrenchServiceTest {
    @Test
    public void testAddIncrementsCounts() {
        TrenchService svc = new TrenchService();
        svc.add("u1", "ca1", "website", null);
        assertThrows(jakarta.ws.rs.BadRequestException.class, () -> svc.add("u1", "ca1", "website", null));
        svc.add("u2", "ca1", "website", null);

        TrenchContract tc = TrenchContract.find("contract", "ca1").firstResult();
        assertEquals(2, tc.getCount());

        TrenchUser u1 = TrenchUser.find("publicKey", "u1").firstResult();
        assertEquals(1, u1.getCount());
        assertTrue(u1.getContracts().contains("ca1"));
        TrenchUser u2 = TrenchUser.find("publicKey", "u2").firstResult();
        assertEquals(1, u2.getCount());
    }
}
