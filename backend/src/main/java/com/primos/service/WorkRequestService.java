package com.primos.service;

import com.primos.model.WorkRequest;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class WorkRequestService {
    public WorkRequest add(String requester, String group, String description) {
        WorkRequest w = new WorkRequest();
        w.setRequester(requester);
        w.setWorker("");
        w.setGroup(group);
        w.setDescription(description);
        w.persist();
        return w;
    }

    public WorkRequest assign(String id, String worker) {
        WorkRequest w = WorkRequest.findById(new org.bson.types.ObjectId(id));
        if (w == null) {
            throw new jakarta.ws.rs.NotFoundException();
        }
        w.setWorker(worker);
        w.persistOrUpdate();
        return w;
    }

    public List<WorkRequest> list(String group) {
        if (group == null || group.isEmpty()) {
            return WorkRequest.listAll();
        }
        return WorkRequest.list("group", group);
    }
}
