import { ref } from 'vue'

const UI_MODE_STORAGE_KEY = 'dialects-ui-mode'
const COLOR_THEME_STORAGE_KEY = 'dialects-color-theme'
const COLOR_MODE_STORAGE_KEY = 'dialects-color-mode'
const ICON_MODE_STORAGE_KEY = 'dialects-icon-mode'

export const ICON_MODE_ALL_EMOJI = 'all-emoji'
export const ICON_MODE_ALL_SVG = 'all-svg'
export const ICON_MODE_BAR_SVG = 'bar-svg'
export const ICON_MODE_DEFAULT = ICON_MODE_BAR_SVG

const VALID_ICON_MODES = new Set([ICON_MODE_ALL_EMOJI, ICON_MODE_ALL_SVG, ICON_MODE_BAR_SVG])

export const UI_MODE_DEFAULT = 'default'
export const UI_MODE_COMPACT = 'compact'

export const COLOR_THEME_BLUE_LIGHT = 'blue-light'
export const COLOR_THEME_RED_LIGHT = 'red-light'
export const COLOR_THEME_GREEN_LIGHT = 'green-light'
export const COLOR_THEME_BLUE_DARK = 'blue-dark'
export const COLOR_THEME_RED_DARK = 'red-dark'
export const COLOR_THEME_GREEN_DARK = 'green-dark'
export const COLOR_THEME_DEFAULT = COLOR_THEME_BLUE_LIGHT

const VALID_UI_MODES = new Set([UI_MODE_DEFAULT, UI_MODE_COMPACT])
const COLOR_THEME_PARTS = {
  [COLOR_THEME_BLUE_LIGHT]: { family: 'blue', mode: 'light' },
  [COLOR_THEME_RED_LIGHT]: { family: 'red', mode: 'light' },
  [COLOR_THEME_GREEN_LIGHT]: { family: 'green', mode: 'light' },
  [COLOR_THEME_BLUE_DARK]: { family: 'blue', mode: 'dark' },
  [COLOR_THEME_RED_DARK]: { family: 'red', mode: 'dark' },
  [COLOR_THEME_GREEN_DARK]: { family: 'green', mode: 'dark' },
}
const VALID_COLOR_THEMES = new Set(Object.keys(COLOR_THEME_PARTS))
const LEGACY_COLOR_THEMES = {
  blue: COLOR_THEME_BLUE_LIGHT,
  light: COLOR_THEME_RED_LIGHT,
  dark: COLOR_THEME_BLUE_DARK,
  green: COLOR_THEME_GREEN_DARK,
}
const VALID_COLOR_MODES = new Set(['light', 'dark', 'system'])
let systemColorMedia

export const currentColorMode = ref(getStoredColorMode())
export const currentColorTheme = ref(getStoredColorTheme())
export const currentInterfaceMode = ref(getStoredInterfaceMode())
export const currentIconMode = ref(getStoredIconMode())

function normalizeInterfaceMode(mode) {
  return VALID_UI_MODES.has(mode) ? mode : UI_MODE_DEFAULT
}

function normalizeColorTheme(theme) {
  const normalized = Object.hasOwn(LEGACY_COLOR_THEMES, theme) ? LEGACY_COLOR_THEMES[theme] : theme
  return VALID_COLOR_THEMES.has(normalized) ? normalized : COLOR_THEME_DEFAULT
}

export function getColorThemeParts(theme) {
  return { ...COLOR_THEME_PARTS[normalizeColorTheme(theme)] }
}

export function getColorThemeFor(family, mode) {
  const selectedFamily = ['blue', 'red', 'green'].includes(family) ? family : 'blue'
  const selectedMode = mode === 'dark' ? 'dark' : 'light'
  return Object.keys(COLOR_THEME_PARTS).find(theme => (
    COLOR_THEME_PARTS[theme].family === selectedFamily && COLOR_THEME_PARTS[theme].mode === selectedMode
  ))
}

export function isDarkColorTheme(theme) {
  return getColorThemeParts(theme).mode === 'dark'
}

export function getBrandAssets(theme) {
  const normalizedTheme = normalizeColorTheme(theme)
  if (normalizedTheme === COLOR_THEME_GREEN_LIGHT) {
    return {
      logo: '/brand/favicon_green.ico',
      title: '/brand/title.webp',
      decoration: '/brand/GreenCircle.webp',
    }
  }
  if (normalizedTheme === COLOR_THEME_BLUE_DARK) {
    return {
      logo: '/brand/theme-previews/favicon-blue-dark.png',
      title: '/brand/theme-previews/title-dark.png',
      decoration: '/brand/theme-previews/circle-blue-dark.webp',
    }
  }
  // Existing asset filenames are independent of the canonical theme identifiers.
  const assetName = {
    [COLOR_THEME_BLUE_LIGHT]: 'blue',
    [COLOR_THEME_RED_LIGHT]: 'light',
    [COLOR_THEME_RED_DARK]: 'light',
    [COLOR_THEME_GREEN_DARK]: 'green',
  }[normalizedTheme]
  return {
    logo: `/brand/theme-previews/favicon-${assetName}.png`,
    title: normalizedTheme === COLOR_THEME_RED_DARK ? '/brand/theme-previews/title-red-dark.png' : normalizedTheme === COLOR_THEME_BLUE_LIGHT ? '/brand/title.webp' : `/brand/theme-previews/title-${assetName}.png`,
    decoration: normalizedTheme === COLOR_THEME_BLUE_LIGHT ? '/brand/BlueCircle.webp' : `/brand/theme-previews/logo-${assetName}.png`,
  }
}

