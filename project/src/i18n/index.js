// src/i18n/index.js
// Vue I18n 配置入口

import { createI18n } from 'vue-i18n'
import { saveLocale } from './localeDetector'
import { FALLBACK_LOCALE, normalizeLocale } from './localeRouting'

// 导入语言包
import zhHant from './locales/zh-Hant'
import zhCN from './locales/zh-CN'
import en from './locales/en'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: FALLBACK_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    'zh-Hant': zhHant,
    'zh-CN': zhCN,
    'en': en
  },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
  warnHtmlMessage: false
})

function applyDocumentLocale(locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale)
  }
}

applyDocumentLocale(FALLBACK_LOCALE)

export function setLocale(locale) {
  const normalizedLocale = normalizeLocale(locale)
  i18n.global.locale.value = normalizedLocale
  saveLocale(normalizedLocale)
  applyDocumentLocale(normalizedLocale)
}

export function getLocale() {
  return i18n.global.locale.value
}

export default i18n
