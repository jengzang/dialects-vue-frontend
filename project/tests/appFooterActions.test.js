import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

globalThis.__WEB_BASE__ = ''

const appFooterSource = () => readFileSync(
  'src/components/footer/AppFooter.vue',
  'utf8',
)

let route
const routerPushMock = vi.fn()
const ensureVisitStatsMock = vi.fn()
const getSourceStatsMock = vi.fn()
const createShareCardDataUrlMock = vi.fn()
const showSuccessMock = vi.fn()
const showErrorMock = vi.fn()
const clipboardWriteTextMock = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: { value: 'zh-CN' },
    t: (key, values = {}) => {
      if (key === 'layoutFooter.pages.generic.title') return '方音图鉴'
      if (key === 'layoutFooter.pages.menuQueryZhonggu.title') return '查中古'
      if (key === 'layoutFooter.pages.menuQueryZhonggu.description') return '按中古地位整理各方言点读音。'
      if (key === 'layoutFooter.language.zhCN') return '简体'
      if (key === 'layoutFooter.theme.green') return '绿色'
      if (key === 'layoutFooter.share.imageReady') return 'layoutFooter.share.imageReady'
      if (key === 'layoutFooter.share.copied') return 'layoutFooter.share.copied'
      return key.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '')
    },
  }),
}))

vi.mock('../src/main/config/layoutFooter.js', () => ({
  resolveLayoutFooterContext: () => ({
    pageTitleKey: 'layoutFooter.pages.menuQueryZhonggu.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryZhonggu.description',
    hasTutorial: true,
    languageLabelKey: 'layoutFooter.language.zhCN',
    themeLabelKey: 'layoutFooter.theme.green',
  }),
}))

vi.mock('../src/utils/user/updateNoticeConfig.js', () => ({
  getHomeUpdateNotice: () => ({
    version: '5.0.0',
    dbVersion: '2026.08',
  }),
}))

vi.mock('../src/composables/core/uiPreferences.js', () => ({
  currentColorTheme: { value: 'green' },
}))

vi.mock('../src/composables/data/useVisitStats.js', () => ({
  useVisitStats: () => ({
    todayVisits: 7,
    totalVisits: 99,
    ensureVisitStats: ensureVisitStatsMock,
  }),
}))

vi.mock('../src/composables/data/useSourceStats.js', () => ({
  getCachedSourceStats: () => ({
    locationCount: 12,
    dataCount: 34,
  }),
  getSourceStats: getSourceStatsMock,
}))

vi.mock('../src/main/store/store.js', () => ({
  requestCurrentTutorialGuideOpen: vi.fn(),
}))

vi.mock('../src/utils/share/shareCard.js', () => ({
  createShareCardDataUrl: createShareCardDataUrlMock,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}))

vi.mock('../src/main/components/footer/LayoutFeedbackModal.vue', () => ({
  default: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div data-feedback-modal-stub></div>',
  },
}))

vi.mock('../src/components/bar/SimpleSidebar.vue', () => ({
  default: {
    props: ['isOpen'],
    emits: ['close'],
    template: '<aside v-if="isOpen" data-simple-sidebar-stub><button type="button" data-close-sidebar @click="$emit(\'close\')">close</button></aside>',
  },
}))

vi.mock('../src/main/components/user/popups/SupportPopup.vue', () => ({
  default: {
    props: ['visible'],
    emits: ['close'],
    template: '<div v-if="visible" data-support-popup-stub><button type="button" data-close-support @click="$emit(\'close\')">close</button></div>',
  },
}))

vi.mock('../src/components/common/AppModal.vue', () => ({
  default: {
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    template: '<section v-if="modelValue" data-app-modal-stub><h2>{{ title }}</h2><slot /></section>',
  },
}))

vi.mock('../src/main/components/FeaturesSection.vue', () => ({
  default: {
    template: '<section data-features-section-stub></section>',
  },
}))

