<template>
  <div ref="drawTabRoot" class="map-draw-tab page-content-stack">
    <div class="page-footer draw-tab-header glass-panel">
      <!-- <div class="draw-tab-copy">
        <h3 class="draw-tab-title">
          {{ t('map.drawTab.title') }}
        </h3>
        <p class="hint draw-tab-hint">
          {{ t('map.drawTab.hint') }}
        </p>
      </div> -->

      <div
        class="draw-toolbar draw-toolbar--header"
      >
        <span class="draw-feature-count-badge">
          {{ t('map.drawTab.labels.featureCount', { count: featureCount }) }}
        </span>
        <button
          class="glass-button"
          data-variant="secondary"
          type="button"
          @click="showAddLayerModal = true"
        ><InlineIcon icon="➕" />{{ t('map.drawTab.buttons.addLayer') }}
        </button>
        <button
          class="glass-button"
          :data-variant="isVoronoiPanelOpen ? 'primary' : 'secondary'"
          :data-active="isVoronoiPanelOpen"
          type="button"
          @click="togglePanel('voronoi')"
        ><InlineIcon icon="⬡" />{{ t('map.drawTab.buttons.voronoi') }}
        </button>
        <button
          class="glass-button"
          data-variant="secondary"
          type="button"
          @click="showExportModal = true"
        ><InlineIcon icon="📤" />{{ t('map.drawTab.buttons.export') }}
        </button>
        <button
          class="glass-button"
          data-variant="secondary"
          type="button"
          @click="showLocalStorageModal = true"
        ><InlineIcon icon="💾" />{{ t('map.drawTab.buttons.saveToLocal') }}
        </button>
        <button
          class="glass-button"
          :data-variant="isDrawingPanelOpen ? 'primary' : 'secondary'"
          :data-active="isDrawingPanelOpen"
          type="button"
          @click="togglePanel('drawing')"
        ><InlineIcon icon="🛠️" />{{ t('map.drawTab.buttons.drawingTools') }}
        </button>
        <button
          class="glass-button"
          :data-variant="isLayersPanelOpen ? 'primary' : 'secondary'"
          :data-active="isLayersPanelOpen"
          type="button"
          @click="togglePanel('layers')"
        ><InlineIcon icon="🗂️" />{{ t('map.drawTab.buttons.layers') }}
        </button>
        <button
          class="glass-button"
          :data-variant="snappingEnabled ? 'primary' : 'secondary'"
          :data-active="snappingEnabled"
          data-testid="toggle-snapping"
          type="button"
          @click="snappingEnabled = !snappingEnabled"
        >
          {{ t('map.drawTab.labels.snapping') }}
        </button>
        <label class="draw-toolbar-field">
          <span>{{ t('map.drawTab.labels.snapTolerance') }} {{ snapTolerance }}</span>
          <input
            v-model.number="snapTolerance"
            data-testid="snap-tolerance-input"
            class="draw-range-input glass-range"
            type="range"
            min="0"
            max="48"
            step="1"
          >
        </label>
        <label class="draw-toolbar-field">
          <span>{{ t('map.drawTab.labels.snapGridSize') }} {{ snapGridSize }}</span>
          <input
            v-model.number="snapGridSize"
            data-testid="snap-grid-input"
            class="draw-input glass-field"
            type="number"
            min="0"
            step="0.05"
          >
        </label>
      </div>
    </div>

    <div
      v-if="false"
      class="auth-warning-container"
    >
      <div class="auth-warning-card">
        <div class="auth-warning-icon"><InlineIcon icon="🔒" /></div>
        <p class="auth-warning-text">
          {{ t('map.drawTab.auth.loginRequired') }}
        </p>
        <button
          class="glass-button"
          data-variant="enter"
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
            v-model:current-style-key="currentStyleKey"
            :model-value="activeLayerFeatureCollection"
            :active-layer="activeLayer"
            :all-layers="layers"
            :preview-layers="voronoiPreviewLayers"
            :enable-preview-hover="voronoiPreviewLayers.length > 0"
            :feature-box-select-enabled="isFeatureBoxSelectMode"
            :snapping-enabled="snappingEnabled"
            :snap-tolerance="snapTolerance"
            :snap-grid-size="snapGridSize"
            @update:model-value="handleActiveLayerModelUpdate"
            @before-features-change="handleBeforeFeaturesChange"
            @features-change="handleActiveLayerFeaturesChange"
            @feature-select="handleFeatureSelect"
            @feature-box-select="handleFeatureBoxSelect"
            @mode-change="handleDrawModeChange"
            @shape-edit-state-change="handleShapeEditStateChange"
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
          :selected-vertex-count="selectedVertexCount"
          :selected-vertex="selectedVertex"
          :can-delete-selected-vertices="canDeleteSelectedVertices"
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
          :can-use-selected-geometry-tools="canUseSelectedGeometryTools"
          :can-close-selected-line="canCloseSelectedLine"
          :can-convert-selected-line-to-polygon="canConvertSelectedLineToPolygon"
          :geometry-quality-summary="geometryQualitySummary"
          :can-delete-selection="canDeleteSelection"
          :can-duplicate-feature="canDuplicateSelectedFeature"
          :is-feature-box-select-mode="isFeatureBoxSelectMode"
          :can-use-feature-box-select="canUseFeatureBoxSelect"
          :can-modify-active-layer="canModifyActiveLayer"
          @set-mode="handleSetMode"
          @select-feature="handleSelectFeatureFromPanel"
          @toggle-feature-selection="handleToggleFeatureSelection"
          @select-all-features="handleSelectAllFeatures"
          @invert-feature-selection="handleInvertFeatureSelection"
          @clear-feature-selection="resetDrawSelectionMode"
          @toggle-feature-box-select="handleToggleFeatureBoxSelect"
          @edit-shape="handleEditSelectedShape"
          @duplicate-feature="handleDuplicateSelectedFeature"
          @reverse-selected-geometry="handleReverseSelectedGeometry"
          @simplify-selected-geometry="handleSimplifySelectedGeometry"
          @close-selected-line="handleCloseSelectedLine"
          @convert-selected-line-to-polygon="handleConvertSelectedLineToPolygon"
          @move-selected-vertex="handleMoveSelectedVertex"
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
          @toggle-layer-labels="toggleLayerLabels"
          @update-layer-opacity="handleUpdateLayerOpacity"
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
          @export-layer="openVoronoiExportModal"
          @calculate="handleBuildVoronoi"
          @open-field-merge="showFieldMergeModal = true"
          @update:expand-ratio="voronoiExpandRatio = $event"
          :enable-yindian-adjust="voronoiEnableYindianAdjust"
          @update:enable-yindian-adjust="voronoiEnableYindianAdjust = $event"
          :show-dialect-islands="voronoiShowDialectIslands"
          @update:show-dialect-islands="voronoiShowDialectIslands = $event"
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
            <span class="draw-card-icon"><InlineIcon icon="📍" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="➖" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="⬡" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="📤" /></span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.importLayer') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.importLayerDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onAdminBoundaryImportClicked"
          >
            <span class="draw-card-icon"><InlineIcon icon="🗺️" /></span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.adminBoundary') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.adminBoundaryDesc') }}
              </div>
            </div>
          </button>

          <button
            class="draw-modal-card-btn"
            type="button"
            @click="onRiverLayerImportClicked"
          >
            <span class="draw-card-icon"><InlineIcon icon="🌊" /></span>
            <div class="draw-card-text">
              <div class="draw-card-title">
                {{ t('map.drawTab.buttons.riverImport') }}
              </div>
              <div class="draw-card-desc">
                {{ t('map.drawTab.buttons.riverImportDesc') }}
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
            <span class="draw-card-icon"><InlineIcon icon="📄" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="🗂️" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="🖼️" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="💾" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="♻️" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="📂" /></span>
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
            <span class="draw-card-icon"><InlineIcon icon="🗑️" /></span>
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
            <button class="glass-button" type="button" @click="showSaveLocalDraftModal = false">
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="glass-button scope-confirm-btn"
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
        :clip-boundary-config="clipBoundaryConfig"
        :clip-boundary-summary="clipBoundarySummary"
        :is-exporting="isVoronoiExporting"
        @open-clip-boundary="handleOpenClipBoundary"
        @toggle-selection="toggleVoronoiExportSelection"
        @clear-selection="voronoiExportSelections = []"
        @confirm="confirmVoronoiExport"
      />

      <ClipBoundaryModal
        v-model="showClipBoundaryModal"
        :boundary-config="clipBoundaryConfig"
        :boundary-options="boundaryOptionsMap"
        :loading="isBoundaryOptionsLoading"
        :high-precision="highPrecisionEnabled"
        @update:high-precision="highPrecisionEnabled = $event"
        @confirm="handleClipBoundaryConfirm"
      />

      <ClipBoundaryModal
        v-model="showImportBoundaryModal"
        mode="import"
        :boundary-config="importBoundaryConfig"
        :boundary-options="boundaryOptionsMap"
        :loading="isBoundaryOptionsLoading"
        :high-precision="highPrecisionEnabled"
        @update:high-precision="highPrecisionEnabled = $event"
        @confirm="handleImportBoundaryConfirm"
      />

      <RiverImportModal
        v-model="showRiverImportModal"
        :importing="isRiverImporting"
        @confirm="handleRiverImportConfirm"
      />

      <div v-if="showVoronoiExportProgressOverlay" class="voronoi-export-progress-overlay">
        <div class="voronoi-export-progress-panel glass-subpanel">
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
              class="glass-button add-point-delete-btn"
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
              class="glass-button"
              type="button"
              @click="showAddDialectPartitionModal = false"
            >
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="glass-button scope-confirm-btn"
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
import InlineIcon from '@/components/common/InlineIcon.vue'
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showConfirm } from '@/utils/ui/message.js';

