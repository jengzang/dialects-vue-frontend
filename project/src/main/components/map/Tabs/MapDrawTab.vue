<template>
  <div ref="drawTabRoot" class="map-draw-tab page-content-stack">
    <div class="page-footer draw-tab-header main-glass-panel">
      <!-- <div class="draw-tab-copy">
        <h3 class="draw-tab-title">
          {{ t('map.drawTab.title') }}
        </h3>
        <p class="hint draw-tab-hint">
          {{ t('map.drawTab.hint') }}
        </p>
      </div> -->

      <div
        v-if="isAuthenticated"
        class="draw-toolbar draw-toolbar--header"
      >
        <span class="draw-feature-count-badge">
          {{ t('map.drawTab.labels.featureCount', { count: featureCount }) }}
        </span>
        <button
          class="main-glass-button"
          data-variant="secondary"
          type="button"
          @click="showAddLayerModal = true"
        >
          ➕ {{ t('map.drawTab.buttons.addLayer') }}
        </button>
        <button
          class="main-glass-button"
          :data-variant="isVoronoiPanelOpen ? 'primary' : 'secondary'"
          :data-active="isVoronoiPanelOpen"
          type="button"
          @click="togglePanel('voronoi')"
        >
          ⬡ {{ t('map.drawTab.buttons.voronoi') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="secondary"
          type="button"
          @click="showExportModal = true"
        >
          📤 {{ t('map.drawTab.buttons.export') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="secondary"
          type="button"
          @click="showLocalStorageModal = true"
        >
          💾 {{ t('map.drawTab.buttons.saveToLocal') }}
        </button>
        <button
          class="main-glass-button"
          :data-variant="isDrawingPanelOpen ? 'primary' : 'secondary'"
          :data-active="isDrawingPanelOpen"
          type="button"
          @click="togglePanel('drawing')"
        >
          🛠️ {{ t('map.drawTab.buttons.drawingTools') }}
        </button>
        <button
          class="main-glass-button"
          :data-variant="isLayersPanelOpen ? 'primary' : 'secondary'"
          :data-active="isLayersPanelOpen"
          type="button"
          @click="togglePanel('layers')"
        >
          🗂️ {{ t('map.drawTab.buttons.layers') }}
        </button>
      </div>
    </div>

    <div
      v-if="!isAuthenticated"
      class="auth-warning-container"
    >
      <div class="auth-warning-card">
        <div class="auth-warning-icon">
          🔒
        </div>
        <p class="auth-warning-text">
          {{ t('map.drawTab.auth.loginRequired') }}
        </p>
        <button
          class="enter-btn"
          type="button"
          @click="handleLogin"
        >
          {{ t('map.drawTab.auth.loginAction') }}
        </button>
      </div>
    </div>

    <template v-else>
      <div class="draw-workbench">
        <div class="draw-map-area">
          <EditableMapLibre
            ref="editableMapRef"
            v-model="activeLayerFeatureCollection"
            v-model:current-style-key="currentStyleKey"
            :active-layer="activeLayer"
            :all-layers="layers"
            :preview-layers="voronoiPreviewLayers"
            :enable-preview-hover="voronoiPreviewLayers.length > 0"
            :feature-box-select-enabled="isFeatureBoxSelectMode"
            @before-features-change="commitHistory"
            @features-change="handleActiveLayerFeaturesChange"
            @feature-select="handleFeatureSelect"
            @feature-box-select="handleFeatureBoxSelect"
            @mode-change="handleDrawModeChange"
            @export-image="handleImageExported"
            @export-layer="handleLayerExported"
            @export-selection-bounds-change="boxSelectionBounds = $event"
            @preview-feature-hover="handlePreviewFeatureHover"
            @map-click="handleMapClickForAddPoint"
          />
        </div>

        <div v-if="hoveredPolygon" class="voronoi-hover-tooltip">
          <strong>{{ hoveredPolygon.name }}</strong>
          <span
            v-if="hoveredPolygon.pointCount > 0"
            class="point-count"
          >{{ hoveredPolygon.pointCount }} 个方言点</span>
          <span
            v-else-if="hoveredPolygon.partitionKey"
            class="partition-info"
          >{{ hoveredPolygon.partitionKey }}</span>
        </div>

        <MapDrawToolsPanel
          :is-open="isDrawingPanelOpen"
          :offset-left="isLayersPanelOpen"
          :active-layer="activeLayer"
          :selected-layer-label="selectedLayerLabel"
          :current-mode="currentMode"
          :feature-items="activeLayerFeatureItems"
          :feature-table-columns="activeLayerFeatureTableColumns"
          :feature-table-rows="activeLayerFeatureTableRows"
          :feature-move-layer-options="featureMoveLayerOptions"
          :selected-feature-id="selectedEditorFeatureId"
          :selected-feature-ids="selectedFeatureIds"
          :selected-feature-batch-name="selectedFeatureBatchName"
          :selected-feature-batch-property-key="selectedFeatureBatchPropertyKey"
          :selected-feature-batch-property-value="selectedFeatureBatchPropertyValue"
          :can-apply-selected-feature-batch-property="canApplySelectedFeatureBatchProperty"
          :selected-feature-properties="selectedEditorProperties"
          :selected-feature-geometry-type="selectedEditorGeometryType"
          :is-fullscreen="isMapFullscreen"
          :can-undo="canUndoHistory"
          :can-redo="canRedoHistory"
          :can-edit-shape="canEditSelectedShape"
          :can-duplicate-feature="canDuplicateSelectedFeature"
          :is-feature-box-select-mode="isFeatureBoxSelectMode"
          :can-use-feature-box-select="canUseFeatureBoxSelect"
          :can-modify-active-layer="canModifyActiveLayer"
          @set-mode="setMode"
          @select-feature="handleSelectFeatureFromPanel"
          @toggle-feature-selection="handleToggleFeatureSelection"
          @select-all-features="handleSelectAllFeatures"
          @invert-feature-selection="handleInvertFeatureSelection"
          @clear-feature-selection="resetDrawSelectionMode"
          @toggle-feature-box-select="handleToggleFeatureBoxSelect"
          @edit-shape="handleEditSelectedShape"
          @duplicate-feature="handleDuplicateSelectedFeature"
          @undo="undoHistory"
          @redo="redoHistory"
          @delete-selected="handleDeleteSelected"
          @delete-selected-features="handleDeleteSelectedFeatures"
          @clear-all="handleClearAll"
          @reset-view="handleResetView"
          @toggle-fullscreen="handleToggleFullscreen"
          @update-feature-property="updateSelectedFeatureProperty"
          @update-feature-table-cell="handleUpdateFeatureTableCell"
          @update:selected-feature-batch-name="selectedFeatureBatchName = $event"
          @apply-selected-feature-batch-name="handleApplySelectedFeatureBatchName"
          @update:selected-feature-batch-property-key="selectedFeatureBatchPropertyKey = $event"
          @update:selected-feature-batch-property-value="selectedFeatureBatchPropertyValue = $event"
          @apply-selected-feature-batch-property="handleApplySelectedFeatureBatchProperty"
          @move-feature-to-layer="handleMoveSelectedFeatureToLayer"
          @move-selected-features-to-layer="handleMoveSelectedFeaturesToLayer"
          @set-selected-features-visible="handleSetSelectedFeaturesVisible"
          @set-selected-features-locked="handleSetSelectedFeaturesLocked"
        />

        <MapDrawLayersPanel
          :is-open="isLayersPanelOpen"
          :layers="layers"
          :active-layer-id="activeLayerId"
          :current-style-key="currentStyleKey"
          :map-style-options="mapStyleOptions"
          @select-layer="handleSelectLayer"
          @move-layer="moveLayer"
          @move-layer-to-top="moveLayerToTop"
          @move-layer-to-bottom="moveLayerToBottom"
          @toggle-layer-visibility="toggleLayerVisibility"
          @toggle-layer-lock="toggleLayerLock"
          @rename-layer="handleRenameLayer"
          @duplicate-layer="handleDuplicateLayer"
          @delete-layer="handleDeleteLayer"
          @set-all-layers-visibility="setAllLayersVisibility"
          @update-style-key="handlePanelStyleUpdate"
        />

        <MapDrawVoronoiPanel
          :is-open="isVoronoiPanelOpen"
          :total-points="voronoiTotalPointCount"
          :active-points="voronoiActivePointCount"
          :ignored-count="ignoredVoronoiLocations.length"
          :group-count="voronoiGroupCount"
          :partition-mode="voronoiPartitionMode"
          :region-level="voronoiRegionLevel"
          :is-loading-points="isVoronoiLoadingPoints"
          :is-calculating="isVoronoiCalculating"
          :status-text="voronoiStatusText"
          :is-points-preview-active="voronoiPreviewType === 'points'"
          :is-polygon-preview-active="voronoiPreviewType === 'polygons'"
          :offset-mode="voronoiPanelOffsetMode"
          :use-official-data="useVoronoiOfficialData"
          :has-custom-import="hasVoronoiCustomImport"
          :official-point-count="voronoiOfficialPointCount"
          :custom-point-count="voronoiCustomPointCount"
          :custom-import-summary="voronoiCustomImportSummaryText"
          :is-village-data-source="isVillageDataSource"
          :has-field-merge="hasFieldMerge"
          :expand-ratio="voronoiExpandRatio"
          :enable-expand="voronoiEnableExpand"
          @update:enable-expand="voronoiEnableExpand = $event"
          @update:partition-mode="voronoiPartitionMode = $event"
          @update:region-level="voronoiRegionLevel = $event"
          @update:use-official-data="useVoronoiOfficialData = $event"
          @open-custom-import="triggerVoronoiFileImport"
          @clear-custom-import="clearVoronoiCustomImport"
          @open-ignore-modal="openVoronoiIgnoreModal"
          @preview-points="previewVoronoiPoints"
          @export-layer="exportVoronoiToLayer"
          @calculate="handleBuildVoronoi"
          @open-field-merge="showFieldMergeModal = true"
          @update:expand-ratio="voronoiExpandRatio = $event"
          :is-adding-points="isAddingDialectPoints"
          @toggle-add-points="toggleAddDialectPoints"
        />
      </div>

      <input
        ref="importInputRef"
        type="file"
        accept=".json,.geojson,.kml,.kmz,.csv,application/geo+json,application/json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz,text/csv"
        class="draw-import-input"
        @change="handleImportAsNewLayer"
      >

      <!-- Add Layer Modal -->
      <AppModal
        v-model="showAddLayerModal"
        :title="t('map.drawTab.buttons.addLayerModalTitle')"
        size="sm"
      >
        <div class="draw-modal-choices">
          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onCreateLayerClicked('Point')"
          >
            <span class="draw-card-icon">📍</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.createPointLayer') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.createPointLayerDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onCreateLayerClicked('LineString')"
          >
            <span class="draw-card-icon">➖</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.createLineLayer') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.createLineLayerDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onCreateLayerClicked('Polygon')"
          >
            <span class="draw-card-icon">⬡</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.createPolygonLayer') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.createPolygonLayerDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onImportLayerClicked"
          >
            <span class="draw-card-icon">📤</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.importLayer') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.importLayerDesc') }}
              </div>
            </div>
          </button>
        </div>
      </AppModal>

      <!-- Export Modal -->
      <AppModal
        v-model="showExportModal"
        :title="t('map.drawTab.buttons.exportModalTitle')"
        size="sm"
      >
        <div class="draw-modal-choices">
          <button
            class="draw-modal-card-btn"
            type="button"
            :disabled="!activeLayer"
            @click="onExportCurrentClicked"
          >
            <span class="draw-card-icon">📄</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.exportLayer') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.exportCurrentLayerDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            :disabled="!layers.length"
            @click="onExportAllClicked"
          >
            <span class="draw-card-icon">🗂️</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.exportAllLayers') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.exportAllLayersDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onExportImageClicked"
          >
            <span class="draw-card-icon">🖼️</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.exportImage') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.exportImageDesc') }}
              </div>
            </div>
          </button>
        </div>
      </AppModal>

      <AppModal
        v-model="showLocalStorageModal"
        :title="t('map.drawTab.buttons.localStorageModalTitle')"
        size="sm"
      >
        <div class="draw-modal-choices draw-local-draft-actions">
          <button
            class="draw-modal-card-btn"
            type="button"
            @click="openSaveLocalDraftModal"
          >
            <span class="draw-card-icon">💾</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.saveAsNewLocal') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            :disabled="!storedDraftOptions.length"
            @click="handleUpdateLocal"
          >
            <span class="draw-card-icon">♻️</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.updateLocal') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            :disabled="!storedDraftOptions.length"
            @click="handleRestoreLocal"
          >
            <span class="draw-card-icon">📂</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.restoreLocal') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            :disabled="!storedDraftOptions.length"
            @click="handleDeleteLocal"
          >
            <span class="draw-card-icon">🗑️</span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.deleteLocal') }}
              </div>
            </div>
          </button>
        </div>

        <div class="draw-local-draft-picker">
          <label class="draw-field">
            <span class="draw-field-label">{{ t('map.drawTab.labels.localDraftSelection') }}</span>
            <SimpleSelectDropdown
              v-model="selectedStoredDraftId"
              :options="storedDraftOptions"
            />
          </label>
        </div>
      </AppModal>

      <AppModal
        v-model="showSaveLocalDraftModal"
        :title="t('map.drawTab.buttons.saveLocalDraftModalTitle')"
        size="sm"
      >
        <div class="draw-local-draft-picker">
          <label class="draw-field">
            <span class="draw-field-label">{{ t('map.drawTab.labels.localDraftName') }}</span>
            <input
              v-model="newDraftName"
              type="text"
              class="draw-text-input"
              :placeholder="t('map.drawTab.labels.localDraftNamePlaceholder')"
            >
          </label>
        </div>

        <template #footer>
          <div class="scope-modal-footer">
            <button class="main-glass-button" type="button" @click="showSaveLocalDraftModal = false">
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="main-glass-button scope-confirm-btn"
              data-variant="primary"
              type="button"
              @click="confirmSaveAsNewLocal"
            >
              {{ t('map.drawTab.buttons.saveAsNewLocal') }}
            </button>
          </div>
        </template>
      </AppModal>

      <MapDrawImageExportModal
        v-model="showImageExportModal"
        :layers="layers"
        :active-layer-id="activeLayerId"
        :selected-feature-id="selectedFeatureId"
        @confirm="handleConfirmImageExport"
      />

      <MapDrawImagePreviewModal
        v-model="showImagePreviewModal"
        :settings="imageExportSettings"
        :layers="layers"
        :active-layer-id="activeLayerId"
        :selected-feature-id="selectedFeatureId"
        :current-style-key="currentStyleKey"
        :initial-view-state="imageExportViewState"
        @exported="handleImagePreviewExported"
      />

      <VoronoiExportLayersModal
        v-model="showVoronoiExportModal"
        :groups="voronoiExportGroups"
        :selected-keys="voronoiExportSelections"
        :selected-count="selectedVoronoiExportCount"
        :export-limit="voronoiExportLimit"
        :is-selection-full="isVoronoiExportSelectionFull"
        :clip-to-national-border="clipVoronoiToNationalBorder"
        :is-exporting="isVoronoiExporting"
        @update:clip-to-national-border="handleClipVoronoiToggle"
        @toggle-selection="toggleVoronoiExportSelection"
        @clear-selection="voronoiExportSelections = []"
        @confirm="confirmVoronoiExport"
      />

      <div v-if="showVoronoiExportProgressOverlay" class="voronoi-export-progress-overlay">
        <div class="voronoi-export-progress-panel main-glass-panel-inner">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <div class="voronoi-export-progress-title">
            {{ t('map.drawTab.voronoi.exportLoadingTitle') }}
          </div>
          <div class="voronoi-export-progress-text">
            {{ t('map.drawTab.voronoi.exportLoadingProgress', {
              current: voronoiExportProgress.current,
              total: voronoiExportProgress.total,
            }) }}
          </div>
        </div>
      </div>

      <VoronoiIgnorePointsModal
        v-model="showVoronoiIgnoreModal"
        :regions="voronoiSelectionOptions.regions"
        :locations="voronoiSelectionOptions.locations"
        :ignored-locations="ignoredVoronoiLocations"
        @confirm="handleVoronoiIgnoreConfirm"
      />

      <VoronoiFieldMergeModal
        v-model="showFieldMergeModal"
        :field-merge-entries="fieldMergeEntries"
        @update:field-merge="updateFieldMerge"
        @reset-field-merge="resetFieldMerge"
      />

      <AppModal
        v-model="showAddDialectPartitionModal"
        :title="t('map.drawTab.voronoi.addPointSelectPartition')"
        size="sm"
      >
        <div class="draw-basemap-select" style="padding: 0.5rem 0;">
          <SimpleSelectDropdown
            v-model="pendingAddPartitionKey"
            :options="addDialectPartitionOptions"
          />
        </div>
        <div
          v-if="customPointsByPartition.length"
          class="add-point-partition-list"
        >
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.voronoi.customPointsManagement') }}
          </div>
          <div
            v-for="item in customPointsByPartition"
            :key="item.key"
            class="add-point-partition-row"
          >
            <span class="add-point-partition-key">{{ item.key }}</span>
            <span class="add-point-partition-count">{{ item.count }}</span>
            <button
              class="main-glass-button add-point-delete-btn"
              type="button"
              data-variant="secondary"
              @click="deleteCustomPointsByPartition(item.key)"
            >
              {{ t('map.drawTab.voronoi.deletePartitionPoints') }}
            </button>
          </div>
        </div>
        <div
          v-else
          class="draw-style-hint"
          style="padding: 0.5rem 0;"
        >
          {{ t('map.drawTab.voronoi.noCustomPoints') }}
        </div>
        <template #footer>
          <div class="scope-modal-footer">
            <button
              class="main-glass-button"
              type="button"
              @click="showAddDialectPartitionModal = false"
            >
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="main-glass-button scope-confirm-btn"
              data-variant="primary"
              type="button"
              :disabled="!pendingAddPartitionKey"
              @click="confirmAddDialectPartition"
            >
              {{ t('common.button.confirm') }}
            </button>
          </div>
        </template>
      </AppModal>

      <input
        ref="voronoiImportFileInputRef"
        class="draw-import-input"
        type="file"
        accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        @change="handleVoronoiFileChange"
      >

      <TabularImportPreview
        v-model="showVoronoiPreviewModal"
        :title="t('map.drawTab.voronoi.customImport.previewTitle')"
        :description="t('map.drawTab.voronoi.customImport.previewDescription')"
        :file="voronoiTabularState.file.value"
        :schema="voronoiImport.schema.value"
        :loading="voronoiTabularState.loading.value"
        :preview-table="voronoiTabularState.previewTable.value"
        :diagnostics="voronoiTabularState.diagnostics.value"
        :mapping="voronoiTabularState.mapping.value"
        :selected-sheet-id="voronoiTabularState.selectedSheetId.value"
        :header-row-index="voronoiTabularState.headerRowIndex.value"
        :sheets="voronoiTabularState.parsedFile.value?.sheets || []"
        @update:selected-sheet-id="voronoiTabularState.selectedSheetId.value = $event"
        @update:header-row-index="voronoiTabularState.headerRowIndex.value = $event"
        @update:mapping="voronoiTabularState.updateMapping($event.fieldKey, $event.sourceKey)"
        @reset="handleVoronoiPreviewReset"
        @confirm="handleVoronoiPreviewConfirm"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { featureCollection } from '@turf/turf';

