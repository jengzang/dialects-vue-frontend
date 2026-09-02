import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const submitSuggestionMock = vi.fn()
const showSuccessMock = vi.fn()
const showErrorMock = vi.fn()
const capturePageSnapshotMock = vi.fn()

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

vi.mock('../src/components/common/AppModal.vue', () => ({
  default: {
    props: ['modelValue', 'title'],
    emits: ['update:modelValue', 'close'],
    template: `
      <section v-if="modelValue" data-app-modal>
        <h2>{{ title }}</h2>
        <slot />
        <slot name="footer" />
      </section>
    `,
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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

function mountModal(component, props = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component, {
    modelValue: true,
    pageTitle: '查中古',
    sourcePath: '/menu/query/zhonggu',
    context: { path: '/menu/query/zhonggu', fullPath: '/menu/query/zhonggu', locale: 'zh-CN' },
    ...props,
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

describe('LayoutFeedbackModal', () => {
  beforeEach(() => {
    vi.resetModules()
    submitSuggestionMock.mockReset()
    showSuccessMock.mockReset()
    showErrorMock.mockReset()
    capturePageSnapshotMock.mockReset()
    capturePageSnapshotMock.mockResolvedValue('data:image/webp;base64,shot')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('submits typed feedback with selected category and context', async () => {
    submitSuggestionMock.mockResolvedValue({ success: true, id: 12 })

    const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
    const wrapper = mountModal(LayoutFeedbackModal)
    await nextTick()

    wrapper.host.querySelector('[data-feedback-category="bug"]').click()
    wrapper.host.querySelector('[name="title"]').value = '地图没有刷新'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '切换分区后地图颜色没有变化。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))
    await nextTick()

    wrapper.host.querySelector('[data-submit-feedback]').click()
    await nextTick()
    await nextTick()

    expect(submitSuggestionMock).toHaveBeenCalledWith({
      title: '地图没有刷新',
      content: '切换分区后地图颜色没有变化。',
      category: 'bug',
      source_path: '/menu/query/zhonggu',
      contact: '',
      context: {
        path: '/menu/query/zhonggu',
        fullPath: '/menu/query/zhonggu',
        locale: 'zh-CN',
        pageTitle: '查中古',
      },
      image_base64: '',
    })
    expect(showSuccessMock).toHaveBeenCalledWith('layoutFooter.feedback.success')

    wrapper.unmount()
  })

  it('uses SimpleSelectDropdown for the feedback category control', () => {
    const source = readFileSync('src/main/components/footer/LayoutFeedbackModal.vue', 'utf8')

    expect(source).toContain('SimpleSelectDropdown')
    expect(source).not.toContain('ChoiceSelector')
  })

  it('shows a validation message for backend 422 responses', async () => {
    submitSuggestionMock.mockRejectedValue({ status: 422 })

    const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
    const wrapper = mountModal(LayoutFeedbackModal)
    await nextTick()

    wrapper.host.querySelector('[name="title"]').value = '截图太大'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '后端返回字段或截图不合法。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))
    await nextTick()

    wrapper.host.querySelector('[data-submit-feedback]').click()
    await nextTick()
    await nextTick()

    expect(showErrorMock).toHaveBeenCalledWith('layoutFooter.feedback.validationFailed')

    wrapper.unmount()
  })

  it('includes a compressed screenshot when the user opts in', async () => {
    submitSuggestionMock.mockResolvedValue({ success: true, id: 13 })

    const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
    const wrapper = mountModal(LayoutFeedbackModal)
    await nextTick()

    wrapper.host.querySelector('[name="title"]').value = '页面截图'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '附上截图方便定位。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))
    const screenshotInput = wrapper.host.querySelector('[data-include-screenshot] input')
    screenshotInput.checked = true
    screenshotInput.dispatchEvent(new Event('change'))
    await nextTick()
    await nextTick()

    expect(wrapper.host.querySelector('.screenshot-preview img')?.getAttribute('src'))
      .toBe('data:image/webp;base64,shot')

    wrapper.host.querySelector('[data-submit-feedback]').click()
    await nextTick()
    await nextTick()

    expect(submitSuggestionMock).toHaveBeenCalledWith(expect.objectContaining({
      image_base64: 'data:image/webp;base64,shot',
    }))

    wrapper.unmount()
  })

  it('does not start a second screenshot capture when submitted while preview is still rendering', async () => {
    const resolvers = []
    capturePageSnapshotMock.mockImplementation(() => new Promise((resolve) => {
      resolvers.push(resolve)
    }))

    const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
    const wrapper = mountModal(LayoutFeedbackModal)
    await nextTick()

    wrapper.host.querySelector('[name="title"]').value = '截图生成中'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '还在生成预览时按下回车。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))
    const screenshotInput = wrapper.host.querySelector('[data-include-screenshot] input')
    screenshotInput.checked = true
    screenshotInput.dispatchEvent(new Event('change'))
    await nextTick()

    wrapper.host.querySelector('form').dispatchEvent(new Event('submit', {
      bubbles: true,
      cancelable: true,
    }))
    await nextTick()

    expect(capturePageSnapshotMock).toHaveBeenCalledTimes(1)
    expect(submitSuggestionMock).not.toHaveBeenCalled()

    resolvers.forEach(resolve => resolve('data:image/webp;base64,shot'))
    await nextTick()

    wrapper.unmount()
  })
})
