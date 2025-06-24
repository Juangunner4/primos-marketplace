package com.primos.service;

import java.time.LocalDate;
import java.util.List;

import com.primos.model.User;
import java.util.logging.Logger;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PointsResetJob {
    private static final Logger LOG = Logger.getLogger(PointsResetJob.class.getName());

    @SuppressWarnings("unused")
    @Scheduled(cron = "0 0 10 * * ?")
    void resetDailyPoints() {
        String today = LocalDate.now().toString();
        List<User> users = User.listAll();
        for (User user : users) {
            user.setPointsToday(0);
            user.setPointsDate(today);
            user.persistOrUpdate();
        }
        LOG.info("Reset daily points for all users");
    }
}
