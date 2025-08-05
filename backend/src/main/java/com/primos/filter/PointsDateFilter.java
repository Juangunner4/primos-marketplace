package com.primos.filter;

import java.io.IOException;
import java.time.LocalDate;

import com.primos.model.User;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.USER)
public class PointsDateFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String walletKey = requestContext.getHeaderString("X-Public-Key");
        if (walletKey != null && !walletKey.isEmpty()) {
            User user = User.find("publicKey", walletKey).firstResult();
            if (user != null) {
                user.setPointsDate(LocalDate.now().toString());
                user.persistOrUpdate();
            }
        }
    }
}
