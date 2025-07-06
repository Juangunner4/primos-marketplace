package com.primos.service;

import com.primos.model.Notification;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import org.bson.types.ObjectId;

@ApplicationScoped
public class NotificationService {
    public void add(String publicKey, String message) {
        Notification n = new Notification();
        n.setPublicKey(publicKey);
        n.setMessage(message);
        n.setRead(false);
        n.persist();
    }

    public List<Notification> forUser(String publicKey) {
        return Notification.list("publicKey = ?1 order by createdAt desc", publicKey);
    }

    public Notification markRead(ObjectId id) {
        Notification n = Notification.findById(id);
        if (n != null) {
            n.setRead(true);
            n.persistOrUpdate();
        }
        return n;
    }
}
