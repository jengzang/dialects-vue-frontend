import { describe, expect, it } from 'vitest'

import { buildVillagesCacheKey } from '../src/VillagesML/utils/cacheKeys.js'

describe('villagesML cache keys', () => {
  it('scopes villages cache keys by dataset', () => {
    expect(buildVillagesCacheKey('overview')).toBe('villages-gd-overview-cache')
    expect(buildVillagesCacheKey('ngrams', { dataset: 'cn' })).toBe('villages-cn-ngrams-cache')
    expect(buildVillagesCacheKey('regions', { dataset: 'gd', parts: ['city'] })).toBe(
      'villages-gd-regions-cache-city'
    )
    expect(buildVillagesCacheKey('regions', { dataset: 'gd', parts: ['county', '廣州'] })).toBe(
      'villages-gd-regions-cache-county-廣州'
    )
  })
})
