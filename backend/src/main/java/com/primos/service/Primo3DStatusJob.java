package com.primos.service;

import com.primos.model.Primo3D;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.scheduler.Scheduled;
import java.util.List;

@ApplicationScoped
public class Primo3DStatusJob {
    @Inject Primo3DService primoService;
    @Inject NotificationService notifications;

    @Scheduled(every = "60s")
    void poll() {
        List<Primo3D> jobs = Primo3D.list("status", "IN_PROGRESS");
        for (Primo3D p : jobs) {
            primoService.updateStatus(p);
            if ("COMPLETED".equalsIgnoreCase(p.getStatus()) && p.getStlUrl() != null) {
                notifications.add(p.getTokenAddress(), "3D render completed for " + p.getName());
            }
        }
    }
}
