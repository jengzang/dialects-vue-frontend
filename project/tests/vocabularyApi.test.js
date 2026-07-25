import { describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

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
  getVocabularyLocationNames,
  getVocabularyLocations,
  getVocabularyLogs,
  updateVocabularyLocation,
  vocabularySqlApi,
  uploadVocabulary,
} = await import('../src/api/main/vocabulary.js')

function paramsFromPath(path) {
  return new URL(`http://localhost${path}`).searchParams
}

describe('vocabulary items API', () => {
  it('serializes the card and map query contract without table-only parameters', () => {
    const path = buildVocabularyItemsPath({
      q: '日头',
      search_fields: ['headword', 'ipa', 'notes'],
      locations: ['息烽', '天柱竹林'],
      page: 2,
      page_size: 100,
      sort_by: 'location',
    })

    const searchParams = paramsFromPath(path)

    expect(path).toContain('/api/vocabulary/items?')
    expect(searchParams.get('q')).toBe('日头')
    expect(searchParams.get('search_fields')).toBe('headword,ipa,notes')
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

    expect(path).toBe('/api/vocabulary/items')
  })

  it('calls the completed backend endpoint for card and map items', async () => {
    apiMock.mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 50 })

    await getVocabularyItems({ q: '太阳', search_fields: 'definition', page: 1, page_size: 50 })

    expect(apiMock).toHaveBeenCalledTimes(1)
    expect(apiMock.mock.calls[0][0]).toBe(
      '/api/vocabulary/items?q=%E5%A4%AA%E9%98%B3&search_fields=definition&page=1&page_size=50'
    )
  })

  it('serializes map points query without pagination', async () => {
    const path = buildVocabularyMapPointsPath({
      q: '日头',
      search_fields: ['headword', 'ipa'],
      locations: ['息烽', '天柱'],
      page: 2,
      page_size: 50,
    })
    const searchParams = paramsFromPath(path)

    expect(path).toContain('/api/vocabulary/map-points?')
    expect(searchParams.get('q')).toBe('日头')
    expect(searchParams.get('search_fields')).toBe('headword,ipa')
    expect(searchParams.get('locations')).toBe('息烽,天柱')
    expect(searchParams.has('page')).toBe(false)
    expect(searchParams.has('page_size')).toBe(false)

    apiMock.mockResolvedValueOnce({ points: [], total_entries: 0, total_points: 0 })
    await getVocabularyMapPoints({ q: '太阳' })

    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/map-points?q=%E5%A4%AA%E9%98%B3')
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

  it('loads vocabulary location names from the dedicated locations API', async () => {
    apiMock.mockResolvedValueOnce({
      locations: [
        { location_name: '息烽' },
        { location_name: '天柱' },
      ],
      total: 2,
      page: 1,
      page_size: 200,
    })

    const values = await getVocabularyLocationNames()

    expect(values).toEqual(['息烽', '天柱'])
    expect(apiMock).toHaveBeenLastCalledWith('/api/vocabulary/locations?page=1&page_size=200')
  })

  it('continues loading vocabulary location names when the dedicated locations API has more pages', async () => {
    apiMock.mockClear()
    apiMock.mockResolvedValueOnce({
      locations: Array.from({ length: 200 }, (_, index) => ({
        location_name: index === 199 ? '息烽' : `地点${index}`,
      })),
      total: 201,
      page: 1,
      page_size: 200,
    })
    apiMock.mockResolvedValueOnce({
      locations: [
        { location_name: '息烽' },
        { location_name: '天柱' },
      ],
      total: 201,
      page: 2,
      page_size: 200,
    })

    const values = await getVocabularyLocationNames()

    expect(values).toHaveLength(201)
    expect(values.at(-1)).toBe('天柱')
    expect(apiMock).toHaveBeenNthCalledWith(1, '/api/vocabulary/locations?page=1&page_size=200')
    expect(apiMock).toHaveBeenNthCalledWith(2, '/api/vocabulary/locations?page=2&page_size=200')
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
  it('submits file, location JSON and parser mode as multipart form data', async () => {
    apiMock.mockResolvedValueOnce({ success: true })
    const file = new File(['definition,headword'], 'vocabulary.csv', { type: 'text/csv' })
    const location = { location_name: '息烽', coordinates: '106.7400,27.0900' }

    await uploadVocabulary({ file, location, parser_mode: 'table' })

    expect(apiMock).toHaveBeenCalledWith('/api/vocabulary/upload', {
      method: 'POST',
      body: expect.any(FormData),
    })

    const formData = apiMock.mock.calls.at(-1)[1].body
    expect(formData.get('file')).toBe(file)
    expect(formData.get('location')).toBe(JSON.stringify(location))
    expect(formData.get('parser_mode')).toBe('table')
  })
})
