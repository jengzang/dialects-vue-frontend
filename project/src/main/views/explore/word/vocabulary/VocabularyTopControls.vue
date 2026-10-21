<template>
  <div
    class="top-controls query-controls-layout"
    :class="source === 'vocabulary' ? 'query-controls--vocabulary' : 'query-controls--notes'"
  >
    <div class="search-container">
      <div class="search-section">
        <div class="input-wrapper">
          <textarea
            ref="searchInputEl"
            :value="inputText"
            class="search-input"
            rows="1"
            :placeholder="source === 'character-notes' ? t('words.wordList.notes.searchPlaceholder') : t('words.wordList.search.placeholder')"
            @compositionstart="handleCompositionStart"
            @compositionend="handleCompositionEnd"
            @input="handleInput"
          />
        </div>

        <button
          v-if="deferQuery && source !== 'character-notes'"
          class="query-submit query-search-action action-btn"
          data-variant="primary"
          type="button"
          @click="submitSearch"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {{ t('common.button.search') }}
        </button>

      </div>

      <div v-if="source === 'character-notes'" class="notes-search-settings">
        <div class="notes-mode-actions">
          <component
            :is="deferQuery ? 'button' : ActionButton"
            class="notes-refresh-action"
            :class="{ 'query-search-action glass-button': deferQuery }"
            :data-variant="deferQuery ? 'primary' : undefined"
            :variant="deferQuery ? undefined : 'blue'"
            type="button"
            :disabled="notesRefreshDisabled"
            @click="refreshNotes"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <template v-if="deferQuery">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </template>
              <path v-else d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
            </svg>
            <span>{{ t(deferQuery ? 'common.button.search' : 'words.wordList.notes.refreshResults') }}</span>
          </component>
        </div>
        <div class="field-filter">
          <button
            class="gear-btn"
            type="button"
            :title="t('words.wordList.search.settings')"
            @click="searchFieldModalOpen = true"
          >
            <span aria-hidden="true"><InlineIcon icon="⚙️" /></span>
          </button>
        </div>
      </div>

      <div v-else class="field-filter">
        <button
          class="gear-btn"
          type="button"
          :title="t('words.wordList.search.settings')"
          @click="searchFieldModalOpen = true"
        >
          <span aria-hidden="true"><InlineIcon icon="⚙️" /></span>
        </button>
        <button
          class="pill-btn location-details-btn"
          type="button"
          :title="t('words.wordList.search.locationDetails')"
          @click="emit('openLocationDetails')"
        >
          {{ t('words.wordList.search.locationDetailsButton') }}
        </button>
      </div>
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
          <div class="search-field-options">
            <CheckBox
              v-for="field in searchFieldOptions"
              :key="field.value"
              :model-value="isFieldChecked(field.value)"
              :label="field.label"
              @update:model-value="(val) => toggleField(field.value, val)"
            />
          </div>
        </div>
        <div v-if="source === 'vocabulary'" class="search-field-mode-section">
          <h4 class="search-field-modal-title">
            {{ t('words.wordList.search.filterModeTitle') }}
          </h4>
          <RadioGroup
            :model-value="filterMode"
            name="vocabulary-filter-mode"
            :options="filterModeOptions"
            @update:model-value="emit('update:filterMode', $event)"
          />
        </div>
        <div v-if="source === 'vocabulary'" class="search-field-mode-section">
          <h4 class="search-field-modal-title">
            {{ t('words.wordList.search.standardWordFilterMode') }}
          </h4>
          <SwitchToggle
            v-model="localSingleSelect"
            :show-label="true"
            :active-text="t('words.wordList.search.singleSelect')"
            :inactive-text="t('words.wordList.search.multiSelect')"
            label-position="inside"
            auto-width
          />
        </div>
        <div v-if="source === 'character-notes'" class="search-field-mode-section">
          <h4 class="search-field-modal-title">
            {{ t('words.wordList.viewModes.label') }}
          </h4>
          <SwitchToggle
            :model-value="viewMode === 'list'"
            :show-label="true"
            :active-text="t('words.wordList.viewModes.list')"
            :inactive-text="t('words.wordList.viewModes.card')"
            label-position="inside"
            auto-width
            @update:model-value="emit('update:viewMode', $event ? 'list' : 'card')"
          />
        </div>
      </AppModal>

    </div>

    <div
      :id="source === 'character-notes' ? 'vocabulary-notes-scope-filter' : undefined"
      class="filter-strip"
      :class="{ 'notes-scope-filter': source === 'character-notes' }"
    >
      <div v-if="source !== 'character-notes'" class="query-range">
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
              class="select-trigger standard-word-select-trigger"
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

        <div
          v-if="filterMode === 'location'"
          class="location-filter"
        >
          <button
            ref="locationTriggerEl"
            class="select-trigger location-select-trigger"
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
            :search-normalizer="normalizeLocationSearchText"
            align="left"
            direction="down"
            @update:model-value="emit('update:selectedLocations', $event)"
            @close="locationDropdownOpen = false"
          />
        </div>

        <div
          v-else-if="filterMode === 'administrative'"
          class="location-filter"
        >
          <SimpleSelectDropdown
            :model-value="selectedProvince"
            :options="provinceOptions"
            :placeholder="t('words.wordList.search.provincePlaceholder')"
            match-trigger-width
            width="100%"
            @update:model-value="emit('update:selectedProvince', $event)"
            @open-change="setFilterDropdownOpen('province', $event)"
          />
          <SimpleSelectDropdown
            :model-value="selectedCity"
            :options="cityOptions"
            :placeholder="t('words.wordList.search.cityPlaceholder')"
            :disabled="!selectedProvince"
            match-trigger-width
            width="100%"
            @update:model-value="emit('update:selectedCity', $event)"
            @open-change="setFilterDropdownOpen('city', $event)"
          />
        </div>
        <div
          v-else
          class="location-filter"
          :class="{ 'partition-filter': ['yindian', 'map'].includes(filterMode) }"
        >
          <RegionSelector
            :mode="filterMode"
            :selected="selectedRegions"
            :nodes="partitionNodes"
            :loading="partitionLoading"
            :error="partitionError"
            :allow-custom-regions="false"
            :max-selected="50"
            :max-path-length="200"
            @update:selected="emit('update:selectedRegions', $event)"
            @open-change="setFilterDropdownOpen('region', $event)"
          />
          <button v-if="partitionError" class="pill-btn" type="button" @click="emit('retryPartitions')">
            {{ t('common.errorBoundary.retry') }}
          </button>
        </div>
      </div>
      <div v-if="source === 'vocabulary'" class="query-mode-controls">
        <span v-if="deferQuery" class="query-condition-label">{{ t('words.wordList.viewModes.label') }}</span>
        <div class="result-view-switcher view-mode-selector" role="group" :aria-label="t('words.wordList.viewModes.label')">
          <button
            v-for="mode in ['table', 'card', 'map']"
            :key="mode"
            class="mode-btn"
            :class="{ active: viewMode === mode }"
            type="button"
            :aria-label="t(`words.wordList.viewModes.${mode}`)"
            :title="t(`words.wordList.viewModes.${mode}`)"
            :aria-pressed="viewMode === mode"
            @click="emit('update:viewMode', mode)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <template v-if="mode === 'table'">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="9" x2="9" y2="21" />
                <line x1="15" y1="9" x2="15" y2="21" />
              </template>
              <template v-else-if="mode === 'card'">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </template>
              <template v-else>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </template>
            </svg>
            <span class="mode-label">{{ t(`words.wordList.viewModes.${mode}`) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as OpenCCT2CN from 'opencc-js/t2cn'
import AppModal from '@/components/common/AppModal.vue'
import ActionButton from '@/main/components/user/auth/ActionButton.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import RegionSelector from '@/main/components/geo/RegionSelector.vue'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { showConfirm } from '@/utils/ui/message.js'

const { t } = useI18n()

const locationSearchT2S = OpenCCT2CN.Converter({ from: 'tw', to: 'cn' })

// 地点候选可能混用繁简，统一转简体后匹配，避免输入简体搜不到繁体地点。
function normalizeLocationSearchText(value) {
  return locationSearchT2S(String(value || '')).toLowerCase()
}

const props = defineProps({
  deferQuery: { type: Boolean, default: false },
  source: { type: String, default: 'vocabulary' },
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
  filterMode: { type: String, default: 'location' },
  selectedRegions: { type: Array, default: () => [] },
  partitionNodes: { type: Array, default: () => [] },
  partitionLoading: { type: Boolean, default: false },
  partitionError: { type: String, default: '' },
  selectedProvince: { type: String, default: '' },
  selectedCity: { type: String, default: '' },
  provinceOptions: { type: Array, default: () => [] },
  cityOptions: { type: Array, default: () => [] },
  notesRefreshDisabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'search',
  'update:query',
  'update:selectedSearchFields',
  'update:selectedLocations',
  'update:selectedStandardWord',
  'update:selectedStandardWords',
  'update:singleSelect',
  'update:viewMode',
  'update:filterMode',
  'update:selectedRegions',
  'retryPartitions',
  'update:selectedProvince',
  'update:selectedCity',
  'refreshNotes',
  'openLocationDetails',
  'filterOpenChange',
])

const searchInputEl = ref(null)
const locationTriggerEl = ref(null)
const standardWordTriggerEl = ref(null)
const searchFieldModalOpen = ref(false)
const locationDropdownOpen = ref(false)
const standardWordDropdownOpen = ref(false)
const filterDropdownOpen = ref({})
const isFilterOpen = computed(() => locationDropdownOpen.value || Object.values(filterDropdownOpen.value).some(Boolean))

function setFilterDropdownOpen(name, open) {
  filterDropdownOpen.value = { ...filterDropdownOpen.value, [name]: open }
}

watch(isFilterOpen, open => emit('filterOpenChange', open), { flush: 'sync' })
onBeforeUnmount(() => {
  if (isFilterOpen.value) emit('filterOpenChange', false)
  clearTimeout(searchTimer)
})
const filterModeOptions = computed(() => [
  { value: 'location', label: t('words.wordList.search.filterByLocation') },
  { value: 'administrative', label: t('words.wordList.search.filterByAdministrative') },
  { value: 'yindian', label: t('words.wordList.search.filterByYindian') },
  { value: 'map', label: t('words.wordList.search.filterByAtlas') },
])

watch(() => props.filterMode, () => {
  locationDropdownOpen.value = false
  filterDropdownOpen.value = {}
})

function refreshNotes() {
  if (props.notesRefreshDisabled || isComposing.value) return
  clearTimeout(searchTimer)
  emit('update:query', inputText.value)
  emit('refreshNotes')
  if (props.deferQuery) emit('search')
}

const inputText = ref(props.query)
const isComposing = ref(false)
let searchTimer = null

watch(() => props.query, (val) => {
  inputText.value = val
})

watch(() => props.source, () => {
  clearTimeout(searchTimer)
  inputText.value = props.query
})

watch(() => props.deferQuery, (defer) => {
  if (defer) clearTimeout(searchTimer)
})

function handleCompositionStart() {
  isComposing.value = true
  clearTimeout(searchTimer)
}

function handleCompositionEnd(e) {
  isComposing.value = false
  inputText.value = e.target.value
  scheduleSearchEmit()
}

function handleInput(e) {
  inputText.value = e.target.value
  if (isComposing.value) return
  scheduleSearchEmit()
}

function scheduleSearchEmit() {
  clearTimeout(searchTimer)
  if (props.deferQuery) return
  searchTimer = setTimeout(() => {
    if (!props.deferQuery) emit('update:query', inputText.value)
  }, 500)
}

function submitSearch() {
  if (isComposing.value) return
  clearTimeout(searchTimer)
  emit('update:query', inputText.value)
  emit('search')
}

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

let isConfirmingNotesPronunciation = false

async function toggleField(value, checked) {
  if (isConfirmingNotesPronunciation) return

  const allValues = props.searchFieldOptions.map((o) => o.value)
  const current = props.selectedSearchFields.length === 0
    ? [...allValues]
    : [...props.selectedSearchFields]

  const updated = checked
    ? [...new Set([...current, value])]
    : current.filter((v) => v !== value)

  const allChecked = allValues.every((v) => updated.includes(v))
  if (props.source === 'character-notes'
    && !current.includes('pronunciation')
    && (!updated.length || updated.includes('pronunciation'))) {
    isConfirmingNotesPronunciation = true
    try {
      const confirmed = await showConfirm(t('words.wordList.notes.ipaSearchConfirm'), {
        title: t('words.wordList.notes.ipaSearchConfirmTitle'),
      })
      if (!confirmed) return
    } finally {
      isConfirmingNotesPronunciation = false
    }
  }
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
@use '@/components/selector/selector' as *;

.top-controls {
  // border: 1px solid var(--glass-30);
  display: flex;
  // flex-wrap: wrap;
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

.query-range,
.query-mode-controls {
  display: contents;
}

.query-mode-controls > .result-view-switcher {
  order: -1;
}

.result-view-switcher {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  padding: 4px;
  background: var(--glass-60);
  border: 0.5px solid var(--glass-80);
  border-radius: var(--radius-md);
  box-shadow:
    0 4px 24px rgba(var(--color-shadow-rgb), 0.06),
    0 2px 6px rgba(var(--color-shadow-rgb), 0.04),
    inset 0 1px 0 var(--glass-90);
  @include glass-blur(30px, 180%);
}

.mode-btn {
  @include flex-center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  color: var(--text-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(.active) {
    color: var(--text-primary);
    background: rgba(var(--color-shadow-rgb), 0.04);
  }

  &.active {
    color: var(--color-primary);
    background: var(--glass-50);
    box-shadow:
      0 1px 3px rgba(var(--color-shadow-rgb), 0.08),
      0 1px 2px rgba(var(--color-shadow-rgb), 0.06);

    :root[data-color-theme='green'] &,
    :root[data-color-theme='dark'] & {
      color: var(--text-primary);
      background: var(--surface-panel-strong);
    }
  }
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
  min-height: calc(40px + var(--query-input-growth, 0px));
  padding: 10px 12px;
  color: var(--text-primary);
  background: var(--glass-10);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md, 8px);
  resize: vertical;
}

.notes-refresh-action.action-button {
  padding: 6px 10px;
  font-size: 14px;
}

.notes-mode-actions {
  @include flex-col;
  flex: 0 0 auto;
  gap: 10px;
  align-items: center;
}

.notes-search-settings {
  @include flex-col;
  flex: 0 0 auto;
  gap: 10px;
  align-items: center;
}

.field-filter {
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  align-items: center;
}

.gear-btn {
  appearance: none;
  border: 1px solid transparent;
  outline: none;
  background: transparent;
  box-shadow: none;

  margin: 0;
  padding: 5px;

  width: 32px;
  height: 32px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  font-size: 20px;
  line-height: 1;
  cursor: pointer;

  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  span {
    display: inline-flex;
    transition: transform 0.4s ease;
  }

  &:hover {
    background: var(--glass-10);
    border-color: var(--color-primary-border);
    color: var(--color-primary);
  }

  &:hover span {
    transform: rotate(90deg);
  }

  &:active {
    transform: scale(0.92);
  }
}

.location-details-btn {
  // padding: 0 4px;
  font-size: 14px;
  white-space: nowrap;
}

.search-field-modal {
  display: grid;
  gap: 12px;
}

.search-field-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
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
  gap: 10px;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.standard-word-filter {
  width: 100%;
}

.location-filter > .region-select {
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
  flex: 0 1 auto;
  flex-wrap: nowrap;
  min-width: 180px;
  max-width: 100%;

  .location-filter,
  .standard-word-filter {
    flex: 1 1 0;
    min-width: 0;
    width: auto;
  }
  .partition-filter {
    min-width: 200px;
  }

  .location-select-trigger,
  .standard-word-select-trigger { min-width: 0; max-width: 100%; }
}

@media (max-aspect-ratio: 1 / 1) {
  .mode-btn {
    width: 32px;
    padding: 0;
  }

  .mode-label { display: none; }

  .top-controls {
    @include flex-col;
    gap: 10px;
  }

  .search-container {
    width: 100%;
  }

  .search-section {
    flex: 1 1 100%;
    // min-width: 100%;
  }

  .field-filter {
    flex: 0 0 auto;
  }

  .notes-search-settings { flex-direction: row; }

  .filter-strip {
    flex: 1 1 100%;
    min-width: 100%;
  }
}
</style>
