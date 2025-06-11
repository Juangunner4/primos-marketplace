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
    public void testGetUserForbiddenWithoutHeader() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "dummy1";
        resource.login(req);
        assertThrows(jakarta.ws.rs.ForbiddenException.class,
                () -> resource.getUser("dummy1", null));
    }

    @Test
    public void testGetUserWithHeader() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "dummy2";
        resource.login(req);
        com.primos.model.User user = resource.getUser("dummy2", "dummy2");
        assertNotNull(user);
    }

    @Test
    public void testGetDaoMembers() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "member";
        req.primoHolder = true;
        resource.login(req);
        java.util.List<com.primos.model.User> members = resource.getDaoMembers("member");
        assertFalse(members.isEmpty());
    }

    @Test
    public void testGetDaoMembersForbiddenWithoutHeader() {
        UserResource resource = new UserResource();
        assertThrows(jakarta.ws.rs.ForbiddenException.class, () -> resource.getDaoMembers(null));
    }

    @Test
    public void testAddPointIncrementsUntilLimit() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "pointy";
        resource.login(req);
        for (int i = 0; i < 4; i++) {
            com.primos.model.User u = resource.addPoint("pointy", "pointy");
            assertEquals(i + 1, u.getPoints());
        }
        assertThrows(jakarta.ws.rs.BadRequestException.class,
                () -> resource.addPoint("pointy", "pointy"));
    }
}
