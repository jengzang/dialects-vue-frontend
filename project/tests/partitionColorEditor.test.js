import { createApp, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/main/store/store.js', () => ({ userStore: { role: 'anonymous', id: null } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/api/main/geo/LocationAndRegion.js', () => ({ getPartitions: vi.fn(async mode => ({
  schema_version: 2, region_mode: mode,
  nodes: [{ label: '粵語', path: '粵語', children: [{ label: '台山', path: '粵語-台山', color: '#123456', children: [] }] }],
})) }))

const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick() }

describe('partition color editor', () => {
  beforeEach(() => { vi.resetModules(); sessionStorage.clear() })

  it('loads on expansion and retains the tree while editing and resetting colors', async () => {
    const { default: Editor } = await import('../src/main/components/map/PartitionColorEditor.vue')
    const { getPartitions } = await import('@/api/main/geo/LocationAndRegion.js')
    getPartitions.mockClear()
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({ render: () => h(Editor) })
    app.mount(host)
    expect(getPartitions).not.toHaveBeenCalled()
    const details = host.querySelector('details')
    details.open = true
    details.dispatchEvent(new Event('toggle'))
    await flush()
    host.querySelector('.node-toggle').click()
    await nextTick()
    const picker = host.querySelector('input[type="color"]')
    expect(picker.value).toBe('#123456')
    picker.value = '#abcdef'
    picker.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    expect(host.querySelector('input[type="color"]')).toBe(picker)
    expect(sessionStorage.getItem('partition_color_overrides')).toContain('#abcdef')
    const search = host.querySelector('input[data-shape="search"]')
    search.value = '粤语'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(host.querySelector('input[type="color"]')).not.toBeNull()
    expect(host.querySelector('.color-tree').textContent).toContain('粵語')
    host.querySelector('.editor-toolbar .reset-colors').click()
    await flush()
    expect(picker.value).toBe('#123456')
    expect(getPartitions).toHaveBeenCalledTimes(1)
    app.unmount()
    host.remove()
  })
})