import nationalBorderGeoJsonUrl from '/data/gis/china_country.geojson?url';
import { getLocationPartitions } from '@/api/main/geo/LocationAndRegion.js';
import { usePartitionCache } from '@/composables/data/usePartitionCache.js';
import { useAuthGuard } from '@/composables/router/useAuthGuard.js';
import { showConfirm, showError, showSuccess, showWarning } from '@/utils/ui/message.js';
import { readImportedLayerFile, readKmzArrayBuffer, splitFeatureCollectionByGeometryType } from '@/main/utils/drawMap/export.js';
import { createMapDrawHistory } from '@/main/utils/drawMap/history.js';
import {
  AUTO_DRAFT_ID,
  buildAutoDraftRecord,
  buildDraftStateSignature,
  deleteDraftRecord,
  getDraftRecordById,
  listDraftRecords,
  migrateLegacyDraftsFromLocalStorage,
  saveDraftRecord,
  updateDraftRecord,
} from '@/main/utils/drawMap/draftStorage.js';
import {
  clipVoronoiFeatureCollectionToNationalBorder,
  prepareNationalBorderForVoronoiClip,
} from '@/main/utils/drawMap/voronoiClip.js';
import {
  PARTITION_MODE_MAP,
  PARTITION_MODE_YINDIAN,
  buildPartitionColorMap,
  buildPartitionPointFeatureCollection,
  buildPartitionPoints,
  buildVoronoiSelectionOptions,
  calculatePartitionVoronoi,
  normalizePartitionPoint,
} from '@/main/utils/drawMap/partitionVoronoi.js';
import { pickDrawColor } from '@/main/config/colors/mapColors.js';
import { mapStyleConfig } from '@/utils/map/MapSource.js';
import EditableMapLibre from '@/main/components/map/EditableMapLibre.vue';
import MapDrawLayersPanel from '@/main/components/map/Draw/panels/MapDrawLayersPanel.vue';
import MapDrawToolsPanel from '@/main/components/map/Draw/panels/MapDrawToolsPanel.vue';
import MapDrawVoronoiPanel from '@/main/components/map/Draw/panels/MapDrawVoronoiPanel.vue';
import MapDrawImageExportModal from '@/main/components/map/Draw/modals/MapDrawImageExportModal.vue';
import MapDrawImagePreviewModal from '@/main/components/map/Draw/modals/MapDrawImagePreviewModal.vue';
import VoronoiExportLayersModal from '@/main/components/map/Draw/modals/VoronoiExportLayersModal.vue';
import VoronoiIgnorePointsModal from '@/main/components/map/Draw/modals/VoronoiIgnorePointsModal.vue';
import VoronoiFieldMergeModal from '@/main/components/map/Draw/modals/VoronoiFieldMergeModal.vue';
import TabularImportPreview from '@/components/import/TabularImportPreview.vue';
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js';
import { useVoronoiCustomImport } from '@/composables/import/useVoronoiCustomImport.js';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';
import AppModal from '@/components/common/AppModal.vue';
import { globalPayload } from '@/main/store/store.js';

const { t } = useI18n();
const route = useRoute();
const drawTabRoot = ref(null);
const { requireAuth, isAuthenticated } = useAuthGuard();
const { getPartitionData } = usePartitionCache();

const [defaultStroke, defaultPointColor] = pickDrawColor(0);
const defaultLayerStyle = {
  stroke: defaultStroke,
  strokeWidth: 3,
  fill: defaultPointColor,
  fillOpacity: 0.22,
  pointRadius: 6,
  pointColor: defaultPointColor,
  pointStrokeColor: defaultStroke,
  visible: true,
  locked: false,
};
const mapDrawStorageKey = 'map-draw-workbench-state';
const voronoiExportStorageKey = 'map-draw-voronoi-export-state';
const nationalBorderCacheKey = 'map-draw-national-border-cache-v3';
const nationalBorderAssetCacheName = 'map-draw-assets';
const voronoiExportLimit = 20;
let layerIdSeed = 0;
let nationalBorderPreparedCache = null;

const editableMapRef = ref(null);
const importInputRef = ref(null);
const currentMode = ref('simple_select');
const currentStyleKey = ref('gaode');
const selectedFeatureId = ref('');
const selectedFeatureIds = ref([]);
const isFeatureBoxSelectMode = ref(false);
const selectedFeatureBatchName = ref('');
const selectedFeatureBatchPropertyKey = ref('');
const selectedFeatureBatchPropertyValue = ref('');
const layers = ref([]);
const activeLayerId = ref('');
const isDrawingPanelOpen = ref(true);
const isLayersPanelOpen = ref(false);
const showAddLayerModal = ref(false);
const showExportModal = ref(false);
const showLocalStorageModal = ref(false);
const showSaveLocalDraftModal = ref(false);
const showImageExportModal = ref(false);
const showImagePreviewModal = ref(false);
const imageExportSettings = ref(null);
const imageExportViewState = ref(null);
const showVoronoiExportModal = ref(false);
const selectedStoredDraftId = ref('');
const newDraftName = ref('');
const storedDrafts = ref([]);
const isMapFullscreen = ref(false);
const voronoiExportSelections = ref([]);
const drawHistory = createMapDrawHistory({ limit: 50 });
const historySizes = ref(drawHistory.sizes());
const isApplyingHistory = ref(false);
const savedWorkbenchSignature = ref('');
const isRestoringAutoDraft = ref(false);
const pendingAutoDraftSaves = new Set();

const clipVoronoiToNationalBorder = ref(false);
const isVoronoiExporting = ref(false);
const activeFeatureId = computed(() => activeLayerId.value);

const emptyFeatureCollection = () => ({
  type: 'FeatureCollection',
  features: [],
});

const mapStyleOptions = computed(() => {
  return Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key,
  }));
});

const createEmptyLayer = (geometryType) => {
  layerIdSeed += 1;
  const [stroke, pointColor] = pickDrawColor(layerIdSeed);
  const geometryLabels = {
    Point: t('map.drawTab.geometry.point'),
    LineString: t('map.drawTab.geometry.line'),
    Polygon: t('map.drawTab.geometry.polygon'),
  };
  return {
    id: `draw-layer-${layerIdSeed}`,
    name: `${geometryLabels[geometryType] ?? t('map.drawTab.geometry.line')}${t('map.drawTab.labels.layer')} ${layerIdSeed}`,
    geometryType,
    ...defaultLayerStyle,
    stroke,
    fill: pointColor,
    pointColor,
    pointStrokeColor: stroke,
    featureCollection: emptyFeatureCollection(),
  };
};

const syncLayerIdSeedFromLayers = () => {
  const numericIds = layers.value
    .map((layer) => Number(String(layer?.id || '').replace('draw-layer-', '')))
    .filter((value) => Number.isFinite(value));
  layerIdSeed = numericIds.length ? Math.max(...numericIds) : layerIdSeed;
};

const activeLayer = computed(() => {
  return layers.value.find((layer) => layer.id === activeLayerId.value) ?? null;
});

const activeLayerFeatureCollection = computed({
  get() {
    return activeLayer.value?.featureCollection ?? emptyFeatureCollection();
  },
  set(nextValue) {
    updateActiveLayerFeatureCollection(nextValue);
  },
});

const featureCount = computed(() => {
  return layers.value.reduce(
    (count, layer) => count + (layer.featureCollection?.features?.length ?? 0),
    0
  );
});

const getFeatureId = (feature) => String(feature?.id ?? feature?.properties?.id ?? '');

const getFeatureLabel = (feature, index) => {
  const properties = feature?.properties ?? {};
  return properties.name || properties.title || properties.label || `${t('map.drawTab.labels.feature')} ${index + 1}`;
};

const activeLayerFeatures = computed(() => activeLayer.value?.featureCollection?.features ?? []);

const selectedFeature = computed(() => {
  if (!selectedFeatureId.value) return null;
  return activeLayerFeatures.value.find((feature) => getFeatureId(feature) === selectedFeatureId.value) ?? null;
});

const activeLayerFeatureIdSet = computed(() => new Set(
  activeLayerFeatures.value.map((feature) => getFeatureId(feature)).filter(Boolean)
));

const getValidSelectedFeatureIds = (featureIds = []) => {
  const seenFeatureIds = new Set();
  return featureIds
    .map((featureId) => String(featureId || ''))
    .filter((featureId) => {
      if (!featureId || seenFeatureIds.has(featureId) || !activeLayerFeatureIdSet.value.has(featureId)) {
        return false;
      }
      seenFeatureIds.add(featureId);
      return true;
    });
};

const setFeatureSelection = (featureIds = [], preferredFeatureId = '') => {
  const validFeatureIds = getValidSelectedFeatureIds(featureIds);
  const preferredId = String(preferredFeatureId || '');
  selectedFeatureIds.value = validFeatureIds;
  selectedFeatureId.value = validFeatureIds.includes(preferredId)
    ? preferredId
    : validFeatureIds[0] || '';
};

const clearFeatureSelection = () => {
  selectedFeatureId.value = '';
  selectedFeatureIds.value = [];
};

