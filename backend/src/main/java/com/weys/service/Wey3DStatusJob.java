package com.weys.service;

import com.weys.model.Wey3D;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.scheduler.Scheduled;
import java.util.List;

@ApplicationScoped
public class Wey3DStatusJob {
    @Inject Wey3DService weyService;
    @Inject NotificationService notifications;

    @Scheduled(every = "60s")
    void poll() {
        List<Wey3D> jobs = Wey3D.list("status", "IN_PROGRESS");
        for (Wey3D p : jobs) {
            weyService.updateStatus(p);
            if ("COMPLETED".equalsIgnoreCase(p.getStatus()) && p.getStlUrl() != null) {
                notifications.add(p.getTokenAddress(), "3D render completed for " + p.getName());
            }
        }
    }
}
