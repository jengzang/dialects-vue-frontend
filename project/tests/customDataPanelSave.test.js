import { createApp, ref, nextTick } from 'vue'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ saveCustomData: vi.fn(), submitCustomForm: vi.fn(), batchMatch: vi.fn(), getRegions: vi.fn() }))
vi.mock('@/api', () => mocks)
vi.mock('@/api/main/user/custom-data.js', () => ({ getAllCustomData: vi.fn() }))
vi.mock('@/main/store/store.js', () => ({ userStore: { isAuthenticated: true }, globalPayload: ref(null), resultCache: { features: [] } }))
vi.mock('@/composables/data/useCustomDataPresence.js', () => ({ markCustomDataExists: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { sub: 'view' }, query: { openPanel: 'true' } }), onBeforeRouteLeave: vi.fn() }))
vi.mock('@/components/ToastAndHelp/HelpIcon.vue', () => ({ default: { render: () => null } }))

import CustomDataPanel from '@/main/components/map/custom/CustomDataPanel.vue'

let app, host, vm
beforeEach(async () => {
  vi.clearAllMocks()
  host = document.createElement('div'); document.body.append(host)
  app = createApp(CustomDataPanel); app.mount(host); vm = app._instance.setupState
  Object.assign(vm.formData, { location: '甲', region: '乙', coordinates: '113,23', featureType: '调值', featureField: '阴平', value: '55', description: '' })
  await nextTick()
})
afterEach(() => { app.unmount(); host.remove() })

it('sends one idempotent create and locks repeated submit before completion', async () => {
  let finish
  mocks.saveCustomData.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const first = vm.handleSubmit(); await vm.handleSubmit()
  expect(mocks.saveCustomData).toHaveBeenCalledTimes(1)
  expect(mocks.submitCustomForm).not.toHaveBeenCalled()
  expect(mocks.saveCustomData.mock.calls[0][0]).toMatchObject({ creates: [{ 簡稱: '甲', 值: '55' }] })
  finish({ success: true, created_count: 1 }); await first
  expect(vm.formData.value).toBe('')
})

it('retains unknown snapshot and draft, rejects new submit, and retries the same request', async () => {
  mocks.saveCustomData.mockRejectedValueOnce(new TypeError('lost response')).mockResolvedValueOnce({ success: true, created_count: 1 })
  await vm.handleSubmit()
  expect(vm.formData.value).toBe('55')
  await vm.handleSubmit()
  expect(mocks.saveCustomData).toHaveBeenCalledTimes(1)
  await vm.retrySave()
  expect(mocks.saveCustomData.mock.calls[1][0]).toEqual(mocks.saveCustomData.mock.calls[0][0])
})
