import { WEB_BASE } from '../../env-config.js';
import { showRateLimitNotice } from '../../utils/rateLimitNotice.js';
import { recordLoginPromptApiHit } from '../../utils/loginPromptTracker.js';
import { userStore } from '../../main/store/store.js';

import { getToken, getTokenExpiresAt } from './tokenStorage.js';
import { clearSession, refreshAccessToken } from './session.js';

const PROACTIVE_REFRESH_WINDOW_MS = 10 * 60 * 1000;

function createApiError(
  message,
  {
    kind = 'http',
    status = 0,
    data = null,
    detail = null,
    headers = {},
    rawText = '',
    response = null,
    cause = null,
  } = {}
) {
  const error = new Error(message);
  error.kind = kind;
  error.status = status;
  error.data = data;
  error.detail = detail;
  error.headers = headers;
  error.rawText = rawText;
  error.response = response;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function safeJsonParse(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toPlainHeaders(headers) {
  const plainHeaders = {};
  headers.forEach((value, key) => {
    plainHeaders[key] = value;
  });
  return plainHeaders;
}

function parseRetryAfter(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return Math.max(0, Math.ceil(numericValue));
  }

  const parsedDate = Date.parse(value);
  if (!Number.isNaN(parsedDate)) {
    return Math.max(0, Math.ceil((parsedDate - Date.now()) / 1000));
  }

  return 0;
}

function getResponseDetail(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }
  return data.detail ?? null;
}

function getErrorMessage(detail, rawText, status) {
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (
    detail &&
    typeof detail === 'object' &&
    typeof detail.message === 'string' &&
    detail.message.trim()
  ) {
    return detail.message.trim();
  }

  if (typeof rawText === 'string' && rawText.trim()) {
    return rawText.trim();
  }

  return `Request failed with status ${status}`;
}

function buildNormalizedErrorResponse(response, rawText) {
  const parsedData = safeJsonParse(rawText);
  const data = parsedData ?? (rawText ? { detail: rawText } : null);
  const detail = getResponseDetail(data);

  return {
    status: response.status,
    ok: response.ok,
    url: response.url,
    headers: toPlainHeaders(response.headers),
    data,
    detail,
    rawText,
    original: response,
  };
}

function buildRateLimitNoticePayload(path, response) {
  const detail = response.detail;
  const detailObject = detail && typeof detail === 'object' ? detail : null;
  const retryAfterFromDetail = detailObject ? parseRetryAfter(detailObject.retry_after_seconds) : 0;
  const retryAfterFromHeader = parseRetryAfter(response.headers['retry-after']);
  const noticeMessage =
    typeof detail === 'string' && detail.trim()
      ? detail.trim()
      : detailObject?.message &&
          typeof detailObject.message === 'string' &&
          detailObject.message.trim()
        ? detailObject.message.trim()
        : typeof response.rawText === 'string' && response.rawText.trim()
          ? response.rawText.trim()
          : '';

  return {
    message: noticeMessage,
    retryAfterSeconds: retryAfterFromDetail || retryAfterFromHeader,
    resetAt: detailObject?.reset_at || '',
    limitType: detailObject?.limit_type || '',
    scope: detailObject?.scope || '',
    suggestLogin: Boolean(detailObject?.suggest_login),
    showLoginAction: !userStore.isAuthenticated && Boolean(detailObject?.suggest_login),
    isAuthenticated: userStore.isAuthenticated,
    path,
  };
}

function needsProactiveRefresh(expiresAt) {
  if (!expiresAt) {
    return true;
  }

  const now = Date.now();
  return expiresAt <= now || expiresAt - now < PROACTIVE_REFRESH_WINDOW_MS;
}

function shouldTreatAsTransientAuth(refreshResult) {
  return refreshResult.reason === 'network_error' || refreshResult.reason === 'server_error';
}

function normalizeRequestBody(body, headers) {
  if (!body) {
    return body;
  }

  if (body instanceof FormData) {
    return body;
  }

  if (!headers['Content-Type'] && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    return JSON.stringify(body);
  }

  if (headers['Content-Type'] === 'application/json' && typeof body === 'object') {
    return JSON.stringify(body);
  }

  return body;
}

async function performFetch(path, { method, headers, body, timeout }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(WEB_BASE + path, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      throw createApiError('請求超時，請稍後重試', {
        kind: 'network',
        cause: error,
      });
    }

    throw createApiError(error?.message || '網絡異常，請稍後重試', {
      kind: 'network',
      cause: error,
    });
  }
}

