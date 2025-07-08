package com.primos.service;

import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

@ApplicationScoped
public class MeshyService {
    private static final Logger LOG = Logger.getLogger(MeshyService.class.getName());
    private static final String API_KEY = System.getenv().getOrDefault("MESHY_API_KEY", "");
    private static final String APPLICATION_JSON = "application/json";
    private static final String MESHY_API_URL = "https://api.meshy.xyz/openapi/v1/image-to-3d";
    private final HttpClient client = HttpClient.newHttpClient();

    // Refactor startRender to properly catch interrupts and IO separately, use
    // try-with-resources, and return task ID
    public String startRender(String imageUrl) {
        // Ensure API key is set
        if (API_KEY.isBlank()) {
            LOG.warning("Meshy startRender failed: no API key configured");
            return null;
        }
        // Normalize IPFS URLs to include a .png filename for Meshy API
        String normalizedUrl = imageUrl;
        if (normalizedUrl.contains("/ipfs/") && !normalizedUrl.matches("(?i).+\\.(png|jpe?g)$")) {
            normalizedUrl = normalizedUrl
                    + (normalizedUrl.contains("?") ? "&filename=image.png" : "?filename=image.png");
        }
        // Build request payload with required and default optional parameters
        JsonObject payloadJson = Json.createObjectBuilder()
                .add("image_url", normalizedUrl)
                // Explicitly enable physically based rendering as shown in the
                // Meshy API docs
                .add("enable_pbr", true)
                .add("ai_model", "meshy-4") // default model
                .add("topology", "triangle") // default topology
                .add("target_polycount", 30000) // default polycount
                .add("symmetry_mode", "auto") // default symmetry
                .add("should_remesh", true)
                .add("should_texture", true)
                .build();
        String payload = payloadJson.toString();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(MESHY_API_URL))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Accept", APPLICATION_JSON)
                .header("Content-Type", APPLICATION_JSON)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        try {
            // Send request and get response
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy startRender HTTP {0}: {1}",
                        new Object[] { status, response.body() });
                return null;
            }
            // Parse JSON and extract 'result' field
            try (JsonReader reader = Json.createReader(new StringReader(response.body()))) {
                JsonObject json = reader.readObject();
                String taskId = json.getString("result", null);
                if (taskId == null && LOG.isLoggable(java.util.logging.Level.WARNING)) {
                    LOG.log(java.util.logging.Level.WARNING, "Meshy startRender missing 'result' in response: {0}",
                            response.body());
                }
                return taskId;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.log(java.util.logging.Level.WARNING, "Meshy startRender interrupted: {0}", e.getMessage());
        } catch (java.io.IOException e) {
            LOG.log(java.util.logging.Level.WARNING, "Meshy startRender failed: {0}", e.getMessage());
        }
        return null;
    }

    public RenderStatus checkStatus(String jobId) {
        try {
            // Meshy image-to-3d status endpoint: /openapi/v1/image-to-3d/:id
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(MESHY_API_URL + "/" + jobId))
                    .header("Authorization", "Bearer " + API_KEY)
                    .header("Accept", APPLICATION_JSON)
                    .build();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                try (JsonReader reader = Json.createReader(new StringReader(res.body()))) {
                    JsonObject obj = reader.readObject();
                    String status = obj.getString("status", "");
                    String url = extractModelUrl(obj);
                    return new RenderStatus(status, url);
                }
            } else if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy checkStatus failed: HTTP {0} - {1}",
                        new Object[] { res.statusCode(), res.body() });
            }
        } catch (java.io.IOException e) {
            if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy checkStatus IOException: {0}", e.getMessage());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy checkStatus InterruptedException: {0}", e.getMessage());
            }
        } catch (Exception e) {
            if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy checkStatus Exception: {0}", e.getMessage());
            }
        }
        return null;
    }

    private String extractModelUrl(JsonObject obj) {
        if (obj.containsKey("model_urls")) {
            JsonObject models = obj.getJsonObject("model_urls");
            // Prefer GLB but fall back to other formats
            if (models.containsKey("glb")) {
                return models.getString("glb", null);
            } else if (models.containsKey("obj")) {
                return models.getString("obj", null);
            } else if (models.containsKey("usdz")) {
                return models.getString("usdz", null);
            }
        }
        return null;
    }

    public record RenderStatus(String status, String url) {
    }
}
