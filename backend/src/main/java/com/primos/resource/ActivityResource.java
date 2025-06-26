package com.primos.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonReader;
import java.io.StringReader;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Proxy endpoint that fetches collection activity from the Magic Eden API.
 */
@Path("/api/magiceden/activities")
@Produces(MediaType.APPLICATION_JSON)
public class ActivityResource {

    private static final String API_BASE = "https://api-mainnet.magiceden.dev";
    private static final String COLLECTION = System.getenv().getOrDefault("REACT_APP_PRIMOS_COLLECTION", "primos");
    private static final HttpClient CLIENT = HttpClient.newHttpClient();

    @GET
    public Response getActivities(@QueryParam("offset") int offset,
                                  @QueryParam("limit") int limit) throws IOException, InterruptedException {
        JsonArray data = fetchFromMagicEden(offset, limit);
        return Response.ok(data).build();
    }

    private JsonArray fetchFromMagicEden(int offset, int limit) throws IOException, InterruptedException {
        String url = String.format("%s/v2/collections/%s/activities?offset=%d&limit=%d", API_BASE, COLLECTION, offset, limit);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        String body = resp.body() == null ? "[]" : resp.body();
        try (JsonReader reader = Json.createReader(new StringReader(body))) {
            return reader.readArray();
        }
    }
}
