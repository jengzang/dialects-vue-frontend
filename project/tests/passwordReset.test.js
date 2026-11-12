import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import LoginForm from '../src/main/components/user/auth/LoginForm.vue'
import en from '../src/i18n/locales/en/auth.json'
import zhCN from '../src/i18n/locales/zh-CN/auth.json'
import zhHant from '../src/i18n/locales/zh-Hant/auth.json'
import { showConfirm, showSuccess } from '@/utils/ui/message.js'
import { createPasswordResetRequest } from '@/api/auth/actions.js'

vi.mock('@/utils/ui/message.js', () => ({ showConfirm: vi.fn(), showSuccess: vi.fn() }))
vi.mock('@/api/auth/actions.js', () => ({ createPasswordResetRequest: vi.fn() }))

let app, host
const settle = async () => { await Promise.resolve(); await nextTick(); await nextTick() }
function mount(locale = 'zh-CN') {
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(LoginForm)
  const i18n = createI18n({ legacy: false, locale, messages: {
    en: { auth: en }, 'zh-CN': { auth: zhCN }, 'zh-Hant': { auth: zhHant },
  }, missingWarn: false, fallbackWarn: false })
  app.use(i18n)
  app.mount(host)
  return i18n
}
function fill(name, value) {
  const input = host.querySelector(`[data-reset-${name}] input`)
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
async function open() {
  showConfirm.mockResolvedValue(true)
  host.querySelector('[data-forgot-password]').click()
  await settle()
}
function fillRequest() {
  fill('email', 'owner@gmail.com')
  fill('password', 'new-secret')
  fill('confirm', 'new-secret')
}
afterEach(() => { app?.unmount(); host?.remove(); vi.clearAllMocks() })

describe('Mail password recovery', () => {
  it('does nothing when the explanation is cancelled', async () => {
    mount()
    showConfirm.mockResolvedValue(false)
    host.querySelector('[data-forgot-password]').click()
    await settle()
    expect(host.querySelector('[data-reset-email]')).toBeNull()
    expect(createPasswordResetRequest).not.toHaveBeenCalled()
  })

  it.each(['zh-CN', 'zh-Hant', 'en'])('creates a request and keeps passwords out of mail content in %s', async locale => {
    mount(locale)
    await open()
    fillRequest()
    createPasswordResetRequest.mockResolvedValue({ request_id: 'a'.repeat(43), recipient: '2639548777@qq.com', expires_in: 1800 })
    host.querySelector('[data-reset-submit]').click()
    await settle()
    expect(createPasswordResetRequest).toHaveBeenCalledExactlyOnceWith({ email: 'owner@gmail.com', newPassword: 'new-secret' })
    const link = host.querySelector('[data-reset-mailto]')
    expect(decodeURIComponent(link.href)).toContain('subject=RESET-REQUEST')
    expect(decodeURIComponent(link.href)).toContain('RESET-REQUEST: ' + 'a'.repeat(43))
    expect(link.href).not.toContain('new-secret')
    expect(host.querySelector('textarea').value).toBe('RESET-REQUEST: ' + 'a'.repeat(43))
    expect(host.querySelector('input[type=password]')).toBeNull()
    expect(host.textContent).toContain('2639548777')
    expect(host.textContent).not.toContain('auth.reset.')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    host.querySelector('[data-reset-copy-subject]').click()
    await settle()
    expect(writeText).toHaveBeenCalledExactlyOnceWith('RESET-REQUEST')
    expect(showSuccess).toHaveBeenCalledWith(({ en, 'zh-CN': zhCN, 'zh-Hant': zhHant })[locale].reset.copied)
    expect(host.querySelector('[role=status]')).toBeNull()
    expect(host.querySelector('[data-reset-step="subject"]').classList.contains('completed')).toBe(true)
    expect(host.querySelector('[data-reset-step="recipient"]').classList.contains('completed')).toBe(false)
    host.querySelector('[data-reset-copy-recipient]').click()
    host.querySelector('[data-reset-copy]').click()
    await settle()
    expect(host.querySelectorAll('[data-reset-step].completed')).toHaveLength(3)
    host.querySelector('[data-reset-back]').click()
    await settle()
    await open()
    fillRequest()
    host.querySelector('[data-reset-submit]').click()
    await settle()
    expect(host.querySelectorAll('[data-reset-step].completed')).toHaveLength(0)
  })

  it('rejects mismatched passwords without creating a request', async () => {
    mount(); await open(); fillRequest(); fill('confirm', 'different')
    host.querySelector('[data-reset-submit]').click(); await settle()
    expect(createPasswordResetRequest).not.toHaveBeenCalled()
    expect(host.querySelector('[role=alert]')).not.toBeNull()
  })

  it('uses localized error codes instead of backend text and responds to locale changes', async () => {
    const i18n = mount('zh-CN'); await open(); fillRequest()
    createPasswordResetRequest.mockRejectedValue({ status: 429, detail: { code: 'password_reset_rate_limited' }, message: 'DO NOT SHOW THIS' })
    host.querySelector('[data-reset-submit]').click(); await settle()
    expect(host.textContent).toContain(zhCN.reset.errors.rateLimited)
    expect(host.textContent).not.toContain('DO NOT SHOW THIS')
    i18n.global.locale.value = 'en'; await settle()
    expect(host.textContent).toContain(en.reset.errors.rateLimited)
    expect(host.querySelector('[data-reset-mailto]')).toBeNull()
  })

  it('keeps the mail body selectable when clipboard permission is denied', async () => {
    mount(); await open(); fillRequest()
    createPasswordResetRequest.mockResolvedValue({ request_id: 'a'.repeat(43), recipient: '2639548777@qq.com', expires_in: 1800 })
    host.querySelector('[data-reset-submit]').click(); await settle()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    host.querySelector('[data-reset-copy]').click(); await settle()
    expect(host.querySelector('textarea').readOnly).toBe(true)
    expect(host.textContent).toContain(zhCN.reset.copyFailed)
    expect(showSuccess).not.toHaveBeenCalled()
    expect(host.querySelectorAll('[data-reset-step].completed')).toHaveLength(0)
  })
})
