package com.primos.service;

import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

@ApplicationScoped
public class HeliusService {
    private static final Logger LOG = Logger.getLogger(HeliusService.class.getName());
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
            } catch (Exception ignored) {
            }
        }
        return HttpClient.newHttpClient();
    }

    /**
     * Retrieves the number of NFTs from the Primos collection owned by the given
     * wallet.
     *
     * @param wallet the wallet address to query
     * @return the count of NFTs or 0 on failure
     */
    public int getPrimoCount(String wallet) {
        if (API_KEY == null || API_KEY.isEmpty() || wallet == null || wallet.isEmpty()) {
            LOG.info("Helius API key or wallet missing");
            return 0;
        }
        LOG.info(() -> "Fetching Primo count for wallet: " + wallet);
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
                    if (result == null)
                        break;
                    JsonArray items = result.getJsonArray("items");
                    if (items == null)
                        break;
                    total += items.size();
                    if (items.size() < limit) {
                        break;
                    }
                    page++;
                }
            }
            final int count = total;
            LOG.info(() -> "Helius returned count: " + count);
            return count;
        } catch (Exception e) {
            LOG.warning("Failed to fetch Primo count for wallet " + wallet + ": " + e.getMessage());
            return 0;
        }
    }

    /**
     * Retrieves all wallet addresses holding NFTs from the Primos collection.
     *
     * @return map of wallet address to number of NFTs held
     */
    public Map<String, Integer> getPrimoHolders() {
        Map<String, Integer> holders = new HashMap<>();
        int limit = 1000;
        int offset = 0;
        try {
            while (true) {
                String url = String.format(
                        "https://api-mainnet.magiceden.dev/v2/collections/%s/holders?offset=%d&limit=%d",
                        COLLECTION, offset, limit);
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .GET()
                        .build();
                HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() != 200) {
                    break;
                }
                try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                    JsonArray arr = reader.readArray();
                    if (arr.isEmpty()) {
                        break;
                    }
                    for (int i = 0; i < arr.size(); i++) {
                        JsonObject obj = arr.getJsonObject(i);
                        String address = obj.getString("address", null);
                        int count = obj.getInt("count", 0);
                        if (address != null) {
                            holders.put(address, count);
                        }
                    }
                    if (arr.size() < limit) {
                        break;
                    }
                    offset += limit;
                }
            }
        } catch (Exception e) {
            LOG.warning("Failed to fetch Primo holders: " + e.getMessage());
        }
        return holders;
    }

    /**
     * Fetches fungible SPL tokens held by a specific wallet address using the
     * Helius DAS endpoint. NFT-like assets are skipped by ensuring the token has
     * decimals and a balance greater than one.
     *
     * @param walletAddress The wallet address to query
     * @return List of token mint addresses held by the wallet
     */
    public List<String> getTokensForWallet(String walletAddress) {
        List<String> tokens = new ArrayList<>();

        if (API_KEY == null || API_KEY.isEmpty() || walletAddress == null || walletAddress.isEmpty()) {
            LOG.info("Helius API key or wallet address missing");
            return tokens;
        }

        try {
            String url = String.format("https://api.helius.xyz/v0/addresses/%s/tokens?api-key=%s", walletAddress, API_KEY);
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();

            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() != 200) {
                LOG.warning("Failed to fetch tokens for wallet " + walletAddress + ": HTTP " + resp.statusCode());
                return tokens;
            }

            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                JsonArray items = reader.readArray();
                for (int i = 0; i < items.size(); i++) {
                    JsonObject item = items.getJsonObject(i);
                    int decimals = item.getInt("decimals", 0);
                    String amount = item.get("amount") != null ? item.get("amount").toString().replace("\"", "") : "0";

                    // Skip NFT-like assets (no decimals or single supply)
                    if (decimals == 0 || "1".equals(amount)) {
                        continue;
                    }

                    String mint = item.getString("mint", null);
                    if (mint != null && !mint.isEmpty()) {
                        tokens.add(mint);
                    }
                }
            }

            LOG.info(() -> "Found " + tokens.size() + " tokens for wallet: " + walletAddress);
            return tokens;

        } catch (Exception e) {
            LOG.warning("Failed to fetch tokens for wallet " + walletAddress + ": " + e.getMessage());
            return tokens;
        }
    }
}
