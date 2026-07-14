import { normalizeVillagesMLDataset } from '@/VillagesML/utils/routeDataset.js'

const VILLAGES_API_BASE = '/api/villages'

function normalizeEndpoint(endpoint = '') {
  const value = String(endpoint || '').trim()
  return value.startsWith('/') ? value : `/${value}`
}

export function buildVillagesMLApiPath(endpoint, { dataset = 'gd', query = {} } = {}) {
  normalizeVillagesMLDataset(dataset)

  const [pathPart, existingQuery = ''] = normalizeEndpoint(endpoint).split('?')
  const queryParams = new URLSearchParams(existingQuery)

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value)
    }
  })

  const queryString = queryParams.toString()
  const path = `${VILLAGES_API_BASE}${pathPart}`

  return queryString ? `${path}?${queryString}` : path
}

export async function villagesMLApi(endpoint, options = {}) {
  const { dataset, query, ...requestOptions } = options
  const { api } = await import('../auth/httpClient.js')
  return api(buildVillagesMLApiPath(endpoint, { dataset, query }), requestOptions)
}
