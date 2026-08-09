import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@/api/auth/httpClient.js', () => ({
  api: mocks.api,
}))

vi.mock('@/components/common/AppModal.vue', () => ({
  default: defineComponent({
    name: 'AppModalStub',
    props: {
      modelValue: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-testid="clip-modal"><slot /><slot name="footer" /></div>',
  }),
}))

vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({
  default: defineComponent({
    name: 'SimpleSelectDropdownStub',
    props: {
      modelValue: { type: String, default: '' },
      options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    template: `
      <select
        data-testid="level-select"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    `,
  }),
}))

vi.mock('@/components/common/SwitchToggle.vue', () => ({
  default: defineComponent({
    name: 'SwitchToggleStub',
    props: {
      modelValue: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    template: `
      <button
        data-testid="high-precision-toggle"
        type="button"
        :disabled="disabled"
        :data-active="modelValue ? 'true' : 'false'"
        @click="$emit('update:modelValue', !modelValue)"
      />
    `,
  }),
}))

vi.mock('@/components/selector/CheckBox.vue', () => ({
  default: defineComponent({
    name: 'CheckBoxStub',
    props: {
      modelValue: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    template: `
      <label data-testid="clip-option">
        <input
          type="checkbox"
          :checked="modelValue"
          :disabled="disabled"
          @change="$emit('update:modelValue', $event.target.checked)"
        >
        <slot />
      </label>
    `,
  }),
}))

import ClipBoundaryModal from '../src/main/components/map/Draw/modals/ClipBoundaryModal.vue'

async function flushTicks(count = 4) {
  for (let index = 0; index < count; index += 1) {
    await nextTick()
    await Promise.resolve()
  }
}

function mountClipBoundaryModal(props) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(ClipBoundaryModal, props)
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('ClipBoundaryModal state restore', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    mocks.api.mockReset()
  })

  it('restores selected high precision ids and loads their option labels on reopen', async () => {
    let resolveOptions
    mocks.api.mockReturnValue(new Promise((resolve) => {
      resolveOptions = resolve
    }))

    const wrapper = mountClipBoundaryModal({
      modelValue: true,
      highPrecision: true,
      boundaryConfig: {
        enabled: true,
        level: 'cities',
        highPrecision: true,
        selectedIds: ['city-2'],
        selectedNames: ['佛山'],
      },
      boundaryOptions: {
        country: [{ label: '中国', value: '中国' }],
        provinces: [],
        cities: [],
        counties: [],
      },
    })

    await flushTicks()

    expect(mocks.api).toHaveBeenCalledWith('/api/gis/children?deep=1')
    expect(wrapper.host.querySelector('.main-glass-button[data-variant="primary"]').disabled).toBe(true)

    resolveOptions({
      items: [
        { id: 'city-1', name: '广州' },
        { id: 'city-2', name: '佛山' },
      ],
    })
    await flushTicks()

    const selectedOption = [...wrapper.host.querySelectorAll('[data-testid="clip-option"]')]
      .find((item) => item.textContent.includes('佛山'))
    expect(selectedOption).toBeTruthy()
    expect(selectedOption.querySelector('input').checked).toBe(true)
    expect(wrapper.host.querySelector('.main-glass-button[data-variant="primary"]').disabled).toBe(false)

    wrapper.unmount()
  })
})
