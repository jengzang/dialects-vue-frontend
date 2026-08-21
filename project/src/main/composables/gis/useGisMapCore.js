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
  'opacity',
  'labelsVisible',
  'pointRadius',
  'pointColor',
  'pointStrokeColor',
  'textSize',
  'textColor',
  'textHaloColor',
  'textHaloWidth',
  'textRotate',
  'textAnchor',
  'visible',
  'locked',
  'user_stroke',
  'user_strokeWidth',
  'user_fill',
  'user_fillOpacity',
  'user_opacity',
  'user_labelsVisible',
  'user_visible',
  'user_pointRadius',
  'user_pointColor',
  'user_pointStrokeColor',
  'user_textSize',
  'user_textColor',
  'user_textHaloColor',
  'user_textHaloWidth',
  'user_textRotate',
  'user_textAnchor',
]);

const isTextAnnotationLayer = (layer) => layer?.geometryType === 'Text';

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

const isCoordinatePair = (coordinate) => {
  return Array.isArray(coordinate)
    && coordinate.length >= 2
    && Number.isFinite(Number(coordinate[0]))
    && Number.isFinite(Number(coordinate[1]));
};

const coordinatesEqual = (a, b) => {
  return isCoordinatePair(a)
    && isCoordinatePair(b)
    && Number(a[0]) === Number(b[0])
    && Number(a[1]) === Number(b[1]);
};

const getUniqueCoordinateCount = (coordinates = []) => {
  const seen = new Set();
  coordinates.forEach((coordinate, index) => {
    if (!isCoordinatePair(coordinate)) return;
    if (index === coordinates.length - 1 && coordinatesEqual(coordinate, coordinates[0])) return;
    seen.add(`${Number(coordinate[0])},${Number(coordinate[1])}`);
  });
  return seen.size;
};

const isClosedValidPolygonRing = (coordinates = []) => {
  return Array.isArray(coordinates)
    && coordinates.length >= 4
    && coordinates.every(isCoordinatePair)
    && coordinatesEqual(coordinates[0], coordinates[coordinates.length - 1])
    && getUniqueCoordinateCount(coordinates) >= 3;
};

const isValidLineCoordinates = (coordinates = []) => {
  return Array.isArray(coordinates)
    && coordinates.length >= 2
    && coordinates.every(isCoordinatePair)
    && getUniqueCoordinateCount(coordinates) >= 2;
};

const normalizeCoordinatePair = (coordinate) => [Number(coordinate[0]), Number(coordinate[1])];

const getCoordinateIssueKey = (coordinate) => {
  if (!isCoordinatePair(coordinate)) return '';
  const [lng, lat] = normalizeCoordinatePair(coordinate);
  return `${lng},${lat}`;
};

const getDuplicateCoordinateCount = (coordinates = []) => {
  const seen = new Set();
  const duplicates = new Set();
  coordinates.forEach((coordinate, index) => {
    if (!isCoordinatePair(coordinate)) return;
    if (index === coordinates.length - 1 && coordinatesEqual(coordinate, coordinates[0])) return;
    const key = getCoordinateIssueKey(coordinate);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  });
  return duplicates.size;
};

const getSignedRingArea = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 4) return 0;
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    if (!isCoordinatePair(current) || !isCoordinatePair(next)) continue;
    area += Number(current[0]) * Number(next[1]) - Number(next[0]) * Number(current[1]);
  }
  return area / 2;
};

const getOrientation = (a, b, c) => {
  const value = (
    (Number(b[1]) - Number(a[1])) * (Number(c[0]) - Number(b[0]))
    - (Number(b[0]) - Number(a[0])) * (Number(c[1]) - Number(b[1]))
  );
  if (Math.abs(value) <= 1e-10) return 0;
  return value > 0 ? 1 : 2;
};

