package com.weys.service;

import com.weys.model.Notification;
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

        svc.delete(n.id);
        assertNull(Notification.findById(n.id));

        svc.add("user", "msg1");
        svc.add("user", "msg2");
        svc.deleteAll("user");
        assertEquals(0, svc.forUser("user").size());
    }
}
