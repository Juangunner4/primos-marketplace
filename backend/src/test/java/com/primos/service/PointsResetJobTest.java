package com.primos.service;

import static org.junit.jupiter.api.Assertions.*;

import com.primos.model.User;
import org.junit.jupiter.api.Test;

public class PointsResetJobTest {
    @Test
    public void testResetDailyPoints() {
        User user = new User();
        user.setPublicKey("test");
        user.setPointsToday(3);
        user.persist();

        PointsResetJob job = new PointsResetJob();
        job.resetDailyPoints();

        User updated = User.find("publicKey", "test").firstResult();
        assertNotNull(updated);
        assertEquals(0, updated.getPointsToday());
    }
}
