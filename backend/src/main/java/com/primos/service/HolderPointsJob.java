package com.primos.service;

import java.time.LocalDate;
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
        awardHolderPointsToAllUsers();
    }

    public void awardHolderPointsToAllUsers() {
        String today = LocalDate.now().toString();
        List<User> users = User.listAll();

        // Check if holder points have already been awarded today
        boolean alreadyAwarded = users.stream()
                .anyMatch(user -> today.equals(user.getPointsDate()) && user.getHolderPointsToday() > 0);

        if (alreadyAwarded) {
            LOG.info("Holder points already awarded today, skipping");
            return;
        }

        if (LOG.isLoggable(java.util.logging.Level.INFO)) {
            LOG.info(String.format("Starting holder points award process for %d users", users.size()));
        }

        for (User user : users) {
            try {
                int count = heliusService.getPrimoCount(user.getPublicKey());
                user.setNftCount(count);
                user.setPrimoHolder(count > 0);
                user.setDaoMember(count > 0);

                // Reset daily points if it's a new day
                if (!today.equals(user.getPointsDate())) {
                    user.setPointsDate(today);
                    user.setPointsToday(0);
                    user.setIconPointsToday(0);
                    user.setHolderPointsToday(0);
                }

                if (count > 0) { // Only award points to holders
                    int multiplier = 1 + count / 5;
                    int add = 18 * multiplier;
                    int remaining = PointService.MAX_POINTS_PER_DAY - user.getPointsToday();
                    int toAdd = Math.clamp(add, 0, remaining);

                    user.setPoints(user.getPoints() + toAdd);
                    user.setPointsToday(user.getPointsToday() + toAdd);
                    user.setHolderPointsToday(user.getHolderPointsToday() + toAdd);

                    if (LOG.isLoggable(java.util.logging.Level.INFO)) {
                        LOG.info(String.format("Awarded %d holder points to user %s (NFT count: %d)",
                                toAdd, user.getPublicKey(), count));
                    }
                }

                user.persistOrUpdate();
            } catch (Exception e) {
                LOG.severe(String.format("Failed to award holder points to user %s: %s",
                        user.getPublicKey(), e.getMessage()));
            }
        }
        LOG.info("Completed holder points award process");
    }
}
