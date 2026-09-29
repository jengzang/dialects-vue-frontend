import { api } from '../auth/httpClient.js'

const NOTES_SEARCH_ENDPOINT = '/api/notes'
const MAX_PAGE_SIZE = 200

function appendIfPresent(query, key, value) {
  if (value === undefined || value === null || value === '') {
    return
  }
  query.append(key, String(value))
}

function appendRepeatedValues(query, key, values) {
  const items = Array.isArray(values) ? values : [values]
  items
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .forEach((value) => query.append(key, value))
}

function appendSearchFields(query, searchFields) {
  const fields = (Array.isArray(searchFields) ? searchFields : [searchFields])
    .map((field) => String(field ?? '').trim())
    .filter(Boolean)

  if (!fields.length) {
    query.append('search_fields', 'all')
    return
  }

  fields.forEach((field) => query.append('search_fields', field))
}

function appendPageSize(query, pageSize) {
  if (pageSize === undefined || pageSize === null || pageSize === '') {
    return
  }

  const numericPageSize = Number(pageSize)
  appendIfPresent(
    query,
    'page_size',
    Number.isFinite(numericPageSize) ? Math.min(Math.trunc(numericPageSize), MAX_PAGE_SIZE) : pageSize
  )
}

export function buildNotesSearchPath(params = {}) {
  const query = new URLSearchParams()

  appendIfPresent(query, 'q', params.q)
  appendSearchFields(query, params.search_fields)
  appendRepeatedValues(query, 'locations', params.locations)
  appendRepeatedValues(query, 'regions', params.regions)
  appendIfPresent(query, 'region_mode', params.region_mode)
  appendIfPresent(query, 'page', params.page)
  appendPageSize(query, params.page_size)

  const suffix = query.toString()
  return suffix ? `${NOTES_SEARCH_ENDPOINT}?${suffix}` : NOTES_SEARCH_ENDPOINT
}

export async function searchNotes(params = {}) {
  return api(buildNotesSearchPath(params))
}
