package com.primos.service;

import java.util.List;
import java.util.logging.Logger;

import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.scheduler.Scheduled;

@ApplicationScoped
public class HolderPointsJob {
    private static final Logger LOG = Logger.getLogger(HolderPointsJob.class.getName());

    @Scheduled(cron = "0 0 10 * * ?")
    void awardHolderPoints() {
        List<User> users = User.listAll();
        for (User user : users) {
            int multiplier = 1 + user.getNftCount() / 5;
            int add = 18 * multiplier;
            user.setPoints(user.getPoints() + add);
            user.persistOrUpdate();
        }
        LOG.info("Awarded holder points to all users");
    }
}
