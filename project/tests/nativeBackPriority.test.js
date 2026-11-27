import { describe, expect, it, vi } from 'vitest'
import { createNativeBackRegistry } from '../src/platform/backRegistry.js'

describe('native back overlay stack', () => {
  it('closes the top visible overlay only and cleans up after unmount', () => {
    const changed = vi.fn()
    const registry = createNativeBackRegistry(changed)
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    outer.style.zIndex = '100'
    inner.style.zIndex = '200'
    document.body.append(outer, inner)
    const closeOuter = vi.fn()
    const closeInner = vi.fn()
    const removeOuter = registry.add(outer, closeOuter)
    const removeInner = registry.add(inner, closeInner)
    expect(registry.closeTop()).toBe(true)
    expect(closeInner).toHaveBeenCalledOnce()
    expect(closeOuter).not.toHaveBeenCalled()
    removeInner()
    expect(registry.closeTop()).toBe(true)
    expect(closeOuter).toHaveBeenCalledOnce()
    removeOuter()
    expect(registry.closeTop()).toBe(false)
    outer.remove(); inner.remove()
  })
  it('ignores hidden and detached overlays', () => {
    const registry = createNativeBackRegistry()
    const element = document.createElement('div')
    document.body.append(element)
    element.style.display = 'none'
    const close = vi.fn()
    registry.add(element, close)
    expect(registry.closeTop()).toBe(false)
    element.style.display = ''
    expect(registry.closeTop()).toBe(true)
    element.remove()
    expect(registry.closeTop()).toBe(false)
  })
})

it('leaves browser back handling untouched', async () => {
  const { initializeNativeBackPriority, vNativeBack, nativeBackRegistry } = await import('../src/platform/backRegistry.js')
  const globals = {}
  const element = document.createElement('div')
  document.body.append(element)
  const close = vi.fn()
  const dispose = initializeNativeBackPriority(globals)
  vNativeBack.mounted(element, { value: close })
  expect(globals.__dialectsHandleBack).toBeUndefined()
  expect(nativeBackRegistry.closeTop()).toBe(false)
  dispose()
  element.remove()
})
