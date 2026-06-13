<template>
  <div class="map-draw-tab page-content-stack">
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
          @click="isVoronoiPanelOpen = !isVoronoiPanelOpen"
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
          @click="isDrawingPanelOpen = !isDrawingPanelOpen"
        >
          🛠️ {{ t('map.drawTab.buttons.drawingTools') }}
        </button>
        <button
          class="main-glass-button"
          :data-variant="isLayersPanelOpen ? 'primary' : 'secondary'"
          :data-active="isLayersPanelOpen"
          type="button"
          @click="isLayersPanelOpen = !isLayersPanelOpen"
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
            @features-change="handleActiveLayerFeaturesChange"
            @feature-select="handleFeatureSelect"
            @export-image="handleImageExported"
            @export-layer="handleLayerExported"
          />
        </div>

        <MapDrawToolsPanel
          :is-open="isDrawingPanelOpen"
          :offset-left="isLayersPanelOpen"
          :active-layer="activeLayer"
          :selected-layer-label="selectedLayerLabel"
          :current-mode="currentMode"
          :selected-feature-properties="selectedFeatureProperties"
          :selected-feature-geometry-type="selectedFeatureGeometryType"
          @set-mode="setMode"
          @delete-selected="handleDeleteSelected"
          @clear-all="handleClearAll"
          @reset-view="handleResetView"
          @update-feature-property="updateSelectedFeatureProperty"
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
          :offset-mode="voronoiPanelOffsetMode"
          @update:partition-mode="voronoiPartitionMode = $event"
          @update:region-level="voronoiRegionLevel = $event"
          @load-points="loadVoronoiPoints"
          @open-ignore-modal="openVoronoiIgnoreModal"
          @preview-points="previewVoronoiPoints"
          @calculate="handleBuildVoronoi"
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
            @click="handleSaveAsNewLocal"
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

      <VoronoiIgnorePointsModal
        v-model="showVoronoiIgnoreModal"
        :regions="voronoiSelectionOptions.regions"
        :locations="voronoiSelectionOptions.locations"
        :ignored-locations="ignoredVoronoiLocations"
        @confirm="handleVoronoiIgnoreConfirm"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { getLocationPartitions } from '@/api/main/geo/LocationAndRegion.js';
import { usePartitionCache } from '@/composables/domain/usePartitionCache.js';
import { useAuthGuard } from '@/composables/router/useAuthGuard.js';
import { showConfirm, showError, showSuccess } from '@/utils/message.js';
import { readImportedLayerFile, splitFeatureCollectionByGeometryType } from '@/utils/map/draw/export.js';
import {
  PARTITION_MODE_MAP,
  buildPartitionColorMap,
  buildPartitionPointFeatureCollection,
  buildPartitionPoints,
  buildVoronoiSelectionOptions,
  calculatePartitionVoronoi,
} from '@/utils/map/partitionVoronoi.js';
import { mapStyleConfig } from '@/utils/map/MapSource.js';
import EditableMapLibre from '@/main/components/map/EditableMapLibre.vue';
import MapDrawLayersPanel from '@/main/components/map/panels/MapDrawLayersPanel.vue';
import MapDrawToolsPanel from '@/main/components/map/panels/MapDrawToolsPanel.vue';
import MapDrawVoronoiPanel from '@/main/components/map/panels/MapDrawVoronoiPanel.vue';
import VoronoiIgnorePointsModal from '@/main/components/map/modals/VoronoiIgnorePointsModal.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';
import AppModal from '@/components/common/AppModal.vue';

const { t } = useI18n();
const { requireAuth, isAuthenticated } = useAuthGuard();
const { getPartitionData } = usePartitionCache();

const defaultLayerStyle = {
  stroke: '#2563eb',
  strokeWidth: 3,
  fill: '#60a5fa',
  fillOpacity: 0.22,
  pointRadius: 6,
  pointColor: '#60a5fa',
  pointStrokeColor: '#2563eb',
  visible: true,
  locked: false,
};
const mapDrawStorageKey = 'map-draw-workbench-state';
let layerIdSeed = 0;

const editableMapRef = ref(null);
const importInputRef = ref(null);
const currentMode = ref('simple_select');
const currentStyleKey = ref('gaode');
const selectedFeatureId = ref('');
const layers = ref([]);
const activeLayerId = ref('');
const isDrawingPanelOpen = ref(true);
const isLayersPanelOpen = ref(false);
const showAddLayerModal = ref(false);
const showExportModal = ref(false);
const showLocalStorageModal = ref(false);
const selectedStoredDraftId = ref('');
const storedDrafts = ref([]);
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
    featureCollection: emptyFeatureCollection(),
  };
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

