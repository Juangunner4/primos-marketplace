package com.weys.resource;

import com.weys.model.Wey3D;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class Wey3DResourceTest {
    @Test
    public void testCreateAndFetch() {
        Wey3DResource res = new Wey3DResource();
        Wey3D req = new Wey3D();
        req.setTokenAddress("tok1");
        req.setName("Wey #1");
        req.setImage("img");
        Wey3D created = res.renderWey("user", req);
        assertNotNull(created);
        Wey3D fetched = res.get("tok1");
        assertEquals("tok1", fetched.getTokenAddress());
        assertEquals("Wey #1", fetched.getName());
    }
}
