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
          @click="triggerImportLayer"
        >
          {{ t('map.drawTab.buttons.importLayer') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="secondary"
          type="button"
          @click="handleExportLayer"
        >
          {{ t('map.drawTab.buttons.exportLayer') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="secondary"
          type="button"
          @click="handleExportAllLayers"
        >
          {{ t('map.drawTab.buttons.exportAllLayers') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="primary"
          type="button"
          @click="handleExportImage"
        >
          {{ t('map.drawTab.buttons.exportImage') }}
        </button>
        <button
          class="main-glass-button"
          :data-variant="isToolPanelCollapsed ? 'primary' : 'secondary'"
          type="button"
          @click="isToolPanelCollapsed = !isToolPanelCollapsed"
        >
          {{
            isToolPanelCollapsed
              ? t('map.drawTab.buttons.expandTools')
              : t('map.drawTab.buttons.collapseTools')
          }}
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
      <div
        class="draw-workbench"
        :data-panel-collapsed="isToolPanelCollapsed"
      >
        <div class="draw-map-area">
          <EditableMapLibre
            ref="editableMapRef"
            v-model="activeLayerFeatureCollection"
            v-model:current-style-key="currentStyleKey"
            :active-layer="activeLayer"
            :all-layers="layers"
            @features-change="handleActiveLayerFeaturesChange"
            @feature-select="handleFeatureSelect"
            @export-image="handleImageExported"
            @export-layer="handleLayerExported"
          />
        </div>

        <Transition name="draw-panel-slide">
          <aside
            v-if="!isToolPanelCollapsed"
            class="draw-tool-panel main-glass-panel"
          >
            <div class="draw-tool-panel-header">
              <div>
                <div class="draw-tool-panel-title">
                  {{ t('map.drawTab.title') }}
                </div>
                <div class="draw-tool-panel-subtitle">
                  {{ t('map.drawTab.labels.selectedLayer') }}：{{ selectedLayerLabel }}
                </div>
              </div>
            </div>

            <div class="draw-tool-panel-body">
              <section class="draw-tool-section">
                <div class="draw-tool-section-title">
                  新建图层
                </div>
                <div class="draw-tool-button-grid">
                  <button
                    class="main-glass-button"
                    data-variant="secondary"
                    type="button"
                    @click="handleCreateLayer('LineString')"
                  >
                    {{ t('map.drawTab.buttons.createLineLayer') }}
                  </button>
                  <button
                    class="main-glass-button"
                    data-variant="secondary"
                    type="button"
                    @click="handleCreateLayer('Polygon')"
                  >
                    {{ t('map.drawTab.buttons.createPolygonLayer') }}
                  </button>
                </div>
              </section>

              <section class="draw-tool-section">
                <div class="draw-tool-section-title">
                  绘制工具
                </div>
                <div class="draw-tool-button-grid draw-tool-button-grid--three">
                  <button
                    class="main-glass-button"
                    :data-variant="currentMode === 'simple_select' ? 'primary' : 'secondary'"
                    :data-active="currentMode === 'simple_select'"
                    type="button"
                    @click="setMode('simple_select')"
                  >
                    {{ t('map.drawTab.buttons.select') }}
                  </button>
                  <button
                    class="main-glass-button"
                    :data-variant="currentMode === 'draw_line_string' ? 'primary' : 'secondary'"
                    :data-active="currentMode === 'draw_line_string'"
                    :disabled="activeLayer?.geometryType === 'Polygon'"
                    type="button"
                    @click="setMode('draw_line_string')"
                  >
                    {{ t('map.drawTab.buttons.drawLine') }}
                  </button>
                  <button
                    class="main-glass-button"
                    :data-variant="currentMode === 'draw_polygon' ? 'primary' : 'secondary'"
                    :data-active="currentMode === 'draw_polygon'"
                    :disabled="activeLayer?.geometryType === 'LineString'"
                    type="button"
                    @click="setMode('draw_polygon')"
                  >
                    {{ t('map.drawTab.buttons.drawPolygon') }}
                  </button>
                  <button
                    class="main-glass-button"
                    data-variant="secondary"
                    type="button"
                    @click="handleDeleteSelected"
                  >
                    {{ t('map.drawTab.buttons.deleteSelected') }}
                  </button>
                  <button
                    class="main-glass-button"
                    data-variant="secondary"
                    type="button"
                    @click="handleClearAll"
                  >
                    {{ t('map.drawTab.buttons.clearAll') }}
                  </button>
                  <button
                    class="main-glass-button"
                    data-variant="secondary"
                    type="button"
                    @click="handleResetView"
                  >
                    {{ t('map.mapLibre.buttons.reset') }}
                  </button>
                </div>
              </section>

              <section class="draw-tool-section">
                <div class="draw-tool-section-header">
                  <div class="draw-tool-section-title">
                    {{ t('map.drawTab.labels.layerList') }}
                  </div>
                  <div class="draw-tool-inline-actions">
                    <button
                      class="main-glass-button draw-tool-inline-button"
                      data-variant="secondary"
                      type="button"
                      @click="setAllLayersVisibility(true)"
                    >
                      {{ t('map.drawTab.buttons.showAllLayers') }}
                    </button>
                    <button
                      class="main-glass-button draw-tool-inline-button"
                      data-variant="secondary"
                      type="button"
                      @click="setAllLayersVisibility(false)"
                    >
                      {{ t('map.drawTab.buttons.hideAllLayers') }}
                    </button>
                  </div>
                </div>
                <div class="draw-style-hint">
                  {{ t('map.drawTab.labels.styleHint') }}
                </div>

                <div
                  v-if="layers.length"
                  class="draw-layer-list"
                >
                  <div
                    v-for="layer in layers"
                    :key="layer.id"
                    class="draw-layer-row"
                    :data-active="activeLayerId === layer.id"
                  >
                    <button
                      class="main-glass-button draw-layer-row-button"
                      :data-variant="activeLayerId === layer.id ? 'primary' : 'secondary'"
                      :data-active="activeLayerId === layer.id"
                      type="button"
                      @click="handleSelectLayer(layer.id)"
                    >
                      {{ getLayerLabel(layer) }}
                    </button>
                    <div class="draw-layer-row-actions">
                      <button
                        class="main-glass-button draw-layer-chip-action"
                        data-variant="secondary"
                        type="button"
                        @click.stop="moveLayer(layer.id, -1)"
                      >
                        {{ t('map.drawTab.buttons.moveLayerUp') }}
                      </button>
                      <button
                        class="main-glass-button draw-layer-chip-action"
                        data-variant="secondary"
                        type="button"
                        @click.stop="moveLayer(layer.id, 1)"
                      >
                        {{ t('map.drawTab.buttons.moveLayerDown') }}
                      </button>
                      <button
                        class="main-glass-button draw-layer-chip-action"
                        data-variant="secondary"
                        type="button"
                        @click.stop="toggleLayerVisibility(layer.id)"
                      >
                        {{
                          layer.visible
                            ? t('map.drawTab.buttons.hideLayer')
                            : t('map.drawTab.buttons.showLayer')
                        }}
                      </button>
                      <button
                        class="main-glass-button draw-layer-chip-action"
                        data-variant="secondary"
                        type="button"
                        @click.stop="toggleLayerLock(layer.id)"
                      >
                        {{
                          layer.locked
                            ? t('map.drawTab.buttons.unlockLayer')
                            : t('map.drawTab.buttons.lockLayer')
                        }}
                      </button>
                      <button
                        class="main-glass-button draw-layer-chip-action"
                        data-variant="secondary"
                        type="button"
                        @click.stop="handleDeleteLayer(layer.id)"
                      >
                        {{ t('map.drawTab.buttons.deleteLayer') }}
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="draw-layer-empty"
                >
                  {{ t('map.drawTab.labels.emptyState') }}
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
                      @input="updateSelectedFeatureProperty('name', $event.target.value)"
                    >
                  </label>

                  <label class="draw-field">
                    <span class="draw-field-label">{{ t('map.drawTab.labels.strokeColor') }}</span>
                    <input
                      class="draw-color-input"
                      type="color"
                      :value="selectedFeatureProperties.stroke"
                      @input="updateSelectedFeatureProperty('stroke', $event.target.value)"
                    >
                  </label>

                  <label
                    v-if="selectedFeatureGeometryType !== 'Point'"
                    class="draw-field"
                  >
                    <span class="draw-field-label">{{ t('map.drawTab.labels.fillColor') }}</span>
                    <input
                      class="draw-color-input"
                      type="color"
                      :value="selectedFeatureProperties.fill"
                      @input="updateSelectedFeatureProperty('fill', $event.target.value)"
                    >
                  </label>

                  <label class="draw-field">
                    <span class="draw-field-label">{{ t('map.drawTab.labels.strokeWidth') }}：{{
                      selectedFeatureProperties.strokeWidth
                    }}</span>
                    <input
                      class="draw-range-input"
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      :value="selectedFeatureProperties.strokeWidth"
                      @input="
                        updateSelectedFeatureProperty('strokeWidth', Number($event.target.value))
                      "
                    >
                  </label>

                  <label
                    v-if="selectedFeatureGeometryType !== 'Point'"
                    class="draw-field"
                  >
                    <span class="draw-field-label">{{ t('map.drawTab.labels.fillOpacity') }}：{{
                      selectedFeatureProperties.fillOpacity
                    }}</span>
                    <input
                      class="draw-range-input"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      :value="selectedFeatureProperties.fillOpacity"
                      @input="
                        updateSelectedFeatureProperty('fillOpacity', Number($event.target.value))
                      "
                    >
                  </label>

                  <label class="draw-toggle-field">
                    <input
                      type="checkbox"
                      :checked="selectedFeatureProperties.visible"
                      @change="updateSelectedFeatureProperty('visible', $event.target.checked)"
                    >
                    <span>{{ t('map.drawTab.labels.visible') }}</span>
                  </label>

                  <label class="draw-toggle-field">
                    <input
                      type="checkbox"
                      :checked="selectedFeatureProperties.locked"
                      @change="updateSelectedFeatureProperty('locked', $event.target.checked)"
                    >
                    <span>{{ t('map.drawTab.labels.locked') }}</span>
                  </label>
                </div>
                <div
                  v-else
                  class="draw-layer-empty"
                >
                  {{ t('map.drawTab.labels.emptyState') }}
                </div>
              </section>

              <section class="draw-tool-section">
                <div class="draw-tool-section-title">
                  视图设置
                </div>
                <div class="draw-basemap-select">
                  <span class="draw-field-label">{{ t('map.drawTab.labels.basemap') }}</span>
                  <SimpleSelectDropdown
                    v-model="currentStyleKey"
                    :options="mapStyleOptions"
                    @update:model-value="handleStyleChange"
                  />
                </div>
              </section>
            </div>
          </aside>
        </Transition>
      </div>

      <input
        ref="importInputRef"
        type="file"
        accept=".json,.geojson,application/geo+json,application/json"
        class="draw-import-input"
        @change="handleImportAsNewLayer"
      >
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthGuard } from '@/composables/router/useAuthGuard.js';
import { showConfirm, showError, showSuccess } from '@/utils/message.js';
import { readGeoJsonFile } from '@/utils/map/draw/export.js';
import { mapStyleConfig } from '@/utils/map/MapSource.js';
import EditableMapLibre from '@/main/components/map/EditableMapLibre.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';

const { t } = useI18n();
const { requireAuth, isAuthenticated } = useAuthGuard();

const defaultLayerStyle = {
  stroke: '#2563eb',
  strokeWidth: 3,
  fill: '#60a5fa',
  fillOpacity: 0.22,
  visible: true,
  locked: false,
};
let layerIdSeed = 0;

const editableMapRef = ref(null);
const importInputRef = ref(null);
const currentMode = ref('simple_select');
const currentStyleKey = ref('gaode');
const selectedFeatureId = ref('');
const layers = ref([]);
const activeLayerId = ref('');
const isToolPanelCollapsed = ref(false);
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
  const isLine = geometryType === 'LineString';
  return {
    id: `draw-layer-${layerIdSeed}`,
    name: `${isLine ? t('map.drawTab.geometry.line') : t('map.drawTab.geometry.polygon')}${t('map.drawTab.labels.layer')} ${layerIdSeed}`,
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

const handleCreateLayer = (geometryType) => {
  const layer = createEmptyLayer(geometryType);
  layers.value.push(layer);
  activeLayerId.value = layer.id;
  selectedFeatureId.value = '';
  const mode = geometryType === 'Polygon' ? 'draw_polygon' : 'draw_line_string';
  setMode(mode);
};

const setMode = (mode) => {
  if (!activeLayer.value && mode !== 'simple_select') {
    handleCreateLayer(mode === 'draw_polygon' ? 'Polygon' : 'LineString');
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
  if (activeLayerId.value === layer.id) {
    editableMapRef.value?.importGeoJson?.(layer.featureCollection);
  }
};

const setAllLayersVisibility = (visible) => {
  layers.value.forEach((layer) => {
    layer.visible = visible;
    applyLayerPropertyToFeatures(layer, 'visible', visible);
  });
  if (activeLayer.value) {
    editableMapRef.value?.importGeoJson?.(activeLayer.value.featureCollection);
  }
};

const toggleLayerLock = (layerId) => {
  const layer = layers.value.find((item) => item.id === layerId);
  if (!layer) return;
  layer.locked = !layer.locked;
  applyLayerPropertyToFeatures(layer, 'locked', layer.locked);
  if (activeLayerId.value === layer.id) {
    editableMapRef.value?.importGeoJson?.(layer.featureCollection);
  }
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
  editableMapRef.value?.importGeoJson?.(activeLayer.value.featureCollection);
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

const createImportedLayer = (featureCollection) => {
  const firstGeometryType =
    featureCollection?.features?.[0]?.geometry?.type === 'Polygon' ? 'Polygon' : 'LineString';
  const layer = createEmptyLayer(firstGeometryType);
  layer.featureCollection = featureCollection ?? emptyFeatureCollection();
  layers.value.unshift(layer);
  activeLayerId.value = layer.id;
  return layer;
};

const handleImportAsNewLayer = async (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  try {
    const importedFeatureCollection = await readGeoJsonFile(file);
    const layer = createImportedLayer(importedFeatureCollection);
    activeLayerId.value = layer.id;
    editableMapRef.value?.importGeoJson?.(importedFeatureCollection);
    currentMode.value = 'simple_select';
    showSuccess(t('map.drawTab.messages.importLayerSuccess'));
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
</script>

<style scoped lang="scss">
@mixin draw-section-base {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.42);
}

@mixin draw-field-stack {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
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
  width: 100%;
  padding: 1rem 1.2rem;
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

.draw-tool-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  width: 22rem;
  max-width: calc(100% - 2rem);
  z-index: 10;
  padding: 1rem 1.05rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.draw-tool-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.draw-tool-panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0b2540;
}

.draw-tool-panel-subtitle {
  margin-top: 0.3rem;
  font-size: 0.88rem;
  color: rgba(11, 37, 64, 0.72);
}

.draw-tool-panel-body {
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding-right: 0.15rem;
}

/* Panel slide transition */
.draw-panel-slide-enter-active,
.draw-panel-slide-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.draw-panel-slide-enter-from,
.draw-panel-slide-leave-to {
  transform: translateX(calc(100% + 1.5rem));
  opacity: 0;
}

.draw-tool-section {
  @include draw-section-base;

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
}

.draw-tool-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.draw-tool-section-title {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(11, 37, 64, 0.68);
}

.draw-tool-inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.draw-tool-inline-button {
  min-width: auto;
  padding-inline: 0.75rem;
}

.draw-tool-button-grid {
  @include draw-button-grid(2);
}

.draw-tool-button-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.draw-basemap-select {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.draw-style-hint {
  font-size: 0.88rem;
  color: rgba(11, 37, 64, 0.72);
}

.draw-layer-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.draw-layer-row {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.55);
}

.draw-layer-row[data-active='true'] {
  background: rgba(0, 122, 255, 0.12);
  border-color: rgba(0, 122, 255, 0.35);
}

.draw-layer-row-button {
  width: 100%;
  justify-content: flex-start;
  text-align: left;
}

.draw-layer-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.draw-layer-chip-action {
  min-width: auto;
  padding-inline: 0.8rem;
}

.draw-layer-editor-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.draw-field {
  @include draw-field-stack;
}

.draw-field-label {
  font-size: 0.9rem;
  color: #0b2540;
  font-weight: 600;
}

.draw-input,
.draw-range-input,
.draw-color-input {
  width: 100%;
}

.draw-input {
  min-height: 2.6rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.72);
  color: #0b2540;
  padding: 0.7rem 0.85rem;
}

.draw-color-input {
  height: 2.8rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.72);
  padding: 0.3rem;
}

.draw-toggle-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #0b2540;
  font-size: 0.92rem;
}

.draw-layer-empty {
  color: rgba(11, 37, 64, 0.65);
  font-size: 0.92rem;
}

.draw-import-input {
  display: none;
}

@media (max-width: 900px) {
  .draw-tab-header,
  .draw-tool-section-header {
    display: flex;
    flex-direction: column;
  }

  .draw-tool-button-grid,
  .draw-tool-button-grid--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
