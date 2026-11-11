import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as preferences from '../src/composables/core/uiPreferences.js'

describe('color appearance preference migration and system following', () => {
  let media, listeners
  beforeEach(() => {
    localStorage.clear()
    listeners = new Set()
    media = {
      matches: true,
      addEventListener: (_, listener) => listeners.add(listener),
      removeEventListener: (_, listener) => listeners.delete(listener),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => media))
  })
  afterEach(() => { vi.unstubAllGlobals() })
  function changeSystem(dark) {
    media.matches = dark
    listeners.forEach(listener => listener(media))
  }

  it('defaults to blue and system without saving an implicit selection', () => {
    preferences.initializeColorTheme()
    expect(preferences.currentColorMode.value).toBe('system')
    expect(preferences.currentColorTheme.value).toBe('blue-dark')
    expect(localStorage.getItem('dialects-color-theme')).toBeNull()
    expect(localStorage.getItem('dialects-color-mode')).toBeNull()
    changeSystem(false)
    expect(preferences.currentColorTheme.value).toBe('blue-light')
    expect(localStorage.length).toBe(0)
  })

  it.each([
    ['blue', 'blue-light'], ['light', 'red-light'], ['dark', 'blue-dark'], ['green', 'green-dark'],
    ...['blue-light', 'red-light', 'green-light', 'blue-dark', 'red-dark', 'green-dark'].map(x => [x, x]),
  ])('preserves the existing %s preference as %s even against the OS appearance', (stored, expected) => {
    localStorage.setItem('dialects-color-theme', stored)
    media.matches = !expected.endsWith('dark')
    preferences.initializeColorTheme()
    expect(preferences.currentColorTheme.value).toBe(expected)
    expect(preferences.currentColorMode.value).toBe(expected.endsWith('dark') ? 'dark' : 'light')
    expect(localStorage.getItem('dialects-color-theme')).toBe(expected)
    changeSystem(!media.matches)
    expect(preferences.currentColorTheme.value).toBe(expected)
  })

  it('retains a stored system preference and its color family after reload and OS changes', () => {
    localStorage.setItem('dialects-color-theme', 'red-light')
    localStorage.setItem('dialects-color-mode', 'system')
    preferences.initializeColorTheme()
    expect(preferences.currentColorTheme.value).toBe('red-dark')
    changeSystem(false)
    expect(preferences.currentColorTheme.value).toBe('red-light')
    expect(localStorage.getItem('dialects-color-mode')).toBe('system')
    media.matches = true
    preferences.initializeColorTheme()
    expect(preferences.currentColorTheme.value).toBe('red-dark')
    expect(listeners.size).toBe(1)
  })

  it('keeps system selected when changing family and stops following after selecting a fixed mode', () => {
    preferences.initializeColorTheme()
    preferences.setColorFamily('green')
    expect(preferences.currentColorTheme.value).toBe('green-dark')
    expect(localStorage.getItem('dialects-color-mode')).toBe('system')
    preferences.setColorMode('light')
    changeSystem(false)
    changeSystem(true)
    expect(preferences.currentColorTheme.value).toBe('green-light')
    expect(localStorage.getItem('dialects-color-mode')).toBe('light')
    preferences.setColorMode('system')
    expect(preferences.currentColorTheme.value).toBe('green-dark')
  })

  it('treats unsupported theme records as new users and ignores invalid appearance records', () => {
    localStorage.setItem('dialects-color-theme', 'pink')
    preferences.initializeColorTheme()
    expect(preferences.currentColorMode.value).toBe('system')
    expect(preferences.currentColorTheme.value).toBe('blue-dark')
    localStorage.setItem('dialects-color-theme', 'green')
    localStorage.setItem('dialects-color-mode', 'invalid')
    preferences.initializeColorTheme()
    expect(preferences.currentColorMode.value).toBe('dark')
    expect(preferences.currentColorTheme.value).toBe('green-dark')
  })
})
