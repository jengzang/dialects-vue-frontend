// src/i18n/index.js
// Vue I18n 配置入口

import { createI18n } from 'vue-i18n'
import { getCurrentLocale, saveLocale } from './localeDetector'
import { normalizeLocale } from './localeRouting'

// 导入语言包
import zhHant from './locales/zh-Hant'

const localeLoaders = {
  'zh-CN': () => import('./locales/zh-CN'),
  en: () => import('./locales/en')
}
const pendingLocales = new Map()
let localeSequence = 0

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,                    // 使用 Composition API 模式
  locale: getCurrentLocale(),       // 当前语言
  fallbackLocale: 'zh-Hant',        // 回退语言
  messages: {
    'zh-Hant': zhHant
  },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
  warnHtmlMessage: false
})

// 初始化时同步设置 HTML lang 属性，确保 :lang() CSS 选择器生效
if (typeof document !== 'undefined') {
  document.querySelector('html').setAttribute('lang', getCurrentLocale())
}

/**
 * 按需加载语言包
 * @param {string} locale - 语言代码
 */
export async function loadLocaleMessages(locale) {
  locale = normalizeLocale(locale)
  if (i18n.global.availableLocales.includes(locale)) return
  if (!pendingLocales.has(locale)) {
    pendingLocales.set(locale, localeLoaders[locale]().then(module => {
      i18n.global.setLocaleMessage(locale, module.default)
    }).finally(() => pendingLocales.delete(locale)))
  }
  await pendingLocales.get(locale)
}

// 只有最后一次切换可以更新当前语言和用户偏好。
export async function setLocale(locale, { persist = true } = {}) {
  locale = normalizeLocale(locale)
  const sequence = ++localeSequence
  await loadLocaleMessages(locale)
  if (sequence !== localeSequence) return false
  i18n.global.locale.value = locale
  if (persist) saveLocale(locale)

  // 更新 HTML lang 属性
  if (typeof document !== 'undefined') {
    document.querySelector('html').setAttribute('lang', locale)
  }
  return true
}

/**
 * 获取当前语言
 * @returns {string}
 */
export function getLocale() {
  return i18n.global.locale.value
}

export default i18n
