import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, reactive } from 'vue'

const api = vi.hoisted(() => ({ getPartitions: vi.fn() }))
vi.mock('@/api/index.js', () => api)
vi.mock('@/main/store/store.js', () => ({ userStore: { role: 'anonymous', id: null } }))
import RegionInputMode from '../src/main/components/geo/RegionInputMode.vue'

let app
beforeEach(() => {
  vi.useFakeTimers()
  api.getPartitions.mockImplementation(async mode => ({ schema_version: 2, region_mode: mode, nodes: [{ path: '根', label: '根', children: [{ path: '根-二', label: '二', children: [{ path: '根-二-三', label: '三', children: [{ path: '根-二-三-四', label: '四', children: [] }] }] }] }] }))
})
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; vi.useRealTimers(); vi.clearAllMocks() })

it('inserts the complete fourth-level path without changing the chosen system', async () => {
  const state = reactive({ text: '', mode: 'map', tokens: [] })
  const host = document.createElement('div'); document.body.append(host)
  app = createApp(defineComponent({ components: { RegionInputMode }, setup: () => ({ state }),
    template: '<RegionInputMode v-model="state.text" v-model:region-using="state.mode" @select-token="state.tokens.push($event)" />' }))
  app.config.globalProperties.$t = key => key
  app.mount(host); await nextTick()
  const textarea = document.querySelector('textarea')
  textarea.value = '四'; textarea.dispatchEvent(new Event('input', { bubbles: true }))
  await vi.advanceTimersByTimeAsync(250); await nextTick()
  const candidate = [...document.querySelectorAll('.suggestion-item')].find(el => el.textContent.includes('yindianSource'))
  expect(candidate).toBeDefined()
  candidate.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await nextTick()
  expect(state.text).toBe('根-二-三-四')
  expect(state.mode).toBe('map')
  expect(state.tokens).toEqual([{ text: '根-二-三-四', index: 0, source: 'yindian' }])
})
