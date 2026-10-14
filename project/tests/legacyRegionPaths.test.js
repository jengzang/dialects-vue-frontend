import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../public/detail/js/inputpanel.js'), 'utf8')
const section = source.slice(source.indexOf('// 獲取匹配到的分區列表'), source.indexOf('/*\n地点输入框的匹配'))
const node = (path, children = []) => ({ path, label: path.split('-').at(-1), depth: path.split('-').length, children })
let api, fetcher
beforeEach(() => {
  document.body.innerHTML = '<textarea id="locations"></textarea><textarea id="regions"></textarea><div id="panelContent"></div><div id="popupLayer"></div>'
  window.regionusing = 'yindian'; window.partitionPopupOpen = false
  localStorage.clear()
  fetcher = vi.fn(async url => ({ ok: true, json: async () => ({ schema_version: 2, region_mode: 'yindian', nodes: [node('甲', [node('甲-二', [node('甲-二-三', [node('甲-二-三-四')])])]), node('乙', [node('乙-二')])] }) }))
  api = new Function('window', 'document', 'fetch', 'localStorage', 'showToast', section + '\nreturn { getSubregions, showRegionSelector, readRegionPaths, setRegionPaths, readCustomScope }')(window, document, fetcher, localStorage, vi.fn())
})

describe('legacy detail region migration', () => {
  it('loads v2 trees once per page and uses full parent paths', async () => {
    expect((await api.getSubregions('甲-二-三', 'yindian'))[0].path).toBe('甲-二-三-四')
    await api.getSubregions(null, 'yindian')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('blocks ambiguous text and lets the user choose the complete path', async () => {
    expect(api.readRegionPaths).toBeTypeOf('function')
    document.querySelector('#regions').value = '二'
    fetcher.mockImplementation(async (_url, options) => ({ ok: true, json: async () => ({ schema_version: 2, region_mode: 'yindian', items: JSON.parse(options.body).items.map(item => ({ candidates: item.kind === 'path' ? [{ path: item.text }] : [{ path: '甲-二' }, { path: '乙-二' }] })) }) }))
    expect(await api.readRegionPaths()).toBeNull()
    document.querySelector('[data-region-path="乙-二"]').click()
    expect(await api.readRegionPaths()).toEqual(['乙-二'])
  })

  it('opens all four columns and selects only one complete branch', async () => {
    await api.getSubregions(null, 'yindian')
    api.showRegionSelector(document.querySelector('#regions'), 'yindian')
    for (let i = 0; i < 5; i++) await Promise.resolve()
    for (const path of ['甲', '甲-二', '甲-二-三']) {
      document.querySelector(`[data-region-path="${path}"] .partition-arrow`).click()
    }
    expect(document.querySelectorAll('.partition-popup')).toHaveLength(4)
    document.querySelector('[data-region-path="甲-二-三-四"] .partition-item').click()
    expect(document.querySelector('#regions').value).toBe('甲-二-三-四')
  })

  it('rejects a late response after text changes without replacing the text', async () => {
    let finish
    document.querySelector('#regions').value = '二'
    fetcher.mockImplementation(() => new Promise(resolve => { finish = () => resolve({ ok: true, json: async () => ({ schema_version: 2, region_mode: 'yindian', items: [{ candidates: [{ path: '甲-二' }] }] }) }) }))
    const pending = api.readRegionPaths()
    document.querySelector('#regions').value = '新輸入'
    finish()
    expect(await pending).toBeNull()
    expect(document.querySelector('#regions').value).toBe('新輸入')
  })

  it('reuses unchanged resolution results and treats selected roots as paths', async () => {
    api.setRegionPaths(['甲'])
    fetcher.mockImplementation(async (_url, options) => ({ ok: true, json: async () => ({ schema_version: 2, region_mode: 'yindian', items: JSON.parse(options.body).items.map(item => ({ candidates: [{ path: item.text }] })) }) }))
    expect(await api.readRegionPaths()).toEqual(['甲'])
    expect(await api.readRegionPaths()).toEqual(['甲'])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetcher.mock.calls[0][1].body).items[0].kind).toBe('path')
  })

  it('blocks the actual analysis request or sends canonical regions unchanged', async () => {
    document.querySelector('#locations').value = '廣州'
    document.body.insertAdjacentHTML('beforeend', '<input name="mode" value="s2p" type="radio" checked>')
    const file = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../public/detail/js/process_data.js'), 'utf8')
    const analysisSource = file.slice(0, file.indexOf('async function get_detail'))
    const resolver = vi.fn(async () => null)
    const post = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, results: [] }) }))
    const run = new Function('window', 'document', 'localStorage', 'readRegionPaths', 'isEmptyInput', 'parseMultilineListInput', 'setLoadingMessage', analysisSource + '\nreturn analysis_from_db')({ regionusing: 'yindian', fetch: post }, document, localStorage, resolver, values => values.every(value => !value), () => [], vi.fn())
    await run()
    expect(post).not.toHaveBeenCalled()
    resolver.mockResolvedValue(['甲-二'])
    await run()
    expect(JSON.parse(post.mock.calls[0][1].body).regions).toEqual(['甲-二'])
  })

  it('queries user records by resolved locations for map paths and reuses that scope', async () => {
    localStorage.setItem('ACCESS_TOKEN', 'test-user')
    window.regionusing = 'map'
    document.querySelector('#locations').value = '個人地點'
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ locations_result: ['同地', '同地'] }) })
    expect(await api.readCustomScope(['甲-二'])).toEqual({ locations: ['個人地點', '同地'], regions: [] })
    await api.readCustomScope(['甲-二'])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][0]).toContain('region_mode=map')
    expect(new URL(fetcher.mock.calls[0][0], 'http://localhost').searchParams.getAll('regions')).toEqual(['甲-二'])
  })
})
