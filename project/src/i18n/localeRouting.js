const SUPPORTED_LOCALES = ['zh-CN', 'zh-Hant', 'en']
const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALES)
const FALLBACK_LOCALE = 'zh-Hant'
const DEFAULT_LOCALE = FALLBACK_LOCALE
const LOCALE_ROUTE_PATTERN = /^\/(zh-CN|zh-Hant|en)(?=\/|$)/
const MAIN_ENTRY_PREFIXES = ['/', '/menu', '/explore', '/auth']

export { SUPPORTED_LOCALES, SUPPORTED_LOCALE_SET, FALLBACK_LOCALE, DEFAULT_LOCALE }

export function isSupportedLocale(locale) {
  return typeof locale === 'string' && SUPPORTED_LOCALE_SET.has(locale)
}

export function normalizeLocale(locale) {
  if (isSupportedLocale(locale)) {
    return locale
  }

  if (typeof locale !== 'string') {
    return FALLBACK_LOCALE
  }

  const normalized = locale.toLowerCase()

  if (
    normalized === 'zh-hant' ||
    normalized.startsWith('zh-hant-') ||
    normalized === 'zh-tw' ||
    normalized === 'zh-hk' ||
    normalized === 'zh-mo'
  ) {
    return 'zh-Hant'
  }

  if (
    normalized === 'zh-hans' ||
    normalized.startsWith('zh-hans-') ||
    normalized === 'zh-cn' ||
    normalized === 'zh-sg'
  ) {
    return 'zh-CN'
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en'
  }

  return FALLBACK_LOCALE
}

export function detectBrowserLocale() {
  if (typeof navigator === 'undefined') {
    return FALLBACK_LOCALE
  }

  const languages = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]

  for (const candidate of languages) {
    const normalized = normalizeLocale(candidate)
    if (isSupportedLocale(normalized)) {
      return normalized
    }
  }

  return FALLBACK_LOCALE
}

export function extractLocaleFromPath(path = '/') {
  const match = LOCALE_ROUTE_PATTERN.exec(path || '/')
  return match ? match[1] : null
}

export function stripLocaleFromPath(path = '/') {
  const rawPath = typeof path === 'string' && path.length > 0 ? path : '/'
  const stripped = rawPath.replace(LOCALE_ROUTE_PATTERN, '')
  return stripped || '/'
}

export function ensureLeadingSlash(path = '/') {
  if (!path) {
    return '/'
  }

  return path.startsWith('/') ? path : `/${path}`
}

export function buildLocalePath(locale, path = '/') {
  const normalizedLocale = normalizeLocale(locale)
  const strippedPath = stripLocaleFromPath(ensureLeadingSlash(path))

  if (strippedPath === '/') {
    return `/${normalizedLocale}`
  }

  return `/${normalizedLocale}${strippedPath}`
}

export function localizePath(path, locale) {
  return buildLocalePath(locale, path)
}

export function shouldRedirectMainEntry(path = '/') {
  const normalizedPath = stripLocaleFromPath(ensureLeadingSlash(path))

  if (extractLocaleFromPath(path)) {
    return false
  }

  return MAIN_ENTRY_PREFIXES.some((prefix) => {
    if (prefix === '/') {
      return normalizedPath === '/'
    }

    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  })
}

export function buildLocaleRedirectTarget({ pathname = '/', search = '', hash = '', locale } = {}) {
  const targetLocale = normalizeLocale(locale || detectBrowserLocale())
  const localizedPath = buildLocalePath(targetLocale, pathname)
  return `${localizedPath}${search || ''}${hash || ''}`
}

const LOCALE_STORAGE_KEY = 'user-locale'

function getSavedLocale() {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null
  } catch {
    return null
  }
}

export function resolveRouteLocale(routeLike) {
  const localeFromParams = routeLike?.params?.locale
  if (isSupportedLocale(localeFromParams)) {
    return localeFromParams
  }

  const path = routeLike?.path || routeLike?.fullPath || '/'
  const fromPath = extractLocaleFromPath(path)
  if (fromPath) {
    return normalizeLocale(fromPath)
  }

  const saved = getSavedLocale()
  if (isSupportedLocale(saved)) {
    return saved
  }

  return FALLBACK_LOCALE
}
