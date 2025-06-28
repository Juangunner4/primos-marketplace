package com.primos.service;

import static org.junit.jupiter.api.Assertions.*;

import com.primos.model.BetaCode;
import org.junit.jupiter.api.Test;

public class BetaCodeInitializerTest {
    @Test
    public void testInitCreatesCodesWhenNoneExist() {
        // ensure no codes exist
        BetaCode.deleteAll();
        BetaCodeInitializer init = new BetaCodeInitializer();
        init.init();
        assertEquals(30, BetaCode.count());
    }
}
