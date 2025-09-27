package com.weys.service;

import static org.junit.jupiter.api.Assertions.*;

import com.weys.model.User;
import org.junit.jupiter.api.Test;

public class PointsResetJobTest {
    @Test
    public void testResetDailyPoints() {
        User user = new User();
        user.setPublicKey("test");
        user.setPointsToday(3);
        user.setPointsDate("2000-01-01");
        user.persist();

        PointsResetJob job = new PointsResetJob();
        job.resetDailyPoints();

        User updated = User.find("publicKey", "test").firstResult();
        assertNotNull(updated);
        assertEquals(0, updated.getPointsToday());
        assertEquals(java.time.LocalDate.now().toString(), updated.getPointsDate());
    }
}
