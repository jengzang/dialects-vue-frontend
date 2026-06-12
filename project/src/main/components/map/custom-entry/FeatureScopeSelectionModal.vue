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
          <div class="scope-toolbar main-glass-panel-inner">
            <div class="scope-toolbar-info">
              {{ t('map.customTab.scopeModal.selectedCount', { count: selectedLocations.length }) }}
            </div>
            <button class="scope-clear-btn" type="button" @click="clearSelection">
              {{ t('map.customTab.scopeModal.clearSelection') }}
            </button>
          </div>

          <div class="scope-grid">
            <section class="scope-panel main-glass-panel-inner">
              <div class="scope-panel-title">{{ t('map.customTab.scopeModal.regionTitle') }}</div>
              <div v-if="regions.length === 0" class="feature-scope-state main-list-state">
                <div class="main-list-state-title">{{ t('map.customTab.scopeModal.emptyRegions') }}</div>
              </div>
              <button
                v-for="region in regionOptions"
                :key="region.name"
                class="scope-selection-item"
                :class="[`state-${region.state}`]"
                type="button"
                @click="toggleRegion(region)"
              >
                <span class="scope-selection-title">{{ region.name || t('map.customTab.scopeModal.summary.empty') }}</span>
                <span class="scope-selection-meta">
                  {{ t('map.customTab.scopeModal.regionMeta', { locations: region.locationCount, records: region.recordCount }) }}
                </span>
                <span class="scope-selection-status">{{ t(`map.customTab.scopeModal.regionStates.${region.state}`) }}</span>
              </button>
            </section>

            <section class="scope-panel main-glass-panel-inner">
              <div class="scope-panel-title">{{ t('map.customTab.scopeModal.locationTitle') }}</div>
              <div v-if="locations.length === 0" class="feature-scope-state main-list-state">
                <div class="main-list-state-title">{{ t('map.customTab.scopeModal.emptyLocations') }}</div>
              </div>
              <label
                v-for="location in locations"
                :key="location.name"
                class="scope-checkbox-item"
              >
                <input
                  :checked="selectedLocationSet.has(location.name)"
                  type="checkbox"
                  @change="toggleLocation(location.name)"
                >
                <span class="scope-selection-copy">
                  <span class="scope-selection-title">{{ location.name }}</span>
                  <span class="scope-selection-meta">
                    {{ t('map.customTab.scopeModal.locationMeta', { records: location.recordCount, regions: location.regionNames.join('、') || t('map.customTab.scopeModal.summary.empty') }) }}
                  </span>
                </span>
              </label>
            </section>
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

const selectedLocations = ref([])
const selectedLocationSet = computed(() => new Set(selectedLocations.value))

const modalTitle = computed(() => t('map.customTab.scopeModal.title', {
  feature: props.featureMeta?.feature || ''
}))

const regionOptions = computed(() => {
  return props.regions.map((region) => {
    const names = new Set(region.rows.map((row) => String(row['簡稱'] || '').trim()).filter(Boolean))
    const matchedCount = Array.from(names).filter((name) => selectedLocationSet.value.has(name)).length
    let state = 'none'
    if (matchedCount > 0 && matchedCount < names.size) {
      state = 'partial'
    } else if (names.size > 0 && matchedCount === names.size) {
      state = 'full'
    }
    return {
      ...region,
      locationNames: Array.from(names),
      state
    }
  })
})

const confirmDisabled = computed(() => {
  return props.loading || Boolean(props.errorMessage) || selectedLocations.value.length === 0
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedLocations.value = []
  }
})

function clearSelection() {
  selectedLocations.value = []
}

function toggleRegion(region) {
  const next = new Set(selectedLocations.value)
  const allSelected = region.state === 'full'

  region.locationNames.forEach((locationName) => {
    if (allSelected) {
      next.delete(locationName)
    } else {
      next.add(locationName)
    }
  })

  selectedLocations.value = Array.from(next)
}

function toggleLocation(locationName) {
  const next = new Set(selectedLocations.value)
  if (next.has(locationName)) {
    next.delete(locationName)
  } else {
    next.add(locationName)
  }
  selectedLocations.value = Array.from(next)
}

function handleClose(value = false) {
  emit('update:modelValue', value)
}

function handleConfirm() {
  emit('confirm', {
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
  padding: 16px 18px;
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

.scope-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
}

.scope-toolbar-info {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.scope-clear-btn {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
}

.scope-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.1fr);
  gap: 14px;
}

.scope-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 320px;
  max-height: 420px;
  overflow: auto;
  padding: 16px 18px;
}

.scope-panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.scope-selection-item,
.scope-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
}

.scope-selection-item {
  flex-direction: column;
}

.scope-selection-item.state-full {
  border-color: #007aff;
  box-shadow: 0 0 0 1px rgba(0, 122, 255, 0.18);
}

.scope-selection-item.state-partial {
  border-color: #7c3aed;
  box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.16);
}

.scope-selection-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scope-selection-title {
  font-weight: 700;
  color: #0f172a;
}

.scope-selection-meta,
.scope-selection-status {
  font-size: 13px;
  color: #64748b;
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 900px) {
  .scope-grid {
    grid-template-columns: 1fr;
  }
}
</style>
