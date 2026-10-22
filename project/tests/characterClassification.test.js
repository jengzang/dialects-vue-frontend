import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import CharacterClassification from '../src/main/views/explore/charClass/CharacterClassification.vue'
import { buildCharClassTreePayload, getCharClassPageConfig } from '../src/main/config/chars_positions/charClassPageConfigs.js'

const api = vi.hoisted(() => ({ lazyLoadTree: vi.fn(), loadFullTree: vi.fn() }))
vi.mock('@/api', () => api)
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/components/common/BarIcon.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/common/InlineIcon.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/selector/CheckBox.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({ default: {
  props: ['options', 'modelValue'], emits: ['update:modelValue'],
  render() { return h('select', {
    value: this.modelValue, onChange: event => this.$emit('update:modelValue', event.target.value),
  }, this.options.map(option => h('option', { value: option.value }, option.label))) },
} }))
vi.mock('@/components/selector/RadioGroup.vue', () => ({ default: {
  props: ['options'], emits: ['update:modelValue'],
  render() { return h('div', this.options.map(option => h('button', {
    class: 'test-preset', onClick: () => this.$emit('update:modelValue', option.value),
  }, option.label))) },
} }))
vi.mock('@/main/components/TableAndTree/CharTreeItem.vue', () => ({ default: {
  props: ['node', 'lazyLoadFn'],
  render() { return h('button', { class: 'test-node', onClick: () => this.lazyLoadFn(this.node) }, this.node.name) },
} }))

let app, host, router
async function settle() {
  for (let i = 0; i < 12; i++) { await Promise.resolve(); await nextTick() }
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}
async function mount(query = {}) {
  router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/explore/char-class', component: CharacterClassification }] })
  await router.push({ path: '/explore/char-class', query })
  await router.isReady()
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(CharacterClassification).use(router)
  await app.mount(host)
  await settle()
}
async function click(selector) { host.querySelector(selector).click(); await settle() }
const config = getCharClassPageConfig('zhonggu')
const presets = config.tables.characters.presets
const linkedQuery = { tab: 'zhonggu', levels: presets[0].levelKeys.join(',') }

beforeEach(() => {
  api.lazyLoadTree.mockResolvedValue({ children: ['東'] })
  api.loadFullTree.mockResolvedValue({ tree: {} })
})
afterEach(() => { app?.unmount(); host?.remove(); vi.resetAllMocks() })

describe('character classification query workspace', () => {
  it('shows only the workspace initially and loads only on query', async () => {
    await mount()
    expect(api.lazyLoadTree).not.toHaveBeenCalled()
    expect(host.querySelector('.tree-panel')).toBeNull()
    await click('.test-preset:nth-child(2)')
    expect(api.lazyLoadTree).not.toHaveBeenCalled()
    await click('.query-button')
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(1)
    expect(host.querySelector('.tree-panel')).not.toBeNull()
    expect(router.currentRoute.value.query.levels).toBe(presets[1].levelKeys.join(','))
  })

  it('keeps result metadata and lazy loading bound to the submitted configuration while editing', async () => {
    await mount(linkedQuery)
    const metadata = host.querySelector('.tree-meta').textContent
    await click('.test-preset:nth-child(2)')
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(1)
    expect(host.querySelector('.tree-meta').textContent).toBe(metadata)
    expect(router.currentRoute.value.query.levels).toBe(linkedQuery.levels)
    await click('.test-node')
    const payload = buildCharClassTreePayload('zhonggu', 'characters', presets[0].levelKeys)
    expect(api.loadFullTree).toHaveBeenCalledWith(expect.objectContaining({ table_name: payload.table_name, level_columns: payload.level_columns }))
    await click('.query-button')
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(2)
    expect(host.querySelector('.tree-meta').textContent).not.toBe(metadata)
  })

  it('retries the submitted query after the draft changes', async () => {
    api.lazyLoadTree.mockRejectedValueOnce(new Error('failed'))
    await mount(linkedQuery)
    await click('.test-preset:nth-child(2)')
    await click('.retry-button')
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(2)
    expect(api.lazyLoadTree.mock.calls[1][0]).toEqual(api.lazyLoadTree.mock.calls[0][0])
  })

  it('keeps old nodes on their original table when a different data source is selected', async () => {
    const table = getCharClassPageConfig('jingu').tables.zhongyuan
    await mount({ tab: 'jingu', table: 'zhongyuan', levels: table.presets[0].levelKeys.join(',') })
    const select = host.querySelector('select')
    select.value = 'hongwu'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(1)
    expect(host.querySelector('.tree-meta').textContent).toContain('zhongyuan')
    await click('.test-node')
    const payload = buildCharClassTreePayload('jingu', 'zhongyuan', table.presets[0].levelKeys)
    expect(api.loadFullTree).toHaveBeenCalledWith(expect.objectContaining({ table_name: payload.table_name }))
    await click('.query-button')
    expect(host.querySelector('.tree-meta').textContent).toContain('hongwu')
  })

  it('does not query while adding, moving, removing, or editing a level', async () => {
    await mount(linkedQuery)
    await click('.level-action-down')
    await click('.level-action-close')
    await click('.add-level-button')
    const select = host.querySelector('.level-select')
    select.value = select.options[select.options.length - 1].value
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query.levels).toBe(linkedQuery.levels)
    await click('.query-button')
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(2)
  })

  it('clears results on a tab without query parameters and prepares a fresh draft', async () => {
    await mount(linkedQuery)
    await router.push({ path: '/explore/char-class', query: { tab: 'shanggu' } })
    await settle()
    expect(host.querySelector('.tree-panel')).toBeNull()
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(1)
    await click('.query-button')
    expect(api.lazyLoadTree).toHaveBeenCalledTimes(2)
    expect(host.querySelector('.tree-meta').textContent).toContain('charClass.tables.old_chinese')
  })

  it('ignores a stale response when navigating to a cached query', async () => {
    await mount(linkedQuery)
    let resolvePending
    api.lazyLoadTree.mockImplementationOnce(() => new Promise(resolve => { resolvePending = resolve }))
    await click('.test-preset:nth-child(2)')
    await click('.query-button')
    await router.push({ path: '/explore/char-class', query: linkedQuery })
    await settle()
    resolvePending({ children: ['stale'] })
    await settle()
    expect(host.querySelector('.test-node').textContent).toBe('東')
    expect(host.querySelector('.state-block')).toBeNull()
  })
})
