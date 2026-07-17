export const DEFAULT_VILLAGESML_DATASET = 'gd'

export const VILLAGESML_DATASETS = [
  {
    id: 'gd',
    apiType: 'gd',
    label: '廣東省自然村',
    description: '廣東省自然村名分析數據'
  }
]

export const VILLAGESML_DATASET_IDS = new Set(VILLAGESML_DATASETS.map(dataset => dataset.id))

export function getVillagesMLDatasetConfig(dataset = DEFAULT_VILLAGESML_DATASET) {
  return VILLAGESML_DATASETS.find(item => item.id === dataset) || null
}

export function resolveVillagesMLDatasetConfig(dataset = DEFAULT_VILLAGESML_DATASET) {
  return getVillagesMLDatasetConfig(dataset) || getVillagesMLDatasetConfig(DEFAULT_VILLAGESML_DATASET)
}
