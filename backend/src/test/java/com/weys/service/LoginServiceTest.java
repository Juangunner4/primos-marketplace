package com.weys.service;

import static org.junit.jupiter.api.Assertions.*;

import com.weys.model.User;
import com.weys.resource.LoginRequest;
import org.junit.jupiter.api.Test;

public class LoginServiceTest {
    @Test
    public void testAdminLoginCreatesUser() {
        LoginService service = new LoginService();
        LoginRequest req = new LoginRequest();
        req.publicKey = AdminServiceTestConstants.ADMIN;
        User admin = service.login(req);
        assertNotNull(admin);
        assertEquals(req.publicKey, admin.getPublicKey());
        assertTrue(admin.isDaoMember());
    }

    @Test
    public void testMissingPublicKeyThrows() {
        LoginService service = new LoginService();
        LoginRequest req = new LoginRequest();
        assertThrows(jakarta.ws.rs.BadRequestException.class, () -> service.login(req));
    }
}

class AdminServiceTestConstants {
    static final String ADMIN = com.weys.resource.AdminResource.ADMIN_WALLET;
}