function mountFooter(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component, {
    layoutKind: 'menu',
  })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('AppFooter actions', () => {
  beforeEach(() => {
    route = reactive({
      path: '/menu/query/zhonggu',
      fullPath: '/menu/query/zhonggu',
      query: {},
      params: {},
      hash: '',
    })
    routerPushMock.mockReset()
    ensureVisitStatsMock.mockResolvedValue({ todayVisits: 7, totalVisits: 99 })
    getSourceStatsMock.mockResolvedValue({ locationCount: 12, dataCount: 34 })
    createShareCardDataUrlMock.mockReturnValue('data:image/png;base64,card')
    showSuccessMock.mockReset()
    showErrorMock.mockReset()
    clipboardWriteTextMock.mockReset()
    clipboardWriteTextMock.mockRejectedValue(new Error('clipboard denied'))
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteTextMock },
      configurable: true,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders footer actions, stats, and legal information as separate flat rows', async () => {
    const { default: AppFooter } = await import('../src/components/footer/AppFooter.vue')
    const wrapper = mountFooter(AppFooter)
    await nextTick()

    const footer = wrapper.host.querySelector('[data-app-footer]')
    expect(footer.classList.contains('glass-panel')).toBe(false)
    expect(footer.querySelector('.footer-brand-line')?.getAttribute('aria-hidden')).toBe('true')
    expect(footer.querySelector('.footer-content')).toBeTruthy()
    expect(footer.querySelector('.footer-primary')).toBeTruthy()
    expect(footer.querySelector('.footer-brand-title')?.getAttribute('src')).toBe('/brand/title.webp')
    expect(footer.querySelector('.footer-brand-title')?.getAttribute('alt')).toBe('方音图鉴')
    expect(footer.querySelector('.footer-brand-title')?.classList.contains('title-logo')).toBe(true)
    expect(footer.querySelector('.footer-page-description')?.textContent).toBe('按中古地位整理各方言点读音。')
    expect(footer.querySelector('.footer-primary .footer-actions')).toBeTruthy()
    expect(footer.querySelector('.footer-meta .footer-stats')).toBeTruthy()
    expect(footer.querySelector('.footer-meta .footer-legal')).toBeTruthy()
    expect(footer.querySelector('.footer-meta .footer-theme-label')?.textContent).toBe('绿色')
    expect(footer.querySelector('.page-copy')).toBeNull()
    expect([...footer.querySelectorAll('.footer-action')]
      .some(button => button.classList.contains('glass-button'))).toBe(false)

    wrapper.unmount()
  })

  it('keeps fallback image sharing successful when clipboard copy is denied', async () => {
    const { default: AppFooter } = await import('../src/components/footer/AppFooter.vue')
    const wrapper = mountFooter(AppFooter)
    await nextTick()

    const shareButton = [...wrapper.host.querySelectorAll('.footer-action')]
      .find(button => button.textContent.trim() === 'layoutFooter.actions.share')

    shareButton.click()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(createShareCardDataUrlMock).toHaveBeenCalled()
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
    expect(showSuccessMock).toHaveBeenCalledWith('layoutFooter.share.imageReady')
    expect(showErrorMock).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('opens SimpleSidebar from the i18n menu action', async () => {
    const { default: AppFooter } = await import('../src/components/footer/AppFooter.vue')
    const wrapper = mountFooter(AppFooter)
    await nextTick()

    const menuButton = [...wrapper.host.querySelectorAll('.footer-action')]
      .find(button => button.textContent.trim() === 'layoutFooter.actions.menu')

    expect(menuButton).toBeTruthy()
    expect(wrapper.host.querySelector('[data-simple-sidebar-stub]')).toBeNull()

    menuButton.click()
    await nextTick()

    expect(wrapper.host.querySelector('[data-simple-sidebar-stub]')).toBeTruthy()

    wrapper.host.querySelector('[data-close-sidebar]').click()
    await nextTick()

    expect(wrapper.host.querySelector('[data-simple-sidebar-stub]')).toBeNull()

    wrapper.unmount()
  })

  it('opens the shared FeaturesSection in an AppModal from the first footer action', async () => {
    const { default: AppFooter } = await import('../src/components/footer/AppFooter.vue')
    const wrapper = mountFooter(AppFooter)
    await nextTick()

    const actions = [...wrapper.host.querySelectorAll('.footer-action')]
    expect(actions[0]?.textContent.trim()).toBe('layoutFooter.actions.features')
    expect(wrapper.host.querySelector('[data-app-modal-stub]')).toBeNull()

    actions[0].click()
    await nextTick()

    const modal = wrapper.host.querySelector('[data-app-modal-stub]')
    expect(modal).toBeTruthy()
    expect(modal.textContent).toContain('layoutFooter.actions.features')
    expect(modal.querySelector('[data-features-section-stub]')).toBeTruthy()

    wrapper.unmount()
  })

  it('opens SupportPopup from the i18n support action', async () => {
    const { default: AppFooter } = await import('../src/components/footer/AppFooter.vue')
    const wrapper = mountFooter(AppFooter)
    await nextTick()

    const supportButton = [...wrapper.host.querySelectorAll('.footer-action')]
      .find(button => button.textContent.trim() === 'layoutFooter.actions.support')

    expect(supportButton).toBeTruthy()
    expect(wrapper.host.querySelector('[data-support-popup-stub]')).toBeNull()

    supportButton.click()
    await nextTick()

    expect(wrapper.host.querySelector('[data-support-popup-stub]')).toBeTruthy()

    wrapper.host.querySelector('[data-close-support]').click()
    await nextTick()

    expect(wrapper.host.querySelector('[data-support-popup-stub]')).toBeNull()

    wrapper.unmount()
  })

  it('keeps footer action and meta visual hierarchy tokenized', () => {
    const source = appFooterSource()
    const actionBlock = source.match(/\.footer-action\s*\{[\s\S]*?\n\}/)?.[0]
    const metaInfoBlock = source.match(/\.footer-meta \.info-text\s*\{[\s\S]*?\n\}/)?.[0]
    const themeLabelBlock = source.match(/\.footer-theme-label\s*\{[\s\S]*?\n\}/)?.[0]

    expect(actionBlock).toContain('color: var(--color-primary-hover);')
    expect(actionBlock).toContain('font-weight: 600;')
    expect(metaInfoBlock).toContain('color: var(--text-secondary);')
    expect(metaInfoBlock).toContain('font-size: 13px;')
    expect(themeLabelBlock).toBeTruthy()
    expect(themeLabelBlock).toContain('color: var(--color-primary-hover);')
    expect(source).not.toContain('grid-template-columns:')
    expect(source).toContain('v-if="isMenuOpen"')
    expect(source).toContain('v-if="isSupportOpen"')
  })
})
