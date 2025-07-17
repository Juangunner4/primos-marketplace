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
        Transaction tx = new Transaction();
        tx.setTxId(dto.txId);
        tx.setBuyer(dto.buyer);
        tx.setMint(dto.mint);
        tx.setCollection(dto.collection);
        tx.setSource(dto.source);
        tx.setTimestamp(dto.timestamp);
        tx.setStatus("pending");
        tx.persist();
        enrich(tx);
        return tx;
    }

    public void updateStatus(Transaction tx) {
        if (tx == null || "confirmed".equalsIgnoreCase(tx.getStatus())) {
            return;
        }
        enrich(tx);
    }

    private void enrich(Transaction tx) {
        try {
            String url = String.format("%s/v2/collections/%s/activities?offset=0&limit=20", API_BASE, COLLECTION);
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> resp = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200 || resp.body() == null || resp.body().isBlank()) {
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
                                tx.setPrice(obj.getJsonNumber("price").doubleValue());
                            } catch (Exception ignore) {}
                        }
                        tx.setStatus("confirmed");
                        tx.persistOrUpdate();
                        return;
                    }
                }
            }
        } catch (Exception e) {
            LOG.warning("Failed to enrich transaction: " + e.getMessage());
        }
    }
}
