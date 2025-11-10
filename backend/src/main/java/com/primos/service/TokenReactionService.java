package com.primos.service;

import com.primos.model.TokenReaction;
import com.primos.model.TokenReaction.ReactionType;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class TokenReactionService {

    public long countLikes(String tokenId) {
        return TokenReaction.count("tokenId = ?1 and type = ?2", tokenId, ReactionType.LIKE);
    }

    public long countDislikes(String tokenId) {
        return TokenReaction.count("tokenId = ?1 and type = ?2", tokenId, ReactionType.DISLIKE);
    }

    public ReactionType getUserReaction(String tokenId, String publicKey) {
        TokenReaction reaction = TokenReaction.find("tokenId = ?1 and publicKey = ?2", tokenId, publicKey)
                .firstResult();
        return reaction != null ? reaction.getType() : null;
    }

    @Transactional
    public ReactionType toggleReaction(String tokenId, String publicKey, ReactionType newType) {
        // Find existing reaction for this user and token
        TokenReaction existing = TokenReaction.find("tokenId = ?1 and publicKey = ?2", tokenId, publicKey)
                .firstResult();

        if (existing != null) {
            // If clicking the same reaction type, remove it
            if (existing.getType() == newType) {
                existing.delete();
                return null; // No reaction
            } else {
                // Change the reaction type
                existing.setType(newType);
                existing.persist();
                return newType;
            }
        } else {
            // Create new reaction
            TokenReaction reaction = new TokenReaction();
            reaction.setTokenId(tokenId);
            reaction.setPublicKey(publicKey);
            reaction.setType(newType);
            reaction.persist();
            return newType;
        }
    }
}
