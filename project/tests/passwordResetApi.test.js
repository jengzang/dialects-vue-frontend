import { afterEach, expect, it, vi } from 'vitest'
import { showRateLimitNotice } from '@/utils/user/rateLimitNotice.js'
import { showError } from '@/utils/ui/message.js'

vi.mock('@/utils/user/rateLimitNotice.js', () => ({ showRateLimitNotice: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showError: vi.fn() }))
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

it('sends passwords only in HTTPS request bodies, never in URLs', async () => {
  vi.stubGlobal('__WEB_BASE__', '')
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ request_id: 'token', expires_in: 1800 }), {
    status: 202, headers: { 'Content-Type': 'application/json' }
  }))
  vi.stubGlobal('fetch', fetch)
  const { createPasswordResetRequest } = await import('../src/api/auth/actions.js')
  await createPasswordResetRequest({ email: 'owner@gmail.com', newPassword: 'new-secret' })
  const [url, options] = fetch.mock.calls[0]
  expect(url).toBe('/api/auth/password-reset/requests')
  expect(options.method).toBe('POST')
  expect(JSON.parse(options.body)).toEqual({ email: 'owner@gmail.com', new_password: 'new-secret' })
})

it('leaves reset errors to the translated form without global backend-text notices', async () => {
  vi.stubGlobal('__WEB_BASE__', '')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: { code: 'password_reset_rate_limited' } }), {
    status: 429, headers: { 'Content-Type': 'application/json' }
  })))
  const { createPasswordResetRequest } = await import('../src/api/auth/actions.js')
  await expect(createPasswordResetRequest({ email: 'owner@gmail.com', newPassword: 'new-secret' })).rejects.toMatchObject({ detail: { code: 'password_reset_rate_limited' } })
  expect(showRateLimitNotice).not.toHaveBeenCalled()
  expect(showError).not.toHaveBeenCalled()
})
