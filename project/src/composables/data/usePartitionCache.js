import { readSessionCache, writeSessionCache } from '@/composables/core/sessionCache.js'

export const PARTITION_DATA_CACHE_KEY = 'partition_data_cache'
export const PARTITION_POINTS_CACHE_KEY = 'partition_points_cache'
export const YINDIAN_TREE_CACHE_KEY = '__YINDIAN_TREE_CACHE__'

// A fresh page starts a fresh cache; sessionStorage must not keep old default trees alive.
const defaultTrees = new Map()
const pendingTrees = new Map()

export function usePartitionCache() {
  async function getDefaultTree(mode, loadTree, { identity = 'anonymous' } = {}) {
    const key = JSON.stringify([2, identity, mode])
    if (defaultTrees.has(key)) return defaultTrees.get(key)
    if (pendingTrees.has(key)) return pendingTrees.get(key)
    const pending = Promise.resolve().then(loadTree).then(tree => {
      if (tree?.schema_version !== 2 || tree.region_mode !== mode || !Array.isArray(tree.nodes)) {
        throw new Error('Invalid default partition tree')
      }
      defaultTrees.set(key, tree)
      return tree
    }).finally(() => pendingTrees.delete(key))
    pendingTrees.set(key, pending)
    return pending
  }
  async function getPartitionData(loadPartitionData) {
    // 分区接口返回的是 { data } 包装结构，这里统一拆成页面真正消费的数组。
    const cached = readSessionCache(PARTITION_DATA_CACHE_KEY)
    if (cached) {
      return cached
    }

    const response = await loadPartitionData()
    const data = response?.data || []
    writeSessionCache(PARTITION_DATA_CACHE_KEY, data)
    return data
  }

  async function getPartitionPoints(loadPoints) {
    const cached = readSessionCache(PARTITION_POINTS_CACHE_KEY)
    if (cached) {
      return cached
    }

    const response = await loadPoints()
    const data = response?.data || []
    writeSessionCache(PARTITION_POINTS_CACHE_KEY, data)
    return data
  }

  function getCachedYindianTree(transform = (value) => value) {
    // 允许读取缓存时再做 transform，这样同一份缓存能服务不同展示需求。
    const cached = readSessionCache(YINDIAN_TREE_CACHE_KEY)
    if (!cached) {
      return null
    }

    return transform(cached)
  }

  async function getYindianTree(loadYindianTree, options = {}) {
    const {
      transform = (value) => value,
    } = options

    const cached = getCachedYindianTree(transform)
    if (cached) {
      return cached
    }

    // 只把变换后的结果落缓存，避免每个调用点重复做同样的裁剪。
    const tree = await loadYindianTree()
    const transformedTree = transform(tree)
    writeSessionCache(YINDIAN_TREE_CACHE_KEY, transformedTree)
    return transformedTree
  }

  return {
    getDefaultTree,
    getPartitionData,
    getPartitionPoints,
    getCachedYindianTree,
    getYindianTree,
  }
}
