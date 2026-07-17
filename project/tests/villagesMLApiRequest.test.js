import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildVillagesMLApiPath } from '../src/api/villagesML/request.js'
import {
  resetCurrentVillagesMLDataset,
  setCurrentVillagesMLDatasetFromRoute,
} from '../src/VillagesML/utils/currentDataset.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('villagesML API request helper', () => {
  afterEach(() => {
    resetCurrentVillagesMLDataset()
  })

  it('keeps current backend path shape and sends the dataset as type query', () => {
    expect(buildVillagesMLApiPath('/metadata/stats/overview')).toBe('/api/villages/metadata/stats/overview?type=gd')
    expect(buildVillagesMLApiPath('/metadata/stats/overview', { dataset: 'gd' })).toBe(
      '/api/villages/metadata/stats/overview?type=gd'
    )
  })

  it('appends query parameters without losing existing query strings', () => {
    expect(buildVillagesMLApiPath('/ngrams/frequency?n=2', {
      query: { position: 'prefix', min_frequency: 5 },
    })).toBe('/api/villages/ngrams/frequency?n=2&type=gd&position=prefix&min_frequency=5')
  })

  it('does not let callers override the dataset type query', () => {
    expect(buildVillagesMLApiPath('/ngrams/frequency', {
      query: { type: 'cn', position: 'prefix' },
    })).toBe('/api/villages/ngrams/frequency?type=gd&position=prefix')
  })

  it('uses the current VillagesML route dataset by default', () => {
    setCurrentVillagesMLDatasetFromRoute({ path: '/villagesML/cn', params: { pathMatch: ['cn'] } })
    expect(buildVillagesMLApiPath('/metadata/stats/overview')).toBe('/api/villages/metadata/stats/overview?type=gd')
    expect(buildVillagesMLApiPath('/metadata/stats/overview', { dataset: 'gd' })).toBe(
      '/api/villages/metadata/stats/overview?type=gd'
    )
  })

  it('centralizes villages API prefixes through the helper', () => {
    ;[
      'characters.js',
      'clustering.js',
      'clusteringTypes.js',
      'compute.js',
      'metadata.js',
      'ngrams.js',
      'patterns.js',
      'regionSimilarity.js',
      'regional.js',
      'semantic.js',
      'semanticCategories.js',
      'semanticComposition.js',
      'semanticLabels.js',
      'spatial.js',
      'villages.js',
    ].forEach((file) => {
      expect(readSource(`src/api/villagesML/${file}`)).not.toContain('/api/villages')
    })
  })
})
