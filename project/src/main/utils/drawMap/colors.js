// [stroke, pointColor/fill, fillBg]
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

export const VORONOI_PALETTE = DRAW_PALETTE

export function pickDrawColor(index) {
  return DRAW_PALETTE[index % DRAW_PALETTE.length]
}
