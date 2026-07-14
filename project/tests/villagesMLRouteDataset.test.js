import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  buildVillagesMLPath,
  buildVillagesMLRedirect,
  normalizeVillagesMLDataset,
  resolveVillagesMLDataset,
  resolveVillagesMLDatasetFromRoute,
} from '../src/VillagesML/utils/routeDataset.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('villagesML route dataset helpers', () => {
  it('builds dataset-aware VillagesML navigation paths', () => {
    expect(buildVillagesMLPath({ module: 'search' })).toBe('/villagesML/gd?module=search')
    expect(buildVillagesMLPath({ module: 'regional', subtab: 'vectors' })).toBe(
      '/villagesML/gd?module=regional&subtab=vectors'
    )
    expect(buildVillagesMLPath({
      dataset: 'cn',
      module: 'pattern',
      subtab: 'ngram-stats',
      query: { ngram: '村' },
    })).toBe('/villagesML/cn?module=pattern&subtab=ngram-stats&ngram=%E6%9D%91')
  })

  it('keeps legacy VillagesML routes on the Guangdong dataset', () => {
    expect(resolveVillagesMLDataset('/villagesML')).toBe('gd')
    expect(resolveVillagesMLDataset('/villagesML?module=search')).toBe('gd')
    expect(resolveVillagesMLDataset('/villagesML/gd?module=search')).toBe('gd')
    expect(resolveVillagesMLDataset('/villagesML/cn?module=search')).toBe('cn')
  })

  it('builds canonical redirects for legacy VillagesML paths', () => {
    expect(buildVillagesMLRedirect({
      path: '/villagesML',
      query: { module: 'search' },
      hash: '#panel',
    })).toEqual({
      path: '/villagesML/gd',
      query: { module: 'search' },
      hash: '#panel',
      replace: true,
    })

    expect(buildVillagesMLRedirect({
      path: '/villagesML/cn',
      query: { module: 'search' },
      hash: '',
    })).toBeNull()
  })

  it('resolves the dataset from Vue route objects', () => {
    expect(resolveVillagesMLDatasetFromRoute({ params: {}, path: '/villagesML' })).toBe('gd')
    expect(resolveVillagesMLDatasetFromRoute({ params: { pathMatch: ['gd'] }, path: '/villagesML/gd' })).toBe('gd')
    expect(resolveVillagesMLDatasetFromRoute({ params: { pathMatch: 'cn' }, path: '/villagesML/cn' })).toBe('cn')
  })

  it('normalizes unknown or missing datasets to Guangdong', () => {
    expect(normalizeVillagesMLDataset()).toBe('gd')
    expect(normalizeVillagesMLDataset('')).toBe('gd')
    expect(normalizeVillagesMLDataset('bad/slash')).toBe('gd')
    expect(normalizeVillagesMLDataset('GD')).toBe('gd')
  })

  it('keeps VillagesML navigation paths dataset-aware in shared config', () => {
    const source = readSource('src/VillagesML/config/BarConfig.js')

    expect(source).toContain("buildVillagesMLPath({ module: 'search' })")
    expect(source).not.toContain("path: '/villagesML?module=")
    expect(source).not.toContain('path: "/villagesML?module=')
  })

  it('keeps dashboard VillagesML routes dataset-aware', () => {
    const source = readSource('src/VillagesML/dashboard/Dashboard.vue')

    expect(source).toContain("buildVillagesMLPath({ module: 'search' })")
    expect(source).toContain("buildVillagesMLPath({ module: 'search', query: { keyword: searchKeyword.value } })")
    expect(source).not.toContain("route: '/villagesML?module=")
    expect(source).not.toContain('window.location.href = `/villagesML?module=')
  })
})
