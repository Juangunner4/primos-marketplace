package com.primos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

import com.primos.model.User;

public class HolderPointsJobTest {
    @Test
    public void testAwardHolderPoints() {
        User user = new User();
        user.setPublicKey("holder");
        user.setNftCount(7); // multiplier 2
        user.setPoints(10);
        user.persist();

        HeliusService heliusService = new HeliusService(); // or mock as needed
        HolderPointsJob job = new HolderPointsJob(heliusService);
        job.awardHolderPoints();

        User updated = User.find("publicKey", "holder").firstResult();
        assertNotNull(updated);
        assertEquals(10 + 36, updated.getPoints());
    }
}
