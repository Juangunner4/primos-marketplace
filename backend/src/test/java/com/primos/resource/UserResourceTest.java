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

    @Test
    public void testLoginCreatesUserWithHolderFlag() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "dummy";
        req.primoHolder = true;
        com.primos.model.User user = resource.login(req);
        assertNotNull(user);
        assertTrue(user.isPrimoHolder());
        assertTrue(user.isDaoMember());
    }

    @Test
    public void testGetDaoMembers() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "member";
        req.primoHolder = true;
        resource.login(req);
        java.util.List<com.primos.model.User> members = resource.getDaoMembers();
        assertFalse(members.isEmpty());
    }

    @Test
    public void testGetUserRequiresHeader() {
        UserResource resource = new UserResource();
        assertThrows(jakarta.ws.rs.ForbiddenException.class,
                () -> resource.getUser("somekey", null));
    }
}
