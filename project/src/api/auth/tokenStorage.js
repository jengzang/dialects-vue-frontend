import { getCurrentRuntimePlatform } from '@/platform/runtime.js'
import { getPlatformStorage } from '@/platform/storage.js'

const USER_CACHE_KEY = 'user_info_cache'
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'
const LEGACY_ACCESS_TOKEN_KEY = 'ACCESS_TOKEN'
const LEGACY_TOKEN_EXP_KEY = 'TOKEN_EXP'
const CUSTOM_DATA_EXISTS_KEY = 'custom-data-exists'

const LEGACY_WEB_STORAGE_KEYS = [
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRES_AT_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  LEGACY_TOKEN_EXP_KEY,
  USER_CACHE_KEY,
]

function clearLegacyWebStorage() {
  try {
    LEGACY_WEB_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // localStorage unavailable: nothing to clean up.
  }
}

let nativeWebview

// Resolved lazily so the native bridge is read after platform bootstrap, and native builds
// keep tokens in Capacitor Preferences while the web keeps using localStorage untouched.
function isNativeWebview() {
  if (nativeWebview === undefined) {
    nativeWebview = getCurrentRuntimePlatform().container === 'native-webview'
    if (nativeWebview) {
      clearLegacyWebStorage()
    }
  }
  return nativeWebview
}

function storage() {
  return isNativeWebview() ? getPlatformStorage('local') : window.localStorage
}

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

export function getToken() {
  let token = storage().getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    token = getCookie(ACCESS_TOKEN_KEY);
  }
  if (!token) {
    token = storage().getItem(LEGACY_ACCESS_TOKEN_KEY);
  }
  return token;
}

export function getRefreshToken() {
  let token = storage().getItem(REFRESH_TOKEN_KEY);
  if (!token) {
    token = getCookie(REFRESH_TOKEN_KEY);
  }
  return token;
}

export function getTokenExpiresAt() {
  const expiresAt = storage().getItem(TOKEN_EXPIRES_AT_KEY);
  if (!expiresAt) {
    return null;
  }

  const parsed = Number.parseInt(expiresAt, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCookieOptions(expiresAt) {
  const expiresDate = new Date(expiresAt);
  const secureFlag = window.location.protocol === 'https:' ? 'secure; ' : '';
  return `${secureFlag}samesite=Lax; expires=${expiresDate.toUTCString()}`;
}

function setCookie(name, value, expiresAt) {
  document.cookie = `${name}=${value}; path=/; ${getCookieOptions(expiresAt)}`;
}

function clearCookie(name) {
  const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
  [
    `${name}=; path=/; expires=${expiredDate}`,
    `${name}=; path=/; samesite=Lax; expires=${expiredDate}`,
    `${name}=; path=/; secure; samesite=None; expires=${expiredDate}`,
  ].forEach((cookieValue) => {
    document.cookie = cookieValue;
  });
}

export function saveToken(accessToken, refreshToken = null, expiresIn = 1800) {
  const expiresAt = Date.now() + expiresIn * 1000;

  storage().setItem(ACCESS_TOKEN_KEY, accessToken);
  storage().setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken);

  setCookie(ACCESS_TOKEN_KEY, accessToken, expiresAt);
  setCookie(LEGACY_ACCESS_TOKEN_KEY, accessToken, expiresAt);

  if (!refreshToken) {
    return;
  }

  storage().setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage().setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
  setCookie(REFRESH_TOKEN_KEY, refreshToken, expiresAt);
}

export function saveUserCache(userData) {
  try {
    storage().setItem(USER_CACHE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('缓存用户信息失败', error);
  }
}

export function getUserCache() {
  try {
    const cached = storage().getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function clearUserCache() {
  storage().removeItem(USER_CACHE_KEY);
  storage().removeItem(CUSTOM_DATA_EXISTS_KEY);
}

export function clearStoredTokens() {
  storage().removeItem(ACCESS_TOKEN_KEY);
  storage().removeItem(REFRESH_TOKEN_KEY);
  storage().removeItem(TOKEN_EXPIRES_AT_KEY);
  storage().removeItem(LEGACY_ACCESS_TOKEN_KEY);
  storage().removeItem(LEGACY_TOKEN_EXP_KEY);

  clearCookie(ACCESS_TOKEN_KEY);
  clearCookie(REFRESH_TOKEN_KEY);
  clearCookie(LEGACY_ACCESS_TOKEN_KEY);
}
