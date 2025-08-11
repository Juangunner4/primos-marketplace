package com.primos.service;

import java.time.LocalDate;
import java.util.logging.Logger;

import com.primos.model.BetaCode;
import com.primos.model.User;
import com.primos.resource.AdminResource;
import com.primos.resource.LoginRequest;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class LoginService {
    private static final Logger LOGGER = Logger.getLogger(LoginService.class.getName());
    private static final String PUBLIC_KEY_FIELD = "publicKey";
    private static final String ADMIN_WALLET = AdminResource.ADMIN_WALLET;

    @Inject
    HeliusService heliusService;

    @Inject
    HolderPointsJob holderPointsJob;

    public User login(LoginRequest req) {
        validateLoginRequest(req);

        // Check if this is the first login of the day and reset all users if needed
        // This must be done BEFORE any user updates to avoid interference
        resetDailyPointsForAllUsersIfFirstLogin();

        boolean holder = req.primoHolder;
        boolean isAdminWallet = ADMIN_WALLET.equals(req.publicKey);
        // Admin wallet bypass: always created and logged in without beta code
        if (isAdminWallet) {
            User adminUser = User.find(PUBLIC_KEY_FIELD, req.publicKey).firstResult();
            if (adminUser == null) {
                adminUser = createNewUser(req.publicKey, true);
                adminUser.setBetaRedeemed(true);
            } else {
                adminUser.setBetaRedeemed(true);
            }
            adminUser.persistOrUpdate();
            return adminUser;
        }

        User user = User.find(PUBLIC_KEY_FIELD, req.publicKey)
                .firstResult();
        if (user == null) {
            validateBetaCodeOrThrow(req.betaCode);
            // If beta code was provided, treat user as primo holder
            boolean newHolder = holder || (req.betaCode != null && !req.betaCode.isEmpty());
            user = createNewUser(req.publicKey, newHolder);
            user.setBetaRedeemed(true);
            if (req.betaCode != null && !req.betaCode.isEmpty()) {
                user.setBetaCode(req.betaCode);
            }
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] Created new user for publicKey: %s", req.publicKey));
            }
        } else {
            updateHolderStatus(user, holder);
            if (!user.isBetaRedeemed() && req.betaCode != null && !req.betaCode.isEmpty()) {
                // Redeemed a beta code: grant betaRedeemed, primoHolder, and store code
                validateBetaCodeOrThrow(req.betaCode);
                user.setBetaRedeemed(true);
                user.setPrimoHolder(true);
                user.setBetaCode(req.betaCode);
            }
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] User already exists for publicKey: %s", req.publicKey));
            }
        }
        user.persistOrUpdate();

        boolean wasHolder = user.isPrimoHolder();

        // Update NFT count from the blockchain on each login
        int count = heliusService.getPrimoCount(user.getPublicKey());
        user.setNftCount(count);
        boolean isHolder = count > 0;
        updateHolderStatus(user, isHolder);

        if (isHolder && !wasHolder) {
            user.setPointsToday(0);
            user.setIconPointsToday(0);
            user.setHolderPointsToday(0);
            user.setPointsDate(LocalDate.now().toString());
            user.persistOrUpdate();
        }

        // Trigger holder points job on login - it will only execute once per day
        holderPointsJob.awardHolderPointsToAllUsers();

        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            if (user.isPrimoHolder()) {
                LOGGER.info(String.format("[LoginService] Primo holder login for publicKey: %s", req.publicKey));
            } else {
                LOGGER.info(String.format("[LoginService] Non-primo login for publicKey: %s", req.publicKey));
            }
        }
        if (user.getDomain() != null && user.getDomain().endsWith(".sol")) {
            user.addBadge("sns");
            user.persistOrUpdate();
        }
        if (user.getSocials() != null) {
            User.SocialLinks links = user.getSocials();
            if ((links.getSlingshot() != null && !links.getSlingshot().isEmpty())
                    || (links.getAxiom() != null && !links.getAxiom().isEmpty())
                    || (links.getVector() != null && !links.getVector().isEmpty())) {
                user.addBadge("trader");
                user.persistOrUpdate();
            }
        }

        // Ensure current user's date is updated (will be current after reset if first
        // login)
        String today = LocalDate.now().toString();
        if (!today.equals(user.getPointsDate())) {
            user.setPointsDate(today);
            user.setPointsToday(0);
            user.setIconPointsToday(0);
            user.setHolderPointsToday(0);
        }
        user.persistOrUpdate();
        return user;
    }

    private void validateLoginRequest(LoginRequest req) {
        if (req == null || req.publicKey == null || req.publicKey.isEmpty()) {
            LOGGER.info("[LoginService] Login attempt with missing publicKey");
            throw new BadRequestException("publicKey is required");
        }
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[LoginService] Login attempt for publicKey: %s", req.publicKey));
        }
    }

    private void validateBetaCodeOrThrow(String betaCode) {
        if (betaCode == null || betaCode.isEmpty()) {
            LOGGER.info("[LoginService] Missing beta code for new user");
            throw new ForbiddenException();
        }
        BetaCode beta = BetaCode.find("code", betaCode).firstResult();
        if (beta == null) {
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] Invalid beta code: %s", betaCode));
            }
            throw new ForbiddenException();
        }
        // Mark beta code as redeemed
        beta.setRedeemed(true);
        beta.persistOrUpdate();
    }

    private User createNewUser(String publicKey, boolean holder) {
        User user = new User();
        user.setPublicKey(publicKey);
        user.setBio("");
        user.setSocials(new User.SocialLinks());
        user.setPfp("");
        user.setDomain("");
        user.setPoints(0);
        user.setPesos(1);
        user.setCreatedAt(System.currentTimeMillis());
        user.setDaoMember(holder);
        user.setPrimoHolder(holder);
        user.setArtTeam(false);
        user.setWorkGroups(new java.util.ArrayList<>());
        return user;
    }

    private void updateHolderStatus(User user, boolean holder) {
        user.setPrimoHolder(holder);
        if (holder && !user.isDaoMember()) {
            user.setDaoMember(true);
        }
        if (!holder && user.isDaoMember()) {
            user.setDaoMember(false);
        }
        user.persistOrUpdate();
    }

    /**
     * Checks if this is the first login of the day and resets daily points for all
     * users if needed.
     * This ensures that when the first user logs in for a new day, all users' daily
     * points are reset to 0.
     */
    private void resetDailyPointsForAllUsersIfFirstLogin() {
        String today = LocalDate.now().toString();

        // Always log this regardless of log level to debug the issue
        System.out.println("[LoginService] DEBUGGING: Checking for first login of the day: " + today);

        // Check if any user already has today's date (meaning someone already logged in
        // today)
        User existingTodayUser = User.find("pointsDate", today).firstResult();

        // Always log this regardless of log level
        System.out.println("[LoginService] DEBUGGING: Found existing user with today's date: " +
                (existingTodayUser != null ? existingTodayUser.getPublicKey() : "NONE"));

        if (existingTodayUser == null) {
            // This is the first login of the day - reset all users' daily points
            System.out.println("[LoginService] DEBUGGING: FIRST LOGIN OF THE DAY (" + today
                    + ") - resetting daily points for all users");

            java.util.List<User> allUsers = User.listAll();
            System.out.println("[LoginService] DEBUGGING: Found " + allUsers.size() + " total users to reset");

            int resetCount = 0;
            for (User user : allUsers) {
                String oldDate = user.getPointsDate();
                int oldPointsToday = user.getPointsToday();
                int oldIconPointsToday = user.getIconPointsToday();
                int oldHolderPointsToday = user.getHolderPointsToday();

                user.setPointsDate(today);
                user.setPointsToday(0);
                user.setIconPointsToday(0);
                user.setHolderPointsToday(0);
                user.persistOrUpdate();
                resetCount++;

                System.out.println("[LoginService] DEBUGGING: Reset user " + user.getPublicKey() +
                        ": date " + oldDate + "->" + today +
                        ", points " + oldPointsToday + "->0" +
                        ", icon " + oldIconPointsToday + "->0" +
                        ", holder " + oldHolderPointsToday + "->0");
            }

            System.out.println(
                    "[LoginService] DEBUGGING: *** COMPLETED: Reset daily points for " + resetCount + " users ***");
        } else {
            System.out.println("[LoginService] DEBUGGING: Not first login of the day (" + today +
                    ") - user " + existingTodayUser.getPublicKey() + " already has today's date");
        }

        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[LoginService] Checking for first login of the day: %s", today));
        }

        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[LoginService] Found existing user with today's date: %s",
                    existingTodayUser != null ? existingTodayUser.getPublicKey() : "NONE"));
        }

        if (existingTodayUser == null) {
            // This is the first login of the day - reset all users' daily points
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format(
                        "[LoginService] FIRST LOGIN OF THE DAY (%s) - resetting daily points for all users", today));
            }

            java.util.List<User> allUsers = User.listAll();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[LoginService] Found %d total users to reset", allUsers.size()));
            }

            int resetCount = 0;
            for (User user : allUsers) {
                String oldDate = user.getPointsDate();
                int oldPointsToday = user.getPointsToday();
                int oldIconPointsToday = user.getIconPointsToday();
                int oldHolderPointsToday = user.getHolderPointsToday();

                user.setPointsDate(today);
                user.setPointsToday(0);
                user.setIconPointsToday(0);
                user.setHolderPointsToday(0);
                user.persistOrUpdate();
                resetCount++;

                if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                    LOGGER.info(String.format(
                            "[LoginService] Reset user %s: date %s->%s, points %d->0, icon %d->0, holder %d->0",
                            user.getPublicKey(), oldDate, today, oldPointsToday, oldIconPointsToday,
                            oldHolderPointsToday));
                }
            }

            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(
                        String.format("[LoginService] *** COMPLETED: Reset daily points for %d users ***", resetCount));
            }
        } else {
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format(
                        "[LoginService] Not first login of the day (%s) - user %s already has today's date",
                        today, existingTodayUser.getPublicKey()));
            }
        }
    }
}
