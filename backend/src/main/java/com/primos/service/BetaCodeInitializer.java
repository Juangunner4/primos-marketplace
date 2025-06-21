package com.primos.service;

import com.primos.model.BetaCode;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class BetaCodeInitializer {

    @PostConstruct
    void init() {
        if (BetaCode.count() == 0) {
            for (int i = 1; i <= 30; i++) {
                BetaCode code = new BetaCode();
                code.setCode("BETA" + i);
                code.persist();
            }
        }
    }
}
