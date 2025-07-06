package com.primos.resource;

import com.primos.model.Primo3D;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class Primo3DResourceTest {
    @Test
    public void testCreateAndFetch() {
        Primo3DResource res = new Primo3DResource();
        Primo3D req = new Primo3D();
        req.setTokenAddress("tok1");
        req.setName("Primo #1");
        req.setImage("img");
        Primo3D created = res.renderPrimo("user", req);
        assertNotNull(created);
        Primo3D fetched = res.get("tok1");
        assertEquals("tok1", fetched.getTokenAddress());
        assertEquals("Primo #1", fetched.getName());
    }
}
