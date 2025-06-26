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
import java.net.ProxySelector;
import java.net.InetSocketAddress;

/**
 * Proxy endpoint that fetches collection activity from the Magic Eden API.
 */
@Path("/api/magiceden/activities")
@Produces(MediaType.APPLICATION_JSON)
public class ActivityResource {

    private static final String API_BASE = "https://api-mainnet.magiceden.dev";
    private static final String COLLECTION = System.getenv().getOrDefault("REACT_APP_PRIMOS_COLLECTION", "primos");
    private static final HttpClient CLIENT = createClient();

    private static HttpClient createClient() {
        String proxy = System.getenv("https_proxy");
        if (proxy == null || proxy.isEmpty()) {
            proxy = System.getenv("HTTPS_PROXY");
        }
        if (proxy != null && !proxy.isEmpty()) {
            try {
                URI uri = URI.create(proxy);
                return HttpClient.newBuilder()
                        .proxy(ProxySelector.of(new InetSocketAddress(uri.getHost(), uri.getPort())))
                        .build();
            } catch (Exception ignored) {
            }
        }
        return HttpClient.newHttpClient();
    }

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
        String body = resp.body();
        if (resp.statusCode() != 200 || body == null || body.isBlank()) {
            return Json.createArrayBuilder().build();
        }
        try (JsonReader reader = Json.createReader(new StringReader(body))) {
            return reader.readArray();
        } catch (Exception e) {
            return Json.createArrayBuilder().build();
        }
    }
}
