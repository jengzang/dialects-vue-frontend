import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

const commonMessages = {
  en: {
    common: {
      button: {
        close: 'Close',
        reset: 'Reset',
      },
    },
  },
}

function mountOverlay(src = '/test-image.webp', alt = 'Test image') {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({
    template: `
      <ImagePreviewOverlay
        :src="src"
        :alt="alt"
        @close="onClose"
      />
    `,
    data() {
      return { src, alt }
    },
    methods: {
      onClose() {
        this.src = ''
        this.alt = ''
      },
    },
    components: {},
  })

  // Use defineAsyncComponent to get the component
  return import('../src/components/common/ImagePreviewOverlay.vue').then((mod) => {
    app._instance?.proxy?.$options?.components
    app.component('ImagePreviewOverlay', mod.default)
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
      messages: commonMessages,
    })
    app.use(i18n)
    app.mount(host)

    return {
      host,
      unmount() {
        app.unmount()
        host.remove()
      },
    }
  })
}

async function openOverlay() {
  const wrapper = await mountOverlay()
  await nextTick()
  return wrapper
}

describe('ImagePreviewOverlay', () => {
  beforeEach(() => {
    // ensure body is clean
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders the overlay with image and title', async () => {
    const wrapper = await mountOverlay('/test.webp', 'My Image')
    await nextTick()

    const overlay = document.querySelector('.image-preview-overlay')
    expect(overlay).toBeTruthy()

    const img = overlay.querySelector('.image-preview-overlay__img')
    expect(img.getAttribute('src')).toBe('/test.webp')

    const title = overlay.querySelector('.image-preview-overlay__title')
    expect(title?.textContent).toBe('My Image')

    wrapper.unmount()
  })

  it('hides title when alt is empty', async () => {
    const wrapper = await mountOverlay('/test.webp', '')
    await nextTick()

    expect(document.querySelector('.image-preview-overlay__title')).toBeNull()
    expect(document.querySelector('.image-preview-overlay__spacer')).toBeTruthy()

    wrapper.unmount()
  })

  it('closes on close button click', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const closeBtn = document.querySelector('.image-preview-overlay .close-btn')
    closeBtn.click()
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })

  it('closes on backdrop click', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const overlay = document.querySelector('.image-preview-overlay')
    overlay.click()
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })

  it('closes on Escape key', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const overlay = document.querySelector('.image-preview-overlay')
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })

  it('toggles zoom on double-click', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')
    expect(img).toBeTruthy()

    // Initial: no zoom
    expect(img.style.transform).toContain('scale(1)')

    // Double-click to zoom to 2x
    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(2)')

    // Double-click again to reset to 1x
    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1)')

    wrapper.unmount()
  })

  it('zooms with mouse wheel', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    // Zoom in (scroll up = negative deltaY)
    img.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1.12)')

    // Zoom out (scroll down = positive deltaY)
    img.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1)')

    // Keep zooming out to below 1 → pans reset
    img.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(0.88)')

    wrapper.unmount()
  })

  it('resets to initial state on close', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    // Zoom in
    img.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1.12)')

    // Close
    const closeBtn = document.querySelector('.image-preview-overlay .close-btn')
    closeBtn.click()
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })
})
