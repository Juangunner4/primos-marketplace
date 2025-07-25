package com.primos.service;

import java.util.List;
import java.util.logging.Logger;

import com.primos.model.User;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class HolderPointsJob {
    private static final Logger LOG = Logger.getLogger(HolderPointsJob.class.getName());

    private final HeliusService heliusService;

    @Inject
    public HolderPointsJob(HeliusService heliusService) {
        this.heliusService = heliusService;
    }

    @Scheduled(cron = "0 0 10 * * ?")
    void awardHolderPoints() {
        List<User> users = User.listAll();
        for (User user : users) {
            int count = heliusService.getPrimoCount(user.getPublicKey());
            user.setNftCount(count);
            user.setPrimoHolder(count > 0);
            user.setDaoMember(count > 0);
            int multiplier = 1 + count / 5;
            int add = 18 * multiplier;
            user.setPoints(user.getPoints() + add);
            user.persistOrUpdate();
        }
        LOG.info("Awarded holder points to all users");
    }
}
