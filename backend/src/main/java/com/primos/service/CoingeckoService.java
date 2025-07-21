package com.primos.service;

import com.primos.model.TelegramData;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import java.io.StringReader;
import java.net.URI;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Logger;

@ApplicationScoped
public class CoingeckoService {
    private static final Logger LOG = Logger.getLogger(CoingeckoService.class.getName());
    private static final String API_BASE = System.getenv().getOrDefault("COINGECKO_API_BASE",
            "https://api.coingecko.com/api/v3");
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

    public TelegramData fetchTokenData(String contract) {
        try {
            String url = API_BASE + "/coins/solana/contract/" + contract;
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                LOG.warning("Coingecko response status: " + resp.statusCode());
                return null;
            }
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                JsonObject obj = reader.readObject();
                JsonObject market = obj.getJsonObject("market_data");
                if (market == null) {
                    return null;
                }
                TelegramData data = new TelegramData();
                data.setTokenAddress(contract);
                JsonObject priceObj = market.getJsonObject("current_price");
                if (priceObj != null && priceObj.containsKey("usd")) {
                    data.setPriceUsd(priceObj.getJsonNumber("usd").doubleValue());
                }
                JsonObject fdvObj = market.getJsonObject("fully_diluted_valuation");
                if (fdvObj != null && fdvObj.containsKey("usd")) {
                    data.setFdvUsd(fdvObj.getJsonNumber("usd").doubleValue());
                }
                JsonObject volObj = market.getJsonObject("total_volume");
                if (volObj != null && volObj.containsKey("usd")) {
                    data.setVolume24hUsd(volObj.getJsonNumber("usd").doubleValue());
                }
                JsonObject changeObj = market.getJsonObject("price_change_percentage_1h_in_currency");
                if (changeObj != null && changeObj.containsKey("usd")) {
                    data.setChange1hPercent(changeObj.getJsonNumber("usd").doubleValue());
                }
                return data;
            }
        } catch (Exception e) {
            LOG.warning("Failed to fetch Coingecko data: " + e.getMessage());
            return null;
        }
    }
}
