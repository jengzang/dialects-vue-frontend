/* eslint-disable vue/one-component-per-file */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GlobeGLRenderer from '../src/main/components/globe/GlobeGLRenderer.vue'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const globeInstances = []

vi.mock('globe.gl', () => ({
  default: () => (host) => {
    const canvas = document.createElement('canvas')
    host.appendChild(canvas)

    const controls = {}
    const globe = {
      backgroundColor: vi.fn(() => globe),
      backgroundImageUrl: vi.fn(() => globe),
      atmosphereAltitude: vi.fn(() => globe),
      atmosphereColor: vi.fn(() => globe),
      camera: vi.fn(() => ({
        _projPatched: false,
        projectionMatrix: { elements: [] },
        projectionMatrixInverse: { copy: vi.fn(() => ({ invert: vi.fn() })) },
        updateProjectionMatrix: vi.fn(),
      })),
      controls: vi.fn(() => controls),
      enablePointerInteraction: vi.fn(() => globe),
      globeImageUrl: vi.fn(() => globe),
      height: vi.fn(() => globe),
      onPointHover: vi.fn(() => globe),
      pointAltitude: vi.fn(() => globe),
      pointColor: vi.fn(() => globe),
      pointLabel: vi.fn(() => globe),
      pointLat: vi.fn(() => globe),
      pointLng: vi.fn(() => globe),
      pointOfView: vi.fn((nextPointOfView) => nextPointOfView || { lat: 24, lng: 110, altitude: 1.5 }),
      pointRadius: vi.fn(() => globe),
      pointResolution: vi.fn(() => globe),
      pointsData: vi.fn(() => globe),
      renderer: vi.fn(() => ({
        dispose: vi.fn(),
        setClearColor: vi.fn(),
        setPixelRatio: vi.fn(),
      })),
      scene: vi.fn(() => ({ background: null })),
      showGraticules: vi.fn(() => globe),
      width: vi.fn(() => globe),
      _destructor: vi.fn(),
    }

    globeInstances.push({ canvas, globe })
    return globe
  },
}))

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function selectorBlock(source, selector) {
  const start = source.indexOf(selector)
  if (start === -1) return ''
  const open = source.indexOf('{', start)
  if (open === -1) return ''

  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(open + 1, index)
  }
  return ''
}

function createMediaQueryHarness(initialMatches = {}) {
  const queries = new Map()

  function getQuery(query) {
    if (!queries.has(query)) {
      const listeners = new Set()
      queries.set(query, {
        get matches() {
          return Boolean(initialMatches[query])
        },
        addEventListener: vi.fn((eventName, listener) => {
          if (eventName === 'change') listeners.add(listener)
        }),
        removeEventListener: vi.fn((eventName, listener) => {
          if (eventName === 'change') listeners.delete(listener)
        }),
        dispatch(nextMatches) {
          initialMatches[query] = nextMatches
          listeners.forEach((listener) => listener({ matches: nextMatches }))
        },
        listeners,
      })
    }
    return queries.get(query)
  }

  window.matchMedia = vi.fn(getQuery)

  return {
    getQuery,
    set(query, nextMatches) {
      getQuery(query).dispatch(nextMatches)
    },
  }
}

class ResizeObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
}

