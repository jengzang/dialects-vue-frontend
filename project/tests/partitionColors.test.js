import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/main/geo/LocationAndRegion.js', () => ({
  getPartitions: vi.fn(async () => ({
    schema_version: 2,
    region_mode: 'map',
    nodes: [{ path: '粤语-四邑片-台山', color: '#123456', children: [] }],
  })),
}))

describe('partition colors', () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
  })

  it('loads complete-path colors and chooses contrasting text', async () => {
    const { usePartitionColors, getContrastTextColor } = await import('../src/composables/data/usePartitionColors.js')
    const colors = await usePartitionColors().loadPartitionColors('map', 'guest')

    expect(colors.get('粤语-四邑片-台山')).toBe('#123456')
    expect(getContrastTextColor('#123456')).toBe('#fff')
    expect(getContrastTextColor('#ffffff')).toBe('#000')
  })
})
