import { api } from '../auth/httpClient.js'

export const SUGGESTION_CATEGORY_OPTIONS = [
  'general',
  'bug',
  'feature',
  'data_issue',
  'ui',
  'vocabulary_permission',
]

function trimText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function appendIfPresent(target, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    target[key] = value
  }
}

export function normalizeSuggestionPayload(payload = {}) {
  const body = {
    title: trimText(payload.title),
    content: trimText(payload.content),
    category: trimText(payload.category) || 'general',
  }

  appendIfPresent(body, 'source_path', trimText(payload.source_path))
  appendIfPresent(body, 'contact', trimText(payload.contact))

  if (payload.context && typeof payload.context === 'object') {
    body.context = payload.context
  }

  appendIfPresent(body, 'image_base64', trimText(payload.image_base64))

  return body
}

export function submitSuggestion(payload) {
  return api('/api/suggestions', {
    method: 'POST',
    body: normalizeSuggestionPayload(payload),
    responseType: 'json',
    showError: false,
  })
}
