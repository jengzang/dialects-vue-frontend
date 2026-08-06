import { describe, expect, it } from 'vitest'

import {
  NATIVE_DIST_PRUNE_GLOB_PATTERNS,
  NATIVE_DIST_PRUNE_GLOBS,
  NATIVE_DIST_PRUNE_PATHS,
} from '../scripts/prune-native-dist.mjs'
import { getNativeDistPruneManifest } from '../src/platform/index.js'

describe('native dist pruning manifest', () => {
  it('keeps GIS static resources in native builds', () => {
    const manifest = getNativeDistPruneManifest()

    expect(NATIVE_DIST_PRUNE_PATHS).toEqual(manifest.paths)
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('data/国界面.kmz')
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('tutorial/menu-map-view')
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('tutorial/menu-map-custom')
    expect(NATIVE_DIST_PRUNE_PATHS).not.toContain('tutorial/menu-map-divide')
  })

  it('keeps generated Voronoi worker chunks in native builds', () => {
    const manifest = getNativeDistPruneManifest()

    expect(NATIVE_DIST_PRUNE_GLOB_PATTERNS).toEqual(manifest.globPatterns)
    expect(NATIVE_DIST_PRUNE_GLOBS.some((pattern) => pattern.test('assets/voronoiClip.worker-BB4duF4T.js'))).toBe(false)
    expect(NATIVE_DIST_PRUNE_GLOBS.some((pattern) => pattern.test('assets/MapPage.SVLGtMid.js'))).toBe(false)
  })
})
