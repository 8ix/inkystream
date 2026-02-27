/**
 * @jest-environment node
 */

/**
 * Tests for authentication utilities
 */

import {
  isProduction,
  getApiKey,
  isAuthEnabled,
  extractApiKey,
  validateApiKey,
  requireApiKey,
  generateApiKey,
} from '@/lib/utils/auth';

// Minimal request mock — auth only needs .url and .headers.get()
function makeRequest(url: string, headers: Record<string, string> = {}): any {
  return {
    url,
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
  };
}

describe('Auth Utils', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.INKYSTREAM_API_KEY;
  });

  // ---------------------------------------------------------------------------
  describe('isProduction', () => {
    it('returns true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('returns false in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
    });

    it('returns false in development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getApiKey', () => {
    it('returns null when INKYSTREAM_API_KEY is not set', () => {
      delete process.env.INKYSTREAM_API_KEY;
      expect(getApiKey()).toBeNull();
    });

    it('returns the configured key', () => {
      process.env.INKYSTREAM_API_KEY = 'test-key-abc123';
      expect(getApiKey()).toBe('test-key-abc123');
    });

    it('returns null when INKYSTREAM_API_KEY is an empty string', () => {
      process.env.INKYSTREAM_API_KEY = '';
      expect(getApiKey()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('isAuthEnabled', () => {
    it('returns false in development even with a key set', () => {
      process.env.NODE_ENV = 'test';
      process.env.INKYSTREAM_API_KEY = 'some-key';
      expect(isAuthEnabled()).toBe(false);
    });

    it('returns false in production with no key configured', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.INKYSTREAM_API_KEY;
      expect(isAuthEnabled()).toBe(false);
    });

    it('returns true in production with a key configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'some-key';
      expect(isAuthEnabled()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  describe('extractApiKey', () => {
    it('extracts key from ?key= query parameter', () => {
      const req = makeRequest('http://localhost/api/test?key=mykey123');
      expect(extractApiKey(req)).toBe('mykey123');
    });

    it('extracts key from Authorization Bearer header', () => {
      const req = makeRequest('http://localhost/api/test', {
        Authorization: 'Bearer myheaderkey',
      });
      expect(extractApiKey(req)).toBe('myheaderkey');
    });

    it('prefers query parameter over Authorization header', () => {
      const req = makeRequest('http://localhost/api/test?key=querykey', {
        Authorization: 'Bearer headerkey',
      });
      expect(extractApiKey(req)).toBe('querykey');
    });

    it('returns null when no key is present', () => {
      const req = makeRequest('http://localhost/api/test');
      expect(extractApiKey(req)).toBeNull();
    });

    it('returns null for non-Bearer Authorization schemes', () => {
      const req = makeRequest('http://localhost/api/test', {
        Authorization: 'Basic dXNlcjpwYXNz',
      });
      expect(extractApiKey(req)).toBeNull();
    });

    it('returns null when Authorization header has no token after Bearer', () => {
      // 'Bearer' without trailing space does not match 'Bearer '
      const req = makeRequest('http://localhost/api/test', {
        Authorization: 'Bearer',
      });
      expect(extractApiKey(req)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('validateApiKey', () => {
    it('allows any request in development (no key configured)', () => {
      process.env.NODE_ENV = 'test';
      expect(validateApiKey(null)).toBe(true);
      expect(validateApiKey('anything')).toBe(true);
      expect(validateApiKey('wrong-key')).toBe(true);
    });

    it('allows access in production when no key is configured', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.INKYSTREAM_API_KEY;
      expect(validateApiKey(null)).toBe(true);
    });

    it('rejects null key in production when key is configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'correct-key-value';
      expect(validateApiKey(null)).toBe(false);
    });

    it('rejects wrong key in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'correct-key-value';
      expect(validateApiKey('wrong-key-value!')).toBe(false);
    });

    it('rejects key of different length (timing-safe short-circuit)', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'correct-key-value';
      expect(validateApiKey('short')).toBe(false);
    });

    it('accepts the correct key in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'correct-key-value';
      expect(validateApiKey('correct-key-value')).toBe(true);
    });

    it('is case-sensitive', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'MySecretKey12345';
      expect(validateApiKey('mysecretkey12345')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  describe('requireApiKey', () => {
    it('returns null (allow) in development regardless of key', () => {
      process.env.NODE_ENV = 'test';
      process.env.INKYSTREAM_API_KEY = 'some-key';
      const req = makeRequest('http://localhost/api/test');
      expect(requireApiKey(req)).toBeNull();
    });

    it('returns null when production key matches query param', async () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'validkey';
      const req = makeRequest('http://localhost/api/test?key=validkey');
      expect(requireApiKey(req)).toBeNull();
    });

    it('returns null when production key matches Bearer header', () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'validkey';
      const req = makeRequest('http://localhost/api/test', {
        Authorization: 'Bearer validkey',
      });
      expect(requireApiKey(req)).toBeNull();
    });

    it('returns 401 response when key is missing in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'required-key';
      const req = makeRequest('http://localhost/api/test');
      const response = requireApiKey(req);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/unauthorized/i);
    });

    it('returns 401 response when wrong key is provided in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.INKYSTREAM_API_KEY = 'correct-key';
      const req = makeRequest('http://localhost/api/test?key=wrong-key');
      const response = requireApiKey(req);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe('generateApiKey', () => {
    it('generates a 32-character string', () => {
      const key = generateApiKey();
      expect(key).toHaveLength(32);
    });

    it('only contains alphanumeric characters', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^[A-Za-z0-9]{32}$/);
    });

    it('generates different keys on successive calls', () => {
      const keys = new Set(Array.from({ length: 10 }, () => generateApiKey()));
      expect(keys.size).toBeGreaterThan(1);
    });
  });
});
