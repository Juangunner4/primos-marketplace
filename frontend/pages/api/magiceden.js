import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Extract or default query params
  const { offset = 0, limit = 20 } = req.query;
  const apiUrl = `https://api-mainnet.magiceden.dev/v2/collections/primos/activities?offset=${offset}&limit=${limit}`;

  const apiRes = await fetch(apiUrl);
  const data = await apiRes.json();

  // Inject CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json(data);
}
