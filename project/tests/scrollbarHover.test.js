import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initializeScrollbarHover } from '../src/utils/ui/scrollbarHover.js'

const expandedClass = 'ui-scrollbar--expanded'
let dispose
let scroller

function geometry(element, values) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(element, key, { configurable: true, value })
  }
}

function pointer(type, target, x, y, pointerType = 'mouse') {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

describe('shared native scrollbar hover', () => {
  beforeEach(() => {
    scroller = document.createElement('div')
    scroller.style.border = '2px solid black'
    scroller.style.overflow = 'auto'
    scroller.getBoundingClientRect = () => ({ left: 20, top: 30, width: 300, height: 200 })
    geometry(scroller, { offsetWidth: 300, offsetHeight: 200, clientWidth: 292, clientHeight: 192, clientLeft: 2, scrollWidth: 900, scrollHeight: 1000 })
    document.body.append(scroller)
    dispose = initializeScrollbarHover()
  })

  afterEach(() => {
    dispose()
    document.body.replaceChildren()
    for (const key of ['clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight']) {
      delete document.documentElement[key]
    }
  })

  it('keeps content and borders narrow, expands the vertical gutter, and shrinks on return', () => {
    pointer('pointermove', scroller, 100, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
    pointer('pointermove', scroller, 319, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
    pointer('pointermove', scroller, 316, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(true)
    pointer('pointermove', scroller, 100, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
  })

  it('detects the horizontal scrollbar without expanding other scrollers', () => {
    pointer('pointermove', scroller, 100, 226)
    expect(scroller.classList.contains(expandedClass)).toBe(true)
    expect(document.documentElement.classList.contains(expandedClass)).toBe(false)
  })

  it('keeps the gutter expanded during drag and recalculates on release', () => {
    pointer('pointerdown', scroller, 316, 100)
    pointer('pointermove', document.body, 100, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(true)
    pointer('pointerup', document.body, 100, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
  })

  it('uses viewport geometry for the document scrollbar', () => {
    const root = document.documentElement
    geometry(root, { clientWidth: innerWidth - 4, clientHeight: innerHeight, scrollWidth: innerWidth - 4, scrollHeight: innerHeight + 1000 })
    pointer('pointermove', document.body, 100, 100)
    expect(root.classList.contains(expandedClass)).toBe(false)
    pointer('pointermove', root, innerWidth - 2, 100)
    expect(root.classList.contains(expandedClass)).toBe(true)
    expect(document.body.classList.contains(expandedClass)).toBe(true)
    pointer('pointermove', document.body, 100, 100)
    expect(root.classList.contains(expandedClass)).toBe(false)
    expect(document.body.classList.contains(expandedClass)).toBe(false)
  })

  it('supports a scrollbar on the left and CSS scale transforms', () => {
    geometry(scroller, { clientLeft: 6 })
    pointer('pointermove', scroller, 24, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(true)
    pointer('pointermove', scroller, 316, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
    geometry(scroller, { clientLeft: 2 })
    scroller.getBoundingClientRect = () => ({ left: 20, top: 30, width: 150, height: 100 })
    pointer('pointermove', scroller, 168, 80)
    expect(scroller.classList.contains(expandedClass)).toBe(true)
  })

  it('ignores touch input and reserved gutters without overflow', () => {
    pointer('pointermove', scroller, 316, 100, 'touch')
    expect(scroller.classList.contains(expandedClass)).toBe(false)
    geometry(scroller, { scrollHeight: 192, scrollWidth: 292 })
    pointer('pointermove', scroller, 316, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
  })

  it('clears state on focus loss and removes listeners on disposal', () => {
    pointer('pointerdown', scroller, 316, 100)
    window.dispatchEvent(new Event('blur'))
    expect(scroller.classList.contains(expandedClass)).toBe(false)
    pointer('pointermove', scroller, 316, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(true)
    dispose()
    pointer('pointermove', scroller, 316, 100)
    expect(scroller.classList.contains(expandedClass)).toBe(false)
  })
})
