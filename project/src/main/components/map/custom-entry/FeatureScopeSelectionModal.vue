<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :title="modalTitle"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <template #default>
      <div class="feature-scope-modal">
      <div class="feature-scope-summary main-glass-panel-inner">
        <div class="summary-item">
          <span class="summary-label">{{ t('map.customTab.scopeModal.summary.phonology') }}</span>
          <span class="summary-value">{{ featureMeta?.phonology || t('map.customTab.scopeModal.summary.empty') }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.customTab.scopeModal.summary.records') }}</span>
          <span class="summary-value">{{ featureMeta?.recordCount || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.customTab.scopeModal.summary.locations') }}</span>
          <span class="summary-value">{{ featureMeta?.locationCount || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.customTab.scopeModal.summary.regions') }}</span>
          <span class="summary-value">{{ featureMeta?.regionCount || 0 }}</span>
        </div>
      </div>

      <div v-if="loading" class="feature-scope-state main-list-state main-glass-panel-inner">
        <div class="main-list-state-title">{{ t('map.customTab.scopeModal.loading') }}</div>
      </div>

      <div v-else-if="errorMessage" class="feature-scope-state main-list-state main-glass-panel-inner" data-state="error">
        <div class="main-list-state-title">{{ t('map.customTab.scopeModal.loadFailed') }}</div>
        <p class="main-list-state-text">{{ errorMessage }}</p>
      </div>

      <template v-else>
        <div class="scope-mode-tabs">
          <button
            v-for="option in modeOptions"
            :key="option.value"
            class="scope-mode-btn"
            :class="{ active: currentMode === option.value }"
            type="button"
            @click="handleModeChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div v-if="currentMode === 'all'" class="feature-scope-state main-list-state main-glass-panel-inner">
          <div class="main-list-state-title">{{ t('map.customTab.scopeModal.modes.allTitle') }}</div>
          <p class="main-list-state-text">
            {{ t('map.customTab.scopeModal.modes.allText', { count: featureMeta?.locationCount || 0 }) }}
          </p>
        </div>

        <div v-else-if="currentMode === 'region'" class="scope-selection-list main-glass-panel-inner">
          <button
            v-for="region in regions"
            :key="region.name"
            class="scope-selection-item"
            :class="{ active: selectedRegion === region.name }"
            type="button"
            @click="selectedRegion = region.name"
          >
            <span class="scope-selection-title">{{ region.name || t('map.customTab.scopeModal.summary.empty') }}</span>
            <span class="scope-selection-meta">
              {{ t('map.customTab.scopeModal.regionMeta', { locations: region.locationCount, records: region.recordCount }) }}
            </span>
          </button>
          <div v-if="regions.length === 0" class="feature-scope-state main-list-state">
            <div class="main-list-state-title">{{ t('map.customTab.scopeModal.emptyRegions') }}</div>
          </div>
        </div>

        <div v-else class="scope-selection-list main-glass-panel-inner">
          <label
            v-for="location in locations"
            :key="location.name"
            class="scope-checkbox-item"
          >
            <input
              v-model="selectedLocations"
              type="checkbox"
              :value="location.name"
            >
            <span class="scope-selection-title">{{ location.name }}</span>
            <span class="scope-selection-meta">
              {{ t('map.customTab.scopeModal.locationMeta', { records: location.recordCount, regions: location.regionNames.join('、') || t('map.customTab.scopeModal.summary.empty') }) }}
            </span>
          </label>
          <div v-if="locations.length === 0" class="feature-scope-state main-list-state">
            <div class="main-list-state-title">{{ t('map.customTab.scopeModal.emptyLocations') }}</div>
          </div>
        </div>
      </template>

      </div>
    </template>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="main-glass-button" type="button" @click="handleClose(false)">
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="primary"
          type="button"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          {{ t('map.customTab.scopeModal.confirm') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  featureMeta: {
    type: Object,
    default: () => ({})
  },
  regions: {
    type: Array,
    default: () => []
  },
  locations: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()

const currentMode = ref('all')
const selectedRegion = ref('')
const selectedLocations = ref([])

const modeOptions = computed(() => [
  { value: 'all', label: t('map.customTab.scopeModal.modes.all') },
  { value: 'region', label: t('map.customTab.scopeModal.modes.region') },
  { value: 'location', label: t('map.customTab.scopeModal.modes.location') }
])

const modalTitle = computed(() => t('map.customTab.scopeModal.title', {
  feature: props.featureMeta?.feature || ''
}))

const confirmDisabled = computed(() => {
  if (props.loading || props.errorMessage) return true
  if (currentMode.value === 'region') return !selectedRegion.value
  if (currentMode.value === 'location') return selectedLocations.value.length === 0
  return false
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    currentMode.value = 'all'
    selectedRegion.value = props.regions[0]?.name || ''
    selectedLocations.value = []
  }
})

function handleModeChange(mode) {
  currentMode.value = mode
  if (mode === 'region' && !selectedRegion.value) {
    selectedRegion.value = props.regions[0]?.name || ''
  }
}

function handleClose(value = false) {
  emit('update:modelValue', value)
}

function handleConfirm() {
  emit('confirm', {
    mode: currentMode.value,
    selectedRegion: selectedRegion.value,
    selectedLocations: [...selectedLocations.value]
  })
}
</script>

<style scoped lang="scss">
.feature-scope-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-scope-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
}

.summary-value {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.scope-mode-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scope-mode-btn {
  min-width: 100px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.82);
  color: #334155;
  font-weight: 600;
}

.scope-mode-btn.active {
  background: #007aff;
  color: #fff;
  border-color: #007aff;
}

.scope-selection-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scope-selection-item,
.scope-checkbox-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
}

.scope-selection-item.active {
  border-color: #007aff;
  box-shadow: 0 0 0 1px rgba(0, 122, 255, 0.18);
}

.scope-checkbox-item {
  flex-direction: row;
  align-items: flex-start;
}

.scope-checkbox-item input {
  margin-top: 3px;
}

.scope-selection-title {
  font-weight: 700;
  color: #0f172a;
}

.scope-selection-meta {
  font-size: 13px;
  color: #64748b;
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
