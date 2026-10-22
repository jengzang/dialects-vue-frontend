import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import HistoryPage from '../src/main/views/explore/history/HistoryGraph.vue'

let app
let host

afterEach(() => {
  app?.unmount()
  host?.remove()
})

function mountHistory() {
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(HistoryPage)
  app.mount(host)
  return [...host.querySelectorAll('ol > li')]
}

describe('author-provided website history', () => {
  it('renders all 35 records chronologically and keeps month-only precision', () => {
    const entries = mountHistory()
    expect(entries).toHaveLength(35)
    const dates = entries.map(entry => entry.querySelector('time').dateTime)
    expect(dates[0]).toBe('2025-05')
    expect(entries[0].querySelector('time').textContent).toBe('2025.5')
    expect(dates.at(-1)).toBe('2026-03-24')
    expect(dates).toEqual([...dates].sort())
    expect(host.querySelectorAll('.history-connector')).toHaveLength(34)
  })

  it('uses the latest author versions and preserves the partial Vue migration wording', () => {
    const entries = mountHistory()
    const contentAt = date => entries.find(entry => entry.querySelector('time').dateTime === date).textContent
    expect(contentAt('2025-08-04')).toContain('开始部署在内网v1.0.0')
    expect(contentAt('2025-08-18')).toContain('分发exe供内测用户尝鲜。v1.0.5')
    expect(contentAt('2025-09-04')).toContain('引入vue作为查询、输入页面，但地图及结果展示仍由原生js承担。v1.2.0')
    expect(contentAt('2026-01-11')).toContain('结果页面迁移到Vue，查字、查调更为显著，不再作为辅助功能。v2.0.0')
    expect(contentAt('2026-01-16')).toContain('原生js移至「旧版网站」入口，主站全部使用Vue3开发。v2.1.0')
  })

  it('renders the four original Zhihu article URLs as safe clickable links', () => {
    mountHistory()
    const links = [...host.querySelectorAll('ol a')]
    expect(links.map(link => link.href)).toEqual([
      'https://zhuanlan.zhihu.com/p/1934345780199682731',
      'https://zhuanlan.zhihu.com/p/2001363637311381604',
      'https://zhuanlan.zhihu.com/p/2002848348378521848',
      'https://zhuanlan.zhihu.com/p/2003637219919946701'
    ])
    for (const link of links) {
      expect(link.textContent).toBe(link.href)
      expect(link.rel).toContain('noopener')
    }
    expect(host.textContent).toContain('这也是我时隔近半年再次在知乎发文')
    expect(host.textContent).toContain('「方音圖鑑」总算有logo了。v1.3.0')
  })
})
