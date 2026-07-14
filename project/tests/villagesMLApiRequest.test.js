import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildVillagesMLApiPath } from '../src/api/villagesML/request.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('villagesML API request helper', () => {
  it('keeps current backend path shape while accepting a dataset', () => {
    expect(buildVillagesMLApiPath('/metadata/stats/overview')).toBe('/api/villages/metadata/stats/overview')
    expect(buildVillagesMLApiPath('/metadata/stats/overview', { dataset: 'gd' })).toBe(
      '/api/villages/metadata/stats/overview'
    )
  })

  it('appends query parameters without losing existing query strings', () => {
    expect(buildVillagesMLApiPath('/ngrams/frequency?n=2', {
      query: { position: 'prefix', min_frequency: 5 },
    })).toBe('/api/villages/ngrams/frequency?n=2&position=prefix&min_frequency=5')
  })

  it('centralizes cache-facing villages API prefixes through the helper', () => {
    ;['metadata.js', 'ngrams.js', 'villages.js'].forEach((file) => {
      expect(readSource(`src/api/villagesML/${file}`)).not.toContain('/api/villages')
    })
  })
})
