import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Extract or default query params
  const { symbol = 'primos', offset = 0, limit = 20 } = req.query;
  const apiUrl = `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?offset=${offset}&limit=${limit}`;

  try {
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();

    // Inject CORS headers (match proxy.js)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    res.status(200).json(data);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(500).json({ error: 'Failed to fetch Magic Eden activities', details: e.message });
  }
}
