package com.weys.service;

import com.weys.model.Wey3D;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class Wey3DService {

    @Inject
    MeshyService meshy;

    @Inject
    NotificationService notifications;

    public Wey3D create(String publicKey, Wey3D wey) {
        Wey3D existing = Wey3D.find("tokenAddress", wey.getTokenAddress()).firstResult();
        if (existing != null) {
            return existing;
        }
        String job = meshy.startRender(wey.getImage());
        wey.setJobId(job);
        wey.setStatus(job == null ? "ERROR" : "IN_PROGRESS");
        wey.persist();
        if (publicKey != null) {
            notifications.add(publicKey, "3D rendering started for " + wey.getName());
        }
        return wey;
    }

    public void updateStatus(Wey3D wey) {
        if (wey.getJobId() == null) return;
        MeshyService.RenderStatus status = meshy.checkStatus(wey.getJobId());
        if (status != null && !status.status().equals(wey.getStatus())) {
            wey.setStatus(status.status());
            if (status.url() != null) {
                wey.setStlUrl(status.url());
            }
            wey.persistOrUpdate();
        }
    }
}
