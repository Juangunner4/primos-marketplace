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
    private static final String API_BASE = System.getenv().getOrDefault("MESHY_API_BASE", "https://api.meshy.ai");
    private static final String API_KEY = System.getenv().getOrDefault("MESHY_API_KEY", "");
    private final HttpClient client = HttpClient.newHttpClient();

    public String startRender(String imageUrl) {
        try {
            // ...
            String payload = Json.createObjectBuilder().add("image_url", imageUrl).build().toString();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE + "/openapi/v1/image-to-3d"))
                    .header("Authorization", "Bearer " + API_KEY)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                try (JsonReader reader = Json.createReader(new StringReader(res.body()))) {
                    JsonObject obj = reader.readObject();
                    // Meshy docs: response has "job_id" field
                    return obj.getString("job_id", null);
                }
            } else if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy startRender failed: HTTP {0} - {1}",
                        new Object[] { res.statusCode(), res.body() });
            }
        } catch (java.io.IOException e) {
            if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy startRender IOException: {0}", e.getMessage());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy startRender InterruptedException: {0}", e.getMessage());
            }
        } catch (Exception e) {
            if (LOG.isLoggable(java.util.logging.Level.WARNING)) {
                LOG.log(java.util.logging.Level.WARNING, "Meshy startRender Exception: {0}", e.getMessage());
            }
        }
        return null;
    }

    public RenderStatus checkStatus(String jobId) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE + "/v1/jobs/" + jobId))
                    .header("Authorization", "Bearer " + API_KEY)
                    .build();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                try (JsonReader reader = Json.createReader(new StringReader(res.body()))) {
                    JsonObject obj = reader.readObject();
                    String status = obj.getString("status", "");
                    String url = obj.getString("output_url", null);
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

    public record RenderStatus(String status, String url) {
    }
}
