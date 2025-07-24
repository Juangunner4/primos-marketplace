package com.primos.resource;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchUser;
import com.primos.model.User;
import com.primos.service.TrenchService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/api/trench")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TrenchResource {
    @Inject
    TrenchService service;

    public static class TrenchUserInfo {
        public String publicKey;
        public String pfp;
        public int count;
        public java.util.List<String> contracts;
    }

    public static class TrenchData {
        public List<TrenchContract> contracts;
        public List<TrenchUserInfo> users;
    }

    @POST
    public void add(@HeaderParam("X-Public-Key") String publicKey, Map<String, String> req) {
        if (publicKey == null || req == null || !req.containsKey("contract")) {
            throw new BadRequestException();
        }
        String source = req.getOrDefault("source", "website");
        String model = req.get("model");
        service.add(publicKey, req.get("contract"), source, model);
    }

    @GET
    public TrenchData get() {
        TrenchData data = new TrenchData();
        data.contracts = service.getContracts();
        List<TrenchUser> users = service.getUsers();
        data.users = users.stream().map(u -> {
            TrenchUserInfo info = new TrenchUserInfo();
            info.publicKey = u.getPublicKey();
            info.count = u.getCount();
            User user = User.find("publicKey", u.getPublicKey()).firstResult();
            info.pfp = user != null ? user.getPfp() : "";
            info.contracts = u.getContracts();
            return info;
        }).collect(Collectors.toList());
        return data;
    }
}
