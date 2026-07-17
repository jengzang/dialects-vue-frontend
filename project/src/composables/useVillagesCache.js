import { getMetadataOverview, getMetadataTables, getNgramStatistics } from '@/api'
import { getRegionList } from '@/api/villagesML/villages.js'
import { getHomeUpdateNotice } from '@/main/config/updateNoticeConfig.js'
import { buildVillagesCacheKey } from '@/VillagesML/utils/cacheKeys.js'
import { getCurrentVillagesMLDataset } from '@/VillagesML/utils/currentDataset.js'

const overviewPromises = new Map()
const ngramsPromises = new Map()
const tablesPromises = new Map()
const regionsPromises = new Map()

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
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || parsed.dbVersion !== getCurrentDbVersion()) {
      return null
    }

    return parsed.data
  } catch (error) {
    console.warn(`讀取緩存失敗 (${key}):`, error)
    return null
  }
}

function writeCache(key, data) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        dbVersion: getCurrentDbVersion(),
        data,
        cachedAt: Date.now()
      })
    )
  } catch (error) {
    console.warn(`寫入緩存失敗 (${key}):`, error)
  }
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

  if (!overviewPromises.has(cacheKey)) {
    overviewPromises.set(cacheKey, getMetadataOverview().then((data) => {
      writeCache(cacheKey, data)
      return data
    }).finally(() => {
      overviewPromises.delete(cacheKey)
    }))
  }

  return overviewPromises.get(cacheKey)
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

  if (!ngramsPromises.has(cacheKey)) {
    ngramsPromises.set(cacheKey, getNgramStatistics().then((data) => {
      writeCache(cacheKey, data)
      return data
    }).finally(() => {
      ngramsPromises.delete(cacheKey)
    }))
  }

  return ngramsPromises.get(cacheKey)
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

  if (!tablesPromises.has(cacheKey)) {
    tablesPromises.set(cacheKey, getMetadataTables().then((data) => {
      writeCache(cacheKey, data)
      return data
    }).finally(() => {
      tablesPromises.delete(cacheKey)
    }))
  }

  return tablesPromises.get(cacheKey)
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

  if (!regionsPromises.has(cacheKey)) {
    regionsPromises.set(
      cacheKey,
      getRegionList(level, parent).then((data) => {
        writeCache(cacheKey, data)
        return data
      }).finally(() => {
        regionsPromises.delete(cacheKey)
      })
    )
  }

  return regionsPromises.get(cacheKey)
}
