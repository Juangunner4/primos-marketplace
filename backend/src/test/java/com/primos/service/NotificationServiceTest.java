package com.primos.service;

import com.primos.model.Notification;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

public class NotificationServiceTest {
    @Test
    public void testAddAndFetch() {
        NotificationService svc = new NotificationService();
        svc.add("user", "hello");
        List<Notification> list = svc.forUser("user");
        assertEquals(1, list.size());
        Notification n = list.get(0);
        assertEquals("hello", n.getMessage());
        assertFalse(n.isRead());
        svc.markRead(n.id);
        Notification updated = Notification.findById(n.id);
        assertTrue(updated.isRead());
    }
}