import { useAuthGuard } from '@/composables/router/useAuthGuard.js';
import { useGisMapCore } from '@/main/composables/gis/useGisMapCore.js';
import { useGisHistory } from '@/main/composables/gis/useGisHistory.js';
import { useGisLayers } from '@/main/composables/gis/useGisLayers.js';
import { useGisFeatures } from '@/main/composables/gis/useGisFeatures.js';
import { useGisDrafts } from '@/main/composables/gis/useGisDrafts.js';
import { useGisVoronoi } from '@/main/composables/gis/useGisVoronoi.js';

import EditableMapLibre from '@/main/components/map/EditableMapLibre.vue';
import MapDrawLayersPanel from '@/main/components/map/Draw/panels/MapDrawLayersPanel.vue';
import MapDrawToolsPanel from '@/main/components/map/Draw/panels/MapDrawToolsPanel.vue';
import MapDrawVoronoiPanel from '@/main/components/map/Draw/panels/MapDrawVoronoiPanel.vue';
import MapDrawImageExportModal from '@/main/components/map/Draw/modals/MapDrawImageExportModal.vue';
import MapDrawImagePreviewModal from '@/main/components/map/Draw/modals/MapDrawImagePreviewModal.vue';
import VoronoiExportLayersModal from '@/main/components/map/Draw/modals/VoronoiExportLayersModal.vue';
import VoronoiIgnorePointsModal from '@/main/components/map/Draw/modals/VoronoiIgnorePointsModal.vue';
import VoronoiFieldMergeModal from '@/main/components/map/Draw/modals/VoronoiFieldMergeModal.vue';
import ClipBoundaryModal from '@/main/components/map/Draw/modals/ClipBoundaryModal.vue';
import RiverImportModal from '@/main/components/map/Draw/modals/RiverImportModal.vue';
import TabularImportPreview from '@/components/import/TabularImportPreview.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';
import AppModal from '@/components/common/AppModal.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { requireAuth, isAuthenticated } = useAuthGuard();

