import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ api: vi.fn(), getLocations: vi.fn() }))
vi.mock('@/api/auth/httpClient.js', () => ({ api: mocks.api }))
vi.mock('@/api/main/geo/LocationAndRegion.js', () => ({ getLocations: mocks.getLocations }))
vi.mock('@/utils/ui/message.js', () => ({ showError: vi.fn() }))
import { getCustomFeature, getCustomData } from '../src/api/main/user/custom.js'

beforeEach(() => { vi.clearAllMocks(); mocks.api.mockResolvedValue([]); mocks.getLocations.mockResolvedValue({ locations_result: ['甲地', '乙地'] }) })
const lastQuery = () => new URL(mocks.api.mock.calls.at(-1)[0], 'http://localhost').searchParams

describe('custom partition query transport', () => {
  it('sends full yindian paths as repeated parameters and required empty location keys', async () => {
    await getCustomFeature({ regions: ['甲-桂林', '乙-桂林'], locations: [], word: '' })
    expect(lastQuery().getAll('regions')).toEqual(['甲-桂林', '乙-桂林'])
    expect(lastQuery().getAll('locations')).toEqual([''])
    expect(mocks.getLocations).not.toHaveBeenCalled()
  })

  it('keeps required empty region/feature parameters for direct-location queries', async () => {
    await getCustomData({ locations: ['個人地'], regions: [], need_features: [] })
    expect(lastQuery().getAll('regions')).toEqual([''])
    expect(lastQuery().get('need_features')).toBe('')
  })

  it.each([getCustomFeature, getCustomData])('uses resolved map locations without querying map paths in the user yindian field', async load => {
    await load({ locations: ['個人地', '甲地'], regions: ['地圖-支系'], region_mode: 'map', need_features: ['聲', '韻'], word: '' })
    expect(mocks.getLocations).toHaveBeenCalledWith({ locations: ['個人地', '甲地'], regions: ['地圖-支系'], region_mode: 'map' })
    expect(lastQuery().getAll('locations')).toEqual(['個人地', '甲地', '乙地'])
    expect(lastQuery().getAll('regions')).toEqual([''])
  })
})
