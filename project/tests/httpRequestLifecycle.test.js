import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ platform: 'web', token: null, refresh: vi.fn(), toast: vi.fn() }))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mocks.platform } }))
vi.mock('@/env-config.js', () => ({ WEB_BASE: '' }))
vi.mock('@/api/auth/tokenStorage.js', () => ({ getToken: () => mocks.token, getTokenExpiresAt: () => 0 }))
vi.mock('@/api/auth/session.js', () => ({ clearSession: vi.fn(), refreshAccessToken: mocks.refresh }))
vi.mock('@/utils/ui/message.js', () => ({ showError: mocks.toast }))
vi.mock('@/utils/user/rateLimitNotice.js', () => ({ showRateLimitNotice: vi.fn() }))
vi.mock('@/utils/user/loginPromptTracker.js', () => ({ recordLoginPromptApiHit: vi.fn() }))
vi.mock('@/main/store/store.js', () => ({ userStore: { isAuthenticated: false } }))
import { api } from '../src/api/auth/httpClient.js'

function pendingBody(signal) {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
  })
}
beforeEach(() => { vi.useFakeTimers(); mocks.platform = 'web'; mocks.token = null; vi.clearAllMocks() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('HTTP request lifecycle', () => {
  it.each(['android', 'ios', 'web'])('preserves UTF-8 multipart names and content on %s', async platform => {
    vi.useRealTimers();
    mocks.platform = platform;
    const body = new FormData();
    body.append('说明', '方音圖鑑');
    body.append('file', new File(['audio'], '字表😀.xlsx', { type: 'application/octet-stream' }));
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    await api('/upload', { method: 'POST', body });
    const sent = fetch.mock.calls[0][1].body;
    if (platform === 'android') {
      // Android's installed DataOutputStream.writeBytes emits only each UTF-16 low byte.
      const decodeWireName = value => new TextDecoder().decode(Uint8Array.from(value, char => char.charCodeAt(0) & 255));
      const entries = [...sent.entries()];
      expect(decodeWireName(entries[0][0])).toBe('说明');
      expect(entries[0][1]).toBe('方音圖鑑');
      expect(decodeWireName(sent.get('file').name)).toBe('字表😀.xlsx');
      const read = file => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(file); });
      expect(await read(sent.get('file'))).toBe('audio');
    } else expect(sent).toBe(body);
    expect(body.get('file').name).toBe('字表😀.xlsx');
  });

  it('reuses multipart encoding exactly once after token refresh', async () => {
    mocks.platform = 'android';
    mocks.refresh.mockResolvedValue({ ok: true, accessToken: 'new-token' });
    const body = new FormData();
    body.append('file', new File(['one'], '字表.xlsx'));
    body.append('file', new File(['two'], '方音.xlsx'));
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    await api('/upload', { method: 'POST', body });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].body).toBe(fetch.mock.calls[0][1].body);
    expect([...fetch.mock.calls[1][1].body.keys()]).toEqual(['file', 'file']);
    expect(body.getAll('file').map(file => file.name)).toEqual(['字表.xlsx', '方音.xlsx']);
  });

  it.each(['timeout', 'cancel'])('stops waiting for a native POST ignoring AbortSignal on %s', async action => {
    let finish;
    const fetch = vi.fn(() => new Promise(resolve => { finish = resolve }));
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const pending = api('/native-post', { method: 'POST', body: { value: 1 }, timeout: 20, signal: controller.signal });
    const assertion = expect(pending).rejects.toMatchObject({ kind: action === 'timeout' ? 'network' : 'abort' });
    if (action === 'cancel') controller.abort();
    else await vi.advanceTimersByTimeAsync(21);
    await assertion;
    finish(new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('sends a successful business request once without issuing OPTIONS itself', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    await api('/api/test', { method: 'POST', body: { value: 1 } })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'POST' }))
  })

  it('sends keepalive reports immediately with the current token', async () => {
    mocks.token = 'current-token'
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    await api('/api/auth/report-online-time', { method: 'POST', body: { seconds: 12 }, keepalive: true })
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith('/api/auth/report-online-time', expect.objectContaining({
      keepalive: true,
      body: JSON.stringify({ seconds: 12 }),
      headers: expect.objectContaining({ Authorization: 'Bearer current-token' }),
    }))
  })

  it('does not send a request with an already aborted caller signal', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    controller.abort()
    await expect(api('/cancelled', { signal: controller.signal })).rejects.toMatchObject({ kind: 'abort' })
    expect(fetch).not.toHaveBeenCalled()
    expect(mocks.toast).not.toHaveBeenCalled()
  })

  it.each(['json', 'blob', 'text'])('keeps the timeout active while reading %s', async responseType => {
    let signal
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      signal = options.signal
      return { ok: true, status: 200, [responseType]: () => pendingBody(signal) }
    }))
    const result = api('/slow', { responseType, timeout: 20 })
    const assertion = expect(result).rejects.toMatchObject({ kind: 'network', message: '請求超時，請稍後重試' })
    await vi.advanceTimersByTimeAsync(21)
    await assertion
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps error response bodies inside the timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url, { signal }) => ({ ok: false, status: 500, text: () => pendingBody(signal) })))
    const result = api('/slow-error', { timeout: 20 })
    const assertion = expect(result).rejects.toMatchObject({ kind: 'network' })
    await vi.advanceTimersByTimeAsync(21)
    await assertion
  })

  it('allows caller cancellation during a body read without an error toast', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn(async (_url, { signal }) => ({ ok: true, status: 200, json: () => pendingBody(signal) })))
    const result = api('/cancel', { responseType: 'json', signal: controller.signal })
    const assertion = expect(result).rejects.toMatchObject({ kind: 'abort' })
    await vi.advanceTimersByTimeAsync(0)
    controller.abort()
    await assertion
    expect(mocks.toast).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('can stop waiting for a shared refresh without sending the business request later', async () => {
    mocks.token = 'expired'
    let finish
    mocks.refresh.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const fetch = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    const result = api('/waiting-refresh', { signal: controller.signal })
    const assertion = expect(result).rejects.toMatchObject({ kind: 'abort' })
    controller.abort()
    await assertion
    finish({ ok: true, accessToken: 'new' })
    await vi.advanceTimersByTimeAsync(0)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('removes timers and the caller listener after success', async () => {
    const controller = new AbortController()
    const remove = vi.spyOn(controller.signal, 'removeEventListener')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { headers: { 'Content-Type': 'application/json' } })))
    await expect(api('/ok', { signal: controller.signal })).resolves.toEqual({})
    expect(vi.getTimerCount()).toBe(0)
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  })
})