async function guardWrite() {
  if (isAuthenticated.value) return true;
  const confirmed = await showConfirm(t('map.drawTab.auth.loginRequired'));
  if (confirmed) {
    router.push({ path: '/auth', query: { redirect: route.fullPath } });
  }
  return false;
}

// ---- Template refs ----
const drawTabRoot = ref(null);
const editableMapRef = ref(null);
const importInputRef = ref(null);

// ---- Modal state (page-owned) ----
const showAddLayerModal = ref(false);
const showExportModal = ref(false);
const showVoronoiExportModal = ref(false);
const boxSelectionBounds = ref(null);

// ---- Core state ----
const core = useGisMapCore({ editableMapRef });

// Expose setCommitHistory from core
const { setCommitHistory } = core;

const {
  layers, activeLayerId, currentMode, currentStyleKey,
  selectedFeatureId, selectedFeatureIds, selectedVertexCount, selectedVertex, canDeleteSelectedVertices, isFeatureBoxSelectMode,
  isDrawingPanelOpen, isLayersPanelOpen, isMapFullscreen,
  selectedFeatureBatchName, selectedFeatureBatchPropertyKey, selectedFeatureBatchPropertyValue,
  snappingEnabled, snapTolerance, snapGridSize,
  mapStyleOptions, activeLayer, activeLayerFeatureCollection, featureCount,
  activeLayerFeatures, selectedFeature, activeLayerFeatureIdSet,
  activeLayerFeatureItems, activeLayerSelectableFeatureIds,
  activeLayerFeatureTableColumns, activeLayerFeatureTableRows,
  canApplySelectedFeatureBatchProperty, featureMoveLayerOptions,
  selectedEditorProperties, selectedEditorFeatureId, selectedEditorGeometryType,
  canModifyActiveLayer, canEditSelectedShape, canDeleteSelection, canDuplicateSelectedFeature,
  canUseSelectedGeometryTools, canCloseSelectedLine, canConvertSelectedLineToPolygon, geometryQualitySummary,
  canUseFeatureBoxSelect, canMoveSelectedFeatures, selectedLayerLabel,
  createEmptyLayer, getFeatureId, getFeatureLabel, getLayerLabel,
  syncLayerIdSeedFromLayers, applyLayerPropertyToFeatures,
  setMode, handleDrawModeChange, handleShapeEditStateChange, handleFeatureSelect,
  handleFeatureBoxSelect, handleToggleFeatureBoxSelect,
  handleSelectFeatureFromPanel, handleToggleFeatureSelection,
  handleSelectAllFeatures, handleInvertFeatureSelection,
  setFeatureSelection, clearFeatureSelection, resetDrawSelectionMode,
  syncFeatureSelectionToMap, syncActiveLayerToMap, syncAllLayersAfterMutation,
  handleResetView, handleToggleFullscreen, syncMapFullscreenState,
} = core;

