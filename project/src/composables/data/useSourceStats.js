import { queryCount } from '@/api'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { readLocalCache, writeLocalCache } from '@/composables/core/localCache.js'
import { createSingleFlight } from '@/composables/core/singleFlight.js'

const SOURCE_STATS_STORAGE_KEY = 'source-stats-cache'
const singleFlight = createSingleFlight()

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
  const parsed = readLocalCache(SOURCE_STATS_STORAGE_KEY, getCurrentDbVersion())
  if (!parsed) {
    return null
  }

  if (parsed.locationCount == null || parsed.dataCount == null) {
    return null
  }

  return {
    locationCount: parsed.locationCount,
    dataCount: parsed.dataCount
  }
}

function writeCachedStats(stats) {
  writeLocalCache(
    SOURCE_STATS_STORAGE_KEY,
    { locationCount: stats.locationCount, dataCount: stats.dataCount },
    getCurrentDbVersion()
  )
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

  return singleFlight(requestSourceStats)
}
