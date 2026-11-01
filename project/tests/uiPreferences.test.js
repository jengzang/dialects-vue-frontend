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
} from '../src/composables/core/uiPreferences.js'

describe('uiPreferences color theme', () => {
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
