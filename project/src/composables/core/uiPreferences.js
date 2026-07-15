const UI_MODE_STORAGE_KEY = 'dialects-ui-mode'
const COLOR_THEME_STORAGE_KEY = 'dialects-color-theme'

export const UI_MODE_DEFAULT = 'default'
export const UI_MODE_COMPACT = 'compact'

export const COLOR_THEME_BLUE = 'blue'
export const COLOR_THEME_LIGHT = 'light'
export const COLOR_THEME_DARK = 'dark'
export const COLOR_THEME_GREEN = 'green'
export const COLOR_THEME_DEFAULT = COLOR_THEME_BLUE

const VALID_UI_MODES = new Set([UI_MODE_DEFAULT, UI_MODE_COMPACT])
const VALID_COLOR_THEMES = new Set([COLOR_THEME_BLUE, COLOR_THEME_LIGHT, COLOR_THEME_DARK, COLOR_THEME_GREEN])

function normalizeInterfaceMode(mode) {
  return VALID_UI_MODES.has(mode) ? mode : UI_MODE_DEFAULT
}

function normalizeColorTheme(theme) {
  return VALID_COLOR_THEMES.has(theme) ? theme : COLOR_THEME_DEFAULT
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

export function getStoredColorTheme() {
  if (typeof window === 'undefined') {
    return COLOR_THEME_DEFAULT
  }

  try {
    return normalizeColorTheme(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY))
  } catch (error) {
    console.warn('Failed to read color theme from localStorage:', error)
    return COLOR_THEME_DEFAULT
  }
}

export function applyColorTheme(theme) {
  if (typeof document === 'undefined') {
    return normalizeColorTheme(theme)
  }

  const normalizedTheme = normalizeColorTheme(theme)
  document.documentElement.dataset.colorTheme = normalizedTheme
  return normalizedTheme
}

export function setStoredColorTheme(theme) {
  if (typeof window === 'undefined') {
    return normalizeColorTheme(theme)
  }

  const normalizedTheme = normalizeColorTheme(theme)

  try {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, normalizedTheme)
  } catch (error) {
    console.warn('Failed to save color theme to localStorage:', error)
  }

  return normalizedTheme
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

export function initializeColorTheme() {
  const theme = getStoredColorTheme()
  return applyColorTheme(theme)
}

export function initializeUiPreferences() {
  return {
    interfaceMode: initializeInterfaceMode(),
    colorTheme: initializeColorTheme(),
  }
}

export function setInterfaceMode(mode) {
  const normalizedMode = setStoredInterfaceMode(mode)
  return applyInterfaceMode(normalizedMode)
}

export function setColorTheme(theme) {
  const normalizedTheme = setStoredColorTheme(theme)
  return applyColorTheme(normalizedTheme)
}
