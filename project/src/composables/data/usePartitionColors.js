import { getPartitions } from '@/api/main/geo/LocationAndRegion.js'
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'

const treePromises = new Map()

function flattenColors(nodes, colors) {
  for (const node of nodes || []) {
    if (node.path && node.color) colors.set(node.path, node.color)
    flattenColors(node.children, colors)
  }
  return colors
}

function parseColor(color) {
  if (typeof color !== 'string') return null
  const value = color.trim()
  const match = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  if (!match) return null
  const hex = match[1].length === 3 ? match[1].split('').map(char => char + char).join('') : match[1]
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16))
}

export function getContrastTextColor(backgroundColor) {
  const rgb = parseColor(backgroundColor)
  if (!rgb) return '#000'
  const [r, g, b] = rgb.map(value => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.179 ? '#000' : '#fff'
}

export function usePartitionColors() {
  const { getDefaultTree } = usePartitionCache()

  async function loadPartitionColors(regionMode = 'map', identity = 'anonymous') {
    const key = JSON.stringify([identity, regionMode])
    if (treePromises.has(key)) return treePromises.get(key)
    const pending = getDefaultTree(regionMode, () => getPartitions(regionMode), { identity })
      .then(tree => flattenColors(tree.nodes, new Map()))
      .finally(() => treePromises.delete(key))
    treePromises.set(key, pending)
    return pending
  }

  return {
    loadPartitionColors,
    getContrastTextColor,
  }
}
