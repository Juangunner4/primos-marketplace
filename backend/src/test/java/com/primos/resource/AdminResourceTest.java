package com.primos.resource;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import com.primos.model.BetaCode;

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
}
