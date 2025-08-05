package com.primos.service;

import static org.junit.jupiter.api.Assertions.*;

import com.primos.model.User;
import org.junit.jupiter.api.Test;

public class ProfileServiceTest {
    @Test
    public void testUpdateDomain() {
        User u = new User();
        u.setPublicKey("wallet1");
        u.persist();

        ProfileService svc = new ProfileService();
        User updated = new User();
        updated.setPublicKey("wallet1");
        updated.setDomain("my.sol");
        svc.updateProfile("wallet1", "wallet1", updated);

        User db = User.find("publicKey", "wallet1").firstResult();
        assertEquals("my.sol", db.getDomain());
    }

    @Test
    public void testDuplicateDomainThrows() {
        User u1 = new User();
        u1.setPublicKey("w1");
        u1.setDomain("taken.sol");
        u1.persist();

        User u2 = new User();
        u2.setPublicKey("w2");
        u2.persist();

        ProfileService svc = new ProfileService();
        User updated = new User();
        updated.setPublicKey("w2");
        updated.setDomain("taken.sol");
        assertThrows(jakarta.ws.rs.BadRequestException.class, () -> svc.updateProfile("w2", "w2", updated));
    }

    @Test
    public void testUpdateArtTeamFlag() {
        User u = new User();
        u.setPublicKey("wg1");
        u.persist();

        ProfileService svc = new ProfileService();
        User updated = new User();
        updated.setPublicKey("wg1");
        updated.setArtTeam(true);
        svc.updateProfile("wg1", "wg1", updated);

        User db = User.find("publicKey", "wg1").firstResult();
        assertTrue(db.isArtTeam());
    }

    @Test
    public void testUpdateSocialLinks() {
        User u = new User();
        u.setPublicKey("sl1");
        u.persist();

        ProfileService svc = new ProfileService();
        User updated = new User();
        updated.setPublicKey("sl1");
        User.SocialLinks links = new User.SocialLinks();
        links.setSlingshot("code1");
        links.setAxiom("code2");
        links.setVector("code3");
        updated.setSocials(links);

        svc.updateProfile("sl1", "sl1", updated);

        User db = User.find("publicKey", "sl1").firstResult();
        assertEquals("code1", db.getSocials().getSlingshot());
        assertEquals("code2", db.getSocials().getAxiom());
        assertEquals("code3", db.getSocials().getVector());
        assertTrue(db.getBadges().contains("trader"));
    }
}
