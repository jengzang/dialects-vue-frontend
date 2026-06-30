// src/i18n/localeDetector.js
// 兼容层：保留已有导出，权威 locale 现由 URL 路由决定

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectBrowserLocale,
  extractLocaleFromPath,
  normalizeLocale,
} from './localeRouting'

const LOCALE_STORAGE_KEY = 'user-locale'

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, detectBrowserLocale }

function isSupportedSavedLocale(locale) {
  if (!locale) {
    return false
  }

  if (Array.isArray(SUPPORTED_LOCALES)) {
    return SUPPORTED_LOCALES.includes(locale)
  }

  return typeof SUPPORTED_LOCALES === 'object' && Boolean(SUPPORTED_LOCALES[locale])
}

export function getSavedLocale() {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY)
  }
  catch (e) {
    console.warn('Failed to read locale from localStorage:', e)
    return null
  }
}

export function saveLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale))
  }
  catch (e) {
    console.warn('Failed to save locale to localStorage:', e)
  }
}

export function resolvePreferredLocale(pathname = '') {
  const routeLocale = extractLocaleFromPath(pathname)
  if (routeLocale) {
    return normalizeLocale(routeLocale)
  }

  const savedLocale = getSavedLocale()
  if (isSupportedSavedLocale(savedLocale)) {
    return savedLocale
  }

  return detectBrowserLocale()
}

export function getCurrentLocale() {
  if (typeof window !== 'undefined') {
    return resolvePreferredLocale(window.location.pathname)
  }

  return detectBrowserLocale()
}
