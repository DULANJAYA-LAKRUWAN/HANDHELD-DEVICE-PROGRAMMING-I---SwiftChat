/**
 * Application Configuration Endpoints
 * Intelligently resolves the active backend host:
 * - 127.0.0.1:8090 when USB debugging with ADB reverse is active (physical phone or emulator)
 * - Metro bundler IP if connected via LAN / Wi-Fi
 * - 10.0.2.2:8090 as emulator fallback
 */

const resolveDevHost = () => {
  // If running in browser or Node test harness
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return window.location.hostname;
  }

  // Attempt to read Metro scriptURL if running inside React Native
  try {
    const RN = typeof require !== 'undefined' ? require('react-native') : null;
    const scriptURL = RN?.NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:/]+)/);
      if (match && match[1]) {
        const host = match[1];
        if (host === 'localhost' || host === '127.0.0.1') {
          return '127.0.0.1';
        }
        return host;
      }
    }
  } catch (e) {
    // Ignore if react-native is not present in Node environment
  }

  // Default to 127.0.0.1 (ADB reverse port 8090 forwards physical USB phones and emulators directly to host PC)
  return '127.0.0.1';
};

const DEV_HOST = resolveDevHost();

export const API_BASE_URL = `http://${DEV_HOST}:8090/swiftchat-backend`;
export const WS_BASE_URL = `ws://${DEV_HOST}:8090/swiftchat-backend/ws/chat`;

// Fallback for Android emulator when ADB reverse is not active
export const FALLBACK_API_BASE_URL = 'http://10.0.2.2:8090/swiftchat-backend';
export const FALLBACK_WS_BASE_URL = 'ws://10.0.2.2:8090/swiftchat-backend/ws/chat';