// ---- History ----
const history = useGisHistory({
  layers, activeLayerId, currentMode, currentStyleKey,
  selectedFeatureId, selectedFeatureIds, editableMapRef,
  setFeatureSelection, syncLayerIdSeedFromLayers, syncAllLayersAfterMutation,
});
setCommitHistory(history.commitHistory);

const { canUndoHistory, canRedoHistory, commitHistory, undoHistory, redoHistory } = history;

// ---- Layers ----
const gisLayers = useGisLayers({
  layers, activeLayerId, editableMapRef, currentMode,
  createEmptyLayer, getFeatureId, commitHistory,
  clearFeatureSelection, setFeatureSelection,
  syncAllLayersAfterMutation, resetDrawSelectionMode,
  applyLayerPropertyToFeatures, importInputRef,
  isAuthenticated, onAuthRequired: guardWrite,
});

const {
  handleCreateLayer, handleSelectLayer, moveLayer, moveLayerToTop, moveLayerToBottom,
  toggleLayerVisibility, setAllLayersVisibility, toggleLayerLock,
  toggleLayerLabels,
  handleUpdateLayerOpacity,
  handleRenameLayer, handleDuplicateLayer, handleDeleteLayer,
  triggerImportLayer, handleImportAsNewLayer,
  handleExportLayer, handleExportAllLayers,
  fetchHighPrecisionBoundaries,
  handleImportBoundaryConfirm,
  handleRiverImportConfirm,
} = gisLayers;

