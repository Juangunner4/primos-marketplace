import { getBackendUrl } from '../env';

describe('getBackendUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns value from env', () => {
    process.env.REACT_APP_BACKEND_URL = 'http://test';
    expect(getBackendUrl()).toBe('http://test');
  });

  test('returns default when env missing', () => {
    delete process.env.REACT_APP_BACKEND_URL;
    expect(getBackendUrl()).toBe('http://localhost:8080');
  });
});
