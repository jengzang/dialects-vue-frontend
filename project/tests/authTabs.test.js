import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import auth from '../src/i18n/locales/zh-Hant/auth.json'
import LoginForm from '../src/main/components/user/auth/LoginForm.vue'
import ModifyProfileForm from '../src/main/components/user/auth/ModifyProfileForm.vue'
import ProfileOverview from '../src/main/components/user/auth/ProfileOverview.vue'

vi.mock('@/api', () => ({ getCustomCounts: vi.fn(async () => ({ success: true, custom_region_total: 0, custom_data_total: 0 })) }))
vi.mock('@/main/components/user/auth/UserAvatarEditor.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/user/LeaderboardPanel.vue', () => ({ default: { template: '<div data-leaderboard />' } }))

let app, host
const settle = async () => { await Promise.resolve(); await nextTick(); await nextTick() }
async function mount(component, initial, events = () => ({})) {
  const state = reactive(initial)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push('/auth?view=overview')
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(component, { ...state, ...events(state) }) })
  app.use(router)
  app.use(createI18n({ legacy: false, locale: 'zh-Hant', messages: { 'zh-Hant': { auth } }, missingWarn: false, fallbackWarn: false, warnHtmlMessage: false }))
  app.mount(host)
  await settle()
  expect(host.querySelector('.tabs-wrapper--segmented [role="group"]')).not.toBeNull()
  return { state, router }
}
function fill(selector, value) {
  const input = host.querySelector(selector)
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
const choices = () => host.querySelectorAll('.tabs .tab')
afterEach(() => { app?.unmount(); host?.remove() })

describe('Auth shared segmented switches', () => {
  it('keeps account drafts, clears passwords on login mode changes and submits the correct credentials', async () => {
    const submit = vi.fn()
    const { router } = await mount(LoginForm, { loginMode: 'email' }, state => ({
      'onUpdate:loginMode': value => { state.loginMode = value }, onSubmit: submit,
    }))
    fill('input[type="email"]', 'me@example.com')
    fill('input[type="password"]', 'secret')
    choices()[1].click()
    await settle()
    expect(host.querySelector('input[type="password"]').value).toBe('')
    fill('input[type="text"]', '原用戶 🎙️')
    fill('input[type="password"]', 'new-secret')
    host.querySelector('.auth-submit-button').click()
    expect(submit).toHaveBeenCalledExactlyOnceWith({ username: '原用戶 🎙️', password: 'new-secret' })
    choices()[0].click()
    await settle()
    expect(host.querySelector('input[type="email"]').value).toBe('me@example.com')
    expect(host.querySelector('input[type="password"]').value).toBe('')
    expect(router.currentRoute.value.fullPath).toBe('/auth?view=overview')
  })

  it('keeps modification drafts and the original save events', async () => {
    const save = vi.fn()
    await mount(ModifyProfileForm, { modeType: 'username', user: { id: 1, username: '原名' } }, state => ({
      'onUpdate:modeType': value => { state.modeType = value }, onSaveUsername: save,
    }))
    fill('input', '新名字')
    choices()[1].click()
    await settle()
    expect(host.querySelectorAll('input[type="password"]')).toHaveLength(3)
    choices()[0].click()
    await settle()
    expect(host.querySelector('input').value).toBe('新名字')
    host.querySelector('.btn-search').click()
    expect(save).toHaveBeenCalledExactlyOnceWith({ newUsername: '新名字' })
  })

  it('forwards profile selection through its existing callback', async () => {
    const switchTab = vi.fn()
    const { state } = await mount(ProfileOverview, { currentTab: 'overview', user: { id: 1, username: '原名' }, queryStats: {} }, state => ({
      onSwitchTab: value => { switchTab(value); state.currentTab = value },
    }))
    choices()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(switchTab).not.toHaveBeenCalled()
    choices()[1].click()
    await settle()
    expect(switchTab).toHaveBeenCalledExactlyOnceWith('leaderboard')
    expect(state.currentTab).toBe('leaderboard')
    expect(host.querySelector('[data-leaderboard]')).not.toBeNull()
    expect(choices()[1].getAttribute('aria-pressed')).toBe('true')
  })
})
