import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildVillagesCacheKey } from '../src/VillagesML/utils/cacheKeys.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('villagesML cache keys', () => {
  it('scopes villages cache keys by dataset', () => {
    expect(buildVillagesCacheKey('overview')).toBe('villages-gd-overview-cache')
    expect(buildVillagesCacheKey('ngrams', { dataset: 'cn' })).toBe('villages-gd-ngrams-cache')
    expect(buildVillagesCacheKey('regions', { dataset: 'gd', parts: ['city'] })).toBe(
      'villages-gd-regions-cache-city'
    )
    expect(buildVillagesCacheKey('regions', { dataset: 'gd', parts: ['county', '廣州'] })).toBe(
      'villages-gd-regions-cache-county-廣州'
    )
  })

  it('keeps villages cache reads scoped to the current route dataset', () => {
    const source = readSource('src/composables/useVillagesCache.js')

    expect(source).toContain('getCurrentVillagesMLDataset')
    expect(source).not.toContain('const OVERVIEW_CACHE_KEY')
    expect(source).not.toContain('const NGRAMS_CACHE_KEY')
    expect(source).not.toContain('const TABLES_CACHE_KEY')
  })

  it('keeps region preload caches scoped to the current route dataset', () => {
    const source = readSource('src/VillagesML/utils/regionPreload.js')

    expect(source).toContain('getCurrentVillagesMLDataset')
    expect(source).toContain('allRegionsDataByDataset')
    expect(source).toContain('loadingPromisesByDataset')
    expect(source).not.toContain("const CACHE_KEY = 'regions_all_data_v3'")
  })

  it('keeps legacy region caches scoped to the current route dataset', () => {
    const source = readSource('src/VillagesML/utils/regionCache.js')

    expect(source).toContain('getCurrentVillagesMLDataset')
    expect(source).toContain('${getCurrentVillagesMLDataset()}')
  })
})
