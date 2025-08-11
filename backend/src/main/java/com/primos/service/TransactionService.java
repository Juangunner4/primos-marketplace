package com.primos.service;

import com.primos.model.Transaction;
import com.primos.resource.TransactionDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.ProxySelector;
import java.net.InetSocketAddress;
import java.util.logging.Logger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@ApplicationScoped
public class TransactionService {
    private static final Logger LOG = Logger.getLogger(TransactionService.class.getName());
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

    public Transaction recordTransaction(TransactionDTO dto) {
        LOG.info(() -> "Recording transaction " + dto.txId + " for buyer " + dto.buyer);
        Transaction tx = new Transaction();
        tx.setTxId(dto.txId);
        tx.setBuyer(dto.buyer);
        tx.setMint(dto.mint);
        tx.setCollection(dto.collection);
        tx.setSource(dto.source);
        tx.setTimestamp(dto.timestamp);
        tx.setSolSpent(null);
        tx.setStatus("pending");
        tx.persist();
        enrich(tx);
        return tx;
    }

    public void updateStatus(Transaction tx) {
        if (tx == null || "confirmed".equalsIgnoreCase(tx.getStatus())) {
            return;
        }
        LOG.info(() -> "Updating status for transaction " + tx.getTxId());
        enrich(tx);
    }

    private void enrich(Transaction tx) {
        LOG.info(() -> "Enriching transaction " + tx.getTxId());
        try {
            String url = String.format("%s/v2/collections/%s/activities?offset=0&limit=20", API_BASE, COLLECTION);
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200 || resp.body() == null || resp.body().isBlank()) {
                LOG.info("No enrichment data available");
                return;
            }
            try (JsonReader reader = Json.createReader(new StringReader(resp.body()))) {
                JsonArray arr = reader.readArray();
                for (int i = 0; i < arr.size(); i++) {
                    JsonObject obj = arr.getJsonObject(i);
                    String txId = obj.getString("txId", "");
                    String mint = obj.getString("mint", "");
                    if (tx.getTxId().equals(txId) || tx.getMint().equals(mint)) {
                        tx.setSeller(obj.getString("seller", null));
                        if (obj.containsKey("price")) {
                            try {
                                double price = obj.getJsonNumber("price").doubleValue();
                                tx.setPrice(price);
                                tx.setSolSpent(price);
                            } catch (Exception ignore) {}
                        }
                        tx.setStatus("confirmed");
                        tx.persistOrUpdate();
                        LOG.info(() -> "Transaction " + tx.getTxId() + " enriched and confirmed");
                        return;
                    }
                }
            }
        } catch (Exception e) {
            LOG.warning("Failed to enrich transaction: " + e.getMessage());
        }
    }

    public double volumeLast24h() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        return Transaction.<Transaction>streamAll()
                .filter(t -> "confirmed".equalsIgnoreCase(t.getStatus()))
                .filter(t -> {
                    try {
                        return t.getTimestamp() != null && Instant.parse(t.getTimestamp()).isAfter(cutoff);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .mapToDouble(t -> t.getSolSpent() != null ? t.getSolSpent() : (t.getPrice() != null ? t.getPrice() : 0.0))
                .sum();
    }

    public List<Transaction> recentTransactions(int hours) {
        Instant cutoff = Instant.now().minus(hours, ChronoUnit.HOURS);
        return Transaction.<Transaction>streamAll()
                .filter(t -> {
                    try {
                        return t.getTimestamp() != null && Instant.parse(t.getTimestamp()).isAfter(cutoff);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .toList();
    }
}
