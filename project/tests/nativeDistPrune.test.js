import { describe, expect, it } from 'vitest'

import {
  NATIVE_DIST_PRUNE_GLOBS,
  NATIVE_DIST_PRUNE_PATHS,
} from '../scripts/prune-native-dist.mjs'

describe('native dist pruning manifest', () => {
  it('prunes web-only map drawing static resources from native builds', () => {
    expect(NATIVE_DIST_PRUNE_PATHS).toEqual(expect.arrayContaining([
      'data/国界面.kmz',
    ]))
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('tutorial/menu-map-view')
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('tutorial/menu-map-custom')
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('tutorial/menu-map-divide')
  })

  it('prunes generated Voronoi worker chunks from native builds', () => {
    expect(NATIVE_DIST_PRUNE_GLOBS.some((pattern) => pattern.test('assets/voronoiClip.worker-BB4duF4T.js'))).toBe(true)
    expect(NATIVE_DIST_PRUNE_GLOBS.some((pattern) => pattern.test('assets/MapPage.SVLGtMid.js'))).toBe(false)
  })
})
