import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import TabsContainer from '../src/components/common/TabsContainer.vue'

let app
let host
const settle = async () => { await Promise.resolve(); await nextTick(); await nextTick() }

async function mountTabs(overrides = {}, withRouter = true) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  await router.push('/before')
  await router.push('/tools?keep=yes')
  const update = vi.fn()
  const change = vi.fn()
  const props = reactive({
    tabs: [
      { name: 'upload', label: '上傳錄音' },
      { name: 'results', label: '分析結果', disabled: true },
      { name: 'vowelspace', label: '元音空間' },
    ],
    modelValue: 'upload',
    useRouter: false,
    ...overrides,
  })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({
    render: () => h(TabsContainer, {
      ...props,
      'onUpdate:modelValue': update,
      onTabChange: change,
    }, {
      'tab-extra': () => h('button', { 'data-extra': '' }, '特徵選擇'),
      header: () => h('h1', '頁面標題'),
      default: ({ currentTab }) => [
        h('input', { 'data-draft': '', style: { display: currentTab === 'upload' ? '' : 'none' } }),
        h('span', { 'data-current': '' }, currentTab),
      ],
    }),
  })
  app.use(createI18n({ legacy: false, locale: 'zh-Hant', messages: {} }))
  if (withRouter) app.use(router)
  app.mount(host)
  await settle()
  return { props, router, update, change }
}

afterEach(() => { app?.unmount(); host?.remove(); vi.restoreAllMocks() })

