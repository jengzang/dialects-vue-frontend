import { getCurrentVillagesMLDataset } from '@/VillagesML/utils/currentDataset.js'
import { normalizeVillagesMLDataset } from '@/VillagesML/utils/routeDataset.js'
import { resolveVillagesMLDatasetConfig } from '@/VillagesML/config/datasets.js'

const VILLAGES_API_BASE = '/api/villages'

function normalizeEndpoint(endpoint = '') {
  const value = String(endpoint || '').trim()
  return value.startsWith('/') ? value : `/${value}`
}

export function buildVillagesMLApiPath(endpoint, { dataset, query = {} } = {}) {
  const requestDataset = normalizeVillagesMLDataset(dataset || getCurrentVillagesMLDataset())
  const datasetConfig = resolveVillagesMLDatasetConfig(requestDataset)

  const [pathPart, existingQuery = ''] = normalizeEndpoint(endpoint).split('?')
  const queryParams = new URLSearchParams(existingQuery)
  queryParams.set('type', datasetConfig.apiType)

  Object.entries(query).forEach(([key, value]) => {
    if (key !== 'type' && value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value)
    }
  })
  queryParams.set('type', datasetConfig.apiType)

  const queryString = queryParams.toString()
  const path = `${VILLAGES_API_BASE}${pathPart}`

  return queryString ? `${path}?${queryString}` : path
}

export async function villagesMLApi(endpoint, options = {}) {
  const { dataset, query, ...requestOptions } = options
  const { api } = await import('../auth/httpClient.js')
  return api(buildVillagesMLApiPath(endpoint, { dataset, query }), requestOptions)
}
