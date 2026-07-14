import { getMetadataOverview, getMetadataTables, getNgramStatistics } from '@/api'
import { getRegionList } from '@/api/villagesML/villages.js'
import { getHomeUpdateNotice } from '@/main/config/updateNoticeConfig.js'

const OVERVIEW_CACHE_KEY = 'villages-overview-cache'
const NGRAMS_CACHE_KEY = 'villages-ngrams-cache'
const TABLES_CACHE_KEY = 'villages-tables-cache'

const regionsPromises = new Map()

let overviewPromise = null
let ngramsPromise = null
let tablesPromise = null

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
  return readCache(OVERVIEW_CACHE_KEY)
}

export async function getVillagesOverview(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh) {
    const cached = readCache(OVERVIEW_CACHE_KEY)
    if (cached) {
      return cached
    }
  }

  if (!overviewPromise) {
    overviewPromise = getMetadataOverview().then((data) => {
      writeCache(OVERVIEW_CACHE_KEY, data)
      return data
    }).finally(() => {
      overviewPromise = null
    })
  }

  return overviewPromise
}

export function getCachedVillagesNgrams() {
  return readCache(NGRAMS_CACHE_KEY)
}

export async function getVillagesNgrams(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh) {
    const cached = readCache(NGRAMS_CACHE_KEY)
    if (cached) {
      return cached
    }
  }

  if (!ngramsPromise) {
    ngramsPromise = getNgramStatistics().then((data) => {
      writeCache(NGRAMS_CACHE_KEY, data)
      return data
    }).finally(() => {
      ngramsPromise = null
    })
  }

  return ngramsPromise
}

export function getCachedVillagesTables() {
  return readCache(TABLES_CACHE_KEY)
}

export async function getVillagesTables(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh) {
    const cached = readCache(TABLES_CACHE_KEY)
    if (cached) {
      return cached
    }
  }

  if (!tablesPromise) {
    tablesPromise = getMetadataTables().then((data) => {
      writeCache(TABLES_CACHE_KEY, data)
      return data
    }).finally(() => {
      tablesPromise = null
    })
  }

  return tablesPromise
}

export async function getVillagesRegions(level, parent = null, options = {}) {
  const { forceRefresh = false } = options
  const cacheKey = `villages-regions-cache-${level}${parent ? '-' + parent : ''}`

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
