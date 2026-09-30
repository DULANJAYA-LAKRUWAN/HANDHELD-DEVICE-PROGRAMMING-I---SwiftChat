import { API_BASE_URL } from '../constants/config.js';

/**
 * Lightweight HTTP Client for SwiftChat Backend REST APIs
 * Wraps standard Fetch API with JSON serialization and structured error handling.
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Core request dispatcher
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      let data = null;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        let cleanMessage = text;
        if (text && (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<title>'))) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/i);
          cleanMessage = titleMatch
            ? `${titleMatch[1].trim()} (${response.status})`
            : `Server returned HTTP ${response.status}`;
        }
        data = { message: cleanMessage };
      }

      if (!response.ok) {
        const errorMessage =
          (data && data.message) ||
          `Request failed with status ${response.status} (${response.statusText})`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        const networkError = new Error(
          'Unable to reach backend server. Please verify the server is running on ' + this.baseUrl
        );
        networkError.status = 0;
        throw networkError;
      }
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  // Authentication API endpoints
  login(username, password) {
    return this.post('/api/auth/login', { username, password });
  }

  register(username, password, contactNo) {
    return this.post('/api/auth/register', { username, password, contactNo });
  }

  // User and Chat discovery (ready for Phase 3B)
  searchUsers(query, excludeId) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (excludeId) params.append('excludeId', excludeId);
    return this.get(`/api/users/search?${params.toString()}`);
  }

  getUserChats(userId) {
    return this.get(`/api/chats?userId=${userId}`);
  }

  getOrCreateChat(initiatorId, targetId) {
    return this.post('/api/chats', { initiatorId, targetId });
  }

  getChatMessages(chatId, userId) {
    const url = userId
      ? `/api/chats/messages?chatId=${chatId}&userId=${userId}`
      : `/api/chats/messages?chatId=${chatId}`;
    return this.get(url);
  }

  markChatAsRead(chatId, userId) {
    return this.post(`/api/chats/${chatId}/read?userId=${userId}`, {});
  }

  getUserProfile(userId) {
    return this.get(`/api/users/profile?userId=${userId}`);
  }

  updateUserProfile(userId, data) {
    return this.post('/api/users/profile', { userId, ...data });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
