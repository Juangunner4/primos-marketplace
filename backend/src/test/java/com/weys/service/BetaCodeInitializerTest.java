package com.weys.service;

import static org.junit.jupiter.api.Assertions.*;

import com.weys.model.BetaCode;
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
