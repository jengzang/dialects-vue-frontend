import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

const {
  buildNotesSearchPath,
  searchNotes,
} = await import('../src/api/main/notes.js')

function paramsFromPath(path) {
  return new URL(`http://localhost${path}`).searchParams
}

beforeEach(() => {
  apiMock.mockClear()
})

describe('notes search API', () => {
  it('builds the standalone notes endpoint with repeated geographic scope parameters', () => {
    const path = buildNotesSearchPath({
      q: '文白',
      search_fields: ['detail', 'pronunciation'],
      locations: ['1883廈門', '福州'],
      regions: ['閩', '閩南'],
      region_mode: 'yindian',
      page: 2,
      page_size: 50,
    })
    const searchParams = paramsFromPath(path)

    expect(new URL(`http://localhost${path}`).pathname).toBe('/api/notes')
    expect(searchParams.get('q')).toBe('文白')
    expect(searchParams.getAll('search_fields')).toEqual(['detail', 'pronunciation'])
    expect(searchParams.getAll('locations')).toEqual(['1883廈門', '福州'])
    expect(searchParams.getAll('regions')).toEqual(['閩', '閩南'])
    expect(searchParams.get('region_mode')).toBe('yindian')
    expect(searchParams.get('page')).toBe('2')
    expect(searchParams.get('page_size')).toBe('50')
  })

  it('omits absent scope, maps an empty field selection to all, and caps the page size', () => {
    const path = buildNotesSearchPath({
      q: 'pa',
      search_fields: [],
      page_size: 201,
    })
    const searchParams = paramsFromPath(path)

    expect(searchParams.has('locations')).toBe(false)
    expect(searchParams.has('regions')).toBe(false)
    expect(searchParams.getAll('search_fields')).toEqual(['all'])
    expect(searchParams.get('page_size')).toBe('200')
  })

  it('delegates notes requests to the common API client', async () => {
    apiMock.mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 50 })

    await searchNotes({ q: '文', search_fields: ['detail'], page: 1, page_size: 50 })

    expect(apiMock).toHaveBeenCalledWith(
      '/api/notes?q=%E6%96%87&search_fields=detail&page=1&page_size=50'
    )
  })
})
