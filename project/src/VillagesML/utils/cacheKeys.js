import { normalizeVillagesMLDataset } from './routeDataset.js'

export function buildVillagesCacheKey(kind, { dataset = 'gd', parts = [] } = {}) {
  const keyParts = ['villages', normalizeVillagesMLDataset(dataset), kind, 'cache', ...parts.filter(Boolean)]
  return keyParts.join('-')
}
