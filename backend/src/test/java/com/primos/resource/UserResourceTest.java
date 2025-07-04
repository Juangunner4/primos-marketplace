package com.primos.resource;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UserResourceTest {
    @Test
    public void testLoginMissingPublicKey() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "";
        req.betaCode = "ANY";
        assertThrows(jakarta.ws.rs.BadRequestException.class, () -> resource.login(req));
    }

    @Test
    public void testLoginCreatesUserWithHolderFlag() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "dummy";
        req.primoHolder = true;
        com.primos.model.BetaCode code = new com.primos.model.BetaCode();
        code.setCode("B1");
        code.persist();
        req.betaCode = "B1";
        com.primos.model.User user = resource.login(req);
        assertNotNull(user);
        assertTrue(user.isPrimoHolder());
        assertTrue(user.isDaoMember());
    }

    @Test
    public void testSecondLoginDoesNotRequireBetaCode() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "again";
        com.primos.model.BetaCode code = new com.primos.model.BetaCode();
        code.setCode("B10");
        code.persist();
        req.betaCode = "B10";
        resource.login(req);

        LoginRequest second = new LoginRequest();
        second.publicKey = "again";
        com.primos.model.User user = resource.login(second);
        assertNotNull(user);
        assertNull(com.primos.model.BetaCode.find("code", "B10").firstResult());
    }

    @Test
    public void testGetUserForbiddenWithoutHeader() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "dummy1";
        com.primos.model.BetaCode code = new com.primos.model.BetaCode();
        code.setCode("B2");
        code.persist();
        req.betaCode = "B2";
        resource.login(req);
        assertThrows(jakarta.ws.rs.ForbiddenException.class,
                () -> resource.getUser("dummy1", null));
    }

    @Test
    public void testGetUserWithHeader() {
        UserResource resource = new UserResource();
        LoginRequest req = new LoginRequest();
        req.publicKey = "dummy2";
        com.primos.model.BetaCode code = new com.primos.model.BetaCode();
        code.setCode("B3");
        code.persist();
        req.betaCode = "B3";
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
        com.primos.model.BetaCode code = new com.primos.model.BetaCode();
        code.setCode("B4");
        code.persist();
        req.betaCode = "B4";
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
        com.primos.model.BetaCode code = new com.primos.model.BetaCode();
        code.setCode("B5");
        code.persist();
        req.betaCode = "B5";
        resource.login(req);
        for (int i = 0; i < 4; i++) {
            com.primos.model.User u = resource.addPoint("pointy", "pointy");
            assertEquals(i + 1, u.getPoints());
        }
        assertThrows(jakarta.ws.rs.BadRequestException.class,
                () -> resource.addPoint("pointy", "pointy"));
    }
}
