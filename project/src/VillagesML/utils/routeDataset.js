import {
  DEFAULT_VILLAGESML_DATASET,
  VILLAGESML_DATASET_IDS,
} from '@/VillagesML/config/datasets.js'

export { DEFAULT_VILLAGESML_DATASET }

const DATASET_PATTERN = /^[a-z0-9-]+$/

export function normalizeVillagesMLDataset(dataset = DEFAULT_VILLAGESML_DATASET) {
  const normalized = String(dataset || DEFAULT_VILLAGESML_DATASET).trim().toLowerCase()
  return DATASET_PATTERN.test(normalized) && VILLAGESML_DATASET_IDS.has(normalized)
    ? normalized
    : DEFAULT_VILLAGESML_DATASET
}

export function resolveVillagesMLDataset(path = '') {
  const pathname = String(path).split('?')[0]
  const [, dataset] = pathname.match(/^\/villagesML\/([^/?#]+)/) || []
  return normalizeVillagesMLDataset(dataset)
}

export function resolveVillagesMLDatasetFromRoute(route = {}) {
  const pathMatch = route.params?.pathMatch
  const firstSegment = Array.isArray(pathMatch) ? pathMatch[0] : pathMatch

  if (firstSegment) {
    return normalizeVillagesMLDataset(firstSegment)
  }

  return resolveVillagesMLDataset(route.path || route.fullPath || '')
}

export function buildVillagesMLPath({
  dataset = DEFAULT_VILLAGESML_DATASET,
  module,
  subtab,
  query = {},
} = {}) {
  const queryParams = new URLSearchParams()

  if (module) queryParams.set('module', module)
  if (subtab) queryParams.set('subtab', subtab)

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value)
    }
  })

  const queryString = queryParams.toString()
  const basePath = `/villagesML/${normalizeVillagesMLDataset(dataset)}`

  return queryString ? `${basePath}?${queryString}` : basePath
}

export function buildVillagesMLRedirect(route = {}) {
  const path = route.path || ''
  const normalizedDataset = resolveVillagesMLDatasetFromRoute(route)
  const canonicalPath = `/villagesML/${normalizedDataset}`

  if (path !== '/villagesML' && path === canonicalPath) {
    return null
  }

  return {
    path: canonicalPath,
    query: route.query || {},
    hash: route.hash || '',
    replace: true,
  }
}
