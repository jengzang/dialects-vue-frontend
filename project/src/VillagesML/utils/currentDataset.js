import {
  DEFAULT_VILLAGESML_DATASET,
  buildVillagesMLPath,
  normalizeVillagesMLDataset,
  resolveVillagesMLDatasetFromRoute,
} from './routeDataset.js'

let currentVillagesMLDataset = DEFAULT_VILLAGESML_DATASET

export function getCurrentVillagesMLDataset() {
  return currentVillagesMLDataset
}

export function setCurrentVillagesMLDataset(dataset) {
  currentVillagesMLDataset = normalizeVillagesMLDataset(dataset)
  return currentVillagesMLDataset
}

export function setCurrentVillagesMLDatasetFromRoute(route = {}) {
  return setCurrentVillagesMLDataset(resolveVillagesMLDatasetFromRoute(route))
}

export function resetCurrentVillagesMLDataset() {
  currentVillagesMLDataset = DEFAULT_VILLAGESML_DATASET
}

export function buildCurrentVillagesMLPath(options = {}) {
  return buildVillagesMLPath({
    ...options,
    dataset: options.dataset || getCurrentVillagesMLDataset()
  })
}
