import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiMock = vi.fn()
const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showError: vi.fn(),
}))

const {
  buildVocabularyItemsPath,
  buildVocabularyMapPointsPath,
  getVocabularyItems,
  getVocabularyMapPoints,
  getVocabularyMe,
  getVocabularyLocationNames,
  getVocabularyLocationOptions,
  getVocabularyLocations,
  getVocabularyLogs,
  updateVocabularyLocation,
  vocabularySqlApi,
  previewVocabularyImport,
  uploadVocabulary,
} = await import('../src/api/main/vocabulary.js')

function paramsFromPath(path) {
  return new URL(`http://localhost${path}`).searchParams
}

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

beforeEach(() => {
  apiMock.mockClear()
})

describe('vocabulary items API', () => {
  it('does not reference backend-deleted vocabulary compatibility paths', () => {
    const source = readSource('src/api/main/vocabulary.js')

    expect(source).not.toContain('/api/vocabulary/items')
    expect(source).not.toContain('/api/vocabulary/map-points')
    expect(source).not.toContain('/api/vocabulary/location-options')
    expect(source).not.toContain('/api/vocabulary/upload')
    expect(source).not.toContain('/api/vocabulary/me/permission')
  })

  it('loads the current vocabulary permission context from /me', async () => {
    apiMock.mockResolvedValueOnce({
      user_id: 7,
      permission_level: 'edit',
      can_upload: true,
      can_manage_entries: false,
      can_view_logs: false,
    })

    await getVocabularyMe()

    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/me')
  })

  it('serializes the card and map query contract without table-only parameters', () => {
    const path = buildVocabularyItemsPath({
      q: '日头',
      search_fields: ['headword', 'pronunciation', 'detail'],
      locations: ['息烽', '天柱竹林'],
      page: 2,
      page_size: 100,
      sort_by: 'location',
    })

    const searchParams = paramsFromPath(path)

    expect(path).toContain('/api/vocabulary/search/entries?')
    expect(searchParams.get('q')).toBe('日头')
    expect(searchParams.get('search_fields')).toBe('headword,pronunciation,detail')
    expect(searchParams.get('locations')).toBe('息烽,天柱竹林')
    expect(searchParams.get('page')).toBe('2')
    expect(searchParams.get('page_size')).toBe('100')
    expect(searchParams.has('sort_by')).toBe(false)
  })

  it('omits empty optional params so backend default search fields stay in effect', () => {
    const path = buildVocabularyItemsPath({
      q: '',
      search_fields: [],
      locations: [],
      page: null,
      page_size: undefined,
    })

    expect(path).toBe('/api/vocabulary/search/entries')
  })

  it('calls the completed backend endpoint for card and map items', async () => {
    apiMock.mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 50 })

    await getVocabularyItems({ q: '太阳', search_fields: 'definition', page: 1, page_size: 50 })

    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(apiMock.mock.calls[0][0]).toBe(
      '/api/vocabulary/search/entries?q=%E5%A4%AA%E9%98%B3&search_fields=definition&page=1&page_size=50'
    )
  })

  it('serializes map points query without pagination', async () => {
    const path = buildVocabularyMapPointsPath({
      q: '日头',
      search_fields: ['headword', 'pronunciation'],
      locations: ['息烽', '天柱'],
      page: 2,
      page_size: 50,
    })
    const searchParams = paramsFromPath(path)

    expect(path).toContain('/api/vocabulary/search/map-points?')
    expect(searchParams.get('q')).toBe('日头')
    expect(searchParams.get('search_fields')).toBe('headword,pronunciation')
    expect(searchParams.get('locations')).toBe('息烽,天柱')
    expect(searchParams.has('page')).toBe(false)
    expect(searchParams.has('page_size')).toBe(false)

    apiMock.mockResolvedValueOnce({ points: [], total_entries: 0, total_points: 0 })
    await getVocabularyMapPoints({ q: '太阳' })

    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/search/map-points?q=%E5%A4%AA%E9%98%B3')
  })
})

