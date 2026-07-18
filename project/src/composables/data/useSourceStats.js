import { queryCount } from '@/api'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'

const SOURCE_STATS_STORAGE_KEY = 'source-stats-cache'
let inFlightPromise = null

function getCurrentDbVersion() {
  return getHomeUpdateNotice(() => '').dbVersion || 'default'
}

function getEmptyStats() {
  return {
    locationCount: '…',
    dataCount: '…'
  }
}

function readCachedStats() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(SOURCE_STATS_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || parsed.dbVersion !== getCurrentDbVersion()) {
      return null
    }

    if (parsed.locationCount == null || parsed.dataCount == null) {
      return null
    }

    return {
      locationCount: parsed.locationCount,
      dataCount: parsed.dataCount
    }
  } catch (error) {
    console.warn('讀取字表統計本地緩存失敗:', error)
    return null
  }
}

function writeCachedStats(stats) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(
      SOURCE_STATS_STORAGE_KEY,
      JSON.stringify({
        dbVersion: getCurrentDbVersion(),
        locationCount: stats.locationCount,
        dataCount: stats.dataCount,
        cachedAt: Date.now()
      })
    )
  } catch (error) {
    console.warn('寫入字表統計本地緩存失敗:', error)
  }
}

async function requestSourceStats() {
  const [locationCount, dataCount] = await Promise.all([
    queryCount({ db_key: 'query', table_name: 'dialects', filter_column: '存儲標記', filter_value: 1 }),
    queryCount({ db_key: 'dialects', table_name: 'dialects' })
  ])

  const nextStats = {
    locationCount,
    dataCount
  }

  writeCachedStats(nextStats)
  return nextStats
}

export function getCachedSourceStats() {
  return readCachedStats() || getEmptyStats()
}

export async function getSourceStats(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh) {
    const cached = readCachedStats()
    if (cached) {
      return cached
    }
  }

  if (!inFlightPromise) {
    inFlightPromise = requestSourceStats().finally(() => {
      inFlightPromise = null
    })
  }

  return inFlightPromise
}
