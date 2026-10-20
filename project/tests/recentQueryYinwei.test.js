import { afterEach, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { uiStore } from '../src/main/store/store.js'
import { getFeatureCounts } from '@/api'
import YinweiSelector from '../src/main/components/query/YinweiSelector.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/api', () => ({ getFeatureCounts: vi.fn().mockResolvedValue({ 廣州: { 韻母: { a: 3 } } }) }))
vi.mock('@/main/components/query/popups/YinweiHelpPopup.vue', () => ({ default: { template: '<div />' } }))
let app
afterEach(() => { app?.unmount(); vi.useRealTimers(); document.body.innerHTML = '' })

it('keeps restored phonemes after a focused draft blurs and the card changes', async () => {
  vi.useFakeTimers()
  const props = reactive({ selectedCard: '聲母', locationRef: { locationsResult: [] } })
  let selector
  app = createApp({ render: () => h(YinweiSelector, { ...props, ref: instance => { selector = instance } }) })
  app.config.globalProperties.$t = key => key
  app.mount(document.body.appendChild(document.createElement('div')))
  const input = document.querySelector('textarea')
  input.focus()
  input.blur()
  props.selectedCard = '韻母'
  await nextTick()
  expect(typeof selector.restoreInput).toBe('function')
  selector.restoreInput('a')
  await vi.advanceTimersByTimeAsync(250)
  expect(selector.tab3KeyInput).toBe('a')
  props.locationRef.locationsResult = ['廣州']
  await nextTick()
  await vi.advanceTimersByTimeAsync(0)
  expect(uiStore.buttonStates.query.tabContentDisabled.tab3).toBe(false)
})

it('preserves history text when old location metadata resolves before new location matching', async () => {
  getFeatureCounts.mockResolvedValueOnce({ 北京: { 韻母: { o: 2 } } })
  const props = reactive({ selectedCard: '韻母', locationRef: { locationsResult: ['北京'] } })
  let selector
  app = createApp({ render: () => h(YinweiSelector, { ...props, ref: instance => { selector = instance } }) })
  app.config.globalProperties.$t = key => key
  app.mount(document.body.appendChild(document.createElement('div')))
  selector.restoreInput('a')
  await nextTick()
  await nextTick()
  expect(selector.tab3KeyInput).toBe('a')
  props.locationRef.locationsResult = ['廣州']
  await nextTick()
  await nextTick()
  await nextTick()
  expect(selector.tab3KeyInput).toBe('a')
  expect(uiStore.buttonStates.query.tabContentDisabled.tab3).toBe(false)
})
