<template>
  <Transition name="draw-panel-slide">
    <aside
      v-show="isOpen"
      class="draw-tool-panel main-glass-panel"
      :class="{ 'offset-left': offsetLeft }"
    >
      <div class="draw-tool-panel-header">
        <div>
          <div class="draw-tool-panel-title">
            {{ t('map.drawTab.buttons.drawingTools') }}
          </div>
          <div
            v-if="activeLayer"
            class="draw-tool-panel-subtitle"
          >
            {{ t('map.drawTab.labels.selectedLayer') }}：{{ selectedLayerLabel }}
          </div>
        </div>
      </div>

      <div class="draw-tool-panel-body">
        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.buttons.drawingTools') }}
          </div>
          <div class="draw-tool-button-grid draw-tool-button-grid--three">
            <button
              class="main-glass-button draw-tool-mode-button"
              :data-variant="currentMode === 'simple_select' ? 'primary' : 'secondary'"
              :data-active="currentMode === 'simple_select'"
              type="button"
              @click="$emit('set-mode', 'simple_select')"
            >
              <span
                v-if="currentMode === 'simple_select'"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
              {{ t('map.drawTab.buttons.select') }}
            </button>
            <button
              v-if="!activeLayer || activeLayer.geometryType === 'Point'"
              class="main-glass-button draw-tool-mode-button"
              :data-variant="currentMode === 'draw_point' ? 'primary' : 'secondary'"
              :data-active="currentMode === 'draw_point'"
              type="button"
              :disabled="!canModifyActiveLayer"
              @click="$emit('set-mode', 'draw_point')"
            >
              <span
                v-if="currentMode === 'draw_point'"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
              {{ t('map.drawTab.buttons.drawPoint') }}
            </button>
            <button
              v-if="!activeLayer || activeLayer.geometryType === 'LineString'"
              class="main-glass-button draw-tool-mode-button"
              :data-variant="currentMode === 'draw_line_string' ? 'primary' : 'secondary'"
              :data-active="currentMode === 'draw_line_string'"
              type="button"
              :disabled="!canModifyActiveLayer"
              @click="$emit('set-mode', 'draw_line_string')"
            >
              <span
                v-if="currentMode === 'draw_line_string'"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
              {{ t('map.drawTab.buttons.drawLine') }}
            </button>
            <button
              v-if="!activeLayer || activeLayer.geometryType === 'Polygon'"
              class="main-glass-button draw-tool-mode-button"
              :data-variant="currentMode === 'draw_polygon' ? 'primary' : 'secondary'"
              :data-active="currentMode === 'draw_polygon'"
              type="button"
              :disabled="!canModifyActiveLayer"
              @click="$emit('set-mode', 'draw_polygon')"
            >
              <span
                v-if="currentMode === 'draw_polygon'"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
              {{ t('map.drawTab.buttons.drawPolygon') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canEditShape"
              @click="$emit('edit-shape')"
            >
              {{ t('map.drawTab.buttons.editShape') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canDuplicateFeature"
              @click="$emit('duplicate-feature')"
            >
              {{ t('map.drawTab.buttons.duplicateFeature') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canUndo"
              @click="$emit('undo')"
            >
              {{ t('map.drawTab.buttons.undo') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canRedo"
              @click="$emit('redo')"
            >
              {{ t('map.drawTab.buttons.redo') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canModifyActiveLayer || !selectedFeatureId"
              @click="$emit('delete-selected')"
            >
              {{ t('map.drawTab.buttons.deleteSelected') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canModifyActiveLayer"
              @click="$emit('clear-all')"
            >
              {{ t('map.drawTab.buttons.clearAll') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              @click="$emit('reset-view')"
            >
              {{ t('map.mapLibre.buttons.reset') }}
            </button>
            <button
              class="main-glass-button"
              :data-variant="isFullscreen ? 'primary' : 'secondary'"
              :data-active="isFullscreen"
              type="button"
              @click="$emit('toggle-fullscreen')"
            >
              {{ isFullscreen ? t('map.mapLibre.buttons.exitFullscreen') : t('map.mapLibre.buttons.fullscreen') }}
            </button>
          </div>
        </section>

        <section class="draw-tool-section">
          <div class="draw-tool-section-header">
            <div class="draw-tool-section-title">
              {{ t('map.drawTab.labels.featureList') }}
            </div>
            <div
              v-if="featureItems.length"
              class="draw-feature-batch-actions"
            >
              <span class="draw-feature-selected-count">
                {{ t('map.drawTab.labels.selectedFeatureCount', { count: selectedFeatureIds.length }) }}
              </span>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('delete-selected-features')"
              >
                {{ t('map.drawTab.buttons.deleteSelectedFeatures') }}
              </button>
              <SimpleSelectDropdown
                v-if="selectedFeatureIds.length > 1 && featureMoveLayerOptions.length"
                class="draw-feature-batch-move"
                :model-value="''"
                :options="featureMoveLayerOptions"
                :placeholder="t('map.drawTab.labels.moveFeatureToLayer')"
                :disabled="!canModifyActiveLayer"
                width="7.5rem"
                @update:model-value="$emit('move-selected-features-to-layer', $event)"
              />
            </div>
          </div>
          <div
            v-if="featureItems.length"
            class="draw-feature-list"
          >
            <div
              v-for="feature in featureItems"
              :key="feature.id"
              class="draw-feature-row"
              :data-active="selectedFeatureId === feature.id"
            >
              <input
                class="draw-feature-row-checkbox"
                type="checkbox"
                :checked="selectedFeatureIds.includes(feature.id)"
                :aria-label="feature.label"
                @click.stop
                @change="$emit('toggle-feature-selection', feature.id)"
              >
              <button
                class="draw-feature-row-select"
                type="button"
                @click="$emit('select-feature', feature.id)"
              >
                <span class="draw-feature-row-main">
                  <span class="draw-feature-row-title">{{ feature.label }}</span>
                  <span class="draw-feature-row-meta">{{ getGeometryLabel(feature.geometryType) }}</span>
                </span>
                <span class="draw-feature-row-state">
                  {{ feature.visible ? t('map.drawTab.labels.visibleShort') : t('map.drawTab.labels.hiddenShort') }}
                  <span v-if="feature.locked"> · {{ t('map.drawTab.labels.lockedShort') }}</span>
                </span>
              </button>
            </div>
          </div>
          <div
            v-else
            class="draw-layer-empty"
          >
            {{ t('map.drawTab.labels.emptyFeatureList') }}
          </div>
        </section>

        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            {{ selectedFeatureId ? t('map.drawTab.labels.featureEditor') : t('map.drawTab.labels.layerEditor') }}
          </div>
          <div
            v-if="selectedFeatureProperties"
            class="draw-layer-editor-form"
          >
            <label class="draw-field">
              <span class="draw-field-label">
                {{ selectedFeatureId ? t('map.drawTab.labels.featureName') : t('map.drawTab.labels.layerName') }}
              </span>
              <input
                class="draw-input"
                type="text"
                :value="selectedFeatureProperties.name"
                @input="$emit('update-feature-property', 'name', $event.target.value)"
              >
            </label>

            <div
              v-if="selectedFeatureId && featureMoveLayerOptions.length"
              class="draw-basemap-select"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.moveFeatureToLayer') }}</span>
              <SimpleSelectDropdown
                :model-value="''"
                :options="featureMoveLayerOptions"
                @update:model-value="$emit('move-feature-to-layer', $event)"
              />
            </div>

            <label
              v-if="selectedFeatureGeometryType !== 'Point'"
              class="draw-field draw-color-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.strokeColor') }}</span>
              <input
                class="draw-color-input"
                type="color"
                :value="selectedFeatureProperties.stroke"
                @input="$emit('update-feature-property', 'stroke', $event.target.value)"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Point'"
              class="draw-field draw-color-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.pointColor') }}</span>
              <input
                class="draw-color-input"
                type="color"
                :value="selectedFeatureProperties.pointColor"
                @input="$emit('update-feature-property', 'pointColor', $event.target.value)"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Point'"
              class="draw-field draw-color-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.pointStrokeColor') }}</span>
              <input
                class="draw-color-input"
                type="color"
                :value="selectedFeatureProperties.pointStrokeColor"
                @input="$emit('update-feature-property', 'pointStrokeColor', $event.target.value)"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Polygon'"
              class="draw-field draw-color-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.fillColor') }}</span>
              <input
                class="draw-color-input"
                type="color"
                :value="selectedFeatureProperties.fill"
                @input="$emit('update-feature-property', 'fill', $event.target.value)"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType !== 'Point'"
              class="draw-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.strokeWidth') }}：{{ selectedFeatureProperties.strokeWidth }}</span>
              <input
                class="draw-range-input"
                type="range"
                min="1"
                max="12"
                step="1"
                :value="selectedFeatureProperties.strokeWidth"
                @input="$emit('update-feature-property', 'strokeWidth', Number($event.target.value))"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Point'"
              class="draw-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.pointRadius') }}：{{ selectedFeatureProperties.pointRadius }}</span>
              <input
                class="draw-range-input"
                type="range"
                min="3"
                max="24"
                step="1"
                :value="selectedFeatureProperties.pointRadius"
                @input="$emit('update-feature-property', 'pointRadius', Number($event.target.value))"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Polygon'"
              class="draw-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.fillOpacity') }}：{{ selectedFeatureProperties.fillOpacity }}</span>
              <input
                class="draw-range-input"
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="selectedFeatureProperties.fillOpacity"
                @input="$emit('update-feature-property', 'fillOpacity', Number($event.target.value))"
              >
            </label>

            <CheckBox
              class="draw-toggle-field"
              :model-value="selectedFeatureProperties.visible"
              @update:modelValue="$emit('update-feature-property', 'visible', $event)"
            >
              {{ selectedFeatureId ? t('map.drawTab.labels.featureVisible') : t('map.drawTab.labels.visible') }}
            </CheckBox>

            <CheckBox
              class="draw-toggle-field"
              :model-value="selectedFeatureProperties.locked"
              @update:modelValue="$emit('update-feature-property', 'locked', $event)"
            >
              {{ selectedFeatureId ? t('map.drawTab.labels.featureLocked') : t('map.drawTab.labels.locked') }}
            </CheckBox>
          </div>
          <div
            v-else
            class="draw-layer-empty"
          >
            {{ t('map.drawTab.labels.emptyState') }}
          </div>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import CheckBox from '@/components/selector/CheckBox.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  offsetLeft: { type: Boolean, default: false },
  activeLayer: { type: Object, default: null },
  selectedLayerLabel: { type: String, default: '' },
  currentMode: { type: String, default: 'simple_select' },
  featureItems: { type: Array, default: () => [] },
  featureMoveLayerOptions: { type: Array, default: () => [] },
  selectedFeatureId: { type: String, default: '' },
  selectedFeatureIds: { type: Array, default: () => [] },
  selectedFeatureProperties: { type: Object, default: null },
  selectedFeatureGeometryType: { type: String, default: '' },
  isFullscreen: { type: Boolean, default: false },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  canEditShape: { type: Boolean, default: false },
  canDuplicateFeature: { type: Boolean, default: false },
  canModifyActiveLayer: { type: Boolean, default: false },
})

defineEmits([
  'set-mode',
  'select-feature',
  'toggle-feature-selection',
  'edit-shape',
  'duplicate-feature',
  'undo',
  'redo',
  'delete-selected',
  'delete-selected-features',
  'clear-all',
  'reset-view',
  'toggle-fullscreen',
  'update-feature-property',
  'move-feature-to-layer',
  'move-selected-features-to-layer',
])

const getGeometryLabel = (geometryType) => {
  if (geometryType === 'Point') return t('map.drawTab.geometry.point')
  if (geometryType === 'Polygon') return t('map.drawTab.geometry.polygon')
  return t('map.drawTab.geometry.line')
}
</script>

<style scoped lang="scss">
@use '../../_map-variables' as *;

@use './panelShared';
</style>
