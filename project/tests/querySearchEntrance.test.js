import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import QuerySearchEntrance from '../src/components/common/QuerySearchEntrance.vue'

let app
let host
const settle = async () => { await nextTick(); await nextTick() }

async function mountEntrance(overrides = {}) {
  const submit = vi.fn()
  const props = reactive({ query: '吃饭', title: '词表查询', placeholder: '输入词语', ...overrides })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(QuerySearchEntrance, { ...props, onSubmit: submit }, {
    default: () => h('textarea', { class: 'original-query', value: props.query }),
  }) })
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {
    'zh-CN': { common: { button: { search: '搜索' } } },
  } }))
  app.mount(host)
  await settle()
  return { submit, props }
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  app?.unmount()
  host?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete HTMLElement.prototype.scrollIntoView
})

describe('centered query entrance', () => {
  it('keeps typing local until clicking search and preserves the existing compact input', async () => {
    const { submit } = await mountEntrance()
    const input = host.querySelector('.query-entrance-input')
    input.value = '饮水'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect(submit).not.toHaveBeenCalled()
    expect(host.querySelector('.original-query').value).toBe('吃饭')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(submit).not.toHaveBeenCalled()
    host.querySelector('.query-entrance-submit').click()
    await settle()
    expect(submit).toHaveBeenCalledExactlyOnceWith('饮水')
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    expect(host.querySelector('.query-hero')).not.toBeNull()
  })

  it('selects a suggestion without submitting and blocks invalid Yubao entries', async () => {
    const { submit } = await mountEntrance({
      query: '吃', getSuggestions: () => ['吃饭'], validateQuery: query => query === '吃饭',
    })
    const input = host.querySelector('.query-entrance-input')
    input.dispatchEvent(new FocusEvent('focus'))
    await settle()
    expect(host.querySelector('.query-entrance-submit').disabled).toBe(true)
    const suggestion = host.querySelector('.query-suggestion')
    const pointerDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    suggestion.dispatchEvent(pointerDown)
    expect(pointerDown.defaultPrevented).toBe(true)
    suggestion.click()
    await settle()
    expect(input.value).toBe('吃饭')
    expect(submit).not.toHaveBeenCalled()
    host.querySelector('.query-entrance-submit').click()
    await settle()
    expect(submit).toHaveBeenCalledExactlyOnceWith('吃饭')
  })

  it('synchronizes compact edits and tab changes back into the large input', async () => {
    const { props } = await mountEntrance()
    props.query = '走路'
    await settle()
    expect(host.querySelector('.query-entrance-input').value).toBe('走路')
    props.queryKey = 'grammar'
    props.query = ''
    await settle()
    expect(host.querySelector('.query-entrance-input').value).toBe('')
  })

  it('honors reduced motion and can bypass the entrance for character notes', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { props } = await mountEntrance()
    host.querySelector('.query-entrance-submit').click()
    await settle()
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start', inline: 'nearest' })
    const original = host.querySelector('.original-query')
    props.enabled = false
    await settle()
    expect(host.querySelector('.query-hero')).toBeNull()
    expect(host.querySelector('.original-query')).toBe(original)
  })
})
