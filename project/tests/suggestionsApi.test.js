import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

beforeEach(() => {
  vi.resetModules()
  apiMock.mockReset()
})

describe('suggestions API client', () => {
  it('submits trimmed suggestion payload with page context and optional screenshot', async () => {
    apiMock.mockResolvedValue({ success: true, id: 9, message: '建议已提交' })

    const { submitSuggestion } = await import('../src/api/main/suggestions.js')
    const result = await submitSuggestion({
      title: '  地图颜色建议  ',
      content: '  希望绿色主题的地图点更明显。  ',
      category: 'ui',
      source_path: '/menu/map/view',
      contact: '  user@example.com  ',
      context: { routeName: 'map-view' },
      image_base64: 'data:image/webp;base64,abc',
    })

    expect(result).toEqual({ success: true, id: 9, message: '建议已提交' })
    expect(apiMock).toHaveBeenCalledWith('/api/suggestions', {
      method: 'POST',
      body: {
        title: '地图颜色建议',
        content: '希望绿色主题的地图点更明显。',
        category: 'ui',
        source_path: '/menu/map/view',
        contact: 'user@example.com',
        context: { routeName: 'map-view' },
        image_base64: 'data:image/webp;base64,abc',
      },
      responseType: 'json',
      showError: false,
    })
  })

  it('omits empty optional fields and defaults category to general', async () => {
    apiMock.mockResolvedValue({ success: true, id: 10, message: '建议已提交' })

    const { submitSuggestion } = await import('../src/api/main/suggestions.js')
    await submitSuggestion({
      title: '  资料问题  ',
      content: '  某地点注释可能有误。  ',
      category: '',
      source_path: '',
      contact: '   ',
      context: null,
      image_base64: '',
    })

    expect(apiMock).toHaveBeenCalledWith('/api/suggestions', {
      method: 'POST',
      body: {
        title: '资料问题',
        content: '某地点注释可能有误。',
        category: 'general',
      },
      responseType: 'json',
      showError: false,
    })
  })
})
