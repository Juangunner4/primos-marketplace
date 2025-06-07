package com.primos.resource;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UserResourceTest {
    @Test
    public void testLoginMissingPublicKey() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "";
        assertThrows(jakarta.ws.rs.BadRequestException.class, () -> resource.login(req));
    }
}
