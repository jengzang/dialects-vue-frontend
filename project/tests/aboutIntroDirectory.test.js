import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import AboutIntro from '../src/main/views/menu/support/about/AboutIntro.vue'

vi.mock('../src/main/views/menu/support/about/AboutFeatureTopology.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/menu/about/intro' }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale: { value: 'zh-CN' }, t: key => key }),
}))

vi.mock('../src/i18n/index.js', () => ({
  default: {
    global: {
      messages: {
        value: {
          'zh-CN': {
            about: {
              intro: {
                features: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [
                  `feature${index + 1}`,
                  { heading: `章节 ${index + 1}`, subtitle: '', intro: '', items: [] },
                ])),
              },
            },
          },
        },
      },
    },
  },
}))

let app
let host

function mountIntro() {
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(AboutIntro)
  app.config.globalProperties.$t = key => key
  app.component('RouterLink', { template: '<a><slot /></a>' })
  app.mount(host)
}

afterEach(() => {
  app?.unmount()
  host?.remove()
  app = null
  host = null
  vi.restoreAllMocks()
})

describe('About intro directory', () => {
  it('lists all ten feature sections and the acknowledgements in reading order', () => {
    mountIntro()
    const targets = [...host.querySelectorAll('[data-intro-directory-target]')]
    expect(targets).toHaveLength(11)
    expect(targets.map(target => target.id)).toEqual([
      ...Array.from({ length: 10 }, (_, index) => `intro-feature-${index + 1}`),
      'intro-thanks',
    ])
    expect(host.querySelectorAll('[data-intro-directory-item]')).toHaveLength(11)
  })

  it('jumps to a feature and closes the portrait directory', async () => {
    mountIntro()
    const target = host.querySelector('#intro-feature-3')
    target.scrollIntoView = vi.fn()
    host.querySelector('[data-intro-directory-toggle]').click()
    await nextTick()
    expect(host.querySelector('[data-intro-directory-toggle]').getAttribute('aria-expanded')).toBe('true')

    host.querySelector('[data-intro-directory-item="intro-feature-3"]').click()
    await nextTick()
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(host.querySelector('[data-intro-directory-toggle]').getAttribute('aria-expanded')).toBe('false')
    expect(host.querySelector('[data-intro-directory-item="intro-feature-3"]').getAttribute('aria-current')).toBe('location')
  })

  it('marks the current section as the page scrolls', async () => {
    mountIntro()
    const targets = [...host.querySelectorAll('[data-intro-directory-target]')]
    targets.forEach((target, index) => {
      target.getBoundingClientRect = () => ({ top: index < 4 ? -100 : index === 4 ? 100 : 900 })
    })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(host.querySelector('[data-intro-directory-item="intro-feature-5"]').getAttribute('aria-current')).toBe('location')
  })
})
