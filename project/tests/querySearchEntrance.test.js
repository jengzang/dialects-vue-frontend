import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import QuerySearchEntrance from '../src/components/common/QuerySearchEntrance.vue'

let app
let host
let scrollPosition
let panelTop
let entrance
let now
const settle = async () => { await nextTick(); await nextTick() }

async function mountEntrance(overrides = {}) {
  const props = reactive({ title: '词表查询', ...overrides })
  const state = reactive({ text: '吃饭' })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(QuerySearchEntrance, { ...props, ref: value => { entrance = value } }, {
    controls: ({ expanded, collapse }) => h('div', { class: 'original-controls' }, [
      h('textarea', { class: 'original-query', value: state.text, onInput: event => { state.text = event.target.value } }),
      h('select', { class: 'original-filter' }, [h('option', '全部地点')]),
      expanded ? h('button', { class: 'search', onClick: collapse }, '搜索') : null,
    ]),
    default: () => h('div', { class: 'results' }, '查询结果'),
    'after-panel': () => h('div', { class: 'source-choice' }, '词表 / 字表注释'),
  }) })
  app.mount(host)
  await settle()
  return props
}

async function resumeScroll(direction) {
  now += 100
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: direction }))
  await settle()
}

beforeEach(() => {
  now = 0
  vi.spyOn(window.performance, 'now').mockImplementation(() => now)
  scrollPosition = 0
  panelTop = 420
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollPosition)
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  let frameId = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(fn => { queueMicrotask(() => fn(performance.now() + 600)); return ++frameId })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('query-intro')) return { top: 180 - scrollPosition, height: 240 }
    return { top: panelTop - scrollPosition, height: 140 }
  })
})
afterEach(() => {
  app?.unmount()
  host?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('one query panel morphing with scroll', () => {
  it('allows a page h1 using shared title styles and keeps the default h2', async () => {
    const props = await mountEntrance({ titleTag: 'h1' })
    expect(host.querySelector('.query-intro h1.page-title')?.textContent).toBe('词表查询')
    props.titleTag = undefined
    await settle()
    expect(host.querySelector('.query-intro h2')?.textContent).toBe('词表查询')
    expect(host.querySelector('.query-intro h1')).toBeNull()
  })

  it('does not reserve result space before submission, even when results are allowed', async () => {
    const props = await mountEntrance({ resultsVisible: false })
    expect(host.querySelector('.results')).toBeNull()
    expect(host.querySelector('.query-results--enabled')).toBeNull()
    props.resultsVisible = true
    await settle()
    expect(host.querySelector('.results')).not.toBeNull()
    expect(host.querySelector('.query-results--enabled')).toBeNull()
    await entrance.collapse()
    await settle()
    expect(host.querySelector('.query-results--enabled')).not.toBeNull()
  })

  it('releases reserved result space when scrolling back to the expanded panel', async () => {
    const props = await mountEntrance()
    await entrance.collapse()
    expect(host.querySelector('.query-results--enabled')).not.toBeNull()

    props.resultsVisible = false
    await settle()

    expect(host.querySelector('.results')).toBeNull()
    expect(host.querySelector('.query-results--enabled')).toBeNull()
  })

  it('renders the original input and conditions together, without a second input', async () => {
    await mountEntrance()
    expect(host.querySelectorAll('textarea')).toHaveLength(1)
    const panel = host.querySelector('.query-search-panel')
    expect(panel.contains(host.querySelector('.original-query'))).toBe(true)
    expect(panel.contains(host.querySelector('.original-filter'))).toBe(true)
  })

  it('continuously morphs the same controls and restores them when scrolling back', async () => {
    await mountEntrance()
    await entrance.collapse()
    const input = host.querySelector('.original-query')
    const filter = host.querySelector('.original-filter')
    input.value = '饮水'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const end = 420 - window.innerHeight * 0.12
    const distance = Math.min(240 * 3, end - 80)
    scrollPosition = end - 80 - distance / 2
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(entrance.progress).toBeCloseTo(0.5)
    scrollPosition = Math.floor(end)
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(entrance.progress).toBe(1)
    expect(host.querySelector('.query-search-panel').classList.contains('is-compact')).toBe(true)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(entrance.progress).toBe(1)
    await resumeScroll(-100)
    expect(entrance.progress).toBe(0)
    expect(host.querySelector('.original-query')).toBe(input)
    expect(host.querySelector('.original-filter')).toBe(filter)
    expect(input.value).toBe('饮水')
    expect(host.querySelector('.query-results--enabled')).not.toBeNull()
    scrollPosition = Math.floor(end)
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(entrance.progress).toBe(1)
  })

  it('holds compact through a short upward scroll, then expands progressively', async () => {
    panelTop = 720
    await mountEntrance()
    await entrance.collapse()
    const end = panelTop - window.innerHeight * 0.12
    const distance = Math.min(240 * 3, end - 80)
    for (const [offset, expected] of [[0, 1], [32, 1], [80, 1], [104, 1 - 24 / distance], [80 + distance / 2, 0.5]]) {
      scrollPosition = end - offset
      window.dispatchEvent(new Event('scroll'))
      await settle()
      if (offset === 104) await resumeScroll(-100)
      expect(entrance.progress).toBeCloseTo(expected)
    }
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(entrance.progress).toBe(0)
  })

  it('keeps the panel expanded when scrolling before submitting a query', async () => {
    await mountEntrance()
    scrollPosition = 500
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(entrance.progress).toBe(0)
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull()
    expect(host.querySelector('.search')).not.toBeNull()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('scrolls the existing panel to its compact position only on clicking search', async () => {
    await mountEntrance()
    expect(window.scrollTo).not.toHaveBeenCalled()
    const input = host.querySelector('.original-query')
    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
    host.querySelector('.search').click()
    await settle()
    expect(host.querySelector('.query-results--enabled')).not.toBeNull()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 420 - window.innerHeight * 0.12, behavior: 'smooth' })
  })

  it('groups the heading and source choices in one intro slot and hides them when compact', async () => {
    const props = await mountEntrance()
    const footer = host.querySelector('.query-panel-footer')
    const panel = host.querySelector('.query-search-panel')
    expect(footer.nextElementSibling).toBe(panel)
    expect(footer.contains(host.querySelector('.source-choice'))).toBe(true)
    expect(footer.getAttribute('aria-hidden')).toBe('false')
    props.title = '字表注释'
    await settle()
    expect(host.querySelector('.query-intro h2').textContent).toBe('字表注释')
    await entrance.collapse()
    scrollPosition = 420 - window.innerHeight * 0.12
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(footer.getAttribute('aria-hidden')).toBe('true')
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await settle()
    await resumeScroll(-100)
    expect(footer.getAttribute('aria-hidden')).toBe('false')
  })

  it('honors reduced motion and supports disabling expansion', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const props = await mountEntrance()
    host.querySelector('.search').click()
    await settle()
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }))
    const input = host.querySelector('.original-query')
    props.enabled = false
    await settle()
    expect(host.querySelector('.query-intro')).toBeNull()
    expect(host.querySelector('.original-query')).toBe(input)
    expect(host.querySelectorAll('textarea')).toHaveLength(1)
  })
})
