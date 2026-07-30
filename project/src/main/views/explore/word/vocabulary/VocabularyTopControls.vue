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
            ref="searchFieldTriggerEl"
            class="select-trigger global-select-trigger filter-select-trigger"
            :class="{ 'is-open': searchFieldDropdownOpen }"
            type="button"
            @click="searchFieldDropdownOpen = !searchFieldDropdownOpen"
          >
            <span class="select-label">{{ searchFieldTriggerLabel }}</span>
            <span
              class="select-arrow"
              aria-hidden="true"
            >⌄</span>
          </button>
          <MultiSelectDropdown
            v-if="searchFieldDropdownOpen"
            :model-value="selectedSearchFields"
            :options="searchFieldOptions"
            :trigger-el="searchFieldTriggerEl"
            align="right"
            direction="down"
            @update:model-value="emit('update:selectedSearchFields', $event)"
            @close="searchFieldDropdownOpen = false"
          />
        </div>
      </div>

      <div class="view-mode-selector">
        <button
          v-for="mode in viewModes"
          :key="mode.key"
          class="mode-btn"
          :class="{ active: viewMode === mode.key }"
          type="button"
          :title="mode.label"
          @click="emit('update:viewMode', mode.key)"
        >
          <span>{{ mode.label }}</span>
        </button>
      </div>
    </div>

    <div class="filter-strip">
      <div
        v-if="viewMode === 'map'"
        class="standard-word-filter"
      >
        <SimpleSelectDropdown
          :model-value="selectedStandardWord"
          :options="standardWordOptions"
          :placeholder="t('words.wordList.search.standardWordPlaceholder')"
          :disabled="standardWordOptions.length === 0"
          searchable
          match-trigger-width
          width="100%"
          @update:model-value="emit('update:selectedStandardWord', $event)"
        />
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
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const { t } = useI18n()

const props = defineProps({
  query: { type: String, default: '' },
  selectedSearchFields: { type: Array, default: () => [] },
  selectedLocations: { type: Array, default: () => [] },
  selectedStandardWord: { type: String, default: '' },
  viewMode: { type: String, default: 'card' },
  searchFieldOptions: { type: Array, default: () => [] },
  locationOptions: { type: Array, default: () => [] },
  standardWordOptions: { type: Array, default: () => [] },
  viewModes: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:query',
  'update:selectedSearchFields',
  'update:selectedLocations',
  'update:selectedStandardWord',
  'update:viewMode',
])

const searchInputEl = ref(null)
const searchFieldTriggerEl = ref(null)
const locationTriggerEl = ref(null)
const searchFieldDropdownOpen = ref(false)
const locationDropdownOpen = ref(false)

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

const searchFieldTriggerLabel = computed(() => {
  if (!props.selectedSearchFields.length) {
    return t('words.wordList.search.fields.all')
  }

  return formatMultiSelectLabel(
    props.selectedSearchFields,
    props.searchFieldOptions,
    t('words.wordList.search.fields.all'),
  )
})

const locationTriggerLabel = computed(() => {
  return formatMultiSelectLabel(
    props.selectedLocations,
    props.locationOptions,
    t('words.wordList.search.locationPlaceholder'),
  )
})
</script>

<style scoped>
.top-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  margin: 0 auto 24px;
}

.search-container,
.search-section,
.filter-strip {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-container {
  /* flex: 1 1 320px; */
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
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
  resize: vertical;
}

.field-filter {
  position: relative;
  flex: 0 1 136px;
  min-width: 112px;
}

.location-filter {
  position: relative;
  width: 100%;
}

.standard-word-filter {
  width: 100%;
}

.filter-select-trigger {
  width: 100%;
}

.location-select-trigger {
  width: 100%;
}

.select-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.view-mode-selector {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.mode-btn {
  display: inline-flex;
  min-width: 56px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.mode-btn.active {
  color: var(--text-primary);
  background: var(--glass-30);
  border-color: var(--color-primary-hover);
}

.filter-strip {
  flex: 1 1 220px;
  min-width: 180px;
}

@media (max-aspect-ratio: 1 / 1) {
  .top-controls {
    flex-direction: column;
    gap: 10px;
  }

  .search-container {
    flex-wrap: wrap;
  }

  .search-section {
    flex: 1 1 100%;
    min-width: 100%;
    flex-wrap: wrap;
  }

  .field-filter {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .view-mode-selector {
    width: 100%;
  }

  .mode-btn {
    flex: 1;
  }

  .filter-strip {
    flex: 1 1 100%;
    /* flex-wrap: wrap; */
    min-width: 100%;
  }
}
</style>
