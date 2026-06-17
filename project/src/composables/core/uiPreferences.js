const UI_MODE_STORAGE_KEY = 'dialects-ui-mode'
export const UI_MODE_DEFAULT = 'default'
export const UI_MODE_COMPACT = 'compact'

const VALID_UI_MODES = new Set([UI_MODE_DEFAULT, UI_MODE_COMPACT])

function normalizeInterfaceMode(mode) {
  return VALID_UI_MODES.has(mode) ? mode : UI_MODE_DEFAULT
}

export function getStoredInterfaceMode() {
  if (typeof window === 'undefined') {
    return UI_MODE_DEFAULT
  }

  try {
    return normalizeInterfaceMode(window.localStorage.getItem(UI_MODE_STORAGE_KEY))
  } catch (error) {
    console.warn('Failed to read UI mode from localStorage:', error)
    return UI_MODE_DEFAULT
  }
}

export function applyInterfaceMode(mode) {
  if (typeof document === 'undefined') {
    return normalizeInterfaceMode(mode)
  }

  const normalizedMode = normalizeInterfaceMode(mode)
  document.documentElement.dataset.uiMode = normalizedMode
  return normalizedMode
}

export function setStoredInterfaceMode(mode) {
  if (typeof window === 'undefined') {
    return normalizeInterfaceMode(mode)
  }

  const normalizedMode = normalizeInterfaceMode(mode)

  try {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, normalizedMode)
  } catch (error) {
    console.warn('Failed to save UI mode to localStorage:', error)
  }

  return normalizedMode
}

export function initializeInterfaceMode() {
  const mode = getStoredInterfaceMode()
  return applyInterfaceMode(mode)
}

export function setInterfaceMode(mode) {
  const normalizedMode = setStoredInterfaceMode(mode)
  return applyInterfaceMode(normalizedMode)
}
