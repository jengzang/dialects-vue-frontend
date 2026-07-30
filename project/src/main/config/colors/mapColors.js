// 20 色鲜亮盘 — 分类/分区/Voronoi/Dot 模式
// 来源: create_dot_all, 原散落在 MapLibre.vue / VillageMapPopup.vue + AllVillageMapPopup
export const CATEGORY_PALETTE = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfe745', '#fabed4',
  '#469990', '#dcbaff', '#9a6324', '#fffac8', '#800000',
  '#34c759', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
]

// 20 色柔和盘 — Feature 赋值用
// 来源: 原散落在 MapData.js / YuBaoMap.vue
export const FEATURE_PALETTE = [
  '#FFB3B3', '#FFB366', '#FFFF99', '#B3FFB3', '#99CCFF', '#D4A6FF',
  '#FF6666', '#FFD699', '#99CCCC', '#D1D1FF', '#FF9999', '#FFB3FF',
  '#FFFF66', '#B3FF99', '#99CCFF', '#FFCC99', '#CCCCFF', '#FF66CC',
  '#FFFF66', '#B3FFCC',
]

// Draw 图层三元组 [stroke, pointColor/fill, fillBg]
export const DRAW_PALETTE = [
  ['#2563eb', '#60a5fa', '#dbeafe'],
  ['#059669', '#34d399', '#d1fae5'],
  ['#dc2626', '#f87171', '#fee2e2'],
  ['#7c3aed', '#a78bfa', '#ede9fe'],
  ['#d97706', '#fbbf24', '#fef3c7'],
  ['#0891b2', '#22d3ee', '#cffafe'],
  ['#be185d', '#f472b6', '#fce7f3'],
  ['#4f46e5', '#818cf8', '#e0e7ff'],
]

// 20 色渐变盘 — 村庄分类用                                                                                              
// 来源: 原散落在 AllVillagesMapPopup.vue，但现在已经不使用                                                              
export const VILLAGE_PALETTE = [                                                                                         
  '#b31919', '#b34719', '#b37519', '#b3a319', '#94b319',                                                                 
  '#66b319', '#38b319', '#19b329', '#19b357', '#19b385',                                                                 
  '#19b3b3', '#1985b3', '#1957b3', '#1929b3', '#3819b3',                                                                 
  '#6619b3', '#9419b3', '#b319a3', '#b31975', '#b31947',                                                                 
]    

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [clamp(r), clamp(g), clamp(b)].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')
}

function darkenHex(hex, ratio) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - ratio), g * (1 - ratio), b * (1 - ratio))
}

export function pickCategoryColor(index) {
  const fill = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
  const stroke = darkenHex(fill, 0.3)
  return { stroke, pointColor: fill, fill }
}

export function pickFeatureColor(index) {
  return FEATURE_PALETTE[index % FEATURE_PALETTE.length]
}

export function pickDrawColor(index) {
  return DRAW_PALETTE[index % DRAW_PALETTE.length]
}