// ---- Features ----
const gisFeatures = useGisFeatures({
  layers, activeLayerId, activeLayer, selectedFeatureId, selectedFeatureIds,
  editableMapRef, currentMode, getFeatureId,
  canModifyActiveLayer, canDuplicateSelectedFeature,
  canEditSelectedShape, canDeleteSelection, canMoveSelectedFeatures,
  canUseSelectedGeometryTools, canCloseSelectedLine, canConvertSelectedLineToPolygon,
  setFeatureSelection, clearFeatureSelection,
  syncAllLayersAfterMutation, syncFeatureSelectionToMap,
  resetDrawSelectionMode, commitHistory,
  activeLayerFeatureIdSet, activeLayerFeatureTableColumns,
  selectedEditorProperties, selectedEditorGeometryType,
  canApplySelectedFeatureBatchProperty,
  selectedFeatureBatchName, selectedFeatureBatchPropertyKey, selectedFeatureBatchPropertyValue,
  featureMoveLayerOptions,
  isAuthenticated, onAuthRequired: guardWrite,
});

const {
  handleEditSelectedShape, handleDuplicateSelectedFeature,
  handleReverseSelectedGeometry, handleSimplifySelectedGeometry, handleCloseSelectedLine, handleConvertSelectedLineToPolygon,
  handleMoveSelectedVertex,
  handleDeleteSelected, handleDeleteSelectedFeatures, handleClearAll,
  updateFeatureProperty, updateSelectedFeatureProperty,
  updateSelectedFeaturesProperty,
  handleUpdateFeatureTableCell,
  handleApplySelectedFeatureBatchName, handleApplySelectedFeatureBatchProperty,
  handleSetSelectedFeaturesVisible, handleSetSelectedFeaturesLocked,
  handleMoveSelectedFeatureToLayer, handleMoveSelectedFeaturesToLayer,
} = gisFeatures;

// ---- Drafts ----
const drafts = useGisDrafts({
  layers, activeLayerId, currentStyleKey,
  isDrawingPanelOpen, isLayersPanelOpen,
  snappingEnabled, snapTolerance, snapGridSize,
  isAuthenticated,
  clearFeatureSelection, syncLayerIdSeedFromLayers,
  syncAllLayersAfterMutation, commitHistory,
  onAuthRequired: guardWrite,
});

const {
  showLocalStorageModal, showSaveLocalDraftModal,
  selectedStoredDraftId, newDraftName,
  storedDraftOptions,
  hasUnsavedWorkbenchChanges,
  getCurrentWorkbenchSignature,
  markWorkbenchClean,
  saveAutoDraft, clearAutoDraft,
  checkAutoDraftOnce, restoreStoredDrafts,
  openSaveLocalDraftModal, confirmSaveAsNewLocal,
  handleUpdateLocal, handleRestoreLocal, handleDeleteLocal,
  handleBeforeUnload,
  applyDraftState,
} = drafts;

// ---- Voronoi ----
const voronoi = useGisVoronoi({
  layers, activeLayerId, editableMapRef, currentMode,
  isDrawingPanelOpen, isLayersPanelOpen,
  createEmptyLayer, commitHistory,
  syncAllLayersAfterMutation,
  setMode,
  fetchHighPrecisionBoundaries,
  isAuthenticated, onAuthRequired: guardWrite,
});

