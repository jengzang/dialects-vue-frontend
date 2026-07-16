import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_VILLAGESML_DATASET,
  VILLAGESML_DATASETS,
  getVillagesMLDatasetConfig,
} from '../src/VillagesML/config/datasets.js'
import {
  buildVillagesMLPath,
  buildVillagesMLRedirect,
  normalizeVillagesMLDataset,
  resolveVillagesMLDataset,
  resolveVillagesMLDatasetFromRoute,
} from '../src/VillagesML/utils/routeDataset.js'
import {
  buildCurrentVillagesMLPath,
  resetCurrentVillagesMLDataset,
  setCurrentVillagesMLDataset,
} from '../src/VillagesML/utils/currentDataset.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('villagesML route dataset helpers', () => {
  it('centralizes available VillagesML datasets in config', () => {
    expect(DEFAULT_VILLAGESML_DATASET).toBe('gd')
    expect(VILLAGESML_DATASETS.map(dataset => dataset.id)).toContain('gd')
    expect(getVillagesMLDatasetConfig('gd')?.apiType).toBe('gd')
  })

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
    })).toBe('/villagesML/gd?module=pattern&subtab=ngram-stats&ngram=%E6%9D%91')
  })

  it('can build VillagesML navigation from the current route dataset', () => {
    setCurrentVillagesMLDataset('gd')
    expect(buildCurrentVillagesMLPath({ module: 'pattern' })).toBe('/villagesML/gd?module=pattern')
    resetCurrentVillagesMLDataset()
  })

  it('keeps legacy VillagesML routes on the Guangdong dataset', () => {
    expect(resolveVillagesMLDataset('/villagesML')).toBe('gd')
    expect(resolveVillagesMLDataset('/villagesML?module=search')).toBe('gd')
    expect(resolveVillagesMLDataset('/villagesML/gd?module=search')).toBe('gd')
    expect(resolveVillagesMLDataset('/villagesML/cn?module=search')).toBe('gd')
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
    })).toEqual({
      path: '/villagesML/gd',
      query: { module: 'search' },
      hash: '',
      replace: true,
    })

    expect(buildVillagesMLRedirect({
      path: '/villagesML/gd',
      query: { module: 'search' },
      hash: '',
    })).toBeNull()
  })

  it('resolves the dataset from Vue route objects', () => {
    expect(resolveVillagesMLDatasetFromRoute({ params: {}, path: '/villagesML' })).toBe('gd')
    expect(resolveVillagesMLDatasetFromRoute({ params: { pathMatch: ['gd'] }, path: '/villagesML/gd' })).toBe('gd')
    expect(resolveVillagesMLDatasetFromRoute({ params: { pathMatch: 'cn' }, path: '/villagesML/cn' })).toBe('gd')
  })

  it('normalizes unknown or missing datasets to Guangdong', () => {
    expect(normalizeVillagesMLDataset()).toBe('gd')
    expect(normalizeVillagesMLDataset('')).toBe('gd')
    expect(normalizeVillagesMLDataset('cn')).toBe('gd')
    expect(normalizeVillagesMLDataset('bad/slash')).toBe('gd')
    expect(normalizeVillagesMLDataset('GD')).toBe('gd')
  })

  it('keeps VillagesML navigation paths dataset-aware in shared config', () => {
    const source = readSource('src/VillagesML/config/BarConfig.js')

    expect(source).toContain("buildCurrentVillagesMLPath({ module: 'search' })")
    expect(source).not.toContain("path: '/villagesML?module=")
    expect(source).not.toContain('path: "/villagesML?module=')
  })

  it('keeps dashboard VillagesML routes dataset-aware', () => {
    const source = readSource('src/VillagesML/dashboard/Dashboard.vue')

    expect(source).toContain('const route = useRoute()')
    expect(source).toContain('const features = computed(() => {')
    expect(source).toContain('route.path')
    expect(source).toContain("buildCurrentVillagesMLPath({ module: 'search' })")
    expect(source).toContain("buildCurrentVillagesMLPath({ module: 'search', query: { keyword: searchKeyword.value } })")
    expect(source).not.toContain('const features = [')
    expect(source).not.toContain("route: '/villagesML?module=")
    expect(source).not.toContain('window.location.href = `/villagesML?module=')
  })

  it('keeps workspace module navigation derived from current dataset at runtime', () => {
    const source = readSource('src/VillagesML/workspace/VillagesMLWorkspace.vue')

    expect(source).toContain('const getRouteAwareVillagesMLModules = () => {')
    expect(source).toContain('if (!route.path) return []')
    expect(source).toContain('const activeDataset = computed(() => resolveVillagesMLDatasetFromRoute(route))')
    expect(source).toContain('watch(activeDataset')
    expect(source).toContain('resetDatasetResultState()')
    expect(source).toContain('const modules = computed(() => {')
    expect(source).toContain('return getRouteAwareVillagesMLModules().map')
    expect(source).not.toContain('const modules = getVillagesMLModules().map')
  })
})