async function parseSuccessfulResponse(response, responseType) {
  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'text') {
    return response.text();
  }

  if (responseType === 'json') {
    return response.json();
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/vnd.openxmlformats')
  ) {
    return response.blob();
  }

  return response.text();
}

async function handleErrorResponse(path, response) {
  const rawText = await response.text();
  const normalizedResponse = buildNormalizedErrorResponse(response, rawText);
  const message = getErrorMessage(
    normalizedResponse.detail,
    normalizedResponse.rawText,
    normalizedResponse.status
  );

  if (response.status === 429) {
    const detail = normalizedResponse.data?.detail;
    const detailObj = detail && typeof detail === 'object' ? detail : null;

    if (detailObj?.code === 'online_time_rate_limited') {
      return 'suppress';
    }

    if (detailObj) {
      showRateLimitNotice(buildRateLimitNoticePayload(path, normalizedResponse));
    } else {
      const rawStr = typeof detail === 'string' ? detail.trim() : '';
      const isHtmlLike = /^\s*</.test(rawStr) || rawStr.length > 500;
      showRateLimitNotice({
        message: rawStr && !isHtmlLike ? rawStr : '请求过于频繁，请稍后再试',
      });
    }
  }

  if (response.status === 401) {
    clearSession();
    throw createApiError(message, {
      kind: 'auth',
      status: response.status,
      data: normalizedResponse.data,
      detail: normalizedResponse.detail,
      headers: normalizedResponse.headers,
      rawText: normalizedResponse.rawText,
      response: normalizedResponse,
    });
  }

  throw createApiError(message, {
    kind: 'http',
    status: response.status,
    data: normalizedResponse.data,
    detail: normalizedResponse.detail,
    headers: normalizedResponse.headers,
    rawText: normalizedResponse.rawText,
    response: normalizedResponse,
  });
}

export async function api(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 300000,
    showError = true,
    responseType = 'auto',
    loginPromptEligible = false,
  } = options;

  const requestHeaders = { ...headers };
  let token = getToken();

  if (token && needsProactiveRefresh(getTokenExpiresAt())) {
    const refreshResult = await refreshAccessToken();
    if (refreshResult.ok) {
      token = refreshResult.accessToken;
    } else if (refreshResult.reason === 'invalid_token') {
      token = null;
    }
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (!requestHeaders.Accept) {
    if (responseType === 'json') {
      requestHeaders.Accept = 'application/json';
    } else if (responseType === 'blob') {
      requestHeaders.Accept = 'application/octet-stream';
    } else {
      requestHeaders.Accept = 'application/json, text/plain, */*';
    }
  }

  const requestBody = normalizeRequestBody(body, requestHeaders);

  try {
    let response = await performFetch(path, {
      method,
      headers: requestHeaders,
      body: requestBody,
      timeout,
    });

    if (response.status === 401) {
      if (path.endsWith('/login')) {
        await handleErrorResponse(path, response);
      }

      const refreshResult = await refreshAccessToken();

      if (refreshResult.ok) {
        requestHeaders.Authorization = `Bearer ${refreshResult.accessToken}`;
        response = await performFetch(path, {
          method,
          headers: requestHeaders,
          body: requestBody,
          timeout,
        });
      } else if (refreshResult.reason === 'missing_refresh_token') {
        clearSession();
        throw createApiError('登錄狀態已失效，請重新登錄', {
          kind: 'auth',
          status: 401,
        });
      } else if (shouldTreatAsTransientAuth(refreshResult)) {
        throw createApiError('網絡異常，已保留登錄狀態，請稍後重試', {
          kind: 'network',
        });
      } else if (refreshResult.reason === 'invalid_token') {
        throw createApiError('登錄狀態已失效，請重新登錄', {
          kind: 'auth',
          status: 401,
        });
      }
    }

    if (!response.ok) {
      const handled = await handleErrorResponse(path, response);
      if (handled === 'suppress') {
        return null;
      }
    }

    const responseData = await parseSuccessfulResponse(response, responseType);

    if (loginPromptEligible) {
      recordLoginPromptApiHit(path);
    }

    return responseData;
  } catch (error) {
    if (
      showError &&
      error.kind !== 'network' &&
      error.status !== 429 &&
      typeof window.showErrorToast === 'function'
    ) {
      window.showErrorToast(error.message);
    }
    throw error;
  }
}