describe('vocabulary table API adapter', () => {
  it('guards vocabulary SQL adapter to vocabulary_entries only', async () => {
    apiMock.mockClear()

    await expect(vocabularySqlApi.query({
      table_name: 'vocabulary_locations',
      page: 1,
    })).rejects.toThrow('vocabulary_entries')

    expect(apiMock).not.toHaveBeenCalled()
  })

  it('routes table mode through vocabulary SQL endpoints without db_key', async () => {
    apiMock.mockResolvedValueOnce({ data: [], total: 0, page: 1 })

    await vocabularySqlApi.query({
      db_key: 'vocabulary',
      table_name: 'vocabulary_entries',
      page: 1,
      page_size: 50,
    })

    expect(apiMock).toHaveBeenCalledWith('/api/vocabulary/sql/query', {
      method: 'POST',
      body: {
        table_name: 'vocabulary_entries',
        page: 1,
        page_size: 50,
      },
    })
  })

  it('uses vocabulary distinct and mutation endpoints', async () => {
    apiMock.mockResolvedValueOnce({ values: [] })
    await vocabularySqlApi.distinct({
      db_key: 'vocabulary',
      table_name: 'vocabulary_entries',
      target_column: 'location_name',
    })

    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/distinct-query', {
      method: 'POST',
      body: {
        table_name: 'vocabulary_entries',
        target_column: 'location_name',
      },
    })

    apiMock.mockResolvedValueOnce({ status: 'success' })
    await vocabularySqlApi.mutateSingle({
      db_key: 'vocabulary',
      table_name: 'vocabulary_entries',
      action: 'update',
      pk_column: 'id',
      pk_value: 1,
      data: { ipa: 'new' },
    })

    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/mutate', {
      method: 'POST',
      body: {
        table_name: 'vocabulary_entries',
        action: 'update',
        pk_column: 'id',
        pk_value: 1,
        data: { ipa: 'new' },
      },
    })
  })

  it('loads vocabulary location options from the public lightweight endpoint', async () => {
    apiMock.mockResolvedValueOnce({
      locations: [
        { location_name: '息烽', location_label: '贵州 / 贵阳 / 息烽' },
        { location_name: '天柱', location_label: '贵州 / 黔东南 / 天柱' },
      ],
      total: 2,
    })

    const values = await getVocabularyLocationOptions()

    expect(values).toEqual([
      { value: '息烽', label: '贵州 / 贵阳 / 息烽' },
      { value: '天柱', label: '贵州 / 黔东南 / 天柱' },
    ])
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/search/location-options')
  })

  it('keeps the legacy vocabulary location names helper returning names', async () => {
    apiMock.mockResolvedValueOnce({
      locations: [
        { location_name: '息烽', location_label: '贵州 / 贵阳 / 息烽' },
      ],
      total: 1,
    })

    await expect(getVocabularyLocationNames()).resolves.toEqual(['息烽'])
  })

  it('uses dedicated vocabulary location and log endpoints outside SQL table access', async () => {
    apiMock.mockResolvedValueOnce({ locations: [], total: 0, page: 1, page_size: 50 })
    await getVocabularyLocations({ user_id: 7, location_name: '息烽', page: 2 })
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/locations?user_id=7&location_name=%E6%81%AF%E7%83%BD&page=2')

    apiMock.mockResolvedValueOnce({ location_name: '息烽' })
    await updateVocabularyLocation('息烽', { coordinates: '106,27' }, { user_id: 7 })
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/locations/%E6%81%AF%E7%83%BD?user_id=7', {
      method: 'PATCH',
      body: { coordinates: '106,27' },
    })

    apiMock.mockResolvedValueOnce({ logs: [], total: 0, page: 1, page_size: 50 })
    await getVocabularyLogs({ source: 'upload', action: 'import' })
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/logs?source=upload&action=import')

    apiMock.mockResolvedValueOnce({ logs: [], total: 0, page: 1, page_size: 50 })
    await getVocabularyLogs({
      user_id: 7,
      permission_level: 'manage',
      source: 'sql_editor',
      action: 'update',
      table_name: 'vocabulary_entries',
      status: 'success',
      page: 1,
      page_size: 50,
    })
    expect(apiMock).toHaveBeenLastCalledWith(
      '/api/vocabulary/logs?user_id=7&permission_level=manage&source=sql_editor&action=update&table_name=vocabulary_entries&status=success&page=1&page_size=50'
    )
  })

  it('supports vocabulary SQL columns, count, and direct distinct endpoints for entries only', async () => {
    apiMock.mockResolvedValueOnce({ columns: [] })
    await vocabularySqlApi.columns({ db_key: 'vocabulary', table_name: 'vocabulary_entries' })
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/query/columns?table_name=vocabulary_entries')

    apiMock.mockResolvedValueOnce({ count: 120 })
    await vocabularySqlApi.count({
      table_name: 'vocabulary_entries',
      filter_column: 'location_name',
      filter_value: '息烽',
    })
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/query/count?table_name=vocabulary_entries&filter_column=location_name&filter_value=%E6%81%AF%E7%83%BD')

    apiMock.mockResolvedValueOnce({ values: ['息烽'] })
    await vocabularySqlApi.distinctDirect({
      table_name: 'vocabulary_entries',
      column: 'location_name',
    })
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/distinct/vocabulary_entries/location_name')

    await expect(vocabularySqlApi.columns({ table_name: 'vocabulary_logs' })).rejects.toThrow('vocabulary_entries')
  })

  it('uses vocabulary batch mutation and replace endpoints', async () => {
    apiMock.mockResolvedValueOnce({ status: 'success' })
    await vocabularySqlApi.batchMutate({
      db_key: 'vocabulary',
      table_name: 'vocabulary_entries',
      action: 'batch_update',
      pk_column: 'id',
      update_data: [{ id: 1, notes: '修订' }],
    })

    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/batch-mutate', {
      method: 'POST',
      body: {
        table_name: 'vocabulary_entries',
        action: 'batch_update',
        pk_column: 'id',
        update_data: [{ id: 1, notes: '修订' }],
      },
    })

    const replacePayload = {
      db_key: 'vocabulary',
      table_name: 'vocabulary_entries',
      pk_column: 'id',
      columns: ['notes'],
      find_text: '旧',
      replace_text: '新',
    }

    apiMock.mockResolvedValueOnce({ status: 'success', total_matches: 1 })
    await vocabularySqlApi.batchReplacePreview(replacePayload)
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/batch-replace-preview', {
      method: 'POST',
      body: {
        table_name: 'vocabulary_entries',
        columns: ['notes'],
        find_text: '旧',
        replace_text: '新',
      },
    })

    apiMock.mockResolvedValueOnce({ status: 'success', affected_rows: 1 })
    await vocabularySqlApi.batchReplaceExecute(replacePayload)
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/sql/batch-replace-execute', {
      method: 'POST',
      body: {
        table_name: 'vocabulary_entries',
        columns: ['notes'],
        find_text: '旧',
        replace_text: '新',
      },
    })
  })
})

