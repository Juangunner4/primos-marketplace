package com.primos.resource;

import java.util.List;
import java.util.UUID;

import com.primos.model.BetaCode;
import com.primos.model.User;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminResource {

    public static final String ADMIN_WALLET = System.getenv().getOrDefault("ADMIN_WALLET",
            "EB5uzfZZrWQ8BPEmMNrgrNMNCHR1qprrsspHNNgVEZa6");

    private void ensureAdmin(String wallet) {
        if (wallet == null || !ADMIN_WALLET.equals(wallet)) {
            throw new ForbiddenException();
        }
    }

    @GET
    @Path("/beta")
    public List<BetaCode> listCodes(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return BetaCode.listAll();
    }

    @GET
    @Path("/beta/active")
    public List<BetaCode> listActiveCodes(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return BetaCode.list("redeemed", false);
    }

    @GET
    @Path("/beta/inactive")
    public List<BetaCode> listInactiveCodes(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        return BetaCode.list("redeemed", true);
    }

    public record Stats(long totalWallets, long totalPoints, long primoHolders,
            long betaCodes, long betaCodesRedeemed) {
    }

    @GET
    @Path("/stats")
    public Stats getStats(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        long totalWallets = User.count();
        long totalPoints = User.streamAll().mapToLong(User::getPoints).sum();
        long primoHolders = User.count("primoHolder", true);
        long betaCodes = BetaCode.count();
        long betaCodesRedeemed = BetaCode.count("redeemed", true);
        return new Stats(totalWallets, totalPoints, primoHolders, betaCodes, betaCodesRedeemed);
    }

    @POST
    @Path("/beta")
    public BetaCode createCode(@HeaderParam("X-Public-Key") String wallet) {
        ensureAdmin(wallet);
        BetaCode code = new BetaCode();
        code.setCode("BETA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        code.persist();
        return code;
    }
}
