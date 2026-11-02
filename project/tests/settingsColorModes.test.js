import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import SettingsPage from '../src/main/views/menu/support/SettingsPage.vue'
import { setColorTheme } from '../src/composables/core/uiPreferences.js'
import navigation from '../src/i18n/locales/en/navigation.json'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/en/menu/settings' }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../src/i18n/index.js', () => ({ setLocale: vi.fn() }))
vi.mock('../src/utils/ui/message.js', () => ({ showSuccess: vi.fn(), showError: vi.fn() }))
vi.mock('../src/utils/user/updateNoticeConfig.js', () => ({ getHomeUpdateNotice: () => ({}) }))
vi.mock('../src/main/config/index.js', () => ({ TABLE_COLUMN_SCHEMAS: {} }))
vi.mock('../src/main/store/store.js', async () => {
  const { ref } = await import('vue')
  return {
    preferredCharacterTable: ref(''), setPreferredCharacterTable: vi.fn(),
    tutorialEnabled: ref(true), setTutorialEnabled: vi.fn(),
    zhongguInputMode: ref('selector'), setZhongguInputMode: vi.fn(),
  }
})
vi.mock('../src/main/components/user/popups/SupportPopup.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../src/components/ToastAndHelp/HelpIcon.vue', () => ({ default: { template: '<span />' } }))
vi.mock('../src/components/selector/SimpleSelectDropdown.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../src/components/common/SwitchToggle.vue', () => ({ default: { template: '<div />' } }))

describe('settings color and brightness selection', () => {
  let app, host
  beforeEach(() => {
    localStorage.clear()
    setColorTheme('blue-light')
    host = document.createElement('div')
    document.body.append(host)
  })
  afterEach(() => {
    app?.unmount()
    host.remove()
    setColorTheme('blue-light')
  })
  function mount() {
    app = createApp(SettingsPage)
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en: { navigation } }, missingWarn: false, fallbackWarn: false }))
    app.mount(host)
  }
  async function select(name, value) {
    const input = host.querySelector(`input[name="${name}"][value="${value}"]`)
    expect(input, `${name}: ${value}`).not.toBeNull()
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
  }
  it('changes family without losing brightness and changes brightness without losing family', async () => {
    mount()
    await select('settings-color-mode', 'dark')
    expect(document.documentElement.dataset.colorTheme).toBe('blue-dark')
    await select('settings-color-theme', 'red')
    expect(document.documentElement.dataset.colorTheme).toBe('red-dark')
    await select('settings-color-mode', 'light')
    expect(document.documentElement.dataset.colorTheme).toBe('red-light')
    await select('settings-color-theme', 'green')
    expect(document.documentElement.dataset.colorTheme).toBe('green-light')
    await select('settings-color-mode', 'dark')
    expect(document.documentElement.dataset.colorTheme).toBe('green-dark')
  })
  it('restores both controls from the existing green dark preference', () => {
    setColorTheme('green')
    mount()
    expect(host.querySelector('input[name="settings-color-theme"]:checked')?.value).toBe('green')
    expect(host.querySelector('input[name="settings-color-mode"]:checked')?.value).toBe('dark')
  })
})
