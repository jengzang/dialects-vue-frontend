import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import AboutIntro from '../src/main/views/menu/support/about/AboutIntro.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/zh-CN/menu/about/intro', params: { locale: 'zh-CN' } }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale: { value: 'zh-CN' }, t: key => key }),
}))

vi.mock('../src/i18n/index.js', () => ({
  default: {
    global: {
      messages: {
        value: {
          'zh-CN': {
            about: {
              intro: {
                features: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [
                  `feature${index + 1}`,
                  { heading: `章节 ${index + 1}`, subtitle: '', intro: '', items: [] },
                ])),
              },
            },
          },
        },
      },
    },
  },
}))

let app
let host

afterEach(() => {
  app?.unmount()
  host?.remove()
  app = null
  host = null
})

function mountIntro() {
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(AboutIntro)
  app.config.globalProperties.$t = key => key
  app.component('RouterLink', {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  })
  app.mount(host)
  return host.querySelector('[data-feature-topology]')
}

describe('About feature topology', () => {
  it('appears above the detailed feature list and links every node', () => {
    const topology = mountIntro()
    expect(topology).toBeTruthy()
    expect(topology.compareDocumentPosition(host.querySelector('.customlist')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(topology.querySelectorAll('[data-topology-node]')).toHaveLength(54)
    expect(topology.querySelectorAll('[data-topology-node]:not(a)')).toHaveLength(0)
    expect(topology.querySelector('[data-topology-node="phonetic-compare"]').getAttribute('href')).toBe('/zh-CN/menu/compare/phonetic')
    expect(topology.querySelector('[data-topology-node="syllable-count"]').getAttribute('href')).toBe('/zh-CN/menu/pho/count')
    expect(topology.querySelector('[data-topology-node="vocabulary-upload"]').getAttribute('href')).toBe('/zh-CN/menu/vocabulary/import')
    expect(topology.querySelector('[data-topology-node="gis-voronoi"]').getAttribute('href')).toBe('/zh-CN/explore/gis')
  })

  it('shows every requested branch and the two cross-category relationships', () => {
    const topology = mountIntro()
    for (const name of [
      '多方言地理语言学分析', '单方言深入分析', '音值比较', '音节统计',
      '查字', '查中古', '查音位', '查调', '比较汉字', '比较中古', '比较调类',
      '特征图', '分区点图', '比较图', '地名图', '热力图', '等值线图',
      '分区图', '泰森多边形绘制分布图', '自定义数据',
      '音系查询', '音素查询', '演化', '1000词', '50句',
      '卡片', '地图', '表格', '上传', '管理', '阳春口语词',
      'Praat', '检查工具', '粤拼转IPA', '合并工具',
      '机器学习', '地名分布', '广东自然村树状图',
      '上古', '中古', '近古', '粤语',
    ]) {
      expect([...topology.querySelectorAll('[data-topology-node]')].some(node => node.textContent.trim() === name || node.textContent.trim().startsWith(`${name}上古`))).toBe(true)
    }
    for (const bridge of ['phonetic-compare', 'syllable-count']) {
      expect(topology.querySelector(`[data-topology-from="compare"][data-topology-to="${bridge}"]`)).toBeTruthy()
      expect(topology.querySelector(`[data-topology-from="${bridge}"][data-topology-to="single-analysis"]`)).toBeTruthy()
    }
  })

  it('draws real paths between the comparison and single-dialect nodes', async () => {
    const topology = mountIntro()
    const graph = topology.querySelector('.topology-analysis')
    graph.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, width: 800 })
    for (const [id, left, top] of [
      ['compare', 80, 100],
      ['phonetic-compare', 350, 140],
      ['syllable-count', 350, 200],
      ['single-analysis', 620, 80],
    ]) {
      graph.querySelector(`[data-topology-node="${id}"]`).getBoundingClientRect = () => ({ left, top, right: left + 120, height: 32 })
    }
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect([...graph.querySelectorAll('[data-topology-from]')].every(path => path.getAttribute('d')?.startsWith('M '))).toBe(true)
  })
})
