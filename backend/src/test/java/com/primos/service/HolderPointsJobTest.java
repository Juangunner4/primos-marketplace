package com.primos.service;

import static org.junit.jupiter.api.Assertions.*;

import com.primos.model.User;
import org.junit.jupiter.api.Test;

public class HolderPointsJobTest {
    @Test
    public void testAwardHolderPoints() {
        User user = new User();
        user.setPublicKey("holder");
        user.setNftCount(7); // multiplier 2
        user.setPoints(10);
        user.persist();

        HolderPointsJob job = new HolderPointsJob();
        job.awardHolderPoints();

        User updated = User.find("publicKey", "holder").firstResult();
        assertNotNull(updated);
        assertEquals(10 + 36, updated.getPoints());
    }
}
