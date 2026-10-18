import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import VocabularyTopControls from '../src/main/views/explore/word/vocabulary/VocabularyTopControls.vue'

vi.mock('../src/env-config.js', () => ({ WEB_BASE: '', API_BASE: '/api' }))
vi.mock('../src/main/components/geo/LocationAndRegionInput.vue', () => ({ default: { render: () => null } }))

let app
let host
afterEach(() => { app?.unmount(); host?.remove(); vi.useRealTimers() })

async function mountControls(expanded, overrides = {}) {
  vi.useFakeTimers()
  const props = reactive({ deferQuery: expanded, query: '', ...overrides })
  const updateQuery = vi.fn()
  const search = vi.fn()
  const refresh = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(VocabularyTopControls, {
    ...props, 'onUpdate:query': updateQuery, onSearch: search, onRefreshNotes: refresh,
  }) })
  app.use(createI18n({ legacy: false, locale: 'zh-CN', missingWarn: false, fallbackWarn: false, messages: { 'zh-CN': { common: { button: { search: '搜索' } } } } }))
  app.mount(host)
  await nextTick()
  const input = host.querySelector('.search-input')
  const type = text => { input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })) }
  return { props, updateQuery, search, refresh, type }
}

describe('vocabulary query submission in the same input', () => {
  it('uses only the existing notes action to search the latest input and apply the scope', async () => {
    const { type, updateQuery, search, refresh } = await mountControls(true, { source: 'character-notes' })
    expect(host.querySelector('.query-submit')).toBeNull()
    const button = host.querySelector('.notes-refresh-action')
    expect(button.textContent.trim()).toBe('搜索')
    expect(button.querySelector('svg circle')).not.toBeNull()
    type('注释')
    button.click()
    expect(updateQuery).toHaveBeenCalledExactlyOnceWith('注释')
    expect(refresh).toHaveBeenCalledOnce()
    expect(search).toHaveBeenCalledOnce()
    expect(updateQuery.mock.invocationCallOrder[0]).toBeLessThan(refresh.mock.invocationCallOrder[0])
  })

  it.each([true, false])('allows an empty notes search with expanded=%s', async expanded => {
    const { updateQuery, refresh, search } = await mountControls(expanded, { source: 'character-notes' })
    host.querySelector('.notes-refresh-action').click()
    expect(updateQuery).toHaveBeenCalledExactlyOnceWith('')
    expect(refresh).toHaveBeenCalledOnce()
    expect(search).toHaveBeenCalledTimes(expanded ? 1 : 0)
  })
  it('keeps large-input edits local and submits the latest text on the search button', async () => {
    const { type, updateQuery, search } = await mountControls(true)
    type('吃饭')
    await vi.advanceTimersByTimeAsync(600)
    expect(updateQuery).not.toHaveBeenCalled()
    type('饮水')
    host.querySelector('.query-submit').click()
    expect(updateQuery).toHaveBeenCalledExactlyOnceWith('饮水')
    expect(search).toHaveBeenCalledOnce()
  })

  it('preserves compact debounced querying', async () => {
    const { type, updateQuery } = await mountControls(false)
    type('吃饭')
    await vi.advanceTimersByTimeAsync(500)
    expect(updateQuery).toHaveBeenCalledExactlyOnceWith('吃饭')
  })

  it('does not submit a pending compact edit after scrolling back to the large input', async () => {
    const { type, props, updateQuery } = await mountControls(false)
    type('吃饭')
    props.deferQuery = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(600)
    expect(updateQuery).not.toHaveBeenCalled()
    expect(host.querySelector('.search-input').value).toBe('吃饭')
  })
})
