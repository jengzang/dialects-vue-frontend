<template>
  <Transition name="draw-panel-slide">
    <aside
      v-show="isOpen"
      class="draw-tool-panel glass-panel"
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
              class="glass-button draw-tool-mode-button"
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
              class="glass-button draw-tool-mode-button"
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
              class="glass-button draw-tool-mode-button"
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
              class="glass-button draw-tool-mode-button"
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
              class="glass-button draw-tool-mode-button"
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
              class="glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canDuplicateFeature"
              @click="$emit('duplicate-feature')"
            >
              {{ t('map.drawTab.buttons.duplicateFeature') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-reverse-geometry"
              type="button"
              :disabled="!canUseSelectedGeometryTools"
              @click="$emit('reverse-selected-geometry')"
            >
              {{ t('map.drawTab.buttons.reverseGeometry') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-simplify-geometry"
              type="button"
              :disabled="!canUseSelectedGeometryTools"
              @click="$emit('simplify-selected-geometry')"
            >
              {{ t('map.drawTab.buttons.simplifyGeometry') }}
            </button>
            <button
              v-if="selectedFeatureGeometryType === 'LineString'"
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-close-line"
              type="button"
              :disabled="!canCloseSelectedLine"
              @click="$emit('close-selected-line')"
            >
              {{ t('map.drawTab.buttons.closeLine') }}
            </button>
            <button
              v-if="selectedFeatureGeometryType === 'LineString'"
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-split-line"
              type="button"
              :disabled="!canSplitSelectedLine"
              @click="$emit('split-selected-line')"
            >
              {{ t('map.drawTab.buttons.splitLine') }}
            </button>
            <button
              v-if="selectedFeatureGeometryType === 'LineString'"
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-line-to-polygon"
              type="button"
              :disabled="!canConvertSelectedLineToPolygon"
              @click="$emit('convert-selected-line-to-polygon')"
            >
              {{ t('map.drawTab.buttons.lineToPolygon') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-undo"
              type="button"
              :title="undoButtonTitle"
              :aria-label="undoButtonTitle"
              :disabled="!canUndo"
              @click="$emit('undo')"
            >
              {{ t('map.drawTab.buttons.undo') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              data-testid="draw-tool-redo"
              type="button"
              :title="redoButtonTitle"
              :aria-label="redoButtonTitle"
              :disabled="!canRedo"
              @click="$emit('redo')"
            >
              {{ t('map.drawTab.buttons.redo') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canDeleteSelection"
              @click="$emit('delete-selected')"
            >
              {{ currentMode === 'direct_select' && selectedVertexCount > 0 ? t('map.drawTab.buttons.deleteSelectedVertices') : t('map.drawTab.buttons.deleteSelected') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!canModifyActiveLayer"
              @click="$emit('clear-all')"
            >
              {{ t('map.drawTab.buttons.clearAll') }}
            </button>
            <button
              class="glass-button"
              data-variant="secondary"
              type="button"
              @click="$emit('reset-view')"
            >
              {{ t('map.mapLibre.buttons.reset') }}
            </button>
            <button
              class="glass-button"
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
            <div class="draw-shape-edit-tips">
              <span data-testid="shape-edit-insert-hint">
                {{ t('map.drawTab.labels.shapeEditInsertVertexHint') }}
              </span>
              <span data-testid="shape-edit-move-hint">
                {{ t('map.drawTab.labels.shapeEditMoveVertexHint') }}
              </span>
              <span data-testid="shape-edit-history-hint">
                {{ t('map.drawTab.labels.shapeEditHistoryHint') }}
              </span>
            </div>
            <div
              v-if="canEditSelectedVertexCoordinate"
              class="draw-shape-edit-coordinate"
              data-testid="shape-edit-coordinate-editor"
            >
              <span class="draw-field-label">
                {{ t('map.drawTab.labels.selectedVertexCoordinate') }}
              </span>
              <label class="draw-field draw-shape-edit-coordinate-field">
                <span class="draw-field-label">{{ t('map.drawTab.labels.longitude') }}</span>
                <input
                  v-model="vertexLongitudeInput"
                  class="draw-input glass-field"
                  data-testid="shape-edit-longitude-input"
                  type="number"
                  step="0.000001"
                >
              </label>
              <label class="draw-field draw-shape-edit-coordinate-field">
                <span class="draw-field-label">{{ t('map.drawTab.labels.latitude') }}</span>
                <input
                  v-model="vertexLatitudeInput"
                  class="draw-input glass-field"
                  data-testid="shape-edit-latitude-input"
                  type="number"
                  step="0.000001"
                >
              </label>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                data-testid="shape-edit-apply-coordinate"
                type="button"
                :disabled="!canApplySelectedVertexCoordinate"
                @click="applySelectedVertexCoordinate"
              >
                {{ t('map.drawTab.buttons.applyVertexCoordinate') }}
              </button>
            </div>
            <div class="draw-shape-edit-actions">
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                data-testid="shape-edit-delete-vertices"
                type="button"
                :disabled="!canDeleteSelectedVertices"
                @click="$emit('delete-selected')"
              >
                {{ t('map.drawTab.buttons.deleteSelectedVertices') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                data-testid="shape-edit-finish"
                type="button"
                @click="$emit('set-mode', 'simple_select')"
              >
                {{ t('map.drawTab.buttons.finishShapeEdit') }}
              </button>
            </div>
          </div>
          <div
            class="draw-shape-edit-status"
            data-testid="geometry-quality-status"
          >
            <div class="draw-shape-edit-main">
              <span
                class="draw-shape-edit-target"
                data-testid="geometry-quality-title"
              >
                {{ t('map.drawTab.labels.geometryQuality') }}
              </span>
              <span
                class="draw-shape-edit-count"
                data-testid="geometry-quality-count"
              >
                {{ geometryQualitySummary.hasIssues ? t('map.drawTab.labels.geometryQualityIssueCount', { count: geometryQualitySummary.issueCount }) : t('map.drawTab.labels.geometryQualityOk') }}
              </span>
            </div>
            <div
              v-if="geometryQualitySummary.hasIssues"
              class="draw-shape-edit-tips"
            >
              <span
                v-for="item in geometryQualitySummary.items"
                :key="item.id"
                data-testid="geometry-quality-item"
                :data-level="item.level"
              >
                {{ item.label }}
              </span>
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
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || featureItems.length === 0"
                @click="$emit('select-all-features')"
              >
                {{ t('map.drawTab.buttons.selectAllFeatures') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || featureItems.length === 0"
                @click="$emit('invert-feature-selection')"
              >
                {{ t('map.drawTab.buttons.invertFeatureSelection') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                :data-variant="isFeatureBoxSelectMode ? 'primary' : 'secondary'"
                :data-active="isFeatureBoxSelectMode"
                type="button"
                :disabled="!canUseFeatureBoxSelect"
                @click="$emit('toggle-feature-box-select')"
              >
                {{ t('map.drawTab.buttons.boxSelectFeatures') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="selectedFeatureIds.length === 0"
                @click="$emit('clear-feature-selection')"
              >
                {{ t('map.drawTab.buttons.clearFeatureSelection') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('delete-selected-features')"
              >
                {{ t('map.drawTab.buttons.deleteSelectedFeatures') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-visible', false)"
              >
                {{ t('map.drawTab.buttons.hideSelectedFeatures') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-visible', true)"
              >
                {{ t('map.drawTab.buttons.showSelectedFeatures') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
                @click="$emit('set-selected-features-locked', true)"
              >
                {{ t('map.drawTab.buttons.lockSelectedFeatures') }}
              </button>
              <button
                class="glass-button draw-tool-inline-button"
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
                class="draw-input glass-field"
                type="text"
                :value="selectedFeatureBatchName"
                @input="$emit('update:selected-feature-batch-name', $event.target.value)"
              >
            </label>
            <button
              class="glass-button draw-tool-inline-button"
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
                class="draw-input draw-feature-table-batch-value glass-field"
                type="text"
                :value="selectedFeatureBatchPropertyValue"
                :placeholder="t('map.drawTab.labels.batchFeaturePropertyValue')"
                :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !canApplySelectedFeatureBatchProperty"
                @input="$emit('update:selected-feature-batch-property-value', $event.target.value)"
              >
              <button
                class="glass-button draw-tool-inline-button"
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
                      class="draw-input draw-feature-table-input glass-field"
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
                      class="draw-input draw-feature-table-input glass-field"
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
                class="draw-input glass-field"
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
                class="draw-color-input glass-field"
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
                class="draw-color-input glass-field"
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
                class="draw-color-input glass-field"
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
                class="draw-color-input glass-field"
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
import { computed, ref, watch } from 'vue'
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
  selectedVertex: { type: Object, default: null },
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
  canUseSelectedGeometryTools: { type: Boolean, default: false },
  canCloseSelectedLine: { type: Boolean, default: false },
  canSplitSelectedLine: { type: Boolean, default: false },
  canConvertSelectedLineToPolygon: { type: Boolean, default: false },
  geometryQualitySummary: {
    type: Object,
    default: () => ({
      hasIssues: false,
      issueCount: 0,
      items: [],
    }),
  },
  canDeleteSelection: { type: Boolean, default: false },
  canDeleteSelectedVertices: { type: Boolean, default: false },
  canDuplicateFeature: { type: Boolean, default: false },
  isFeatureBoxSelectMode: { type: Boolean, default: false },
  canUseFeatureBoxSelect: { type: Boolean, default: false },
  canModifyActiveLayer: { type: Boolean, default: false },
})

const emit = defineEmits([
  'set-mode',
  'select-feature',
  'toggle-feature-selection',
  'select-all-features',
  'invert-feature-selection',
  'clear-feature-selection',
  'toggle-feature-box-select',
  'edit-shape',
  'duplicate-feature',
  'reverse-selected-geometry',
  'simplify-selected-geometry',
  'close-selected-line',
  'split-selected-line',
  'convert-selected-line-to-polygon',
  'move-selected-vertex',
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

const undoButtonTitle = computed(() => (
  props.canUndo
    ? t('map.drawTab.labels.undoAvailableHint')
    : t('map.drawTab.labels.undoUnavailableHint')
))

const redoButtonTitle = computed(() => (
  props.canRedo
    ? t('map.drawTab.labels.redoAvailableHint')
    : t('map.drawTab.labels.redoUnavailableHint')
))

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

const vertexLongitudeInput = ref('')
const vertexLatitudeInput = ref('')

const selectedVertexCoordinate = computed(() => {
  const coordinate = props.selectedVertex?.coordinate
  const longitude = Number(coordinate?.[0])
  const latitude = Number(coordinate?.[1])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude]
})

const canEditSelectedVertexCoordinate = computed(() => (
  props.currentMode === 'direct_select'
  && props.selectedVertexCount === 1
  && Boolean(props.selectedVertex?.featureId)
  && typeof props.selectedVertex?.coordPath === 'string'
  && Boolean(selectedVertexCoordinate.value)
))

const parsedVertexCoordinateInput = computed(() => {
  const longitude = Number(vertexLongitudeInput.value)
  const latitude = Number(vertexLatitudeInput.value)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude]
})

const canApplySelectedVertexCoordinate = computed(() => {
  if (!canEditSelectedVertexCoordinate.value) return false
  const currentCoordinate = selectedVertexCoordinate.value
  const nextCoordinate = parsedVertexCoordinateInput.value
  if (!currentCoordinate || !nextCoordinate) return false
  return currentCoordinate[0] !== nextCoordinate[0] || currentCoordinate[1] !== nextCoordinate[1]
})

watch(() => props.selectedVertex, () => {
  const coordinate = selectedVertexCoordinate.value
  vertexLongitudeInput.value = coordinate ? String(coordinate[0]) : ''
  vertexLatitudeInput.value = coordinate ? String(coordinate[1]) : ''
}, { immediate: true, deep: true })

const applySelectedVertexCoordinate = () => {
  const coordinate = parsedVertexCoordinateInput.value
  if (!canApplySelectedVertexCoordinate.value || !coordinate) return
  emit('move-selected-vertex', {
    featureId: props.selectedVertex.featureId,
    coordPath: props.selectedVertex.coordPath,
    coordinate,
  })
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use '../../_map-variables' as *;

@use './panelShared';
</style>
