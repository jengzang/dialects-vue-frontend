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
              @click="$emit('delete-selected')"
            >
              {{ t('map.drawTab.buttons.deleteSelected') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
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
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.labels.layerEditor') }}
          </div>
          <div
            v-if="selectedFeatureProperties"
            class="draw-layer-editor-form"
          >
            <label class="draw-field">
              <span class="draw-field-label">{{ t('map.drawTab.labels.layerName') }}</span>
              <input
                class="draw-input"
                type="text"
                :value="selectedFeatureProperties.name"
                @input="$emit('update-feature-property', 'name', $event.target.value)"
              >
            </label>

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
              {{ t('map.drawTab.labels.visible') }}
            </CheckBox>

            <CheckBox
              class="draw-toggle-field"
              :model-value="selectedFeatureProperties.locked"
              @update:modelValue="$emit('update-feature-property', 'locked', $event)"
            >
              {{ t('map.drawTab.labels.locked') }}
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

const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  offsetLeft: { type: Boolean, default: false },
  activeLayer: { type: Object, default: null },
  selectedLayerLabel: { type: String, default: '' },
  currentMode: { type: String, default: 'simple_select' },
  selectedFeatureProperties: { type: Object, default: null },
  selectedFeatureGeometryType: { type: String, default: '' },
  isFullscreen: { type: Boolean, default: false },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
})

defineEmits([
  'set-mode',
  'undo',
  'redo',
  'delete-selected',
  'clear-all',
  'reset-view',
  'toggle-fullscreen',
  'update-feature-property',
])
</script>

<style scoped lang="scss">
@use '../../_map-variables' as *;

@use './panelShared';
</style>
