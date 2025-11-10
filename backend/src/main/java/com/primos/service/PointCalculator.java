package com.primos.service;

/**
 * Small utility used to encapsulate the math behind awarding points to
 * holders. Extracting this logic makes it easy to validate in isolation
 * without requiring access to the persistence layer.
 */
public final class PointCalculator {
    private PointCalculator() {
    }

    /**
     * Calculates the number of points a holder should receive based on the
     * number of NFTs held.
     *
     * @param nftCount how many NFTs the user currently owns
     * @return the number of points to award, clamped to the daily maximum
     */
    public static int holderAward(int nftCount) {
        if (nftCount <= 0) {
            return 0;
        }
        int multiplier = 1 + nftCount / 5;
        int calculated = 18 * multiplier;
        return Math.clamp(calculated, 0, PointService.MAX_POINTS_PER_DAY);
    }
}
