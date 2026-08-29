import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

const submitSuggestionMock = vi.fn()
const showSuccessMock = vi.fn()
const showErrorMock = vi.fn()
const capturePageSnapshotMock = vi.fn()

let route

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: { value: 'zh-CN' },
    t: (key) => key,
  }),
}))

vi.mock('../src/i18n/index.js', () => ({
  default: {
    global: {
      messages: {
        value: {
          'zh-CN': {
            about: {
              intro: {
                features: {},
              },
            },
          },
        },
      },
    },
  },
}))

vi.mock('../src/api/main/suggestions.js', () => ({
  SUGGESTION_CATEGORY_OPTIONS: ['general', 'bug', 'feature', 'data_issue', 'ui'],
  submitSuggestion: submitSuggestionMock,
}))

vi.mock('../src/utils/share/pageSnapshot.js', () => ({
  capturePageSnapshot: capturePageSnapshotMock,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}))

vi.mock('../src/components/common/TabsContainer.vue', () => ({
  default: {
    props: ['tabs', 'modelValue', 'routeValue', 'resolveRoute'],
    template: '<section data-tabs-container><slot :current-tab="modelValue" /></section>',
  },
}))

vi.mock('../src/components/selector/SimpleSelectDropdown.vue', () => ({
  default: {
    props: ['modelValue', 'options', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <div data-simple-select-dropdown>
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :data-feedback-category="option.value"
          :data-active="modelValue === option.value"
          :disabled="disabled"
          @click="$emit('update:modelValue', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    `,
  },
}))

vi.mock('../src/components/selector/CheckBox.vue', () => ({
  default: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <label data-include-screenshot>
        <input
          type="checkbox"
          :checked="modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
        >
        <slot />
      </label>
    `,
  },
}))

vi.mock('../src/main/components/user/popups/SupportPopup.vue', () => ({
  default: {
    props: ['visible'],
    emits: ['close'],
    template: '<div v-if="visible" data-support-popup-stub></div>',
  },
}))

function aboutPageSource() {
  return readFileSync('src/main/views/menu/support/AboutPage.vue', 'utf8')
}

async function mountAboutPage() {
  const { default: AboutPage } = await import('../src/main/views/menu/support/AboutPage.vue')
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(AboutPage)
  app.config.globalProperties.$t = (key) => key
  app.component('RouterLink', {
    props: {
      to: {
        type: [String, Object],
        default: '',
      },
    },
    template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>',
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

describe('AboutPage suggestion form', () => {
  beforeEach(() => {
    vi.resetModules()
    route = reactive({
      path: '/menu/about/suggestion',
      fullPath: '/menu/about/suggestion?from=footer',
      query: { from: 'footer' },
      params: { section: 'suggestion' },
      hash: '',
    })
    submitSuggestionMock.mockReset()
    showSuccessMock.mockReset()
    showErrorMock.mockReset()
    capturePageSnapshotMock.mockReset()
    capturePageSnapshotMock.mockResolvedValue('data:image/webp;base64,shot')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the in-page site feedback form below the existing external feedback cards', async () => {
    const wrapper = await mountAboutPage()
    await nextTick()

    const cards = wrapper.host.querySelector('.card-links')
    const form = wrapper.host.querySelector('[data-about-suggestion-form]')

    expect(cards).toBeTruthy()
    expect(form).toBeTruthy()
    expect(cards.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(wrapper.host.querySelector('[data-app-modal]')).toBeNull()
    expect(wrapper.host.querySelector('[data-simple-select-dropdown]')).toBeTruthy()

    wrapper.unmount()
  })

  it('submits site feedback from the suggestion page with route context', async () => {
    submitSuggestionMock.mockResolvedValue({ success: true, id: 31 })

    const wrapper = await mountAboutPage()
    await nextTick()

    wrapper.host.querySelector('[data-feedback-category="data_issue"]').click()
    wrapper.host.querySelector('[name="title"]').value = '字表问题'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '这个页面里的资料说明需要补充。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="contact"]').value = 'reader@example.com'
    wrapper.host.querySelector('[name="contact"]').dispatchEvent(new Event('input'))
    await nextTick()

    wrapper.host.querySelector('[data-submit-feedback]').click()
    await nextTick()
    await nextTick()

    expect(submitSuggestionMock).toHaveBeenCalledWith({
      title: '字表问题',
      content: '这个页面里的资料说明需要补充。',
      category: 'data_issue',
      source_path: '/menu/about/suggestion',
      contact: 'reader@example.com',
      context: {
        path: '/menu/about/suggestion',
        fullPath: '/menu/about/suggestion?from=footer',
        query: { from: 'footer' },
        hash: '',
        locale: 'zh-CN',
        pageTitle: 'navigation.pageTitles.support.aboutSuggestion',
      },
      image_base64: '',
    })
    expect(showSuccessMock).toHaveBeenCalledWith('layoutFooter.feedback.success')
    expect(showErrorMock).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('keeps the suggestion page form on shared controls and style primitives', () => {
    const source = aboutPageSource()

    expect(source).toContain('<SimpleSelectDropdown')
    expect(source).toContain('<CheckBox')
    expect(source).toContain('class="glass-field"')
    expect(source).toContain('class="glass-button')
    expect(source).toContain('class="surface-panel suggestion-form-section"')
    expect(source).toContain('class="surface-subpanel screenshot-preview"')
    expect(source).not.toContain('<AppModal')
  })

  it('stacks the external cards above the in-page feedback form', () => {
    const source = aboutPageSource()
    const pageBlock = source.match(/\.page2\s*\{[\s\S]*?\n\}/)?.[0]

    expect(pageBlock).toContain('@include flex-col;')
  })
})
