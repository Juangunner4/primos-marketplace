package com.primos.service;

import java.time.LocalDate;
import java.util.List;

import com.primos.model.User;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PointsResetJob {

    // Run every day at 10AM server time (ensure server is set to Eastern Time if
    // needed)
    @Scheduled(cron = "0 0 10 * * ?")
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
