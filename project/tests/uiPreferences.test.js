import { beforeEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  COLOR_THEME_BLUE_LIGHT,
  COLOR_THEME_BLUE_DARK,
  COLOR_THEME_DEFAULT,
  COLOR_THEME_RED_LIGHT,
  getStoredColorTheme,
  getBrandAssets,
  initializeUiPreferences,
  setColorTheme,
  getColorThemeParts,
  getColorThemeFor,
  isDarkColorTheme,
} from '../src/composables/core/uiPreferences.js'

describe('uiPreferences color theme', () => {
  it.each([
    ['blue', 'blue-light'], ['light', 'red-light'],
    ['dark', 'blue-dark'], ['green', 'green-dark'],
  ])('migrates legacy %s preferences to %s without changing the selected palette', (legacy, canonical) => {
    window.localStorage.setItem('dialects-color-theme', legacy)
    expect(getStoredColorTheme()).toBe(canonical)
    initializeUiPreferences()
    expect(document.documentElement.dataset.colorTheme).toBe(canonical)
    expect(window.localStorage.getItem('dialects-color-theme')).toBe(canonical)
    expect(getBrandAssets(legacy)).toEqual(getBrandAssets(canonical))
    expect(setColorTheme(legacy)).toBe(canonical)
  })
  it.each(['blue-light', 'red-light', 'green-light', 'blue-dark', 'red-dark', 'green-dark'])('stores only the canonical %s identifier', theme => {
    expect(setColorTheme(theme)).toBe(theme)
    expect(window.localStorage.getItem('dialects-color-theme')).toBe(theme)
    expect(document.documentElement.dataset.colorTheme).toBe(theme)
  })
  it.each([
    ['blue-light', 'blue', 'light'], ['red-light', 'red', 'light'],
    ['green-dark', 'green', 'dark'], ['blue-dark', 'blue', 'dark'],
    ['red-dark', 'red', 'dark'], ['green-light', 'green', 'light'],
  ])('persists %s and exposes its family and brightness', (theme, family, mode) => {
    expect(getColorThemeParts(theme)).toEqual({ family, mode })
    expect(getColorThemeFor(family, mode)).toBe(theme)
    expect(isDarkColorTheme(theme)).toBe(mode === 'dark')
    setColorTheme(theme)
    expect(document.documentElement.dataset.colorFamily).toBe(family)
    expect(document.documentElement.dataset.colorMode).toBe(mode)
    expect(getStoredColorTheme()).toBe(theme)
    initializeUiPreferences()
    expect(document.documentElement.dataset.colorTheme).toBe(theme)
  })

  it('reuses the original green artwork for green light and red light artwork for red dark', () => {
    expect(getBrandAssets('green-light')).toEqual({
      logo: '/brand/favicon_green.ico', title: '/brand/title.webp', decoration: '/brand/GreenCircle.webp',
    })
    expect(getBrandAssets('red-dark')).toEqual({
      ...getBrandAssets('red-light'), title: '/brand/theme-previews/title-red-dark.png',
    })
    setColorTheme('green-light')
    expect(document.querySelector('link[rel="icon"]').type).toBe('image/x-icon')
  })

  it('falls back consistently for invalid family and mode combinations', () => {
    expect(getColorThemeParts('invalid')).toEqual({ family: 'blue', mode: 'light' })
    expect(getColorThemeFor('invalid', 'dark')).toBe('blue-dark')
    expect(getColorThemeFor('green', 'invalid')).toBe('green-light')
  })
  beforeEach(() => {
    document.head.innerHTML = '<link rel="icon" type="image/x-icon" href="/favicon.ico">'
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-color-theme')
    document.documentElement.removeAttribute('data-ui-mode')
  })

  it.each([
    ['blue-light', 'blue'], ['red-light', 'light'], ['green-dark', 'green'], ['blue-dark', 'blue-dark'],
  ])('selects existing %s brand assets and keeps the browser icon stable', (theme, assetName) => {
    const assets = getBrandAssets(theme)
    expect(assets.logo).toBe(`/brand/theme-previews/favicon-${assetName}.png`)
    expect(assets.title).toBe(theme === 'blue-light' ? '/brand/title.webp' : theme === 'blue-dark' ? '/brand/theme-previews/title-dark.png' : `/brand/theme-previews/title-${assetName}.png`)
    expect(assets.decoration).toBe(theme === 'blue-light' ? '/brand/BlueCircle.webp' : theme === 'blue-dark' ? '/brand/theme-previews/circle-blue-dark.webp' : `/brand/theme-previews/logo-${assetName}.png`)
    const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public')
    for (const path of Object.values(assets)) expect(existsSync(resolve(publicDir, path.slice(1)))).toBe(true)
    setColorTheme(theme)
    expect(document.querySelector('link[rel="icon"]').getAttribute('href')).toBe('/favicon.ico')
    expect(document.querySelector('link[rel="icon"]').type).toBe('image/x-icon')
  })

  it('falls back to blue brand assets for an unsupported theme', () => {
    expect(getBrandAssets('invalid')).toEqual(getBrandAssets('blue-light'))
  })

  it('defaults to the blue theme when no stored theme exists', () => {
    expect(getStoredColorTheme()).toBe(COLOR_THEME_DEFAULT)

    initializeUiPreferences()

    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_BLUE_LIGHT)
  })

  it('persists and applies supported color themes', () => {
    const theme = setColorTheme(COLOR_THEME_BLUE_DARK)

    expect(theme).toBe(COLOR_THEME_BLUE_DARK)
    expect(window.localStorage.getItem('dialects-color-theme')).toBe(COLOR_THEME_BLUE_DARK)
    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_BLUE_DARK)

    window.localStorage.setItem('dialects-color-theme', COLOR_THEME_RED_LIGHT)
    window.localStorage.removeItem('dialects-color-mode')

    initializeUiPreferences()

    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_RED_LIGHT)
  })

  it('falls back to blue for unsupported stored themes', () => {
    window.localStorage.setItem('dialects-color-theme', 'pink')

    expect(getStoredColorTheme()).toBe(COLOR_THEME_BLUE_LIGHT)

    initializeUiPreferences()

    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_BLUE_LIGHT)
  })
})
