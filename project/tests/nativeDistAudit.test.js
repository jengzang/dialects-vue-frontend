import { describe, expect, it } from 'vitest'

import {
  auditNativeDistFiles,
  NATIVE_DIST_FORBIDDEN_GLOB_PATTERNS,
  NATIVE_DIST_FORBIDDEN_GLOBS,
  NATIVE_DIST_FORBIDDEN_PATHS,
} from '../scripts/audit-native-dist.mjs'
import { getNativeDistPruneManifest } from '../src/platform/index.js'

describe('native dist audit manifest', () => {
  it('uses the native prune manifest as the native forbidden file manifest', () => {
    const manifest = getNativeDistPruneManifest()

    expect(NATIVE_DIST_FORBIDDEN_PATHS).toEqual(manifest.paths)
    expect(NATIVE_DIST_FORBIDDEN_GLOB_PATTERNS).toEqual(manifest.globPatterns)
    expect(NATIVE_DIST_FORBIDDEN_GLOBS.some((pattern) => pattern.test('assets/voronoiClip.worker-BB4duF4T.js'))).toBe(false)
  })

  it('fails native dist audit when bundled tutorial screenshots remain', () => {
    expect(auditNativeDistFiles([
      'tutorial/menu-query-char/01-输入页面.webp',
      'assets/index.Dav9-R3r.js',
    ])).toEqual(['tutorial/menu-query-char/01-输入页面.webp'])
  })

  it('allows GIS native files and ordinary map assets', () => {
    expect(auditNativeDistFiles([
      'assets/MapPage.D_UChiyI.js',
      'assets/voronoiClip.worker-BB4duF4T.js',
      'data/国界面.kmz',
      'data/ordinary-map-data.json',
    ])).toEqual([])
  })
})
