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

  it('shares edits, persists overrides across reloads, and restores backend colors', async () => {
    let module = await import('../src/composables/data/usePartitionColors.js')
    const first = module.usePartitionColors()
    const second = module.usePartitionColors()
    await first.loadPartitionColors('map', 'guest')
    first.setPartitionColor('map', 'guest', '粤语-四邑片-台山', '#ffffff')
    expect(second.getPartitionColor('map', 'guest', '粤语-四邑片-台山')).toBe('#ffffff')
    expect(second.getPartitionColor('map', 'other', '粤语-四邑片-台山')).toBeUndefined()
    vi.resetModules()
    module = await import('../src/composables/data/usePartitionColors.js')
    const reloaded = module.usePartitionColors()
    await reloaded.loadPartitionColors('map', 'guest')
    expect(reloaded.getPartitionColor('map', 'guest', '粤语-四邑片-台山')).toBe('#ffffff')
    reloaded.resetPartitionColor('map', 'guest', '粤语-四邑片-台山')
    expect(reloaded.getPartitionColor('map', 'guest', '粤语-四邑片-台山')).toBe('#123456')
  })

  it('reuses session trees without requesting the API after a module reload', async () => {
    const { getPartitions } = await import('@/api/main/geo/LocationAndRegion.js')
    getPartitions.mockClear()
    let module = await import('../src/composables/data/usePartitionColors.js')
    await Promise.all([
      module.usePartitionColors().loadPartitionColors('map', 'guest'),
      module.usePartitionColors().loadPartitionColors('map', 'guest'),
    ])
    expect(getPartitions).toHaveBeenCalledTimes(1)
    vi.resetModules()
    module = await import('../src/composables/data/usePartitionColors.js')
    await module.usePartitionColors().loadPartitionColors('map', 'guest')
    expect(getPartitions).toHaveBeenCalledTimes(1)
  })
})