const isCoordinateOnSegment = (a, b, c) => {
  return Number(b[0]) <= Math.max(Number(a[0]), Number(c[0]))
    && Number(b[0]) >= Math.min(Number(a[0]), Number(c[0]))
    && Number(b[1]) <= Math.max(Number(a[1]), Number(c[1]))
    && Number(b[1]) >= Math.min(Number(a[1]), Number(c[1]));
};

const segmentsIntersect = (a, b, c, d) => {
  if (!isCoordinatePair(a) || !isCoordinatePair(b) || !isCoordinatePair(c) || !isCoordinatePair(d)) return false;
  const o1 = getOrientation(a, b, c);
  const o2 = getOrientation(a, b, d);
  const o3 = getOrientation(c, d, a);
  const o4 = getOrientation(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && isCoordinateOnSegment(a, c, b))
    || (o2 === 0 && isCoordinateOnSegment(a, d, b))
    || (o3 === 0 && isCoordinateOnSegment(c, a, d))
    || (o4 === 0 && isCoordinateOnSegment(c, b, d));
};

const hasRingSelfIntersection = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 5) return false;
  for (let firstIndex = 0; firstIndex < ring.length - 1; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < ring.length - 1; secondIndex += 1) {
      const isAdjacent = Math.abs(firstIndex - secondIndex) <= 1;
      const sharesClosure = firstIndex === 0 && secondIndex === ring.length - 2;
      if (isAdjacent || sharesClosure) continue;
      if (segmentsIntersect(ring[firstIndex], ring[firstIndex + 1], ring[secondIndex], ring[secondIndex + 1])) {
        return true;
      }
    }
  }
  return false;
};

