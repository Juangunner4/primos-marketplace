package com.primos.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import jakarta.json.JsonReader;

@ApplicationScoped
public class MeshyService {
    private static final String API_BASE = System.getenv().getOrDefault("MESHY_API_BASE", "https://api.meshy.ai");
    private static final String API_KEY = System.getenv().getOrDefault("MESHY_API_KEY", "");
    private final HttpClient client = HttpClient.newHttpClient();

    public String startRender(String imageUrl) {
        try {
            String payload = Json.createObjectBuilder().add("image", imageUrl).build().toString();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE + "/v1/one_click/2dto3d"))
                    .header("Authorization", "Bearer " + API_KEY)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                try (JsonReader reader = Json.createReader(new StringReader(res.body()))) {
                    JsonObject obj = reader.readObject();
                    return obj.getString("job_id", null);
                }
            }
        } catch (Exception ignored) {
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
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public record RenderStatus(String status, String url) {}
}
