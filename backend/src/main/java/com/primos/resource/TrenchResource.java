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
import jakarta.ws.rs.Path;
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
        public java.util.List<String> contracts;
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
}
