package com.primos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.primos.model.Transaction;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

public class TransactionAnalyticsTest {
    @Test
    void sumsConfirmedTransactionsWithinWindow() {
        Transaction confirmedRecent = new Transaction();
        confirmedRecent.setStatus("confirmed");
        confirmedRecent.setTimestamp(Instant.now().toString());
        confirmedRecent.setSolSpent(2.5);

        Transaction confirmedOld = new Transaction();
        confirmedOld.setStatus("confirmed");
        confirmedOld.setTimestamp(Instant.now().minusSeconds(60 * 60 * 48).toString());
        confirmedOld.setSolSpent(5.0);

        Transaction pending = new Transaction();
        pending.setStatus("pending");
        pending.setTimestamp(Instant.now().toString());
        pending.setPrice(10.0);

        double volume = TransactionAnalytics.volumeLast24h(
                Stream.of(confirmedRecent, confirmedOld, pending),
                Instant.now().minusSeconds(60 * 60 * 24));

        assertEquals(2.5, volume);
    }

    @Test
    void fallsBackToPriceWhenSolSpentMissing() {
        Transaction tx = new Transaction();
        tx.setStatus("confirmed");
        tx.setTimestamp(Instant.now().toString());
        tx.setPrice(3.75);

        double volume = TransactionAnalytics.volumeLast24h(Stream.of(tx), Instant.now().minusSeconds(10));
        assertEquals(3.75, volume);
    }
}
