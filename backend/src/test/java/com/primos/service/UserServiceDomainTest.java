package com.primos.service;

import static org.junit.jupiter.api.Assertions.*;

import com.primos.model.User;
import org.junit.jupiter.api.Test;

public class UserServiceDomainTest {
    @Test
    public void testGetByDomain() {
        User user = new User();
        user.setPublicKey("w1");
        user.setDomain("find.sol");
        user.persist();

        UserService svc = new UserService();
        User found = svc.getByDomain("find.sol");
        assertNotNull(found);
        assertEquals("w1", found.getPublicKey());
    }
}
