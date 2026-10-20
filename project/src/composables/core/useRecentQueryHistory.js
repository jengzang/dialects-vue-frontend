import { ref, toValue, watch } from 'vue'

const CONTEXTS = new Set([
  'query:tab1', 'query:tab2', 'query:tab3', 'query:tab4',
  'compare:tab1', 'compare:tab2', 'compare:tab4',
  'pho:matrix', 'pho:custom',
])
const clone = value => JSON.parse(JSON.stringify(value))
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

function identity(value) {
  if (Array.isArray(value)) return `[${value.map(identity).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${identity(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function useRecentQueryHistory(context) {
  const entries = ref([])
  const storageKey = () => `recent-query:v1:${toValue(context)}`

  watch(() => toValue(context), () => {
    entries.value = []
    if (!CONTEXTS.has(toValue(context))) return
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey()) || 'null')
      if (saved?.version === 1 && Array.isArray(saved.entries)) {
        entries.value = saved.entries.filter(entry => isObject(entry?.snapshot)
          && typeof entry.summary === 'string').slice(0, 3)
      }
    } catch { /* History is optional when browser storage is unavailable. */ }
  }, { immediate: true, flush: 'sync' })

  function record(snapshot, summary) {
    if (!CONTEXTS.has(toValue(context)) || !isObject(snapshot)) return
    const savedSnapshot = clone(snapshot)
    const key = identity(savedSnapshot)
    entries.value = [
      { snapshot: savedSnapshot, summary: String(summary), timestamp: Date.now() },
      ...entries.value.filter(entry => identity(entry.snapshot) !== key),
    ].slice(0, 3)
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify({ version: 1, entries: entries.value }))
    } catch { /* A storage failure must not interrupt the submitted query. */ }
  }

  return { entries, record }
}
