import { api } from '@/api/auth/httpClient.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { readLocalCache, writeLocalCache } from '@/composables/core/localCache.js'
import { createSingleFlight } from '@/composables/core/singleFlight.js'

const SOURCE_STATS_STORAGE_KEY = 'source-stats-cache'
const SOURCE_STATS_RESPONSE_STORAGE_KEY = 'source-stats-response-cache'
const singleFlight = createSingleFlight()
const countsSingleFlight = createSingleFlight()

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
  writeLocalCache(SOURCE_STATS_STORAGE_KEY, stats, getCurrentDbVersion())
}

function readCachedResponse() {
  const parsed = readLocalCache(SOURCE_STATS_RESPONSE_STORAGE_KEY, getCurrentDbVersion())
  return parsed?.response || null
}

function stripUnusedPointFields(response) {
  return {
    ...response,
    points: (response.points || []).map(point => {
      const next = { ...point }
      delete next.atlas_region
      return next
    })
  }
}

function writeCachedResponse(result) {
  writeCachedStats({
    locationCount: result.total_points ?? 0,
    dataCount: result.total_entries ?? 0
  })
  writeLocalCache(
    SOURCE_STATS_RESPONSE_STORAGE_KEY,
    { response: stripUnusedPointFields(result) },
    getCurrentDbVersion()
  )
}

export async function getDialectCounts(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh) {
    const cached = readCachedResponse()
    if (cached) {
      return cached
    }
  }

  return countsSingleFlight(async () => {
    const result = await api('/api/dialect_counts')
    writeCachedResponse(result)
    return result
  })
}

async function requestSourceStats(forceRefresh) {
  const result = await getDialectCounts({ forceRefresh })

  return {
    locationCount: result.total_points ?? 0,
    dataCount: result.total_entries ?? 0
  }
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

  return singleFlight(() => requestSourceStats(forceRefresh))
}
