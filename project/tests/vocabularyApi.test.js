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
  getVocabularyItems,
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
      search_fields: ['headword', 'definition'],
      locations: ['息烽', '天柱竹林'],
      page: 2,
      page_size: 100,
      sort_by: 'location',
    })

    const searchParams = paramsFromPath(path)

    expect(path).toContain('/api/vocabulary/items?')
    expect(searchParams.get('q')).toBe('日头')
    expect(searchParams.get('search_fields')).toBe('headword,definition')
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
})

describe('vocabulary table API adapter', () => {
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
