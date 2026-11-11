import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { useStorageState } from '../src/composables/core/useStorageState.js'

vi.mock('@/platform/index.js', () => ({
  getPlatformStorage: () => window.localStorage,
}))

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/main/views/explore/word/YuBaoPage.vue'), 'utf8')
function openPage(version) {
  const lines = source.split('\n').filter((line) =>
    /^const (yubaoCacheVersion|vocabularyCache|grammarCache) =/.test(line))
  return new Function('useStorageState', 'getHomeUpdateNotice',
    lines.join('\n') + '\nreturn { vocabularyCache, grammarCache }')(
    useStorageState, () => ({ dbVersion: version }))
}

describe('yubao list browser cache versions', () => {
  beforeEach(() => localStorage.clear())

  it('ignores legacy unversioned lists', () => {
    localStorage.setItem('yubao_vocabulary_all', JSON.stringify(['old']))
    expect(openPage('v2').vocabularyCache.state.value).toBeNull()
  })

  it('reuses both lists within a release and reloads after a version change', () => {
    const first = openPage('v1')
    first.vocabularyCache.write(['春'])
    first.grammarCache.write(['你好'])
    const same = openPage('v1')
    expect(same.vocabularyCache.state.value).toEqual(['春'])
    expect(same.grammarCache.state.value).toEqual(['你好'])
    const changed = openPage('v2')
    expect(changed.vocabularyCache.state.value).toBeNull()
    expect(changed.grammarCache.state.value).toBeNull()
  })
})