const {
  voronoiImport, voronoiTabularState,
  voronoiPreviewLayers, voronoiPreviewType, hoveredPolygon,
  voronoiPartitionMode, voronoiRegionLevel, isVoronoiPanelOpen,
  isVoronoiLoadingPoints, isVoronoiCalculating, voronoiStatusText,
  useVoronoiOfficialData, hasVoronoiCustomImport,
  voronoiOfficialPointCount, voronoiCustomPointCount,
  voronoiCustomImportSummaryText, isVillageDataSource, hasFieldMerge,
  voronoiExpandRatio, voronoiEnableExpand, voronoiEnableYindianAdjust, voronoiShowDialectIslands,
  voronoiTotalPointCount, voronoiActivePointCount,
  ignoredVoronoiLocations, voronoiGroupCount, voronoiPanelOffsetMode,
  voronoiSelectionOptions, voronoiColorMap, voronoiExportGroups,
  voronoiExportSelections, selectedVoronoiExportCount, isVoronoiExportSelectionFull,
  voronoiExportProgress, isVoronoiExporting, showVoronoiExportProgressOverlay,
  voronoiFieldMergeMap, fieldMergeEntries,
  isAddingDialectPoints, showAddDialectPartitionModal,
  pendingAddPartitionKey, addDialectPartitionOptions, customPointsByPartition,
  showVoronoiPreviewModal, showVoronoiIgnoreModal, showFieldMergeModal,
  clipBoundaryConfig, showClipBoundaryModal, showImportBoundaryModal,
  showRiverImportModal, isRiverImporting, importBoundaryConfig,
  highPrecisionEnabled, isBoundaryOptionsLoading,
  boundaryOptionsMap, clipBoundarySummary,
  showImageExportModal, showImagePreviewModal,
  imageExportSettings, imageExportViewState,
  voronoiImportFileInputRef,
  loadVoronoiPoints, ensureVoronoiPointsLoaded,
  clearVoronoiCustomImport, clearVoronoiPreviewState,
  syncVoronoiPartitionPoints, normalizeVoronoiPoints,
  setVoronoiStatus, previewVoronoiPoints, handleBuildVoronoi,
  exportVoronoiToLayer, toggleVoronoiExportSelection, confirmVoronoiExport,
  handleVoronoiIgnoreConfirm, openVoronoiIgnoreModal, refreshVoronoiPreview,
  handleVoronoiCustomImportConfirm,
  handleVoronoiFileChange, handleVoronoiPreviewReset, handleVoronoiPreviewConfirm,
  triggerVoronoiFileImport, consumeVillageVoronoiPayload,
  updateFieldMerge, resetFieldMerge, initFieldMergeMap,
  toggleAddDialectPoints, confirmAddDialectPartition, deleteCustomPointsByPartition,
  handleMapClickForAddPoint, handleOpenClipBoundary, handleClipBoundaryConfirm,
  onAdminBoundaryClicked, onRiverImportClicked,
  handleImageExported, handleLayerExported, handleConfirmImageExport,
  handleImagePreviewExported, handleExportImage,
  loadProvincesGeoJson, loadCitiesGeoJson, loadCountiesGeoJson,
  loadNationalBorderFeatureCollection, loadBorderFeatureCollection,
  restoreVoronoiConfig,
} = voronoi;

// ---- Voronoi hover handler ----
const handlePreviewFeatureHover = (info) => {
  hoveredPolygon.value = info;
};

// ---- Style handling ----
const handleStyleChange = () => {
  editableMapRef.value?.handleStyleChange?.();
};

const handlePanelStyleUpdate = (value) => {
  currentStyleKey.value = value;
  handleStyleChange();
};

const handleSetMode = async (mode) => {
  if (mode !== 'simple_select' && !await guardWrite()) return;
  setMode(mode);
};

// ---- Feature change handler ----
let isRejectingUnauthenticatedFeatureChange = false;

const rejectUnauthenticatedFeatureChange = async () => {
  if (isRejectingUnauthenticatedFeatureChange) {
    syncActiveLayerToMap();
    return;
  }
  isRejectingUnauthenticatedFeatureChange = true;
  try {
    await guardWrite();
    syncActiveLayerToMap();
  } finally {
    isRejectingUnauthenticatedFeatureChange = false;
  }
};

const handleBeforeFeaturesChange = () => {
  if (!isAuthenticated.value) return;
  commitHistory();
};

function applyActiveLayerDefaultsToFeatureCollection(featureCollection) {
  if (!featureCollection || !Array.isArray(featureCollection.features)) return featureCollection;
  return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => {
      const props = feature?.properties ?? {};
      return {
        ...feature,
        properties: {
          ...props,
          stroke: props.stroke ?? activeLayer.value?.stroke,
          strokeWidth: props.strokeWidth ?? activeLayer.value?.strokeWidth,
          fill: props.fill ?? activeLayer.value?.fill,
          fillOpacity: props.fillOpacity ?? activeLayer.value?.fillOpacity,
          opacity: props.opacity ?? activeLayer.value?.opacity ?? 1,
          labelsVisible: props.labelsVisible ?? activeLayer.value?.labelsVisible ?? false,
          pointRadius: props.pointRadius ?? activeLayer.value?.pointRadius,
          pointColor: props.pointColor ?? activeLayer.value?.pointColor,
          pointStrokeColor: props.pointStrokeColor ?? activeLayer.value?.pointStrokeColor,
          visible: props.visible ?? activeLayer.value?.visible ?? true,
          locked: props.locked ?? activeLayer.value?.locked ?? false,
        },
      };
    }),
  };
}

