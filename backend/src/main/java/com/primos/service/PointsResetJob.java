package com.primos.service;

import com.primos.model.User;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class PointsResetJob {

    // Run every day at 10AM Eastern Time
    @Scheduled(cron = "0 0 10 * * ?", timezone = "America/New_York")
    void resetDailyPoints() {
        String today = LocalDate.now().toString();
        List<User> users = User.listAll();
        for (User user : users) {
            user.setPointsToday(0);
            user.setPointsDate(today);
            user.persistOrUpdate();
        }
    }
}
