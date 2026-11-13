import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/auth/httpClient.js', () => ({ api: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showError: vi.fn(), showWarning: vi.fn() }))

import { api } from '@/api/auth/httpClient.js'
import { getCoordinates } from '@/api/main/geo/geo.js'

describe('query map partition mode', () => {
  it('preserves the requested partition source with coordinate paths', async () => {
    const response = { coordinates_locations: [['台山', [112, 22]]], region_mappings: { 台山: '嶺南-四邑-台山' } }
    api.mockResolvedValueOnce(response)
    const result = await getCoordinates({ locations: ['台山'], region_mode: 'yindian' })
    expect(result.region_mode).toBe('yindian')
    expect(result.region_mappings).toEqual(response.region_mappings)
    expect(response).not.toHaveProperty('region_mode')
  })

  it('preserves explicit map mode and the backend default yindian mode', async () => {
    api.mockResolvedValue({ coordinates_locations: [], region_mappings: {} })
    expect((await getCoordinates({ locations: ['台山'], region_mode: 'map' })).region_mode).toBe('map')
    expect((await getCoordinates({ locations: ['台山'] })).region_mode).toBe('yindian')
  })
})
