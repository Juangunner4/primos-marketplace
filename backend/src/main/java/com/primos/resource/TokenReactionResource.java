package com.primos.resource;

import com.primos.model.TokenReaction.ReactionType;
import com.primos.service.TokenReactionService;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/token-reactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TokenReactionResource {

    private final TokenReactionService service;

    public TokenReactionResource(TokenReactionService service) {
        this.service = service;
    }

    public static class ReactionResponse {
        private long likes;
        private long dislikes;
        private String userReaction; // "LIKE", "DISLIKE", or null

        public ReactionResponse() {
        }

        public ReactionResponse(long likes, long dislikes, ReactionType userReaction) {
            this.likes = likes;
            this.dislikes = dislikes;
            this.userReaction = userReaction != null ? userReaction.toString() : null;
        }

        public long getLikes() {
            return likes;
        }

        public void setLikes(long likes) {
            this.likes = likes;
        }

        public long getDislikes() {
            return dislikes;
        }

        public void setDislikes(long dislikes) {
            this.dislikes = dislikes;
        }

        public String getUserReaction() {
            return userReaction;
        }

        public void setUserReaction(String userReaction) {
            this.userReaction = userReaction;
        }
    }

    @GET
    @Path("/{tokenId}")
    public ReactionResponse get(@PathParam("tokenId") String tokenId, @HeaderParam("X-Public-Key") String wallet) {
        long likes = service.countLikes(tokenId);
        long dislikes = service.countDislikes(tokenId);
        ReactionType userReaction = wallet != null ? service.getUserReaction(tokenId, wallet) : null;
        return new ReactionResponse(likes, dislikes, userReaction);
    }

    @POST
    @Path("/{tokenId}/like")
    public ReactionResponse toggleLike(@PathParam("tokenId") String tokenId,
            @HeaderParam("X-Public-Key") String wallet) {
        if (wallet == null || wallet.isEmpty()) {
            throw new ForbiddenException("Wallet address required");
        }

        ReactionType newReaction = service.toggleReaction(tokenId, wallet, ReactionType.LIKE);
        long likes = service.countLikes(tokenId);
        long dislikes = service.countDislikes(tokenId);

        return new ReactionResponse(likes, dislikes, newReaction);
    }

    @POST
    @Path("/{tokenId}/dislike")
    public ReactionResponse toggleDislike(@PathParam("tokenId") String tokenId,
            @HeaderParam("X-Public-Key") String wallet) {
        if (wallet == null || wallet.isEmpty()) {
            throw new ForbiddenException("Wallet address required");
        }

        ReactionType newReaction = service.toggleReaction(tokenId, wallet, ReactionType.DISLIKE);
        long likes = service.countLikes(tokenId);
        long dislikes = service.countDislikes(tokenId);

        return new ReactionResponse(likes, dislikes, newReaction);
    }
}