describe('vocabulary upload API', () => {
  it('previews file, location JSON and parser mode through the imports preview endpoint', async () => {
    apiMock.mockResolvedValueOnce({ success: true, parsed_count: 1 })
    const file = new File(['definition,headword'], 'vocabulary.csv', { type: 'text/csv' })
    const location = { location_name: '息烽', coordinates: '106.7400,27.0900' }

    await previewVocabularyImport({ file, location, parser_mode: 'table' })

    expect(apiMock).toHaveBeenCalledWith('/api/vocabulary/imports/preview', {
      method: 'POST',
      body: expect.any(FormData),
    })

    const formData = apiMock.mock.calls.at(-1)[1].body
    expect(formData.get('file')).toBe(file)
    expect(formData.get('location')).toBe(JSON.stringify(location))
    expect(formData.get('parser_mode')).toBe('table')
  })

  it('submits file, location JSON and parser mode as multipart form data', async () => {
    apiMock.mockResolvedValueOnce({ success: true })
    const file = new File(['definition,headword'], 'vocabulary.csv', { type: 'text/csv' })
    const location = { location_name: '息烽', coordinates: '106.7400,27.0900' }

    await uploadVocabulary({ file, location, parser_mode: 'table' })

    expect(apiMock).toHaveBeenCalledWith('/api/vocabulary/imports', {
      method: 'POST',
      body: expect.any(FormData),
    })

    const formData = apiMock.mock.calls.at(-1)[1].body
    expect(formData.get('file')).toBe(file)
    expect(formData.get('location')).toBe(JSON.stringify(location))
    expect(formData.get('parser_mode')).toBe('table')
  })
})
