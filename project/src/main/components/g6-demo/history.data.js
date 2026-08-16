import { nodeStyle, treeEdgeStyle, labelWidth } from './g6Styles.js'

const nodes = [
  { id: 'root', data: { label: '方音圖鑑歷史', kind: 'root' } },

  { id: 'v1', data: { label: '2023 · v1.0', kind: 'version' } },
  { id: 'v2', data: { label: '2024 · v2.0', kind: 'version' } },
  { id: 'v3', data: { label: '2025 · v3.0', kind: 'version' } },
  { id: 'v4', data: { label: '2026 · v4.0', kind: 'version' } },

  { id: 'v1a', data: { label: '字音查询上线', kind: 'item' } },
  { id: 'v1b', data: { label: '分布图上线', kind: 'item' } },
  { id: 'v2a', data: { label: '声母韵母', kind: 'item' } },
  { id: 'v2b', data: { label: '字音对比', kind: 'item' } },
  { id: 'v3a', data: { label: '词汇浏览', kind: 'item' } },
  { id: 'v3b', data: { label: '语保资料', kind: 'item' } },
  { id: 'v3c', data: { label: '粤语转IPA', kind: 'item' } },
  { id: 'v4a', data: { label: '村落树', kind: 'item' } },
  { id: 'v4b', data: { label: '字符网络', kind: 'item' } },
]

const edges = [
  ['root', 'v1'], ['root', 'v2'], ['root', 'v3'], ['root', 'v4'],
  ['v1', 'v1a'], ['v1', 'v1b'],
  ['v2', 'v2a'], ['v2', 'v2b'],
  ['v3', 'v3a'], ['v3', 'v3b'], ['v3', 'v3c'],
  ['v4', 'v4a'], ['v4', 'v4b'],
].map(([source, target]) => ({ source, target }))

export const historyData = { nodes, edges }

export const historyOptions = {
  node: { type: 'rect', style: nodeStyle() },
  edge: { type: 'cubic-horizontal', style: treeEdgeStyle() },
  layout: {
    type: 'compact-box',
    direction: 'LR',
    getWidth: (d) => labelWidth(d.label),
    getHeight: () => 38,
    getVGap: () => 18,
    getHGap: () => 90,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
}