beforeEach(() => {
  globeInstances.length = 0
  window.ResizeObserver = ResizeObserverMock
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('globe joystick interaction contracts', () => {
  it('uses live input capability media queries instead of UA, width, or touch-only checks', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')

    expect(source).toContain("matchMedia('(orientation: portrait)')")
    expect(source).toContain("matchMedia('(pointer: fine)')")
    expect(source).toContain("matchMedia('(hover: hover)')")
    expect(source).toContain('shouldUseGlobeJoystick')
    expect(source).toContain('!hasPrimaryFinePointer.value')
    expect(source).toContain('!hasPrimaryHover.value')
    expect(source).toContain('watch([shouldUseGlobeJoystick, hasPrimaryFinePointer, hasPrimaryHover]')
    expect(source).not.toContain('ontouchstart')
    expect(source).not.toContain('maxTouchPoints')
    expect(source).not.toContain('innerWidth')
    expect(source).not.toContain('userAgent')
  })

  it('keeps joystick interaction local and pointer-event based', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')
    const styleSource = source.slice(source.indexOf('<style'))
    const containerBlock = selectorBlock(styleSource, '.globegl-container')
    const joystickBlock = selectorBlock(styleSource, '.globe-joystick')

    expect(source).toContain('<Teleport')
    expect(source).toContain(':to="joystickMountTarget"')
    expect(source).toContain('v-if="shouldUseGlobeJoystick"')
    expect(source).toContain('@pointerdown="handleJoystickPointerDown"')
    expect(source).toContain('@pointermove="handleJoystickPointerMove"')
    expect(source).toContain('@pointerup="handleJoystickPointerUp"')
    expect(source).toContain('@pointercancel="handleJoystickPointerCancel"')
    expect(source).toContain("canvas.style.touchAction = controlsInteractionEnabled ? 'none' : 'auto'")
    expect(source).toContain('controls.enabled = controlsInteractionEnabled')
    expect(source).toContain('controls.enableRotate = controlsInteractionEnabled')
    expect(source).toContain('controls.enablePan = controlsInteractionEnabled')
    expect(source).toContain('setPointerCapture')
    expect(source).toContain('releasePointerCapture')
    expect(source).toContain('event.preventDefault()')
    expect(containerBlock).not.toContain('touch-action: none')
    expect(joystickBlock).not.toContain('right:')
    expect(joystickBlock).not.toContain('bottom:')
    expect(joystickBlock).toContain('touch-action: none')
  })

  it('normalizes joystick input to a circular 360 degree vector and drives rotation continuously', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')

    expect(source).toContain('Math.hypot(dx, dy)')
    expect(source).toContain('const maxRadius = getJoystickMaxRadius(rect)')
    expect(source).toContain('const scale = maxRadius / distance')
    expect(source).toContain('x: dx / maxRadius')
    expect(source).toContain('y: dy / maxRadius')
    expect(source).toContain('function curveJoystickVector')
    expect(source).toContain('const curvedStrength = strength * strength')
    expect(source).toContain('GLOBE_JOYSTICK_DEAD_ZONE')
    expect(source).toContain('requestAnimationFrame(applyJoystickRotation)')
    expect(source).toContain('cancelAnimationFrame')
    expect(source).toContain('globe.pointOfView')
  })

  it('derives joystick travel from the home joystick size variable instead of a fixed pixel radius', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')
    const homePage = readSource('src/main/views/HomePage.vue')
    const anchorBlock = selectorBlock(homePage, '.globe-joystick-anchor')
    const joystickBlock = selectorBlock(source.slice(source.indexOf('<style')), '.globe-joystick')

    expect(source).toContain('GLOBE_JOYSTICK_TRAVEL_RATIO')
    expect(source).toContain('rect.width * GLOBE_JOYSTICK_TRAVEL_RATIO')
    expect(source).not.toContain('GLOBE_JOYSTICK_MAX_RADIUS')
    expect(anchorBlock).toContain('--home-globe-joystick-size:')
    expect(anchorBlock).toContain('width: var(--home-globe-joystick-size')
    expect(joystickBlock).toContain('width: var(--home-globe-joystick-size')
  })

  it('styles the joystick with existing design tokens and scoped SCSS', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')
    const styleSource = source.slice(source.indexOf('<style'))
    const joystickBlock = selectorBlock(styleSource, '.globe-joystick')
    const thumbBlock = selectorBlock(styleSource, '.globe-joystick__thumb')

    expect(source).toContain('<style scoped lang="scss">')
    expect(source).toContain("@use '@/styles/global/mixins' as *;")
    expect(joystickBlock).toContain('var(--surface-glass-floating)')
    expect(joystickBlock).toContain('var(--border-glass)')
    expect(joystickBlock).toContain('var(--radius-full)')
    expect(joystickBlock).toContain('var(--shadow-glass)')
    expect(thumbBlock).toContain('var(--color-primary)')
    expect(`${joystickBlock}\n${thumbBlock}`).not.toMatch(/#[0-9a-f]{3,8}/i)
    expect(`${joystickBlock}\n${thumbBlock}`).not.toMatch(/\brgba?\(/)
  })

  it('syncs direct globe drag when mouse-like media query state changes at runtime', async () => {
    const media = createMediaQueryHarness({
      '(orientation: portrait)': false,
      '(pointer: fine)': false,
      '(hover: hover)': false,
    })
    const root = document.createElement('div')
    document.body.appendChild(root)
    const app = createApp(GlobeGLRenderer, { points: [] })

    app.mount(root)
    await nextTick()

    const { canvas, globe } = globeInstances.at(-1)
    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(false)
    const controls = globe.controls()
    expect(controls.enabled).toBe(true)
    expect(controls.enableRotate).toBe(true)
    expect(controls.enablePan).toBe(true)
    expect(canvas.style.touchAction).toBe('none')

    media.set('(pointer: fine)', true)
    await nextTick()

    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(true)
    expect(controls.enabled).toBe(true)
    expect(controls.enableRotate).toBe(true)
    expect(controls.enablePan).toBe(true)
    expect(canvas.style.touchAction).toBe('none')

    media.set('(pointer: fine)', false)
    await nextTick()

    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(false)
    expect(controls.enabled).toBe(true)
    expect(controls.enableRotate).toBe(true)
    expect(controls.enablePan).toBe(true)
    expect(canvas.style.touchAction).toBe('none')

    app.unmount()
    root.remove()
    expect(media.getQuery('(pointer: fine)').listeners.size).toBe(0)
  })

  it('disables orbit controls and restores canvas scrolling while the portrait touch joystick replaces direct globe drag', async () => {
    const media = createMediaQueryHarness({
      '(orientation: portrait)': true,
      '(pointer: fine)': false,
      '(hover: hover)': false,
    })
    const root = document.createElement('div')
    const anchor = document.createElement('div')
    anchor.id = 'home-globe-joystick-anchor'
    document.body.append(root, anchor)
    const app = createApp(GlobeGLRenderer, { points: [] })

    app.mount(root)
    await nextTick()

    const { canvas, globe } = globeInstances.at(-1)
    const controls = globe.controls()
    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(false)
    expect(controls.enabled).toBe(false)
    expect(controls.enableRotate).toBe(false)
    expect(controls.enablePan).toBe(false)
    expect(canvas.style.touchAction).toBe('auto')

    media.set('(pointer: fine)', true)
    await nextTick()

    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(true)
    expect(controls.enabled).toBe(true)
    expect(controls.enableRotate).toBe(true)
    expect(controls.enablePan).toBe(true)
    expect(canvas.style.touchAction).toBe('none')

    app.unmount()
    root.remove()
    anchor.remove()
  })

  it('mounts the portrait touch joystick in the home hero anchor instead of the canvas container', async () => {
    createMediaQueryHarness({
      '(orientation: portrait)': true,
      '(pointer: fine)': false,
      '(hover: hover)': false,
    })
    const root = document.createElement('div')
    const anchor = document.createElement('div')
    anchor.id = 'home-globe-joystick-anchor'
    document.body.append(root, anchor)
    const app = createApp(GlobeGLRenderer, { points: [] })

    app.mount(root)
    await nextTick()

    expect(anchor.querySelector('.globe-joystick')).not.toBeNull()
    expect(root.querySelector('.globegl-container > .globe-joystick')).toBeNull()

    app.unmount()
    root.remove()
    anchor.remove()
  })

  it('keeps the portrait touch joystick when any-input media queries report optional fine or hover capability', async () => {
    createMediaQueryHarness({
      '(orientation: portrait)': true,
      '(pointer: fine)': false,
      '(hover: hover)': false,
      '(any-pointer: fine)': true,
      '(any-hover: hover)': true,
    })
    const root = document.createElement('div')
    const anchor = document.createElement('div')
    anchor.id = 'home-globe-joystick-anchor'
    document.body.append(root, anchor)
    const app = createApp(GlobeGLRenderer, { points: [] })

    app.mount(root)
    await nextTick()

    const { canvas, globe } = globeInstances.at(-1)
    const controls = globe.controls()
    expect(anchor.querySelector('.globe-joystick')).not.toBeNull()
    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(false)
    expect(controls.enabled).toBe(false)
    expect(controls.enableRotate).toBe(false)
    expect(controls.enablePan).toBe(false)
    expect(canvas.style.touchAction).toBe('auto')

    app.unmount()
    root.remove()
    anchor.remove()
  })
})
