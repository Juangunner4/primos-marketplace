package com.weys.service;

import java.util.List;
import java.util.logging.Logger;

import com.weys.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class UserService {

    private static final Logger LOG = Logger.getLogger(UserService.class.getName());

    public User getUser(String publicKey) {
        LOG.info(() -> "Fetching user with public key: " + publicKey);
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) {
            LOG.info("User not found for public key: " + publicKey);
            throw new NotFoundException();
        }
        return user;
    }

    /**
     * Retrieves all users who have joined the DAO. Membership is tracked in the
     * database via the {@code daoMember} flag, which is updated whenever a user
     * logs in or when scheduled jobs reconcile on‑chain holdings.
     */
    public List<User> getDaoMembers() {
        LOG.info("Retrieving DAO members");
        // "Weys" page should list every DAO member stored in the database.
        //
        // The previous implementation queried users by the `weyHolder` flag,
        // which reflects whether the user currently holds a Wey NFT on-chain.
        // This field may be `false` even for members who have previously joined
        // the DAO (for example after selling their NFT) which caused the API to
        // return an empty list for valid members.  The frontend relies on this
        // endpoint to populate the Weys page, so we instead filter by the
        // `daoMember` field that represents membership status.
        List<User> users = User.list("daoMember", true);
        LOG.info(() -> "DAO members found: " + users.size());
        return users;
    }

    /**
     * Fetches users who currently hold at least one Wey NFT. The
     * {@code weyHolder} flag is maintained by login flows and background jobs
     * that synchronize on‑chain data with the database, so this query simply
     * reflects the latest state stored in MongoDB.
     */
    public List<User> getWeyHolders() {
        LOG.info("Retrieving Wey holders");
        return User.list("weyHolder", true);
    }

    public User getByDomain(String domain) {
        LOG.info(() -> "Fetching user by domain: " + domain);
        if (domain == null || domain.isEmpty()) {
            LOG.info("Domain was null or empty");
            throw new NotFoundException();
        }
        return User.find("domain", domain.toLowerCase()).firstResult();
    }
}
