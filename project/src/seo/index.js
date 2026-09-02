import SEO_CONFIG, { NOINDEX_PATHS } from './config.js'
import {
  SUPPORTED_LOCALES,
  buildLocalePath,
  extractLocaleFromPath,
  normalizeLocale as normalizeRouteLocale,
  stripLocaleFromPath,
} from '@/i18n/localeRouting.js'

const DEFAULT_OG_IMAGE = '/brand/title.webp'
const DEFAULT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '方音圖鑑',
  alternateName: 'Dialects Atlas',
  url: 'https://dialects.yzup.top/',
}

function getJsonLdType(path) {
  const normalizedPath = stripLocaleFromPath(path)
  if (normalizedPath === '/') return 'WebSite'
  if (normalizedPath === '/menu/source') return 'CollectionPage'
  if (normalizedPath === '/menu/privacy') return 'WebPage'
  if (normalizedPath.startsWith('/menu/query/') || normalizedPath.startsWith('/menu/compare/') || normalizedPath.startsWith('/menu/pho/')) {
    return 'SoftwareApplication'
  }
  if (normalizedPath.startsWith('/explore/villages/')) return 'Dataset'
  return 'WebPage'
}

function normalizeLocale(locale) {
  if (!locale) return SEO_CONFIG.defaultLocale
  if (SEO_CONFIG.siteNameLocales[locale]) return locale
  if (locale.startsWith('zh')) {
    if (locale.includes('Hans') || locale.includes('CN')) return 'zh-CN'
    return 'zh-Hant'
  }
  if (locale.startsWith('en')) return 'en'
  return SEO_CONFIG.defaultLocale
}

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    document.head.appendChild(element)
  }
  return element
}

function ensureCanonical() {
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  return canonical
}


function ensureAlternateLink(hreflang) {
  let link = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', hreflang)
    document.head.appendChild(link)
  }
  return link
}

function updateHreflangLinks(pathname) {
  const origin = SEO_CONFIG.siteOrigin || window.location.origin
  const normalizedPath = normalizePathname(pathname)

  for (const locale of SUPPORTED_LOCALES) {
    const href = `${origin}${buildLocalePath(locale, normalizedPath)}`
    ensureAlternateLink(locale).setAttribute('href', href)
  }

  ensureAlternateLink('x-default').setAttribute('href', `${origin}${buildLocalePath(SEO_CONFIG.defaultLocale, normalizedPath)}`)
}
function ensureJsonLd() {
  let script = document.head.querySelector('script[data-hermes-seo="jsonld"]')
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-hermes-seo', 'jsonld')
    document.head.appendChild(script)
  }
  return script
}

function pickLocalizedValue(values, locale) {
  if (!values) return ''
  return values[locale] || values[SEO_CONFIG.defaultLocale] || Object.values(values)[0] || ''
}

function getRouteSeo(pathname) {
  const normalizedPath = normalizePathname(pathname)
  return SEO_CONFIG.routes[normalizedPath] || null
}

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  const localeStripped = stripLocaleFromPath(pathname)
  return localeStripped.endsWith('/') ? localeStripped.slice(0, -1) || '/' : localeStripped
}

function getCanonicalUrl(pathname, locale) {
  const origin = SEO_CONFIG.siteOrigin || window.location.origin
  const normalizedPath = normalizePathname(pathname)
  const localizedPath = buildLocalePath(locale, normalizedPath)
  return `${origin}${localizedPath}`
}

function getOgImageUrl() {
  const origin = SEO_CONFIG.siteOrigin || window.location.origin
  return `${origin}${DEFAULT_OG_IMAGE}`
}

export function updateSeo({ path, locale }) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  const normalizedLocale = normalizeRouteLocale(locale)
  const normalizedPath = normalizePathname(path)
  const routeSeo = getRouteSeo(normalizedPath)

  const title = routeSeo
    ? pickLocalizedValue(routeSeo.title, normalizedLocale)
    : pickLocalizedValue(SEO_CONFIG.defaultTitle, normalizedLocale)
  const description = routeSeo
    ? pickLocalizedValue(routeSeo.description, normalizedLocale)
    : pickLocalizedValue(SEO_CONFIG.defaultDescription, normalizedLocale)
  const siteName = pickLocalizedValue(SEO_CONFIG.siteNameLocales, normalizedLocale)
  const canonicalUrl = getCanonicalUrl(normalizedPath, normalizedLocale)
  const shouldNoindex = NOINDEX_PATHS.has(normalizedPath)
  const ogImageUrl = getOgImageUrl()
  const jsonLdType = getJsonLdType(normalizedPath)

  document.title = title

  const descriptionMeta = ensureMeta('meta[name="description"]', { name: 'description' })
  descriptionMeta.setAttribute('content', description)

  const robotsMeta = ensureMeta('meta[name="robots"]', { name: 'robots' })
  robotsMeta.setAttribute('content', shouldNoindex ? 'noindex,nofollow' : 'index,follow')

  const ogTitle = ensureMeta('meta[property="og:title"]', { property: 'og:title' })
  ogTitle.setAttribute('content', title)

  const ogDescription = ensureMeta('meta[property="og:description"]', { property: 'og:description' })
  ogDescription.setAttribute('content', description)

  const ogType = ensureMeta('meta[property="og:type"]', { property: 'og:type' })
  ogType.setAttribute('content', 'website')

  const ogUrl = ensureMeta('meta[property="og:url"]', { property: 'og:url' })
  ogUrl.setAttribute('content', canonicalUrl)

  const ogSiteName = ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name' })
  ogSiteName.setAttribute('content', siteName)

  const ogImage = ensureMeta('meta[property="og:image"]', { property: 'og:image' })
  ogImage.setAttribute('content', ogImageUrl)

  const twitterCard = ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' })
  twitterCard.setAttribute('content', 'summary')

  const twitterTitle = ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title' })
  twitterTitle.setAttribute('content', title)

  const twitterDescription = ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description' })
  twitterDescription.setAttribute('content', description)

  const twitterImage = ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image' })
  twitterImage.setAttribute('content', ogImageUrl)

  ensureCanonical().setAttribute('href', canonicalUrl)
  updateHreflangLinks(normalizedPath)

  const jsonLdScript = ensureJsonLd()
  jsonLdScript.textContent = JSON.stringify({
    ...DEFAULT_JSON_LD,
    '@type': jsonLdType,
    name: siteName,
    inLanguage: normalizedLocale,
    url: canonicalUrl,
    description,
  })
}

export function initSeo({ router, i18n }) {
  if (!router || !i18n) return

  const apply = (path) => {
    updateSeo({
      path,
      locale: i18n.global.locale.value,
    })
  }

  router.afterEach((to) => {
    apply(to.path)
  })

  apply(router.currentRoute.value.path)

  if (typeof i18n.global.locale === 'object' && 'value' in i18n.global.locale) {
    const originalLocale = i18n.global.locale
    let currentValue = originalLocale.value
    Object.defineProperty(originalLocale, 'value', {
      get() {
        return currentValue
      },
      set(nextValue) {
        currentValue = nextValue
        apply(router.currentRoute.value.path)
      },
      configurable: true,
    })
  }
}
