// src/i18n/localeDetector.js
// 兼容层：保留已有导出，权威 locale 现由 URL 路由决定

import {
  FALLBACK_LOCALE as DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectBrowserLocale,
} from './localeRouting'

const LOCALE_STORAGE_KEY = 'user-locale'

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, detectBrowserLocale }

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
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }
  catch (e) {
    console.warn('Failed to save locale to localStorage:', e)
  }
}

export function getCurrentLocale() {
  return detectBrowserLocale()
}
