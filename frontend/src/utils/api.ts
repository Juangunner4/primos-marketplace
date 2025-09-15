import axios from 'axios';
import { getBackendUrl } from './env';

const api = axios.create({
  baseURL: getBackendUrl(),
  headers: { 'Content-Type': 'application/json' },
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
});

export default api;
