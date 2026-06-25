import { marked } from 'marked'

const BASE_LOCALE = 'zh-Hant'
const SUPPORTED_LOCALES = ['zh-Hant', 'zh-CN', 'en']

const markdownFiles = import.meta.glob('./content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const renderer = new marked.Renderer()
const defaultLinkRenderer = renderer.link.bind(renderer)

renderer.link = (token) => {
  const html = defaultLinkRenderer(token)

  if (!/^https?:\/\//i.test(token.href || '')) {
    return html
  }

  return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
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

function parseMarkdownDocument(rawMarkdown) {
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
  const html = marked.parser(bodyTokens, { renderer }).trim()

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

export function resolveTutorialDocument(key, locale) {
  const normalizedLocale = normalizeLocale(locale)
  return tutorialDocumentMap.get(`${normalizedLocale}/${key}`)
    || tutorialDocumentMap.get(`${BASE_LOCALE}/${key}`)
    || null
}