const pushGeometryQualityIssue = (issues, id, label, level = 'warning') => {
  if (issues.some((item) => item.id === id)) return;
  issues.push({ id, label, level });
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
      Text: t('map.drawTab.geometry.text'),
    };
    return {
      id: `draw-layer-${layerIdSeed}`,
      name: `${geometryLabels[geometryType] ?? t('map.drawTab.geometry.line')}${t('map.drawTab.labels.layer')} ${layerIdSeed}`,
      geometryType,
      stroke,
      strokeWidth: 3,
      fill: pointColor,
      fillOpacity: 0.22,
      opacity: 1,
      labelsVisible: geometryType === 'Text',
      pointRadius: geometryType === 'Text' ? 4 : 6,
      pointColor,
      pointStrokeColor: stroke,
      annotationText: geometryType === 'Text' ? t('map.drawTab.labels.textAnnotationDefaultText') : '',
      textSize: 16,
      textColor: stroke,
      textHaloColor: '#ffffff',
      textHaloWidth: 1,
      textRotate: 0,
      textAnchor: 'center',
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
  const selectedVertex = ref(null);
  const canDeleteSelectedVertices = ref(false);
  const isFeatureBoxSelectMode = ref(false);
  const isDrawingPanelOpen = ref(true);
  const isLayersPanelOpen = ref(false);
  const isMapFullscreen = ref(false);
  const selectedFeatureBatchName = ref('');
  const selectedFeatureBatchPropertyKey = ref('');
  const selectedFeatureBatchPropertyValue = ref('');
  const selectedPolygonSplitLineId = ref('');
  const polygonSplitSketchActive = ref(false);
  const geometryEditStatus = ref(null);
  const snappingEnabled = ref(true);
  const snapTolerance = ref(12);
  const snapGridSize = ref(0);
  const selectedBufferDistanceKm = ref(1);

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
    return properties.annotationText || properties.name || properties.title || properties.label || `${t('map.drawTab.labels.feature')} ${index + 1}`;
  };

  const getFeatureDisplayGeometryType = (feature) => {
    if (isTextAnnotationLayer(activeLayer.value) && feature?.geometry?.type === 'Point') return 'Text';
    return feature?.geometry?.type || activeLayer.value?.geometryType || '';
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
    selectedVertex.value = null;
    canDeleteSelectedVertices.value = false;
  };

  const clearFeatureSelection = () => {
    selectedFeatureId.value = '';
    selectedFeatureIds.value = [];
    selectedVertexCount.value = 0;
    selectedVertex.value = null;
    canDeleteSelectedVertices.value = false;
  };

  const activeLayerFeatureItems = computed(() => activeLayerFeatures.value.map((feature, index) => ({
    id: getFeatureId(feature),
    label: getFeatureLabel(feature, index),
    geometryType: getFeatureDisplayGeometryType(feature),
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
    geometryType: getFeatureDisplayGeometryType(feature),
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
  const selectedEditorGeometryType = computed(() => (
    selectedFeature.value ? getFeatureDisplayGeometryType(selectedFeature.value) : activeLayer.value?.geometryType || ''
  ));

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

  const canUseSelectedGeometryTools = computed(() => {
    return Boolean(
      canEditSelectedShape.value
      && canModifyActiveLayer.value
      && selectedFeatureIds.value.length === 1
      && selectedFeatureIds.value[0] === selectedFeatureId.value
    );
  });

  const canBufferSelectedFeature = computed(() => {
    const geometryType = selectedFeature.value?.geometry?.type;
    return Boolean(
      selectedFeatureId.value
      && activeLayer.value
      && activeLayer.value.geometryType !== 'Text'
      && selectedFeature.value
      && canModifyActiveLayer.value
      && selectedFeatureIds.value.length === 1
      && selectedFeatureIds.value[0] === selectedFeatureId.value
      && ['Point', 'LineString', 'Polygon'].includes(geometryType)
      && (geometryType === 'Polygon' || activeLayerFeatures.value.length === 1)
      && selectedFeature.value.properties?.visible !== false
      && selectedFeature.value.properties?.locked !== true
    );
  });

  const canConvertSelectedLineToPolygon = computed(() => {
    return Boolean(
      canUseSelectedGeometryTools.value
      && selectedFeature.value?.geometry?.type === 'LineString'
      && (activeLayerFeatures.value.length === 1)
      && isClosedValidPolygonRing(selectedFeature.value.geometry.coordinates ?? [])
    );
  });

  const canCloseSelectedLine = computed(() => {
    const coordinates = selectedFeature.value?.geometry?.coordinates ?? [];
    return Boolean(
      canUseSelectedGeometryTools.value
      && selectedFeature.value?.geometry?.type === 'LineString'
      && isValidLineCoordinates(coordinates)
      && !coordinatesEqual(coordinates[0], coordinates[coordinates.length - 1])
    );
  });

  const canSplitSelectedLine = computed(() => {
    const coordinates = selectedFeature.value?.geometry?.coordinates ?? [];
    const splitIndex = Number(selectedVertex.value?.coordPath);
    return Boolean(
      canUseSelectedGeometryTools.value
      && currentMode.value === 'direct_select'
      && selectedFeature.value?.geometry?.type === 'LineString'
      && selectedVertex.value?.featureId === selectedFeatureId.value
      && selectedVertexCount.value === 1
      && Number.isInteger(splitIndex)
      && splitIndex > 0
      && splitIndex < coordinates.length - 1
    );
  });

  const buildPolygonSplitLineValue = (layerId, featureId) => `${layerId}::${featureId}`;

  const polygonSplitLineOptions = computed(() => layers.value
    .filter((layer) => (
      layer.id !== activeLayerId.value
      && layer.geometryType === 'LineString'
      && layer.visible !== false
      && layer.locked !== true
    ))
    .flatMap((layer) => (layer.featureCollection?.features ?? [])
      .filter((feature) => (
        feature?.geometry?.type === 'LineString'
        && feature.properties?.visible !== false
        && feature.properties?.locked !== true
        && getFeatureId(feature)
      ))
      .map((feature, index) => ({
        label: `${layer.name} · ${getFeatureLabel(feature, index)}`,
        value: buildPolygonSplitLineValue(layer.id, getFeatureId(feature)),
      }))));

  const selectedPolygonSplitLineFeature = computed(() => {
    const [layerId, featureId] = String(selectedPolygonSplitLineId.value || '').split('::');
    if (!layerId || !featureId) return null;
    const layer = layers.value.find((item) => item.id === layerId);
    if (!layer || layer.visible === false || layer.locked === true || layer.geometryType !== 'LineString') return null;
    return (layer.featureCollection?.features ?? []).find((feature) => (
      getFeatureId(feature) === featureId
      && feature.geometry?.type === 'LineString'
      && feature.properties?.visible !== false
      && feature.properties?.locked !== true
    )) ?? null;
  });

  const canSplitSelectedPolygon = computed(() => Boolean(
    canUseSelectedGeometryTools.value
    && selectedFeature.value?.geometry?.type === 'Polygon'
    && selectedPolygonSplitLineFeature.value
  ));

  const canStartPolygonSplitSketch = computed(() => Boolean(
    canUseSelectedGeometryTools.value
    && selectedFeature.value?.geometry?.type === 'Polygon'
  ));

  const canMergeSelectedPolygons = computed(() => {
    if (!canModifyActiveLayer.value || selectedFeatureIds.value.length < 2) return false;
    const selectedIds = new Set(selectedFeatureIds.value);
    const selectedFeatures = activeLayerFeatures.value.filter((feature) => selectedIds.has(getFeatureId(feature)));
    return selectedFeatures.length >= 2
      && selectedFeatures.every((feature) => (
        feature.geometry?.type === 'Polygon'
        && feature.properties?.visible !== false
        && feature.properties?.locked !== true
      ));
  });

  const canIntersectSelectedPolygons = computed(() => canMergeSelectedPolygons.value);
  const canDifferenceSelectedPolygons = computed(() => canMergeSelectedPolygons.value);

  const geometryQualitySummary = computed(() => {
    const issues = [];
    activeLayerFeatures.value.forEach((feature) => {
      const geometry = feature?.geometry;
      if (!geometry?.type) {
        pushGeometryQualityIssue(issues, 'empty-geometry', t('map.drawTab.labels.geometryQualityEmptyGeometry'), 'error');
        return;
      }
      if (geometry.type === 'LineString') {
        const coordinates = geometry.coordinates ?? [];
        if (getDuplicateCoordinateCount(coordinates) > 0) {
          pushGeometryQualityIssue(issues, 'duplicate-coordinate', t('map.drawTab.labels.geometryQualityDuplicateCoordinate'), 'warning');
        }
        if (getUniqueCoordinateCount(coordinates) < 2) {
          pushGeometryQualityIssue(issues, 'zero-length-line', t('map.drawTab.labels.geometryQualityZeroLengthLine'), 'error');
        }
        return;
      }
      if (geometry.type === 'Polygon') {
        (geometry.coordinates ?? []).forEach((ring) => {
          if (getDuplicateCoordinateCount(ring) > 0) {
            pushGeometryQualityIssue(issues, 'duplicate-coordinate', t('map.drawTab.labels.geometryQualityDuplicateCoordinate'), 'warning');
          }
          if (!isClosedValidPolygonRing(ring)) {
            pushGeometryQualityIssue(issues, 'invalid-polygon-ring', t('map.drawTab.labels.geometryQualityInvalidPolygonRing'), 'error');
          }
          if (Math.abs(getSignedRingArea(ring)) <= 1e-10) {
            pushGeometryQualityIssue(issues, 'zero-area-polygon', t('map.drawTab.labels.geometryQualityZeroAreaPolygon'), 'error');
          }
          if (hasRingSelfIntersection(ring)) {
            pushGeometryQualityIssue(issues, 'self-intersection', t('map.drawTab.labels.geometryQualitySelfIntersection'), 'error');
          }
        });
      }
    });
    return {
      hasIssues: issues.length > 0,
      issueCount: issues.length,
      items: issues.slice(0, 5),
    };
  });

  const canDeleteSelection = computed(() => {
    return Boolean(
      selectedFeatureId.value
      && activeLayer.value
      && selectedFeature.value
      && canModifyActiveLayer.value
      && selectedFeature.value.properties?.visible !== false
      && selectedFeature.value.properties?.locked !== true
      && (currentMode.value !== 'direct_select' || canDeleteSelectedVertices.value)
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
    polygonSplitSketchActive.value = false;
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

  const normalizeFeatureIdsToActiveLayerOrder = (featureIds = []) => {
    const requestedSet = new Set(
      featureIds
        .map((id) => String(id || ''))
        .filter(Boolean)
    );
    return activeLayerSelectableFeatureIds.value.filter((id) => requestedSet.has(id));
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
    const mode = geometryType === 'Point' || geometryType === 'Text'
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
    if (mode !== 'draw_line_string') {
      polygonSplitSketchActive.value = false;
    }
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
    if (mode !== 'simple_select' && !canModifyActiveLayer.value) {
      resetDrawSelectionMode();
      return;
    }
    currentMode.value = mode || 'simple_select';
    if (currentMode.value !== 'draw_line_string') {
      polygonSplitSketchActive.value = false;
    }
    if (currentMode.value !== 'simple_select') {
      isFeatureBoxSelectMode.value = false;
    }
    if (currentMode.value !== 'direct_select') {
      selectedVertexCount.value = 0;
      canDeleteSelectedVertices.value = false;
    }
  };

  const handleShapeEditStateChange = (state = {}) => {
    const mode = state?.mode || currentMode.value || 'simple_select';
    const featureId = String(state?.featureId || '');
    if (mode !== 'direct_select' || !featureId || featureId !== selectedFeatureId.value || !activeLayerFeatureIdSet.value.has(featureId)) {
      selectedVertexCount.value = 0;
      selectedVertex.value = null;
      canDeleteSelectedVertices.value = false;
      return;
    }
    const nextCount = Number(state.selectedVertexCount);
    selectedVertexCount.value = Number.isFinite(nextCount) && nextCount > 0 ? nextCount : 0;
    const nextVertex = state?.selectedVertex;
    const nextCoordinate = [
      Number(nextVertex?.coordinate?.[0]),
      Number(nextVertex?.coordinate?.[1]),
    ];
    selectedVertex.value = selectedVertexCount.value === 1
      && nextVertex?.featureId === featureId
      && typeof nextVertex.coordPath === 'string'
      && Number.isFinite(nextCoordinate[0])
      && Number.isFinite(nextCoordinate[1])
      ? {
          featureId,
          coordPath: nextVertex.coordPath,
          coordinate: nextCoordinate,
        }
      : null;
    canDeleteSelectedVertices.value = selectedVertexCount.value > 0 && state.canDeleteSelectedVertices === true;
  };

  const normalizeFeatureSelectPayload = (featureSelection) => {
    const selectableSet = new Set(activeLayerSelectableFeatureIds.value);
    const sourceIds = (Array.isArray(featureSelection)
      ? featureSelection
      : featureSelection ? [featureSelection] : [])
      .map((id) => String(id || ''))
      .filter(Boolean);
    const filteredIds = normalizeFeatureIdsToActiveLayerOrder(sourceIds.filter((id) => selectableSet.has(id)));
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
    const filteredIds = normalizeFeatureIdsToActiveLayerOrder(featureIds
      .map((id) => String(id || ''))
      .filter((id) => selectableSet.has(id)));
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

  const resolveGeometryEditStatusMessage = (code) => {
    const messageKeys = {
      polygonSplitSketchStarted: 'map.drawTab.labels.polygonSplitSketchStarted',
      polygonSplitSketchCanceled: 'map.drawTab.labels.polygonSplitSketchCanceled',
      polygonSplitNoTarget: 'map.drawTab.labels.polygonSplitNoTarget',
      polygonSplitNoCutter: 'map.drawTab.labels.polygonSplitNoCutter',
      polygonSplitNoPieces: 'map.drawTab.labels.polygonSplitNoPieces',
      polygonSplitSuccess: 'map.drawTab.labels.polygonSplitSuccess',
      lineSplitSuccess: 'map.drawTab.labels.lineSplitSuccess',
      lineSplitInvalidVertex: 'map.drawTab.labels.lineSplitInvalidVertex',
      polygonMergeSuccess: 'map.drawTab.labels.polygonMergeSuccess',
      polygonMergeFailed: 'map.drawTab.labels.polygonMergeFailed',
      geometryReverseSuccess: 'map.drawTab.labels.geometryReverseSuccess',
      geometrySimplifySuccess: 'map.drawTab.labels.geometrySimplifySuccess',
      geometryBufferSuccess: 'map.drawTab.labels.geometryBufferSuccess',
      geometryBufferFailed: 'map.drawTab.labels.geometryBufferFailed',
      geometryIntersectSuccess: 'map.drawTab.labels.geometryIntersectSuccess',
      geometryIntersectFailed: 'map.drawTab.labels.geometryIntersectFailed',
      geometryDifferenceSuccess: 'map.drawTab.labels.geometryDifferenceSuccess',
      geometryDifferenceFailed: 'map.drawTab.labels.geometryDifferenceFailed',
      geometryEditNoChange: 'map.drawTab.labels.geometryEditNoChange',
      geometryEditUnavailable: 'map.drawTab.labels.geometryEditUnavailable',
      geometryEditFailed: 'map.drawTab.labels.geometryEditFailed',
      lineCloseSuccess: 'map.drawTab.labels.lineCloseSuccess',
      lineCloseUnavailable: 'map.drawTab.labels.lineCloseUnavailable',
      lineToPolygonSuccess: 'map.drawTab.labels.lineToPolygonSuccess',
      lineToPolygonUnavailable: 'map.drawTab.labels.lineToPolygonUnavailable',
      vertexMoveSuccess: 'map.drawTab.labels.vertexMoveSuccess',
      vertexMoveFailed: 'map.drawTab.labels.vertexMoveFailed',
    };
    const key = messageKeys[code];
    return key ? t(key) : '';
  };

  const handleGeometryEditFeedback = (payload = {}) => {
    const type = ['success', 'error', 'info'].includes(payload.type) ? payload.type : 'info';
    const code = String(payload.code || '');
    if (code === 'polygonSplitSketchStarted') {
      polygonSplitSketchActive.value = true;
    } else if (code) {
      polygonSplitSketchActive.value = false;
    }
    const message = resolveGeometryEditStatusMessage(code);
    geometryEditStatus.value = message ? { type, message, code } : null;
  };

  const handleSelectFeatureFromPanel = (featureId) => {
    if (!featureId) return;
    setFeatureSelection([featureId], featureId);
    syncFeatureSelectionToMap();
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
    selectedVertex,
    canDeleteSelectedVertices,
    isFeatureBoxSelectMode,
    isDrawingPanelOpen,
    isLayersPanelOpen,
    isMapFullscreen,
    selectedFeatureBatchName,
    selectedFeatureBatchPropertyKey,
    selectedFeatureBatchPropertyValue,
    selectedPolygonSplitLineId,
    polygonSplitSketchActive,
    geometryEditStatus,
    snappingEnabled,
    snapTolerance,
    snapGridSize,
    selectedBufferDistanceKm,
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
    canUseSelectedGeometryTools,
    canBufferSelectedFeature,
    canCloseSelectedLine,
    canSplitSelectedLine,
    polygonSplitLineOptions,
    selectedPolygonSplitLineFeature,
    canSplitSelectedPolygon,
    canStartPolygonSplitSketch,
    canMergeSelectedPolygons,
    canIntersectSelectedPolygons,
    canDifferenceSelectedPolygons,
    canConvertSelectedLineToPolygon,
    geometryQualitySummary,
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
    handleGeometryEditFeedback,
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
