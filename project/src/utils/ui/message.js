// src/utils/message.js
// 统一的用户提示系统（替代 alert 和 confirm）
// 支持 i18n 自动翻译

import { ref } from 'vue'
import i18n from '@/i18n'
import { rateLimitNoticeState } from '@/utils/user/rateLimitNotice.js'

// 获取 i18n 的 t 函数
const getTranslate = () => {
  return i18n.global.t
}

/**
 * 检测消息是否为 i18n key
 * @param {string} message
 * @returns {boolean}
 */
function isI18nKey(message) {
  // 检测是否以常见的 i18n key 前缀开头
  return typeof message === 'string' && (
    message.startsWith('messages.') ||
    message.startsWith('common.') ||
    message.startsWith('navigation.') ||
    message.startsWith('auth.') ||
    message.startsWith('query.') ||
    message.startsWith('compare.')
  )
}

/**
 * 翻译消息（如果是 i18n key）
 * @param {string} message
 * @returns {string}
 */
function translateMessage(message) {
  if (isI18nKey(message)) {
    const t = getTranslate()
    return t(message)
  }
  return message
}

function shouldSuppressRateLimitToast(type, message) {
  return (
    type === 'error' &&
    rateLimitNoticeState.visible &&
    typeof message === 'string' &&
    message === rateLimitNoticeState.message
  )
}

// ========================================
// 全局消息状态（Toast）
// ========================================
export const messageState = ref({
    show: false,
    type: 'info',        // 'success' | 'error' | 'warning' | 'info'
    message: '',
    dynamic: null,       // { fn: () => string, interval: number } — 动态刷新模式，fn 返回空串表示终止
    duration: 3000,
    actionText: '',
    dismissText: '',
    onAction: null,
    onDismiss: null,
    timerId: null,
    rateLimitMode: false,
    changelogMode: false,
    positionRight: false
})

// ========================================
// 全局确认对话框状态
// ========================================
export const confirmState = ref({
    show: false,
    title: '確認',
    message: '',
    confirmText: '確定',
    cancelText: '取消'
})

// 确认对话框的 resolve 函数
let confirmResolve = null

/**
 * 解析确认对话框结果
 * @param {boolean} result - 用户选择结果
 */
export function resolveConfirm(result) {
    confirmState.value.show = false
    if (confirmResolve) {
        confirmResolve(result)
        confirmResolve = null
    }
}

// ========================================
// Toast 消息方法
// ========================================

/**
 * 显示成功消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（ms）
 */
export function showSuccess(message, duration = 3000, options = {}) {
    showMessage(message, 'success', duration, options)
}

/**
 * 显示错误消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（ms）
 */
export function showError(message, duration = 5000, options = {}) {
    showMessage(message, 'error', duration, options)
}

/**
 * 显示警告消息
 * @param {string} message - 消息内容
 * @param {{duration: number}} duration - 显示时长（ms）
 */
export function showWarning(message, duration = 4000, options = {}) {
    showMessage(message, 'warning', duration, options)
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（ms）
 */
export function showInfo(message, duration = 3000, options = {}) {
    showMessage(message, 'info', duration, options)
}

/**
 * 显示确认对话框（苹果液态玻璃风格）
 * @param {string} message - 消息内容（支持 i18n key）
 * @param {{cancelText: string, confirmText: string}} options - 配置选项
 * @param {string} options.title - 标题（默认：'確認'，支持 i18n key）
 * @param {string} options.confirmText - 确认按钮文字（默认：'確定'，支持 i18n key）
 * @param {string} options.cancelText - 取消按钮文字（默认：'取消'，支持 i18n key）
 * @returns {Promise<boolean>} - 用户选择（true=确定, false=取消）
 */
export function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const t = getTranslate()
        const {
            confirmText = t('common.button.confirm'),
            cancelText = t('common.button.cancel'),
            title = t('messages.confirm.title')
        } = options

        // 翻译所有文本
        const translatedMessage = translateMessage(message)
        const translatedTitle = translateMessage(title)
        const translatedConfirmText = translateMessage(confirmText)
        const translatedCancelText = translateMessage(cancelText)

        confirmState.value = {
            show: true,
            title: translatedTitle,
            message: translatedMessage,
            confirmText: translatedConfirmText,
            cancelText: translatedCancelText
        }

        confirmResolve = resolve
    })
}

function clearMessageTimer() {
    if (messageState.value.timerId) {
        clearTimeout(messageState.value.timerId)
    }
}

export function hideMessage({ dismissed = false } = {}) {
    clearMessageTimer()
    const onDismiss = messageState.value.onDismiss
    messageState.value = {
        ...messageState.value,
        show: false,
        timerId: null
    }
    if (dismissed && typeof onDismiss === 'function') {
        onDismiss()
    }
}

export function persistMessageUntilDismiss() {
    const hasManualDismiss = Boolean(messageState.value.dismissText || messageState.value.actionText)
    if (!messageState.value.show || !hasManualDismiss) {
        return
    }

    clearMessageTimer()
    messageState.value = {
        ...messageState.value,
        timerId: null
    }
}

export function triggerMessageAction() {
    const onAction = messageState.value.onAction
    hideMessage()
    if (typeof onAction === 'function') {
        onAction()
    }
}

/**
 * 内部方法：显示 Toast 消息
 */
function showMessage(message, type, duration, options = {}) {
    // 自动翻译 i18n key
    const translatedMessage = translateMessage(message)
    const translatedActionText = options.actionText ? translateMessage(options.actionText) : ''
    const translatedDismissText = options.dismissText ? translateMessage(options.dismissText) : ''

    if (shouldSuppressRateLimitToast(type, translatedMessage)) {
        return
    }

    clearMessageTimer()
    const timerId = setTimeout(() => {
        hideMessage()
    }, duration)

    messageState.value = {
        show: true,
        type,
        message: translatedMessage,
        dynamic: options.dynamic || null,
        duration,
        actionText: translatedActionText,
        dismissText: translatedDismissText,
        onAction: typeof options.onAction === 'function' ? options.onAction : null,
        onDismiss: typeof options.onDismiss === 'function' ? options.onDismiss : null,
        timerId,
        rateLimitMode: Boolean(options.rateLimitMode),
        changelogMode: Boolean(options.changelogMode),
        positionRight: Boolean(options.positionRight)
    }
}
