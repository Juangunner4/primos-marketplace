package com.primos.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UserTest {
    @Test
    public void testDefaultValues() {
        User user = new User();
        assertEquals(0, user.getPoints());
        assertEquals(1000, user.getPesos());
        assertNotNull(user.getSocials());
        assertFalse(user.isPrimoHolder());
        assertTrue(user.isDaoMember());
    }
}
