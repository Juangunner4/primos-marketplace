package com.primos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.primos.model.TokenReaction;
import com.primos.model.TokenReaction.ReactionType;

class TokenReactionServiceTest {

    private TokenReactionService service;

    @BeforeEach
    void setUp() {
        service = new TokenReactionService();
        // Clean up any existing test data
        TokenReaction.deleteAll();
    }

    @Test
    void testToggleReaction() {
        String tokenId = "test-token-1";
        String user1 = "user1";
        String user2 = "user2";

        // Initially no reactions
        assertEquals(0, service.countLikes(tokenId));
        assertEquals(0, service.countDislikes(tokenId));
        assertNull(service.getUserReaction(tokenId, user1));

        // User1 likes the token
        ReactionType reaction = service.toggleReaction(tokenId, user1, ReactionType.LIKE);
        assertEquals(ReactionType.LIKE, reaction);
        assertEquals(1, service.countLikes(tokenId));
        assertEquals(0, service.countDislikes(tokenId));
        assertEquals(ReactionType.LIKE, service.getUserReaction(tokenId, user1));

        // User1 changes to dislike
        reaction = service.toggleReaction(tokenId, user1, ReactionType.DISLIKE);
        assertEquals(ReactionType.DISLIKE, reaction);
        assertEquals(0, service.countLikes(tokenId));
        assertEquals(1, service.countDislikes(tokenId));
        assertEquals(ReactionType.DISLIKE, service.getUserReaction(tokenId, user1));

        // User1 removes reaction (clicks dislike again)
        reaction = service.toggleReaction(tokenId, user1, ReactionType.DISLIKE);
        assertNull(reaction);
        assertEquals(0, service.countLikes(tokenId));
        assertEquals(0, service.countDislikes(tokenId));
        assertNull(service.getUserReaction(tokenId, user1));

        // User2 likes the token
        reaction = service.toggleReaction(tokenId, user2, ReactionType.LIKE);
        assertEquals(ReactionType.LIKE, reaction);
        assertEquals(1, service.countLikes(tokenId));
        assertEquals(0, service.countDislikes(tokenId));
        assertEquals(ReactionType.LIKE, service.getUserReaction(tokenId, user2));
        assertNull(service.getUserReaction(tokenId, user1));

        // User1 dislikes while user2 has liked
        reaction = service.toggleReaction(tokenId, user1, ReactionType.DISLIKE);
        assertEquals(ReactionType.DISLIKE, reaction);
        assertEquals(1, service.countLikes(tokenId));
        assertEquals(1, service.countDislikes(tokenId));
        assertEquals(ReactionType.LIKE, service.getUserReaction(tokenId, user2));
        assertEquals(ReactionType.DISLIKE, service.getUserReaction(tokenId, user1));
    }

    @Test
    void testMultipleUsers() {
        String tokenId = "test-token-2";

        // 3 users like the token
        service.toggleReaction(tokenId, "user1", ReactionType.LIKE);
        service.toggleReaction(tokenId, "user2", ReactionType.LIKE);
        service.toggleReaction(tokenId, "user3", ReactionType.LIKE);

        assertEquals(3, service.countLikes(tokenId));
        assertEquals(0, service.countDislikes(tokenId));

        // 2 users dislike the token
        service.toggleReaction(tokenId, "user4", ReactionType.DISLIKE);
        service.toggleReaction(tokenId, "user5", ReactionType.DISLIKE);

        assertEquals(3, service.countLikes(tokenId));
        assertEquals(2, service.countDislikes(tokenId));

        // One user changes from like to dislike
        service.toggleReaction(tokenId, "user1", ReactionType.DISLIKE);

        assertEquals(2, service.countLikes(tokenId));
        assertEquals(3, service.countDislikes(tokenId));
    }
}
