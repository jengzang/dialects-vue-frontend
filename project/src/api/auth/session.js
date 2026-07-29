import i18n from '../../i18n/index.js';
import { showWarning } from '../../utils/ui/message.js';
import { WEB_BASE } from '../../env-config.js';
import { userStore } from '../../main/store/store.js';

import {
  clearStoredTokens,
  clearUserCache,
  getRefreshToken,
  getToken,
  getTokenExpiresAt,
  getUserCache,
  saveToken,
  saveUserCache,
} from './tokenStorage.js';

export const AUTH_API_BASE = '/api/auth';

const REQUEST_TIMEOUT = 300000;

let refreshPromise = null;
let authReadyPromise = Promise.resolve({ user: null, role: 'anonymous' });
let backgroundValidationPromise = null;
let degradedNoticeShown = false;

function hasKnownUser(userData) {
  return Boolean(userData?.id || userData?.username);
}

function normalizeRole(role) {
  return role && role !== 'anonymous' ? role : 'user';
}

function buildFallbackUserFromStore() {
  if (userStore.role !== 'anonymous' || userStore.id || userStore.username) {
    return {
      id: userStore.id,
      username: userStore.username,
      role: userStore.role === 'anonymous' ? 'user' : userStore.role,
    };
  }
  return null;
}

function clearDegradedNotice() {
  degradedNoticeShown = false;
}

function notifyDegradedSessionOnce() {
  if (degradedNoticeShown) {
    return;
  }

  degradedNoticeShown = true;
  showWarning(i18n.global.t('auth.messages.sessionPreserved'));
}

function applyAuthenticatedUser(userData, { authReady = true, persistCache = true } = {}) {
  if (persistCache && userData) {
    saveUserCache(userData);
  }

  userStore.id = userData?.id ?? null;
  userStore.username = userData?.username ?? null;
  userStore.role = normalizeRole(userData?.role);
  userStore.isAuthenticated = true;
  userStore.authReady = authReady;
  userStore.sessionStatus = 'authenticated';
  clearDegradedNotice();

  return userData;
}

function setInitializingSession() {
  userStore.authReady = false;
  userStore.sessionStatus = 'initializing';
}

function setAnonymousSession({ authReady = true } = {}) {
  userStore.id = null;
  userStore.username = null;
  userStore.role = 'anonymous';
  userStore.isAuthenticated = false;
  userStore.authReady = authReady;
  userStore.sessionStatus = 'anonymous';
  clearDegradedNotice();

  return { user: null, role: 'anonymous' };
}

export function markSessionDegraded(fallbackUser = null) {
  const userData = fallbackUser || getUserCache() || buildFallbackUserFromStore();

  userStore.id = userData?.id ?? userStore.id ?? null;
  userStore.username = userData?.username ?? userStore.username ?? null;
  userStore.role = normalizeRole(userData?.role || userStore.role);
  userStore.isAuthenticated = true;
  userStore.authReady = true;
  userStore.sessionStatus = 'degraded';

  if (hasKnownUser(userData)) {
    saveUserCache(userData);
  }

  notifyDegradedSessionOnce();
  return userData;
}

export function clearSession() {
  clearStoredTokens();
  clearUserCache();
  authReadyPromise = Promise.resolve(setAnonymousSession({ authReady: true }));
  backgroundValidationPromise = null;
}

function createRequestError(message, { status = 0, kind = 'server', detail = null, rawText = '', cause = null } = {}) {
  const error = new Error(message);
  error.status = status;
  error.kind = kind;
  error.detail = detail;
  error.rawText = rawText;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestAuthJson(path, { method = 'GET', token = null, body = null } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const headers = {
    Accept: 'application/json, text/plain, */*',
  };

  let requestBody = body;
  if (body != null) {
    headers['Content-Type'] = 'application/json';
    requestBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(WEB_BASE + path, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const rawText = await response.text();
      const message = rawText.trim() || `Request failed with status ${response.status}`;
      throw createRequestError(message, {
        status: response.status,
        kind: response.status === 401 || response.status === 403 ? 'auth' : 'server',
        rawText,
      });
    }

    return parseJsonResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error?.status) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw createRequestError('請求超時，請稍後重試', {
        kind: 'network',
        cause: error,
      });
    }

    throw createRequestError(error?.message || 'Network request failed', {
      kind: 'network',
      cause: error,
    });
  }
}

async function fetchCurrentUserFromServer(tokenOverride = null) {
  const token = tokenOverride || getToken();
  if (!token) {
    throw createRequestError('Missing access token', {
      kind: 'auth',
      status: 401,
    });
  }

  return requestAuthJson(`${AUTH_API_BASE}/me`, {
    token,
  });
}

