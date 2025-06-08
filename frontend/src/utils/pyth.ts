// The SOL/USD price feed ID from Pyth docs (double-check for latest)
const SOL_PRICE_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (
  url: string,
  options?: RequestInit,
  retries = 3,
  backoff = 500
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await sleep(backoff * (i + 1));
  }
  return fetch(url, options);
};

let cachedPrice: { ts: number; value: number | null } | null = null;
const CACHE_TTL = 60_000; // 1 minute

// Fetch SOL price from Pyth's public price service REST API
export const getPythSolPrice = async (): Promise<number | null> => {
  if (cachedPrice && Date.now() - cachedPrice.ts < CACHE_TTL) {
    return cachedPrice.value;
  }
  try {
    const url = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${SOL_PRICE_FEED_ID}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) return null;
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
      const result = price * Math.pow(10, expo);
      cachedPrice = { ts: Date.now(), value: result };
      return result;
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch SOL price from Pyth:", e);
    return null;
  }
};
