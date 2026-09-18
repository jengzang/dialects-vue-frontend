import { createApp, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({
  getVocabularyLocations: vi.fn(),
  setVocabularyEntryCreateLocationName: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@/api', () => apiMocks)

vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({
  default: {
    name: 'SimpleSelectDropdownStub',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: `
      <select
        data-testid="location-select"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    `,
  },
}))

vi.mock('@/main/components/TableAndTree/UniversalTable.vue', () => ({
  default: {
    name: 'UniversalTableStub',
    props: [
      'dbKey',
      'tableName',
      'columns',
      'primaryKey',
      'apiAdapter',
      'canEdit',
      'defaultFilter',
    ],
    methods: {
      serialize(value) {
        return JSON.stringify(value)
      },
    },
    template: `
      <div
        data-testid="universal-table"
        :data-default-filter="serialize(defaultFilter)"
        :data-columns="serialize(columns)"
      />
    `,
  },
}))

const { default: ManageEntriesSection } = await import('../src/main/views/explore/word/vocabulary/ManageEntriesSection.vue')

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function mountManageEntriesSection(props = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(ManageEntriesSection, {
    hasVocabularyPermission: true,
    managePermissionLevel: 'edit',
    manageUserId: 7,
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

async function flushPromises() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

beforeEach(() => {
  apiMocks.getVocabularyLocations.mockReset()
  apiMocks.setVocabularyEntryCreateLocationName.mockReset()
  document.body.innerHTML = ''
})

describe('vocabulary manage entry scoping', () => {
  it('waits for the edit user location scope before mounting the entries table', async () => {
    const locationsRequest = deferred()
    apiMocks.getVocabularyLocations.mockReturnValueOnce(locationsRequest.promise)

    const wrapper = mountManageEntriesSection()

    expect(apiMocks.getVocabularyLocations).toHaveBeenCalledWith({
      user_id: 7,
      page_size: 200,
    })
    expect(wrapper.host.querySelector('[data-testid="universal-table"]')).toBeNull()

    locationsRequest.resolve({
      locations: [
        { location_name: '甲地' },
        { location_name: '乙地' },
      ],
    })
    await flushPromises()

    const table = wrapper.host.querySelector('[data-testid="universal-table"]')
    expect(table).not.toBeNull()
    expect(JSON.parse(table.dataset.defaultFilter)).toEqual({
      location_name: ['甲地'],
    })
    expect(apiMocks.setVocabularyEntryCreateLocationName).toHaveBeenLastCalledWith('甲地')

    const locationSelect = wrapper.host.querySelector('[data-testid="location-select"]')
    locationSelect.value = '乙地'
    locationSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()

    expect(JSON.parse(table.dataset.defaultFilter)).toEqual({
      location_name: ['乙地'],
    })
    expect(apiMocks.setVocabularyEntryCreateLocationName).toHaveBeenLastCalledWith('乙地')

    wrapper.unmount()
  })

  it('does not scope manage users to one user location set', async () => {
    apiMocks.getVocabularyLocations.mockResolvedValueOnce({ locations: [] })

    const wrapper = mountManageEntriesSection({
      managePermissionLevel: 'manage',
      manageUserId: 7,
    })
    await flushPromises()

    expect(apiMocks.getVocabularyLocations).not.toHaveBeenCalled()
    const table = wrapper.host.querySelector('[data-testid="universal-table"]')
    expect(JSON.parse(table.dataset.defaultFilter)).toBeNull()
    expect(JSON.parse(table.dataset.columns).some((column) => column.key === 'location_name')).toBe(true)

    wrapper.unmount()
  })
})
