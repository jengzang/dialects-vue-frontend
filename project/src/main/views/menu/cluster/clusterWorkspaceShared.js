export const QUICK_RUN_FALLBACK_LABEL = 'Quick Run'

export const STEP_ORDER = ['input', 'preview', 'prepare', 'distance', 'cluster', 'result']
export const STORAGE_KEY = 'cluster-workspace-v1'
export const DEFAULT_GROUP_KEYS = ['攝']

export function createDefaultClusteringState() {
  return {
    algorithm: 'agglomerative',
    n_clusters: 8,
    linkage: 'average',
    random_state: 42,
    eps: 0.5,
    min_samples: 5
  }
}

export function createIdleActiveTask(source = 'staged') {
  return {
    stage: '',
    taskId: '',
    status: 'idle',
    progress: 0,
    message: '',
    source
  }
}

export function createEmptyGroup() {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    compare_dimension: 'final',
    source_mode: 'path_strings',
    pathKeys: [...DEFAULT_GROUP_KEYS],
    pathValueMap: {},
    resolvedCharsText: '',
    table_name: 'characters'
  }
}

export function createDefaultWorkspaceState() {
  return {
    currentStep: 'input',
    requestDraft: {
      groups: [createEmptyGroup()],
      locations: [],
      regions: [],
      region_mode: 'yindian',
      include_special_locations: false
    },
    previewData: null,
    prepareHash: '',
    prepareTaskId: '',
    prepareCompleted: false,
    selectedPhonemeMode: 'intra_group',
    distanceHashByMode: {},
    distanceTaskIdByMode: {},
    resultHashByKey: {},
    resultTaskIdByKey: {},
    activeResultSource: 'staged',
    activeTask: createIdleActiveTask('staged'),
    clustering: createDefaultClusteringState()
  }
}

export function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .map((value) => typeof value === 'string' ? value.trim() : '')
    .filter(Boolean)
}

export function normalizeWorkspaceState(value) {
  const defaults = createDefaultWorkspaceState()
  const requestDraft = value?.requestDraft || defaults.requestDraft
  const groups = Array.isArray(requestDraft.groups) && requestDraft.groups.length > 0
    ? requestDraft.groups.map((group) => ({
        ...createEmptyGroup(),
        ...group,
        pathKeys: Array.isArray(group.pathKeys) && group.pathKeys.length > 0 ? group.pathKeys : [...DEFAULT_GROUP_KEYS],
        pathValueMap: group.pathValueMap || {},
        resolvedCharsText: group.resolvedCharsText || ''
      }))
    : defaults.requestDraft.groups

  return {
    ...defaults,
    ...value,
    requestDraft: {
      ...defaults.requestDraft,
      ...requestDraft,
      groups,
      locations: normalizeStringArray(requestDraft.locations),
      regions: normalizeStringArray(requestDraft.regions),
      region_mode: requestDraft.region_mode || 'yindian',
      include_special_locations: Boolean(requestDraft.include_special_locations)
    },
    distanceHashByMode: { ...defaults.distanceHashByMode, ...(value?.distanceHashByMode || {}) },
    distanceTaskIdByMode: { ...defaults.distanceTaskIdByMode, ...(value?.distanceTaskIdByMode || {}) },
    resultHashByKey: { ...defaults.resultHashByKey, ...(value?.resultHashByKey || {}) },
    resultTaskIdByKey: { ...defaults.resultTaskIdByKey, ...(value?.resultTaskIdByKey || {}) },
    activeTask: {
      ...defaults.activeTask,
      ...(value?.activeTask || {})
    },
    clustering: {
      ...defaults.clustering,
      ...(value?.clustering || {})
    }
  }
}

export function normalizePositiveInteger(value, fallbackValue) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue
  }

  return Math.round(numericValue)
}

export function normalizeInteger(value, fallbackValue) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return fallbackValue
  }

  return Math.round(numericValue)
}

export function normalizePositiveNumber(value, fallbackValue) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue
  }

  return numericValue
}

export function formatNumeric(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return '—'
  }

  return numericValue % 1 === 0 ? String(numericValue) : numericValue.toFixed(2)
}

export function formatStructuredValue(value) {
  return JSON.stringify(value, null, 2)
}

export function mapTaskStatus(status) {
  if (status === 'queued') return 'pending'
  if (status === 'done') return 'completed'
  if (status === 'error') return 'failed'
  return status || 'idle'
}