const selectedFeatureProperties = computed(() => activeLayer.value ?? null);
const selectedFeatureGeometryType = computed(() => activeLayer.value?.geometryType ?? '');

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
    redirect: '/menu/map/draw',
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
const ignoredVoronoiLocations = ref([]);
const voronoiPreviewLayers = ref([]);
const voronoiPreviewType = ref('');
const voronoiPartitionMode = ref(PARTITION_MODE_MAP);
const voronoiRegionLevel = ref(3);
const isVoronoiPanelOpen = ref(false);
const isVoronoiLoadingPoints = ref(false);
const isVoronoiCalculating = ref(false);
const showVoronoiIgnoreModal = ref(false);
const voronoiStatusText = ref('');

const activeVoronoiPoints = computed(() => {
  const ignored = new Set(ignoredVoronoiLocations.value);
  return voronoiPartitionPoints.value.filter((item) => !ignored.has(item.name));
});

const voronoiTotalPointCount = computed(() => voronoiPartitionPoints.value.length);
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
  return buildVoronoiSelectionOptions(voronoiPartitionPoints.value, Number(voronoiRegionLevel.value) || 3);
});

const voronoiColorMap = computed(() => {
  return buildPartitionColorMap(activeVoronoiPoints.value, Number(voronoiRegionLevel.value) || 3);
});

const setVoronoiStatus = (key, params = {}) => {
  voronoiStatusText.value = t(`map.drawTab.voronoi.${key}`, params);
};

