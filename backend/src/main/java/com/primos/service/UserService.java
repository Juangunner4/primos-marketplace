package com.primos.service;

import java.util.List;
import java.util.logging.Logger;

import com.primos.model.User;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class UserService {

    private static final Logger LOG = Logger.getLogger(UserService.class.getName());

    public User getUser(String publicKey, String walletKey) {
        LOG.info(() -> "Fetching user with public key: " + publicKey);
        User user = User.find("publicKey", publicKey).firstResult();
        if (user == null) {
            LOG.info("User not found for public key: " + publicKey);
            throw new NotFoundException();
        }
        return user;
    }

    public List<User> getDaoMembers(String walletKey) {
        LOG.info("Retrieving DAO members");
        // "Primos" page should list every DAO member stored in the database.
        //
        // The previous implementation queried users by the `primoHolder` flag,
        // which reflects whether the user currently holds a Primo NFT on-chain.
        // This field may be `false` even for members who have previously joined
        // the DAO (for example after selling their NFT) which caused the API to
        // return an empty list for valid members.  The frontend relies on this
        // endpoint to populate the Primos page, so we instead filter by the
        // `daoMember` field that represents membership status.
        List<User> users = User.list("daoMember", true);
        LOG.info(() -> "DAO members found: " + users.size());
        return users;
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
