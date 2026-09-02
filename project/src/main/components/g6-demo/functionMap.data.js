import { nodeStyle, jumpEdgeStyle } from './g6Styles.js'

const nodes = [
  { id: 'root', data: { label: '方音圖鑑', kind: 'root' } },

  { id: 'query', data: { label: '查询', kind: 'module' } },
  { id: 'compare', data: { label: '对比', kind: 'module' } },
  { id: 'map', data: { label: '地图', kind: 'module' } },
  { id: 'pho', data: { label: '音韵', kind: 'module' } },
  { id: 'vocab', data: { label: '词汇', kind: 'module' } },
  { id: 'tools', data: { label: '工具', kind: 'module' } },

  { id: 'q1', data: { label: '字音查询', kind: 'feature' } },
  { id: 'q2', data: { label: '声调查询', kind: 'feature' } },
  { id: 'c1', data: { label: '字音对比', kind: 'feature' } },
  { id: 'c2', data: { label: '声调对比', kind: 'feature' } },
  { id: 'm1', data: { label: '分布图', kind: 'feature' } },
  { id: 'm2', data: { label: '分区图', kind: 'feature' } },
  { id: 'p1', data: { label: '声母韵母', kind: 'feature' } },
  { id: 'p2', data: { label: '同音字汇', kind: 'feature' } },
  { id: 'v1', data: { label: '词汇浏览', kind: 'feature' } },
  { id: 't1', data: { label: '粤语转IPA', kind: 'feature' } },
  { id: 't2', data: { label: '合并工具', kind: 'feature' } },
]

const treeEdges = [
  ['root', 'query'], ['root', 'compare'], ['root', 'map'],
  ['root', 'pho'], ['root', 'vocab'], ['root', 'tools'],
  ['query', 'q1'], ['query', 'q2'],
  ['compare', 'c1'], ['compare', 'c2'],
  ['map', 'm1'], ['map', 'm2'],
  ['pho', 'p1'], ['pho', 'p2'],
  ['vocab', 'v1'],
  ['tools', 't1'], ['tools', 't2'],
].map(([source, target]) => ({ source, target, data: { kind: 'tree' } }))

const jumpEdges = [
  ['q1', 'c1', '跳转'], ['q1', 'm1', '跳转'], ['q2', 'c2', '跳转'],
  ['p1', 'c1', '跳转'], ['p2', 'q2', '跳转'], ['m1', 'm2', '跳转'],
].map(([source, target, label]) => ({ source, target, data: { kind: 'jump', label } }))

export const functionMapData = {
  nodes,
  edges: [...treeEdges, ...jumpEdges],
}

export const functionMapOptions = {
  node: { type: 'rect', style: nodeStyle() },
  edge: { type: 'cubic-horizontal', style: jumpEdgeStyle() },
  layout: { type: 'antv-dagre', rankdir: 'TB', nodesep: 40, ranksep: 56 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
}
