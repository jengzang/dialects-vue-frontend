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
  vi.restoreAllMocks()
})

describe('globe joystick interaction contracts', () => {
  it('uses live input capability media queries instead of UA, width, or touch-only checks', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')

    expect(source).toContain("matchMedia('(orientation: portrait)')")
    expect(source).toContain("matchMedia('(any-pointer: fine)')")
    expect(source).toContain("matchMedia('(any-hover: hover)')")
    expect(source).toContain('shouldUseGlobeJoystick')
    expect(source).toContain('!hasFinePointer.value')
    expect(source).toContain('!hasHover.value')
    expect(source).toContain('watch([shouldUseGlobeJoystick, hasFinePointer, hasHover]')
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

    expect(source).toContain('v-if="shouldUseGlobeJoystick"')
    expect(source).toContain('@pointerdown="handleJoystickPointerDown"')
    expect(source).toContain('@pointermove="handleJoystickPointerMove"')
    expect(source).toContain('@pointerup="handleJoystickPointerUp"')
    expect(source).toContain('@pointercancel="handleJoystickPointerCancel"')
    expect(source).toContain("canvas.style.touchAction = directPointerInteractionEnabled ? '' : 'auto'")
    expect(source).toContain('setPointerCapture')
    expect(source).toContain('releasePointerCapture')
    expect(source).toContain('event.preventDefault()')
    expect(containerBlock).not.toContain('touch-action: none')
    expect(joystickBlock).toContain('touch-action: none')
  })

  it('normalizes joystick input to a circular 360 degree vector and drives rotation continuously', () => {
    const source = readSource('src/main/components/globe/GlobeGLRenderer.vue')

    expect(source).toContain('Math.hypot(dx, dy)')
    expect(source).toContain('const scale = GLOBE_JOYSTICK_MAX_RADIUS / distance')
    expect(source).toContain('x: dx / GLOBE_JOYSTICK_MAX_RADIUS')
    expect(source).toContain('y: dy / GLOBE_JOYSTICK_MAX_RADIUS')
    expect(source).toContain('GLOBE_JOYSTICK_DEAD_ZONE')
    expect(source).toContain('requestAnimationFrame(applyJoystickRotation)')
    expect(source).toContain('cancelAnimationFrame')
    expect(source).toContain('globe.pointOfView')
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
      '(any-pointer: fine)': false,
      '(any-hover: hover)': false,
    })
    const root = document.createElement('div')
    document.body.appendChild(root)
    const app = createApp(GlobeGLRenderer, { points: [] })

    app.mount(root)
    await nextTick()

    const { canvas, globe } = globeInstances.at(-1)
    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(false)
    expect(canvas.style.touchAction).toBe('auto')

    media.set('(any-pointer: fine)', true)
    await nextTick()

    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(true)
    expect(canvas.style.touchAction).toBe('')

    media.set('(any-pointer: fine)', false)
    await nextTick()

    expect(globe.enablePointerInteraction).toHaveBeenLastCalledWith(false)
    expect(canvas.style.touchAction).toBe('auto')

    app.unmount()
    root.remove()
    expect(media.getQuery('(any-pointer: fine)').listeners.size).toBe(0)
  })
})
