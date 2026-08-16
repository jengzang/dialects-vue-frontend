export const NODE_COLORS = {
  root: { fill: '#1d4ed8', text: '#ffffff', stroke: '#1e3a8a' },
  module: { fill: '#3b82f6', text: '#ffffff', stroke: '#2563eb' },
  version: { fill: '#3b82f6', text: '#ffffff', stroke: '#2563eb' },
  feature: { fill: '#dbeafe', text: '#1e3a8a', stroke: '#93c5fd' },
  item: { fill: '#dbeafe', text: '#1e3a8a', stroke: '#93c5fd' },
}

export function labelWidth(label) {
  const text = String(label || '')
  // 汉字按 15px 估宽，拉丁字符约 8px
  let w = 0
  for (const ch of text) {
    w += /[⺀-鿿豈-﫿＀-￯]/.test(ch) ? 15 : 8
  }
  return Math.max(72, w + 32)
}

function nodeColor(d) {
  return NODE_COLORS[d.data?.kind] || NODE_COLORS.feature
}

export function nodeStyle() {
  return {
    size: (d) => [labelWidth(d.data?.label), 38],
    radius: 8,
    fill: (d) => nodeColor(d).fill,
    stroke: (d) => nodeColor(d).stroke,
    lineWidth: 1,
    labelText: (d) => d.data?.label,
    labelFill: (d) => nodeColor(d).text,
    labelFontSize: 13,
    labelPlacement: 'center',
  }
}

export function jumpEdgeStyle() {
  return {
    stroke: (e) => (e.data?.kind === 'jump' ? '#ef4444' : '#94a3b8'),
    lineWidth: (e) => (e.data?.kind === 'jump' ? 1.8 : 1.2),
    lineDash: (e) => (e.data?.kind === 'jump' ? [5, 4] : undefined),
    endArrow: (e) => e.data?.kind === 'jump',
    labelText: (e) => e.data?.label || '',
    labelFill: '#ef4444',
    labelFontSize: 11,
    labelBackground: true,
    labelBackgroundFill: '#fff',
    labelPadding: [2, 4],
  }
}

export function treeEdgeStyle() {
  return { stroke: '#94a3b8', lineWidth: 1.2 }
}
