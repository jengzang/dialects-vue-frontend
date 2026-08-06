<template>
  <div class="top-controls">
    <div class="search-container">
      <div class="search-section">
        <div class="input-wrapper">
          <textarea
            ref="searchInputEl"
            :value="query"
            class="search-input"
            rows="1"
            :placeholder="t('words.wordList.search.placeholder')"
            @input="emit('update:query', ($event.target).value)"
          />
        </div>

        <div class="field-filter">
          <button
            class="gear-btn main-glass-button"
            type="button"
            :title="t('words.wordList.search.settings')"
            @click="searchFieldModalOpen = true"
          >
            <span aria-hidden="true">⚙️</span>
          </button>
          <AppModal
            v-model="searchFieldModalOpen"
            :title="t('words.wordList.search.settings')"
            size="sm"
            :close-label="t('common.button.close')"
            @close="searchFieldModalOpen = false"
          >
            <div class="search-field-modal">
              <h4 class="search-field-modal-title">
                {{ t('words.wordList.search.filterTitle') }}
              </h4>
              <CheckBox
                v-for="field in searchFieldOptions"
                :key="field.value"
                :model-value="isFieldChecked(field.value)"
                :label="field.label"
                @update:model-value="(val) => toggleField(field.value, val)"
              />
            </div>
            <div class="search-field-mode-section">
              <h4 class="search-field-modal-title">
                {{ t('words.wordList.search.standardWordFilterMode') }}
              </h4>
              <SwitchToggle
                v-model="localSingleSelect"
                :show-label="true"
                :active-text="t('words.wordList.search.singleSelect')"
                :inactive-text="t('words.wordList.search.multiSelect')"
              />
            </div>
          </AppModal>
        </div>
      </div>

    </div>

    <div class="filter-strip">
      <div
        v-if="viewMode === 'map'"
        class="standard-word-filter"
      >
        <SimpleSelectDropdown
          v-if="singleSelect"
          :model-value="selectedStandardWord"
          :options="standardWordOptions"
          :placeholder="t('words.wordList.search.standardWordPlaceholder')"
          :disabled="standardWordOptions.length === 0"
          searchable
          match-trigger-width
          width="100%"
          @update:model-value="emit('update:selectedStandardWord', $event)"
        />
        <template v-else>
          <button
            ref="standardWordTriggerEl"
            class="select-trigger global-select-trigger standard-word-select-trigger"
            :class="{ 'is-open': standardWordDropdownOpen, 'is-disabled': standardWordOptions.length === 0 }"
            type="button"
            :disabled="standardWordOptions.length === 0"
            @click="standardWordDropdownOpen = !standardWordDropdownOpen"
          >
            <span class="select-label">{{ standardWordTriggerLabel }}</span>
            <span
              class="select-arrow"
              aria-hidden="true"
            >⌄</span>
          </button>
          <MultiSelectDropdown
            v-if="standardWordDropdownOpen"
            :model-value="selectedStandardWords"
            :options="multiStandardWordOptions"
            :trigger-el="standardWordTriggerEl"
            align="left"
            direction="down"
            @update:model-value="emit('update:selectedStandardWords', $event)"
            @close="standardWordDropdownOpen = false"
          />
        </template>
      </div>

      <div class="location-filter">
        <button
          ref="locationTriggerEl"
          class="select-trigger global-select-trigger location-select-trigger"
          :class="{ 'is-open': locationDropdownOpen, 'is-disabled': locationOptions.length === 0 }"
          type="button"
          :disabled="locationOptions.length === 0"
          @click="locationDropdownOpen = !locationDropdownOpen"
        >
          <span class="select-label">{{ locationTriggerLabel }}</span>
          <span
            class="select-arrow"
            aria-hidden="true"
          >⌄</span>
        </button>
        <MultiSelectDropdown
          v-if="locationDropdownOpen"
          :model-value="selectedLocations"
          :options="locationOptions"
          :trigger-el="locationTriggerEl"
          align="left"
          direction="down"
          @update:model-value="emit('update:selectedLocations', $event)"
          @close="locationDropdownOpen = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const { t } = useI18n()

