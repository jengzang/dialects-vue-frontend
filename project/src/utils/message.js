// src/utils/message.js
// 统一的用户提示系统（替代 alert 和 confirm）

import { ref } from 'vue'

// ========================================
// 全局消息状态（Toast）
// ========================================
export const messageState = ref({
    show: false,
    type: 'info',        // 'success' | 'error' | 'warning' | 'info'
    message: '',
    duration: 3000
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
export function showSuccess(message, duration = 3000) {
    showMessage(message, 'success', duration)
}

/**
 * 显示错误消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（ms）
 */
export function showError(message, duration = 5000) {
    showMessage(message, 'error', duration)
}

/**
 * 显示警告消息
 * @param {string} message - 消息内容
 * @param {{duration: number}} duration - 显示时长（ms）
 */
export function showWarning(message, duration = 4000) {
    showMessage(message, 'warning', duration)
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（ms）
 */
export function showInfo(message, duration = 3000) {
    showMessage(message, 'info', duration)
}

/**
 * 显示确认对话框（苹果液态玻璃风格）
 * @param {string} message - 消息内容
 * @param {{cancelText: string, confirmText: string}} options - 配置选项
 * @param {string} options.title - 标题（默认：'確認'）
 * @param {string} options.confirmText - 确认按钮文字（默认：'確定'）
 * @param {string} options.cancelText - 取消按钮文字（默认：'取消'）
 * @returns {Promise<boolean>} - 用户选择（true=确定, false=取消）
 */
export function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const {
            confirmText = '確定',
            cancelText = '取消',
            title = '確認'
        } = options

        confirmState.value = {
            show: true,
            title,
            message,
            confirmText,
            cancelText
        }

        confirmResolve = resolve
    })
}

/**
 * 内部方法：显示 Toast 消息
 */
function showMessage(message, type, duration) {
    messageState.value = {
        show: true,
        type,
        message,
        duration
    }

    // 自动隐藏
    setTimeout(() => {
        messageState.value.show = false
    }, duration)
}

// ========================================
// 向后兼容：挂载到 window（可选）
// ========================================
if (typeof window !== 'undefined') {
    window.showSuccessToast = showSuccess
    window.showErrorToast = showError
    window.showWarningToast = showWarning
    window.showInfoToast = showInfo
    window.showConfirm = showConfirm
}