const normalizeVoronoiPoints = (partitionData = voronoiRawPartitionData.value) => {
  voronoiPartitionPoints.value = buildPartitionPoints(partitionData, {
    partitionMode: voronoiPartitionMode.value,
  });
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

const ensureVoronoiPointsLoaded = async () => {
  if (voronoiPartitionPoints.value.length) return;
  await loadVoronoiPoints();
};

const openVoronoiIgnoreModal = async () => {
  await ensureVoronoiPointsLoaded();
  showVoronoiIgnoreModal.value = true;
};

const refreshVoronoiPreview = async () => {
  if (voronoiPreviewType.value === 'points') {
    await previewVoronoiPoints();
    return;
  }
  if (voronoiPreviewType.value === 'polygons') {
    await handleBuildVoronoi();
  }
};

const handleVoronoiIgnoreConfirm = async (locations) => {
  ignoredVoronoiLocations.value = Array.isArray(locations) ? locations : [];
  setVoronoiStatus('ignoreUpdated', { count: ignoredVoronoiLocations.value.length });
  await refreshVoronoiPreview();
};

const previewVoronoiPoints = async () => {
  await ensureVoronoiPointsLoaded();
  const pointCollection = buildPartitionPointFeatureCollection(
    activeVoronoiPoints.value,
    Number(voronoiRegionLevel.value) || 3,
    voronoiColorMap.value
  );
  voronoiPreviewType.value = 'points';
  voronoiPreviewLayers.value = [{
    id: 'voronoi-preview-points',
    type: 'points',
    featureCollection: pointCollection,
  }];
  setVoronoiStatus('previewReady', { count: pointCollection.features.length });
  console.log('[MapDrawTab] voronoi preview points:', pointCollection);
};

const handleBuildVoronoi = async () => {
  if (isVoronoiCalculating.value) return;
  isVoronoiCalculating.value = true;

  try {
    await ensureVoronoiPointsLoaded();
    const level = Number(voronoiRegionLevel.value) || 3;
    const points = activeVoronoiPoints.value;
    const pointCollection = buildPartitionPointFeatureCollection(points, level, voronoiColorMap.value);
    const voronoiResult = calculatePartitionVoronoi(points, level, voronoiColorMap.value);

    voronoiPreviewType.value = 'polygons';
    voronoiPreviewLayers.value = [{
      id: 'voronoi-preview-polygons',
      type: 'polygons',
      featureCollection: voronoiResult.merged,
    }];
    setVoronoiStatus('calculated', { count: voronoiResult.merged.features.length });
    // console.log('[MapDrawTab] voronoi points:', pointCollection);
    // console.log('[MapDrawTab] voronoi polygons:', voronoiResult);
  } catch (error) {
    console.error('[MapDrawTab] Voronoi calculation failed:', error);
    showError(t('map.drawTab.messages.voronoiFailed', { error: error.message || error }));
  } finally {
    isVoronoiCalculating.value = false;
  }
};

watch(voronoiPartitionMode, async () => {
  normalizeVoronoiPoints();
  ignoredVoronoiLocations.value = [];
  await refreshVoronoiPreview();
  if (!voronoiPreviewType.value) {
    voronoiPreviewLayers.value = [];
  }
});

watch(voronoiRegionLevel, async () => {
  await refreshVoronoiPreview();
  if (!voronoiPreviewType.value) {
    voronoiPreviewLayers.value = [];
  }
});

const handleCreateLayer = (geometryType) => {
  const layer = createEmptyLayer(geometryType);
  layers.value.push(layer);
  activeLayerId.value = layer.id;
  selectedFeatureId.value = '';
  isDrawingPanelOpen.value = true;
  const mode = geometryType === 'Point'
    ? 'draw_point'
    : geometryType === 'Polygon'
      ? 'draw_polygon'
      : 'draw_line_string';
  setMode(mode);
};

const setMode = (mode) => {
  if (!activeLayer.value && mode !== 'simple_select') {
    const geometryType = mode === 'draw_point'
      ? 'Point'
      : mode === 'draw_polygon'
        ? 'Polygon'
        : 'LineString';
    handleCreateLayer(geometryType);
    return;
  }
  editableMapRef.value?.setDrawMode?.(mode);
  currentMode.value = mode;
};

const handleSelectLayer = (layerId) => {
  activeLayerId.value = layerId;
  selectedFeatureId.value = '';
  currentMode.value = 'simple_select';
  editableMapRef.value?.setDrawMode?.('simple_select');
};

const moveLayer = (layerId, direction) => {
  const layerIndex = layers.value.findIndex((item) => item.id === layerId);
  if (layerIndex === -1) return;
  const targetIndex = layerIndex + direction;
  if (targetIndex < 0 || targetIndex >= layers.value.length) return;
  const [layer] = layers.value.splice(layerIndex, 1);
  layers.value.splice(targetIndex, 0, layer);
  syncAllLayersAfterMutation();
};

const syncActiveLayerToMap = () => {
  if (!activeLayer.value) return;
  editableMapRef.value?.importGeoJson?.(
    activeLayer.value.visible === false ? emptyFeatureCollection() : activeLayer.value.featureCollection,
    { emitChanges: false }
  );
};

const syncAllLayersAfterMutation = () => {
  syncActiveLayerToMap();
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
  layer.visible = !layer.visible;
  applyLayerPropertyToFeatures(layer, 'visible', layer.visible);
  syncAllLayersAfterMutation();
};

const setAllLayersVisibility = (visible) => {
  layers.value.forEach((layer) => {
    layer.visible = visible;
    applyLayerPropertyToFeatures(layer, 'visible', visible);
  });
  syncAllLayersAfterMutation();
};

const toggleLayerLock = (layerId) => {
  const layer = layers.value.find((item) => item.id === layerId);
  if (!layer) return;
  layer.locked = !layer.locked;
  applyLayerPropertyToFeatures(layer, 'locked', layer.locked);
  syncAllLayersAfterMutation();
};

const handleDeleteLayer = (layerId) => {
  const layerIndex = layers.value.findIndex((item) => item.id === layerId);
  if (layerIndex === -1) return;
  layers.value.splice(layerIndex, 1);

  if (activeLayerId.value === layerId) {
    const fallbackLayer = layers.value[layerIndex] ?? layers.value[layerIndex - 1] ?? null;
    activeLayerId.value = fallbackLayer?.id ?? '';
    selectedFeatureId.value = '';
    currentMode.value = 'simple_select';
    editableMapRef.value?.setDrawMode?.('simple_select');
  }
  syncAllLayersAfterMutation();
};

const getFeatureId = (feature) => String(feature?.id ?? feature?.properties?.id ?? '');

const handleFeatureSelect = (featureId) => {
  selectedFeatureId.value = featureId || '';
};

const updateSelectedFeatureProperty = (key, value) => {
  if (!activeLayer.value) return;
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

const handleActiveLayerFeaturesChange = (nextValue) => {
  updateActiveLayerFeatureCollection(nextValue);
  if (selectedFeatureId.value) {
    const stillExists = nextValue.features?.some(
      (feature) => getFeatureId(feature) === selectedFeatureId.value
    );
    if (!stillExists) {
      selectedFeatureId.value = '';
    }
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

const handleImportAsNewLayer = async (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    const importedFeatureCollection = await readImportedLayerFile(file);
    const importedLayerGroups = splitFeatureCollectionByGeometryType(importedFeatureCollection);
    const importedLayers = importedLayerGroups.map((group) => createImportedLayer(
      group.featureCollection,
      group.geometryType
    ));
    layers.value.unshift(...importedLayers);
    const activeImportedLayer = importedLayers[0];
    activeLayerId.value = activeImportedLayer.id;
    isDrawingPanelOpen.value = true;
    editableMapRef.value?.importGeoJson?.(activeImportedLayer.featureCollection);
    currentMode.value = 'simple_select';
    showSuccess(t('map.drawTab.messages.importLayerSuccess', { count: importedLayers.length }));
  } catch (error) {
    showError(t('map.drawTab.messages.importLayerFailed', { error: error.message || error }));
  } finally {
    if (event?.target) {
      event.target.value = '';
    }
  }
};

const handleDeleteSelected = async () => {
  editableMapRef.value?.deleteSelected?.();
  currentMode.value = 'simple_select';
};

const handleResetView = () => {
  editableMapRef.value?.resetView?.();
};

const handleClearAll = async () => {
  const confirmed = await showConfirm(t('map.drawTab.messages.clearAllConfirm'));
  if (!confirmed) return;

  if (activeLayer.value) {
    activeLayer.value.featureCollection = emptyFeatureCollection();
  }
  editableMapRef.value?.clearAll?.();
  selectedFeatureId.value = '';
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

const handleExportImage = async () => {
  try {
    await editableMapRef.value?.exportImage?.();
    showSuccess(t('map.drawTab.messages.exportImageSuccess'));
  } catch (error) {
    showError(t('map.drawTab.messages.exportImageFailed', { error: error.message || error }));
  }
};

const handleImageExported = () => {};
const handleLayerExported = () => {};

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

const getStoredDrafts = () => {
  const raw = localStorage.getItem(mapDrawStorageKey);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

const writeStoredDrafts = (drafts) => {
  storedDrafts.value = drafts;
  localStorage.setItem(mapDrawStorageKey, JSON.stringify(drafts));
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
  state: buildPersistedWorkbenchState(),
});

const applyDraftState = (state) => {
  layers.value = Array.isArray(state?.layers) ? state.layers : [];
  activeLayerId.value = state?.activeLayerId || layers.value[0]?.id || '';
  currentStyleKey.value = state?.currentStyleKey || 'gaode';
  isDrawingPanelOpen.value = state?.isDrawingPanelOpen ?? true;
  isLayersPanelOpen.value = state?.isLayersPanelOpen ?? false;
  const numericIds = layers.value
    .map((layer) => Number(String(layer?.id || '').replace('draw-layer-', '')))
    .filter((value) => Number.isFinite(value));
  layerIdSeed = numericIds.length ? Math.max(...numericIds) : layerIdSeed;
  syncAllLayersAfterMutation();
};

const restoreWorkbenchState = () => {
  const drafts = getStoredDrafts();
  storedDrafts.value = drafts;
  if (!drafts.length) return;
  const latestDraft = drafts[drafts.length - 1];
  applyDraftState(latestDraft?.state);
  selectedStoredDraftId.value = latestDraft?.id || '';
};

const handleSaveAsNewLocal = () => {
  if (!hasLayersToPersist.value) {
    showError(t('map.drawTab.messages.noLayersToSave'));
    return;
  }
  const drafts = getStoredDrafts();
  const nextDraft = buildDraftRecord(`${t('map.drawTab.title')} ${drafts.length + 1}`);
  drafts.push(nextDraft);
  writeStoredDrafts(drafts);
  selectedStoredDraftId.value = nextDraft.id;
  showSuccess(t('map.drawTab.messages.saveToLocalSuccess'));
};

const handleUpdateLocal = () => {
  if (!hasLayersToPersist.value) {
    showError(t('map.drawTab.messages.noLayersToSave'));
    return;
  }
  if (!selectedStoredDraftId.value) return;
  const drafts = getStoredDrafts();
  const draftIndex = drafts.findIndex((draft) => draft.id === selectedStoredDraftId.value);
  if (draftIndex === -1) return;
  drafts[draftIndex] = {
    ...drafts[draftIndex],
    savedAt: new Date().toISOString(),
    state: buildPersistedWorkbenchState(),
  };
  writeStoredDrafts(drafts);
  showSuccess(t('map.drawTab.messages.updateLocalSuccess'));
};

const handleRestoreLocal = () => {
  if (!selectedStoredDraftId.value) return;
  const draft = getStoredDrafts().find((item) => item.id === selectedStoredDraftId.value);
  if (!draft) return;
  applyDraftState(draft.state);
  showSuccess(t('map.drawTab.messages.restoreLocalSuccess'));
};

const handleDeleteLocal = () => {
  if (!selectedStoredDraftId.value) return;
  const drafts = getStoredDrafts().filter((draft) => draft.id !== selectedStoredDraftId.value);
  writeStoredDrafts(drafts);
  selectedStoredDraftId.value = drafts[0]?.id || '';
  showSuccess(t('map.drawTab.messages.deleteLocalSuccess'));
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
  handleExportImage();
  showExportModal.value = false;
};

const moveLayerToTop = (layerId) => {
  const index = layers.value.findIndex((item) => item.id === layerId);
  if (index === -1 || index === layers.value.length - 1) return;
  const [layer] = layers.value.splice(index, 1);
  layers.value.push(layer);
  syncAllLayersAfterMutation();
};

const moveLayerToBottom = (layerId) => {
  const index = layers.value.findIndex((item) => item.id === layerId);
  if (index === -1 || index === 0) return;
  const [layer] = layers.value.splice(index, 1);
  layers.value.unshift(layer);
  syncAllLayersAfterMutation();
};

onMounted(() => {
  try {
    restoreWorkbenchState();
  } catch (error) {
    console.warn('restore map draw workbench state failed', error);
  }
});
</script>

<style scoped lang="scss">
@use '../../../styles/global/scrollbars' as scrollbars;

@mixin draw-section-base {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.42);
}

@mixin draw-field-stack {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

@mixin draw-button-grid($columns) {
  display: grid;
  grid-template-columns: repeat($columns, minmax(0, 1fr));
  gap: 0.5rem;
}

.map-draw-tab {
  width: min(98dvw, 1200px);
  gap: 1rem;
}

.draw-tab-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  width: 94%;
  padding: 0.4rem 1.2rem;
}

.draw-tab-copy {
  min-width: 0;
}

.draw-tab-title {
  margin: 0;
}

.draw-tab-hint {
  margin: 0.35rem 0 0;
}

.main-glass-button{
  padding:15px 16px;
}

.draw-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.draw-toolbar--header {
  justify-content: flex-end;
}

.draw-feature-count-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2.5rem;
  padding: 0 0.95rem;
  border-radius: 999px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(232, 244, 255, 0.72));
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #0b2540;
  font-size: 0.92rem;
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.5),
    0 8px 18px rgba(0, 122, 255, 0.08);
}

