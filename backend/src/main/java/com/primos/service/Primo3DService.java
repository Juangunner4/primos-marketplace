package com.primos.service;

import com.primos.model.Primo3D;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class Primo3DService {

    @Inject
    MeshyService meshy;

    @Inject
    NotificationService notifications;

    public Primo3D create(String publicKey, Primo3D primo) {
        Primo3D existing = Primo3D.find("tokenAddress", primo.getTokenAddress()).firstResult();
        if (existing != null) {
            return existing;
        }
        String job = meshy.startRender(primo.getImage());
        primo.setJobId(job);
        primo.setStatus(job == null ? "ERROR" : "IN_PROGRESS");
        primo.persist();
        if (publicKey != null) {
            notifications.add(publicKey, "3D rendering started for " + primo.getName());
        }
        return primo;
    }

    public void updateStatus(Primo3D primo) {
        if (primo.getJobId() == null) return;
        MeshyService.RenderStatus status = meshy.checkStatus(primo.getJobId());
        if (status != null && !status.status().equals(primo.getStatus())) {
            primo.setStatus(status.status());
            if (status.url() != null) {
                primo.setStlUrl(status.url());
            }
            primo.persistOrUpdate();
        }
    }
}
