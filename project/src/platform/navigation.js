import { getCurrentRuntimePlatform } from './runtime.js'

const ABSOLUTE_URL_RE = /^[a-z][a-z\d+\-.]*:\/\//i
const DEFAULT_APP_WEB_ORIGIN = 'https://dialects.yzup.top'
const APP_WEB_ORIGINS = [DEFAULT_APP_WEB_ORIGIN]
const LOCALE_APP_ROUTE_PREFIXES = new Set(['menu', 'explore', 'auth', 'praat'])
const APP_ROUTE_PREFIXES = new Set([...LOCALE_APP_ROUTE_PREFIXES, 'villagesML'])
const APP_ROUTE_LOCALES = new Set(['zh-CN', 'zh-Hant', 'en'])

function getCurrentOrigin() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location?.origin || ''
}

function defaultOpenExternal(url) {
  if (typeof window === 'undefined' || typeof window.open !== 'function') {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function isRouteObject(target) {
  return Boolean(target && typeof target === 'object')
}

function isAbsoluteUrl(target) {
  return typeof target === 'string' && ABSOLUTE_URL_RE.test(target)
}

function resolveUrl(target, currentOrigin) {
  try {
    return new URL(target, currentOrigin || getCurrentOrigin() || undefined)
  } catch {
    return null
  }
}

function isAppRoutePath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return false
  }

  const pathname = path.split(/[?#]/, 1)[0] || '/'
  if (pathname === '/') {
    return true
  }

  const segments = pathname.split('/').filter(Boolean)
  const [firstSegment, secondSegment] = segments

  if (APP_ROUTE_LOCALES.has(firstSegment)) {
    return segments.length === 1 || LOCALE_APP_ROUTE_PREFIXES.has(secondSegment)
  }

  return APP_ROUTE_PREFIXES.has(firstSegment)
}

function getAppOrigins(currentOrigin, configuredOrigins = []) {
  return new Set([
    currentOrigin,
    ...APP_WEB_ORIGINS,
    ...configuredOrigins,
  ].filter(Boolean))
}

function resolveExternalNavigationTarget(target, options = {}) {
  if (typeof target !== 'string') {
    return null
  }

  if (target.startsWith('/') && !target.startsWith('//')) {
    return `${options.webOrigin || DEFAULT_APP_WEB_ORIGIN}${target}`
  }

  return target
}

export function resolveInternalNavigationTarget(target, options = {}) {
  if (isRouteObject(target)) {
    return target
  }

  if (typeof target !== 'string' || target.length === 0) {
    return null
  }

  if (isAppRoutePath(target)) {
    return target
  }

  if (target.startsWith('/') || target.startsWith('//')) {
    return null
  }

  if (!isAbsoluteUrl(target)) {
    return target
  }

  const currentOrigin = options.currentOrigin || getCurrentOrigin()
  const resolved = resolveUrl(target, currentOrigin)
  const appOrigins = getAppOrigins(currentOrigin, options.appOrigins)

  if (resolved && appOrigins.has(resolved.origin) && isAppRoutePath(resolved.pathname)) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  }

  return null
}

export function isInternalAppNavigationTarget(target, options = {}) {
  return resolveInternalNavigationTarget(target, options) !== null
}

export async function navigatePlatformLink(router, target, options = {}) {
  const runtime = options.runtime || getCurrentRuntimePlatform()
  if (options.external && options.reload && runtime.container !== 'native-webview' && typeof target === 'string') {
    const location = options.location ?? (typeof window === 'undefined' ? null : window.location)
    if (location) {
      location.href = target.startsWith('/') ? `${options.webOrigin ?? ''}${target}` : target
    }
    return
  }

  const internalTarget = resolveInternalNavigationTarget(target, options)

  if (internalTarget !== null) {
    const method = options.replace ? 'replace' : 'push'
    return router?.[method]?.(internalTarget)
  }

  if (typeof target === 'string') {
    const openExternal = options.openExternal || defaultOpenExternal
    return openExternal(resolveExternalNavigationTarget(target, options))
  }

  return undefined
}
