package com.primos.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import java.io.StringReader;
import java.net.URI;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@ApplicationScoped
public class HeliusService {
    private static final String API_KEY = System.getenv("REACT_APP_HELIUS_API_KEY");
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
            } catch (Exception ignored) {}
        }
        return HttpClient.newHttpClient();
    }

    /**
     * Retrieves the number of NFTs from the Primos collection owned by the given wallet.
     *
     * @param wallet the wallet address to query
     * @return the count of NFTs or 0 on failure
     */
    public int getPrimoCount(String wallet) {
        if (API_KEY == null || API_KEY.isEmpty() || wallet == null || wallet.isEmpty()) {
            return 0;
        }
        try {
            int page = 1;
            int limit = 100;
            int total = 0;
            while (true) {
                String body = String.format(
                        "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"searchAssets\",\"params\":{\"ownerAddress\":\"%s\",\"grouping\":[\"collection\",\"%s\"],\"tokenType\":\"regularNft\",\"page\":%d,\"limit\":%d}}",
                        wallet, COLLECTION, page, limit);
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create("https://mainnet.helius-rpc.com/?api-key=" + API_KEY))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();
                HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() != 200) {
                    break;
                }
                try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                    JsonObject obj = reader.readObject();
                    JsonObject result = obj.getJsonObject("result");
                    if (result == null) break;
                    JsonArray items = result.getJsonArray("items");
                    if (items == null) break;
                    total += items.size();
                    if (items.size() < limit) {
                        break;
                    }
                    page++;
                }
            }
            return total;
        } catch (Exception e) {
            return 0;
        }
    }
}
