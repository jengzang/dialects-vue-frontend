import { beforeEach, describe, expect, it } from 'vitest'

import {
  COLOR_THEME_BLUE,
  COLOR_THEME_DARK,
  COLOR_THEME_DEFAULT,
  COLOR_THEME_LIGHT,
  getStoredColorTheme,
  initializeUiPreferences,
  setColorTheme,
} from '../src/composables/core/uiPreferences.js'

describe('uiPreferences color theme', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-color-theme')
    document.documentElement.removeAttribute('data-ui-mode')
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
