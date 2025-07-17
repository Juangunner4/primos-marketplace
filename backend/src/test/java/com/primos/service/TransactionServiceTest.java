package com.primos.service;

import com.primos.model.Transaction;
import com.primos.resource.TransactionDTO;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class TransactionServiceTest {
    @Test
    public void testRecordTransaction() {
        TransactionService svc = new TransactionService();
        TransactionDTO dto = new TransactionDTO();
        dto.txId = "abc123";
        dto.mint = "mint2";
        dto.buyer = "buyer2";
        dto.collection = "primos";
        dto.source = "magiceden";
        dto.timestamp = "2024-01-02T00:00:00Z";
        Transaction tx = svc.recordTransaction(dto);
        assertNotNull(tx.getId());
        assertEquals("abc123", tx.getTxId());
        Transaction stored = Transaction.find("txId", "abc123").firstResult();
        assertNotNull(stored);
    }
}
