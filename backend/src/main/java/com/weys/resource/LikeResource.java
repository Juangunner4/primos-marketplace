package com.weys.resource;

import com.weys.service.LikeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/likes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LikeResource {

    @Inject
    LikeService service;

    public static class LikeResponse {
        public long count;
        public boolean liked;
        public LikeResponse() {}
        public LikeResponse(long count, boolean liked) { this.count = count; this.liked = liked; }
    }

    @GET
    @Path("/{tokenId}")
    public LikeResponse get(@PathParam("tokenId") String tokenId, @HeaderParam("X-Public-Key") String wallet) {
        long count = service.countLikes(tokenId);
        boolean liked = wallet != null && service.userLiked(tokenId, wallet);
        return new LikeResponse(count, liked);
    }

    @POST
    @Path("/{tokenId}")
    public LikeResponse toggle(@PathParam("tokenId") String tokenId, @HeaderParam("X-Public-Key") String wallet) {
        if (wallet == null || wallet.isEmpty()) {
            throw new ForbiddenException();
        }
        boolean liked = service.toggleLike(tokenId, wallet);
        long count = service.countLikes(tokenId);
        return new LikeResponse(count, liked);
    }
}
