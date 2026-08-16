// 网站功能思维导图数据。
// 节点取自 src/i18n/locales/zh-CN/about.json 的 intro.features.feature1~10（十大功能 + 子功能）。
// 跳转边（kind: 'jump'）是根据各功能描述中的关联（如「查询结果切地图视图」）设计的，可自行增删。
import { nodeStyle, jumpEdgeStyle } from '@/main/components/g6-demo/g6Styles.js'

const nodes = [
  { id: 'root', data: { label: '方音图鉴', kind: 'root' } },

  // 1 核心查询
  { id: 'm1', data: { label: '核心查询', kind: 'module' } },
  { id: 'm1a', data: { label: '查中古', kind: 'feature' } },
  { id: 'm1b', data: { label: '查音位', kind: 'feature' } },
  { id: 'm1c', data: { label: '查字', kind: 'feature' } },
  { id: 'm1d', data: { label: '查调', kind: 'feature' } },

  // 2 互动地图
  { id: 'm2', data: { label: '互动地图', kind: 'module' } },
  { id: 'm2a', data: { label: '方言地图', kind: 'feature' } },
  { id: 'm2b', data: { label: '分区绘图', kind: 'feature' } },
  { id: 'm2c', data: { label: '自定义数据', kind: 'feature' } },
  { id: 'm2d', data: { label: '地图绘制', kind: 'feature' } },

  // 3 方言比较
  { id: 'm3', data: { label: '方言比较', kind: 'module' } },
  { id: 'm3a', data: { label: '比较汉字', kind: 'feature' } },
  { id: 'm3b', data: { label: '比较中古', kind: 'feature' } },
  { id: 'm3c', data: { label: '比较调类', kind: 'feature' } },
  { id: 'm3d', data: { label: '音值比较', kind: 'feature' } },

  // 4 深入分析
  { id: 'm4', data: { label: '深入分析', kind: 'module' } },
  { id: 'm4a', data: { label: '音系查询', kind: 'feature' } },
  { id: 'm4b', data: { label: '音素分类', kind: 'feature' } },
  { id: 'm4c', data: { label: '音节统计', kind: 'feature' } },
  { id: 'm4d', data: { label: '演化图', kind: 'feature' } },

  // 5 汉字字集
  { id: 'm5', data: { label: '汉字字集', kind: 'module' } },
  { id: 'm5a', data: { label: '中古汉语', kind: 'feature' } },
  { id: 'm5b', data: { label: '上古汉语', kind: 'feature' } },
  { id: 'm5c', data: { label: '近代汉语', kind: 'feature' } },
  { id: 'm5d', data: { label: '粤语韵书', kind: 'feature' } },

  // 6 字表处理
  { id: 'm6', data: { label: '字表处理', kind: 'module' } },
  { id: 'm6a', data: { label: '字表检查', kind: 'feature' } },
  { id: 'm6b', data: { label: '粤拼转IPA', kind: 'feature' } },
  { id: 'm6c', data: { label: '字表合并', kind: 'feature' } },
  { id: 'm6d', data: { label: '字表推导', kind: 'feature' } },

  // 7 词句资料
  { id: 'm7', data: { label: '词句资料', kind: 'module' } },
  { id: 'm7a', data: { label: '语保词汇', kind: 'feature' } },
  { id: 'm7b', data: { label: '语保语法50句', kind: 'feature' } },
  { id: 'm7c', data: { label: '阳春口语词', kind: 'feature' } },

  // 8 自然村数据
  { id: 'm8', data: { label: '自然村数据', kind: 'module' } },
  { id: 'm8a', data: { label: '广东树状图', kind: 'feature' } },
  { id: 'm8b', data: { label: '互动地图', kind: 'feature' } },
  { id: 'm8c', data: { label: '原始表格', kind: 'feature' } },
  { id: 'm8d', data: { label: '阳春自然村', kind: 'feature' } },
  { id: 'm8e', data: { label: '机器学习', kind: 'feature' } },

  // 9 Praat 声学
  { id: 'm9', data: { label: 'Praat声学', kind: 'module' } },
  { id: 'm9a', data: { label: '语音上传', kind: 'feature' } },
  { id: 'm9b', data: { label: '分析模式', kind: 'feature' } },
  { id: 'm9c', data: { label: '七个分析模块', kind: 'feature' } },
  { id: 'm9d', data: { label: '元音空间', kind: 'feature' } },
  { id: 'm9e', data: { label: '基频定调', kind: 'feature' } },

  // 10 方言聚类
  { id: 'm10', data: { label: '方言聚类', kind: 'module' } },
]

const treeEdges = [
  ['root', 'm1'], ['root', 'm2'], ['root', 'm3'], ['root', 'm4'], ['root', 'm5'],
  ['root', 'm6'], ['root', 'm7'], ['root', 'm8'], ['root', 'm9'], ['root', 'm10'],
  ['m1', 'm1a'], ['m1', 'm1b'], ['m1', 'm1c'], ['m1', 'm1d'],
  ['m2', 'm2a'], ['m2', 'm2b'], ['m2', 'm2c'], ['m2', 'm2d'],
  ['m3', 'm3a'], ['m3', 'm3b'], ['m3', 'm3c'], ['m3', 'm3d'],
  ['m4', 'm4a'], ['m4', 'm4b'], ['m4', 'm4c'], ['m4', 'm4d'],
  ['m5', 'm5a'], ['m5', 'm5b'], ['m5', 'm5c'], ['m5', 'm5d'],
  ['m6', 'm6a'], ['m6', 'm6b'], ['m6', 'm6c'], ['m6', 'm6d'],
  ['m7', 'm7a'], ['m7', 'm7b'], ['m7', 'm7c'],
  ['m8', 'm8a'], ['m8', 'm8b'], ['m8', 'm8c'], ['m8', 'm8d'], ['m8', 'm8e'],
  ['m9', 'm9a'], ['m9', 'm9b'], ['m9', 'm9c'], ['m9', 'm9d'], ['m9', 'm9e'],
].map(([source, target]) => ({ source, target, data: { kind: 'tree' } }))

const jumpEdges = [
  ['m1a', 'm2a'], ['m1c', 'm5a'], ['m1d', 'm3c'],
  ['m4a', 'm4d'], ['m4c', 'm2a'],
  ['m6a', 'm6b'], ['m6a', 'm6c'], ['m6c', 'm6d'],
  ['m7a', 'm7b'],
  ['m8a', 'm8b'], ['m8d', 'm8b'],
].map(([source, target]) => ({ source, target, data: { kind: 'jump', label: '跳转' } }))

export const featuresData = { nodes, edges: [...treeEdges, ...jumpEdges] }

export const featuresOptions = {
  node: { type: 'rect', style: nodeStyle() },
  edge: { type: 'cubic-horizontal', style: jumpEdgeStyle() },
  layout: { type: 'antv-dagre', rankdir: 'TB', nodesep: 32, ranksep: 52 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
}
