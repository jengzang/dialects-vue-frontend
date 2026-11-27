import { getCurrentRuntimePlatform } from './runtime.js'
import { DialectsNative } from './nativeBridge.js'

function layerState(element) {
  if (!element?.isConnected) return null
  let zIndex = 0
  for (let current = element; current; current = current.parentElement) {
    const style = getComputedStyle(current)
    if (style.display === 'none' || style.visibility === 'hidden') return null
    zIndex = Math.max(zIndex, Number.parseInt(style.zIndex, 10) || 0)
  }
  return zIndex
}

export function createNativeBackRegistry(onChanged = () => {}) {
  const entries = new Map()
  let sequence = 0
  const visible = () => [...entries.values()]
    .map(entry => ({ ...entry, layer: layerState(entry.element) }))
    .filter(entry => entry.layer !== null)
    .sort((a, b) => a.layer - b.layer || a.order - b.order)
  return {
    add(element, close) {
      const key = Symbol()
      entries.set(key, { element, close, order: ++sequence })
      onChanged()
      return () => { entries.delete(key); onChanged() }
    },
    hasOverlay() { return visible().length > 0 },
    closeTop() {
      const top = visible().at(-1)
      if (!top) return false
      top.close()
      return true
    },
    sync: onChanged,
  }
}

let lastBlocked
function syncNativeBackState() {
  if (getCurrentRuntimePlatform().container !== 'native-webview') return
  const blocked = nativeBackRegistry.hasOverlay()
  if (blocked === lastBlocked) return
  lastBlocked = blocked
  DialectsNative.setBackBlocked({ blocked }).catch(console.error)
}
export const nativeBackRegistry = createNativeBackRegistry(() => queueMicrotask(syncNativeBackState))

const registrations = new WeakMap()
function updateRegistration(element, binding) {
  if (getCurrentRuntimePlatform().container !== 'native-webview') return
  let state = registrations.get(element)
  if (typeof binding.value !== 'function') {
    state?.remove()
    registrations.delete(element)
  } else if (state) {
    state.close = binding.value
  } else {
    state = { close: binding.value }
    state.remove = nativeBackRegistry.add(element, () => state.close())
    registrations.set(element, state)
  }
  nativeBackRegistry.sync()
}
export const vNativeBack = {
  mounted: updateRegistration,
  updated: updateRegistration,
  beforeUnmount(element) {
    registrations.get(element)?.remove()
    registrations.delete(element)
  },
}

export function initializeNativeBackPriority(globals = window) {
  if (getCurrentRuntimePlatform().container !== 'native-webview') return () => {}
  globals.__dialectsHandleBack = () => nativeBackRegistry.closeTop()
  syncNativeBackState()
  return () => { delete globals.__dialectsHandleBack }
}

export function trackNativeMapPopup(popup) {
  if (getCurrentRuntimePlatform().container !== 'native-webview') return popup
  let remove = () => {}
  popup.on('open', () => {
    remove()
    remove = nativeBackRegistry.add(popup.getElement(), () => popup.remove())
  })
  popup.on('close', () => { remove(); remove = () => {} })
  return popup
}
