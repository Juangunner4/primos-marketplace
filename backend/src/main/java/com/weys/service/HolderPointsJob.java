package com.weys.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import com.weys.model.User;

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

    @Scheduled(cron = "0 0 20 * * ?", timeZone = "America/New_York")
    void awardHolderPoints() {
        awardHolderPointsToAllUsers();
    }

    public void awardHolderPointsToAllUsers() {
        String today = LocalDate.now().toString();
        Map<String, Integer> holderMap = heliusService.getWeyHolders();

        // Ensure all holders exist in the database
        holderMap.keySet().forEach(address -> {
            if (User.find("publicKey", address).firstResult() == null) {
                User newUser = new User();
                newUser.setPublicKey(address);
                newUser.setWeyHolder(true);
                newUser.setDaoMember(true);
                newUser.persist();
            }
        });

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
                int count = holderMap.getOrDefault(user.getPublicKey(), 0);
                boolean isHolder = count > 0;
                user.setNftCount(count);
                user.setWeyHolder(isHolder);
                user.setDaoMember(isHolder);

                // Reset daily points counts for new day
                user.setPointsDate(today);
                user.setPointsToday(0);
                user.setIconPointsToday(0);
                user.setHolderPointsToday(0);

                if (isHolder) {
                    int toAdd = PointCalculator.holderAward(count);

                    user.setPoints(user.getPoints() + toAdd);
                    user.setPointsToday(toAdd);
                    user.setHolderPointsToday(toAdd);

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
