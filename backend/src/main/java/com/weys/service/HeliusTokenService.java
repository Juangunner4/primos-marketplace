package com.weys.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Logger;

import com.weys.model.TelegramData;

@ApplicationScoped
public class HeliusTokenService {
    private static final Logger LOG = Logger.getLogger(HeliusTokenService.class.getName());
    private static final String API_BASE = System.getenv().getOrDefault("HELIUS_API_BASE", "https://api.helius.xyz");
    private static final String API_KEY = System.getenv("HELIUS_API_KEY");
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

    public TelegramData fetchTokenData(String contract) {
        if (API_KEY == null || API_KEY.isEmpty()) {
            return null;
        }
        String url = API_BASE + "/v0/token-metadata?api-key=" + API_KEY;
        String body = "{\"mintAccounts\":[\"" + contract + "\"]}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                LOG.log(java.util.logging.Level.FINE, "Helius HTTP status {0}", resp.statusCode());
                return null;
            }
            JsonArray arr;
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                arr = reader.readArray();
            }
            if (arr.isEmpty()) return null;
            JsonObject token = arr.getJsonObject(0);
            TelegramData data = new TelegramData();
            data.setTokenAddress(contract);
            if (token.containsKey("price")) {
                data.setPriceUsd(token.getJsonNumber("price").doubleValue());
            }
            if (token.containsKey("marketCap")) {
                data.setMarketCap(token.getJsonNumber("marketCap").doubleValue());
            }
            if (token.containsKey("volume24h")) {
                data.setVolume24hUsd(token.getJsonNumber("volume24h").doubleValue());
            }
            if (token.containsKey("priceChange1h")) {
                data.setChange1hPercent(token.getJsonNumber("priceChange1h").doubleValue());
            }
            if (token.containsKey("fdv")) {
                data.setFdvUsd(token.getJsonNumber("fdv").doubleValue());
            }
            if (token.containsKey("holders")) {
                data.setHolders(token.getInt("holders"));
            }
            if (token.containsKey("buys24h")) {
                data.setBuys24h(token.getInt("buys24h"));
            } else if (token.containsKey("buyCount24h")) {
                data.setBuys24h(token.getInt("buyCount24h"));
            }
            return data;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            LOG.log(java.util.logging.Level.WARNING, "Helius fetch interrupted: {0}", ie.getMessage());
            return null;
        } catch (java.io.IOException ioe) {
            LOG.log(java.util.logging.Level.WARNING, "IO error fetching Helius data: {0}", ioe.getMessage());
            return null;
        } catch (Exception e) {
            LOG.log(java.util.logging.Level.WARNING, "Error parsing Helius response: {0}", e.getMessage());
            return null;
        }
    }
}
