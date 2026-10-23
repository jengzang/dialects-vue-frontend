import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

let route
let replaceMock

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    replace: replaceMock,
  }),
}))

import ExploreEntry from '../src/main/views/entry/ExploreEntry.vue'
import MenuEntry from '../src/main/views/entry/MenuEntry.vue'

function mountEntry(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.mount(host)
  return {
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('legacy entry redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    route = reactive({
      path: '/menu',
      fullPath: '/menu',
      query: {},
      hash: '',
    })

    replaceMock = vi.fn(async (navigation) => navigation)
  })

  it('redirects /menu to the canonical default menu child route', async () => {
    const wrapper = mountEntry(MenuEntry)
    await nextTick()

    expect(replaceMock).toHaveBeenCalledWith({
      path: '/zh-Hant/menu/query/zhonggu',
      hash: '',
    })

    wrapper.unmount()
  })

  it('redirects legacy explore query routes to canonical explore paths', async () => {
    route.path = '/explore'
    route.fullPath = '/explore?page=YuBao&sub=grammar'
    route.query = {
      page: 'YuBao',
      sub: 'grammar',
    }

    const wrapper = mountEntry(ExploreEntry)
    await nextTick()

    expect(replaceMock).toHaveBeenCalledWith({
      path: '/zh-Hant/menu/yubao',
      query: {
        tab: 'grammar',
      },
      hash: '',
    })

    wrapper.unmount()
  })
})
