import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'

globalThis.__WEB_BASE__ = ''

let route
let confirmMock

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showConfirm: (...args) => confirmMock(...args),
}))

vi.mock('../src/main/components/tutorial/TutorialDiceTrigger.vue', () => ({
  default: {
    props: ['entry', 'hasDiceConfig'],
    emits: ['open', 'apply-dice'],
    template: '<button data-tutorial-trigger @click="$emit(\'open\')">{{ entry.title }}</button>',
  },
}))

vi.mock('../src/main/components/tutorial/TutorialGuideModal.vue', () => ({
  default: {
    props: ['modelValue', 'currentEntry'],
    emits: ['update:model-value'],
    template: '<div v-if="modelValue" data-tutorial-modal>{{ currentEntry.title }}</div>',
  },
}))

vi.mock('../src/main/components/tutorial/tutorialManifest.js', () => ({
  tutorialManifest: [
    {
      key: 'menu-query-zhonggu',
      docKey: 'menu-query-zhonggu',
      categoryKey: 'multiCompare',
      groupKey: 'menuQuery',
      order: 1,
      match: (currentRoute) => currentRoute.path === '/menu/query/zhonggu',
    },
  ],
}))

vi.mock('../src/main/components/tutorial/tutorialMarkdown.js', () => ({
  resolveTutorialDocument: () => ({
    title: '查中古',
    summary: '按中古地位整理各方言点读音。',
  }),
}))

vi.mock('../src/main/config/tutorial/tutorialDiceConfig.js', () => ({
  tutorialDiceConfig: {},
}))

function mountGuide(PageTutorialGuide) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    messages: {
      'zh-CN': {
        tutorial: {
          ui: { missing: '缺少教程' },
          categories: { multiCompare: '多方言点对比分析' },
          groups: { menuQuery: '查询' },
          disclaimer: {
            title: '提示',
            message: '教程内容仅供参考',
            confirm: '知道了',
          },
        },
      },
    },
  })
  const app = createApp(PageTutorialGuide)
  app.use(i18n)
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('tutorial guide open request bridge', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    confirmMock = vi.fn().mockResolvedValue(true)
    route = reactive({
      path: '/menu/query/zhonggu',
      fullPath: '/menu/query/zhonggu',
      query: {},
      params: { sub: 'zhonggu' },
      hash: '',
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('opens the current page tutorial when the shared request token changes', async () => {
    const { default: PageTutorialGuide } = await import('../src/main/components/tutorial/PageTutorialGuide.vue')
    const { requestCurrentTutorialGuideOpen } = await import('../src/main/store/store.js')

    const wrapper = mountGuide(PageTutorialGuide)
    await nextTick()

    expect(wrapper.host.querySelector('[data-tutorial-modal]')).toBeNull()

    requestCurrentTutorialGuideOpen()
    await nextTick()
    await nextTick()

    expect(wrapper.host.querySelector('[data-tutorial-modal]')).toBeTruthy()

    wrapper.unmount()
  })

  it('opens from the shared request when the floating tutorial entry is disabled', async () => {
    localStorage.setItem('tutorial-enabled', 'false')
    const { default: PageTutorialGuide } = await import('../src/main/components/tutorial/PageTutorialGuide.vue')
    const { requestCurrentTutorialGuideOpen } = await import('../src/main/store/store.js')

    const wrapper = mountGuide(PageTutorialGuide)
    await nextTick()

    expect(wrapper.host.querySelector('[data-tutorial-trigger]')).toBeNull()
    expect(wrapper.host.querySelector('[data-tutorial-modal]')).toBeNull()

    requestCurrentTutorialGuideOpen()
    await nextTick()
    await nextTick()

    expect(wrapper.host.querySelector('[data-tutorial-modal]')).toBeTruthy()

    wrapper.unmount()
  })
})
