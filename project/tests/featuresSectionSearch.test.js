import { createApp, defineComponent, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FeaturesSection from '../src/main/components/FeaturesSection.vue'
import zhCN from '../src/i18n/locales/zh-CN'
import zhHant from '../src/i18n/locales/zh-Hant'
import en from '../src/i18n/locales/en'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/en', fullPath: '/en', query: {}, params: { locale: 'en' } }),
}))

function mountFeaturesSection(locale = 'en') {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-Hant',
    messages: {
      'zh-CN': zhCN,
      'zh-Hant': zhHant,
      en,
    },
  })

  const RouterLinkStub = defineComponent({
    props: {
      to: {
        type: [String, Object],
        required: true,
      },
    },
    template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>',
  })

  const app = createApp(FeaturesSection)
  app.use(i18n)
  app.component('RouterLink', RouterLinkStub)
  app.mount(host)

  return {
    host,
    async search(value) {
      const input = host.querySelector('input[type="search"]')
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
    },
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('features section search', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('matches feature entries across all supported home locales', async () => {
    const wrapper = mountFeaturesSection('en')

    await wrapper.search('查中古')

    expect(wrapper.host.textContent).toContain('Middle Chinese')
    expect(wrapper.host.textContent).not.toContain('No matching features')

    wrapper.unmount()
  })

  it('matches group titles and descriptions across all supported home locales', async () => {
    const wrapper = mountFeaturesSection('en')

    await wrapper.search('地图可视化')

    expect(wrapper.host.textContent).toContain('Map View')
    expect(wrapper.host.textContent).toContain('Dialect Regions')
    expect(wrapper.host.textContent).not.toContain('No matching features')

    wrapper.unmount()
  })

  it.each([
    ['zh-CN', '开发历程'],
    ['zh-Hant', '開發歷程'],
    ['en', 'Development History'],
  ])('includes the Development History route in the About group for %s', (locale, label) => {
    const wrapper = mountFeaturesSection(locale)
    const historyLink = [...wrapper.host.querySelectorAll('.feature-tile')]
      .find(link => link.getAttribute('href')?.endsWith('/menu/about/history'))

    expect(historyLink).toBeTruthy()
    expect(historyLink.textContent).toContain(label)

    wrapper.unmount()
  })
})
