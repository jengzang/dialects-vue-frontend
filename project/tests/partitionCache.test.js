import { beforeEach, describe, expect, it, vi } from 'vitest'

const tree = (mode = 'yindian') => ({ schema_version: 2, region_mode: mode, nodes: [], max_depth: 0 })

describe('default partition page cache', () => {
  beforeEach(() => { vi.resetModules(); sessionStorage.clear() })

  it('ignores reload-persistent old trees and coalesces requests across consumers', async () => {
    sessionStorage.setItem('__YINDIAN_TREE_CACHE__', JSON.stringify({ stale: {} }))
    const { usePartitionCache } = await import('../src/composables/data/usePartitionCache.js')
    const first = usePartitionCache(), second = usePartitionCache()
    let finish
    const loader = vi.fn(() => new Promise(resolve => { finish = resolve }))
    const a = first.getDefaultTree('yindian', loader)
    const b = second.getDefaultTree('yindian', loader)
    await Promise.resolve()
    finish(tree())
    expect(await a).toEqual(tree())
    expect(await b).toEqual(tree())
    expect(await second.getDefaultTree('yindian', loader)).toEqual(tree())
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('separates modes and identities and refreshes only after a new page module', async () => {
    let { usePartitionCache } = await import('../src/composables/data/usePartitionCache.js')
    const loader = vi.fn(async mode => tree(mode))
    await usePartitionCache().getDefaultTree('map', () => loader('map'), { identity: 'guest' })
    await usePartitionCache().getDefaultTree('yindian', () => loader('yindian'), { identity: 'guest' })
    await usePartitionCache().getDefaultTree('map', () => loader('map'), { identity: 'admin' })
    expect(loader).toHaveBeenCalledTimes(3)
    vi.resetModules()
    ;({ usePartitionCache } = await import('../src/composables/data/usePartitionCache.js'))
    await usePartitionCache().getDefaultTree('map', () => loader('map'), { identity: 'guest' })
    expect(loader).toHaveBeenCalledTimes(4)
  })

  it('allows retry after failure without caching malformed success', async () => {
    const { usePartitionCache } = await import('../src/composables/data/usePartitionCache.js')
    const cache = usePartitionCache()
    await expect(cache.getDefaultTree('map', async () => ({ old: {} }))).rejects.toThrow()
    expect(await cache.getDefaultTree('map', async () => tree('map'))).toEqual(tree('map'))
  })

  it('deduplicates resolution tokens and reuses unchanged results but isolates user and scope', async () => {
    const { usePartitionCache } = await import('../src/composables/data/usePartitionCache.js')
    const { resolveItems } = usePartitionCache()
    const item = { text: '桂林', kind: 'name' }
    const loader = vi.fn(async ({ region_mode, items }) => ({ schema_version: 2, region_mode, items: items.map(() => ({ candidates: [] })) }))
    await Promise.all([resolveItems('map', [item, item], loader), resolveItems('map', [item], loader)])
    expect(loader).toHaveBeenCalledTimes(1)
    expect(loader.mock.calls[0][0].items).toHaveLength(1)
    await resolveItems('map', [item], loader, { identity: 'user', scope: 'default_and_user' })
    await resolveItems('map', [item], loader, { identity: 'user' })
    expect(loader).toHaveBeenCalledTimes(3)
  })

  it('retries a rejected resolver request', async () => {
    const { usePartitionCache } = await import('../src/composables/data/usePartitionCache.js')
    const { resolveItems } = usePartitionCache()
    const items = [{ text: '甲', kind: 'path' }]
    await expect(resolveItems('map', items, async () => { throw Error('offline') })).rejects.toThrow('offline')
    const loader = vi.fn(async () => ({ schema_version: 2, region_mode: 'map', items: [{ candidates: [{ path: '甲' }] }] }))
    expect((await resolveItems('map', items, loader))[0].candidates[0].path).toBe('甲')
  })
})
