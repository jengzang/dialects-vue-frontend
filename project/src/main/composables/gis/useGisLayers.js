import { showConfirm, showError, showSuccess, showWarning } from '@/utils/ui/message.js';
import { readImportedLayerFile, splitFeatureCollectionByGeometryType } from '@/main/utils/drawMap/export.js';
import { prepareNationalBorderForVoronoiClip } from '@/main/utils/drawMap/voronoiClip.js';
import { api } from '@/api/auth/httpClient.js';
import { useI18n } from 'vue-i18n';

import nationalBorderGeoJsonUrl from '/data/gis/china_country.geojson?url';
import provincesGeoJsonUrl from '/data/gis/china_provinces.geojson?url';
import citiesGeoJsonUrl from '/data/gis/china_cities_simplified_balanced.geojson?url';
import countiesGeoJsonUrl from '/data/gis/china_counties_simplified_light.geojson?url';
import riversL1GeoJsonUrl from '/data/gis/china_rivers_l1.geojson?url';
import riversL2GeoJsonUrl from '/data/gis/china_rivers_l2.geojson?url';
import riversL3GeoJsonUrl from '/data/gis/china_rivers_l3.geojson?url';

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

function normalizeLayerOpacity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(1, Math.max(0, number));
}

export function useGisLayers(options = {}) {
  const { t } = useI18n();
  const {
    layers,
    activeLayerId,
    editableMapRef,
    currentMode,
    createEmptyLayer,
    getFeatureId,
    commitHistory,
    clearFeatureSelection,
    setFeatureSelection,
    syncAllLayersAfterMutation,
    resetDrawSelectionMode,
    applyLayerPropertyToFeatures,
    importInputRef,
    isAuthenticated,
    onAuthRequired,
  } = options;

  async function guardWrite() {
    if (isAuthenticated?.value) return true;
    if (onAuthRequired) return onAuthRequired();
    return true;
  }

  // ---- Layer CRUD ----

  async function handleCreateLayer(geometryType) {
    if (!await guardWrite()) return;
    commitHistory();
    const layer = createEmptyLayer(geometryType);
    layers.value.push(layer);
    activeLayerId.value = layer.id;
    clearFeatureSelection();
    const mode = geometryType === 'Point'
      ? 'draw_point'
      : geometryType === 'Polygon'
        ? 'draw_polygon'
        : 'draw_line_string';
    editableMapRef?.value?.setDrawMode?.(mode);
    currentMode.value = mode;
  }

  function handleSelectLayer(layerId) {
    activeLayerId.value = layerId;
    clearFeatureSelection();
    currentMode.value = 'simple_select';
    if (editableMapRef?.value?.selectFeatures) {
      editableMapRef.value.selectFeatures([]);
    } else {
      editableMapRef?.value?.setDrawMode?.('simple_select');
    }
  }

  async function moveLayer(layerId, direction) {
    if (!await guardWrite()) return;
    const idx = layers.value.findIndex((item) => item.id === layerId);
    if (idx === -1) return;
    const target = idx + direction;
    if (target < 0 || target >= layers.value.length) return;
    commitHistory();
    const [layer] = layers.value.splice(idx, 1);
    layers.value.splice(target, 0, layer);
    syncAllLayersAfterMutation();
  }

  async function moveLayerToTop(layerId) {
    if (!await guardWrite()) return;
    const idx = layers.value.findIndex((item) => item.id === layerId);
    if (idx === -1 || idx === layers.value.length - 1) return;
    commitHistory();
    const [layer] = layers.value.splice(idx, 1);
    layers.value.push(layer);
    syncAllLayersAfterMutation();
  }

  async function moveLayerToBottom(layerId) {
    if (!await guardWrite()) return;
    const idx = layers.value.findIndex((item) => item.id === layerId);
    if (idx === -1 || idx === 0) return;
    commitHistory();
    const [layer] = layers.value.splice(idx, 1);
    layers.value.unshift(layer);
    syncAllLayersAfterMutation();
  }

  async function toggleLayerVisibility(layerId) {
    if (!await guardWrite()) return;
    const layer = layers.value.find((item) => item.id === layerId);
    if (!layer) return;
    commitHistory();
    layer.visible = !layer.visible;
    applyLayerPropertyToFeatures(layer, 'visible', layer.visible);
    if (layerId === activeLayerId.value) {
      resetDrawSelectionMode();
    }
    syncAllLayersAfterMutation();
    editableMapRef?.value?.syncReadonlyLayers?.();
  }

  async function setAllLayersVisibility(visible) {
    if (!await guardWrite()) return;
    if (layers.value.every((layer) => layer.visible === visible)) return;
    commitHistory();
    layers.value.forEach((layer) => {
      layer.visible = visible;
      applyLayerPropertyToFeatures(layer, 'visible', visible);
    });
    if (!visible && activeLayerId.value) {
      resetDrawSelectionMode();
    }
    syncAllLayersAfterMutation();
    editableMapRef?.value?.syncReadonlyLayers?.();
  }

  async function toggleLayerLock(layerId) {
    if (!await guardWrite()) return;
    const layer = layers.value.find((item) => item.id === layerId);
    if (!layer) return;
    commitHistory();
    layer.locked = !layer.locked;
    applyLayerPropertyToFeatures(layer, 'locked', layer.locked);
    if (layerId === activeLayerId.value) {
      resetDrawSelectionMode();
    }
    syncAllLayersAfterMutation();
  }

  async function handleUpdateLayerOpacity(layerId, opacity) {
    if (!await guardWrite()) return;
    const layer = layers.value.find((item) => item.id === layerId);
    if (!layer) return;
    const nextOpacity = normalizeLayerOpacity(opacity);
    if (normalizeLayerOpacity(layer.opacity) === nextOpacity) return;
    commitHistory();
    layer.opacity = nextOpacity;
    applyLayerPropertyToFeatures(layer, 'opacity', nextOpacity);
    syncAllLayersAfterMutation();
    editableMapRef?.value?.syncReadonlyLayers?.();
  }

  async function handleRenameLayer(layerId, name) {
    if (!await guardWrite()) return;
    const target = layers.value.find((item) => item.id === layerId);
    const nextName = String(name || '').trim();
    if (!target || !nextName || target.name === nextName) return;
    commitHistory();
    const prev = target.name;
    target.name = nextName;
    const fc = target.featureCollection ?? emptyFeatureCollection();
    target.featureCollection = {
      ...fc,
      features: (fc.features ?? []).map((f) => {
        const props = f.properties ?? {};
        if (props.name && props.name !== prev) return f;
        return { ...f, properties: { ...props, name: nextName } };
      }),
    };
    syncAllLayersAfterMutation();
  }

  const cloneFeatureForDuplicateLayer = (feature, index, layerId) => {
    const dupId = `${layerId}-feature-${index + 1}`;
    return {
      ...feature,
      id: dupId,
      properties: { ...(feature?.properties ?? {}), id: dupId },
      geometry: feature?.geometry
        ? { ...feature.geometry, coordinates: structuredClone(feature.geometry.coordinates) }
        : feature?.geometry,
    };
  };

  async function handleDuplicateLayer(layerId) {
    if (!await guardWrite()) return;
    const src = layers.value.find((item) => item.id === layerId);
    if (!src) return;
    commitHistory();
    const dup = createEmptyLayer(src.geometryType);
    dup.name = `${src.name} ${t('map.drawTab.labels.copySuffix')}`;
    dup.stroke = src.stroke;
    dup.strokeWidth = src.strokeWidth;
    dup.fill = src.fill;
    dup.fillOpacity = src.fillOpacity;
    dup.opacity = src.opacity;
    dup.pointRadius = src.pointRadius;
    dup.pointColor = src.pointColor;
    dup.pointStrokeColor = src.pointStrokeColor;
    dup.visible = src.visible;
    dup.locked = src.locked;
    dup.featureCollection = {
      ...(src.featureCollection ?? emptyFeatureCollection()),
      features: (src.featureCollection?.features ?? [])
        .map((f, i) => cloneFeatureForDuplicateLayer(f, i, dup.id)),
    };
    const srcIdx = layers.value.findIndex((item) => item.id === layerId);
    layers.value.splice(srcIdx + 1, 0, dup);
    activeLayerId.value = dup.id;
    clearFeatureSelection();
    currentMode.value = 'simple_select';
    editableMapRef?.value?.setDrawMode?.('simple_select');
    syncAllLayersAfterMutation();
    editableMapRef?.value?.syncReadonlyLayers?.();
  }

  async function handleDeleteLayer(layerId) {
    if (!await guardWrite()) return;
    const idx = layers.value.findIndex((item) => item.id === layerId);
    if (idx === -1) return;
    const layer = layers.value[idx];
    const confirmed = await showConfirm(t('map.drawTab.messages.deleteLayerConfirm', { name: layer.name }));
    if (!confirmed) return;
    commitHistory();
    layers.value.splice(idx, 1);
    editableMapRef?.value?.removeReadonlyLayerById?.(layerId);
    if (activeLayerId.value === layerId) {
      const fallback = layers.value[idx] ?? layers.value[idx - 1] ?? null;
      activeLayerId.value = fallback?.id ?? '';
      clearFeatureSelection();
      currentMode.value = 'simple_select';
      editableMapRef?.value?.setDrawMode?.('simple_select');
    }
    syncAllLayersAfterMutation();
  }

  // ---- Import ----

  function triggerImportLayer() {
    importInputRef?.value?.click();
  }

  function buildImportDiagnosticsMessages(diag) {
    const msgs = [];
    if (diag?.duplicateFeatureIdCount > 0) {
      msgs.push(t('map.drawTab.messages.importDiagnosticsDuplicateIds', { count: diag.duplicateFeatureIdCount }));
    }
    if (diag?.emptyGeometryCount > 0) {
      msgs.push(t('map.drawTab.messages.importDiagnosticsEmptyGeometry', { count: diag.emptyGeometryCount }));
    }
    if (diag?.unsupportedGeometryCount > 0) {
      msgs.push(t('map.drawTab.messages.importDiagnosticsUnsupportedGeometry', { count: diag.unsupportedGeometryCount }));
    }
    if (diag?.invalidCoordinateFeatureCount > 0) {
      msgs.push(t('map.drawTab.messages.importDiagnosticsInvalidCoordinates', { count: diag.invalidCoordinateFeatureCount }));
    }
    return msgs;
  }

  function showImportDiagnostics(diag) {
    const msgs = buildImportDiagnosticsMessages(diag);
    if (!msgs.length) return;
    showWarning(t('map.drawTab.messages.importLayerDiagnostics', { summary: msgs.join('; ') }), 6000);
  }

  async function handleImportAsNewLayer(event) {
    if (!await guardWrite()) return;
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
      let diag = null;
      const fc = await readImportedLayerFile(file, { onDiagnostics: (d) => { diag = d; } });
      const groups = splitFeatureCollectionByGeometryType(fc);
      const importedLayers = groups.map((g) => {
        const layer = createEmptyLayer(g.geometryType);
        layer.featureCollection = g.featureCollection ?? emptyFeatureCollection();
        return layer;
      });
      commitHistory();
      layers.value.unshift(...importedLayers);
      activeLayerId.value = importedLayers[0].id;
      editableMapRef?.value?.importGeoJson?.(importedLayers[0].featureCollection, { emitChanges: false });
      currentMode.value = 'simple_select';
      showSuccess(t('map.drawTab.messages.importLayerSuccess', { count: importedLayers.length }));
      showImportDiagnostics(diag);
    } catch (error) {
      showError(t('map.drawTab.messages.importLayerFailed', { error: error.message || error }));
    } finally {
      if (event?.target) event.target.value = '';
    }
  }

  // ---- Export ----

  async function handleExportLayer() {
    if (!await guardWrite()) return;
    if (!activeLayerId.value) return;
    const layer = layers.value.find((l) => l.id === activeLayerId.value);
    if (!layer) return;
    try {
      await editableMapRef?.value?.exportLayer?.(layer.name);
      showSuccess(t('map.drawTab.messages.exportLayerSuccess'));
    } catch (error) {
      showError(t('map.drawTab.messages.exportLayerFailed', { error: error.message || error }));
    }
  }

  async function handleExportAllLayers() {
    if (!await guardWrite()) return;
    try {
      await editableMapRef?.value?.exportAllLayers?.(layers.value);
      showSuccess(t('map.drawTab.messages.exportLayerSuccess'));
    } catch (error) {
      showError(t('map.drawTab.messages.exportLayerFailed', { error: error.message || error }));
    }
  }

  // ---- Admin boundary import ----

  let provincesGeoJsonCache = null;
  let citiesGeoJsonCache = null;
  let countiesGeoJsonCache = null;
  let nationalBorderPreparedCache = null;

  async function loadProvincesGeoJson() {
    if (provincesGeoJsonCache) return provincesGeoJsonCache;
    const res = await fetch(provincesGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed to load provinces GeoJSON: ${res.status}`);
    provincesGeoJsonCache = await res.json();
    return provincesGeoJsonCache;
  }

  async function loadCitiesGeoJson() {
    if (citiesGeoJsonCache) return citiesGeoJsonCache;
    const res = await fetch(citiesGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed to load cities GeoJSON: ${res.status}`);
    citiesGeoJsonCache = await res.json();
    return citiesGeoJsonCache;
  }

  async function loadCountiesGeoJson() {
    if (countiesGeoJsonCache) return countiesGeoJsonCache;
    const res = await fetch(countiesGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed to load counties GeoJSON: ${res.status}`);
    countiesGeoJsonCache = await res.json();
    return countiesGeoJsonCache;
  }

  async function loadNationalBorderFeatureCollection() {
    if (nationalBorderPreparedCache) return nationalBorderPreparedCache;
    const res = await fetch(nationalBorderGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed to load national border GeoJSON: ${res.status}`);
    const fc = await res.json();
    nationalBorderPreparedCache = prepareNationalBorderForVoronoiClip(fc);
    return nationalBorderPreparedCache;
  }

  async function fetchHighPrecisionBoundaries(selectedIds) {
    const features = [];
    for (const id of selectedIds) {
      const data = await api(`/api/gis/boundary/by-id?feature_id=${id}`);
      if (data?.geometry) {
        features.push({ type: 'Feature', properties: data.feature || {}, geometry: data.geometry });
      }
    }
    if (!features.length) return null;
    return { type: 'FeatureCollection', features };
  }

  async function handleImportBoundaryConfirm(config) {
    if (!await guardWrite()) return;
    const { level, selectedNames, selectedIds, highPrecision } = config;
    let geoJson;
    if (highPrecision && level !== 'country') {
      geoJson = await fetchHighPrecisionBoundaries(selectedIds);
      if (!geoJson) { showError(t('map.drawTab.voronoi.clipBoundaryNoOptions')); return; }
    } else if (level === 'country') {
      const res = await fetch(nationalBorderGeoJsonUrl);
      if (!res.ok) { showError('Failed to load country GeoJSON'); return; }
      geoJson = await res.json();
    } else if (level === 'provinces') {
      geoJson = await loadProvincesGeoJson();
    } else if (level === 'cities') {
      geoJson = await loadCitiesGeoJson();
    } else {
      geoJson = await loadCountiesGeoJson();
    }

    const filtered = (geoJson.features ?? []).filter(
      (f) => level === 'country' || selectedNames.includes(f?.properties?.name)
    );
    if (!filtered.length) { showError(t('map.drawTab.voronoi.clipBoundaryNoOptions')); return; }

    const levelLabel = level === 'country'
      ? t('map.drawTab.voronoi.clipBoundaryLevelCountry')
      : level === 'provinces'
        ? t('map.drawTab.voronoi.clipBoundaryLevelProvinces')
        : level === 'cities'
          ? t('map.drawTab.voronoi.clipBoundaryLevelCities')
          : t('map.drawTab.voronoi.clipBoundaryLevelCounties');

    commitHistory();
    const layer = createEmptyLayer('Polygon');
    layer.name = `${t('map.drawTab.buttons.adminBoundary')}-${levelLabel}`;
    layer.featureCollection = { type: 'FeatureCollection', features: filtered };
    layer.fillOpacity = 0.12;
    layers.value.push(layer);
    activeLayerId.value = layer.id;
  }

  // ---- River import ----

  let riversL1Cache = null;
  let riversL2Cache = null;
  let riversL3Cache = null;

  const RIVER_LOADERS = {
    riverL1: async () => { if (riversL1Cache) return riversL1Cache; const r = await fetch(riversL1GeoJsonUrl); if (!r.ok) throw new Error('Failed L1'); riversL1Cache = await r.json(); return riversL1Cache; },
    riverL2: async () => { if (riversL2Cache) return riversL2Cache; const r = await fetch(riversL2GeoJsonUrl); if (!r.ok) throw new Error('Failed L2'); riversL2Cache = await r.json(); return riversL2Cache; },
    riverL3: async () => { if (riversL3Cache) return riversL3Cache; const r = await fetch(riversL3GeoJsonUrl); if (!r.ok) throw new Error('Failed L3'); riversL3Cache = await r.json(); return riversL3Cache; },
  };

  const RIVER_LABELS = {
    riverL1: () => t('map.drawTab.voronoi.clipBoundaryLevelRiverL1'),
    riverL2: () => t('map.drawTab.voronoi.clipBoundaryLevelRiverL2'),
    riverL3: () => t('map.drawTab.voronoi.clipBoundaryLevelRiverL3'),
  };

  async function handleRiverImportConfirm(selectedLevels, isImportingRef) {
    if (!await guardWrite()) return;
    if (isImportingRef?.value) return;
    if (isImportingRef) isImportingRef.value = true;
    try {
      for (const level of selectedLevels) {
        const loader = RIVER_LOADERS[level];
        if (!loader) continue;
        const geoJson = await loader();
        if (!geoJson?.features?.length) continue;
        commitHistory();
        const layer = createEmptyLayer('LineString');
        layer.name = RIVER_LABELS[level]();
        layer.featureCollection = geoJson;
        layer.stroke = '#3b82f6';
        layer.strokeWidth = level === 'riverL1' ? 1.5 : level === 'riverL2' ? 1 : 0.7;
        layer.fill = '';
        layer.fillOpacity = 0;
        layers.value.push(layer);
        activeLayerId.value = layer.id;
      }
    } catch (error) {
      showError(t('map.drawTab.messages.importLayerFailed', { error: error.message || error }));
    } finally {
      if (isImportingRef) isImportingRef.value = false;
    }
  }

  return {
    handleCreateLayer,
    handleSelectLayer,
    moveLayer,
    moveLayerToTop,
    moveLayerToBottom,
    toggleLayerVisibility,
    setAllLayersVisibility,
    toggleLayerLock,
    handleUpdateLayerOpacity,
    handleRenameLayer,
    handleDuplicateLayer,
    handleDeleteLayer,
    triggerImportLayer,
    handleImportAsNewLayer,
    handleExportLayer,
    handleExportAllLayers,
    loadProvincesGeoJson,
    loadCitiesGeoJson,
    loadCountiesGeoJson,
    loadNationalBorderFeatureCollection,
    handleImportBoundaryConfirm,
    fetchHighPrecisionBoundaries,
    handleRiverImportConfirm,
    get boundaryProvincesCache() { return provincesGeoJsonCache; },
    get boundaryCitiesCache() { return citiesGeoJsonCache; },
    get boundaryCountiesCache() { return countiesGeoJsonCache; },
  };
}
