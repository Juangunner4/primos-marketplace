package com.primos.resource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.primos.model.User;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/user")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    private static final Logger LOGGER = Logger.getLogger(UserResource.class.getName());
    private static final String PUBLIC_KEY_FIELD = "publicKey";

    @POST
    @Path("/login")
    public User login(LoginRequest req) {
        if (req == null || req.publicKey == null || req.publicKey.isEmpty()) {
            LOGGER.info("[UserResource] Login attempt with missing publicKey");
            throw new jakarta.ws.rs.BadRequestException("publicKey is required");
        }
        if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
            LOGGER.info(String.format("[UserResource] Login attempt for publicKey: %s", req.publicKey));
        }

        // --- Fetch live NFT count from Helius API ---
        boolean holder = false;
        try {
            String heliusApiKey = System.getenv().getOrDefault("HELIUS_API_KEY", "");
            String collectionMint = "2gHxjKwWvgek6zjBmgxF9NiNZET3VHsSYwj2Afs2U1Mb"; // Use your collection mint
            String body = String.format(
                    "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"getAssetsByGroup\",\"params\":{\"groupKey\":\"collection\",\"groupValue\":\"%s\",\"ownerAddress\":\"%s\",\"page\":1,\"limit\":1}}",
                    collectionMint, req.publicKey);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://mainnet.helius-rpc.com/?api-key=" + heliusApiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode items = new ObjectMapper().readTree(response.body()).path("result").path("items");
                holder = items.isArray() && items.size() > 0;
            }
        } catch (Exception e) {
            LOGGER.warning("Failed to check Primo NFT ownership for " + req.publicKey + ": " + e.getMessage());
        }

        User user = User.find(PUBLIC_KEY_FIELD, req.publicKey).firstResult();
        if (user == null) {
            user = new User();
            user.setPublicKey(req.publicKey);
            user.setBio("");
            user.setSocials(new User.SocialLinks());
            user.setPfp("");
            user.setPoints(0);
            user.setPesos(1000);
            user.setCreatedAt(System.currentTimeMillis());
            user.setDaoMember(holder);
            user.setPrimoHolder(holder);
            user.persist();
            if (LOGGER.isLoggable(java.util.logging.Level.INFO)) {
                LOGGER.info(String.format("[UserResource] Created new user for publicKey: %s", req.publicKey));
            }
        } else {
            user.setPrimoHolder(holder);
            if (holder && !user.isDaoMember()) {
                user.setDaoMember(true);
            }
            if (!holder && user.isDaoMember()) {
                user.setDaoMember(false);
            }
            user.persistOrUpdate();
            LOGGER.info(String.format("[UserResource] User already exists for publicKey: %s", req.publicKey));
        }
        return user;
    }

    @GET
    @Path("/{publicKey}")
    public User getUser(@PathParam("publicKey") String publicKey) {
        User user = User.find(PUBLIC_KEY_FIELD, publicKey).firstResult();
        if (user == null)
            throw new NotFoundException();
        return user;
    }

    @PUT
    @Path("/{publicKey}/pfp")
    @Consumes(MediaType.TEXT_PLAIN)
    public User updatePfp(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey,
            String pfpUrl) {
        if (walletKey == null || !walletKey.equals(publicKey)) {
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null) {
            user.setPfp(pfpUrl);
            user.persistOrUpdate();
            LOGGER.info(String.format("[UserResource] Updated PFP for publicKey: %s to %s", publicKey, pfpUrl));
        }
        return user;
    }

    @PUT
    @Path("/{publicKey}")
    public User updateProfile(@PathParam("publicKey") String publicKey,
            @HeaderParam("X-Public-Key") String walletKey,
            User updated) {
        if (walletKey == null || !walletKey.equals(publicKey)) {
            throw new ForbiddenException();
        }
        if (updated == null || !publicKey.equals(updated.getPublicKey())) {
            throw new ForbiddenException();
        }
        User user = User.find("publicKey", publicKey).firstResult();
        if (user != null) {
            user.setBio(updated.getBio());
            if (updated.getSocials() != null) {
                user.setSocials(updated.getSocials());
            }
            user.persistOrUpdate();
            LOGGER.info(String.format("[UserResource] Updated profile for %s", publicKey));
        }
        return user;
    }

    @GET
    @Path("/primos")
    public java.util.List<User> getDaoMembers() {
        return User.list("primoHolder", true);
    }

}
