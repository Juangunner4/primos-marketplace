package com.weys.service;

import com.weys.model.Like;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class LikeService {
    public long countLikes(String tokenId) {
        return Like.count("tokenId", tokenId);
    }

    public boolean userLiked(String tokenId, String publicKey) {
        return Like.count("tokenId = ?1 and publicKey = ?2", tokenId, publicKey) > 0;
    }

    public boolean toggleLike(String tokenId, String publicKey) {
        Like existing = Like.find("tokenId = ?1 and publicKey = ?2", tokenId, publicKey).firstResult();
        if (existing != null) {
            existing.delete();
            return false;
        }
        Like like = new Like();
        like.setTokenId(tokenId);
        like.setPublicKey(publicKey);
        like.persist();
        return true;
    }
}
