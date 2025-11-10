package com.primos.service;

import com.primos.model.Transaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.scheduler.Scheduled;
import java.util.List;

@ApplicationScoped
public class TransactionStatusJob {
    @Inject TransactionService service;

    @Scheduled(every = "60s")
    void poll() {
        List<Transaction> pending = Transaction.list("status", "pending");
        for (Transaction tx : pending) {
            service.updateStatus(tx);
        }
    }
}