const activeLayerFeatureItems = computed(() => activeLayerFeatures.value.map((feature, index) => ({
  id: getFeatureId(feature),
  label: getFeatureLabel(feature, index),
  geometryType: feature?.geometry?.type || activeLayer.value?.geometryType || '',
  visible: feature?.properties?.visible ?? activeLayer.value?.visible ?? true,
  locked: feature?.properties?.locked ?? activeLayer.value?.locked ?? false,
})).filter((feature) => feature.id));

const activeLayerSelectableFeatureIds = computed(() => {
  if (!canModifyActiveLayer.value) return [];
  return activeLayerFeatureItems.value
    .filter((feature) => feature.visible !== false && feature.locked !== true)
    .map((feature) => feature.id);
});

const featureTableHiddenPropertyKeys = new Set([
  'id',
  'name',
  'title',
  'label',
  'stroke',
  'strokeWidth',
  'fill',
  'fillOpacity',
  'pointRadius',
  'pointColor',
  'pointStrokeColor',
  'visible',
  'locked',
  'user_stroke',
  'user_strokeWidth',
  'user_fill',
  'user_fillOpacity',
  'user_visible',
  'user_pointRadius',
  'user_pointColor',
  'user_pointStrokeColor',
]);

const isFeatureTableBusinessPropertyKey = (key) => {
  return Boolean(key && !featureTableHiddenPropertyKeys.has(key));
};

const formatFeatureTableValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const summarizeFeatureTableProperties = (properties = {}) => {
  const summaryItems = Object.entries(properties)
    .filter(([key, value]) => isFeatureTableBusinessPropertyKey(key) && value !== '' && value !== null && value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${formatFeatureTableValue(value)}`);
  return summaryItems.length ? summaryItems.join(' · ') : t('map.drawTab.labels.featurePropertiesEmpty');
};

const activeLayerFeatureTableColumns = computed(() => {
  const seenKeys = new Set();
  const columns = [];
  activeLayerFeatures.value.forEach((feature) => {
    Object.keys(feature?.properties ?? {}).forEach((key) => {
      if (!isFeatureTableBusinessPropertyKey(key) || seenKeys.has(key)) return;
      seenKeys.add(key);
      columns.push({ key, label: key });
    });
  });
  return columns;
});

const canApplySelectedFeatureBatchProperty = computed(() => activeLayerFeatureTableColumns.value.some((column) => {
  return column.key === selectedFeatureBatchPropertyKey.value;
}));

const buildFeatureTableProperties = (properties = {}) => Object.fromEntries(
  activeLayerFeatureTableColumns.value.map((column) => [
    column.key,
    formatFeatureTableValue(properties[column.key]),
  ])
);

const activeLayerFeatureTableRows = computed(() => activeLayerFeatures.value.map((feature, index) => ({
  id: getFeatureId(feature),
  name: feature?.properties?.name ?? getFeatureLabel(feature, index),
  geometryType: feature?.geometry?.type || activeLayer.value?.geometryType || '',
  visible: feature?.properties?.visible ?? activeLayer.value?.visible ?? true,
  locked: feature?.properties?.locked ?? activeLayer.value?.locked ?? false,
  properties: buildFeatureTableProperties(feature?.properties ?? {}),
  propertySummary: summarizeFeatureTableProperties(feature?.properties ?? {}),
})).filter((row) => row.id));

const featureMoveLayerOptions = computed(() => {
  if (!activeLayer.value || !selectedFeature.value) return [];
  if (!canDuplicateSelectedFeature.value) return [];
  return layers.value
    .filter((layer) => (
      layer.id !== activeLayerId.value
      && layer.geometryType === activeLayer.value?.geometryType
      && layer.visible !== false
      && layer.locked !== true
    ))
    .map((layer) => ({
      label: getLayerLabel(layer),
      value: layer.id,
    }));
});

const selectedEditorProperties = computed(() => {
  if (!activeLayer.value) return null;
  if (!selectedFeature.value) return activeLayer.value;
  return {
    ...activeLayer.value,
    ...(selectedFeature.value.properties ?? {}),
    name: selectedFeature.value.properties?.name ?? getFeatureLabel(
      selectedFeature.value,
      activeLayerFeatures.value.findIndex((feature) => getFeatureId(feature) === selectedFeatureId.value)
    ),
  };
});

const selectedEditorFeatureId = computed(() => selectedFeature.value ? selectedFeatureId.value : '');
const selectedEditorGeometryType = computed(() => selectedFeature.value?.geometry?.type || activeLayer.value?.geometryType || '');
const canModifyActiveLayer = computed(() => {
  if (!activeLayer.value) return true;
  return Boolean(
    activeLayer.value.visible !== false
    && activeLayer.value.locked !== true
  );
});
const canEditSelectedShape = computed(() => {
  return Boolean(
    selectedFeatureId.value
    && activeLayer.value
    && selectedFeature.value
    && !activeLayer.value.locked
    && selectedFeature.value.properties?.visible !== false
    && selectedFeature.value.properties?.locked !== true
    && ['LineString', 'Polygon'].includes(selectedEditorGeometryType.value)
  );
});
const canDuplicateSelectedFeature = computed(() => {
  return Boolean(
    selectedFeatureId.value
    && activeLayer.value
    && selectedFeature.value
    && canModifyActiveLayer.value
    && selectedFeature.value.properties?.visible !== false
    && selectedFeature.value.properties?.locked !== true
  );
});
const canUseFeatureBoxSelect = computed(() => {
  return canModifyActiveLayer.value && activeLayerSelectableFeatureIds.value.length > 0;
});
const canMoveSelectedFeatures = computed(() => {
  return Boolean(
    canDuplicateSelectedFeature.value
    && selectedFeatureIds.value.some((featureId) => activeLayerFeatureIdSet.value.has(featureId))
  );
});

const selectedLayerLabel = computed(() => {
  if (!activeLayer.value) return t('map.drawTab.labels.emptyLayer');
  return getLayerLabel(activeLayer.value);
});

const getLayerLabel = (layer) => {
  const count = layer.featureCollection?.features?.length ?? 0;
  return `${layer.name} · ${count}`;
};

const updateActiveLayerFeatureCollection = (nextValue) => {
  if (!activeLayer.value) return;
  activeLayer.value.featureCollection = nextValue ?? emptyFeatureCollection();
};

const handleLogin = async () => {
  await requireAuth({
    message: t('map.drawTab.auth.loginRequired'),
    redirect: route.fullPath || '/menu/map/draw',
  });
};

const handleStyleChange = () => {
  editableMapRef.value?.handleStyleChange?.();
};

const handlePanelStyleUpdate = (value) => {
  currentStyleKey.value = value;
  handleStyleChange();
};

const voronoiRawPartitionData = ref([]);
const voronoiPartitionPoints = ref([]);
const voronoiOfficialPoints = ref([]);
const voronoiCustomImportRows = ref([]);
const voronoiCustomImportMeta = ref(null);
const useVoronoiOfficialData = ref(true);
const showVoronoiPreviewModal = ref(false);
const voronoiImportFileInputRef = ref(null);

const voronoiImport = useVoronoiCustomImport();
const voronoiTabularState = useTabularImportPreview({
  schema: voronoiImport.schema,
  requireExplicitConfirmation: true,
});
const ignoredVoronoiLocations = ref([]);
const voronoiPreviewLayers = ref([]);
const voronoiPreviewType = ref('');
const hoveredPolygon = ref(null);
const handlePreviewFeatureHover = (info) => {
  hoveredPolygon.value = info;
};
const voronoiPartitionMode = ref(PARTITION_MODE_YINDIAN);
const voronoiRegionLevel = ref(1);
const isVoronoiPanelOpen = ref(false);
const isVoronoiLoadingPoints = ref(false);
const isVoronoiCalculating = ref(false);
const showVoronoiIgnoreModal = ref(false);
const showFieldMergeModal = ref(false);
const isAddingDialectPoints = ref(false);
const showAddDialectPartitionModal = ref(false);
const addDialectPartitionKey = ref('');
const pendingAddPartitionKey = ref('');
let addPointCounter = 0;

const addDialectPartitionOptions = computed(() => {
  const level = Number(voronoiRegionLevel.value) || 3;
  const keys = [...new Set(voronoiPartitionPoints.value.map((p) => {
    if (level === 1) return p.partitionLevel1;
    if (level === 2) return p.partitionLevel2;
    return p.partitionLevel3;
  }).filter(Boolean))];
  return keys.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN')).map((k) => ({
    label: k,
    value: k,
  }));
});

const customPointsByPartition = computed(() => {
  const level = Number(voronoiRegionLevel.value) || 3;
  const manualPoints = voronoiCustomImportRows.value.filter(p => p.source === 'manual');
  const groups = {};
  for (const p of manualPoints) {
    let key;
    if (level === 1) key = p.partitionLevel1;
    else if (level === 2) key = p.partitionLevel2;
    else key = p.partitionLevel3;
    if (!key) continue;
    groups[key] = (groups[key] || 0) + 1;
  }
  return Object.entries(groups)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
});
const voronoiStatusText = ref('');
const voronoiLastResult = ref(null);
const voronoiExportProgress = ref({ current: 0, total: 0 });
const showVoronoiExportProgressOverlay = computed(() => isVoronoiExporting.value && voronoiExportProgress.value.total > 0);

const isVillageDataSource = computed(() => voronoiCustomImportMeta.value?.partitionMode === 'village');
const voronoiExpandRatio = ref(50);
const voronoiEnableExpand = ref(false);

// 合并字段: partitionKey → groupName
const voronoiFieldMergeMap = ref(new Map());

const fieldMergeEntries = computed(() => {
  const level = Number(voronoiRegionLevel.value) || 3
  const keys = [...new Set(voronoiPartitionPoints.value.map(p => {
    if (level === 1) return p.partitionLevel1
    if (level === 2) return p.partitionLevel2
    return p.partitionLevel3
  }).filter(Boolean))]
  return keys.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN')).map(key => ({
    original: key,
    groupName: voronoiFieldMergeMap.value.get(key) ?? key,
  }))
})

const hasFieldMerge = computed(() => fieldMergeEntries.value.length > 0)

function initFieldMergeMap() {
  const next = new Map()
  const level = Number(voronoiRegionLevel.value) || 3
  voronoiPartitionPoints.value.forEach(p => {
    let key
    if (level === 1) key = p.partitionLevel1
    else if (level === 2) key = p.partitionLevel2
    else key = p.partitionLevel3
    if (key && !next.has(key)) next.set(key, key)
  })
  voronoiFieldMergeMap.value = next
}

function updateFieldMerge(original, groupName) {
  const next = new Map(voronoiFieldMergeMap.value)
  next.set(original, String(groupName ?? ''))
  voronoiFieldMergeMap.value = next
}

function resetFieldMerge() {
  initFieldMergeMap()
}

function applyFieldMerge(points) {
  if (voronoiFieldMergeMap.value.size === 0) return points
  const effective = (val) => (val != null && String(val).trim() !== '') ? val : undefined
  return points.map(p => {
    const group1 = effective(voronoiFieldMergeMap.value.get(p.partitionLevel1))
    const group2 = effective(voronoiFieldMergeMap.value.get(p.partitionLevel2))
    const group3 = effective(voronoiFieldMergeMap.value.get(p.partitionLevel3))
    if (group1 === undefined && group2 === undefined && group3 === undefined) return p
    return {
      ...p,
      partitionLevel1: group1 ?? p.partitionLevel1,
      partitionLevel2: group2 ?? p.partitionLevel2,
      partitionLevel3: group3 ?? p.partitionLevel3,
    }
  })
}

const normalizeVoronoiLocationName = (value) => String(value || '').trim();

const activeVoronoiPoints = computed(() => {
  const ignored = new Set(ignoredVoronoiLocations.value.map(normalizeVoronoiLocationName).filter(Boolean));
  const filtered = voronoiPartitionPoints.value.filter((item) => !ignored.has(normalizeVoronoiLocationName(item.name)));
  return applyFieldMerge(filtered);
});

const hasVoronoiCustomImport = computed(() => voronoiCustomImportRows.value.length > 0);

const voronoiCustomImportSummaryText = computed(() => {
  const meta = voronoiCustomImportMeta.value;
  if (!meta) return '';
  return t('map.drawTab.voronoi.customImport.summary.message', {
    count: voronoiCustomImportRows.value.length,
    total: meta.summary?.totalRowCount || voronoiCustomImportRows.value.length,
  });
});

const voronoiTotalPointCount = computed(() => voronoiPartitionPoints.value.length);
const voronoiOfficialPointCount = computed(() => voronoiOfficialPoints.value.length);
const voronoiCustomPointCount = computed(() => voronoiCustomImportRows.value.length);
const voronoiActivePointCount = computed(() => activeVoronoiPoints.value.length);
const voronoiGroupCount = computed(() => {
  const level = Number(voronoiRegionLevel.value) || 3;
  return new Set(activeVoronoiPoints.value.map((item) => (
    level === 1 ? item.partitionLevel1 : level === 2 ? item.partitionLevel2 : item.partitionLevel3
  ))).size;
});

const voronoiPanelOffsetMode = computed(() => {
  const openedPanelCount = [isDrawingPanelOpen.value, isLayersPanelOpen.value].filter(Boolean).length;
  return openedPanelCount >= 2 ? 'double' : openedPanelCount === 1 ? 'single' : 'none';
});

const voronoiSelectionOptions = computed(() => {
  return buildVoronoiSelectionOptions(applyFieldMerge(voronoiPartitionPoints.value), Number(voronoiRegionLevel.value) || 3);
});

const voronoiColorMap = computed(() => {
  return buildPartitionColorMap(activeVoronoiPoints.value, Number(voronoiRegionLevel.value) || 3);
});

const voronoiExportGroups = computed(() => {
  const groups = voronoiLastResult.value?.groups ?? {};
  const mergedFeatures = voronoiLastResult.value?.merged?.features ?? [];
  const level = Number(voronoiRegionLevel.value) || 3;

  return Object.keys(groups)
    .sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN'))
    .map((partitionKey) => {
      const cellCollection = groups[partitionKey] ?? emptyFeatureCollection();
      const mergedFeature = mergedFeatures.find((feature) => feature?.properties?.partitionKey === partitionKey) ?? null;
      const pointCount = mergedFeature?.properties?.pointCount
        ?? activeVoronoiPoints.value.filter((item) => {
          if (level === 1) return item.partitionLevel1 === partitionKey;
          if (level === 2) return item.partitionLevel2 === partitionKey;
          return item.partitionLevel3 === partitionKey;
        }).length;
      return {
        key: partitionKey,
        name: partitionKey,
        pointCount,
        cellCollection,
        mergedFeature,
      };
    });
});

const selectedVoronoiExportCount = computed(() => voronoiExportSelections.value.length);
const isVoronoiExportSelectionFull = computed(() => selectedVoronoiExportCount.value >= voronoiExportLimit);

const setVoronoiStatus = (key, params = {}) => {
  voronoiStatusText.value = t(`map.drawTab.voronoi.${key}`, params);
};

const syncVoronoiPartitionPoints = () => {
  const nextPoints = [];
  if (useVoronoiOfficialData.value) {
    nextPoints.push(...voronoiOfficialPoints.value);
  }
  if (voronoiCustomImportRows.value.length) {
    nextPoints.push(...voronoiCustomImportRows.value);
  }
  voronoiPartitionPoints.value = nextPoints;
};

const normalizeVoronoiPoints = (partitionData = voronoiRawPartitionData.value) => {
  voronoiOfficialPoints.value = buildPartitionPoints(partitionData, {
    partitionMode: voronoiPartitionMode.value,
  });
  syncVoronoiPartitionPoints();
};

const clearVoronoiPreviewState = () => {
  ignoredVoronoiLocations.value = [];
  voronoiLastResult.value = null;
  voronoiExportSelections.value = [];
  voronoiPreviewType.value = '';
  voronoiPreviewLayers.value = [];
};

const clearVoronoiCustomImport = () => {
  voronoiCustomImportRows.value = [];
  voronoiCustomImportMeta.value = null;
  syncVoronoiPartitionPoints();
  clearVoronoiPreviewState();
  setVoronoiStatus('customImportCleared');
};

const consumeVillageVoronoiPayload = async (payload) => {
  clearVoronoiCustomImport()

  voronoiCustomImportRows.value = (payload.points || []).map((p, i) => ({
    ...p,
    source: 'village',
    customRowId: `village-${i + 1}`,
  }))
  voronoiCustomImportMeta.value = {
    partitionMode: 'village',
    summary: {
      totalRowCount: (payload.points || []).length,
    },
  }

  useVoronoiOfficialData.value = false
  voronoiPartitionMode.value = PARTITION_MODE_MAP
  voronoiRegionLevel.value = 1

  syncVoronoiPartitionPoints()
  initFieldMergeMap()

  ignoredVoronoiLocations.value = []
  voronoiLastResult.value = null
  voronoiPreviewType.value = ''
  voronoiPreviewLayers.value = []

  isDrawingPanelOpen.value = false
  isVoronoiPanelOpen.value = true
  setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length })

  globalPayload.value = null
};

function triggerVoronoiFileImport() {
  voronoiImportFileInputRef.value?.click();
}

async function handleVoronoiFileChange(event) {
  const nextFile = event?.target?.files?.[0];
  if (!nextFile) return;

  try {
    await voronoiTabularState.loadFile(nextFile);
    showVoronoiPreviewModal.value = true;
  } catch (error) {
    showError(t('map.drawTab.voronoi.customImport.messages.parseFailed', {
      error: error?.message || String(error || ''),
    }));
  } finally {
    if (event?.target) {
      event.target.value = '';
    }
  }
}

function handleVoronoiPreviewReset() {
  voronoiTabularState.resetState();
  voronoiImport.clearImportedData();
  showVoronoiPreviewModal.value = false;
}

function handleVoronoiPreviewConfirm() {
  const rows = voronoiImport.applyPreviewSummary(voronoiTabularState.summary.value);
  if (!rows.length) {
    showError(t('map.drawTab.voronoi.customImport.messages.noValidRows'));
    return;
  }

  handleVoronoiCustomImportConfirm({
    rows,
    partitionMode: voronoiImport.partitionMode.value,
    summary: voronoiImport.summary.value,
  });
  showVoronoiPreviewModal.value = false;
}

const handleVoronoiCustomImportConfirm = ({ rows, partitionMode, summary }) => {
  voronoiCustomImportRows.value = Array.isArray(rows)
    ? rows.map((row, index) => ({
      ...row,
      name: String(row?.name || '').trim(),
      source: row?.source || 'custom',
      customRowId: row?.customRowId || `custom-${index + 1}`,
      partitionMode,
    }))
    : [];
  voronoiCustomImportMeta.value = { partitionMode, summary };
  syncVoronoiPartitionPoints();
  clearVoronoiPreviewState();
  setVoronoiStatus('customImportLoaded', { count: voronoiCustomImportRows.value.length });
};

const loadVoronoiPoints = async () => {
  if (isVoronoiLoadingPoints.value) return;
  isVoronoiLoadingPoints.value = true;

  try {
    const partitionData = await getPartitionData(() => getLocationPartitions());
    voronoiRawPartitionData.value = Array.isArray(partitionData) ? partitionData : [];
    normalizeVoronoiPoints(voronoiRawPartitionData.value);
    setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
    // console.log('[MapDrawTab] partition data:', partitionData);
    // console.log('[MapDrawTab] normalized partition points:', voronoiPartitionPoints.value);
  } catch (error) {
    console.error('[MapDrawTab] Load Voronoi points failed:', error);
    showError(t('map.drawTab.messages.voronoiFailed', { error: error.message || error }));
  } finally {
    isVoronoiLoadingPoints.value = false;
  }
};

const readNationalBorderCache = async () => {
  if (nationalBorderPreparedCache) return nationalBorderPreparedCache;

  const cacheStorage = typeof window !== 'undefined' && 'caches' in window
    ? await caches.open(nationalBorderAssetCacheName)
    : null;
  const cachedResponse = cacheStorage ? await cacheStorage.match(nationalBorderGeoJsonUrl) : null;

  if (!cachedResponse) {
    localStorage.removeItem(nationalBorderCacheKey);
    return null;
  }

  const featureCollectionValue = await cachedResponse.json();
  nationalBorderPreparedCache = prepareNationalBorderForVoronoiClip(featureCollectionValue);

  localStorage.setItem(nationalBorderCacheKey, JSON.stringify({ version: 3, cachedAt: Date.now() }));

  return nationalBorderPreparedCache;
};

const writeNationalBorderCache = async (featureCollectionValue) => {
  const cacheStorage = typeof window !== 'undefined' && 'caches' in window
    ? await caches.open(nationalBorderAssetCacheName)
    : null;

  if (cacheStorage) {
    const response = new Response(JSON.stringify(featureCollectionValue), {
      headers: { 'Content-Type': 'application/geo+json' },
    });
    await cacheStorage.put(nationalBorderGeoJsonUrl, response);
  }

  localStorage.setItem(nationalBorderCacheKey, JSON.stringify({ version: 3, cachedAt: Date.now() }));
};

const loadNationalBorderFeatureCollection = async () => {
  const cached = await readNationalBorderCache();
  if (cached) return cached;

  const response = await fetch(nationalBorderGeoJsonUrl);
  if (!response.ok) {
    throw new Error(`Failed to load national border GeoJSON: ${response.status}`);
  }

  const featureCollectionValue = await response.json();
  nationalBorderPreparedCache = prepareNationalBorderForVoronoiClip(featureCollectionValue);
  await writeNationalBorderCache(featureCollectionValue);
  return nationalBorderPreparedCache;
};

const ensureVoronoiPointsLoaded = async () => {
  if (voronoiPartitionPoints.value.length) return;
  await loadVoronoiPoints();
};

const openVoronoiIgnoreModal = async () => {
  await ensureVoronoiPointsLoaded();
  showVoronoiIgnoreModal.value = true;
};

const refreshVoronoiPreview = async (previewType = voronoiPreviewType.value) => {
  if (previewType === 'points') {
    await previewVoronoiPoints({ force: true });
    return;
  }
  if (previewType === 'polygons') {
    await handleBuildVoronoi({ force: true });
  }
};

const handleVoronoiIgnoreConfirm = async (locations) => {
  const previousPreviewType = voronoiPreviewType.value;
  ignoredVoronoiLocations.value = Array.isArray(locations)
    ? locations.map(normalizeVoronoiLocationName).filter(Boolean)
    : [];
  voronoiLastResult.value = null;
  voronoiExportSelections.value = [];
  voronoiPreviewType.value = '';
  voronoiPreviewLayers.value = [];
  console.log('[MapDrawTab] ignore confirm', {
    ignoredCount: ignoredVoronoiLocations.value.length,
    ignoredLocations: ignoredVoronoiLocations.value.slice(0, 20),
    totalPoints: voronoiPartitionPoints.value.length,
    activePoints: activeVoronoiPoints.value.length,
    activePointSamples: activeVoronoiPoints.value.slice(0, 10).map((item) => item.name),
  });
  setVoronoiStatus('ignoreUpdated', { count: ignoredVoronoiLocations.value.length });
  await refreshVoronoiPreview(previousPreviewType);
};

const previewVoronoiPoints = async ({ force = false } = {}) => {
  if (!force && voronoiPreviewType.value === 'points') {
    voronoiPreviewType.value = '';
    voronoiPreviewLayers.value = [];
    setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
    return;
  }

  await ensureVoronoiPointsLoaded();
  const pointCollection = buildPartitionPointFeatureCollection(
    activeVoronoiPoints.value,
    Number(voronoiRegionLevel.value) || 3,
    voronoiColorMap.value
  );
  console.log('[MapDrawTab] preview points', {
    ignoredCount: ignoredVoronoiLocations.value.length,
    activePoints: activeVoronoiPoints.value.length,
    previewFeatureCount: pointCollection.features.length,
    previewPointSamples: pointCollection.features.slice(0, 10).map((feature) => feature.properties?.name),
  });
  voronoiPreviewType.value = 'points';
  voronoiPreviewLayers.value = [{
    id: 'voronoi-preview-points',
    type: 'points',
    featureCollection: pointCollection,
  }];
  setVoronoiStatus('previewReady', { count: pointCollection.features.length });
  // console.log('[MapDrawTab] voronoi preview points:', pointCollection);
};

const handleBuildVoronoi = async ({ force = false } = {}) => {
  if (isVoronoiCalculating.value) return;
  if (!force && voronoiPreviewType.value === 'polygons') {
    voronoiPreviewType.value = '';
    voronoiPreviewLayers.value = [];
    setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
    return;
  }
  isVoronoiCalculating.value = true;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  try {
    await ensureVoronoiPointsLoaded();
    const level = Number(voronoiRegionLevel.value) || 3;
    const points = activeVoronoiPoints.value;
    console.log('[MapDrawTab] build voronoi input', {
      ignoredCount: ignoredVoronoiLocations.value.length,
      inputPointCount: points.length,
      inputPointSamples: points.slice(0, 10).map((item) => item.name),
    });
    const expandRatio = voronoiEnableExpand.value ? voronoiExpandRatio.value : -1;
    const voronoiResult = calculatePartitionVoronoi(points, level, voronoiColorMap.value, expandRatio);
    voronoiLastResult.value = voronoiResult;

    voronoiPreviewType.value = 'polygons';
    voronoiPreviewLayers.value = [{
      id: 'voronoi-preview-polygons',
      type: 'polygons',
      featureCollection: voronoiResult.merged,
    }];
    setVoronoiStatus('calculated', { count: voronoiResult.merged.features.length });
    // console.log('[MapDrawTab] voronoi cells:', voronoiResult.cells);
    // console.log('[MapDrawTab] merged partition polygons:', voronoiResult.merged);
  } catch (error) {
    console.error('[MapDrawTab] Voronoi calculation failed:', error);
    showError(t('map.drawTab.messages.voronoiFailed', { error: error.message || error }));
  } finally {
    isVoronoiCalculating.value = false;
  }
};

const exportVoronoiToLayer = async () => {
  await ensureVoronoiPointsLoaded();
  const level = Number(voronoiRegionLevel.value) || 3;
  const points = activeVoronoiPoints.value;
  const expandRatio2 = voronoiEnableExpand.value ? voronoiExpandRatio.value : -1;
  const voronoiResult = calculatePartitionVoronoi(points, level, voronoiColorMap.value, expandRatio2);
  voronoiLastResult.value = voronoiResult;

  const exportableKeys = voronoiExportGroups.value.map((item) => item.key);
  const nextSelections = voronoiExportSelections.value.filter((item) => exportableKeys.includes(item));
  voronoiExportSelections.value = nextSelections.length ? nextSelections : exportableKeys.slice(0, voronoiExportLimit);
  showVoronoiExportModal.value = true;
};

const toggleVoronoiExportSelection = (partitionKey) => {
  const next = new Set(voronoiExportSelections.value);
  if (next.has(partitionKey)) {
    next.delete(partitionKey);
    voronoiExportSelections.value = Array.from(next);
    return;
  }
  if (next.size >= voronoiExportLimit) {
    showError(t('map.drawTab.voronoi.exportSelectionLimit', { count: voronoiExportLimit }));
    return;
  }
  next.add(partitionKey);
  voronoiExportSelections.value = Array.from(next);
};

const handleClipVoronoiToggle = async (nextValue) => {
  if (!nextValue) {
    clipVoronoiToNationalBorder.value = false;
    return;
  }

  const confirmed = await showConfirm(t('map.drawTab.voronoi.clipToNationalBorderConfirmMessage'), {
    title: t('messages.confirm.title'),
  });
  clipVoronoiToNationalBorder.value = confirmed;
};

const confirmVoronoiExport = async () => {
  if (isVoronoiExporting.value) return;
  if (!voronoiExportSelections.value.length) {
    showError(t('map.drawTab.voronoi.exportSelectionRequired'));
    return;
  }

  const selectedGroups = voronoiExportGroups.value.filter((item) => voronoiExportSelections.value.includes(item.key));
  showVoronoiExportModal.value = false;
  isVoronoiExporting.value = true;
  try {
    const preparedBorderEntries = clipVoronoiToNationalBorder.value
      ? await loadNationalBorderFeatureCollection()
      : null;

    voronoiExportProgress.value = { current: 0, total: selectedGroups.length };
    const exportedLayers = [];

    for (const [index, group] of selectedGroups.entries()) {
      voronoiExportProgress.value.current = index + 1;
      const layer = createEmptyLayer('Polygon');
      const sourceCollection = group.mergedFeature
        ? featureCollection([group.mergedFeature])
        : emptyFeatureCollection();
      const nextCollection = preparedBorderEntries
        ? await clipVoronoiFeatureCollectionToNationalBorder(sourceCollection, preparedBorderEntries)
        : sourceCollection;

      if (!(nextCollection.features?.length ?? 0)) {
        continue;
      }

      const styledFeatureCollection = {
        ...nextCollection,
        features: (nextCollection.features ?? []).map((feature) => ({
          ...feature,
          id: feature.id ?? `voronoi-${group.key}-${index + 1}`,
          properties: {
            ...(feature.properties ?? {}),
            stroke: feature.properties?.stroke ?? defaultStroke,
            strokeWidth: feature.properties?.strokeWidth ?? 2,
            fill: feature.properties?.fill ?? defaultPointColor,
            fillOpacity: feature.properties?.fillOpacity ?? 0.22,
            visible: true,
            locked: false,
          },
        })),
      };

      layer.name = group.name;
      layer.stroke = styledFeatureCollection.features[0]?.properties?.stroke ?? defaultStroke;
      layer.strokeWidth = styledFeatureCollection.features[0]?.properties?.strokeWidth ?? 2;
      layer.fill = styledFeatureCollection.features[0]?.properties?.fill ?? defaultPointColor;
      layer.fillOpacity = styledFeatureCollection.features[0]?.properties?.fillOpacity ?? 0.22;
      layer.featureCollection = styledFeatureCollection;
      exportedLayers.push(layer);
    }

    if (!exportedLayers.length) {
      showError(t('map.drawTab.voronoi.exportEmptyAfterClip'));
      return;
    }

    commitHistory();
    layers.value.unshift(...exportedLayers);
    activeLayerId.value = exportedLayers[0].id;
    isLayersPanelOpen.value = true;
    isDrawingPanelOpen.value = true;
    currentMode.value = 'simple_select';
    editableMapRef.value?.setDrawMode?.('simple_select');
    voronoiPreviewType.value = '';
    voronoiPreviewLayers.value = [];
    showVoronoiExportModal.value = false;
    syncAllLayersAfterMutation();
    showSuccess(t('map.drawTab.messages.importLayerSuccess', { count: exportedLayers.length }));
  } catch (error) {
    showError(t('map.drawTab.messages.exportLayerFailed', { error: error.message || error }));
  } finally {
    isVoronoiExporting.value = false;
    voronoiExportProgress.value = { current: 0, total: 0 };
  }
};

watch(voronoiPartitionMode, async () => {
  normalizeVoronoiPoints();
  clearVoronoiPreviewState();
  addDialectPartitionKey.value = '';
  await refreshVoronoiPreview();
  if (!voronoiPreviewType.value) {
    voronoiPreviewLayers.value = [];
  }
});

watch(voronoiRegionLevel, async () => {
  voronoiLastResult.value = null;
  voronoiExportSelections.value = [];
  addDialectPartitionKey.value = addDialectPartitionOptions.value[0]?.value ?? '';
  await refreshVoronoiPreview();
  if (!voronoiPreviewType.value) {
    voronoiPreviewLayers.value = [];
  }
});

watch(useVoronoiOfficialData, () => {
  syncVoronoiPartitionPoints();
  clearVoronoiPreviewState();
  setVoronoiStatus('sourceUpdated', { count: voronoiPartitionPoints.value.length });
});

watch(selectedStoredDraftId, async (draftId) => {
  if (!draftId) {
    newDraftName.value = '';
    return;
  }

  const draft = storedDrafts.value.find((item) => item.id === draftId)
    ?? await getDraftRecordById(draftId);
  newDraftName.value = draft?.name || '';
});

watch(clipVoronoiToNationalBorder, (value) => {
  localStorage.setItem(voronoiExportStorageKey, JSON.stringify({
    clipVoronoiToNationalBorder: Boolean(value),
  }));
});

watch(isVoronoiPanelOpen, async (isOpen) => {
  if (!isOpen) {
    isAddingDialectPoints.value = false;
    return;
  }
  await ensureVoronoiPointsLoaded();
});

watch(() => globalPayload.value, (payload) => {
  if (payload && payload._type === 'villageVoronoi' && Array.isArray(payload.points) && payload.points.length > 0) {
    consumeVillageVoronoiPayload(payload)
  }
}, { immediate: true })

const handleCreateLayer = (geometryType) => {
  commitHistory();
  const layer = createEmptyLayer(geometryType);
  layers.value.push(layer);
  activeLayerId.value = layer.id;
  clearFeatureSelection();
  isDrawingPanelOpen.value = true;
  const mode = geometryType === 'Point'
    ? 'draw_point'
    : geometryType === 'Polygon'
      ? 'draw_polygon'
      : 'draw_line_string';
  setMode(mode);
};

const setMode = (mode) => {
  isFeatureBoxSelectMode.value = false;
  if (!activeLayer.value && mode !== 'simple_select') {
    const geometryType = mode === 'draw_point'
      ? 'Point'
      : mode === 'draw_polygon'
        ? 'Polygon'
        : 'LineString';
    handleCreateLayer(geometryType);
    return;
  }
  if (!canModifyActiveLayer.value && mode !== 'simple_select') {
    resetDrawSelectionMode();
    return;
  }
  editableMapRef.value?.setDrawMode?.(mode);
  currentMode.value = mode;
};

const handleSelectLayer = (layerId) => {
  activeLayerId.value = layerId;
  clearFeatureSelection();
  currentMode.value = 'simple_select';
  editableMapRef.value?.setDrawMode?.('simple_select');
};

const moveLayer = (layerId, direction) => {
  const layerIndex = layers.value.findIndex((item) => item.id === layerId);
  if (layerIndex === -1) return;
  const targetIndex = layerIndex + direction;
  if (targetIndex < 0 || targetIndex >= layers.value.length) return;
  commitHistory();
  const [layer] = layers.value.splice(layerIndex, 1);
  layers.value.splice(targetIndex, 0, layer);
  syncAllLayersAfterMutation();
};

const syncActiveLayerToMap = () => {
  if (!activeLayer.value) return;
  editableMapRef.value?.importGeoJson?.(
    activeLayer.value.featureCollection,
    { emitChanges: false, emitSelection: false }
  );
};

const syncAllLayersAfterMutation = () => {
  syncActiveLayerToMap();
};

const resetDrawSelectionMode = () => {
  isFeatureBoxSelectMode.value = false;
  clearFeatureSelection();
  currentMode.value = 'simple_select';
  if (editableMapRef.value?.selectFeatures) {
    editableMapRef.value.selectFeatures([]);
  } else {
    editableMapRef.value?.setDrawMode?.('simple_select');
  }
};

const syncFeatureSelectionToMap = () => {
  currentMode.value = 'simple_select';
  if (selectedFeatureIds.value.length > 1) {
    editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);
    return;
  }
  if (selectedFeatureId.value) {
    editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
    return;
  }
  if (editableMapRef.value?.selectFeatures) {
    editableMapRef.value.selectFeatures([]);
  } else {
    editableMapRef.value?.setDrawMode?.('simple_select');
  }
};

const applyLayerPropertyToFeatures = (layer, key, value) => {
  const featureCollection = layer?.featureCollection ?? emptyFeatureCollection();
  layer.featureCollection = {
    ...featureCollection,
    features: (featureCollection.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        [key]: value,
      },
    })),
  };
};

const toggleLayerVisibility = (layerId) => {
  const layer = layers.value.find((item) => item.id === layerId);
  if (!layer) return;
  commitHistory();
  layer.visible = !layer.visible;
  applyLayerPropertyToFeatures(layer, 'visible', layer.visible);
  if (layerId === activeLayerId.value) {
    resetDrawSelectionMode();
  }
  syncAllLayersAfterMutation();
  editableMapRef.value?.syncReadonlyLayers?.();
};

const setAllLayersVisibility = (visible) => {
  if (layers.value.every((layer) => layer.visible === visible)) return;
  commitHistory();
  layers.value.forEach((layer) => {
    layer.visible = visible;
    applyLayerPropertyToFeatures(layer, 'visible', visible);
  });
  if (!visible && activeLayer.value) {
    resetDrawSelectionMode();
  }
  syncAllLayersAfterMutation();
  editableMapRef.value?.syncReadonlyLayers?.();
};

const toggleLayerLock = (layerId) => {
  const layer = layers.value.find((item) => item.id === layerId);
  if (!layer) return;
  commitHistory();
  layer.locked = !layer.locked;
  applyLayerPropertyToFeatures(layer, 'locked', layer.locked);
  if (layerId === activeLayerId.value) {
    resetDrawSelectionMode();
  }
  syncAllLayersAfterMutation();
};

const handleRenameLayer = (layerId, name) => {
  const targetLayer = layers.value.find((item) => item.id === layerId);
  const nextName = String(name || '').trim();
  if (!targetLayer || !nextName || targetLayer.name === nextName) return;
  commitHistory();
  const previousName = targetLayer.name;
  targetLayer.name = nextName;
  const featureCollection = targetLayer.featureCollection ?? emptyFeatureCollection();
  targetLayer.featureCollection = {
    ...featureCollection,
    features: (featureCollection.features ?? []).map((feature) => {
      const properties = feature.properties ?? {};
      const featureName = properties.name;
      if (featureName && featureName !== previousName) return feature;
      return {
        ...feature,
        properties: {
          ...properties,
          name: nextName,
        },
      };
    }),
  };
  syncAllLayersAfterMutation();
};

const cloneFeatureForDuplicateLayer = (feature, index, layerId) => {
  const duplicatedFeatureId = `${layerId}-feature-${index + 1}`;
  return {
    ...feature,
    id: duplicatedFeatureId,
    properties: {
      ...(feature?.properties ?? {}),
      id: duplicatedFeatureId,
    },
    geometry: feature?.geometry
      ? {
          ...feature.geometry,
          coordinates: structuredClone(feature.geometry.coordinates),
        }
      : feature?.geometry,
  };
};

const handleDuplicateLayer = (layerId) => {
  const sourceLayer = layers.value.find((item) => item.id === layerId);
  if (!sourceLayer) return;
  commitHistory();
  const duplicatedLayer = createEmptyLayer(sourceLayer.geometryType);
  duplicatedLayer.name = `${sourceLayer.name} ${t('map.drawTab.labels.copySuffix')}`;
  duplicatedLayer.stroke = sourceLayer.stroke;
  duplicatedLayer.strokeWidth = sourceLayer.strokeWidth;
  duplicatedLayer.fill = sourceLayer.fill;
  duplicatedLayer.fillOpacity = sourceLayer.fillOpacity;
  duplicatedLayer.pointRadius = sourceLayer.pointRadius;
  duplicatedLayer.pointColor = sourceLayer.pointColor;
  duplicatedLayer.pointStrokeColor = sourceLayer.pointStrokeColor;
  duplicatedLayer.visible = sourceLayer.visible;
  duplicatedLayer.locked = sourceLayer.locked;
  duplicatedLayer.featureCollection = {
    ...(sourceLayer.featureCollection ?? emptyFeatureCollection()),
    features: (sourceLayer.featureCollection?.features ?? [])
      .map((feature, index) => cloneFeatureForDuplicateLayer(feature, index, duplicatedLayer.id)),
  };
  const sourceIndex = layers.value.findIndex((item) => item.id === layerId);
  layers.value.splice(sourceIndex + 1, 0, duplicatedLayer);
  activeLayerId.value = duplicatedLayer.id;
  clearFeatureSelection();
  currentMode.value = 'simple_select';
  editableMapRef.value?.setDrawMode?.('simple_select');
  syncAllLayersAfterMutation();
  editableMapRef.value?.syncReadonlyLayers?.();
};

const handleDeleteLayer = async (layerId) => {
  const layerIndex = layers.value.findIndex((item) => item.id === layerId);
  if (layerIndex === -1) return;
  const sourceLayer = layers.value[layerIndex];
  const confirmed = await showConfirm(t('map.drawTab.messages.deleteLayerConfirm', { name: sourceLayer.name }));
  if (!confirmed) return;
  commitHistory();
  layers.value.splice(layerIndex, 1);
  editableMapRef.value?.removeReadonlyLayerById?.(layerId);

  if (activeLayerId.value === layerId) {
    const fallbackLayer = layers.value[layerIndex] ?? layers.value[layerIndex - 1] ?? null;
    activeLayerId.value = fallbackLayer?.id ?? '';
    clearFeatureSelection();
    currentMode.value = 'simple_select';
    editableMapRef.value?.setDrawMode?.('simple_select');
  }
  syncAllLayersAfterMutation();
};

const normalizeFeatureSelectPayload = (featureSelection) => {
  const selectableFeatureIdSet = new Set(activeLayerSelectableFeatureIds.value);
  const sourceFeatureIds = (Array.isArray(featureSelection)
    ? featureSelection
    : featureSelection ? [featureSelection] : [])
    .map((featureId) => String(featureId || ''))
    .filter(Boolean);
  const featureIds = sourceFeatureIds.filter((featureId) => selectableFeatureIdSet.has(featureId));
  const shouldSyncMapSelection = sourceFeatureIds.length !== featureIds.length
    || sourceFeatureIds.some((featureId, index) => featureId !== featureIds[index]);

  if (Array.isArray(featureSelection)) {
    return {
      featureIds,
      preferredFeatureId: featureIds[0] || '',
      shouldSyncMapSelection,
    };
  }

  return {
    featureIds,
    preferredFeatureId: featureIds[0] || '',
    shouldSyncMapSelection,
  };
};

const handleFeatureSelect = (featureSelection) => {
  const { featureIds, preferredFeatureId, shouldSyncMapSelection } = normalizeFeatureSelectPayload(featureSelection);
  setFeatureSelection(featureIds, preferredFeatureId);
  if (shouldSyncMapSelection) {
    syncFeatureSelectionToMap();
  }
};

const handleDrawModeChange = (mode) => {
  currentMode.value = mode || 'simple_select';
  if (currentMode.value !== 'simple_select') {
    isFeatureBoxSelectMode.value = false;
  }
};

const handleEditSelectedShape = () => {
  if (!canEditSelectedShape.value) return;
  editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: true });
  currentMode.value = 'direct_select';
};

const buildDuplicateFeatureId = (layer, sourceFeatureId) => {
  const existingIds = new Set(
    (layer?.featureCollection?.features ?? []).map((feature) => getFeatureId(feature)).filter(Boolean)
  );
  const safeSourceFeatureId = String(sourceFeatureId || 'feature');
  let index = 1;
  let duplicatedFeatureId = `${safeSourceFeatureId}-copy-${index}`;
  while (existingIds.has(duplicatedFeatureId)) {
    index += 1;
    duplicatedFeatureId = `${safeSourceFeatureId}-copy-${index}`;
  }
  return duplicatedFeatureId;
};

const cloneFeatureForDuplicate = (feature, duplicatedFeatureId, options = {}) => ({
  ...feature,
  id: duplicatedFeatureId,
  properties: {
    ...(feature?.properties ?? {}),
    id: duplicatedFeatureId,
    name: options.name ?? feature?.properties?.name,
  },
  geometry: feature?.geometry
    ? {
        ...feature.geometry,
        coordinates: structuredClone(feature.geometry.coordinates),
      }
    : feature?.geometry,
});

const handleDuplicateSelectedFeature = () => {
  if (!canDuplicateSelectedFeature.value) return;
  const duplicatedFeatureId = buildDuplicateFeatureId(activeLayer.value, selectedFeatureId.value);
  const duplicatedFeature = cloneFeatureForDuplicate(selectedFeature.value, duplicatedFeatureId, {
    name: `${selectedEditorProperties.value?.name ?? t('map.drawTab.labels.feature')} ${t('map.drawTab.labels.copySuffix')}`,
  });
  const featureCollection = activeLayer.value.featureCollection ?? emptyFeatureCollection();
  commitHistory();
  activeLayer.value.featureCollection = {
    ...featureCollection,
    features: [...(featureCollection.features ?? []), duplicatedFeature],
  };
  setFeatureSelection([duplicatedFeatureId], duplicatedFeatureId);
  currentMode.value = 'simple_select';
  syncAllLayersAfterMutation();
  editableMapRef.value?.selectFeature?.(duplicatedFeatureId, { directEdit: false });
};

const handleMoveSelectedFeatureToLayer = (targetLayerId) => {
  if (!canDuplicateSelectedFeature.value) return;
  const sourceLayer = activeLayer.value;
  const targetLayer = layers.value.find((layer) => layer.id === targetLayerId);
  const featureToMove = selectedFeature.value;
  if (!sourceLayer || !targetLayer || !featureToMove || sourceLayer.id === targetLayer.id) return;
  if (
    targetLayer.geometryType !== activeLayer.value?.geometryType
    || targetLayer.visible === false
    || targetLayer.locked === true
  ) return;

  commitHistory();
  const sourceCollection = sourceLayer.featureCollection ?? emptyFeatureCollection();
  const targetCollection = targetLayer.featureCollection ?? emptyFeatureCollection();
  sourceLayer.featureCollection = {
    ...sourceCollection,
    features: (sourceCollection.features ?? [])
      .filter((feature) => getFeatureId(feature) !== selectedFeatureId.value),
  };
  targetLayer.featureCollection = {
    ...targetCollection,
    features: [...(targetCollection.features ?? []), featureToMove],
  };
  activeLayerId.value = targetLayer.id;
  setFeatureSelection([selectedFeatureId.value], selectedFeatureId.value);
  currentMode.value = 'simple_select';
  syncAllLayersAfterMutation();
  editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
};

const handleMoveSelectedFeaturesToLayer = (targetLayerId) => {
  if (!canMoveSelectedFeatures.value) return;
  const sourceLayer = activeLayer.value;
  const targetLayer = layers.value.find((layer) => layer.id === targetLayerId);
  if (!sourceLayer || !targetLayer || sourceLayer.id === targetLayer.id) return;
  if (
    targetLayer.geometryType !== activeLayer.value?.geometryType
    || targetLayer.visible === false
    || targetLayer.locked === true
  ) return;

  const selectedFeatureIdSet = new Set(selectedFeatureIds.value);
  const sourceCollection = sourceLayer.featureCollection ?? emptyFeatureCollection();
  const sourceFeatures = sourceCollection.features ?? [];
  const featuresToMove = sourceFeatures
    .filter((feature) => selectedFeatureIdSet.has(getFeatureId(feature)));
  if (featuresToMove.length === 0) return;

  commitHistory();
  sourceLayer.featureCollection = {
    ...sourceCollection,
    features: sourceFeatures.filter((feature) => !selectedFeatureIdSet.has(getFeatureId(feature))),
  };
  const targetCollection = targetLayer.featureCollection ?? emptyFeatureCollection();
  targetLayer.featureCollection = {
    ...targetCollection,
    features: [...(targetCollection.features ?? []), ...featuresToMove],
  };
  const movedFeatureIds = featuresToMove.map((feature) => getFeatureId(feature)).filter(Boolean);
  activeLayerId.value = targetLayer.id;
  setFeatureSelection(movedFeatureIds, movedFeatureIds[0]);
  currentMode.value = 'simple_select';
  syncAllLayersAfterMutation();
  if (selectedFeatureIds.value.length > 1) {
    editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);
    return;
  }
  editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
};

const handleSelectFeatureFromPanel = (featureId) => {
  if (!featureId) return;
  setFeatureSelection([featureId], featureId);
  editableMapRef.value?.selectFeature?.(featureId, { directEdit: false });
  currentMode.value = 'simple_select';
};

const handleToggleFeatureSelection = (featureId) => {
  const normalizedFeatureId = String(featureId || '');
  if (!normalizedFeatureId || !activeLayerFeatureIdSet.value.has(normalizedFeatureId)) return;

  const nextFeatureIds = new Set(selectedFeatureIds.value);
  if (nextFeatureIds.has(normalizedFeatureId)) {
    nextFeatureIds.delete(normalizedFeatureId);
  } else {
    nextFeatureIds.add(normalizedFeatureId);
  }

  setFeatureSelection([...nextFeatureIds], normalizedFeatureId);
  currentMode.value = 'simple_select';
  if (selectedFeatureIds.value.length > 1) {
    editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);
    return;
  }
  if (selectedFeatureId.value) {
    editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
    return;
  }
  if (editableMapRef.value?.selectFeatures) {
    editableMapRef.value.selectFeatures([]);
  } else {
    editableMapRef.value?.setDrawMode?.('simple_select');
  }
};

const handleSelectAllFeatures = () => {
  const featureIds = activeLayerSelectableFeatureIds.value;
  setFeatureSelection(featureIds, featureIds[0]);
  syncFeatureSelectionToMap();
};

const handleInvertFeatureSelection = () => {
  const selectableFeatureIds = activeLayerSelectableFeatureIds.value;
  const selectedFeatureIdSet = new Set(selectedFeatureIds.value);
  const nextFeatureIds = selectableFeatureIds.filter((featureId) => !selectedFeatureIdSet.has(featureId));
  setFeatureSelection(nextFeatureIds, nextFeatureIds[0]);
  syncFeatureSelectionToMap();
};

const handleToggleFeatureBoxSelect = () => {
  if (!canUseFeatureBoxSelect.value) {
    isFeatureBoxSelectMode.value = false;
    return;
  }
  isFeatureBoxSelectMode.value = !isFeatureBoxSelectMode.value;
  if (!isFeatureBoxSelectMode.value) return;
  currentMode.value = 'simple_select';
  editableMapRef.value?.setDrawMode?.('simple_select');
};

const handleFeatureBoxSelect = (payload = []) => {
  const isPayloadObject = Boolean(payload && typeof payload === 'object' && !Array.isArray(payload));
  const featureIds = Array.isArray(payload)
    ? payload
    : (isPayloadObject && Array.isArray(payload.featureIds) ? payload.featureIds : []);
  const selectionMode = isPayloadObject && (payload.selectionMode === 'add' || payload.selectionMode === 'subtract')
    ? payload.selectionMode
    : 'replace';
  const selectableFeatureIdSet = new Set(activeLayerSelectableFeatureIds.value);
  const filteredFeatureIds = featureIds
    .map((featureId) => String(featureId || ''))
    .filter((featureId) => selectableFeatureIdSet.has(featureId));
  const filteredFeatureIdSet = new Set(filteredFeatureIds);
  const currentSelectableFeatureIds = selectedFeatureIds.value
    .filter((featureId) => selectableFeatureIdSet.has(featureId));
  const nextFeatureIds = selectionMode === 'add'
    ? [...currentSelectableFeatureIds, ...filteredFeatureIds]
    : selectionMode === 'subtract'
      ? currentSelectableFeatureIds.filter((featureId) => !filteredFeatureIdSet.has(featureId))
      : filteredFeatureIds;
  setFeatureSelection(nextFeatureIds, nextFeatureIds[0]);
  syncFeatureSelectionToMap();
  isFeatureBoxSelectMode.value = false;
};

const handleDeleteSelectedFeatures = () => {
  if (!canModifyActiveLayer.value || !activeLayer.value || selectedFeatureIds.value.length === 0) return;

  const featureIdsToDelete = new Set(selectedFeatureIds.value);
  const featureCollection = activeLayer.value.featureCollection ?? emptyFeatureCollection();
  const nextFeatures = (featureCollection.features ?? [])
    .filter((feature) => !featureIdsToDelete.has(getFeatureId(feature)));
  if (nextFeatures.length === (featureCollection.features?.length ?? 0)) return;

  commitHistory();
  activeLayer.value.featureCollection = {
    ...featureCollection,
    features: nextFeatures,
  };
  clearFeatureSelection();
  currentMode.value = 'simple_select';
  syncAllLayersAfterMutation();
  editableMapRef.value?.setDrawMode?.('simple_select');
};

const updateLayerProperty = (key, value) => {
  if (!activeLayer.value) return;
  commitHistory();
  activeLayer.value[key] = value;
  const featureCollection = activeLayer.value.featureCollection ?? emptyFeatureCollection();
  activeLayer.value.featureCollection = {
    ...featureCollection,
    features: (featureCollection.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        [key]: value,
      },
    })),
  };
  syncAllLayersAfterMutation();
};

const updateFeatureProperty = (featureId, key, value) => {
  if (!activeLayer.value || !featureId) return;
  commitHistory();
  const featureCollection = activeLayer.value.featureCollection ?? emptyFeatureCollection();
  activeLayer.value.featureCollection = {
    ...featureCollection,
    features: (featureCollection.features ?? []).map((feature) => {
      if (getFeatureId(feature) !== featureId) return feature;
      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          [key]: value,
        },
      };
    }),
  };
  setFeatureSelection(
    selectedFeatureIds.value.includes(featureId) ? selectedFeatureIds.value : [featureId],
    featureId
  );
  editableMapRef.value?.updateFeatureProperties?.(featureId, { [key]: value }, { commitHistory: false });
  setFeatureSelection(
    selectedFeatureIds.value.includes(featureId) ? selectedFeatureIds.value : [featureId],
    featureId
  );
  if (key === 'visible' && value === false) {
    resetDrawSelectionMode();
  }
  if (key === 'locked' && value === true) {
    resetDrawSelectionMode();
  }
};

const getDefaultedFeatureStateValue = (feature, key) => {
  const properties = feature?.properties ?? {};
  if (key === 'visible') return properties.visible ?? true;
  if (key === 'locked') return properties.locked ?? false;
  return properties[key];
};

const updateSelectedFeaturesProperty = (key, value) => {
  if (!canModifyActiveLayer.value || !activeLayer.value || selectedFeatureIds.value.length === 0) return;

  const selectedFeatureIdSet = new Set(selectedFeatureIds.value);
  const featureCollection = activeLayer.value.featureCollection ?? emptyFeatureCollection();
  let hasChanges = false;
  const nextFeatures = (featureCollection.features ?? []).map((feature) => {
    if (!selectedFeatureIdSet.has(getFeatureId(feature))) return feature;
    if (getDefaultedFeatureStateValue(feature, key) === value) return feature;
    hasChanges = true;
    return {
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        [key]: value,
      },
    };
  });
  if (!hasChanges) return;

  commitHistory();
  activeLayer.value.featureCollection = {
    ...featureCollection,
    features: nextFeatures,
  };
  syncAllLayersAfterMutation();
  if ((key === 'visible' && value === false) || (key === 'locked' && value === true)) {
    resetDrawSelectionMode();
    return;
  }
  setFeatureSelection(selectedFeatureIds.value, selectedFeatureId.value);
  currentMode.value = 'simple_select';
  if (selectedFeatureIds.value.length > 1) {
    editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);
    return;
  }
  editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
};

const handleSetSelectedFeaturesVisible = (visible) => {
  updateSelectedFeaturesProperty('visible', visible);
};

const handleSetSelectedFeaturesLocked = (locked) => {
  updateSelectedFeaturesProperty('locked', locked);
};

const handleUpdateFeatureTableCell = (featureId, key, value) => {
  if (!canModifyActiveLayer.value) return;
  const nextKey = String(key || '');
  if (
    nextKey !== 'name'
    && !activeLayerFeatureTableColumns.value.some((column) => column.key === nextKey)
  ) return;
  updateFeatureProperty(featureId, nextKey, value);
};

const handleApplySelectedFeatureBatchName = () => {
  const nextName = selectedFeatureBatchName.value.trim();
  if (!nextName) return;
  updateSelectedFeaturesProperty('name', nextName);
};

const handleApplySelectedFeatureBatchProperty = () => {
  const nextKey = String(selectedFeatureBatchPropertyKey.value || '');
  if (!canApplySelectedFeatureBatchProperty.value) return;
  updateSelectedFeaturesProperty(nextKey, selectedFeatureBatchPropertyValue.value);
};

const updateSelectedFeatureProperty = (key, value) => {
  if (selectedFeature.value) {
    updateFeatureProperty(selectedFeatureId.value, key, value);
    return;
  }
  updateLayerProperty(key, value);
};

const handleActiveLayerFeaturesChange = (nextValue) => {
  updateActiveLayerFeatureCollection(nextValue);
  if (selectedFeatureIds.value.length > 0 || selectedFeatureId.value) {
    const featureIds = selectedFeatureIds.value.length > 0
      ? selectedFeatureIds.value
      : [selectedFeatureId.value];
    setFeatureSelection(featureIds, selectedFeatureId.value);
  }
};

const triggerImportLayer = () => {
  importInputRef.value?.click();
};

const createImportedLayer = (featureCollection, geometryType) => {
  const layer = createEmptyLayer(geometryType);
  layer.featureCollection = featureCollection ?? emptyFeatureCollection();
  return layer;
};

const buildImportDiagnosticsMessages = (diagnostics) => {
  const messages = [];
  if (diagnostics?.duplicateFeatureIdCount > 0) {
    messages.push(t('map.drawTab.messages.importDiagnosticsDuplicateIds', {
      count: diagnostics.duplicateFeatureIdCount,
    }));
  }
  if (diagnostics?.emptyGeometryCount > 0) {
    messages.push(t('map.drawTab.messages.importDiagnosticsEmptyGeometry', {
      count: diagnostics.emptyGeometryCount,
    }));
  }
  if (diagnostics?.unsupportedGeometryCount > 0) {
    messages.push(t('map.drawTab.messages.importDiagnosticsUnsupportedGeometry', {
      count: diagnostics.unsupportedGeometryCount,
    }));
  }
  if (diagnostics?.invalidCoordinateFeatureCount > 0) {
    messages.push(t('map.drawTab.messages.importDiagnosticsInvalidCoordinates', {
      count: diagnostics.invalidCoordinateFeatureCount,
    }));
  }
  return messages;
};

const showImportDiagnostics = (diagnostics) => {
  const messages = buildImportDiagnosticsMessages(diagnostics);
  if (messages.length === 0) return;
  showWarning(t('map.drawTab.messages.importLayerDiagnostics', {
    summary: messages.join('; '),
  }), 6000);
};

const handleImportAsNewLayer = async (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    let importDiagnostics = null;
    const importedFeatureCollection = await readImportedLayerFile(file, {
      onDiagnostics: (diagnostics) => {
        importDiagnostics = diagnostics;
      },
    });
    const importedLayerGroups = splitFeatureCollectionByGeometryType(importedFeatureCollection);
    const importedLayers = importedLayerGroups.map((group) => createImportedLayer(
      group.featureCollection,
      group.geometryType
    ));
    commitHistory();
    layers.value.unshift(...importedLayers);
    const activeImportedLayer = importedLayers[0];
    activeLayerId.value = activeImportedLayer.id;
    isDrawingPanelOpen.value = true;
    editableMapRef.value?.importGeoJson?.(activeImportedLayer.featureCollection, { emitChanges: false });
    currentMode.value = 'simple_select';
    showSuccess(t('map.drawTab.messages.importLayerSuccess', { count: importedLayers.length }));
    showImportDiagnostics(importDiagnostics);
  } catch (error) {
    showError(t('map.drawTab.messages.importLayerFailed', { error: error.message || error }));
  } finally {
    if (event?.target) {
      event.target.value = '';
    }
  }
};

const handleDeleteSelected = async () => {
  if (!selectedFeatureId.value) return;
  if (!canModifyActiveLayer.value) return;
  commitHistory();
  editableMapRef.value?.deleteSelected?.();
  currentMode.value = 'simple_select';
};

const handleResetView = () => {
  editableMapRef.value?.resetView?.();
};

const handleToggleFullscreen = async () => {
  try {
    await editableMapRef.value?.toggleFullscreen?.();
    isMapFullscreen.value = Boolean(editableMapRef.value?.isFullscreen?.value);
  } catch (error) {
    showError(error.message || String(error));
  }
};

const syncMapFullscreenState = () => {
  isMapFullscreen.value = Boolean(editableMapRef.value?.isFullscreen?.value);
};

const isEditableKeyboardTarget = (target) => {
  const tagName = target?.tagName?.toLowerCase?.();
  return target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName);
};

const handleDrawHistoryKeydown = (event) => {
  if (isEditableKeyboardTarget(event.target)) return;
  const isUndoShortcut = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
  const isRedoShortcut = (
    (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'z'
  ) || (event.ctrlKey && event.key.toLowerCase() === 'y');
  const isSelectAllShortcut = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'a';
  const isDeleteSelectionShortcut = event.key === 'Delete' || event.key === 'Backspace';
  const isClearSelectionShortcut = event.key === 'Escape';

  if (isUndoShortcut) {
    event.preventDefault();
    undoHistory();
    return;
  }

  if (isRedoShortcut) {
    event.preventDefault();
    redoHistory();
    return;
  }

  if (isSelectAllShortcut && canModifyActiveLayer.value) {
    event.preventDefault();
    handleSelectAllFeatures();
    return;
  }

  if (isDeleteSelectionShortcut && selectedFeatureId.value && canModifyActiveLayer.value) {
    event.preventDefault();
    handleDeleteSelected();
    return;
  }

  if (
    isClearSelectionShortcut
    && (
      isFeatureBoxSelectMode.value
      || selectedFeatureIds.value.length > 0
      || selectedFeatureId.value
      || currentMode.value !== 'simple_select'
    )
  ) {
    event.preventDefault();
    resetDrawSelectionMode();
  }
};

const handleClearAll = async () => {
  if (!canModifyActiveLayer.value) return;
  const confirmed = await showConfirm(t('map.drawTab.messages.clearAllConfirm'));
  if (!confirmed) return;

  const currentFeatureCount = activeLayer.value?.featureCollection?.features?.length ?? 0;
  if (currentFeatureCount <= 0) return;
  commitHistory();
  editableMapRef.value?.clearAll?.();
  clearFeatureSelection();
  currentMode.value = 'simple_select';
  showSuccess(t('map.drawTab.messages.clearAllSuccess'));
};

const handleExportLayer = async () => {
  if (!activeLayer.value) return;
  try {
    await editableMapRef.value?.exportLayer?.(activeLayer.value.name);
    showSuccess(t('map.drawTab.messages.exportLayerSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.exportLayerFailed', { error: error.message || error }));
  }
};

const handleExportAllLayers = async () => {
  try {
    await editableMapRef.value?.exportAllLayers?.(layers.value);
    showSuccess(t('map.drawTab.messages.exportLayerSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.exportLayerFailed', { error: error.message || error }));
  }
};

const handleExportImage = async (settings = {}) => {
  try {
    await editableMapRef.value?.exportImage?.({
      ...settings,
      selectedFeatureId: selectedFeatureId.value,
    });
    showSuccess(t('map.drawTab.messages.exportImageSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.exportImageFailed', { error: error.message || error }));
  }
};

const handleImageExported = () => {};
const handleLayerExported = () => {};

const handleConfirmImageExport = (settings) => {
  showImageExportModal.value = false;
  imageExportSettings.value = {
    ...settings,
    selectedFeatureId: selectedFeatureId.value,
  };
  imageExportViewState.value = {
    center: editableMapRef.value?.currentCenter?.value ?? null,
    zoom: editableMapRef.value?.currentZoom?.value ?? null,
    bearing: editableMapRef.value?.currentBearing?.value ?? 0,
    pitch: editableMapRef.value?.currentPitch?.value ?? 0,
  };
  showImagePreviewModal.value = true;
};

const handleImagePreviewExported = async () => {
  showImagePreviewModal.value = false;
  showSuccess(t('map.drawTab.messages.exportImageSuccess'));
};

const hasLayersToPersist = computed(() => {
  return layers.value.some((layer) => (layer?.featureCollection?.features?.length ?? 0) > 0);
});

const buildPersistedWorkbenchState = () => ({
  layers: layers.value,
  activeLayerId: activeLayerId.value,
  currentStyleKey: currentStyleKey.value,
  isDrawingPanelOpen: isDrawingPanelOpen.value,
  isLayersPanelOpen: isLayersPanelOpen.value,
});

const getCurrentWorkbenchSignature = () => buildDraftStateSignature(buildPersistedWorkbenchState());

const markWorkbenchClean = (state = buildPersistedWorkbenchState()) => {
  savedWorkbenchSignature.value = buildDraftStateSignature(state);
};

const hasUnsavedWorkbenchChanges = computed(() => {
  return getCurrentWorkbenchSignature() !== savedWorkbenchSignature.value;
});

const saveAutoDraft = async () => {
  if (!isAuthenticated.value || isRestoringAutoDraft.value) return;
  if (!hasUnsavedWorkbenchChanges.value) return;

  const savePromise = Promise.resolve(saveDraftRecord(buildAutoDraftRecord(buildPersistedWorkbenchState())))
    .catch((error) => {
      console.warn('save map draw auto draft failed', error);
    })
    .finally(() => {
      pendingAutoDraftSaves.delete(savePromise);
    });
  pendingAutoDraftSaves.add(savePromise);
  await savePromise;
};

const clearAutoDraft = async () => {
  try {
    if (pendingAutoDraftSaves.size > 0) {
      await Promise.all([...pendingAutoDraftSaves]);
    }
    await deleteDraftRecord(AUTO_DRAFT_ID);
  } catch (error) {
    console.warn('clear map draw auto draft failed', error);
  }
};

const restoreAutoDraftIfAvailable = async () => {
  const autoDraft = await getDraftRecordById(AUTO_DRAFT_ID);
  if (!autoDraft?.state) return;

  const currentSignature = getCurrentWorkbenchSignature();
  const autoSignature = autoDraft.signature || buildDraftStateSignature(autoDraft.state);
  if (autoSignature === currentSignature) {
    await deleteDraftRecord(AUTO_DRAFT_ID);
    return;
  }

  const confirmed = await showConfirm(t('map.drawTab.messages.autoDraftRestoreConfirm'));
  if (!confirmed) {
    await deleteDraftRecord(AUTO_DRAFT_ID);
    return;
  }

  isRestoringAutoDraft.value = true;
  try {
    commitHistory();
    applyDraftState(autoDraft.state);
    markWorkbenchClean(autoDraft.state);
    await deleteDraftRecord(AUTO_DRAFT_ID);
    showSuccess(t('map.drawTab.messages.autoDraftRestoreSuccess'));
  } finally {
    isRestoringAutoDraft.value = false;
  }
};

const handleBeforeUnload = (event) => {
  if (!hasUnsavedWorkbenchChanges.value) return;

  saveAutoDraft();
  event.preventDefault();
  event.returnValue = t('map.drawTab.messages.unsavedChangesWarning');
};

watch(getCurrentWorkbenchSignature, () => {
  saveAutoDraft();
}, { flush: 'post' });

const buildHistorySnapshot = () => ({
  layers: layers.value,
  activeLayerId: activeLayerId.value,
  currentStyleKey: currentStyleKey.value,
  selectedFeatureId: selectedFeatureId.value,
  selectedFeatureIds: selectedFeatureIds.value,
  currentMode: currentMode.value,
});

const refreshHistoryState = () => {
  historySizes.value = drawHistory.sizes();
};

const canUndoHistory = computed(() => historySizes.value.undo > 0);
const canRedoHistory = computed(() => historySizes.value.redo > 0);

const applyHistorySnapshot = (snapshot) => {
  if (!snapshot) return;
  isApplyingHistory.value = true;
  try {
    layers.value = Array.isArray(snapshot.layers) ? snapshot.layers : [];
    activeLayerId.value = snapshot.activeLayerId || layers.value[0]?.id || '';
    currentStyleKey.value = snapshot.currentStyleKey || 'gaode';
    const restoredSelectedFeatureId = snapshot.selectedFeatureId || '';
    const restoredSelectedFeatureIds = Array.isArray(snapshot.selectedFeatureIds)
      ? snapshot.selectedFeatureIds
      : (restoredSelectedFeatureId ? [restoredSelectedFeatureId] : []);
    const restoredMode = snapshot.currentMode || 'simple_select';
    currentMode.value = restoredMode;
    syncLayerIdSeedFromLayers();
    syncAllLayersAfterMutation();
    setFeatureSelection(restoredSelectedFeatureIds, restoredSelectedFeatureId);
    if (restoredMode === 'direct_select') {
      if (selectedFeatureId.value) {
        editableMapRef.value?.selectFeature?.(selectedFeatureId.value);
      } else {
        currentMode.value = 'simple_select';
        editableMapRef.value?.setDrawMode?.('simple_select');
      }
    } else if (restoredMode === 'simple_select' && selectedFeatureIds.value.length > 1) {
      editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);
    } else if (restoredMode === 'simple_select' && selectedFeatureId.value) {
      editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
    } else {
      editableMapRef.value?.setDrawMode?.(restoredMode);
    }
    editableMapRef.value?.syncReadonlyLayers?.();
  } finally {
    isApplyingHistory.value = false;
  }
};

const commitHistory = () => {
  if (isApplyingHistory.value) return;
  drawHistory.commit(buildHistorySnapshot());
  refreshHistoryState();
};

const undoHistory = () => {
  const previousSnapshot = drawHistory.undo(buildHistorySnapshot());
  applyHistorySnapshot(previousSnapshot);
  refreshHistoryState();
};

const redoHistory = () => {
  const nextSnapshot = drawHistory.redo(buildHistorySnapshot());
  applyHistorySnapshot(nextSnapshot);
  refreshHistoryState();
};

const storedDraftOptions = computed(() => {
  return storedDrafts.value.map((draft) => ({
    label: draft.name,
    value: draft.id,
  }));
});

const buildDraftRecord = (name) => ({
  id: `${Date.now()}`,
  name,
  savedAt: new Date().toISOString(),
  version: 1,
  state: buildPersistedWorkbenchState(),
});

const applyDraftState = (state) => {
  layers.value = Array.isArray(state?.layers) ? state.layers : [];
  activeLayerId.value = state?.activeLayerId || layers.value[0]?.id || '';
  currentStyleKey.value = state?.currentStyleKey || 'gaode';
  isDrawingPanelOpen.value = state?.isDrawingPanelOpen ?? true;
  isLayersPanelOpen.value = state?.isLayersPanelOpen ?? false;
  clearFeatureSelection();
  syncLayerIdSeedFromLayers();
  syncAllLayersAfterMutation();
};

const restoreStoredDrafts = async () => {
  await migrateLegacyDraftsFromLocalStorage(mapDrawStorageKey);
  storedDrafts.value = await listDraftRecords();
  selectedStoredDraftId.value = storedDrafts.value[0]?.id || '';
  newDraftName.value = '';
};

const openSaveLocalDraftModal = () => {
  if (!hasLayersToPersist.value) {
    showError(t('map.drawTab.messages.noLayersToSave'));
    return;
  }
  newDraftName.value = '';
  showSaveLocalDraftModal.value = true;
};

const confirmSaveAsNewLocal = async () => {
  if (!hasLayersToPersist.value) {
    showError(t('map.drawTab.messages.noLayersToSave'));
    return;
  }
  if (!newDraftName.value.trim()) {
    showError(t('map.drawTab.messages.localDraftNameRequired'));
    return;
  }

  try {
    const nextDraft = buildDraftRecord(newDraftName.value.trim());
    await saveDraftRecord(nextDraft);
    storedDrafts.value = await listDraftRecords();
    selectedStoredDraftId.value = nextDraft.id;
    newDraftName.value = nextDraft.name;
    showSaveLocalDraftModal.value = false;
    markWorkbenchClean(nextDraft.state);
    await clearAutoDraft();
    showSuccess(t('map.drawTab.messages.saveToLocalSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
  }
};

const handleUpdateLocal = async () => {
  if (!hasLayersToPersist.value) {
    showError(t('map.drawTab.messages.noLayersToSave'));
    return;
  }
  if (!selectedStoredDraftId.value) return;

  try {
    const currentDraft = await getDraftRecordById(selectedStoredDraftId.value);
    if (!currentDraft) return;

    const draft = await updateDraftRecord(selectedStoredDraftId.value, {
      name: currentDraft.name,
      savedAt: new Date().toISOString(),
      state: buildPersistedWorkbenchState(),
    });
    if (!draft) return;
    storedDrafts.value = await listDraftRecords();
    selectedStoredDraftId.value = draft.id;
    newDraftName.value = draft.name;
    markWorkbenchClean(draft.state);
    await clearAutoDraft();
    showSuccess(t('map.drawTab.messages.updateLocalSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
  }
};

const handleRestoreLocal = async () => {
  if (!selectedStoredDraftId.value) return;

  try {
    const draft = await getDraftRecordById(selectedStoredDraftId.value);
    if (!draft) return;
    commitHistory();
    applyDraftState(draft.state);
    newDraftName.value = draft.name || '';
    markWorkbenchClean(draft.state);
    await clearAutoDraft();
    showSuccess(t('map.drawTab.messages.restoreLocalSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
  }
};

const handleDeleteLocal = async () => {
  if (!selectedStoredDraftId.value) return;

  const confirmed = await showConfirm(t('map.drawTab.messages.deleteLocalConfirm'));
  if (!confirmed) return;

  try {
    await deleteDraftRecord(selectedStoredDraftId.value);
    storedDrafts.value = await listDraftRecords();
    selectedStoredDraftId.value = storedDrafts.value[0]?.id || '';
    const nextDraft = storedDrafts.value.find((draft) => draft.id === selectedStoredDraftId.value);
    newDraftName.value = nextDraft?.name || '';
    showSuccess(t('map.drawTab.messages.deleteLocalSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
  }
};

const handleSaveToLocal = () => {
  if (!hasLayersToPersist.value) return showError(t('map.drawTab.messages.noLayersToSave'));
  showLocalStorageModal.value = true;
};

const onCreateLayerClicked = (type) => {
  handleCreateLayer(type);
  showAddLayerModal.value = false;
};

const onImportLayerClicked = () => {
  triggerImportLayer();
  showAddLayerModal.value = false;
};

const onExportCurrentClicked = () => {
  handleExportLayer();
  showExportModal.value = false;
};

const onExportAllClicked = () => {
  handleExportAllLayers();
  showExportModal.value = false;
};

const onExportImageClicked = () => {
  showExportModal.value = false;
  imageExportSettings.value = null;
  imageExportViewState.value = null;
  showImagePreviewModal.value = false;
  showImageExportModal.value = true;
};

const moveLayerToTop = (layerId) => {
  const index = layers.value.findIndex((item) => item.id === layerId);
  if (index === -1 || index === layers.value.length - 1) return;
  commitHistory();
  const [layer] = layers.value.splice(index, 1);
  layers.value.push(layer);
  syncAllLayersAfterMutation();
};

const moveLayerToBottom = (layerId) => {
  const index = layers.value.findIndex((item) => item.id === layerId);
  if (index === -1 || index === 0) return;
  commitHistory();
  const [layer] = layers.value.splice(index, 1);
  layers.value.unshift(layer);
  syncAllLayersAfterMutation();
};

const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
if (isTouchDevice) {
  document.documentElement.classList.add('is-touch-device');
}

const togglePanel = (panelName) => {
  if (isTouchDevice) {
    const wasOpen = panelName === 'drawing' ? isDrawingPanelOpen.value
      : panelName === 'layers' ? isLayersPanelOpen.value
      : isVoronoiPanelOpen.value;
    isDrawingPanelOpen.value = false;
    isLayersPanelOpen.value = false;
    isVoronoiPanelOpen.value = false;
    if (panelName === 'drawing') isDrawingPanelOpen.value = !wasOpen;
    else if (panelName === 'layers') isLayersPanelOpen.value = !wasOpen;
    else isVoronoiPanelOpen.value = !wasOpen;
  } else {
    if (panelName === 'drawing') isDrawingPanelOpen.value = !isDrawingPanelOpen.value;
    else if (panelName === 'layers') isLayersPanelOpen.value = !isLayersPanelOpen.value;
    else isVoronoiPanelOpen.value = !isVoronoiPanelOpen.value;
  }
};

const toggleAddDialectPoints = () => {
  if (isAddingDialectPoints.value) {
    isAddingDialectPoints.value = false;
    return;
  }
  pendingAddPartitionKey.value = addDialectPartitionKey.value || addDialectPartitionOptions.value[0]?.value || '';
  showAddDialectPartitionModal.value = true;
};

const confirmAddDialectPartition = () => {
  addDialectPartitionKey.value = pendingAddPartitionKey.value;
  showAddDialectPartitionModal.value = false;
  isAddingDialectPoints.value = true;
  if (currentMode.value !== 'simple_select') {
    setMode('simple_select');
  }
};

const deleteCustomPointsByPartition = (partitionKey) => {
  const level = Number(voronoiRegionLevel.value) || 3;
  const before = voronoiCustomImportRows.value.length;
  voronoiCustomImportRows.value = voronoiCustomImportRows.value.filter((p) => {
    if (p.source !== 'manual') return true;
    let key;
    if (level === 1) key = p.partitionLevel1;
    else if (level === 2) key = p.partitionLevel2;
    else key = p.partitionLevel3;
    return key !== partitionKey;
  });
  const removed = before - voronoiCustomImportRows.value.length;
  if (removed > 0) {
    syncVoronoiPartitionPoints();
    setVoronoiStatus('deletedPartitionPoints', { key: partitionKey, count: removed });
    if (addDialectPartitionKey.value === partitionKey) {
      addDialectPartitionKey.value = '';
    }
  }
};

const handleMapClickForAddPoint = ({ lng, lat }) => {
  if (!isAddingDialectPoints.value) return;
  if (!addDialectPartitionKey.value) return;
  if (currentMode.value !== 'simple_select') return;

  addPointCounter += 1;

  const mode = voronoiPartitionMode.value;
  const rawRow = {
    name: `自定义点-${addPointCounter}`,
    lng,
    lat,
  };
  rawRow[`${mode}Partition`] = addDialectPartitionKey.value;

  const point = normalizePartitionPoint(rawRow, { partitionMode: mode });
  if (!point) {
    showError(t('map.drawTab.voronoi.addPointInvalid'));
    return;
  }

  point.source = 'manual';
  point.customRowId = `manual-${Date.now()}-${addPointCounter}`;

  voronoiCustomImportRows.value.push(point);
  syncVoronoiPartitionPoints();
  setVoronoiStatus('addPointAdded', { name: point.name });

  if (voronoiPreviewType.value === 'points') {
    refreshVoronoiPreview('points');
  }
};

onMounted(async () => {
  try {
    await restoreStoredDrafts();
    markWorkbenchClean();
    await restoreAutoDraftIfAvailable();
  } catch (error) {
    console.warn('restore map draw workbench state failed', error);
  }

  document.addEventListener('fullscreenchange', syncMapFullscreenState);
  document.addEventListener('keydown', handleDrawHistoryKeydown);
  window.addEventListener('beforeunload', handleBeforeUnload);
  syncMapFullscreenState();

  if (route.query.scrollTo === 'drawBottom') {
    nextTick(() => {
      drawTabRoot.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncMapFullscreenState);
  document.removeEventListener('keydown', handleDrawHistoryKeydown);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use '../../../../styles/global/scrollbars' as scrollbars;

.map-draw-tab {
  position: relative;
  width: min(96dvw, 1600px);
  gap: 1rem;

  :deep(button) {
    white-space: nowrap;
  }

  .draw-tab {
    &-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: fit-content;
      padding: 0.4rem 1.2rem;
    }

    &-copy {
      min-width: 0;
    }

    &-title {
      margin: 0;
    }

    &-hint {
      margin: 0.35rem 0 0;
    }
  }

  .main-glass-button {
    padding: 12px 16px;
  }

  .draw-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    &--header {
      justify-content: flex-end;

      @media (hover: hover) and (pointer: fine) {
        .main-glass-button:hover:not(:disabled) {
          background: var(--color-primary);
          color: var(--action-primary-text);
        }
      }
    }
  }

  .voronoi-export-progress {
    &-overlay {
      position: absolute;
      inset: 0;
      z-index: 40;
      @include flex-center;
      padding: 1.5rem;
      background: rgba(var(--color-shadow-rgb), 0.24);
      backdrop-filter: blur(10px);
    }

    &-panel {
      min-width: min(92vw, 320px);
      @include flex-col;
      align-items: center;
      gap: 0.8rem;
      padding: 1.2rem 1.4rem;
      text-align: center;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 48px rgba(var(--color-shadow-rgb), 0.18);
    }

    &-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-deep);
    }

    &-text {
      font-size: 0.92rem;
      color: var(--text-dark);
    }
  }

  .draw-feature-count-badge {
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
    padding: 0 0.95rem;
    border: 1px solid var(--glass-70);
    border-radius: var(--radius-pill);
    background: linear-gradient(
      145deg,
      var(--glass-80),
      rgba(var(--color-primary-rgb), 0.06)
    );
    color: var(--text-deep);
    font-size: 0.92rem;
    box-shadow:
      inset 0 0 0.5px var(--glass-50),
      0 8px 18px rgba(var(--color-primary-rgb), 0.08);
  }

  .draw-workbench {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .draw-map-area {
    width: 100%;
  }

  .voronoi-hover-tooltip {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 14px;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    color: #fff;
    font-size: 0.88rem;
    pointer-events: none;

    strong {
      font-weight: 600;
      font-size: 0.92rem;
    }

    .point-count,
    .partition-info {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .draw-import-input {
    display: none;
  }

  @media (max-aspect-ratio:1/1) {
    .draw-tab-header,
    .draw-tool-section-header {
      @include flex-col;
    }

    .draw-toolbar {
      &--header {
        justify-content: flex-start;
        gap: 0.45rem;
        width: 100%;

        .main-glass-button,
        .draw-feature-count-badge {
          justify-content: center;
          min-width: auto;
          min-height: 2.15rem;
          padding: 0 0.65rem;
          color: var(--text-deep);
          font-size: 0.84rem;
        }
      }
    }

    .draw-tool-button-grid,
    .draw-tool-button-grid--three {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

/* Modal Choices Styles — 不能嵌套在 .map-draw-tab 下，因为 AppModal 通过 Teleport 将内容移到 body */
.draw-modal {
  &-choices {
    @include flex-col;
    gap: 1rem;
    padding: 0.5rem 0;
  }

  &-card-btn {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    width: 100%;
    padding: 1.2rem;
    border: 1px solid var(--glass-60);
    border-radius: 14px;
    background: var(--glass-50);
    cursor: pointer;
    text-align: left;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        background: var(--glass-80);
        border-color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.08);
      }
    }

    &:disabled {
      @include disabled-state;
    }
  }
}

.draw-card {
  &-icon {
    flex-shrink: 0;
    font-size: 1.8rem;
  }

  &-text {
    @include flex-col;
    gap: 0.25rem;
  }

  &-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-deep);
  }

  &-desc {
    font-size: 0.85rem;
    color: rgba(var(--text-deep-rgb), 0.65);
  }
}

.draw-text-input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border: 1px solid rgba(var(--text-slate-light-rgb), 0.32);
  border-radius: var(--radius-md);
  background: var(--glass-80);
  color: var(--text-deep);

  &:focus {
    outline: none;
    border-color: rgba(var(--color-primary-rgb), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.12);
  }
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
}

.auth-warning {
  &-container {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    padding: 40px 20px;
  }

  &-card {
    @include flex-col;
    align-items: center;
    width: 100%;
    max-width: 360px;
    padding: 30px;
    border: 1px solid var(--glass-60);
    border-radius: var(--radius-xl);
    background: var(--glass-40);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    text-align: center;
    box-shadow: var(--shadow-md);
  }

  &-icon {
    margin-bottom: 16px;
    font-size: 44px;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    animation: floatIcon 3s ease-in-out infinite;
  }

  &-text {
    margin-bottom: 20px;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }
}

@keyframes floatIcon {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

.add-point-partition-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-point-partition-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  background: var(--glass-50);
  border: 1px solid var(--glass-60);
}

.add-point-partition-key {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-deep);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-point-partition-count {
  font-size: 0.82rem;
  color: rgba(var(--text-deep-rgb), 0.6);
  background: var(--glass-70);
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  min-width: 1.5rem;
  text-align: center;
}

.add-point-delete-btn {
  min-width: auto;
  padding: 0.3rem 0.65rem !important;
  font-size: 0.82rem;
  border-color: rgba(var(--color-error-rgb, 220 38 38), 0.35);
  color: var(--color-error, #dc2626);

  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled) {
      background: var(--color-error, #dc2626);
      color: #fff;
      border-color: var(--color-error, #dc2626);
    }
  }
}
</style>
