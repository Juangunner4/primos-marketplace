package com.weys.service;

import com.weys.model.Transaction;
import com.weys.resource.TransactionDTO;
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
        dto.collection = "weys";
        dto.source = "magiceden";
        dto.timestamp = "2024-01-02T00:00:00Z";
        Transaction tx = svc.recordTransaction(dto);
        assertNotNull(tx.getId());
        assertEquals("abc123", tx.getTxId());
        assertNull(tx.getSolSpent());
        Transaction stored = Transaction.find("txId", "abc123").firstResult();
        assertNotNull(stored);
    }

    @Test
    public void testVolumeLast24h() {
        TransactionService svc = new TransactionService();
        Transaction t = new Transaction();
        t.setTxId("txv1");
        t.setBuyer("b");
        t.setMint("m");
        t.setCollection("c");
        t.setSource("s");
        t.setTimestamp(java.time.Instant.now().toString());
        t.setStatus("confirmed");
        t.setPrice(1e9);
        t.setSolSpent(1e9);
        t.persist();
        double vol = svc.volumeLast24h();
        assertEquals(1e9, vol);
    }
}
