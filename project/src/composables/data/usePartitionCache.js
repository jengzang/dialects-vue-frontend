import { readSessionCache, writeSessionCache } from '@/composables/core/sessionCache.js'

export const PARTITION_DATA_CACHE_KEY = 'partition_data_cache'
export const PARTITION_POINTS_CACHE_KEY = 'partition_points_cache'

// A fresh page starts a fresh cache; sessionStorage must not keep old default trees alive.
const defaultTrees = new Map()
const pendingTrees = new Map()
const resolvedItems = new Map()
let resolutionIdentity

export function usePartitionCache() {
  async function resolveItems(mode, items, loadItems, { identity = 'anonymous', scope = 'default' } = {}) {
    if (resolutionIdentity !== identity) {
      resolvedItems.clear()
      resolutionIdentity = identity
    }
    const keys = items.map(item => JSON.stringify([2, identity, mode, scope, item.kind, item.text]))
    const missing = [...new Map(items.map((item, index) => [keys[index], item])).entries()]
      .filter(([key]) => !resolvedItems.has(key))
    if (missing.length) {
      const batch = Promise.resolve().then(() => loadItems({ region_mode: mode, scope, items: missing.map(([, item]) => item) }))
        .then(response => {
          if (response?.schema_version !== 2 || response.region_mode !== mode || response.items?.length !== missing.length) {
            throw new Error('Invalid partition resolution response')
          }
          return response.items
        })
      missing.forEach(([key], index) => {
        const pending = batch.then(result => result[index]).catch(error => {
          if (resolvedItems.get(key) === pending) resolvedItems.delete(key)
          throw error
        })
        resolvedItems.set(key, pending)
      })
    }
    return Promise.all(keys.map(key => resolvedItems.get(key)))
  }
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

  return {
    resolveItems,
    getDefaultTree,
    getPartitionData,
    getPartitionPoints,
  }
}
