package com.weys.service;

import com.weys.model.Transaction;
import java.time.Instant;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Pure analytics helpers extracted from {@link TransactionService}. These
 * helpers have no external dependencies and are therefore easy to unit test.
 */
public final class TransactionAnalytics {
    private TransactionAnalytics() {
    }

    public static double volumeLast24h(Stream<Transaction> transactions, Instant cutoff) {
        return transactions
                .filter(t -> "confirmed".equalsIgnoreCase(t.getStatus()))
                .filter(t -> isAfterCutoff(t, cutoff))
                .mapToDouble(TransactionAnalytics::extractAmount)
                .sum();
    }

    private static boolean isAfterCutoff(Transaction tx, Instant cutoff) {
        if (tx.getTimestamp() == null) {
            return false;
        }
        try {
            Instant ts = Instant.parse(tx.getTimestamp());
            return ts.isAfter(cutoff);
        } catch (Exception e) {
            return false;
        }
    }

    private static double extractAmount(Transaction tx) {
        Double solSpent = tx.getSolSpent();
        if (solSpent != null) {
            return solSpent;
        }
        return Objects.requireNonNullElse(tx.getPrice(), 0.0);
    }
}
