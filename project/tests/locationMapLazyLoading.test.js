import { describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'

const mocks = vi.hoisted(() => ({ loaded: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: { setup: (_, { slots }) => () => h('div', slots.default?.()) } }))
vi.mock('@/main/components/map/MiniMapSelector.vue', () => {
  mocks.loaded()
  return { __esModule: true, default: { props: ['coord', 'readonly'], setup: props => () => h('div', { class: 'mini-map' }, JSON.stringify(props)) } }
})
import LocationMapPopup from '../src/main/components/geo/popups/LocationMapPopup.vue'

describe('location map lazy loading', () => {
  it('loads the map only on opening and preserves coordinates and readonly mode', async () => {
    const state = reactive({ visible: false })
    const host = document.createElement('div')
    const app = createApp({ render: () => h(LocationMapPopup, { visible: state.visible, coord: [113, 23] }) })
    app.mount(host)
    try {
      await nextTick()
      expect(mocks.loaded).not.toHaveBeenCalled()
      state.visible = true
      await vi.waitFor(() => expect(host.querySelector('.mini-map')).not.toBeNull())
      expect(mocks.loaded).toHaveBeenCalledTimes(1)
      expect(host.querySelector('.mini-map').textContent).toContain('113,23')
      expect(host.querySelector('.mini-map').textContent).toContain('"readonly":true')
    } finally { app.unmount() }
  })
})
