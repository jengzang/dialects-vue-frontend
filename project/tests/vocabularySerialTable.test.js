import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import UniversalTable from '../src/main/components/TableAndTree/UniversalTable.vue'

const mocks = vi.hoisted(() => ({ query: vi.fn(), normal: vi.fn(), loaded: vi.fn() }))
vi.mock('@/api', () => ({
  sqlQuery: mocks.normal, distinctQuery: vi.fn(), mutateSingleRow: vi.fn(),
  batchMutate: vi.fn(), batchReplacePreview: vi.fn(), batchReplaceExecute: vi.fn(),
  vocabularySqlApi: { query: mocks.query },
}))
vi.mock('@/main/store/store.js', () => ({ userStore: { role: 'anonymous' } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/utils/ui/message.js', () => ({ showSuccess: vi.fn(), showWarning: vi.fn(), showConfirm: vi.fn(), showError: vi.fn() }))

let app, host
const settle = async () => { for (let i = 0; i < 12; i++) await nextTick() }
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
async function mount(apiAdapter = 'vocabulary') {
  host = document.createElement('div'); document.body.append(host)
  app = createApp({ render: () => h(UniversalTable, { apiAdapter, dbKey: 'vocabulary', tableName: 'vocabulary_entries', columns: [{ key: 'word', label: 'word' }], onDataLoaded: mocks.loaded }) })
  app.mount(host); await settle()
}
async function search(text, delay = 500) {
  const input = host.querySelector('.search-input')
  input.value = text; input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick(); await vi.advanceTimersByTimeAsync(delay); await settle()
}
beforeEach(() => {
  vi.useFakeTimers()
  mocks.query.mockReset().mockResolvedValue({ data: [], total: 0 })
  mocks.normal.mockReset().mockResolvedValue({ data: [], total: 0 })
  mocks.loaded.mockClear()
})
afterEach(() => { app?.unmount(); host?.remove(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('vocabulary table serial queries', () => {
  it.each(['resolve', 'reject'])('sends only the latest waiting search after %s', async outcome => {
    const first = deferred(); mocks.query.mockImplementationOnce(() => first.promise)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await mount()
    await search('B'); await search('C')
    expect(mocks.query).toHaveBeenCalledTimes(1)
    if (outcome === 'resolve') first.resolve({ data: [], total: 0 })
    else first.reject(new Error('timeout'))
    await settle()
    expect(mocks.query).toHaveBeenCalledTimes(2)
    expect(mocks.query.mock.calls.at(-1)[0].search_text).toBe('C')
  })
  it('does not repeat the active search when conditions return to it', async () => {
    const first = deferred(); mocks.query.mockImplementationOnce(() => first.promise)
    await mount(); await search('B'); await search('')
    first.resolve({ data: [], total: 42 }); await settle()
    expect(mocks.query).toHaveBeenCalledTimes(1)
    expect(mocks.loaded).toHaveBeenCalledExactlyOnceWith({ data: [], total: 42 })
  })
  it('waits for the remaining debounce before sending new input', async () => {
    const first = deferred(); mocks.query.mockImplementationOnce(() => first.promise)
    await mount(); await search('B'); await search('C', 100)
    first.resolve({ data: [], total: 0 }); await settle()
    expect(mocks.query).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(400); await settle()
    expect(mocks.query).toHaveBeenCalledTimes(2)
    expect(mocks.query.mock.calls.at(-1)[0].search_text).toBe('C')
  })
  it('discards the waiting search on unmount', async () => {
    const first = deferred(); mocks.query.mockImplementationOnce(() => first.promise)
    await mount(); await search('B')
    app.unmount(); app = null
    first.resolve({ data: [], total: 0 }); await settle()
    expect(mocks.query).toHaveBeenCalledTimes(1)
  })
  it('preserves concurrent queries for the normal adapter', async () => {
    const first = deferred(); mocks.normal.mockImplementationOnce(() => first.promise)
    await mount('normal'); await search('B')
    expect(mocks.normal).toHaveBeenCalledTimes(2)
    first.resolve({ data: [], total: 0 }); await settle()
  })
})
