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
              class="main-glass-button draw-tool-mode-button"
              :data-variant="currentMode === 'direct_select' ? 'primary' : 'secondary'"
              :data-active="currentMode === 'direct_select'"
              type="button"
              :disabled="currentMode !== 'direct_select' && !canEditShape"
              @click="currentMode === 'direct_select' ? $emit('set-mode', 'simple_select') : $emit('edit-shape')"
            >
              <span
                v-if="currentMode === 'direct_select'"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
              {{ currentMode === 'direct_select' ? t('map.drawTab.buttons.finishShapeEdit') : t('map.drawTab.buttons.editShape') }}
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
              :disabled="!canDeleteSelection"
              @click="$emit('delete-selected')"
            >
              {{ currentMode === 'direct_select' && selectedVertexCount > 0 ? t('map.drawTab.buttons.deleteSelectedVertices') : t('map.drawTab.buttons.deleteSelected') }}
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
          <div
            v-if="currentMode === 'direct_select'"
            class="draw-shape-edit-status"
            data-testid="shape-edit-status"
          >
            <div class="draw-shape-edit-main">
              <span
                class="draw-shape-edit-target"
                data-testid="shape-edit-target"
              >
                {{ t('map.drawTab.labels.shapeEditTarget', { name: selectedShapeEditLabel }) }}
              </span>
              <span
                class="draw-shape-edit-count"
                data-testid="shape-edit-selected-count"
              >
                {{ t('map.drawTab.labels.selectedVertexCount', { count: selectedVertexCount }) }}
              </span>
            </div>
            <div
              class="draw-shape-edit-hint"
              data-testid="shape-edit-hint"
            >
              {{ shapeEditHintText }}
            </div>
            <div class="draw-shape-edit-actions">
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                data-testid="shape-edit-delete-vertices"
                type="button"
                :disabled="!canDeleteSelectedVertices"
                @click="$emit('delete-selected')"
              >
                {{ t('map.drawTab.buttons.deleteSelectedVertices') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                data-testid="shape-edit-finish"
                type="button"
                @click="$emit('set-mode', 'simple_select')"
              >
                {{ t('map.drawTab.buttons.finishShapeEdit') }}
              </button>
            </div>
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
                :disabled="!canModifyActiveLayer || featureItems.length === 0"
                @click="$emit('select-all-features')"
              >
                {{ t('map.drawTab.buttons.selectAllFeatures') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || featureItems.length === 0"
                @click="$emit('invert-feature-selection')"
              >
                {{ t('map.drawTab.buttons.invertFeatureSelection') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                :data-variant="isFeatureBoxSelectMode ? 'primary' : 'secondary'"
                :data-active="isFeatureBoxSelectMode"
                type="button"
                :disabled="!canUseFeatureBoxSelect"
                @click="$emit('toggle-feature-box-select')"
              >
                {{ t('map.drawTab.buttons.boxSelectFeatures') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="selectedFeatureIds.length === 0"
                @click="$emit('clear-feature-selection')"
              >
                {{ t('map.drawTab.buttons.clearFeatureSelection') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('delete-selected-features')"
              >
                {{ t('map.drawTab.buttons.deleteSelectedFeatures') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-visible', false)"
              >
                {{ t('map.drawTab.buttons.hideSelectedFeatures') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-visible', true)"
              >
                {{ t('map.drawTab.buttons.showSelectedFeatures') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-locked', true)"
              >
                {{ t('map.drawTab.buttons.lockSelectedFeatures') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-locked', false)"
              >
                {{ t('map.drawTab.buttons.unlockSelectedFeatures') }}
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
          <div class="draw-tool-section-header">
            <div class="draw-tool-section-title">
              {{ t('map.drawTab.labels.featureDataTable') }}
            </div>
          </div>
          <div
            v-if="featureTableRows.length"
            class="draw-feature-table-tools"
          >
            <label class="draw-field draw-feature-table-batch-field">
              <span class="draw-field-label">
                {{ t('map.drawTab.labels.batchFeatureName') }}
              </span>
              <input
                class="draw-input"
                type="text"
                :value="selectedFeatureBatchName"
                @input="$emit('update:selected-feature-batch-name', $event.target.value)"
              >
            </label>
            <button
              class="main-glass-button draw-tool-inline-button"
              data-variant="secondary"
              type="button"
              :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !selectedFeatureBatchName.trim()"
              @click="$emit('apply-selected-feature-batch-name')"
            >
              {{ t('map.drawTab.buttons.applyBatchFeatureName') }}
            </button>
            <div
              v-if="featureTableColumns.length"
              class="draw-feature-table-property-tools"
            >
              <span class="draw-field-label">
                {{ t('map.drawTab.labels.batchFeatureProperty') }}
              </span>
              <SimpleSelectDropdown
                :model-value="selectedFeatureBatchPropertyKey"
                :options="featureTableBatchPropertyOptions"
                :placeholder="t('map.drawTab.labels.batchFeatureProperty')"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                width="7.5rem"
                @update:model-value="$emit('update:selected-feature-batch-property-key', $event)"
              />
              <input
                class="draw-input draw-feature-table-batch-value"
                type="text"
                :value="selectedFeatureBatchPropertyValue"
                :placeholder="t('map.drawTab.labels.batchFeaturePropertyValue')"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !canApplySelectedFeatureBatchProperty"
                @input="$emit('update:selected-feature-batch-property-value', $event.target.value)"
              >
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !canApplySelectedFeatureBatchProperty"
                @click="$emit('apply-selected-feature-batch-property')"
              >
                {{ t('map.drawTab.buttons.applyBatchFeatureProperty') }}
              </button>
            </div>
          </div>
          <div
            v-if="featureTableRows.length"
            class="draw-feature-table-wrap"
          >
            <table class="draw-feature-table">
              <thead>
                <tr>
                  <th>{{ t('map.drawTab.labels.featureTableName') }}</th>
                  <th
                    v-for="column in featureTableColumns"
                    :key="column.key"
                  >
                    {{ column.label }}
                  </th>
                  <th>{{ t('map.drawTab.labels.featureTableGeometry') }}</th>
                  <th>{{ t('map.drawTab.labels.featureTableState') }}</th>
                  <th>{{ t('map.drawTab.labels.featureTableProperties') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in featureTableRows"
                  :key="row.id"
                >
                  <td>
                    <input
                      class="draw-input draw-feature-table-input"
                      type="text"
                      :value="row.name"
                      :disabled="!canModifyActiveLayer"
                      @input="$emit('update-feature-table-cell', row.id, 'name', $event.target.value)"
                    >
                  </td>
                  <td
                    v-for="column in featureTableColumns"
                    :key="column.key"
                  >
                    <input
                      class="draw-input draw-feature-table-input"
                      type="text"
                      :value="row.properties?.[column.key] ?? ''"
                      :disabled="!canModifyActiveLayer"
                      @input="$emit('update-feature-table-cell', row.id, column.key, $event.target.value)"
                    >
                  </td>
                  <td>{{ getGeometryLabel(row.geometryType) }}</td>
                  <td>{{ getFeatureStateLabel(row) }}</td>
                  <td>
                    <span class="draw-feature-table-summary">
                      {{ row.propertySummary }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
                class="draw-range-input glass-range"
                type="range"
                min="1"
                max="12"
                step="1"
                :value="selectedFeatureProperties.strokeWidth"
                :style="{ '--glass-range-progress': (((selectedFeatureProperties.strokeWidth - 1) / 11) * 100) + '%' }"
                @input="$emit('update-feature-property', 'strokeWidth', Number($event.target.value))"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Point'"
              class="draw-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.pointRadius') }}：{{ selectedFeatureProperties.pointRadius }}</span>
              <input
                class="draw-range-input glass-range"
                type="range"
                min="3"
                max="24"
                step="1"
                :value="selectedFeatureProperties.pointRadius"
                :style="{ '--glass-range-progress': (((selectedFeatureProperties.pointRadius - 3) / 21) * 100) + '%' }"
                @input="$emit('update-feature-property', 'pointRadius', Number($event.target.value))"
              >
            </label>

            <label
              v-if="selectedFeatureGeometryType === 'Polygon'"
              class="draw-field"
            >
              <span class="draw-field-label">{{ t('map.drawTab.labels.fillOpacity') }}：{{ selectedFeatureProperties.fillOpacity }}</span>
              <input
                class="draw-range-input glass-range"
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="selectedFeatureProperties.fillOpacity"
                :style="{ '--glass-range-progress': (selectedFeatureProperties.fillOpacity * 100) + '%' }"
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
import { computed } from 'vue'
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
  featureTableColumns: { type: Array, default: () => [] },
  featureTableRows: { type: Array, default: () => [] },
  featureMoveLayerOptions: { type: Array, default: () => [] },
  selectedFeatureId: { type: String, default: '' },
  selectedFeatureIds: { type: Array, default: () => [] },
  selectedVertexCount: { type: Number, default: 0 },
  selectedFeatureBatchName: { type: String, default: '' },
  selectedFeatureBatchPropertyKey: { type: String, default: '' },
  selectedFeatureBatchPropertyValue: { type: String, default: '' },
  canApplySelectedFeatureBatchProperty: { type: Boolean, default: false },
  selectedFeatureProperties: { type: Object, default: null },
  selectedFeatureGeometryType: { type: String, default: '' },
  isFullscreen: { type: Boolean, default: false },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  canEditShape: { type: Boolean, default: false },
  canDeleteSelection: { type: Boolean, default: false },
  canDeleteSelectedVertices: { type: Boolean, default: false },
  canDuplicateFeature: { type: Boolean, default: false },
  isFeatureBoxSelectMode: { type: Boolean, default: false },
  canUseFeatureBoxSelect: { type: Boolean, default: false },
  canModifyActiveLayer: { type: Boolean, default: false },
})

defineEmits([
  'set-mode',
  'select-feature',
  'toggle-feature-selection',
  'select-all-features',
  'invert-feature-selection',
  'clear-feature-selection',
  'toggle-feature-box-select',
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
  'update-feature-table-cell',
  'update:selected-feature-batch-name',
  'apply-selected-feature-batch-name',
  'update:selected-feature-batch-property-key',
  'update:selected-feature-batch-property-value',
  'apply-selected-feature-batch-property',
  'move-feature-to-layer',
  'move-selected-features-to-layer',
  'set-selected-features-visible',
  'set-selected-features-locked',
])

const getGeometryLabel = (geometryType) => {
  if (geometryType === 'Point') return t('map.drawTab.geometry.point')
  if (geometryType === 'Polygon') return t('map.drawTab.geometry.polygon')
  return t('map.drawTab.geometry.line')
}

const getFeatureStateLabel = (feature) => {
  const visibleLabel = feature?.visible ? t('map.drawTab.labels.visibleShort') : t('map.drawTab.labels.hiddenShort')
  return feature?.locked ? `${visibleLabel} · ${t('map.drawTab.labels.lockedShort')}` : visibleLabel
}

const featureTableBatchPropertyOptions = computed(() => props.featureTableColumns.map((column) => ({
  label: column.label,
  value: column.key,
})))

const selectedShapeEditLabel = computed(() => {
  const selectedFeature = props.featureItems.find((feature) => feature.id === props.selectedFeatureId)
  return selectedFeature?.label
    || props.selectedFeatureProperties?.name
    || props.selectedLayerLabel
    || t('map.drawTab.labels.feature')
})

const shapeEditHintText = computed(() => {
  if (props.selectedVertexCount <= 0) return t('map.drawTab.labels.shapeEditNoVertexHint')
  if (props.canDeleteSelectedVertices) {
    return t('map.drawTab.labels.shapeEditSelectedVertexHint', { count: props.selectedVertexCount })
  }
  return t('map.drawTab.labels.shapeEditCannotDeleteHint')
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use '../../_map-variables' as *;

@use './panelShared';
</style>
