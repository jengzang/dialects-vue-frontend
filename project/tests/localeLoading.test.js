import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ cn: vi.fn(), en: vi.fn() }))
vi.mock('../src/i18n/localeDetector', () => ({ getCurrentLocale: () => 'zh-Hant', saveLocale: vi.fn() }))

describe('locale loading', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.cn.mockReset().mockResolvedValue({ greeting: '你好' })
    mocks.en.mockReset().mockResolvedValue({ greeting: 'Hello' })
    vi.doMock('../src/i18n/locales/zh-CN', async () => ({ default: await mocks.cn() }))
    vi.doMock('../src/i18n/locales/en', async () => ({ default: await mocks.en() }))
  })

  it('keeps fallback available and only loads a requested language once', async () => {
    const { default: i18n, loadLocaleMessages, setLocale } = await import('../src/i18n')
    expect(i18n.global.availableLocales).toEqual(['zh-Hant'])
    expect(mocks.en).not.toHaveBeenCalled()
    await Promise.all([loadLocaleMessages('en'), loadLocaleMessages('en')])
    expect(mocks.en).toHaveBeenCalledTimes(1)
    await setLocale('en')
    expect(i18n.global.t('greeting')).toBe('Hello')
    expect(document.documentElement.lang).toBe('en')
    expect(mocks.cn).not.toHaveBeenCalled()
  })

  it('does not let an older slow language switch overwrite the newest choice', async () => {
    let resolveEnglish
    mocks.en.mockImplementation(() => new Promise(resolve => { resolveEnglish = resolve }))
    const { default: i18n, setLocale } = await import('../src/i18n')
    const oldSwitch = setLocale('en')
    await vi.waitFor(() => expect(resolveEnglish).toBeTypeOf('function'))
    await setLocale('zh-Hant')
    resolveEnglish({ greeting: 'Hello' })
    expect(await oldSwitch).toBe(false)
    expect(i18n.global.locale.value).toBe('zh-Hant')
    expect(document.documentElement.lang).toBe('zh-Hant')
  })

  it('preserves the active language when loading fails and allows another attempt', async () => {
    mocks.cn.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ greeting: '你好' })
    const { default: i18n, setLocale } = await import('../src/i18n')
    await expect(setLocale('zh-CN')).rejects.toThrow()
    expect(i18n.global.locale.value).toBe('zh-Hant')
    vi.doMock('../src/i18n/locales/zh-CN', async () => ({ default: await mocks.cn() }))
    await setLocale('zh-CN')
    expect(i18n.global.t('greeting')).toBe('你好')
  })
})
