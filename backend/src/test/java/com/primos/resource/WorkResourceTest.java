package com.primos.resource;

import com.primos.model.WorkRequest;
import com.primos.service.WorkRequestService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;

public class WorkResourceTest {
    @Test
    public void testCreateAndList() {
        WorkResource res = new WorkResource();
        res.service = new WorkRequestService();
        WorkRequest req = new WorkRequest();
        req.setDescription("paint a primo");
        res.create("collector1", req);
        List<WorkRequest> list = res.list(null);
        assertEquals(1, list.size());
        assertEquals("collector1", list.get(0).getRequester());
    }
}