const props = defineProps({
  query: { type: String, default: '' },
  selectedSearchFields: { type: Array, default: () => [] },
  selectedLocations: { type: Array, default: () => [] },
  selectedStandardWord: { type: String, default: '' },
  selectedStandardWords: { type: Array, default: () => [] },
  singleSelect: { type: Boolean, default: true },
  viewMode: { type: String, default: 'card' },
  searchFieldOptions: { type: Array, default: () => [] },
  locationOptions: { type: Array, default: () => [] },
  standardWordOptions: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:query',
  'update:selectedSearchFields',
  'update:selectedLocations',
  'update:selectedStandardWord',
  'update:selectedStandardWords',
  'update:singleSelect',
])

const searchInputEl = ref(null)
const locationTriggerEl = ref(null)
const standardWordTriggerEl = ref(null)
const searchFieldModalOpen = ref(false)
const locationDropdownOpen = ref(false)
const standardWordDropdownOpen = ref(false)

function formatMultiSelectLabel(selectedValues, options, placeholder) {
  const selectedLabels = selectedValues
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean)

  if (!selectedLabels.length) {
    return placeholder
  }

  if (selectedLabels.length === 1) {
    return selectedLabels[0]
  }

  return `${selectedLabels[0]} +${selectedLabels.length - 1}`
}

const localSingleSelect = computed({
  get: () => props.singleSelect,
  set: (val) => emit('update:singleSelect', val),
})

const multiStandardWordOptions = computed(() =>
  props.standardWordOptions.filter((o) => o.value !== ''),
)

function isFieldChecked(value) {
  return props.selectedSearchFields.length === 0 || props.selectedSearchFields.includes(value)
}

function toggleField(value, checked) {
  const allValues = props.searchFieldOptions.map((o) => o.value)
  const current = props.selectedSearchFields.length === 0
    ? [...allValues]
    : [...props.selectedSearchFields]

  const updated = checked
    ? [...new Set([...current, value])]
    : current.filter((v) => v !== value)

  const allChecked = allValues.every((v) => updated.includes(v))
  emit('update:selectedSearchFields', allChecked ? [] : updated)
}

const locationTriggerLabel = computed(() => {
  return formatMultiSelectLabel(
    props.selectedLocations,
    props.locationOptions,
    t('words.wordList.search.locationPlaceholder'),
  )
})

const standardWordTriggerLabel = computed(() => {
  return formatMultiSelectLabel(
    props.selectedStandardWords,
    multiStandardWordOptions.value,
    t('words.wordList.search.standardWordPlaceholder'),
  )
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.top-controls {
  // border: 1px solid var(--glass-30);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  width: min(100%, 1180px);
  margin: 0 auto 20px;
}

.search-container,
.search-section,
.filter-strip {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-container {
  flex: 1 1 auto;
  min-width: 0;
}

.search-section {
  flex: 1;
  min-width: 0;
}

.input-wrapper {
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  color: var(--text-primary);
  background: var(--glass-10);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md, 8px);
  resize: vertical;
}

.field-filter {
  flex: 0 0 auto;
}

.gear-btn {
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  font-size: 18px;
  line-height: 1;
}

.search-field-modal {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  justify-items: center;
}

.search-field-modal-title {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.search-field-mode-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--glass-30);
}

.location-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.standard-word-filter {
  width: 100%;
}

// .location-select-trigger {
//   width: 100%;
// }

.select-label {
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
  text-align: left;
  @include text-truncate;
}

.select-arrow {
  flex: 0 0 auto;
  margin-left: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  transition: transform 0.18s ease;
}

.select-trigger.is-open .select-arrow {
  transform: rotate(180deg);
}

.filter-strip {
  flex: 0 0 auto;
  min-width: 180px;
}

@media (max-aspect-ratio: 1 / 1) {
  .top-controls {
    @include flex-col;
    gap: 10px;
  }

  .search-container {
    width: 100%;
  }

  .search-section {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .field-filter {
    flex: 0 0 auto;
  }

  .filter-strip {
    flex: 1 1 100%;
    min-width: 100%;
  }
}
</style>
