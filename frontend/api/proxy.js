import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }

  const targetPath = req.url.replace(/^\/api\/proxy/, '');
  const url = `https://api-mainnet.magiceden.dev${targetPath}`;
  
  try {
    // We intentionally do not forward conditional request headers to avoid 304
    // responses from the Magic Eden API which can break CORS handling on some
    // browsers and hosting platforms.
    const apiRes = await fetch(url);
    
    // Set CORS headers for actual requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Forward important response headers
    if (apiRes.headers.get('etag')) {
      res.setHeader('etag', apiRes.headers.get('etag'));
    }
    if (apiRes.headers.get('last-modified')) {
      res.setHeader('last-modified', apiRes.headers.get('last-modified'));
    }
    if (apiRes.headers.get('cache-control')) {
      res.setHeader('cache-control', apiRes.headers.get('cache-control'));
    }
    if (apiRes.headers.get('content-type')) {
      res.setHeader('content-type', apiRes.headers.get('content-type'));
    }

    // Some hosting platforms strip CORS headers from 304 responses. If we
    // encounter a 304 status, return an empty response with a 200 status instead
    // so browsers do not treat it as a CORS failure.
    if (apiRes.status === 304) {
      return res.status(200).end();
    }

    // For other successful responses, parse JSON
    if (apiRes.ok) {
      const data = await apiRes.json();
      return res.status(apiRes.status).json(data);
    } else {
      // For error responses, try to get error details
      let errorData;
      try {
        errorData = await apiRes.json();
      } catch {
        errorData = { error: 'API request failed', status: apiRes.status };
      }
      return res.status(apiRes.status).json(errorData);
    }
  } catch (e) {
    console.error('Proxy error:', e);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Proxy error', details: e.message });
  }
}
