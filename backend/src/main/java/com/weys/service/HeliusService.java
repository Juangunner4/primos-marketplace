package com.weys.service;

import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;

@ApplicationScoped
public class HeliusService {
    private static final Logger LOG = Logger.getLogger(HeliusService.class.getName());
    private static final String API_KEY = System.getenv("REACT_APP_HELIUS_API_KEY");
    private static final String MORALIS_API_KEY = System.getenv("MORALIS_API_KEY");
    private static final String COLLECTION = System.getenv().getOrDefault("REACT_APP_WEYS_COLLECTION", "primos");
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
     * Retrieves the number of NFTs from the Weys collection owned by the given
     * wallet.
     *
     * @param wallet the wallet address to query
     * @return the count of NFTs or 0 on failure
     */
    public int getWeyCount(String wallet) {
        if (API_KEY == null || API_KEY.isEmpty() || wallet == null || wallet.isEmpty()) {
            LOG.info("Helius API key or wallet missing");
            return 0;
        }
        LOG.info(() -> "Fetching Wey count for wallet: " + wallet);
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
            LOG.warning("Failed to fetch Wey count for wallet " + wallet + ": " + e.getMessage());
            return 0;
        }
    }

    /**
     * Retrieves all wallet addresses holding NFTs from the Weys collection.
     *
     * @return map of wallet address to number of NFTs held
     */
    public Map<String, Integer> getWeyHolders() {
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
            LOG.warning("Failed to fetch Wey holders: " + e.getMessage());
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
            String url = String.format("https://api.helius.xyz/v0/addresses/%s/tokens?api-key=%s", walletAddress,
                    API_KEY);
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

    /**
     * Enhanced token discovery for Wey holders with comprehensive token metadata.
     * Uses multiple APIs to get enriched token information.
     *
     * @param walletAddress The wallet address to analyze
     * @return Map containing token data with metadata
     */
    public Map<String, Object> getEnhancedTokensForWallet(String walletAddress) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> enrichedTokens = new ArrayList<>();

        if (API_KEY == null || API_KEY.isEmpty() || walletAddress == null || walletAddress.isEmpty()) {
            LOG.warning("Helius API key or wallet address missing for enhanced token discovery");
            result.put("tokens", enrichedTokens);
            result.put("error", "Missing API key or wallet address");
            return result;
        }

        try {
            // Get wallet balances from Helius
            String balanceUrl = String.format("https://api.helius.xyz/v0/addresses/%s/balances?api-key=%s",
                    walletAddress, API_KEY);
            HttpRequest balanceReq = HttpRequest.newBuilder().uri(URI.create(balanceUrl)).GET().build();
            HttpResponse<String> balanceResp = CLIENT.send(balanceReq, HttpResponse.BodyHandlers.ofString());

            if (balanceResp.statusCode() != 200) {
                LOG.warning(
                        "Failed to fetch wallet balances for " + walletAddress + ": HTTP " + balanceResp.statusCode());
                result.put("tokens", enrichedTokens);
                result.put("error", "Failed to fetch wallet balances");
                return result;
            }

            try (JsonReader reader = Json.createReader(new StringReader(balanceResp.body()))) {
                JsonObject balanceData = reader.readObject();

                // Process SOL balance
                if (balanceData.containsKey("nativeBalance")) {
                    long nativeBalance = balanceData.getJsonNumber("nativeBalance").longValue();
                    if (nativeBalance > 0) {
                        Map<String, Object> solToken = createSolTokenData(nativeBalance);
                        enrichedTokens.add(solToken);
                    }
                }

                // Process SPL tokens
                if (balanceData.containsKey("tokens")) {
                    JsonArray tokens = balanceData.getJsonArray("tokens");

                    for (int i = 0; i < tokens.size(); i++) {
                        JsonObject token = tokens.getJsonObject(i);

                        // Skip NFT-like tokens (no decimals or very small amounts)
                        int decimals = token.getInt("decimals", 0);
                        long amount = token.getJsonNumber("amount").longValue();

                        if (decimals == 0 || amount <= 1) {
                            continue;
                        }

                        String mint = token.getString("mint", "");
                        if (!mint.isEmpty()) {
                            Map<String, Object> enrichedToken = enrichTokenWithMetadata(mint, amount, decimals);
                            if (enrichedToken != null) {
                                enrichedTokens.add(enrichedToken);
                            }
                        }
                    }
                }
            }

            result.put("tokens", enrichedTokens);
            result.put("walletAddress", walletAddress);
            result.put("totalTokens", enrichedTokens.size());
            LOG.info(() -> "Enhanced token discovery found " + enrichedTokens.size() + " tokens for wallet: "
                    + walletAddress);

        } catch (Exception e) {
            LOG.warning("Failed enhanced token discovery for wallet " + walletAddress + ": " + e.getMessage());
            result.put("tokens", enrichedTokens);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Creates SOL token data with metadata.
     */
    private Map<String, Object> createSolTokenData(long nativeBalance) {
        Map<String, Object> solToken = new HashMap<>();
        solToken.put("mint", "So11111111111111111111111111111111111111112");
        solToken.put("symbol", "SOL");
        solToken.put("name", "Solana");
        solToken.put("decimals", 9);
        solToken.put("balance", nativeBalance);
        solToken.put("balanceFormatted", nativeBalance / 1e9);
        solToken.put("logoURI",
                "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png");
        solToken.put("verified", true);
        solToken.put("source", "native");
        return solToken;
    }

    /**
     * Enriches token data with metadata from Jupiter API and other sources.
     */
    private Map<String, Object> enrichTokenWithMetadata(String mint, long amount, int decimals) {
        Map<String, Object> tokenData = new HashMap<>();

        try {
            // Get token info from Jupiter API
            Map<String, Object> jupiterData = getJupiterTokenInfo(mint);

            tokenData.put("mint", mint);
            tokenData.put("balance", amount);
            tokenData.put("balanceFormatted", amount / Math.pow(10, decimals));
            tokenData.put("decimals", decimals);

            if (jupiterData != null) {
                tokenData.putAll(jupiterData);
                tokenData.put("source", "jupiter");
            } else {
                // Fallback data
                tokenData.put("symbol", mint.substring(0, Math.min(8, mint.length())));
                tokenData.put("name", "Unknown Token");
                tokenData.put("verified", false);
                tokenData.put("source", "fallback");
            }

            // Add CoinGecko price data if available
            enrichWithCoinGeckoData(tokenData);

            // Add TradingView chart data for CEX-listed tokens
            enrichWithTradingViewData(tokenData);

            // Add Moralis data for tokens not covered by other APIs
            enrichWithMoralisData(tokenData);

            return tokenData;

        } catch (Exception e) {
            LOG.warning("Failed to enrich token metadata for " + mint + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Gets token information from Jupiter API.
     */
    private Map<String, Object> getJupiterTokenInfo(String mint) {
        try {
            String jupiterUrl = "https://token.jup.ag/strict";
            HttpRequest jupiterReq = HttpRequest.newBuilder().uri(URI.create(jupiterUrl)).GET().build();
            HttpResponse<String> jupiterResp = CLIENT.send(jupiterReq, HttpResponse.BodyHandlers.ofString());

            if (jupiterResp.statusCode() == 200) {
                try (JsonReader reader = Json.createReader(new StringReader(jupiterResp.body()))) {
                    JsonArray tokens = reader.readArray();

                    for (int i = 0; i < tokens.size(); i++) {
                        JsonObject token = tokens.getJsonObject(i);
                        if (mint.equals(token.getString("address", ""))) {
                            Map<String, Object> tokenInfo = new HashMap<>();
                            tokenInfo.put("symbol", token.getString("symbol", ""));
                            tokenInfo.put("name", token.getString("name", ""));
                            tokenInfo.put("logoURI", token.getString("logoURI", ""));
                            tokenInfo.put("verified", true);

                            // Check for extensions (like CoinGecko ID)
                            if (token.containsKey("extensions")) {
                                JsonObject extensions = token.getJsonObject("extensions");
                                if (extensions.containsKey("coingeckoId")) {
                                    tokenInfo.put("coingeckoId", extensions.getString("coingeckoId"));
                                }
                            }

                            return tokenInfo;
                        }
                    }
                }
            }
        } catch (Exception e) {
            LOG.warning("Failed to fetch Jupiter token info for " + mint + ": " + e.getMessage());
        }

        return null;
    }

    /**
     * Enriches token data with CoinGecko price information.
     */
    private void enrichWithCoinGeckoData(Map<String, Object> tokenData) {
        String coingeckoId = (String) tokenData.get("coingeckoId");
        if (coingeckoId == null || coingeckoId.isEmpty()) {
            return;
        }

        try {
            String geckoUrl = String.format(
                    "https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true",
                    coingeckoId);

            HttpRequest geckoReq = HttpRequest.newBuilder().uri(URI.create(geckoUrl)).GET().build();
            HttpResponse<String> geckoResp = CLIENT.send(geckoReq, HttpResponse.BodyHandlers.ofString());

            if (geckoResp.statusCode() == 200) {
                try (JsonReader reader = Json.createReader(new StringReader(geckoResp.body()))) {
                    JsonObject geckoData = reader.readObject();

                    if (geckoData.containsKey(coingeckoId)) {
                        JsonObject priceData = geckoData.getJsonObject(coingeckoId);

                        if (priceData.containsKey("usd")) {
                            tokenData.put("price", priceData.getJsonNumber("usd").doubleValue());
                        }
                        if (priceData.containsKey("usd_market_cap")) {
                            tokenData.put("marketCap", priceData.getJsonNumber("usd_market_cap").doubleValue());
                        }
                        if (priceData.containsKey("usd_24h_vol")) {
                            tokenData.put("volume24h", priceData.getJsonNumber("usd_24h_vol").doubleValue());
                        }
                        if (priceData.containsKey("usd_24h_change")) {
                            tokenData.put("priceChange24h", priceData.getJsonNumber("usd_24h_change").doubleValue());
                        }

                        tokenData.put("priceDataSource", "coingecko");
                    }
                }
            }
        } catch (Exception e) {
            LOG.warning("Failed to fetch CoinGecko data for " + coingeckoId + ": " + e.getMessage());
        }
    }

    /**
     * Enriches token data with TradingView chart information for CEX-listed tokens.
     * Comprehensively searches for working charts across all exchanges and quote
     * currencies.
     */
    private void enrichWithTradingViewData(Map<String, Object> tokenData) {
        String symbol = (String) tokenData.get("symbol");
        String name = (String) tokenData.get("name");

        if ((symbol == null || symbol.isEmpty()) && (name == null || name.isEmpty())) {
            return;
        }

        // Comprehensive list of exchanges ordered by likelihood of having charts
        String[] exchanges = {
                // Tier 1 - Most likely to have established tokens
                "BINANCE", "COINBASE", "KRAKEN", "BITSTAMP",
                // Tier 2 - Good coverage for altcoins
                "MEXC", "KUCOIN", "GATE", "OKX", "HUOBI", "HTX", "BYBIT",
                // Tier 3 - Smaller exchanges, good for new tokens
                "BITGET", "COINEX", "LBank", "BITMART", "PHEMEX", "KCEX", "BINGX",
                // Additional exchanges
                "UPBIT", "BITHUMB", "GATEIO", "POLONIEX", "BITFINEX"
        };

        // Quote currencies ordered by priority
        String[] quoteCurrencies = { "USDT", "USD", "USDC", "BTC", "ETH", "SOL", "BNB" };

        // Try comprehensive search with original symbol
        if (symbol != null && !symbol.isEmpty()) {
            comprehensiveChartSearch(tokenData, symbol, exchanges, quoteCurrencies);
        }

        // If still no charts found, try with cleaned token name
        if ((!tokenData.containsKey("tradingViewCharts") ||
                ((List<?>) tokenData.get("tradingViewCharts")).isEmpty())
                && name != null && !name.isEmpty()) {

            String cleanedName = cleanTokenNameForTicker(name);
            if (!cleanedName.isEmpty() && !cleanedName.equals(symbol)) {
                comprehensiveChartSearch(tokenData, cleanedName, exchanges, quoteCurrencies);
            }
        }

        // Try symbol variations if we still don't have enough charts
        if (symbol != null && !symbol.isEmpty()) {
            trySymbolVariations(tokenData, symbol, exchanges, quoteCurrencies);
        }

        // Final attempt with TradingView symbol search
        if ((!tokenData.containsKey("tradingViewCharts") ||
                ((List<?>) tokenData.get("tradingViewCharts")).isEmpty())
                && symbol != null && !symbol.isEmpty()) {
            searchByTradingViewAPI(tokenData, symbol);
        }

        // Sort and optimize the found charts
        sortAndOptimizeCharts(tokenData);
    }

    /**
     * Performs comprehensive chart search across all exchanges and quote
     * currencies.
     */
    private void comprehensiveChartSearch(Map<String, Object> tokenData, String ticker,
            String[] exchanges, String[] quoteCurrencies) {

        // First pass: Try most likely combinations
        for (String quote : quoteCurrencies) {
            for (String exchange : exchanges) {
                if (hasReachedChartLimit(tokenData)) {
                    return;
                }

                String tradingPair = String.format("%s:%s%s", exchange, ticker.toUpperCase(), quote);

                // Use enhanced likelihood check
                if (isLikelyTradingPair(ticker, exchange, quote)) {
                    if (addTradingViewChart(tokenData, ticker, exchange, quote, tradingPair, "primary_search")) {
                        LOG.info("Found TradingView chart: " + tradingPair);
                    }
                }
            }

            // Check if we found good charts with this quote currency
            if (tokenData.containsKey("tradingViewCharts")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
                if (charts.size() >= 2) {
                    break; // We have enough charts with this quote currency
                }
            }
        }
    }

    /**
     * Adds a TradingView chart to the token data if it doesn't already exist.
     */
    private boolean addTradingViewChart(Map<String, Object> tokenData, String ticker,
            String exchange, String quote, String tradingPair, String method) {

        // Check if we already have this chart
        if (tokenData.containsKey("tradingViewCharts")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> existingCharts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");

            for (Map<String, Object> chart : existingCharts) {
                if (tradingPair.equals(chart.get("tradingViewSymbol"))) {
                    return false; // Already exists
                }
            }
        }

        Map<String, Object> chartData = new HashMap<>();
        chartData.put("exchange", exchange);
        chartData.put("pair", ticker.toUpperCase() + quote);
        chartData.put("tradingViewSymbol", tradingPair);
        chartData.put("chartUrl", generateTradingViewChartUrl(tradingPair));
        chartData.put("searchMethod", method);
        chartData.put("quoteCurrency", quote);
        chartData.put("priority", calculateChartPriority(exchange, quote));

        // Add to token data
        if (!tokenData.containsKey("tradingViewCharts")) {
            tokenData.put("tradingViewCharts", new ArrayList<Map<String, Object>>());
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
        charts.add(chartData);

        return true;
    }

    /**
     * Calculates priority score for chart ordering (higher is better).
     */
    private int calculateChartPriority(String exchange, String quote) {
        int priority = 0;

        // Exchange priority
        switch (exchange) {
            case "BINANCE":
                priority += 100;
                break;
            case "COINBASE":
                priority += 95;
                break;
            case "KRAKEN":
                priority += 90;
                break;
            case "MEXC":
                priority += 85;
                break;
            case "KUCOIN":
                priority += 80;
                break;
            case "GATE":
                priority += 75;
                break;
            case "OKX":
                priority += 70;
                break;
            case "BYBIT":
                priority += 65;
                break;
            default:
                priority += 50;
        }

        // Quote currency priority
        switch (quote) {
            case "USDT":
                priority += 50;
                break;
            case "USD":
                priority += 45;
                break;
            case "USDC":
                priority += 40;
                break;
            case "BTC":
                priority += 35;
                break;
            case "ETH":
                priority += 30;
                break;
            case "SOL":
                priority += 25;
                break;
            default:
                priority += 10;
        }

        return priority;
    }

    /**
     * Checks if we've reached the chart limit.
     */
    private boolean hasReachedChartLimit(Map<String, Object> tokenData) {
        if (!tokenData.containsKey("tradingViewCharts")) {
            return false;
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
        return charts.size() >= 8; // Allow up to 8 charts
    }

    /**
     * Attempts to search for symbols using TradingView's search functionality.
     * This is a fallback method when standard exchange searches fail.
     */
    private void searchByTradingViewAPI(Map<String, Object> tokenData, String symbol) {
        // For now, we'll use a heuristic approach since TradingView doesn't provide a
        // public API
        // Try some common patterns that might not be caught by standard exchange
        // searches

        String[] specialExchanges = { "CRYPTOCOM", "FTX", "GEMINI", "BITRUE", "ASCENDEX" };
        String[] quotes = { "USDT", "USD" };

        for (String exchange : specialExchanges) {
            for (String quote : quotes) {
                String tradingPair = String.format("%s:%s%s", exchange, symbol.toUpperCase(), quote);
                addTradingViewChart(tokenData, symbol, exchange, quote, tradingPair, "api_fallback");

                if (hasReachedChartLimit(tokenData)) {
                    return;
                }
            }
        }

        // Try some DEX aggregators that might have charts
        String[] dexAggregators = { "JUPITER", "RAYDIUM", "ORCA" };
        for (String dex : dexAggregators) {
            String tradingPair = String.format("%s:%s%s", dex, symbol.toUpperCase(), "SOL");
            addTradingViewChart(tokenData, symbol, dex, "SOL", tradingPair, "dex_search");

            if (hasReachedChartLimit(tokenData)) {
                return;
            }
        }
    }

    /**
     * Sorts the trading view charts by priority and removes duplicates.
     */
    private void sortAndOptimizeCharts(Map<String, Object> tokenData) {
        if (!tokenData.containsKey("tradingViewCharts")) {
            return;
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");

        if (charts.isEmpty()) {
            return;
        }

        // Sort by priority (highest first)
        charts.sort((a, b) -> {
            Integer priorityA = (Integer) a.getOrDefault("priority", 0);
            Integer priorityB = (Integer) b.getOrDefault("priority", 0);
            return priorityB.compareTo(priorityA);
        });

        // Keep only top 5 charts to avoid clutter
        while (charts.size() > 5) {
            charts.remove(charts.size() - 1);
        }

        LOG.info("Optimized to " + charts.size() + " trading charts for token");
    }

    /**
     * Searches for TradingView charts using the given ticker symbol.
     */
    private void searchTradingViewCharts(Map<String, Object> tokenData, String ticker,
            String[] exchanges, String[] quoteCurrencies) {
        for (String exchange : exchanges) {
            for (String quote : quoteCurrencies) {
                String tradingPair = String.format("%s:%s%s", exchange, ticker.toUpperCase(), quote);

                // Check if this trading pair might exist
                if (isLikelyTradingPair(ticker, exchange, quote)) {
                    Map<String, Object> chartData = new HashMap<>();
                    chartData.put("exchange", exchange);
                    chartData.put("pair", ticker.toUpperCase() + quote);
                    chartData.put("tradingViewSymbol", tradingPair);
                    chartData.put("chartUrl", generateTradingViewChartUrl(tradingPair));
                    chartData.put("searchMethod", "ticker_" + ticker);

                    // Add to token data
                    if (!tokenData.containsKey("tradingViewCharts")) {
                        tokenData.put("tradingViewCharts", new ArrayList<Map<String, Object>>());
                    }

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
                    charts.add(chartData);

                    LOG.info("Found potential TradingView chart for " + ticker + ": " + tradingPair);

                    // Limit to avoid too many charts
                    if (charts.size() >= 5) {
                        return;
                    }
                }
            }

            // Check if we have enough charts
            if (tokenData.containsKey("tradingViewCharts")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
                if (charts.size() >= 3) {
                    return;
                }
            }
        }
    }

    /**
     * Tries various symbol variations for better chart discovery.
     */
    private void trySymbolVariations(Map<String, Object> tokenData, String symbol,
            String[] exchanges, String[] quoteCurrencies) {
        // Don't try variations if we already have enough charts
        if (tokenData.containsKey("tradingViewCharts")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
            if (charts.size() >= 3) {
                return;
            }
        }

        // Try common variations
        String[] variations = {
                symbol + "TOKEN", // DOGTOKEN
                symbol + "COIN", // DOGCOIN
                "W" + symbol, // WSOL (wrapped versions)
                symbol.substring(0, Math.min(symbol.length(), 4)), // Shortened version
        };

        for (String variation : variations) {
            if (variation.length() >= 2 && !variation.equals(symbol)) {
                searchTradingViewCharts(tokenData, variation,
                        new String[] { "MEXC", "GATE", "BITGET" }, // Focus on exchanges likely to list variations
                        new String[] { "USDT", "USDC" });

                // Stop if we found enough charts
                if (tokenData.containsKey("tradingViewCharts")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> charts = (List<Map<String, Object>>) tokenData.get("tradingViewCharts");
                    if (charts.size() >= 4) {
                        break;
                    }
                }
            }
        }
    }

    /**
     * Cleans up token name to create a potential ticker symbol.
     */
    private String cleanTokenNameForTicker(String name) {
        if (name == null || name.isEmpty()) {
            return "";
        }

        // Remove common words and create acronym
        String cleaned = name.toUpperCase()
                .replaceAll("\\bTOKEN\\b", "")
                .replaceAll("\\bCOIN\\b", "")
                .replaceAll("\\bFINANCE\\b", "")
                .replaceAll("\\bPROTOCOL\\b", "")
                .replaceAll("\\bNETWORK\\b", "")
                .replaceAll("[^A-Z\\s]", "")
                .trim();

        // If it's a single word, use first 4-6 characters
        if (!cleaned.contains(" ") && cleaned.length() > 6) {
            return cleaned.substring(0, 6);
        }

        // If multiple words, create acronym
        if (cleaned.contains(" ")) {
            String[] words = cleaned.split("\\s+");
            StringBuilder acronym = new StringBuilder();
            for (String word : words) {
                if (!word.isEmpty()) {
                    acronym.append(word.charAt(0));
                }
            }
            return acronym.toString();
        }

        return cleaned;
    }

    /**
     * Determines if a symbol is likely to have a trading pair on a given exchange.
     * Enhanced to support comprehensive token discovery across all exchange tiers.
     */
    private boolean isLikelyTradingPair(String symbol, String exchange, String quote) {
        if (symbol == null || symbol.length() < 2) {
            return false;
        }

        // Tier 1 exchanges - established tokens with major quote currencies
        if ("BINANCE".equals(exchange) || "COINBASE".equals(exchange) || "KRAKEN".equals(exchange) ||
                "BITSTAMP".equals(exchange)) {
            return "USDT".equals(quote) || "USD".equals(quote) || "USDC".equals(quote) ||
                    "BTC".equals(quote) || "ETH".equals(quote) || "BNB".equals(quote);
        }

        // Tier 2 exchanges - good altcoin coverage, prioritize USDT
        if ("MEXC".equals(exchange) || "KUCOIN".equals(exchange) || "GATE".equals(exchange) ||
                "OKX".equals(exchange) || "HUOBI".equals(exchange) || "HTX".equals(exchange) ||
                "BYBIT".equals(exchange)) {

            // USDT is very common on these exchanges
            if ("USDT".equals(quote)) {
                return true;
            }
            // Other major pairs are also likely
            return "USDC".equals(quote) || "BTC".equals(quote) || "ETH".equals(quote) ||
                    "SOL".equals(quote) || "USD".equals(quote);
        }

        // Tier 3 exchanges - very open to new tokens, especially with stablecoins
        if ("BITGET".equals(exchange) || "COINEX".equals(exchange) || "LBank".equals(exchange) ||
                "BITMART".equals(exchange) || "PHEMEX".equals(exchange) || "KCEX".equals(exchange) ||
                "BINGX".equals(exchange) || "ASCENDEX".equals(exchange)) {

            // These exchanges often list new tokens with USDT/USDC
            if ("USDT".equals(quote) || "USDC".equals(quote)) {
                return true;
            }
            // Also accept major crypto pairs
            return "BTC".equals(quote) || "ETH".equals(quote) || "SOL".equals(quote);
        }

        // Regional exchanges
        if ("UPBIT".equals(exchange) || "BITHUMB".equals(exchange)) {
            // Korean exchanges often have KRW pairs, but also USDT
            return "USDT".equals(quote) || "USD".equals(quote) || "BTC".equals(quote);
        }

        // DEX aggregators and special cases
        if ("JUPITER".equals(exchange) || "RAYDIUM".equals(exchange) || "ORCA".equals(exchange)) {
            return "SOL".equals(quote) || "USDC".equals(quote);
        }

        // Additional exchanges that list many tokens
        if ("POLONIEX".equals(exchange) || "BITFINEX".equals(exchange) || "GATEIO".equals(exchange) ||
                "CRYPTOCOM".equals(exchange) || "GEMINI".equals(exchange) || "BITRUE".equals(exchange)) {
            return "USDT".equals(quote) || "USD".equals(quote) || "USDC".equals(quote) ||
                    "BTC".equals(quote) || "ETH".equals(quote);
        }

        // Default case - if it's USDT, there's a good chance it exists somewhere
        return "USDT".equals(quote);
    }

    /**
     * Generates a TradingView chart URL for a given trading pair.
     */
    private String generateTradingViewChartUrl(String tradingPair) {
        // Generate a TradingView chart URL with the trading pair
        // The format matches the examples provided:
        // https://www.tradingview.com/chart/ev0QmMlB/?symbol=MEXC%3ANYLAUSDT
        return String.format("https://www.tradingview.com/chart/?symbol=%s",
                tradingPair.replace(":", "%3A"));
    }

    private void enrichWithMoralisData(Map<String, Object> tokenData) {
        String mint = (String) tokenData.get("mint");
        if (mint == null) {
            return;
        }

        try {
            // Get token metadata from Moralis
            enrichTokenWithMoralisMetadata(tokenData, mint);

            // Get token price data from Moralis
            enrichTokenWithMoralisPrice(tokenData, mint);

        } catch (Exception e) {
            LOG.warning("Failed to fetch Moralis data for " + mint + ": " + e.getMessage());
        }
    }

    private void enrichTokenWithMoralisMetadata(Map<String, Object> tokenData, String mint) {
        try {
            // Moralis Solana API endpoint for token metadata
            String url = "https://solana-gateway.moralis.io/token/metadata?network=mainnet&address=" + mint;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("X-API-Key", MORALIS_API_KEY)
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> moralisData = mapper.readValue(response.body(), Map.class);

                // Extract useful data from Moralis
                if (moralisData.containsKey("name") && !tokenData.containsKey("name")) {
                    tokenData.put("name", moralisData.get("name"));
                }

                if (moralisData.containsKey("symbol") && !tokenData.containsKey("symbol")) {
                    tokenData.put("symbol", moralisData.get("symbol"));
                }

                if (moralisData.containsKey("decimals") && !tokenData.containsKey("decimals")) {
                    tokenData.put("decimals", moralisData.get("decimals"));
                }

                // Add Moralis-specific metadata
                if (moralisData.containsKey("logoURI") && !tokenData.containsKey("logoURI")) {
                    tokenData.put("logoURI", moralisData.get("logoURI"));
                }

                // Add any additional metadata from Moralis
                tokenData.put("moralisMetadata", moralisData);

                LOG.info("Enriched token " + mint + " with Moralis metadata");
            }

        } catch (Exception e) {
            LOG.warning("Failed to fetch Moralis metadata for " + mint + ": " + e.getMessage());
        }
    }

    private void enrichTokenWithMoralisPrice(Map<String, Object> tokenData, String mint) {
        try {
            // Moralis Solana API endpoint for token price
            String url = "https://solana-gateway.moralis.io/token/price?network=mainnet&address=" + mint;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("X-API-Key", MORALIS_API_KEY)
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> priceData = mapper.readValue(response.body(), Map.class);

                // Add price data if not already present
                if (priceData.containsKey("usdPrice") && !tokenData.containsKey("price")) {
                    tokenData.put("price", priceData.get("usdPrice"));
                    tokenData.put("priceSource", "moralis");
                }

                // Add exchange rate data
                if (priceData.containsKey("exchangeAddress")) {
                    tokenData.put("moralisPriceData", priceData);
                }

                LOG.info("Enriched token " + mint + " with Moralis price data");
            }

        } catch (Exception e) {
            LOG.warning("Failed to fetch Moralis price for " + mint + ": " + e.getMessage());
        }
    }
}
