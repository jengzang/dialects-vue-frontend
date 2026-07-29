function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

function readJsonCache(key) {
  const storage = getSessionStorage()
  if (!storage) {
    return null
  }

  const cached = storage.getItem(key)
  if (!cached) {
    return null
  }

  try {
    return JSON.parse(cached)
  } catch (_error) {
    storage.removeItem(key)
    return null
  }
}

function writeJsonCache(key, value) {
  const storage = getSessionStorage()
  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(value))
}

export const PARTITION_DATA_CACHE_KEY = 'partition_data_cache'
export const YINDIAN_TREE_CACHE_KEY = '__YINDIAN_TREE_CACHE__'

export function usePartitionCache() {
  async function getPartitionData(loadPartitionData) {
    // 分区接口返回的是 { data } 包装结构，这里统一拆成页面真正消费的数组。
    const cached = readJsonCache(PARTITION_DATA_CACHE_KEY)
    if (cached) {
      return cached
    }

    const response = await loadPartitionData()
    const data = response?.data || []
    writeJsonCache(PARTITION_DATA_CACHE_KEY, data)
    return data
  }

  function getCachedYindianTree(transform = (value) => value) {
    // 允许读取缓存时再做 transform，这样同一份缓存能服务不同展示需求。
    const cached = readJsonCache(YINDIAN_TREE_CACHE_KEY)
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
    writeJsonCache(YINDIAN_TREE_CACHE_KEY, transformedTree)
    return transformedTree
  }

  return {
    getPartitionData,
    getCachedYindianTree,
    getYindianTree,
  }
}