describe('TabsContainer modes and interaction', () => {
  it('supports controlled switches without installing a router', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { change } = await mountTabs({ mode: 'segmented', navigationOnly: true }, false)
    host.querySelectorAll('.tab')[2].click()
    expect(change).toHaveBeenCalledExactlyOnceWith('vowelspace')
    expect(warn).not.toHaveBeenCalled()
  })

  it('renders navigation-only segmented choices without dangling panels or layout content', async () => {
    const { props, update, change, router } = await mountTabs({
      mode: 'segmented', navigationOnly: true, ariaLabel: '分區', size: 'compact', variant: 'solid',
    })
    const group = host.querySelector('[role="group"]')
    expect(group).not.toBeNull()
    expect(group.getAttribute('aria-label')).toBe('分區')
    expect(host.querySelector('.tab-content')).toBeNull()
    expect(host.querySelector('.tabs-header')).toBeNull()
    const buttons = group.querySelectorAll('button')
    expect(buttons[0].getAttribute('type')).toBe('button')
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
    expect(buttons[0].hasAttribute('aria-controls')).toBe(false)
    expect(buttons[0].hasAttribute('role')).toBe(false)
    buttons[0].focus()
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(buttons[2])
    expect(change).not.toHaveBeenCalled()
    buttons[1].click()
    expect(change).not.toHaveBeenCalled()
    buttons[2].click()
    expect(update).toHaveBeenCalledExactlyOnceWith('vowelspace')
    expect(change).toHaveBeenCalledExactlyOnceWith('vowelspace')
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
    props.modelValue = 'vowelspace'
    await settle()
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true')
    expect(router.currentRoute.value.fullPath).toBe('/tools?keep=yes')
  })

  it('defaults to underline and accepts adaptive without changing slot content', async () => {
    const { props } = await mountTabs()
    expect(host.querySelector('.tabs-wrapper--underline')).not.toBeNull()
    const input = host.querySelector('[data-draft]')
    props.mode = 'adaptive'
    await settle()
    expect(host.querySelector('.tabs-wrapper--adaptive')).not.toBeNull()
    expect(host.querySelector('[data-draft]')).toBe(input)
    expect(host.querySelector('h1').textContent).toBe('頁面標題')
  })

  it('blocks disabled tabs without route changes or emitted events', async () => {
    const { update, change, router } = await mountTabs()
    const disabled = host.querySelectorAll('.tab')[1]
    expect(disabled.tagName).toBe('BUTTON')
    expect(disabled.disabled).toBe(true)
    disabled.click()
    disabled.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    expect(update).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/tools?keep=yes')
  })

  it('leaves local selection and navigation under parent control', async () => {
    const { props, router, update, change } = await mountTabs()
    const input = host.querySelector('[data-draft]')
    input.value = '保留錄音設定 🎙️'
    host.querySelectorAll('.tab')[2].click()
    await settle()
    expect(update).toHaveBeenCalledExactlyOnceWith('vowelspace')
    expect(change).toHaveBeenCalledExactlyOnceWith('vowelspace')
    expect(host.querySelector('[data-current]').textContent).toBe('upload')
    expect(router.currentRoute.value.fullPath).toBe('/tools?keep=yes')
    props.modelValue = 'vowelspace'
    await settle()
    expect(host.querySelector('[data-draft]')).toBe(input)
    expect(input.value).toBe('保留錄音設定 🎙️')
    expect(input.style.display).toBe('none')
  })

  it('associates the internal tablist and panel, keeping extra controls outside the tablist', async () => {
    await mountTabs()
    const tablist = host.querySelector('[role="tablist"]')
    expect(tablist).not.toBeNull()
    expect(tablist.querySelector('[data-extra]')).toBeNull()
    expect(host.querySelector('[data-extra]')).not.toBeNull()
    const selected = tablist.querySelector('[aria-selected="true"]')
    const panel = host.querySelector('[role="tabpanel"]')
    expect(selected.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(selected.id)
  })

  it('moves keyboard focus past disabled tabs without activating a panel', async () => {
    const { change } = await mountTabs()
    const tabs = host.querySelectorAll('.tab')
    tabs[0].focus()
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(tabs[2])
    expect(change).not.toHaveBeenCalled()
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(document.activeElement).toBe(tabs[0])
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(document.activeElement).toBe(tabs[2])
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(tabs[0])
  })

  it('uses vertical arrows when adaptive navigation is rendered as a column', async () => {
    await mountTabs({ mode: 'adaptive' })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ flexDirection: 'column' })
    const tabs = host.querySelectorAll('.tab')
    tabs[0].focus()
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(tabs[0])
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement).toBe(tabs[2])
  })

  it('reveals a selected overflow tab using coordinates relative to its offset navigation', async () => {
    const { props } = await mountTabs()
    const nav = host.querySelector('.tabs')
    const target = host.querySelectorAll('.tab')[2]
    Object.defineProperties(nav, {
      offsetLeft: { value: 100 },
      scrollWidth: { value: 400 },
      clientWidth: { value: 150 },
    })
    Object.defineProperties(target, {
      offsetLeft: { value: 160 },
      offsetWidth: { value: 80 },
    })
    nav.scrollTo = vi.fn()
    props.modelValue = 'vowelspace'
    await settle()
    expect(nav.scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 90 })
  })

  it('renders route links and replaces history using the parent route resolver', async () => {
    const { router, change } = await mountTabs({
      useRouter: true,
      routeValue: 'vowelspace',
      resolveRoute: (name, route) => ({ path: `/menu/${name}`, query: route.query }),
    })
    const selected = host.querySelector('.tab.active')
    expect(selected.tagName).toBe('A')
    expect(selected.getAttribute('href')).toBe('/menu/vowelspace?keep=yes')
    expect(selected.getAttribute('aria-current')).toBe('page')
    host.querySelectorAll('.tab')[0].click()
    await settle()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/menu/upload?keep=yes'))
    expect(change).toHaveBeenCalledExactlyOnceWith('upload')
    router.back()
    await settle()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/before'))
  })

  it('preserves the legacy query resolver and does not emit a switch for modified link clicks', async () => {
    const { router, change } = await mountTabs({ useRouter: true })
    const link = host.querySelectorAll('.tab')[2]
    expect(link.getAttribute('href')).toBe('/tools?keep=yes&sub=vowelspace')
    host.addEventListener('click', event => event.preventDefault(), { once: true })
    link.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true }))
    await settle()
    expect(change).not.toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/tools?keep=yes')
    link.click()
    await settle()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/tools?keep=yes&sub=vowelspace'))
  })
})
