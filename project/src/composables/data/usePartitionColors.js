import { getPartitions } from '@/api/main/geo/LocationAndRegion.js'
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'
import { ref } from 'vue'
import { readSessionCache, writeSessionCache } from '@/composables/core/sessionCache.js'

const treePromises = new Map()
const defaultColors = new Map()
const colorVersion = ref(0)
const OVERRIDES_KEY = 'partition_color_overrides'
const cacheKey = (mode, identity) => JSON.stringify([identity, mode])
let sessionOverrides
const getOverrides = () => (sessionOverrides ??= readSessionCache(OVERRIDES_KEY) || {})

function flattenColors(nodes, colors) {
  for (const node of nodes || []) {
    if (node.path && parseColor(node.color)) colors.set(node.path, node.color)
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
    const key = cacheKey(regionMode, identity)
    if (treePromises.has(key)) return treePromises.get(key)
    const pending = getDefaultTree(regionMode, () => getPartitions(regionMode), { identity })
      .then(tree => {
        const colors = flattenColors(tree.nodes, new Map())
        defaultColors.set(key, colors)
        const overrides = getOverrides()[key] || {}
        return new Map([...colors, ...Object.entries(overrides)])
      })
      .finally(() => treePromises.delete(key))
    treePromises.set(key, pending)
    return pending
  }

  function getPartitionColor(mode, identity, path) {
    return getOverrides()[cacheKey(mode, identity)]?.[path]
      || defaultColors.get(cacheKey(mode, identity))?.get(path)
  }

  function setPartitionColor(mode, identity, path, color) {
    if (!parseColor(color)) return
    const overrides = getOverrides()
    const key = cacheKey(mode, identity)
    overrides[key] = { ...overrides[key], [path]: color }
    writeSessionCache(OVERRIDES_KEY, overrides)
    colorVersion.value++
  }

  function resetPartitionColor(mode, identity, path) {
    const overrides = getOverrides()
    const key = cacheKey(mode, identity)
    if (path) delete overrides[key]?.[path]
    else delete overrides[key]
    writeSessionCache(OVERRIDES_KEY, overrides)
    colorVersion.value++
  }

  return {
    loadPartitionColors,
    getPartitionColor,
    setPartitionColor,
    resetPartitionColor,
    colorVersion,
    getContrastTextColor,
  }
}
