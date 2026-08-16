// 网站历史时间线数据。
// 有明确依据的版本：v4.7.0 / v5.0.0 为 git tag，v5.1.0 为当前版本（utils/user/updateNoticeConfig.js）。
// v1.0~v4.0 的年份与内容为按 git 历史 + 开发感悟推断，标注「~」的请核对修正。
import { nodeStyle, treeEdgeStyle, labelWidth } from '@/main/components/g6-demo/g6Styles.js'

const nodes = [
  { id: 'root', data: { label: '方音图鉴历史', kind: 'root' } },

  { id: 'v1', data: { label: '~2025 · v1.0', kind: 'version' } },
  { id: 'v2', data: { label: '2025-09 · v2.0', kind: 'version' } },
  { id: 'v3', data: { label: '2026-01 · v3.0', kind: 'version' } },
  { id: 'v4', data: { label: '2026-03 · v4.0', kind: 'version' } },
  { id: 'v47', data: { label: '2026-07 · v4.7', kind: 'version' } },
  { id: 'v5', data: { label: '2026-07 · v5.0', kind: 'version' } },
  { id: 'v51', data: { label: '2026-08 · v5.1', kind: 'version' } },

  { id: 'v1a', data: { label: 'Python 脚本雏形', kind: 'item' } },
  { id: 'v1b', data: { label: '核心查询原型', kind: 'item' } },

  { id: 'v2a', data: { label: 'FastAPI 后端', kind: 'item' } },
  { id: 'v2b', data: { label: '原生 JS 界面', kind: 'item' } },
  { id: 'v2c', data: { label: '查中古/音位/字/调', kind: 'item' } },

  { id: 'v3a', data: { label: 'Vue 框架重写', kind: 'item' } },
  { id: 'v3b', data: { label: '互动地图', kind: 'item' } },
  { id: 'v3c', data: { label: '方言比较', kind: 'item' } },

  { id: 'v4a', data: { label: '重写完成', kind: 'item' } },
  { id: 'v4b', data: { label: '相似度分析', kind: 'item' } },
  { id: 'v4c', data: { label: '字表处理工具', kind: 'item' } },

  { id: 'v47a', data: { label: '新手教程', kind: 'item' } },
  { id: 'v47b', data: { label: 'SEO 优化', kind: 'item' } },
  { id: 'v47c', data: { label: '主查询链路优化', kind: 'item' } },

  { id: 'v5a', data: { label: '词表协作功能', kind: 'item' } },

  { id: 'v51a', data: { label: '音节统计', kind: 'item' } },
  { id: 'v51b', data: { label: '热力图/等值线图', kind: 'item' } },
  { id: 'v51c', data: { label: '词表展示与贡献', kind: 'item' } },
  { id: 'v51d', data: { label: '教程完善', kind: 'item' } },
]

const edges = [
  ['root', 'v1'], ['root', 'v2'], ['root', 'v3'], ['root', 'v4'],
  ['root', 'v47'], ['root', 'v5'], ['root', 'v51'],
  ['v1', 'v1a'], ['v1', 'v1b'],
  ['v2', 'v2a'], ['v2', 'v2b'], ['v2', 'v2c'],
  ['v3', 'v3a'], ['v3', 'v3b'], ['v3', 'v3c'],
  ['v4', 'v4a'], ['v4', 'v4b'], ['v4', 'v4c'],
  ['v47', 'v47a'], ['v47', 'v47b'], ['v47', 'v47c'],
  ['v5', 'v5a'],
  ['v51', 'v51a'], ['v51', 'v51b'], ['v51', 'v51c'], ['v51', 'v51d'],
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