export function isTaskBusy(status) {
  return ['pending', 'processing', 'queued'].includes(status)
}

export function getGroupPathStrings(group) {
  const validEntries = group.pathKeys
    .map((key) => ({
      key,
      values: Array.isArray(group.pathValueMap[key]) ? group.pathValueMap[key].filter(Boolean) : []
    }))
    .filter((entry) => entry.values.length > 0)

  if (validEntries.length === 0) {
    return []
  }

  return validEntries.reduce((paths, entry) => {
    const nextPaths = []

    paths.forEach((path) => {
      entry.values.forEach((value) => {
        nextPaths.push(`${path}[${value}]{${entry.key}}`)
      })
    })

    return nextPaths
  }, [''])
}

export function getResolvedChars(group) {
  return Array.from(new Set(
    String(group.resolvedCharsText || '')
      .split(/[\s,，;；、]+/)
      .flatMap((token) => Array.from(token.trim()))
      .filter(Boolean)
  ))
}

export function getEffectiveGroups(groups) {
  return groups.map((group) => {
    const pathStrings = getGroupPathStrings(group)
    const resolvedChars = getResolvedChars(group)

    return {
      ...group,
      pathStrings,
      resolvedChars
    }
  })
}

export function buildPreviewRequestDraft(requestDraft) {
  const groups = getEffectiveGroups(requestDraft.groups)
    .filter((group) => group.label && group.compare_dimension)
    .map((group) => {
      if (group.source_mode === 'resolved_chars') {
        return {
          label: group.label,
          source_mode: 'resolved_chars',
          resolved_chars: group.resolvedChars,
          compare_dimension: group.compare_dimension
        }
      }

      return {
        label: group.label,
        source_mode: 'path_strings',
        table_name: 'characters',
        path_strings: group.pathStrings,
        compare_dimension: group.compare_dimension
      }
    })

  return {
    groups,
    locations: normalizeStringArray(requestDraft.locations),
    regions: normalizeStringArray(requestDraft.regions),
    region_mode: requestDraft.region_mode || 'yindian',
    include_special_locations: Boolean(requestDraft.include_special_locations)
  }
}

export function buildClusteringPayload(clusteringState) {
  const { algorithm } = clusteringState

  if (algorithm === 'agglomerative') {
    return {
      algorithm,
      n_clusters: normalizePositiveInteger(clusteringState.n_clusters, 8),
      linkage: clusteringState.linkage || 'average',
      random_state: normalizeInteger(clusteringState.random_state, 42)
    }
  }

  if (algorithm === 'dbscan') {
    return {
      algorithm,
      eps: normalizePositiveNumber(clusteringState.eps, 0.5),
      min_samples: normalizePositiveInteger(clusteringState.min_samples, 5)
    }
  }

  if (algorithm === 'kmeans') {
    return {
      algorithm,
      n_clusters: normalizePositiveInteger(clusteringState.n_clusters, 8),
      random_state: normalizeInteger(clusteringState.random_state, 42)
    }
  }

  if (algorithm === 'gmm') {
    return {
      algorithm,
      n_clusters: normalizePositiveInteger(clusteringState.n_clusters, 8),
      random_state: normalizeInteger(clusteringState.random_state, 42)
    }
  }

  return {
    algorithm: 'agglomerative',
    n_clusters: 8,
    linkage: 'average',
    random_state: 42
  }
}

export function buildResultKey(phonemeMode, clustering) {
  return JSON.stringify({
    phonemeMode,
    algorithm: clustering.algorithm,
    n_clusters: clustering.n_clusters ?? null,
    linkage: clustering.linkage ?? null,
    eps: clustering.eps ?? null,
    min_samples: clustering.min_samples ?? null,
    random_state: clustering.random_state ?? null
  })
}

export function resolveErrorMessage(error) {
  if (typeof error?.detail === 'string' && error.detail.trim()) {
    return error.detail.trim()
  }

  if (error?.detail?.message && typeof error.detail.message === 'string') {
    return error.detail.message
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim()
  }

  return ''
}

export function resolveNotFoundStage(error, fallbackStage) {
  const detail = resolveErrorMessage(error)

  if (detail.includes('任务不存在')) {
    return 'task'
  }

  if (detail.includes('result_hash') || detail.includes('result artifact')) {
    return 'cluster'
  }

  if (detail.includes('distance')) {
    return 'distance'
  }

  if (detail.includes('prepare')) {
    return 'prepare'
  }

  return fallbackStage
}
