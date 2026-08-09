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

function mountOverlay(src = '/test-image.webp', alt = 'Test image', siblingImages = []) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  let onClose
  let onNavigate
  const app = createApp({
    template: `
      <ImagePreviewOverlay
        :src="src"
        :alt="alt"
        :sibling-images="siblingImages"
        @close="onClose"
        @navigate="onNavigate"
      />
    `,
    data() {
      return {
        src,
        alt,
        siblingImages,
      }
    },
    methods: {
      onClose() {
        this.src = ''
        this.alt = ''
        this.siblingImages = []
      },
      onNavigate({ src: newSrc, alt: newAlt }) {
        this.src = newSrc
        this.alt = newAlt
      },
    },
    components: {},
  })

  return import('../src/components/common/ImagePreviewOverlay.vue').then((mod) => {
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

describe('ImagePreviewOverlay', () => {
  beforeEach(() => {
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

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })

  it('toggles zoom on double-click', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')
    expect(img).toBeTruthy()

    expect(img.style.transform).toContain('scale(1)')

    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(2)')

    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1)')

    wrapper.unmount()
  })

  it('zooms with mouse wheel', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    img.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1.12)')

    img.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1)')

    wrapper.unmount()
  })

  it('resets to initial state on close', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    img.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1.12)')

    const closeBtn = document.querySelector('.image-preview-overlay .close-btn')
    closeBtn.click()
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })

  it('zooms with + and - keys', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '=', bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1.25)')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1)')

    wrapper.unmount()
  })

  it('resets with 0 key', async () => {
    const wrapper = await mountOverlay()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    img.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1.12)')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(1)')

    wrapper.unmount()
  })

  it('shows nav arrows with siblings and navigates', async () => {
    const siblings = [
      { src: '/img1.webp', alt: 'First' },
      { src: '/img2.webp', alt: 'Second' },
      { src: '/img3.webp', alt: 'Third' },
    ]
    const wrapper = await mountOverlay('/img2.webp', 'Second', siblings)
    await nextTick()

    expect(document.querySelector('.image-preview-overlay__nav--prev')).toBeTruthy()
    expect(document.querySelector('.image-preview-overlay__nav--next')).toBeTruthy()

    const prevBtn = document.querySelector('.image-preview-overlay__nav--prev')
    prevBtn.click()
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')
    expect(img.getAttribute('src')).toBe('/img1.webp')

    wrapper.unmount()
  })

  it('hides nav arrows when only one image', async () => {
    const wrapper = await mountOverlay('/img1.webp', 'Only')
    await nextTick()

    expect(document.querySelector('.image-preview-overlay__nav--prev')).toBeNull()
    expect(document.querySelector('.image-preview-overlay__nav--next')).toBeNull()

    wrapper.unmount()
  })

  it('navigates with arrow keys when siblings present and not shift', async () => {
    const siblings = [
      { src: '/img1.webp', alt: 'First' },
      { src: '/img2.webp', alt: 'Second' },
    ]
    const wrapper = await mountOverlay('/img1.webp', 'First', siblings)
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()

    expect(document.querySelector('.image-preview-overlay__img').getAttribute('src')).toBe('/img2.webp')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await nextTick()

    expect(document.querySelector('.image-preview-overlay__img').getAttribute('src')).toBe('/img1.webp')

    wrapper.unmount()
  })

  it('shifts pan with arrow keys when zoomed (shift or no siblings)', async () => {
    const siblings = [
      { src: '/img1.webp', alt: 'First' },
      { src: '/img2.webp', alt: 'Second' },
    ]
    const wrapper = await mountOverlay('/img1.webp', 'First', siblings)
    await nextTick()

    const img = document.querySelector('.image-preview-overlay__img')

    // Zoom in so panning is active
    img.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await nextTick()
    expect(img.style.transform).toContain('scale(2)')

    // With siblings, shift+ArrowRight should pan instead of navigate
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    await nextTick()
    // src should still be img1 (panned, not navigated)
    expect(img.getAttribute('src')).toBe('/img1.webp')

    wrapper.unmount()
  })
})
