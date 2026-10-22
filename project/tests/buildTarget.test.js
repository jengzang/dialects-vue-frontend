import { describe, expect, it } from 'vitest'

import { resolveBuildTarget } from '../src/platform/buildTarget.js'

describe('build target resolution', () => {
  it('keeps the default production build as web', () => {
    expect(resolveBuildTarget('production')).toEqual({
      target: 'web',
      family: 'web',
      isNative: false,
      isWeb: true,
    })
  })

  it('keeps the explicit web mode as web', () => {
    expect(resolveBuildTarget('web')).toEqual({
      target: 'web',
      family: 'web',
      isNative: false,
      isWeb: true,
    })
  })

  it('resolves ios and android modes as native builds', () => {
    expect(resolveBuildTarget('ios')).toMatchObject({
      target: 'ios',
      family: 'native',
      isNative: true,
      isWeb: false,
    })
    expect(resolveBuildTarget('android')).toMatchObject({
      target: 'android',
      family: 'native',
      isNative: true,
      isWeb: false,
    })
  })

  it('lets environment variables override the vite mode', () => {
    expect(resolveBuildTarget('production', { VITE_PLATFORM_TARGET: 'android' })).toMatchObject({
      target: 'android',
      isNative: true,
      isWeb: false,
    })
  })
})
