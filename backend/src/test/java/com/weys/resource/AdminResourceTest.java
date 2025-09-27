package com.weys.resource;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import com.weys.model.BetaCode;

public class AdminResourceTest {

    @Test
    public void testAccessDenied() {
        AdminResource res = new AdminResource();
        assertThrows(jakarta.ws.rs.ForbiddenException.class, () -> res.listCodes(null));
    }

    @Test
    public void testCreateCode() {
        AdminResource res = new AdminResource();
        BetaCode code = res.createCode(AdminResource.ADMIN_WALLET);
        assertNotNull(code.getCode());
        assertFalse(code.getCode().isEmpty());
        assertTrue(BetaCode.count() > 0);
    }

    @Test
    public void testListActiveCodes() {
        AdminResource res = new AdminResource();
        BetaCode code = res.createCode(AdminResource.ADMIN_WALLET);
        java.util.List<BetaCode> codes = res.listActiveCodes(AdminResource.ADMIN_WALLET);
        assertFalse(codes.isEmpty());
        assertTrue(codes.stream().anyMatch(c -> c.getCode().equals(code.getCode())));
    }

    @Test
    public void testListInactiveCodes() {
        AdminResource res = new AdminResource();
        BetaCode code = res.createCode(AdminResource.ADMIN_WALLET);
        code.setRedeemed(true);
        code.persistOrUpdate();
        java.util.List<BetaCode> codes = res.listInactiveCodes(AdminResource.ADMIN_WALLET);
        assertTrue(codes.stream().anyMatch(c -> c.getCode().equals(code.getCode())));
    }

    @Test
    public void testStats() {
        com.weys.model.User.deleteAll();
        BetaCode.deleteAll();
        AdminResource res = new AdminResource();
        com.weys.model.User u = new com.weys.model.User();
        u.setPublicKey("u1");
        u.setPoints(5);
        u.setWeyHolder(true);
        u.persist();
        BetaCode b = res.createCode(AdminResource.ADMIN_WALLET);
        b.setRedeemed(true);
        b.persistOrUpdate();

        AdminResource.Stats stats = res.getStats(AdminResource.ADMIN_WALLET);
        assertEquals(1, stats.totalWallets());
        assertEquals(5, stats.totalPoints());
        assertEquals(1, stats.weyHolders());
        assertEquals(1, stats.betaCodes());
        assertEquals(1, stats.betaCodesRedeemed());
    }
}
