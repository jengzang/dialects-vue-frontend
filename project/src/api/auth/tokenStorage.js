const USER_CACHE_KEY = 'user_info_cache';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at';
const LEGACY_ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const LEGACY_TOKEN_EXP_KEY = 'TOKEN_EXP';
const CUSTOM_DATA_EXISTS_KEY = 'custom-data-exists';

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

export function getToken() {
  let token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    token = getCookie(ACCESS_TOKEN_KEY);
  }
  if (!token) {
    token = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  }
  return token;
}

export function getRefreshToken() {
  let token = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!token) {
    token = getCookie(REFRESH_TOKEN_KEY);
  }
  return token;
}

export function getTokenExpiresAt() {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
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

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken);

  setCookie(ACCESS_TOKEN_KEY, accessToken, expiresAt);
  setCookie(LEGACY_ACCESS_TOKEN_KEY, accessToken, expiresAt);

  if (!refreshToken) {
    return;
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
  setCookie(REFRESH_TOKEN_KEY, refreshToken, expiresAt);
}

export function saveUserCache(userData) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('缓存用户信息失败', error);
  }
}

export function getUserCache() {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
  localStorage.removeItem(CUSTOM_DATA_EXISTS_KEY);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_EXP_KEY);

  clearCookie(ACCESS_TOKEN_KEY);
  clearCookie(REFRESH_TOKEN_KEY);
  clearCookie(LEGACY_ACCESS_TOKEN_KEY);
}
