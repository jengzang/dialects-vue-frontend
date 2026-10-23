import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import AboutIntro from '../src/main/views/menu/support/about/AboutIntro.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/zh-CN/menu/about/intro', params: { locale: 'zh-CN' } }),
  useRouter: () => ({ push }),
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

vi.mock('../src/main/components/g6-demo/G6Graph.vue', () => ({
  default: {
    props: ['graphData', 'graphOptions'],
    emits: ['node-click'],
    template: `<div data-g6-graph :data-auto-fit="graphOptions.autoFit" :data-auto-resize="graphOptions.autoResize" :data-rankdir="graphOptions.layout.rankdir">
      <button v-for="node in graphData.nodes" :key="node.id" :data-graph-node="node.id" @click="$emit('node-click', node.id)">{{ node.data.label }}</button>
      <span v-for="(edge, index) in graphData.edges" :key="index" :data-graph-edge="edge.source + ':' + edge.target" />
    </div>`,
  },
}))

let app
let host

function mountIntro() {
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(AboutIntro)
  app.config.globalProperties.$t = key => key
  app.component('RouterLink', { props: ['to'], template: '<a :href="to"><slot /></a>' })
  app.mount(host)
  return host.querySelector('[data-feature-topology]')
}

afterEach(() => {
  app?.unmount()
  host?.remove()
  app = null
  host = null
  push.mockReset()
})

describe('About feature topology', () => {
  it('shows all feature nodes without category or group controls', () => {
    const topology = mountIntro()
    expect(topology).toBeTruthy()
    expect(topology.compareDocumentPosition(host.querySelector('.customlist')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(topology.querySelector('[data-g6-graph]')).toBeTruthy()
    expect(topology.querySelectorAll('[data-topology-focus], [data-topology-group]')).toHaveLength(0)
    expect(topology.querySelectorAll('[data-graph-node]').length).toBeGreaterThanOrEqual(54)
    expect(topology.querySelector('[data-graph-node="phonetic-compare"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-node="syllable-count"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-node="map-isoline"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-node="vocabulary-upload"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-node="char-yueyun"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-node="villages-tree"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-edge="compare:phonetic-compare"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-edge="phonetic-compare:single-analysis"]')).toBeTruthy()
  })

  it('fits the full graph on first render and resizes with its frame', () => {
    const topology = mountIntro()
    expect(topology.querySelector('[data-g6-graph]').dataset.autoFit).toBe('view')
    expect(topology.querySelector('[data-g6-graph]').dataset.autoResize).toBe('true')
  })

  it('keeps a horizontal tree in portrait so the full graph can fit the narrow viewport', async () => {
    const matchMedia = window.matchMedia
    window.matchMedia = () => ({ matches: true })
    try {
      const topology = mountIntro()
      await nextTick()
      expect(topology.querySelector('[data-g6-graph]').dataset.rankdir).toBe('LR')
    } finally {
      window.matchMedia = matchMedia
    }
  })

  it('keeps a keyboard accessible link to every graph destination', () => {
    const topology = mountIntro()
    const links = [...topology.querySelectorAll('[data-topology-link]')]
    const mapLink = links.find(link => link.textContent === '等值线图')
    expect(mapLink?.getAttribute('href')).toBe('/zh-CN/menu/map/view')
    expect(links.length).toBe(topology.querySelectorAll('[data-graph-node]').length)
  })

  it('navigates from graph nodes', () => {
    const topology = mountIntro()
    topology.querySelector('[data-graph-node="phonetic-compare"]').click()
    expect(push).toHaveBeenCalledWith('/zh-CN/menu/compare/phonetic')
  })
})
