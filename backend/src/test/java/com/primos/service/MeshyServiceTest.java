package com.primos.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class MeshyServiceTest {
    @Test
    public void startRenderReturnsNullWhenApiKeyMissing() {
        MeshyService service = new MeshyService();
        String result = service.startRender("https://example.com/image.png");
        assertNull(result, "startRender should return null when API key is not configured");
    }
}
