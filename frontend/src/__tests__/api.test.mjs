import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import api from '../services/api.js';

describe('ApiClient Smoke & Unit Tests', () => {
  let client;

  beforeEach(() => {
    // Instantiate isolated client for testing
    client = new api.constructor('http://127.0.0.1:8090/swiftchat-backend');
  });

  it('should initialize with configured base URL and null authToken', () => {
    assert.strictEqual(client.baseUrl, 'http://127.0.0.1:8090/swiftchat-backend');
    assert.strictEqual(client.authToken, null);
  });

  it('should store and update authToken', () => {
    client.setAuthToken('jwt.sample.token');
    assert.strictEqual(client.authToken, 'jwt.sample.token');

    client.setAuthToken(null);
    assert.strictEqual(client.authToken, null);
  });

  it('should expose all required authentication and chat API methods', () => {
    const requiredMethods = [
      'login',
      'register',
      'searchUsers',
      'getUserChats',
      'getOrCreateChat',
      'getChatMessages',
      'markChatAsRead',
      'getUserProfile',
      'updateUserProfile',
    ];

    for (const method of requiredMethods) {
      assert.strictEqual(
        typeof client[method],
        'function',
        `ApiClient must implement method: ${method}`
      );
    }
  });

  it('should attach Authorization Bearer header when token is present', async () => {
    let capturedHeaders = null;
    let capturedUrl = null;

    // Mock global fetch for this isolated test
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedHeaders = options.headers;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, message: 'OK', data: [] }),
        };
      };

      client.setAuthToken('test-secret-jwt-token');
      const result = await client.getUserChats(42);

      assert.strictEqual(
        capturedUrl,
        'http://127.0.0.1:8090/swiftchat-backend/api/chats?userId=42'
      );
      assert.strictEqual(
        capturedHeaders['Authorization'],
        'Bearer test-secret-jwt-token'
      );
      assert.strictEqual(capturedHeaders['Content-Type'], 'application/json');
      assert.strictEqual(result.success, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should format search queries correctly with URL parameters', async () => {
    let capturedUrl = null;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: [] }),
        };
      };

      await client.searchUsers('john', 10);
      assert.ok(capturedUrl.includes('/api/users/search?'));
      assert.ok(capturedUrl.includes('query=john'));
      assert.ok(capturedUrl.includes('excludeId=10'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should properly bubble up error status and message on HTTP failure', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, message: 'Invalid credentials provided.' }),
      });

      await assert.rejects(
        async () => {
          await client.login('testuser', 'wrongpass');
        },
        (err) => {
          assert.strictEqual(err.status, 401);
          assert.strictEqual(err.message, 'Invalid credentials provided.');
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
