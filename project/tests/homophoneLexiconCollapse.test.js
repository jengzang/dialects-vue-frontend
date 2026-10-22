import { createApp, h, nextTick, reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomophoneLexicon from '@/main/components/pho/HomophoneLexicon.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('@/api', () => ({ getLocationDetail: vi.fn() }))

let app
let host
let notifyResize
let contentHeight = 900

async function mountLexicon(collapsible) {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { notifyResize = callback }
    observe() {}
    disconnect() {}
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => contentHeight)
  const props = reactive({
    location: '測試',
    data: { initials: ['p'], finals: ['a'], tones: ['1'], matrix: { p: { a: { 1: ['巴'] } } } },
    collapsible,
    showModeSwitch: false,
    showToneSwitch: false,
    showCopy: false,
  })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(HomophoneLexicon, props) })
  app.mount(host)
  await nextTick()
  return props
}

afterEach(() => {
  app?.unmount()
  host?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  contentHeight = 900
})

describe('homophone lexicon preview', () => {
  it('expands and collapses overflowing content with an accessible button', async () => {
    await mountLexicon(true)
    const button = host.querySelector('.lexicon-toggle')
    expect(button).not.toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById(button.getAttribute('aria-controls'))).not.toBeNull()
    expect(host.querySelector('.lexicon-viewport--collapsed')).not.toBeNull()
    button.click()
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(host.querySelector('.lexicon-viewport--collapsed')).toBeNull()
    button.click()
    await nextTick()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('omits the fade and toggle for short content, including after resize', async () => {
    contentHeight = 300
    await mountLexicon(true)
    expect(host.querySelector('.lexicon-toggle')).toBeNull()
    expect(host.querySelector('.lexicon-viewport--faded')).toBeNull()
    contentHeight = 900
    notifyResize()
    await nextTick()
    expect(host.querySelector('.lexicon-toggle')).not.toBeNull()
    contentHeight = 300
    notifyResize()
    await nextTick()
    expect(host.querySelector('.lexicon-toggle')).toBeNull()
  })

  it('keeps existing usages fully visible unless explicitly enabled', async () => {
    await mountLexicon(undefined)
    expect(host.querySelector('.lexicon-toggle')).toBeNull()
    expect(host.querySelector('.lexicon-viewport--collapsed')).toBeNull()
    expect(host.textContent).toContain('巴')
  })

  it('resets an expanded preview when a new query replaces the data', async () => {
    const props = await mountLexicon(true)
    host.querySelector('.lexicon-toggle').click()
    await nextTick()
    expect(host.querySelector('.lexicon-toggle').getAttribute('aria-expanded')).toBe('true')
    props.data = { ...props.data }
    await nextTick()
    expect(host.querySelector('.lexicon-toggle').getAttribute('aria-expanded')).toBe('false')
  })
})
