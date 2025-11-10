package com.primos.service;

import java.time.LocalDate;
import java.util.logging.Logger;

import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class PointService {
    private static final Logger LOGGER = Logger.getLogger(PointService.class.getName());
    public static final int MAX_POINTS_PER_DAY = 1000;
    public static final int MAX_ICON_POINTS_PER_DAY = 4;

    public User addPoint(String publicKey, String walletKey) {
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(
                    String.format("[PointService] Called for publicKey: %s with walletKey: %s", publicKey, walletKey));
        }
        if (walletKey == null || !walletKey.equals(publicKey)) {
            LOGGER.warning("[PointService] Forbidden: walletKey missing or does not match publicKey");
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) {
            if (LOGGER.isLoggable(java.util.logging.Level.WARNING)) {
                LOGGER.warning(String.format("[PointService] User not found for publicKey: %s", publicKey));
            }
            throw new NotFoundException();
        }
        String today = LocalDate.now().toString();
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[PointService] User %s, today: %s, user.pointsDate: %s, user.pointsToday: %d",
                    publicKey, today, user.getPointsDate(), user.getPointsToday()));
        }
        // Note: Daily points reset is now handled globally in LoginService when first
        // user logs in
        // Individual users no longer reset their own points here
        if (user.getPointsToday() >= MAX_POINTS_PER_DAY) {
            if (LOGGER.isLoggable(java.util.logging.Level.WARNING)) {
                LOGGER.warning(String.format("[PointService] Daily limit reached for user: %s", publicKey));
            }
            throw new BadRequestException("Daily limit reached");
        }
        if (user.getIconPointsToday() >= MAX_ICON_POINTS_PER_DAY) {
            if (LOGGER.isLoggable(java.util.logging.Level.WARNING)) {
                LOGGER.warning(
                        String.format("[PointService] Daily icon limit reached for user: %s", publicKey));
            }
            throw new BadRequestException("Daily icon limit reached");
        }
        user.setPoints(user.getPoints() + 1);
        user.setPointsToday(user.getPointsToday() + 1);
        user.setIconPointsToday(user.getIconPointsToday() + 1);
        user.persistOrUpdate();
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format(
                    "[PointService] Updated points: %d, pointsToday: %d, iconPointsToday: %d for user: %s",
                    user.getPoints(), user.getPointsToday(), user.getIconPointsToday(), publicKey));
        }
        return user;
    }
}
