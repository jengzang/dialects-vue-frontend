import { beforeEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  COLOR_THEME_BLUE,
  COLOR_THEME_DARK,
  COLOR_THEME_DEFAULT,
  COLOR_THEME_LIGHT,
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
    ['blue', 'blue', 'light'], ['light', 'red', 'light'],
    ['green', 'green', 'dark'], ['dark', 'blue', 'dark'],
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

  it('reuses the original green artwork for green light and dark artwork for red dark', () => {
    expect(getBrandAssets('green-light')).toEqual({
      logo: '/brand/favicon_green.ico', title: '/brand/title.webp', decoration: '/brand/GreenCircle.webp',
    })
    expect(getBrandAssets('red-dark')).toEqual(getBrandAssets('dark'))
    setColorTheme('green-light')
    expect(document.querySelector('link[rel="icon"]').type).toBe('image/x-icon')
  })

  it('falls back consistently for invalid family and mode combinations', () => {
    expect(getColorThemeParts('invalid')).toEqual({ family: 'blue', mode: 'light' })
    expect(getColorThemeFor('invalid', 'dark')).toBe('dark')
    expect(getColorThemeFor('green', 'invalid')).toBe('green-light')
  })
  beforeEach(() => {
    document.head.innerHTML = '<link rel="icon" type="image/x-icon" href="/favicon.ico">'
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-color-theme')
    document.documentElement.removeAttribute('data-ui-mode')
  })

  it.each(['blue', 'light', 'green', 'dark'])('selects existing %s brand assets and updates the browser icon', theme => {
    const assets = getBrandAssets(theme)
    expect(assets.logo).toBe(`/brand/theme-previews/favicon-${theme}.png`)
    expect(assets.title).toBe(theme === 'blue' ? '/brand/title.webp' : `/brand/theme-previews/title-${theme}.png`)
    expect(assets.decoration).toBe(theme === 'blue' ? '/brand/BlueCircle.webp' : `/brand/theme-previews/logo-${theme}.png`)
    const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public')
    for (const path of Object.values(assets)) expect(existsSync(resolve(publicDir, path.slice(1)))).toBe(true)
    setColorTheme(theme)
    expect(document.querySelector('link[rel="icon"]').getAttribute('href')).toBe(assets.logo)
    expect(document.querySelector('link[rel="icon"]').type).toBe('image/png')
  })

  it('falls back to blue brand assets for an unsupported theme', () => {
    expect(getBrandAssets('invalid')).toEqual(getBrandAssets('blue'))
  })

  it('defaults to the blue theme when no stored theme exists', () => {
    expect(getStoredColorTheme()).toBe(COLOR_THEME_DEFAULT)

    initializeUiPreferences()

    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_BLUE)
  })

  it('persists and applies supported color themes', () => {
    const theme = setColorTheme(COLOR_THEME_DARK)

    expect(theme).toBe(COLOR_THEME_DARK)
    expect(window.localStorage.getItem('dialects-color-theme')).toBe(COLOR_THEME_DARK)
    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_DARK)

    window.localStorage.setItem('dialects-color-theme', COLOR_THEME_LIGHT)

    initializeUiPreferences()

    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_LIGHT)
  })

  it('falls back to blue for unsupported stored themes', () => {
    window.localStorage.setItem('dialects-color-theme', 'pink')

    expect(getStoredColorTheme()).toBe(COLOR_THEME_BLUE)

    initializeUiPreferences()

    expect(document.documentElement.dataset.colorTheme).toBe(COLOR_THEME_BLUE)
  })
})
