import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { pickDrawColor } from '@/main/config/colors/mapColors.js';
import { mapStyleConfig } from '@/utils/map/MapSource.js';

let layerIdSeed = 0;

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

const emptyFeatureCollection = () => ({
  type: 'FeatureCollection',
  features: [],
});

const getFeatureId = (feature) => String(feature?.id ?? feature?.properties?.id ?? '');

const isFeatureTableBusinessPropertyKey = (key) => {
  return Boolean(key && !featureTableHiddenPropertyKeys.has(key));
};

const formatFeatureTableValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export function useGisMapCore(options = {}) {
  const { t } = useI18n();
  const {
    editableMapRef,
    commitHistory: commitHistoryOption,
  } = options;

  const noopHistory = () => {};
  let commitHistory = commitHistoryOption || noopHistory;

  const setCommitHistory = (fn) => {
    commitHistory = fn || noopHistory;
  };

  const [defaultStroke, defaultPointColor] = pickDrawColor(0);

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
      stroke,
      strokeWidth: 3,
      fill: pointColor,
      fillOpacity: 0.22,
      pointRadius: 6,
      pointColor,
      pointStrokeColor: stroke,
      visible: true,
      locked: false,
      featureCollection: emptyFeatureCollection(),
    };
  };

  const syncLayerIdSeedFromLayers = (layersValue) => {
    const numericIds = layersValue
      .map((layer) => Number(String(layer?.id || '').replace('draw-layer-', '')))
      .filter((value) => Number.isFinite(value));
    layerIdSeed = numericIds.length ? Math.max(...numericIds) : layerIdSeed;
  };

  // ---- Reactive state ----
  const layers = ref([]);
  const activeLayerId = ref('');
  const currentMode = ref('simple_select');
  const currentStyleKey = ref('gaode');
  const selectedFeatureId = ref('');
  const selectedFeatureIds = ref([]);
  const selectedVertexCount = ref(0);
  const isFeatureBoxSelectMode = ref(false);
  const isDrawingPanelOpen = ref(true);
  const isLayersPanelOpen = ref(false);
  const isMapFullscreen = ref(false);
  const selectedFeatureBatchName = ref('');
  const selectedFeatureBatchPropertyKey = ref('');
  const selectedFeatureBatchPropertyValue = ref('');

  // ---- Computeds ----
  const mapStyleOptions = computed(() => {
    return Object.entries(mapStyleConfig).map(([key, name]) => ({
      label: name,
      value: key,
    }));
  });

  const activeLayer = computed(() => {
    return layers.value.find((layer) => layer.id === activeLayerId.value) ?? null;
  });

  const activeLayerFeatureCollection = computed({
    get() {
      return activeLayer.value?.featureCollection ?? emptyFeatureCollection();
    },
    set(nextValue) {
      if (!activeLayer.value) return;
      activeLayer.value.featureCollection = nextValue ?? emptyFeatureCollection();
    },
  });

  const featureCount = computed(() => {
    return layers.value.reduce(
      (count, layer) => count + (layer.featureCollection?.features?.length ?? 0),
      0
    );
  });

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
      .map((id) => String(id || ''))
      .filter((id) => {
        if (!id || seenFeatureIds.has(id) || !activeLayerFeatureIdSet.value.has(id)) {
          return false;
        }
        seenFeatureIds.add(id);
        return true;
      });
  };

  const setFeatureSelection = (featureIds = [], preferredFeatureId = '') => {
    const validIds = getValidSelectedFeatureIds(featureIds);
    const preferredId = String(preferredFeatureId || '');
    selectedFeatureIds.value = validIds;
    selectedFeatureId.value = validIds.includes(preferredId)
      ? preferredId
      : validIds[0] || '';
    selectedVertexCount.value = 0;
  };

  const clearFeatureSelection = () => {
    selectedFeatureId.value = '';
    selectedFeatureIds.value = [];
    selectedVertexCount.value = 0;
  };

  const activeLayerFeatureItems = computed(() => activeLayerFeatures.value.map((feature, index) => ({
    id: getFeatureId(feature),
    label: getFeatureLabel(feature, index),
    geometryType: feature?.geometry?.type || activeLayer.value?.geometryType || '',
    visible: feature?.properties?.visible ?? activeLayer.value?.visible ?? true,
    locked: feature?.properties?.locked ?? activeLayer.value?.locked ?? false,
  })).filter((item) => item.id));

  const activeLayerSelectableFeatureIds = computed(() => {
    if (!canModifyActiveLayer.value) return [];
    return activeLayerFeatureItems.value
      .filter((item) => item.visible !== false && item.locked !== true)
      .map((item) => item.id);
  });

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

  const summarizeFeatureTableProperties = (properties = {}) => {
    const summaryItems = Object.entries(properties)
      .filter(([key, value]) => isFeatureTableBusinessPropertyKey(key) && value !== '' && value !== null && value !== undefined)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${formatFeatureTableValue(value)}`);
    return summaryItems.length ? summaryItems.join(' · ') : t('map.drawTab.labels.featurePropertiesEmpty');
  };

  const activeLayerFeatureTableRows = computed(() => activeLayerFeatures.value.map((feature, index) => ({
    id: getFeatureId(feature),
    name: feature?.properties?.name ?? getFeatureLabel(feature, index),
    geometryType: feature?.geometry?.type || activeLayer.value?.geometryType || '',
    visible: feature?.properties?.visible ?? activeLayer.value?.visible ?? true,
    locked: feature?.properties?.locked ?? activeLayer.value?.locked ?? false,
    properties: buildFeatureTableProperties(feature?.properties ?? {}),
    propertySummary: summarizeFeatureTableProperties(feature?.properties ?? {}),
  })).filter((row) => row.id));

  const getLayerLabel = (layer) => {
    const count = layer.featureCollection?.features?.length ?? 0;
    return `${layer.name} · ${count}`;
  };

  const selectedLayerLabel = computed(() => {
    if (!activeLayer.value) return t('map.drawTab.labels.emptyLayer');
    return getLayerLabel(activeLayer.value);
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
    return Boolean(activeLayer.value.visible !== false && activeLayer.value.locked !== true);
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

  const canDeleteSelection = computed(() => {
    return Boolean(
      selectedFeatureId.value
      && activeLayer.value
      && selectedFeature.value
      && canModifyActiveLayer.value
      && selectedFeature.value.properties?.visible !== false
      && selectedFeature.value.properties?.locked !== true
      && (currentMode.value !== 'direct_select' || selectedVertexCount.value > 0)
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
      && selectedFeatureIds.value.some((id) => activeLayerFeatureIdSet.value.has(id))
    );
  });

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

  // ---- Map sync helpers ----
  const syncActiveLayerToMap = () => {
    if (!editableMapRef?.value || !activeLayer.value) return;
    editableMapRef.value.importGeoJson?.(
      activeLayer.value.featureCollection,
      { emitChanges: false, emitSelection: false }
    );
  };

  const syncAllLayersAfterMutation = () => {
    syncActiveLayerToMap();
  };

  const applyLayerPropertyToFeatures = (layer, key, value) => {
    const fc = layer?.featureCollection ?? emptyFeatureCollection();
    layer.featureCollection = {
      ...fc,
      features: (fc.features ?? []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          [key]: value,
        },
      })),
    };
  };

  // ---- Mode & selection ----
  const resetDrawSelectionMode = () => {
    isFeatureBoxSelectMode.value = false;
    clearFeatureSelection();
    currentMode.value = 'simple_select';
    if (editableMapRef?.value?.selectFeatures) {
      editableMapRef.value.selectFeatures([]);
    } else {
      editableMapRef.value?.setDrawMode?.('simple_select');
    }
  };

  const getSelectableFeatureSelectionIds = (featureIds = []) => {
    const selectableSet = new Set(activeLayerSelectableFeatureIds.value);
    return featureIds.filter((id) => selectableSet.has(id));
  };

  const syncFeatureSelectionToMap = () => {
    currentMode.value = 'simple_select';
    const mapFeatureIds = getSelectableFeatureSelectionIds(selectedFeatureIds.value);
    const hasOnlySelectableSelection = mapFeatureIds.length === selectedFeatureIds.value.length;
    if (mapFeatureIds.length > 1 || !hasOnlySelectableSelection) {
      editableMapRef.value?.selectFeatures?.(mapFeatureIds);
      return;
    }
    if (mapFeatureIds[0]) {
      editableMapRef.value?.selectFeature?.(mapFeatureIds[0], { directEdit: false });
      return;
    }
    if (editableMapRef.value?.selectFeatures) {
      editableMapRef.value.selectFeatures([]);
    } else {
      editableMapRef.value?.setDrawMode?.('simple_select');
    }
  };

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
    const full = editableMapRef;
    isFeatureBoxSelectMode.value = false;
    full.value?.setDrawMode?.(mode);
    currentMode.value = mode;
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
    editableMapRef?.value?.setDrawMode?.(mode);
    currentMode.value = mode;
  };

  const handleDrawModeChange = (mode) => {
    currentMode.value = mode || 'simple_select';
    if (currentMode.value !== 'simple_select') {
      isFeatureBoxSelectMode.value = false;
    }
    if (currentMode.value !== 'direct_select') {
      selectedVertexCount.value = 0;
    }
  };

  const handleShapeEditStateChange = (state = {}) => {
    const mode = state?.mode || currentMode.value || 'simple_select';
    const featureId = String(state?.featureId || '');
    if (mode !== 'direct_select' || !featureId || featureId !== selectedFeatureId.value || !activeLayerFeatureIdSet.value.has(featureId)) {
      selectedVertexCount.value = 0;
      return;
    }
    const nextCount = Number(state.selectedVertexCount);
    selectedVertexCount.value = Number.isFinite(nextCount) && nextCount > 0 ? nextCount : 0;
  };

  const normalizeFeatureSelectPayload = (featureSelection) => {
    const selectableSet = new Set(activeLayerSelectableFeatureIds.value);
    const sourceIds = (Array.isArray(featureSelection)
      ? featureSelection
      : featureSelection ? [featureSelection] : [])
      .map((id) => String(id || ''))
      .filter(Boolean);
    const filteredIds = sourceIds.filter((id) => selectableSet.has(id));
    const shouldSync = sourceIds.length !== filteredIds.length
      || sourceIds.some((id, i) => id !== filteredIds[i]);
    return {
      featureIds: filteredIds,
      preferredFeatureId: filteredIds[0] || '',
      shouldSyncMapSelection: shouldSync,
    };
  };

  const handleFeatureSelect = (featureSelection) => {
    const { featureIds, preferredFeatureId, shouldSyncMapSelection } = normalizeFeatureSelectPayload(featureSelection);
    setFeatureSelection(featureIds, preferredFeatureId);
    if (shouldSyncMapSelection) {
      syncFeatureSelectionToMap();
    }
  };

  const handleFeatureBoxSelect = (payload = []) => {
    const isPayloadObject = Boolean(payload && typeof payload === 'object' && !Array.isArray(payload));
    const featureIds = Array.isArray(payload)
      ? payload
      : (isPayloadObject && Array.isArray(payload.featureIds) ? payload.featureIds : []);
    const selectionMode = isPayloadObject && (payload.selectionMode === 'add' || payload.selectionMode === 'subtract')
      ? payload.selectionMode
      : 'replace';
    const selectableSet = new Set(activeLayerSelectableFeatureIds.value);
    const filteredIds = featureIds
      .map((id) => String(id || ''))
      .filter((id) => selectableSet.has(id));
    const filteredSet = new Set(filteredIds);
    const currentIds = selectedFeatureIds.value
      .filter((id) => selectableSet.has(id));
    const nextIds = selectionMode === 'add'
      ? [...currentIds, ...filteredIds]
      : selectionMode === 'subtract'
        ? currentIds.filter((id) => !filteredSet.has(id))
        : filteredIds;
    setFeatureSelection(nextIds, nextIds[0]);
    syncFeatureSelectionToMap();
    isFeatureBoxSelectMode.value = false;
  };

  const handleToggleFeatureBoxSelect = () => {
    if (!canUseFeatureBoxSelect.value) {
      isFeatureBoxSelectMode.value = false;
      return;
    }
    isFeatureBoxSelectMode.value = !isFeatureBoxSelectMode.value;
    if (!isFeatureBoxSelectMode.value) return;
    currentMode.value = 'simple_select';
    editableMapRef?.value?.setDrawMode?.('simple_select');
  };

  const handleSelectFeatureFromPanel = (featureId) => {
    if (!featureId) return;
    setFeatureSelection([featureId], featureId);
    editableMapRef?.value?.selectFeature?.(featureId, { directEdit: false });
    currentMode.value = 'simple_select';
  };

  const getPreferredFeatureSelectionId = (featureIds = [], requestedFeatureId = '') => {
    const selectableSet = new Set(activeLayerSelectableFeatureIds.value);
    const checkedSet = new Set(featureIds);
    const requestedId = String(requestedFeatureId || '');
    if (requestedId && checkedSet.has(requestedId) && selectableSet.has(requestedId)) return requestedId;
    if (selectedFeatureId.value && featureIds.includes(selectedFeatureId.value) && selectableSet.has(selectedFeatureId.value)) {
      return selectedFeatureId.value;
    }
    return featureIds.find((id) => selectableSet.has(id)) || requestedId || featureIds[0] || '';
  };

  const handleToggleFeatureSelection = (featureId) => {
    const normalizedId = String(featureId || '');
    if (!normalizedId || !activeLayerFeatureIdSet.value.has(normalizedId)) return;

    const nextSet = new Set(selectedFeatureIds.value);
    if (nextSet.has(normalizedId)) {
      nextSet.delete(normalizedId);
    } else {
      nextSet.add(normalizedId);
    }

    const nextIds = [...nextSet];
    setFeatureSelection(nextIds, getPreferredFeatureSelectionId(nextIds, normalizedId));
    currentMode.value = 'simple_select';
    const mapFeatureIds = getSelectableFeatureSelectionIds(selectedFeatureIds.value);
    if (selectedFeatureIds.value.length > 1 || mapFeatureIds.length !== selectedFeatureIds.value.length) {
      editableMapRef?.value?.selectFeatures?.(mapFeatureIds);
      return;
    }
    if (mapFeatureIds[0]) {
      editableMapRef?.value?.selectFeature?.(mapFeatureIds[0], { directEdit: false });
      return;
    }
    if (editableMapRef?.value?.selectFeatures) {
      editableMapRef.value.selectFeatures([]);
    } else {
      editableMapRef?.value?.setDrawMode?.('simple_select');
    }
  };

  const handleSelectAllFeatures = () => {
    const ids = activeLayerSelectableFeatureIds.value;
    setFeatureSelection(ids, ids[0]);
    syncFeatureSelectionToMap();
  };

  const handleInvertFeatureSelection = () => {
    const selectableIds = activeLayerSelectableFeatureIds.value;
    const selectedSet = new Set(selectedFeatureIds.value);
    const nextIds = selectableIds.filter((id) => !selectedSet.has(id));
    setFeatureSelection(nextIds, nextIds[0]);
    syncFeatureSelectionToMap();
  };

  const handleResetView = () => {
    editableMapRef?.value?.resetView?.();
  };

  const handleToggleFullscreen = async () => {
    try {
      await editableMapRef?.value?.toggleFullscreen?.();
      isMapFullscreen.value = Boolean(editableMapRef?.value?.isFullscreen?.value);
    } catch (error) {
      const { showError } = await import('@/utils/ui/message.js');
      showError(error.message || String(error));
    }
  };

  const syncMapFullscreenState = () => {
    isMapFullscreen.value = Boolean(editableMapRef?.value?.isFullscreen?.value);
  };

  return {
    // Refs
    layers,
    activeLayerId,
    currentMode,
    currentStyleKey,
    selectedFeatureId,
    selectedFeatureIds,
    selectedVertexCount,
    isFeatureBoxSelectMode,
    isDrawingPanelOpen,
    isLayersPanelOpen,
    isMapFullscreen,
    selectedFeatureBatchName,
    selectedFeatureBatchPropertyKey,
    selectedFeatureBatchPropertyValue,
    // Computeds
    mapStyleOptions,
    activeLayer,
    activeLayerFeatureCollection,
    featureCount,
    activeLayerFeatures,
    selectedFeature,
    activeLayerFeatureIdSet,
    activeLayerFeatureItems,
    activeLayerSelectableFeatureIds,
    activeLayerFeatureTableColumns,
    activeLayerFeatureTableRows,
    canApplySelectedFeatureBatchProperty,
    featureMoveLayerOptions,
    selectedEditorProperties,
    selectedEditorFeatureId,
    selectedEditorGeometryType,
    canModifyActiveLayer,
    canEditSelectedShape,
    canDeleteSelection,
    canDuplicateSelectedFeature,
    canUseFeatureBoxSelect,
    canMoveSelectedFeatures,
    selectedLayerLabel,
    // Helpers
    emptyFeatureCollection,
    createEmptyLayer,
    getFeatureId,
    getFeatureLabel,
    getLayerLabel,
    syncLayerIdSeedFromLayers,
    applyLayerPropertyToFeatures,
    // Functions
    setMode,
    handleCreateLayer,
    handleDrawModeChange,
    handleShapeEditStateChange,
    handleFeatureSelect,
    handleFeatureBoxSelect,
    handleToggleFeatureBoxSelect,
    handleSelectFeatureFromPanel,
    handleToggleFeatureSelection,
    handleSelectAllFeatures,
    handleInvertFeatureSelection,
    setFeatureSelection,
    clearFeatureSelection,
    resetDrawSelectionMode,
    syncFeatureSelectionToMap,
    syncActiveLayerToMap,
    syncAllLayersAfterMutation,
    handleResetView,
    handleToggleFullscreen,
    syncMapFullscreenState,
    setCommitHistory,
  };
}
