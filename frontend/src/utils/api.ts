import axios from 'axios';
import { getBackendUrl } from './env';

const api = axios.create({
  baseURL: getBackendUrl(),
  headers: { 'Content-Type': 'application/json' },
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
});

api.interceptors.request.use((config) => {
  const { baseURL } = config;
  const requestUrl = typeof config.url === 'string' ? config.url : '';

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(requestUrl);

  let resolvedUrl: URL | null = null;

  try {
    if (hasProtocol) {
      resolvedUrl = new URL(requestUrl);
    } else if (requestUrl) {
      resolvedUrl = new URL(requestUrl, baseURL || getBackendUrl());
    } else if (baseURL) {
      resolvedUrl = new URL(baseURL);
    }
  } catch (error) {
    // Fall through so axios can surface its own error for malformed URLs
  }

  if (resolvedUrl?.protocol === 'data:') {
    throw new Error('Requests using the data: protocol are not allowed.');
  }

  return config;
});

export default api;
