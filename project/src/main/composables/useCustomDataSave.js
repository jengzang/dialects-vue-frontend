import { ref, computed, readonly, getCurrentInstance, onMounted, onBeforeUnmount, inject, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
export const CUSTOM_DATA_SAVE_SCOPE = Symbol('custom-data-save-scope')
const RECEIPT_WINDOW = 24 * 60 * 60 * 1000
const clone = value => JSON.parse(JSON.stringify(value))
function freeze(value) {
  Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child) })
  return Object.freeze(value)
}
export function useCustomDataSave(send, { leaveMessage = () => 'This save is unresolved. Leaving loses its confirmation key.' } = {}) {
  const status = ref('idle'), error = ref(null), result = ref(null)
  let snapshot = null, startedAt = 0
  const isSaving = computed(() => status.value === 'saving')
  const locked = computed(() => isSaving.value || status.value === 'unknown')
  if (getCurrentInstance()) {
    const scope = inject(CUSTOM_DATA_SAVE_SCOPE, null)
    const token = Symbol('save-owner')
    if (scope) {
      watch(locked, value => value ? scope.add(token) : scope.delete(token), {flush:'sync',immediate:true})
      onBeforeUnmount(() => scope.delete(token))
    }
    const preventUnload = event => { if (locked.value) { event.preventDefault(); event.returnValue = '' } }
    onMounted(() => window.addEventListener('beforeunload', preventUnload))
    onBeforeUnmount(() => window.removeEventListener('beforeunload', preventUnload))
    onBeforeRouteLeave(() => isSaving.value ? false : !locked.value || window.confirm(leaveMessage()))
  }
  async function save(body, { confirm } = {}) {
    if (isSaving.value || status.value === 'succeeded') return null
    const retry = status.value === 'unknown'
    if (retry && Date.now() - startedAt >= RECEIPT_WINDOW) {
      error.value = { detail: { code: 'receipt_expired' } }
      return null
    }
    if (!retry) {
      snapshot = freeze(clone({ ...body, request_id: crypto.randomUUID() }))
      startedAt = Date.now()
    }
    status.value = 'saving'
    error.value = null
    try {
      if (!retry && confirm && await confirm() === false) { status.value = 'idle'; return null }
      result.value = await send(snapshot)
      status.value = 'succeeded'
      return result.value
    } catch (cause) {
      error.value = cause
      status.value = retry || !cause.status || cause.status >= 500 || cause.kind === 'network' || cause.kind === 'timeout' ? 'unknown' : 'failed'
      return null
    }
  }
  function prepareMerge() {
    if (isSaving.value || snapshot?.creates?.length) return false
    status.value = 'failed'
    return true
  }
  function reset() {
    if (locked.value) return false
    status.value = 'idle'; error.value = null; result.value = null; snapshot = null
    return true
  }
  return { status: readonly(status), error: readonly(error), result: readonly(result), isSaving, locked, save, reset, prepareMerge, getSnapshot: () => snapshot }
}
