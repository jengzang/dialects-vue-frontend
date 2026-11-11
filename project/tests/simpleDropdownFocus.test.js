import { afterEach, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import SimpleDropdown from '../src/components/selector/SimpleDropdown.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))

let app
let host

afterEach(() => {
  app?.unmount()
  host?.remove()
  vi.unstubAllGlobals()
})

async function mountDropdown(coarsePointer) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: coarsePointer })))
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(SimpleDropdown, { searchable: true, options: [] })
  app.config.globalProperties.$t = key => key
  app.mount(host)
  await nextTick()
  await nextTick()
}

it('does not focus the search input on a touch device, while allowing manual focus', async () => {
  await mountDropdown(true)
  const input = document.querySelector('.search-input')
  expect(document.activeElement).not.toBe(input)
  input.focus()
  expect(document.activeElement).toBe(input)
})

it('focuses the search input on a device with a fine pointer', async () => {
  await mountDropdown(false)
  expect(document.activeElement).toBe(document.querySelector('.search-input'))
})
