import { describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showError: vi.fn(),
}))

const { buildVocabularyItemsPath, getVocabularyItems } = await import('../src/api/main/vocabulary.js')

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
