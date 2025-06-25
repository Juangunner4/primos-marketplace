import fetch from 'node-fetch';

export default async function handler(req, res) {
  const targetPath = req.url.replace(/^\/proxy/, '');
  const url = `https://api-mainnet.magiceden.dev${targetPath}`;
  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    return res.status(apiRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error' });
  }
}
