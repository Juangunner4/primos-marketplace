package com.primos.resource;

import java.util.Map;
import com.primos.model.User;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class StatsResourceTest {
    @Test
    public void testCountsReturnedForMembers() {
        // create two users in memory
        User u1 = new User();
        u1.setPublicKey("a");
        u1.setDaoMember(true);
        u1.persist();
        User u2 = new User();
        u2.setPublicKey("b");
        u2.setDaoMember(true);
        u2.persist();

        StatsResource res = new StatsResource() {
            @Override
            protected int fetchCount(String owner) {
                return owner.equals("a") ? 2 : 0;
            }
        };

        Map<String,Integer> counts = res.getMemberNftCounts();
        assertEquals(2, counts.get("a").intValue());
        assertEquals(0, counts.get("b").intValue());
    }
}
