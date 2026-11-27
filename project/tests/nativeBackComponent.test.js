import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
vi.mock('../src/platform/nativeBridge.js', () => ({
  DialectsNative: { setBackBlocked: vi.fn().mockResolvedValue(undefined) },
}))
import AppModal from '../src/components/common/AppModal.vue'
import { initializeNativeBackPriority, nativeBackRegistry, vNativeBack } from '../src/platform/backRegistry.js'

afterEach(() => { delete window.Capacitor })

describe('native modal dismissal', () => {
  it('dismisses a nested modal before its parent without navigating', async () => {
    window.Capacitor = { getPlatform: () => 'ios' }
    const outer = ref(true), inner = ref(true)
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({
      setup: () => () => h('div', [
        h(AppModal, { modelValue: outer.value, 'onUpdate:modelValue': value => { outer.value = value } }),
        h(AppModal, { modelValue: inner.value, 'onUpdate:modelValue': value => { inner.value = value } }),
      ]),
    })
    const dispose = initializeNativeBackPriority()
    app.mount(host)
    await nextTick()
    expect(window.__dialectsHandleBack()).toBe(true)
    expect(inner.value).toBe(false)
    expect(outer.value).toBe(true)
    await nextTick()
    expect(window.__dialectsHandleBack()).toBe(true)
    expect(outer.value).toBe(false)
    await nextTick()
    expect(window.__dialectsHandleBack()).toBe(false)
    app.unmount()
    dispose()
    host.remove()
  })
  it('does not reorder an existing layer when its callback updates', () => {
    window.Capacitor = { getPlatform: () => 'android' }
    const outer = document.createElement('div'), inner = document.createElement('div')
    document.body.append(outer, inner)
    const outerClose = vi.fn(), innerClose = vi.fn()
    vNativeBack.mounted(outer, { value: outerClose })
    vNativeBack.mounted(inner, { value: innerClose })
    vNativeBack.updated(outer, { value: () => outerClose() })
    expect(nativeBackRegistry.closeTop()).toBe(true)
    expect(innerClose).toHaveBeenCalledOnce()
    expect(outerClose).not.toHaveBeenCalled()
    vNativeBack.beforeUnmount(inner)
    vNativeBack.beforeUnmount(outer)
    outer.remove(); inner.remove()
  })
})
