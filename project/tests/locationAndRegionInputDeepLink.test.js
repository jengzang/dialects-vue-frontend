import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  route: { query: {} },
  getLocationPartitions: vi.fn()
}))

vi.mock('vue-router', () => ({ useRoute: () => mocks.route }))
vi.mock('@/api/index.js', () => ({
  getLocationPartitions: mocks.getLocationPartitions,
  getLocations: vi.fn(async () => ({ locations_result: [] })),
  getCustomFeature: vi.fn(async () => []),
  batchMatch: vi.fn(async () => []),
  getPartitions: vi.fn(async () => ({ schema_version: 2, region_mode: 'map', nodes: [] })),
  resolvePartitions: vi.fn(async () => ({ schema_version: 2, region_mode: 'map', items: [] }))
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: value => value }) }))
vi.mock('@/main/store/store.js', () => ({ userStore: { role: 'anonymous', id: null, isAuthenticated: false } }))
vi.mock('@/main/store/customRegionStore.js', async () => {
  const { ref } = await import('vue')
  return { customRegionStore: () => ({ customRegions: ref([]), loading: ref(false), fetchCustomRegions: vi.fn() }) }
})
vi.mock('@/main/components/geo/RegionSelector.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/geo/PartitionInfoModal.vue', () => ({
  default: { props: ['modelValue'], template: '<div v-if="modelValue" class="partition-modal" />' }
}))
vi.mock('@/components/common/AppModal.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/geo/RegionInputMode.vue', () => ({
  default: { props: ['modelValue'], template: '<textarea :value="modelValue" />' }
}))

import LocationAndRegionInput from '../src/main/components/geo/LocationAndRegionInput.vue'

let app
let host
let errors

describe('LocationAndRegionInput partition info deep link', () => {
  beforeEach(() => {
    mocks.route.query = { openPartitionInfo: 'true' }
    mocks.getLocationPartitions.mockResolvedValue({ data: [] })
    errors = []
    sessionStorage.clear()
  })

  afterEach(() => {
    app?.unmount()
    app = null
    host?.remove()
    host = null
    vi.clearAllMocks()
  })

  it('opens the modal and loads partition data on the initial route', async () => {
    host = document.createElement('div')
    document.body.append(host)
    app = createApp(LocationAndRegionInput)
    app.config.errorHandler = error => errors.push(error)
    app.config.globalProperties.$t = value => value
    app.mount(host)

    await Promise.resolve()
    await nextTick()

    expect(errors).toEqual([])
    expect(host.querySelector('.partition-modal')).not.toBeNull()
    expect(mocks.getLocationPartitions).toHaveBeenCalledOnce()
  })
})
