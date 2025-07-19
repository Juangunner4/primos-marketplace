package com.primos.service;

import com.primos.model.WorkRequest;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class WorkRequestService {
    public WorkRequest add(String requester, String description) {
        WorkRequest w = new WorkRequest();
        w.setRequester(requester);
        w.setDescription(description);
        w.persist();
        return w;
    }

    public List<WorkRequest> list() {
        return WorkRequest.listAll();
    }
}
