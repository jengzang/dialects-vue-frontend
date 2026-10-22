import { detectRuntimePlatform } from './runtime.js'

const PLATFORM_FULLSCREEN_CLASS = 'is-platform-fullscreen'

function getGlobals(options = {}) {
  return options.globals ?? (typeof window === 'undefined' ? {} : window)
}

function getDocument(options = {}) {
  return options.document ?? (typeof document === 'undefined' ? null : document)
}

function isNativeWebView(options = {}) {
  return detectRuntimePlatform({
    globals: getGlobals(options),
    userAgent: options.userAgent,
  }).container === 'native-webview'
}

function getBrowserFullscreenElement(documentRef) {
  return documentRef?.fullscreenElement ||
    documentRef?.webkitFullscreenElement ||
    documentRef?.mozFullScreenElement ||
    documentRef?.msFullscreenElement ||
    null
}

async function requestBrowserFullscreen(element) {
  const request = element?.requestFullscreen ||
    element?.webkitRequestFullscreen ||
    element?.mozRequestFullScreen ||
    element?.msRequestFullscreen

  if (typeof request === 'function') {
    await request.call(element)
  }
}

async function exitBrowserFullscreen(documentRef) {
  const exit = documentRef?.exitFullscreen ||
    documentRef?.webkitExitFullscreen ||
    documentRef?.mozCancelFullScreen ||
    documentRef?.msExitFullscreen

  if (typeof exit === 'function') {
    await exit.call(documentRef)
  }
}

function createCssFullscreenController() {
  return {
    driver: 'css-fullscreen',
    async enter(element) {
      element?.classList?.add(PLATFORM_FULLSCREEN_CLASS)
      return true
    },
    async exit(element) {
      element?.classList?.remove(PLATFORM_FULLSCREEN_CLASS)
      return false
    },
    async toggle(element) {
      if (this.isFullscreen(element)) {
        return this.exit(element)
      }

      return this.enter(element)
    },
    isFullscreen(element) {
      return Boolean(element?.classList?.contains(PLATFORM_FULLSCREEN_CLASS))
    },
  }
}

function createBrowserFullscreenController(options = {}) {
  const documentRef = getDocument(options)

  return {
    driver: 'browser-fullscreen',
    async enter(element) {
      await requestBrowserFullscreen(element)
      return this.isFullscreen(element)
    },
    async exit(element = getBrowserFullscreenElement(documentRef)) {
      await exitBrowserFullscreen(documentRef)
      return this.isFullscreen(element)
    },
    async toggle(element) {
      if (this.isFullscreen(element)) {
        return this.exit(element)
      }

      return this.enter(element)
    },
    isFullscreen(element) {
      return Boolean(element && getBrowserFullscreenElement(documentRef) === element)
    },
  }
}

export function getPlatformFullscreenController(options = {}) {
  return isNativeWebView(options)
    ? createCssFullscreenController(options)
    : createBrowserFullscreenController(options)
}

export { PLATFORM_FULLSCREEN_CLASS }
