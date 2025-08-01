package com.primos.service;

import com.primos.model.Like;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class LikeServiceTest {
    @Test
    public void testToggleLike() {
        LikeService svc = new LikeService();
        boolean liked = svc.toggleLike("token1", "user1");
        assertTrue(liked);
        assertEquals(1, svc.countLikes("token1"));
        assertTrue(svc.userLiked("token1", "user1"));
        liked = svc.toggleLike("token1", "user1");
        assertFalse(liked);
        assertEquals(0, svc.countLikes("token1"));
    }
}
