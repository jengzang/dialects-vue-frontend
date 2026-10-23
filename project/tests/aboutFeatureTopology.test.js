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
    template: `<div data-g6-graph :data-auto-fit="graphOptions.autoFit" :data-auto-resize="graphOptions.autoResize">
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
  it('shows a compact G6 overview above the detailed introduction', () => {
    const topology = mountIntro()
    expect(topology).toBeTruthy()
    expect(topology.compareDocumentPosition(host.querySelector('.customlist')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(topology.querySelector('[data-g6-graph]')).toBeTruthy()
    expect(topology.querySelectorAll('[data-topology-focus]')).toHaveLength(4)
    expect(topology.querySelector('[data-graph-node="phonetic-compare"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-node="syllable-count"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-edge="multi-analysis:phonetic-compare"]')).toBeTruthy()
    expect(topology.querySelector('[data-graph-edge="phonetic-compare:single-analysis"]')).toBeTruthy()
  })

  it('reveals one group at a time while keeping every feature reachable', async () => {
    const topology = mountIntro()
    const seen = new Set()
    for (const branchButton of topology.querySelectorAll('[data-topology-focus]')) {
      branchButton.click()
      await nextTick()
      const groupButtons = [...topology.querySelectorAll('[data-topology-group]')]
      expect(groupButtons.length).toBeGreaterThan(0)
      for (const groupButton of groupButtons) {
        groupButton.click()
        await nextTick()
        topology.querySelectorAll('[data-graph-node]').forEach(node => seen.add(node.getAttribute('data-graph-node')))
      }
    }
    expect(seen).toContain('map-isoline')
    expect(seen).toContain('vocabulary-upload')
    expect(seen).toContain('char-yueyun')
    expect(seen).toContain('villages-tree')
    expect(seen.size).toBeGreaterThanOrEqual(54)
  })

  it('keeps expanded nodes at readable scale instead of fitting the whole graph', async () => {
    const topology = mountIntro()
    expect(topology.querySelector('[data-g6-graph]').dataset.autoFit).toBe('view')
    topology.querySelector('[data-topology-focus="multi-analysis"]').click()
    await nextTick()
    topology.querySelector('[data-topology-group="dialect-map"]').click()
    await nextTick()
    expect(topology.querySelector('[data-g6-graph]').dataset.autoFit).toBe('center')
    expect(topology.querySelector('[data-g6-graph]').dataset.autoResize).toBe('true')
  })

  it('keeps a keyboard accessible link to each visible graph destination', async () => {
    const topology = mountIntro()
    topology.querySelector('[data-topology-focus="multi-analysis"]').click()
    await nextTick()
    topology.querySelector('[data-topology-group="dialect-map"]').click()
    await nextTick()
    const links = [...topology.querySelectorAll('[data-topology-link]')]
    const mapLink = links.find(link => link.textContent === '等值线图')
    expect(mapLink?.getAttribute('href')).toBe('/zh-CN/menu/map/view')
    expect(links.length).toBe(topology.querySelectorAll('[data-graph-node]').length)
  })

  it('navigates from graph nodes while expansion stays on separate controls', async () => {
    const topology = mountIntro()
    topology.querySelector('[data-graph-node="phonetic-compare"]').click()
    expect(push).toHaveBeenCalledWith('/zh-CN/menu/compare/phonetic')
    topology.querySelector('[data-topology-focus="multi-analysis"]').click()
    await nextTick()
    expect(push).toHaveBeenCalledTimes(1)
  })
})
