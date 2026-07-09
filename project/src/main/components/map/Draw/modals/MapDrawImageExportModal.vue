<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :title="t('map.drawTab.imageExport.modalTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="image-export-modal">
      <div class="feature-scope-summary main-glass-panel-inner">
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.summary.layers') }}</span>
          <span class="summary-value summary-number">{{ layers.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.summary.features') }}</span>
          <span class="summary-value summary-number">{{ featureCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.summary.activeLayer') }}</span>
          <span class="summary-value">{{ activeLayerName || t('map.drawTab.labels.emptyLayer') }}</span>
        </div>
      </div>

      <div class="scope-grid image-export-grid">
        <section class="scope-panel main-glass-panel-inner">
          <div class="scope-panel-title">{{ t('map.drawTab.imageExport.sections.range') }}</div>
          <label v-for="option in rangeOptions" :key="option.value" class="scope-radio-item">
            <input v-model="form.rangeMode" type="radio" name="image-export-range" :value="option.value">
            <span class="scope-selection-copy">
              <span class="scope-selection-title">{{ option.label }}</span>
              <span v-if="option.description" class="scope-selection-meta">{{ option.description }}</span>
            </span>
          </label>
        </section>

        <section class="scope-panel main-glass-panel-inner">
          <div class="scope-panel-title">{{ t('map.drawTab.imageExport.sections.size') }}</div>
          <label class="draw-field">
            <!-- <span class="draw-field-label">{{ t('map.drawTab.imageExport.labels.sizePreset') }}</span> -->
            <select v-model="form.sizePreset" class="draw-select-input" style="width: 100%;">
              <option v-for="option in sizeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <div v-if="form.sizePreset === 'custom'" class="image-export-custom-size">
            <label class="draw-field">
              <span class="draw-field-label">{{ t('map.drawTab.imageExport.labels.width') }}</span>
              <input v-model.number="form.customWidth" type="number" min="256" step="1" class="draw-text-input">
            </label>
            <label class="draw-field">
              <span class="draw-field-label">{{ t('map.drawTab.imageExport.labels.height') }}</span>
              <input v-model.number="form.customHeight" type="number" min="256" step="1" class="draw-text-input">
            </label>
          </div>
        </section>

        <section class="scope-panel main-glass-panel-inner">
          <div class="scope-panel-title">{{ t('map.drawTab.imageExport.sections.zoom') }}</div>
          <label v-for="option in zoomOptions" :key="option.value" class="scope-radio-item">
            <input v-model="form.zoomMode" type="radio" name="image-export-zoom" :value="option.value">
            <span class="scope-selection-copy">
              <span class="scope-selection-title">{{ option.label }}</span>
            </span>
          </label>

          <label v-if="form.zoomMode === 'custom'" class="draw-field">
            <span class="draw-field-label">{{ t('map.drawTab.imageExport.labels.zoomValue') }}</span>
            <input v-model.number="form.customZoom" type="number" min="0" max="24" step="0.1" class="draw-text-input">
          </label>
        </section>

        <section class="scope-panel main-glass-panel-inner">
          <div class="scope-panel-title">{{ t('map.drawTab.imageExport.sections.content') }}</div>
          <CheckBox
            :model-value="form.includeBasemap"
            class="scope-checkbox-item"
            @update:modelValue="form.includeBasemap = $event"
          >
            <span class="scope-selection-copy">
              <span class="scope-selection-title">{{ t('map.drawTab.imageExport.content.includeBasemap') }}</span>
            </span>
          </CheckBox>
          <CheckBox
            :model-value="form.includeDrawLayers"
            class="scope-checkbox-item"
            @update:modelValue="form.includeDrawLayers = $event"
          >
            <span class="scope-selection-copy">
              <span class="scope-selection-title">{{ t('map.drawTab.imageExport.content.includeDrawLayers') }}</span>
            </span>
          </CheckBox>
          <CheckBox
            :model-value="form.onlySelectedLayers"
            class="scope-checkbox-item"
            @update:modelValue="form.onlySelectedLayers = $event"
          >
            <span class="scope-selection-copy">
              <span class="scope-selection-title">{{ t('map.drawTab.imageExport.content.onlySelectedLayers') }}</span>
            </span>
          </CheckBox>

          <div v-if="form.onlySelectedLayers" class="image-export-layer-list ui-scrollbar">
            <CheckBox
              v-for="layer in layers"
              :key="layer.id"
              :model-value="selectedLayerSet.has(layer.id)"
              class="scope-checkbox-item scope-checkbox-item--dense"
              @update:modelValue="toggleLayerSelection(layer.id)"
            >
              <span class="scope-selection-copy">
                <span class="scope-selection-title">{{ layer.name }}</span>
                <span class="scope-selection-meta">{{ t('map.drawTab.labels.featureCount', { count: layer.featureCollection?.features?.length ?? 0 }) }}</span>
              </span>
            </CheckBox>
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="main-glass-button" type="button" @click="handleClose(false)">
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="main-glass-button scope-confirm-btn"
          data-variant="primary"
          type="button"
          @click="handleConfirm"
        >
          {{ t('map.drawTab.imageExport.confirmAction') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  layers: { type: Array, default: () => [] },
  activeLayerId: { type: String, default: '' },
  selectedFeatureId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t } = useI18n()

const form = reactive({
  rangeMode: 'current-view',
  sizePreset: 'current',
  customWidth: 1920,
  customHeight: 1080,
  zoomMode: 'current',
  customZoom: 6,
  includeBasemap: true,
  includeDrawLayers: true,
  onlySelectedLayers: false,
  selectedLayerIds: [],
})

const featureCount = computed(() => {
  return (props.layers ?? []).reduce((count, layer) => count + (layer?.featureCollection?.features?.length ?? 0), 0)
})

const activeLayerName = computed(() => {
  return (props.layers ?? []).find((layer) => layer.id === props.activeLayerId)?.name || ''
})

const rangeOptions = computed(() => ([
  {
    value: 'current-view',
    label: t('map.drawTab.imageExport.range.currentView'),
    description: t('map.drawTab.imageExport.range.currentViewDesc'),
  },
  {
    value: 'selected-layer',
    label: t('map.drawTab.imageExport.range.selectedLayer'),
    description: activeLayerName.value || t('map.drawTab.labels.emptyLayer'),
  },
  {
    value: 'selected-feature',
    label: t('map.drawTab.imageExport.range.selectedFeature'),
    description: props.selectedFeatureId || t('map.drawTab.imageExport.range.selectedFeatureDesc'),
  },
  {
    value: 'custom-bbox',
    label: t('map.drawTab.imageExport.range.customBbox'),
    description: t('map.drawTab.imageExport.range.customBboxDesc'),
  },
]))

const sizeOptions = computed(() => ([
  { value: 'current', label: t('map.drawTab.imageExport.size.current') },
  { value: '1080p', label: t('map.drawTab.imageExport.size.p1080') },
  { value: '2k', label: t('map.drawTab.imageExport.size.p2k') },
  { value: 'custom', label: t('map.drawTab.imageExport.size.custom') },
]))

const zoomOptions = computed(() => ([
  { value: 'current', label: t('map.drawTab.imageExport.zoom.current') },
  { value: 'custom', label: t('map.drawTab.imageExport.zoom.custom') },
]))

const selectedLayerSet = computed(() => new Set(form.selectedLayerIds))

function resetForm() {
  form.rangeMode = 'current-view'
  form.sizePreset = 'current'
  form.customWidth = 1920
  form.customHeight = 1080
  form.zoomMode = 'current'
  form.customZoom = 6
  form.includeBasemap = true
  form.includeDrawLayers = true
  form.onlySelectedLayers = false
  form.selectedLayerIds = props.activeLayerId ? [props.activeLayerId] : []
}

function toggleLayerSelection(layerId) {
  if (selectedLayerSet.value.has(layerId)) {
    form.selectedLayerIds = form.selectedLayerIds.filter((id) => id !== layerId)
    return
  }
  form.selectedLayerIds = [...form.selectedLayerIds, layerId]
}

function handleClose(value = false) {
  emit('update:modelValue', value)
}

function handleConfirm() {
  emit('confirm', {
    rangeMode: form.rangeMode,
    sizePreset: form.sizePreset,
    customWidth: Number(form.customWidth) || 0,
    customHeight: Number(form.customHeight) || 0,
    zoomMode: form.zoomMode,
    customZoom: Number(form.customZoom) || 0,
    includeBasemap: Boolean(form.includeBasemap),
    includeDrawLayers: Boolean(form.includeDrawLayers),
    onlySelectedLayers: Boolean(form.onlySelectedLayers),
    selectedLayerIds: [...form.selectedLayerIds],
  })
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.activeLayerId,
  (nextValue) => {
    if (!nextValue || form.selectedLayerIds.length > 0) return
    form.selectedLayerIds = [nextValue]
  }
)
</script>

<style scoped lang="scss">
@use '../../_map-variables' as *;

.image-export-modal {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-scope-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 16px;

  .summary-item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .summary-label {
    font-size: 11px;
    color: $text-muted;
  }

  .summary-value {
    font-size: 14px;
    font-weight: 700;
    color: $text-strong;
    word-break: break-word;
  }

  .summary-number {
    color: $primary;
  }
}

.image-export-grid {
  align-items: start;
}

.scope-panel {
  display: flex;
  gap: 10px;
  padding: 14px 16px;

  .scope-panel-title {
    font-size: 13px;
    font-weight: 700;
    color: $text-strong;
  }

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.scope-radio-item,
.scope-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba($text-light, 0.22);
}

.scope-radio-item {
  input {
    margin-top: 2px;
    accent-color: $primary;
  }
}

.scope-checkbox-item {
  &--dense {
    padding: 8px 10px;
  }
}

.scope-selection-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  .scope-selection-title {
    font-size: 13px;
    font-weight: 600;
    color: $text-strong;
  }

  .scope-selection-meta {
    font-size: 11px;
    color: $text-muted;
  }
}

.draw-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .draw-field-label {
    font-size: 12px;
    font-weight: 600;
    color: $text-dark;
  }
}

.draw-select-input,
.draw-text-input {
  width: 80%;
  padding: 0.6rem 0.85rem;
  border-radius: 12px;
  border: 1px solid $muted-ring;
  background: $glass-strong;
  color: $deep-blue;
}

.image-export-custom-size {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.image-export-layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
