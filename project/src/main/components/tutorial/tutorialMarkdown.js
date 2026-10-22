/* global __WEB_BASE__, __IS_NATIVE_BUILD__ */
import { marked } from 'marked'

const BASE_LOCALE = 'zh-Hant'
const SUPPORTED_LOCALES = ['zh-Hant', 'zh-CN', 'en']
const BUILD_WEB_BASE = typeof __WEB_BASE__ === 'undefined' ? '' : __WEB_BASE__
const BUILD_IS_NATIVE = typeof __IS_NATIVE_BUILD__ === 'undefined' ? false : __IS_NATIVE_BUILD__

const markdownFiles = import.meta.glob('./content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function resolveTutorialAssetUrl(url, options = {}) {
  if (typeof url !== 'string' || !url.startsWith('/tutorial/')) {
    return url
  }

  const isNativeBuild = options.isNativeBuild ?? BUILD_IS_NATIVE
  if (!isNativeBuild) {
    return url
  }

  const webBase = String(options.webBase ?? BUILD_WEB_BASE ?? '').replace(/\/+$/, '')
  if (!webBase) {
    return url
  }

  return `${webBase}${url}`
}

function createTutorialRenderer(options = {}) {
  const renderer = new marked.Renderer()
  const defaultLinkRenderer = renderer.link.bind(renderer)
  const defaultImageRenderer = renderer.image.bind(renderer)

  renderer.link = (token) => {
    const html = defaultLinkRenderer(token)

    if (!/^https?:\/\//i.test(token.href || '')) {
      return html
    }

    return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
  }

  renderer.image = (token) => {
    return defaultImageRenderer({
      ...token,
      href: resolveTutorialAssetUrl(token.href, options),
    })
  }

  return renderer
}

function normalizeLocale(locale) {
  if (SUPPORTED_LOCALES.includes(locale)) {
    return locale
  }

  if (typeof locale === 'string') {
    if (locale.startsWith('zh-CN') || locale.startsWith('zh-Hans')) {
      return 'zh-CN'
    }

    if (
      locale.startsWith('zh-Hant')
      || locale.startsWith('zh-TW')
      || locale.startsWith('zh-HK')
    ) {
      return 'zh-Hant'
    }

    if (locale.startsWith('en')) {
      return 'en'
    }
  }

  return BASE_LOCALE
}

function trimEdgeSpaces(tokens) {
  const trimmed = [...tokens]

  while (trimmed[0]?.type === 'space') {
    trimmed.shift()
  }

  while (trimmed[trimmed.length - 1]?.type === 'space') {
    trimmed.pop()
  }

  return trimmed
}

function parseMarkdownDocument(rawMarkdown, options = {}) {
  const tokens = marked.lexer(rawMarkdown)
  const titleIndex = tokens.findIndex((token) => token.type === 'heading' && token.depth === 1)
  const title = titleIndex >= 0 ? tokens[titleIndex].text.trim() : ''

  let summaryIndex = -1
  for (let index = titleIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token.type === 'space') {
      continue
    }

    if (token.type === 'paragraph') {
      summaryIndex = index
    }
    break
  }

  const summary = summaryIndex >= 0 ? tokens[summaryIndex].text.trim() : ''
  const bodyTokens = trimEdgeSpaces(tokens.filter((_, index) => index !== titleIndex && index !== summaryIndex))
  const html = marked.parser(bodyTokens, {
    renderer: createTutorialRenderer(options),
  }).trim()

  return {
    title,
    summary,
    html,
    rawMarkdown,
  }
}

const tutorialDocumentMap = new Map(
  Object.entries(markdownFiles).map(([filePath, rawMarkdown]) => {
    const match = filePath.match(/^\.\/content\/([^/]+)\/(.+)\.md$/)

    if (!match) {
      return [filePath, null]
    }

    const [, locale, key] = match
    return [`${locale}/${key}`, parseMarkdownDocument(rawMarkdown)]
  })
)

export function resolveTutorialDocument(key, locale, options = {}) {
  const normalizedLocale = normalizeLocale(locale)
  const document = tutorialDocumentMap.get(`${normalizedLocale}/${key}`)
    || tutorialDocumentMap.get(`${BASE_LOCALE}/${key}`)
    || null

  if (!document || !(options.isNativeBuild ?? BUILD_IS_NATIVE)) {
    return document
  }

  return parseMarkdownDocument(document.rawMarkdown, options)
}