.draw-workbench {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.draw-map-area {
  width: 100%;
}

/* Modal Choices Styles */
.draw-modal-choices {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.draw-modal-card-btn {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  width: 100%;
  padding: 1.2rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.draw-modal-card-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.8);
  border-color: #007aff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.08);
}

.draw-modal-card-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.draw-card-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.draw-card-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.draw-card-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0b2540;
}

.draw-card-desc {
  font-size: 0.85rem;
  color: rgba(11, 37, 64, 0.65);
}

@media (max-width: 900px) {
  .draw-tab-header,
  .draw-tool-section-header {
    display: flex;
    flex-direction: column;
  }

  .draw-toolbar--header {
    width: 100%;
    justify-content: flex-start;
    gap: 0.45rem;
  }

  .draw-toolbar--header .main-glass-button,
  .draw-toolbar--header .draw-feature-count-badge {
    min-height: 2.15rem;
    min-width: auto;
    padding: 0 0.65rem;
    font-size: 0.84rem;
    justify-content: center;
  }

  .draw-workbench {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    overflow: visible;
  }

  .draw-tool-panel,
  .draw-tool-panel.offset-left,
  .layers-panel {
    position: static;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    max-width: 100%;
    min-height: auto;
    max-height: none;
  }

  .draw-tool-panel-body {
    max-height: none;
  }

  .draw-tool-button-grid,
  .draw-tool-button-grid--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
