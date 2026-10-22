import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useRecentQueryHistory } from '../src/composables/core/useRecentQueryHistory.js'

let scopes = []
function history(context = 'query:tab1') {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useRecentQueryHistory(context))
}
beforeEach(() => localStorage.clear())
afterEach(() => { scopes.forEach(scope => scope.stop()); scopes = []; vi.restoreAllMocks() })

describe('recent query history', () => {
  it('persists only the latest three detached snapshots across remounts', () => {
    const state = history()
    const snapshot = { chars: '山', loc: { locations: ['廣州'] } }
    state.record(snapshot, '山 · 廣州')
    snapshot.loc.locations.push('北京')
    expect(state.entries.value[0].snapshot.loc.locations).toEqual(['廣州'])
    for (const chars of ['水', '火', '土']) state.record({ chars }, chars)
    expect(history().entries.value.map(entry => entry.snapshot.chars)).toEqual(['土', '火', '水'])
  })

  it('deduplicates complete conditions regardless of object key order and moves them first', () => {
    const state = history()
    state.record({ chars: '山', loc: { regions: [], locations: ['廣州'] } }, 'first')
    state.record({ chars: '山', loc: { locations: ['北京'], regions: [] } }, 'second')
    state.record({ loc: { locations: ['廣州'], regions: [] }, chars: '山' }, 'again')
    expect(state.entries.value).toHaveLength(2)
    expect(state.entries.value[0].summary).toBe('again')
  })

  it('keeps all nine contexts independent and reloads when the current tab changes', async () => {
    const contexts = ['query:tab1', 'query:tab2', 'query:tab3', 'query:tab4', 'compare:tab1', 'compare:tab2', 'compare:tab4', 'pho:matrix', 'pho:custom']
    contexts.forEach(context => history(context).record({ context }, context))
    const context = ref(contexts[0])
    const state = history(context)
    for (const value of contexts) {
      context.value = value
      await nextTick()
      expect(state.entries.value.map(entry => entry.snapshot.context)).toEqual([value])
    }
    context.value = 'compare:tab5'
    await nextTick()
    state.record({ ignored: true }, 'ignored')
    expect(state.entries.value).toEqual([])
  })

  it('ignores corrupt data and continues in memory when storage reads or writes fail', () => {
    history().record({ chars: '山' }, '山')
    const key = localStorage.key(0)
    localStorage.setItem(key, '{broken')
    expect(history().entries.value).toEqual([])
    localStorage.setItem(key, JSON.stringify({ version: 1, entries: [{ summary: 42, snapshot: null }] }))
    expect(history().entries.value).toEqual([])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const state = history()
    expect(() => state.record({ chars: '水' }, '水')).not.toThrow()
    expect(state.entries.value[0].snapshot.chars).toBe('水')
  })
})
