package com.primos.resource;

import com.primos.model.Transaction;
import com.primos.service.TransactionService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class TransactionResourceTest {
    @Test
    public void testRecordTransaction() {
        TransactionResource res = new TransactionResource();
        // Manually inject service
        res.service = new TransactionService();
        TransactionDTO dto = new TransactionDTO();
        dto.txId = "sig1";
        dto.mint = "mint1";
        dto.buyer = "buyer1";
        dto.collection = "primos";
        dto.source = "magiceden";
        dto.timestamp = "2024-01-01T00:00:00Z";
        res.recordTx(dto);
        Transaction tx = Transaction.find("txId", "sig1").firstResult();
        assertNotNull(tx);
        assertEquals("buyer1", tx.getBuyer());
    }
}
