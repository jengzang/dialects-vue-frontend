/**
 * 浏览器兼容性检测工具
 * 不改动任何现有代码，仅提供检测功能
 */

export const browserFeatures = {
  // 检测backdrop-filter支持
  backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') ||
                  CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),

  // 检测WebGL支持
  webgl: (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch (e) {
      return false
    }
  })(),

  // 检测localStorage可用性
  localStorage: (() => {
    try {
      const test = '__storage_test__'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  })(),

  // 检测MediaRecorder支持
  mediaRecorder: typeof MediaRecorder !== 'undefined',

  // 检测Web Audio API支持
  webAudio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',

  // 检测是否为WeChat浏览器
  isWeChat: /MicroMessenger/i.test(navigator.userAgent),

  // 检测是否为Quark浏览器
  isQuark: /Quark/i.test(navigator.userAgent),

  // 检测position: sticky支持
  positionSticky: CSS.supports('position', 'sticky') || CSS.supports('position', '-webkit-sticky')
}

// 在控制台输出兼容性信息（仅开发环境）
if (import.meta.env.DEV) {
  console.log('Browser Compatibility:', browserFeatures)
}

// 导出检测函数供组件使用（可选）
export function showCompatibilityWarning() {
  const warnings = []

  if (!browserFeatures.backdropFilter) {
    warnings.push('当前浏览器不支持毛玻璃效果，将使用简化样式')
  }

  if (!browserFeatures.webgl) {
    warnings.push('当前浏览器不支持WebGL，地图功能可能受限')
  }

  if (!browserFeatures.localStorage) {
    warnings.push('当前浏览器禁用了本地存储，登录状态可能无法保存')
  }

  if (!browserFeatures.mediaRecorder) {
    warnings.push('当前浏览器不支持录音功能')
  }

  if (browserFeatures.isWeChat || browserFeatures.isQuark) {
    warnings.push('检测到微信/夸克浏览器，部分高级功能可能受限')
  }

  return warnings
}

// 导出便捷检测函数
export function isCompatibleBrowser() {
  return browserFeatures.backdropFilter &&
         browserFeatures.webgl &&
         browserFeatures.localStorage
}

// 导出浏览器信息
export function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    features: browserFeatures,
    isCompatible: isCompatibleBrowser()
  }
}
