// src/i18n/index.js
// Vue I18n 配置入口

import { createI18n } from 'vue-i18n'
import { getCurrentLocale, saveLocale } from './localeDetector'

// 导入语言包
import zhHant from './locales/zh-Hant'
import zhCN from './locales/zh-CN'
import en from './locales/en'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,                    // 使用 Composition API 模式
  locale: getCurrentLocale(),       // 当前语言
  fallbackLocale: 'zh-Hant',        // 回退语言
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

// 初始化时同步设置 HTML lang 属性，确保 :lang() CSS 选择器生效
if (typeof document !== 'undefined') {
  document.querySelector('html').setAttribute('lang', getCurrentLocale())
}

/**
 * 切换语言
 * @param {string} locale - 语言代码
 */
export function setLocale(locale) {
  i18n.global.locale.value = locale
  saveLocale(locale)

  // 更新 HTML lang 属性
  if (typeof document !== 'undefined') {
    document.querySelector('html').setAttribute('lang', locale)
  }
}

/**
 * 获取当前语言
 * @returns {string}
 */
export function getLocale() {
  return i18n.global.locale.value
}

export default i18n
