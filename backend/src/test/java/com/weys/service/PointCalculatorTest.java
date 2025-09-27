package com.weys.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

public class PointCalculatorTest {
    @Test
    void awardsZeroForNonHolders() {
        assertEquals(0, PointCalculator.holderAward(0));
        assertEquals(0, PointCalculator.holderAward(-1));
    }

    @Test
    void awardsBasePointsForSmallHolders() {
        assertEquals(18, PointCalculator.holderAward(1));
        assertEquals(18, PointCalculator.holderAward(4));
    }

    @Test
    void increasesMultiplierEveryFiveTokens() {
        assertEquals(36, PointCalculator.holderAward(5));
        assertEquals(54, PointCalculator.holderAward(10));
    }

    @Test
    void clampsToDailyMaximum() {
        assertEquals(PointService.MAX_POINTS_PER_DAY, PointCalculator.holderAward(1000));
    }
}
