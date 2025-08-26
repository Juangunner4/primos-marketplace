package com.primos.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.ProxySelector;
import java.net.InetSocketAddress;

/**
 * Simple proxy endpoint that forwards requests to the Magic Eden API. This is
 * used when the frontend is deployed on the same host as the backend (e.g.
 * Render) and serverless functions are unavailable.
 */
@Path("/api/proxy")
@Produces(MediaType.APPLICATION_JSON)
public class MagicEdenProxyResource {

    private static final String API_BASE = "https://api-mainnet.magiceden.dev";
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
    @Path("{path: .+}")
    public Response proxy(@PathParam("path") String path, @Context UriInfo uriInfo)
            throws IOException, InterruptedException {
        // Reconstruct the target URI including any query parameters so that
        // pagination and other Magic Eden features function correctly.
        String query = uriInfo.getRequestUri().getQuery();
        String target = API_BASE + "/" + path + (query != null ? "?" + query : "");

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(target))
                .GET()
                .build();

        HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());

        // Some platforms strip CORS headers from 304 responses, so return 200 instead
        int status = resp.statusCode() == 304 ? 200 : resp.statusCode();
        return Response.status(status).entity(resp.body()).build();
    }
}
