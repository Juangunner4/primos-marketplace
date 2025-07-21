package com.primos.service;

import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Logger;

import com.primos.model.TelegramData;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

@ApplicationScoped
public class CoingeckoService {
    private static final Logger LOG = Logger.getLogger(CoingeckoService.class.getName());
    private static final String API_BASE = System.getenv().getOrDefault("COINGECKO_API_BASE",
            "https://api.coingecko.com/api/v3");
    // API key for CoinGecko, set via environment variable
    private static final String COINGECKO_API_KEY = System.getenv().getOrDefault("COINGECKO_API_KEY", "");
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
            } catch (Exception e) {
                // Failed to configure proxy, falling back to default client
                LOG.log(java.util.logging.Level.FINE, "Proxy configuration failed: {0}", e.getMessage());
            }
        }
        return HttpClient.newHttpClient();
    }

    public TelegramData fetchTokenData(String contract) {
        String url = API_BASE + "/coins/solana/contract/" + contract
                + "?x_cg_demo_api_key=" + COINGECKO_API_KEY;
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                LOG.log(java.util.logging.Level.WARNING, "Coingecko HTTP status {0}", resp.statusCode());
                return null;
            }
            // Parse response and populate data
            JsonObject root;
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                root = reader.readObject();
            }
            JsonObject market = root.getJsonObject("market_data");
            if (market == null) {
                return null;
            }
            TelegramData data = new TelegramData();
            data.setTokenAddress(contract);
            if (market.containsKey("current_price")) {
                data.setPriceUsd(market.getJsonObject("current_price").getJsonNumber("usd").doubleValue());
            }
            if (market.containsKey("fully_diluted_valuation")) {
                data.setFdvUsd(market.getJsonObject("fully_diluted_valuation").getJsonNumber("usd").doubleValue());
            }
            if (market.containsKey("total_volume")) {
                data.setVolume24hUsd(market.getJsonObject("total_volume").getJsonNumber("usd").doubleValue());
            }
            if (market.containsKey("price_change_percentage_1h_in_currency")) {
                data.setChange1hPercent(market.getJsonObject("price_change_percentage_1h_in_currency")
                        .getJsonNumber("usd").doubleValue());
            }
            // Extract first ticker info
            JsonArray tickers = root.getJsonArray("tickers");
            if (tickers != null && !tickers.isEmpty()) {
                JsonObject t = tickers.getJsonObject(0);
                data.setTickerBase(t.getString("base", ""));
                data.setTickerTarget(t.getString("target", ""));
                JsonObject mkt = t.getJsonObject("market");
                data.setTickerMarketName(mkt.getString("name", ""));
                data.setTickerMarketIdentifier(mkt.getString("identifier", ""));
                data.setHasTradingIncentive(mkt.getBoolean("has_trading_incentive", false));
            }
            // Fetch top holders count
            populateTopHolders(data, contract);
            return data;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            LOG.log(java.util.logging.Level.WARNING, "Coingecko fetch interrupted: {0}", ie.getMessage());
            return null;
        } catch (java.io.IOException ioe) {
            LOG.log(java.util.logging.Level.WARNING, "IO error fetching Coingecko data: {0}", ioe.getMessage());
            return null;
        } catch (Exception e) {
            LOG.log(java.util.logging.Level.WARNING, "Error parsing Coingecko response: {0}", e.getMessage());
            return null;
        }
    }

    // Helper to fetch and set top holders count
    private void populateTopHolders(TelegramData data, String contract) {
        String holdersUrl = API_BASE + "/onchain/networks/solana/tokens/" + contract +
                "/top_holders?x_cg_demo_api_key=" + COINGECKO_API_KEY;
        HttpRequest holdersReq = HttpRequest.newBuilder()
                .uri(URI.create(holdersUrl))
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> holdersResp = CLIENT.send(holdersReq, HttpResponse.BodyHandlers.ofString());
            if (holdersResp.statusCode() == 200) {
                try (JsonReader hr = Json.createReader(new StringReader(holdersResp.body()))) {
                    JsonObject hrObj = hr.readObject();
                    JsonArray hArr = hrObj.getJsonArray("holders");
                    if (hArr != null) {
                        data.setTopHolders(hArr.size());
                    }
                }
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            LOG.log(java.util.logging.Level.FINE, "Top holders fetch interrupted: {0}", ie.getMessage());
        } catch (java.io.IOException ioe) {
            LOG.log(java.util.logging.Level.FINE, "Top holders fetch IO failed: {0}", ioe.getMessage());
        }
    }
}
