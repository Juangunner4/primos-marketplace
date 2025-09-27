package com.weys.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.weys.model.User;

public class HolderPointsJobTest {
    @Test
    public void testAwardHolderPoints() {
        User user = new User();
        user.setPublicKey("holder");
        user.setPoints(10);
        user.persist();

        HeliusService heliusService = new HeliusService() {
            @Override
            public Map<String, Integer> getWeyHolders() {
                Map<String, Integer> map = new HashMap<>();
                map.put("holder", 7); // multiplier 2
                return map;
            }
        };

        HolderPointsJob job = new HolderPointsJob(heliusService);
        job.awardHolderPointsToAllUsers();

        User updated = User.find("publicKey", "holder").firstResult();
        assertNotNull(updated);
        assertEquals(10 + 36, updated.getPoints());
    }
}