function resolveRefreshFailure(result, fallbackUser = null) {
  if (result.reason === 'invalid_token') {
    return { user: null, role: 'anonymous' };
  }

  markSessionDegraded(fallbackUser);
  return {
    user: fallbackUser || buildFallbackUserFromStore(),
    role: normalizeRole((fallbackUser || buildFallbackUserFromStore())?.role),
  };
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return { ok: false, reason: 'missing_refresh_token' };
    }

    try {
      const response = await fetch(WEB_BASE + `${AUTH_API_BASE}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.status === 401 || response.status === 403) {
        clearSession();
        return { ok: false, reason: 'invalid_token', status: response.status };
      }

      if (!response.ok) {
        markSessionDegraded();
        return { ok: false, reason: 'server_error', status: response.status };
      }

      const data = await response.json();
      saveToken(data.access_token, data.refresh_token, data.expires_in);

      if (userStore.sessionStatus === 'degraded') {
        userStore.sessionStatus = 'authenticated';
        clearDegradedNotice();
      }

      return {
        ok: true,
        reason: 'ok',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      markSessionDegraded();
      return { ok: false, reason: 'network_error', error };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function initUserByToken({ forceRefresh = false, console_log = false } = {}) {
  const token = getToken();

  if (!token) {
    return setAnonymousSession({ authReady: true });
  }

  const cachedUser = getUserCache();
  if (cachedUser && !forceRefresh) {
    applyAuthenticatedUser(cachedUser, {
      authReady: true,
      persistCache: false,
    });
    return { user: cachedUser, role: normalizeRole(cachedUser.role) };
  }

  const expiresAt = getTokenExpiresAt();
  if (expiresAt && expiresAt <= Date.now()) {
    const refreshResult = await refreshAccessToken();
    if (!refreshResult.ok) {
      return resolveRefreshFailure(refreshResult, cachedUser);
    }
  }

  try {
    const userData = await fetchCurrentUserFromServer();
    applyAuthenticatedUser(userData, { authReady: true });

    if (console_log) {
      console.log('✅ 远程获取用户信息成功', userData);
    }

    return { user: userData, role: normalizeRole(userData.role) };
  } catch (error) {
    if (console_log) {
      console.error('🔒 [initUserByToken] 获取用户信息失败:', error);
    }

    if (error.kind === 'auth') {
      clearSession();
      return { user: null, role: 'anonymous' };
    }

    const degradedUser = markSessionDegraded(cachedUser);
    return {
      user: degradedUser,
      role: normalizeRole(degradedUser?.role),
    };
  }
}

export async function update_userdatas_bytoken(token, console_log = false) {
  try {
    const userData = await fetchCurrentUserFromServer(token);
    applyAuthenticatedUser(userData, { authReady: true });

    if (console_log) {
      console.log('✅ 用户数据已更新:', userData);
    }

    return userData;
  } catch (error) {
    if (error.kind === 'auth') {
      clearSession();
      return null;
    }

    markSessionDegraded();
    console.error('❌ 無法更新用戶資料', error);
    return null;
  }
}

export async function getUserRole() {
  if (!getToken()) {
    setAnonymousSession({ authReady: true });
    return 'anonymous';
  }

  if (userStore.isAuthenticated && userStore.role) {
    return userStore.role;
  }

  const cachedUser = getUserCache();
  if (cachedUser) {
    applyAuthenticatedUser(cachedUser, {
      authReady: true,
      persistCache: false,
    });
    return normalizeRole(cachedUser.role);
  }

  const userData = await update_userdatas_bytoken(null, false);
  if (userData?.role) {
    return userData.role;
  }

  return userStore.isAuthenticated ? normalizeRole(userStore.role) : 'anonymous';
}

export function bootstrapAuthSession() {
  const token = getToken();

  if (!token) {
    authReadyPromise = Promise.resolve(setAnonymousSession({ authReady: true }));
    return authReadyPromise;
  }

  const cachedUser = getUserCache();
  if (cachedUser) {
    applyAuthenticatedUser(cachedUser, {
      authReady: true,
      persistCache: false,
    });
    authReadyPromise = Promise.resolve({
      user: cachedUser,
      role: normalizeRole(cachedUser.role),
    });

    if (!backgroundValidationPromise) {
      backgroundValidationPromise = initUserByToken({ forceRefresh: true })
        .finally(() => {
          backgroundValidationPromise = null;
        });
    }

    return authReadyPromise;
  }

  setInitializingSession();
  authReadyPromise = initUserByToken({ forceRefresh: true });
  return authReadyPromise;
}

export async function waitForAuthReady() {
  if (userStore.authReady) {
    return {
      user: buildFallbackUserFromStore(),
      role: userStore.isAuthenticated ? normalizeRole(userStore.role) : 'anonymous',
    };
  }

  return authReadyPromise;
}

export async function ensureAuthenticated(e) {
  await waitForAuthReady();

  if (userStore.isAuthenticated) {
    return {
      id: userStore.id,
      username: userStore.username,
    };
  }

  const token = getToken();
  if (token) {
    const userData = await update_userdatas_bytoken(token, false);
    if (userData) {
      return {
        id: userData.id,
        username: userData.username,
      };
    }

    if (userStore.isAuthenticated) {
      return {
        id: userStore.id,
        username: userStore.username,
      };
    }
  }

  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  return false;
}

export async function reportOnlineTime(duration) {
  const token = getToken();
  if (!token || duration <= 0) {
    return false;
  }

  const seconds = Math.max(1, Math.min(3600, Math.floor(duration)));

  try {
    await requestAuthJson(`${AUTH_API_BASE}/report-online-time`, {
      method: 'POST',
      token,
      body: { seconds },
    });
    return true;
  } catch {
    return false;
  }
}