function normalizeIconMode(mode) {
  return VALID_ICON_MODES.has(mode) ? mode : ICON_MODE_DEFAULT
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
  currentInterfaceMode.value = normalizedMode
  document.documentElement.dataset.uiMode = normalizedMode
  return normalizedMode
}

export function getStoredColorTheme() {
  const stored = readColorPreference(COLOR_THEME_STORAGE_KEY)
  return getColorThemeFor(getColorThemeParts(stored).family, resolveColorMode(getStoredColorMode()))
}

function readColorPreference(key) {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    console.warn('Failed to read color preference from localStorage:', error)
    return null
  }
}

function hasStoredColorTheme(theme) {
  return VALID_COLOR_THEMES.has(theme) || Object.hasOwn(LEGACY_COLOR_THEMES, theme)
}

export function getStoredColorMode() {
  const mode = readColorPreference(COLOR_MODE_STORAGE_KEY)
  if (VALID_COLOR_MODES.has(mode)) return mode
  const theme = readColorPreference(COLOR_THEME_STORAGE_KEY)
  // Old palettes encode a deliberate brightness choice. Keep it even if it
  // was saved automatically by the old initialization; its origin is unknown.
  return hasStoredColorTheme(theme) ? getColorThemeParts(theme).mode : 'system'
}

function resolveColorMode(mode) {
  if (mode !== 'system') return mode
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function handleSystemColorChange() {
  if (currentColorMode.value !== 'system') return
  const theme = getColorThemeFor(getColorThemeParts(currentColorTheme.value).family, resolveColorMode('system'))
  currentColorTheme.value = theme
  applyColorTheme(theme)
}

export function applyColorTheme(theme) {
  if (typeof document === 'undefined') {
    return normalizeColorTheme(theme)
  }

  const normalizedTheme = normalizeColorTheme(theme)
  document.documentElement.dataset.colorTheme = normalizedTheme
  const { family, mode } = getColorThemeParts(normalizedTheme)
  document.documentElement.dataset.colorFamily = family
  document.documentElement.dataset.colorMode = mode
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
  // Normalize existing identifiers without turning a first visit into a saved choice.
  const stored = readColorPreference(COLOR_THEME_STORAGE_KEY)
  currentColorMode.value = getStoredColorMode()
  if (hasStoredColorTheme(stored)) setStoredColorTheme(stored)
  const theme = getStoredColorTheme()
  currentColorTheme.value = theme
  if (systemColorMedia?.removeEventListener) systemColorMedia.removeEventListener('change', handleSystemColorChange)
  else systemColorMedia?.removeListener?.(handleSystemColorChange)
  systemColorMedia = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null
  if (systemColorMedia?.addEventListener) systemColorMedia.addEventListener('change', handleSystemColorChange)
  else systemColorMedia?.addListener?.(handleSystemColorChange)
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
  const { family, mode } = getColorThemeParts(theme)
  return saveColorSelection(family, mode)
}

function saveColorSelection(family, mode) {
  currentColorMode.value = mode
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode)
    } catch (error) {
      console.warn('Failed to save color mode to localStorage:', error)
    }
  }
  const normalizedTheme = setStoredColorTheme(getColorThemeFor(family, resolveColorMode(mode)))
  currentColorTheme.value = normalizedTheme
  return applyColorTheme(normalizedTheme)
}

export function setColorFamily(family) {
  return saveColorSelection(family, currentColorMode.value)
}

export function setColorMode(mode) {
  return saveColorSelection(getColorThemeParts(currentColorTheme.value).family, VALID_COLOR_MODES.has(mode) ? mode : 'system')
}

export function getStoredIconMode() {
  if (typeof window === 'undefined') {
    return ICON_MODE_DEFAULT
  }

  try {
    return normalizeIconMode(window.localStorage.getItem(ICON_MODE_STORAGE_KEY))
  } catch (error) {
    console.warn('Failed to read icon mode from localStorage:', error)
    return ICON_MODE_DEFAULT
  }
}

export function setStoredIconMode(mode) {
  if (typeof window === 'undefined') {
    return normalizeIconMode(mode)
  }

  const normalizedMode = normalizeIconMode(mode)

  try {
    window.localStorage.setItem(ICON_MODE_STORAGE_KEY, normalizedMode)
  } catch (error) {
    console.warn('Failed to save icon mode to localStorage:', error)
  }

  return normalizedMode
}

export function setIconMode(mode) {
  const normalizedMode = setStoredIconMode(mode)
  currentIconMode.value = normalizedMode
  return normalizedMode
}