const handleActiveLayerModelUpdate = async (nextValue) => {
  if (!isAuthenticated.value) {
    await rejectUnauthenticatedFeatureChange();
    return;
  }

  activeLayerFeatureCollection.value = applyActiveLayerDefaultsToFeatureCollection(nextValue);
};

const handleActiveLayerFeaturesChange = async () => {
  if (!isAuthenticated.value) {
    await rejectUnauthenticatedFeatureChange();
    return;
  }

  if (selectedFeatureIds.value.length > 0 || selectedFeatureId.value) {
    const fids = selectedFeatureIds.value.length > 0
      ? selectedFeatureIds.value
      : [selectedFeatureId.value];
    setFeatureSelection(fids, selectedFeatureId.value);
  }
};

// ---- Panel toggle ----
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

// ---- Keyboard shortcuts ----
const isEditableKeyboardTarget = (target) => {
  const tag = target?.tagName?.toLowerCase?.();
  return target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag);
};

const handleDrawHistoryKeydown = (event) => {
  if (isEditableKeyboardTarget(event.target)) return;
  const isUndo = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
  const isRedo = ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'z')
    || (event.ctrlKey && event.key.toLowerCase() === 'y');
  const isSelectAll = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'a';
  const isDelete = event.key === 'Delete' || event.key === 'Backspace';
  const isEscape = event.key === 'Escape';

  if (isUndo) { event.preventDefault(); undoHistory(); return; }
  if (isRedo) { event.preventDefault(); redoHistory(); return; }
  if (isSelectAll && canModifyActiveLayer.value) { event.preventDefault(); handleSelectAllFeatures(); return; }
  if (isDelete && canDeleteSelection.value) { event.preventDefault(); handleDeleteSelected(); return; }
  if (isEscape && (isFeatureBoxSelectMode.value || selectedFeatureIds.value.length > 0
    || selectedFeatureId.value || currentMode.value !== 'simple_select')) {
    event.preventDefault(); resetDrawSelectionMode();
  }
};

// ---- Modal action helpers ----
const handleLogin = async () => {
  await requireAuth({
    message: t('map.drawTab.auth.loginRequired'),
    redirect: route.fullPath || '/explore/gis',
  });
};

const onCreateLayerClicked = (type) => {
  handleCreateLayer(type);
  showAddLayerModal.value = false;
};

const onImportLayerClicked = () => {
  triggerImportLayer();
  showAddLayerModal.value = false;
};

const onAdminBoundaryImportClicked = async () => {
  showAddLayerModal.value = false;
  await onAdminBoundaryClicked();
};

const onRiverLayerImportClicked = async () => {
  showAddLayerModal.value = false;
  await onRiverImportClicked();
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
  showImageExportModal.value = true;
};

// ---- Export voronoi modal opener ----
const voronoiExportLimit = 20;
const openVoronoiExportModal = async () => {
  const ready = await exportVoronoiToLayer();
  if (ready) showVoronoiExportModal.value = true;
};

// ---- Lifecycle ----
onMounted(async () => {
  try {
    await restoreStoredDrafts();
    markWorkbenchClean();
    await checkAutoDraftOnce();
    restoreVoronoiConfig();
  } catch (error) {
    console.warn('restore map draw state failed', error);
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

// ---- Auto-draft watcher ----
watch(getCurrentWorkbenchSignature, () => {
  saveAutoDraft();
}, { flush: 'post' });
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use '@/styles/global/scrollbars' as scrollbars;

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

  .glass-button {
    padding: 12px 16px;
  }

  .draw-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    &--header {
      justify-content: flex-end;

      @media (hover: hover) and (pointer: fine) {
        .glass-button:hover:not(:disabled) {
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

        .glass-button,
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
