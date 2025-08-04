package com.primos.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.logging.Logger;

@ApplicationScoped
public class CoinGeckoService {
    private static final Logger LOG = Logger.getLogger(CoinGeckoService.class.getName());
    private static final String BASE_URL = "https://api.coingecko.com/api/v3";
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Fetch current USD market cap for a token using CoinGecko's simple token price API.
     * @param contract Token contract address
     * @return Market cap in USD, or null if unavailable
     */
    public Double fetchMarketCap(String contract) {
        String url = BASE_URL + "/simple/token_price/solana?contract_addresses=" + contract
                + "&vs_currencies=usd&include_market_cap=true";
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                LOG.log(java.util.logging.Level.FINE, "CoinGecko HTTP status {0}", resp.statusCode());
                return null;
            }
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                JsonObject obj = reader.readObject();
                JsonObject token = obj.getJsonObject(contract.toLowerCase());
                if (token == null) {
                    token = obj.getJsonObject(contract);
                }
                if (token != null && token.containsKey("usd_market_cap")) {
                    return token.getJsonNumber("usd_market_cap").doubleValue();
                }
            }
        } catch (Exception e) {
            LOG.log(java.util.logging.Level.FINE, "Error fetching CoinGecko market cap: {0}", e.getMessage());
        }
        return null;
    }
}
