// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { describe, expect, it, vi } from 'vitest';
import config from '../capacitor.config.json';

const require = createRequire(import.meta.url);
// Execute the installed Capacitor bridge, rather than reimplementing its fetch patch.
const bridge = readFileSync(require.resolve('@capacitor/android/capacitor/src/main/assets/native-bridge.js'), 'utf8');

function loadBridge(platform) {
  const dom = new JSDOM('', { url: 'https://localhost', runScripts: 'outside-only' });
  const win = dom.window;
  Object.assign(win, { Request, Response, Headers, ReadableStream, TextDecoder });
  win.WEBVIEW_SERVER_URL = platform === 'ios' ? 'capacitor://localhost' : 'https://localhost';
  const webFetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([0, 128, 255])));
  win.fetch = webFetch;
  const enabled = config.plugins?.CapacitorHttp?.enabled === true;
  if (platform === 'android') {
    win.androidBridge = { postMessage() {} };
    win.CapacitorHttpAndroidInterface = { isEnabled: () => enabled };
  } else if (platform === 'ios') {
    win.webkit = { messageHandlers: { bridge: { postMessage() {} } } };
    win.prompt = payload => String(JSON.parse(payload).type === 'CapacitorHttp' && enabled);
  }
  win.eval(bridge);
  win.Capacitor.nativePromise = vi.fn().mockResolvedValue({
    status: 200, headers: { 'Content-Type': 'application/json' }, data: { ok: true },
    url: 'https://dialects.yzup.top/api/test',
  });
  return { dom, win, webFetch, native: win.Capacitor.nativePromise };
}

it('leaves browser fetch unchanged', () => {
  const { dom, win, webFetch } = loadBridge('web');
  try { expect(win.fetch).toBe(webFetch); }
  finally { dom.window.close(); }
});

describe.each(['android', 'ios'])('%s installed native HTTP bridge', platform => {
  it('sends an authenticated JSON POST to native exactly once, without web fetch', async () => {
    const { dom, win, webFetch, native } = loadBridge(platform);
    try {
      const response = await win.fetch('https://dialects.yzup.top/api/test', {
        method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 1 }),
      });
      expect(await response.json()).toEqual({ ok: true });
      expect(webFetch).not.toHaveBeenCalled();
      expect(native).toHaveBeenCalledTimes(1);
      expect(native).toHaveBeenCalledWith('CapacitorHttp', 'request', expect.objectContaining({
        method: 'POST', headers: expect.objectContaining({ authorization: 'Bearer test' }),
      }));
    } finally { dom.window.close(); }
  });

  it('routes remote GET through the local native proxy and preserves binary bytes', async () => {
    const { dom, win, webFetch, native } = loadBridge(platform);
    try {
      const remote = 'https://dialects.yzup.top/audio.wav?a=1';
      const response = await win.fetch(remote, { headers: { Authorization: 'Bearer test' } });
      expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([0, 128, 255]);
      expect(webFetch).toHaveBeenCalledTimes(1);
      const proxy = new URL(webFetch.mock.calls[0][0]);
      expect(proxy.pathname).toBe('/_capacitor_http_interceptor_');
      expect(proxy.searchParams.get('u')).toBe(remote);
      expect(native).not.toHaveBeenCalled();
    } finally { dom.window.close(); }
  });

  it('serializes multipart files and fields for the native upload', async () => {
    const { dom, win, webFetch, native } = loadBridge(platform);
    try {
      const body = new win.FormData();
      body.append('label', '音频');
      body.append('file', new win.File([new Uint8Array([0, 128, 255])], 'test.wav', { type: 'audio/wav' }));
      await win.fetch('https://dialects.yzup.top/upload', { method: 'POST', body });
      expect(webFetch).not.toHaveBeenCalled();
      expect(native).toHaveBeenCalledWith('CapacitorHttp', 'request', expect.objectContaining({
        dataType: 'formData', data: expect.arrayContaining([
          { key: 'label', value: '音频', type: 'string' },
          { key: 'file', value: 'AID/', type: 'base64File', contentType: 'audio/wav', fileName: 'test.wav' },
        ]),
      }));
    } finally { dom.window.close(); }
  });
});
