import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
}

async function loadAuthModules() {
  globalThis.__WEB_BASE__ = '';

  const tokenStorage = await import('../src/api/auth/tokenStorage.js');
  const session = await import('../src/api/auth/session.js');
  const httpClient = await import('../src/api/auth/httpClient.js');
  const { userStore } = await import('../src/main/store/store.js');

  return {
    ...tokenStorage,
    ...session,
    ...httpClient,
    userStore,
  };
}

function clearAllCookies() {
  document.cookie
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      const name = segment.split('=')[0];
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  clearAllCookies();
  globalThis.__WEB_BASE__ = '';
});

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('auth session lifecycle', () => {
  it.each(['headers', 'body'])('times out native refresh ignoring AbortSignal during %s without accepting a late token', async phase => {
    const { refreshAccessToken, saveToken, getToken } = await loadAuthModules();
    saveToken('access-token', 'refresh-token', 1800);
    vi.useFakeTimers();
    let finish;
    const stalled = new Promise(resolve => { finish = resolve; });
    global.fetch = vi.fn(() => phase === 'headers' ? stalled : Promise.resolve({
      ok: true, status: 200, json: () => stalled,
    }));
    let result;
    const pending = refreshAccessToken().then(value => { result = value; });
    await vi.advanceTimersByTimeAsync(15001);
    expect(result).toMatchObject({ ok: false, reason: 'network_error' });
    const lateToken = { access_token: 'late', refresh_token: 'late-refresh', expires_in: 1800 };
    finish(phase === 'headers' ? jsonResponse(lateToken) : lateToken);
    await pending;
    await vi.advanceTimersByTimeAsync(0);
    expect(getToken()).toBe('access-token');
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(lateToken));
    await expect(refreshAccessToken()).resolves.toMatchObject({ ok: true });
  });

  it.each(['headers', 'body'])('bounds a stalled refresh %s and releases single flight', async phase => {
    const { refreshAccessToken, saveToken, getToken } = await loadAuthModules();
    saveToken('access-token', 'refresh-token', 1800);
    vi.useFakeTimers();
    let signal;
    global.fetch = vi.fn(async (_url, options) => {
      signal = options.signal;
      const stalled = () => new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
      });
      return phase === 'headers' ? stalled() : { ok: true, status: 200, json: stalled };
    });
    const pending = refreshAccessToken();
    await vi.advanceTimersByTimeAsync(15001);
    expect(signal?.aborted).toBe(true);
    await expect(pending).resolves.toMatchObject({ ok: false, reason: 'network_error' });
    expect(getToken()).toBe('access-token');
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'new', refresh_token: 'new-refresh', expires_in: 1800 }));
    await expect(refreshAccessToken()).resolves.toMatchObject({ ok: true });
  });

  it('restores a cached authenticated session synchronously during bootstrap', { timeout: 10000 }, async () => {

    const {
      bootstrapAuthSession,
      saveToken,
      saveUserCache,
      userStore,
    } = await loadAuthModules();

    global.fetch = vi.fn().mockResolvedValue(jsonResponse({
      id: 7,
      username: 'alice',
      role: 'user',
    }));

    saveToken('access-token', 'refresh-token', 1800);
    saveUserCache({
      id: 7,
      username: 'alice',
      role: 'user',
    });

    bootstrapAuthSession();

    expect(userStore.authReady).toBe(true);
    expect(userStore.sessionStatus).toBe('authenticated');
    expect(userStore.isAuthenticated).toBe(true);
    expect(userStore.username).toBe('alice');
  });

  it('keeps the session and marks it degraded when refresh fails because of the network', async () => {
    const {
      bootstrapAuthSession,
      refreshAccessToken,
      saveToken,
      saveUserCache,
      getToken,
      userStore,
    } = await loadAuthModules();

    saveToken('access-token', 'refresh-token', 1800);
    saveUserCache({
      id: 7,
      username: 'alice',
      role: 'user',
    });

    bootstrapAuthSession();

    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await refreshAccessToken();

    expect(result).toMatchObject({ reason: 'network_error', ok: false });
    expect(getToken()).toBe('access-token');
    expect(userStore.isAuthenticated).toBe(true);
    expect(userStore.sessionStatus).toBe('degraded');
  });

  it('clears the session when refresh explicitly returns 401', async () => {
    const {
      refreshAccessToken,
      saveToken,
      saveUserCache,
      getToken,
      userStore,
    } = await loadAuthModules();

    saveToken('access-token', 'refresh-token', 1800);
    saveUserCache({
      id: 7,
      username: 'alice',
      role: 'user',
    });

    global.fetch = vi.fn().mockResolvedValue(jsonResponse(
      { detail: 'invalid refresh token' },
      { status: 401 },
    ));

    const result = await refreshAccessToken();

    expect(result).toMatchObject({ reason: 'invalid_token', ok: false });
    expect(getToken()).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
    expect(userStore.sessionStatus).toBe('anonymous');
  });

  it('waits for remote validation when bootstrapping with a token but no cached user', async () => {
    const {
      bootstrapAuthSession,
      waitForAuthReady,
      saveToken,
      userStore,
    } = await loadAuthModules();

    global.fetch = vi.fn().mockResolvedValue(jsonResponse({
      id: 11,
      username: 'bob',
      role: 'user',
    }));

    saveToken('access-token', 'refresh-token', 1800);

    bootstrapAuthSession();

    expect(userStore.authReady).toBe(false);
    expect(userStore.sessionStatus).toBe('initializing');

    await waitForAuthReady();

    expect(userStore.authReady).toBe(true);
    expect(userStore.isAuthenticated).toBe(true);
    expect(userStore.sessionStatus).toBe('authenticated');
    expect(userStore.username).toBe('bob');
  });

  it('keeps the session when a protected request gets 401 but refresh is only temporarily unavailable', async () => {
    const {
      api,
      bootstrapAuthSession,
      saveToken,
      saveUserCache,
      getToken,
      userStore,
    } = await loadAuthModules();

    saveToken('access-token', 'refresh-token', 1800);
    saveUserCache({
      id: 7,
      username: 'alice',
      role: 'user',
    });
    bootstrapAuthSession();

    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired access token' }, { status: 401 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api('/api/protected')).rejects.toMatchObject({ kind: 'network' });

    expect(getToken()).toBe('access-token');
    expect(userStore.isAuthenticated).toBe(true);
    expect(userStore.sessionStatus).toBe('degraded');
  });
});
