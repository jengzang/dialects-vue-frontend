import { readSessionCache, writeSessionCache } from '@/composables/core/sessionCache.js'

const LOCATION_DETAIL_CACHE_PREFIX = 'location_detail_cache:'

function buildKey(name) {
  return `${LOCATION_DETAIL_CACHE_PREFIX}${name}`
}

export function getCachedLocationDetail(name) {
  if (!name) {
    return null
  }

  return readSessionCache(buildKey(name))
}

export function cacheLocationDetail(name, data) {
  if (!name) {
    return
  }

  writeSessionCache(buildKey(name), data)
}
