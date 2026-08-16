import { getMetadataOverview, getMetadataTables, getNgramStatistics } from '@/api'
import { getRegionList } from '@/api/villagesML/villages.js'
import { buildVillagesCacheKey } from '@/VillagesML/utils/cacheKeys.js'
import { getCurrentVillagesMLDataset } from '@/VillagesML/utils/currentDataset.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { readLocalCache, writeLocalCache } from '@/composables/core/localCache.js'
import { createKeyedSingleFlight } from '@/composables/core/singleFlight.js'

const singleFlight = createKeyedSingleFlight()

function getVillagesCacheKey(kind, parts = []) {
  return buildVillagesCacheKey(kind, {
    dataset: getCurrentVillagesMLDataset(),
    parts
  })
}

function getCurrentDbVersion() {
  return getHomeUpdateNotice(() => '').dbVersion || 'default'
}

function readCache(key) {
  const parsed = readLocalCache(key, getCurrentDbVersion())
  return parsed ? parsed.data : null
}

function writeCache(key, data) {
  writeLocalCache(key, { data }, getCurrentDbVersion())
}

export function getCachedVillagesOverview() {
  return readCache(getVillagesCacheKey('overview'))
}

export async function getVillagesOverview(options = {}) {
  const { forceRefresh = false } = options
  const cacheKey = getVillagesCacheKey('overview')

  if (!forceRefresh) {
    const cached = readCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  return singleFlight(cacheKey, async () => {
    const data = await getMetadataOverview()
    writeCache(cacheKey, data)
    return data
  })
}

export function getCachedVillagesNgrams() {
  return readCache(getVillagesCacheKey('ngrams'))
}

export async function getVillagesNgrams(options = {}) {
  const { forceRefresh = false } = options
  const cacheKey = getVillagesCacheKey('ngrams')

  if (!forceRefresh) {
    const cached = readCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  return singleFlight(cacheKey, async () => {
    const data = await getNgramStatistics()
    writeCache(cacheKey, data)
    return data
  })
}

export function getCachedVillagesTables() {
  return readCache(getVillagesCacheKey('tables'))
}

export async function getVillagesTables(options = {}) {
  const { forceRefresh = false } = options
  const cacheKey = getVillagesCacheKey('tables')

  if (!forceRefresh) {
    const cached = readCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  return singleFlight(cacheKey, async () => {
    const data = await getMetadataTables()
    writeCache(cacheKey, data)
    return data
  })
}

export async function getVillagesRegions(level, parent = null, options = {}) {
  const { forceRefresh = false } = options
  const cacheKey = getVillagesCacheKey('regions', [level, parent])

  if (!forceRefresh) {
    const cached = readCache(cacheKey)
    if (cached) {
      return cached
    }
  }

  return singleFlight(cacheKey, async () => {
    const data = await getRegionList(level, parent)
    writeCache(cacheKey, data)
    return data
  })
}
