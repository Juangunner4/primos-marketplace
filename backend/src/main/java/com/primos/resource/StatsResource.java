package com.primos.resource;

import java.util.List;

import com.primos.model.MemberStats;
import com.primos.service.StatsService;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/stats")
@Produces(MediaType.APPLICATION_JSON)
public class StatsResource {

    @Inject
    StatsService statsService;

    @GET
    @Path("/member-nft-counts")
    public List<MemberStats> getMemberNftCounts() {
        return statsService.getAllMemberStats();
    }
}
