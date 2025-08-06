package com.primos.resource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.primos.model.TrenchContract;
import com.primos.model.TrenchContractCaller;
import com.primos.model.TrenchUser;
import com.primos.model.User;
import com.primos.service.TrenchService;

import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

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
        public java.util.Set<String> contracts;
        public User.SocialLinks socials;
        public long lastSubmittedAt;
    }

    public static class TrenchCallerInfo {
        public String caller;
        public String pfp;
        public Long calledAt;
        public Double marketCapAtCall;
        public String domainAtCall;
        public User.SocialLinks socials;
    }

    public static class TrenchData {
        public List<TrenchContract> contracts;
        public List<TrenchUserInfo> users;
        public Map<String, List<TrenchCallerInfo>> latestCallers;
    }

    @POST
    public void add(@HeaderParam("X-Public-Key") String publicKey, Map<String, String> req) {
        if (publicKey == null || req == null || !req.containsKey("contract")) {
            throw new BadRequestException();
        }
        String source = req.getOrDefault("source", "website");
        String model = req.get("model");

        // Extract domain if provided
        String domain = null;

        if (req.containsKey("domain")) {
            domain = req.get("domain");
        }

        service.add(publicKey, req.get("contract"), source, model, domain);
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
            info.socials = user != null ? user.getSocials() : new User.SocialLinks();
            info.contracts = u.getContracts();
            info.lastSubmittedAt = u.getLastSubmittedAt();
            return info;
        }).collect(Collectors.toList());

        // Get latest callers for each contract
        data.latestCallers = new HashMap<>();
        for (TrenchContract contract : data.contracts) {
            List<TrenchContractCaller> callers = service.getLatestCallersForContract(contract.getContract(), 4);
            List<TrenchCallerInfo> callerInfos = callers.stream().map(caller -> {
                TrenchCallerInfo info = new TrenchCallerInfo();
                info.caller = caller.getCaller();
                info.calledAt = caller.getCalledAt();
                info.marketCapAtCall = caller.getMarketCapAtCall();
                info.domainAtCall = caller.getDomainAtCall();
                User user = User.find("publicKey", caller.getCaller()).firstResult();
                info.pfp = user != null ? user.getPfp() : "";
                info.socials = user != null ? user.getSocials() : new User.SocialLinks();
                return info;
            }).collect(Collectors.toList());
            data.latestCallers.put(contract.getContract(), callerInfos);
        }

        return data;
    }

    @PUT
    @Path("/{contract}/market-cap")
    public Map<String, Object> updateMarketCap(@PathParam("contract") String contract, Map<String, Object> req) {
        Map<String, Object> response = new HashMap<>();

        if (req == null || !req.containsKey("marketCap")) {
            response.put("success", false);
            response.put("message", "Market cap value is required");
            return response;
        }

        Double marketCap = null;
        Object marketCapValue = req.get("marketCap");
        if (marketCapValue instanceof Number number) {
            marketCap = number.doubleValue();
        }

        if (marketCap == null || marketCap <= 0) {
            response.put("success", false);
            response.put("message", "Invalid market cap value");
            return response;
        }

        boolean updated = service.updateFirstCallerMarketCap(contract, marketCap);
        if (updated) {
            response.put("success", true);
            response.put("message", "Market cap updated successfully");
        } else {
            response.put("success", false);
            response.put("message", "Contract not found or market cap already exists");
        }

        return response;
    }
}
