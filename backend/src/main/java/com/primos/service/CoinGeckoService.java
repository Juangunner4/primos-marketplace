package com.primos.service;

import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

@ApplicationScoped
public class CoinGeckoService {
    private static final Logger LOG = Logger.getLogger(CoinGeckoService.class.getName());
    private static final String BASE_URL = "https://api.coingecko.com/api/v3";
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private static final int MAX_RETRIES = 5;
    private static final long RETRY_DELAY_MS = 1_000;

    /**
     * Fetch current USD market cap for a token using CoinGecko's simple token price
     * API.
     * 
     * @param contract Token contract address
     * @return Market cap in USD, or null if unavailable
     */
    public Double fetchMarketCap(String contract) {
        LOG.log(java.util.logging.Level.INFO, "Starting market cap fetch for contract: {0}", contract);

        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            LOG.log(java.util.logging.Level.INFO, "Market cap fetch attempt {0}/{1} for contract: {2}",
                    new Object[] { attempt + 1, MAX_RETRIES, contract });

            Double marketCap = fetchMarketCapOnce(contract);
            if (marketCap != null) {
                LOG.log(java.util.logging.Level.INFO,
                        "Successfully fetched market cap on attempt {0}: {1} for contract: {2}",
                        new Object[] { attempt + 1, marketCap, contract });
                return marketCap;
            }

            if (attempt < MAX_RETRIES - 1) {
                LOG.log(java.util.logging.Level.INFO, "Market cap fetch failed, retrying in {0}ms...", RETRY_DELAY_MS);
                try {
                    Thread.sleep(RETRY_DELAY_MS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    LOG.log(java.util.logging.Level.WARNING, "Market cap fetch interrupted for contract: {0}",
                            contract);
                    break;
                }
            }
        }

        LOG.log(java.util.logging.Level.WARNING, "Failed to fetch market cap after {0} attempts for contract: {1}",
                new Object[] { MAX_RETRIES, contract });
        return null;
    }

    /**
     * Perform a single HTTP request to CoinGecko for the given contract.
     */
    protected Double fetchMarketCapOnce(String contract) {
        // Determine platform based on contract format
        String platform = contract.startsWith("0x") ? "ethereum" : "solana";
        String url = BASE_URL + "/simple/token_price/" + platform + "?contract_addresses=" + contract
                + "&vs_currencies=usd&include_market_cap=true";

        LOG.log(java.util.logging.Level.INFO, "Fetching market cap for contract: {0} on platform: {1}",
                new Object[] { contract, platform });

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());

            LOG.log(java.util.logging.Level.INFO, "CoinGecko response status: {0}, body: {1}",
                    new Object[] { resp.statusCode(), resp.body() });

            if (resp.statusCode() != 200) {
                LOG.log(java.util.logging.Level.WARNING, "CoinGecko HTTP status {0} for contract {1}",
                        new Object[] { resp.statusCode(), contract });
                return null;
            }
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                JsonObject obj = reader.readObject();
                JsonObject token = obj.getJsonObject(contract.toLowerCase());
                if (token == null) {
                    token = obj.getJsonObject(contract);
                }
                if (token != null && token.containsKey("usd_market_cap")) {
                    Double marketCap = token.getJsonNumber("usd_market_cap").doubleValue();
                    LOG.log(java.util.logging.Level.INFO, "Successfully fetched market cap: {0} for contract: {1}",
                            new Object[] { marketCap, contract });
                    return marketCap;
                } else {
                    LOG.log(java.util.logging.Level.WARNING, "No market cap data found for contract: {0}", contract);
                }
            }
        } catch (Exception e) {
            LOG.log(java.util.logging.Level.WARNING, "Error fetching CoinGecko market cap for contract {0}: {1}",
                    new Object[] { contract, e.getMessage() });
        }
        return null;
    }
}
