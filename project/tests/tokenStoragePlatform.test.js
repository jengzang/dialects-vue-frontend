import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createPreferences(initialKeys = {}) {
  const values = new Map(Object.entries(initialKeys))
  return {
    values,
    keys: vi.fn(async () => ({ keys: [...values.keys()] })),
    get: vi.fn(async ({ key }) => ({ value: values.get(key) ?? null })),
    set: vi.fn(async ({ key, value }) => { values.set(key, value) }),
    remove: vi.fn(async ({ key }) => { values.delete(key) }),
  }
}

async function loadNativeTokenStorage(initialKeys = {}) {
  const { initializePlatformServices } = await import('../src/platform/index.js')
  // Importing platform/index pulls in @capacitor/core, which replaces window.Capacitor.
  window.Capacitor = { getPlatform: () => 'android', isPluginAvailable: () => true }
  const preferences = createPreferences(initialKeys)
  await initializePlatformServices({ preferences })
  const tokenStorage = await import('../src/api/auth/tokenStorage.js')
  return { tokenStorage, preferences }
}

async function loadWebTokenStorage() {
  delete window.Capacitor
  return import('../src/api/auth/tokenStorage.js')
}

function clearAllCookies() {
  document.cookie
    .split(';')
    .map(segment => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      const name = segment.split('=')[0]
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    })
}

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  sessionStorage.clear()
  clearAllCookies()
  delete window.Capacitor
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('token storage in native webviews', () => {
  it('writes tokens into Capacitor Preferences instead of localStorage', async () => {
    const { tokenStorage, preferences } = await loadNativeTokenStorage()

    tokenStorage.saveToken('access-token', 'refresh-token', 1800)

    expect(preferences.values.get('local:access_token')).toBe('access-token')
    expect(preferences.values.get('local:refresh_token')).toBe('refresh-token')
    expect(Number(preferences.values.get('local:token_expires_at'))).toBeGreaterThan(Date.now())
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('reads tokens back from Capacitor Preferences', async () => {
    const { tokenStorage } = await loadNativeTokenStorage({
      'local:access_token': 'stored-access',
      'local:refresh_token': 'stored-refresh',
      'local:token_expires_at': '1234567890',
    })

    expect(tokenStorage.getToken()).toBe('stored-access')
    expect(tokenStorage.getRefreshToken()).toBe('stored-refresh')
    expect(tokenStorage.getTokenExpiresAt()).toBe(1234567890)
  })

  it('clears every token key from Capacitor Preferences', async () => {
    const { tokenStorage, preferences } = await loadNativeTokenStorage()
    tokenStorage.saveToken('access-token', 'refresh-token', 1800)

    tokenStorage.clearStoredTokens()

    expect(tokenStorage.getToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
    expect(tokenStorage.getTokenExpiresAt()).toBeNull()
    expect(preferences.values.size).toBe(0)
  })

  it('discards pre-update localStorage credentials on first native access', async () => {
    localStorage.setItem('access_token', 'legacy-access')
    localStorage.setItem('ACCESS_TOKEN', 'legacy-access')
    localStorage.setItem('refresh_token', 'legacy-refresh')
    localStorage.setItem('user_info_cache', '{"id":1,"username":"old"}')

    const { tokenStorage } = await loadNativeTokenStorage()
    tokenStorage.getToken()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user_info_cache')).toBeNull()
  })

  it('round-trips the user cache through Capacitor Preferences', async () => {
    const { tokenStorage } = await loadNativeTokenStorage()

    tokenStorage.saveUserCache({ id: 7, username: 'alice', role: 'user' })

    expect(tokenStorage.getUserCache()).toEqual({ id: 7, username: 'alice', role: 'user' })
    expect(localStorage.getItem('user_info_cache')).toBeNull()
  })
})

describe('token storage on web', () => {
  it('keeps using localStorage and cookies unchanged', async () => {
    const tokenStorage = await loadWebTokenStorage()

    tokenStorage.saveToken('web-access', 'web-refresh', 1800)

    expect(localStorage.getItem('access_token')).toBe('web-access')
    expect(localStorage.getItem('ACCESS_TOKEN')).toBe('web-access')
    expect(localStorage.getItem('refresh_token')).toBe('web-refresh')
    expect(document.cookie).toContain('access_token=web-access')
    expect(tokenStorage.getToken()).toBe('web-access')
  })
})
