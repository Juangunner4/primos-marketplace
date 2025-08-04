package com.primos.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

public class UserTest {
    @Test
    public void testDefaultValues() {
        User user = new User();
        assertEquals(0, user.getPoints());
        assertEquals(0, user.getPointsToday());
        assertNotNull(user.getPointsDate());
        assertEquals(1, user.getPesos());
        assertNotNull(user.getSocials());
        assertEquals("", user.getSocials().getSlingshot());
        assertEquals("", user.getSocials().getAxiom());
        assertEquals("", user.getSocials().getVector());
        assertFalse(user.isPrimoHolder());
        assertTrue(user.isDaoMember());
    }
}
