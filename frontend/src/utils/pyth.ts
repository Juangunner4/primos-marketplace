import { HermesClient } from "@pythnetwork/hermes-client";
import { parsePriceData } from "@pythnetwork/client";

// The SOL/USD price feed ID from Pyth docs (double-check for latest)
const SOL_PRICE_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

// Fetch SOL price from Pyth's public price service REST API
export const getPythSolPrice = async (): Promise<number | null> => {
    try {
        const url = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${SOL_PRICE_FEED_ID}`;
        const res = await fetch(url);
        const data = await res.json();

        if (
            Array.isArray(data) &&
            data.length > 0 &&
            data[0].price &&
            typeof data[0].price.price === "string" &&
            typeof data[0].price.expo === "number"
        ) {
            const price = Number(data[0].price.price);
            const expo = data[0].price.expo;
            return price * Math.pow(10, expo);
        }
        return null;
    } catch (e) {
        return null;
    }
};