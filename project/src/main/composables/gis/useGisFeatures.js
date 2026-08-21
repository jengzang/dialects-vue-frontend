import { showConfirm, showSuccess } from '@/utils/ui/message.js';
import { useI18n } from 'vue-i18n';
import { buffer, difference, featureCollection, intersect, union } from '@turf/turf';

export function useGisFeatures(options = {}) {
  const { t } = useI18n();
  const {
    layers,
    activeLayerId,
    activeLayer,
    selectedFeatureId,
    selectedFeatureIds,
    selectedVertex,
    editableMapRef,
    currentMode,
    getFeatureId,
    canModifyActiveLayer,
    canDuplicateSelectedFeature,
    canEditSelectedShape,
    canUseSelectedGeometryTools,
    canBufferSelectedFeature,
    canCloseSelectedLine,
    canSplitSelectedLine,
    canSplitSelectedPolygon,
    canStartPolygonSplitSketch,
    canMergeSelectedPolygons,
    canIntersectSelectedPolygons,
    canDifferenceSelectedPolygons,
    canConvertSelectedLineToPolygon,
    canDeleteSelection,
    canMoveSelectedFeatures,
    setFeatureSelection,
    clearFeatureSelection,
    syncAllLayersAfterMutation,
    syncFeatureSelectionToMap,
    resetDrawSelectionMode,
    commitHistory,
    activeLayerFeatureIdSet,
    activeLayerFeatureTableColumns,
    selectedEditorProperties,
    selectedEditorGeometryType,
    selectedPolygonSplitLineFeature,
    canApplySelectedFeatureBatchProperty,
    selectedFeatureBatchName,
    selectedFeatureBatchPropertyKey,
    selectedFeatureBatchPropertyValue,
    selectedTextLabelFieldKey,
    featureMoveLayerOptions,
    selectedBufferDistanceKm,
    canApplyTextLabelField,
    isAuthenticated,
    onAuthRequired,
    onGeometryEditFeedback,
  } = options;

  async function guardWrite() {
    if (isAuthenticated?.value) return true;
    if (onAuthRequired) return onAuthRequired();
    return true;
  }

  function reportGeometryEditFeedback(type, code) {
    if (!code || typeof onGeometryEditFeedback !== 'function') return;
    onGeometryEditFeedback({ type, code });
  }

  function emptyFeatureCollection() {
    return { type: 'FeatureCollection', features: [] };
  }

  function formatFeatureTableValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function isFeatureEditableForMutation(feature) {
    return Boolean(
      feature
      && feature.properties?.visible !== false
      && feature.properties?.locked !== true
    );
  }

  function canMutateFeatureProperty(feature, key, value) {
    if (key === 'visible' && value === true) return true;
    if (key === 'locked' && value === false) return true;
    return isFeatureEditableForMutation(feature);
  }

  const textLayerLayoutPropertyKeys = new Set(['textAllowOverlap', 'textLineHeight']);

  function getSelectedMutationFeatureIds(key, value) {
    if (!activeLayer.value || selectedFeatureIds.value.length === 0) return [];
    const selectedIds = new Set(selectedFeatureIds.value);
    return (activeLayer.value.featureCollection?.features ?? [])
      .filter((feature) => selectedIds.has(getFeatureId(feature)))
      .filter((feature) => canMutateFeatureProperty(feature, key, value))
      .map((feature) => getFeatureId(feature))
      .filter(Boolean);
  }

  function getEditableSelectedFeatureIds(features = [], featureIds = []) {
    const selectedIds = new Set(featureIds);
    return features
      .filter((feature) => selectedIds.has(getFeatureId(feature)))
      .filter(isFeatureEditableForMutation)
      .map((feature) => getFeatureId(feature))
      .filter(Boolean);
  }

  // ---- Shape editing ----

  async function handleEditSelectedShape() {
    if (!await guardWrite()) return;
    if (!canEditSelectedShape.value) return;
    editableMapRef?.value?.selectFeature?.(selectedFeatureId.value, { directEdit: true });
    currentMode.value = 'direct_select';
  }

  // ---- Duplicate ----

  function buildDuplicateFeatureId(layer, sourceId) {
    const existing = new Set((layer?.featureCollection?.features ?? []).map((f) => getFeatureId(f)).filter(Boolean));
    let idx = 1;
    let dupId = `${String(sourceId || 'feature')}-copy-${idx}`;
    while (existing.has(dupId)) { idx += 1; dupId = `${String(sourceId || 'feature')}-copy-${idx}`; }
    return dupId;
  }

  function cloneFeatureForDuplicate(feature, dupId, opts = {}) {
    return {
      ...feature,
      id: dupId,
      properties: { ...(feature?.properties ?? {}), id: dupId, name: opts.name ?? feature?.properties?.name },
      geometry: feature?.geometry
        ? { ...feature.geometry, coordinates: structuredClone(feature.geometry.coordinates) }
        : feature?.geometry,
    };
  }

  function isCoordinatePair(coordinate) {
    return Array.isArray(coordinate)
      && coordinate.length >= 2
      && Number.isFinite(Number(coordinate[0]))
      && Number.isFinite(Number(coordinate[1]));
  }

  function coordinatesEqual(a, b) {
    return isCoordinatePair(a)
      && isCoordinatePair(b)
      && Number(a[0]) === Number(b[0])
      && Number(a[1]) === Number(b[1]);
  }

  function isClosedCoordinatePath(coordinates = []) {
    return coordinates.length >= 2 && coordinatesEqual(coordinates[0], coordinates[coordinates.length - 1]);
  }

  function closeCoordinateRing(coordinates = []) {
    const next = cloneCoordinatePath(coordinates);
    if (!next.length) return [];
    if (!isClosedCoordinatePath(next)) next.push([...next[0]]);
    return next;
  }

  function getUniqueCoordinateCount(coordinates = []) {
    const seen = new Set();
    coordinates.forEach((coordinate, index) => {
      if (!isCoordinatePair(coordinate)) return;
      if (index === coordinates.length - 1 && coordinatesEqual(coordinate, coordinates[0])) return;
      seen.add(`${Number(coordinate[0])},${Number(coordinate[1])}`);
    });
    return seen.size;
  }

  function cloneCoordinatePath(coordinates = []) {
    return coordinates
      .filter(isCoordinatePair)
      .map((coordinate) => [Number(coordinate[0]), Number(coordinate[1])]);
  }

  function reversePathCoordinates(coordinates = []) {
    const cloned = cloneCoordinatePath(coordinates);
    if (!isClosedCoordinatePath(cloned)) return cloned.reverse();
    const first = cloned[0];
    const middle = cloned.slice(1, -1).reverse();
    return [[...first], ...middle, [...first]];
  }

  function isCollinearCoordinate(prev, current, next) {
    if (!isCoordinatePair(prev) || !isCoordinatePair(current) || !isCoordinatePair(next)) return false;
    const cross = (
      (Number(current[0]) - Number(prev[0])) * (Number(next[1]) - Number(prev[1]))
      - (Number(current[1]) - Number(prev[1])) * (Number(next[0]) - Number(prev[0]))
    );
    return Math.abs(cross) <= 1e-10;
  }

  function removeConsecutiveDuplicateCoordinates(coordinates = []) {
    return coordinates.reduce((items, coordinate) => {
      if (!isCoordinatePair(coordinate)) return items;
      if (items.length && coordinatesEqual(items[items.length - 1], coordinate)) return items;
      items.push([...coordinate]);
      return items;
    }, []);
  }

  function simplifyPathCoordinates(coordinates = []) {
    const wasClosed = isClosedCoordinatePath(coordinates);
    let path = wasClosed ? coordinates.slice(0, -1) : coordinates;
    path = removeConsecutiveDuplicateCoordinates(path);
    const minLength = wasClosed ? 3 : 2;
    let changed = true;
    while (changed && path.length > minLength) {
      changed = false;
      for (let index = 0; index < path.length; index += 1) {
        if (!wasClosed && (index === 0 || index === path.length - 1)) continue;
        const prev = path[(index - 1 + path.length) % path.length];
        const current = path[index];
        const next = path[(index + 1) % path.length];
        if (coordinatesEqual(prev, current) || coordinatesEqual(current, next) || isCollinearCoordinate(prev, current, next)) {
          path.splice(index, 1);
          changed = true;
          break;
        }
      }
    }
    return wasClosed ? closeCoordinateRing(path) : path;
  }

  function isValidLineCoordinates(coordinates = []) {
    return Array.isArray(coordinates)
      && coordinates.filter(isCoordinatePair).length >= 2
      && getUniqueCoordinateCount(coordinates) >= 2;
  }

  function isValidPolygonRings(rings = []) {
    return Array.isArray(rings)
      && rings.length > 0
      && rings.every((ring) => (
        Array.isArray(ring)
        && isClosedCoordinatePath(ring)
        && ring.filter(isCoordinatePair).length >= 4
        && getUniqueCoordinateCount(ring) >= 3
      ));
  }

  function isSupportedPolygonResultGeometry(geometry) {
    return ['Polygon', 'MultiPolygon'].includes(geometry?.type)
      && Array.isArray(geometry?.coordinates)
      && geometry.coordinates.length > 0;
  }

  function cloneMergedPolygonFeature(baseFeature, geometry) {
    const id = getFeatureId(baseFeature);
    return {
      ...baseFeature,
      id,
      properties: {
        ...(baseFeature?.properties ?? {}),
        id,
      },
      geometry: {
        ...geometry,
        coordinates: structuredClone(geometry.coordinates),
      },
    };
  }

  function unionPolygonFeatures(features = []) {
    const validFeatures = features.filter((feature) => (
      feature?.geometry?.type === 'Polygon'
      && isValidPolygonRings(feature.geometry.coordinates ?? [])
    ));
    if (validFeatures.length < 2) return null;

    try {
      const merged = union(featureCollection(validFeatures));
      if (!merged?.geometry || !['Polygon', 'MultiPolygon'].includes(merged.geometry.type)) return null;
      return merged.geometry;
    } catch {
      return null;
    }
  }

  function getSelectedEditablePolygonFeatures() {
    if (!activeLayer.value || selectedFeatureIds.value.length < 2) return [];
    const selectedIds = new Set(selectedFeatureIds.value);
    const polygonFeatures = (activeLayer.value.featureCollection?.features ?? [])
      .filter((feature) => selectedIds.has(getFeatureId(feature)))
      .filter(isFeatureEditableForMutation)
      .filter((feature) => feature?.geometry?.type === 'Polygon' && isValidPolygonRings(feature.geometry.coordinates ?? []));
    const preferredFeature = polygonFeatures.find((feature) => getFeatureId(feature) === selectedFeatureId.value);
    if (!preferredFeature) return polygonFeatures;
    return [
      preferredFeature,
      ...polygonFeatures.filter((feature) => getFeatureId(feature) !== selectedFeatureId.value),
    ];
  }

  function replaceSelectedBaseFeatureGeometry(baseFeature, nextGeometry) {
    const layer = activeLayer.value;
    const fc = layer?.featureCollection ?? emptyFeatureCollection();
    const baseId = getFeatureId(baseFeature);
    if (!layer || !baseId || !isSupportedPolygonResultGeometry(nextGeometry)) return false;
    if (JSON.stringify(nextGeometry) === JSON.stringify(baseFeature.geometry)) return 'no-change';

    commitHistory();
    layer.geometryType = 'Polygon';
    layer.featureCollection = {
      ...fc,
      features: (fc.features ?? []).map((feature) => {
        if (getFeatureId(feature) !== baseId) return feature;
        return cloneMergedPolygonFeature(baseFeature, nextGeometry);
      }),
    };
    setFeatureSelection([baseId], baseId);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    editableMapRef?.value?.selectFeature?.(baseId, { directEdit: false });
    return true;
  }

  function canReplaceFeatureWithPolygonResult(feature) {
    const geometryType = feature?.geometry?.type;
    if (geometryType === 'Polygon') return true;
    const featureCount = activeLayer.value?.featureCollection?.features?.length ?? 0;
    return ['Point', 'LineString'].includes(geometryType) && featureCount === 1;
  }

  async function mutateSelectedGeometry(buildNext, feedback = {}) {
    if (!await guardWrite()) return false;
    if (!canModifyActiveLayer.value || !canEditSelectedShape.value || !canUseSelectedGeometryTools?.value) {
      reportGeometryEditFeedback('error', feedback.unavailable ?? 'geometryEditUnavailable');
      return false;
    }
    const layer = activeLayer.value;
    const fc = layer?.featureCollection ?? emptyFeatureCollection();
    const targetFeature = (fc.features ?? []).find((feature) => getFeatureId(feature) === selectedFeatureId.value);
    if (!layer || !targetFeature || !isFeatureEditableForMutation(targetFeature)) {
      reportGeometryEditFeedback('error', feedback.unavailable ?? 'geometryEditUnavailable');
      return false;
    }
    const nextResult = buildNext(targetFeature.geometry, layer, targetFeature);
    const nextGeometry = nextResult?.geometry ?? nextResult;
    if (!nextGeometry?.type) {
      reportGeometryEditFeedback('error', feedback.failed ?? 'geometryEditFailed');
      return false;
    }
    if (JSON.stringify(nextGeometry) === JSON.stringify(targetFeature.geometry)) {
      reportGeometryEditFeedback('info', feedback.noChange ?? 'geometryEditNoChange');
      return false;
    }

    commitHistory();
    layer.featureCollection = {
      ...fc,
      features: (fc.features ?? []).map((feature) => {
        if (getFeatureId(feature) !== selectedFeatureId.value) return feature;
        return { ...feature, geometry: nextGeometry };
      }),
    };
    if (nextResult?.layerGeometryType) {
      layer.geometryType = nextResult.layerGeometryType;
    }
    setFeatureSelection(selectedFeatureIds.value.length ? selectedFeatureIds.value : [selectedFeatureId.value], selectedFeatureId.value);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    editableMapRef?.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
    reportGeometryEditFeedback('success', feedback.success);
    return true;
  }

  async function handleReverseSelectedGeometry() {
    await mutateSelectedGeometry((geometry) => {
      if (geometry?.type === 'LineString' && isValidLineCoordinates(geometry.coordinates)) {
        return { ...geometry, coordinates: reversePathCoordinates(geometry.coordinates) };
      }
      if (geometry?.type === 'Polygon' && isValidPolygonRings(geometry.coordinates)) {
        return {
          ...geometry,
          coordinates: geometry.coordinates.map((ring) => reversePathCoordinates(ring)),
        };
      }
      return null;
    }, {
      success: 'geometryReverseSuccess',
      failed: 'geometryEditFailed',
    });
  }

  async function handleSimplifySelectedGeometry() {
    await mutateSelectedGeometry((geometry) => {
      if (geometry?.type === 'LineString') {
        const coordinates = simplifyPathCoordinates(geometry.coordinates ?? []);
        return isValidLineCoordinates(coordinates) ? { ...geometry, coordinates } : null;
      }
      if (geometry?.type === 'Polygon') {
        const coordinates = (geometry.coordinates ?? []).map((ring) => simplifyPathCoordinates(ring));
        return isValidPolygonRings(coordinates) ? { ...geometry, coordinates } : null;
      }
      return null;
    }, {
      success: 'geometrySimplifySuccess',
      noChange: 'geometryEditNoChange',
      failed: 'geometryEditFailed',
    });
  }

  async function handleBufferSelectedFeature() {
    if (!await guardWrite()) return;
    if (!canBufferSelectedFeature?.value || !activeLayer.value) {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }
    const distanceKm = Number(selectedBufferDistanceKm?.value ?? 1);
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    const targetFeature = (fc.features ?? []).find((feature) => getFeatureId(feature) === selectedFeatureId.value);
    if (!targetFeature || !isFeatureEditableForMutation(targetFeature)) {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }
    if (!canReplaceFeatureWithPolygonResult(targetFeature)) {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }

    let bufferedFeature = null;
    try {
      bufferedFeature = buffer(targetFeature, distanceKm, { units: 'kilometers' });
    } catch {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }
    const nextGeometry = bufferedFeature?.geometry;
    if (!isSupportedPolygonResultGeometry(nextGeometry)) {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }
    const result = replaceSelectedBaseFeatureGeometry(targetFeature, nextGeometry);
    if (result === 'no-change') {
      reportGeometryEditFeedback('info', 'geometryEditNoChange');
      return;
    }
    if (!result) {
      reportGeometryEditFeedback('error', 'geometryBufferFailed');
      return;
    }
    reportGeometryEditFeedback('success', 'geometryBufferSuccess');
  }

  async function handleCloseSelectedLine() {
    if (!canCloseSelectedLine?.value) {
      reportGeometryEditFeedback('error', 'lineCloseUnavailable');
      return;
    }
    await mutateSelectedGeometry((geometry) => {
      if (geometry?.type !== 'LineString' || !isValidLineCoordinates(geometry.coordinates ?? [])) return null;
      const coordinates = closeCoordinateRing(geometry.coordinates ?? []);
      return { ...geometry, coordinates };
    }, {
      success: 'lineCloseSuccess',
      failed: 'lineCloseUnavailable',
    });
  }

  async function handleConvertSelectedLineToPolygon() {
    if (!canConvertSelectedLineToPolygon?.value) {
      reportGeometryEditFeedback('error', 'lineToPolygonUnavailable');
      return;
    }
    await mutateSelectedGeometry((geometry, layer) => {
      if (geometry?.type !== 'LineString') return null;
      const ring = closeCoordinateRing(geometry.coordinates ?? []);
      if (!isValidPolygonRings([ring])) return null;
      return {
        geometry: { type: 'Polygon', coordinates: [ring] },
        layerGeometryType: 'Polygon',
      };
    }, {
      success: 'lineToPolygonSuccess',
      failed: 'lineToPolygonUnavailable',
    });
  }

  async function handleMoveSelectedVertex(payload = {}) {
    if (!await guardWrite()) return;
    if (!canModifyActiveLayer.value || !canEditSelectedShape.value || !canUseSelectedGeometryTools?.value) return;
    const featureId = String(payload.featureId || selectedVertex?.value?.featureId || '');
    const coordPath = String(payload.coordPath || selectedVertex?.value?.coordPath || '');
    const coordinate = payload.coordinate ?? selectedVertex?.value?.coordinate;
    if (!featureId || featureId !== selectedFeatureId.value || !coordPath || !Array.isArray(coordinate)) {
      reportGeometryEditFeedback('error', 'vertexMoveFailed');
      return;
    }
    if (selectedVertex?.value?.featureId !== featureId || selectedVertex.value?.coordPath !== coordPath) {
      reportGeometryEditFeedback('error', 'vertexMoveFailed');
      return;
    }
    const nextCoordinate = [Number(coordinate[0]), Number(coordinate[1])];
    if (!Number.isFinite(nextCoordinate[0]) || !Number.isFinite(nextCoordinate[1])) {
      reportGeometryEditFeedback('error', 'vertexMoveFailed');
      return;
    }
    const currentCoordinate = selectedVertex.value?.coordinate ?? [];
    if (Number(currentCoordinate[0]) === nextCoordinate[0] && Number(currentCoordinate[1]) === nextCoordinate[1]) {
      reportGeometryEditFeedback('info', 'geometryEditNoChange');
      return;
    }
    if (typeof editableMapRef?.value?.moveVertex !== 'function') {
      reportGeometryEditFeedback('error', 'vertexMoveFailed');
      return;
    }

    commitHistory();
    const didMove = editableMapRef.value.moveVertex(featureId, coordPath, nextCoordinate, { commitHistory: false });
    if (didMove === false) {
      reportGeometryEditFeedback('error', 'vertexMoveFailed');
      return;
    }
    currentMode.value = 'direct_select';
    reportGeometryEditFeedback('success', 'vertexMoveSuccess');
  }

  async function handleSplitSelectedLine() {
    if (!await guardWrite()) return;
    if (!canSplitSelectedLine?.value || typeof editableMapRef?.value?.splitLineAtVertex !== 'function') {
      reportGeometryEditFeedback('error', 'lineSplitInvalidVertex');
      return;
    }
    const featureId = selectedVertex?.value?.featureId;
    const coordPath = selectedVertex?.value?.coordPath;
    if (!featureId || featureId !== selectedFeatureId.value || typeof coordPath !== 'string') {
      reportGeometryEditFeedback('error', 'lineSplitInvalidVertex');
      return;
    }
    if (typeof editableMapRef.value.canSplitLineAtVertex === 'function'
      && !editableMapRef.value.canSplitLineAtVertex(featureId, coordPath)) {
      reportGeometryEditFeedback('error', 'lineSplitInvalidVertex');
      return;
    }

    commitHistory();
    const didSplit = editableMapRef.value.splitLineAtVertex(featureId, coordPath, { commitHistory: false });
    if (didSplit === false) {
      reportGeometryEditFeedback('error', 'lineSplitInvalidVertex');
      return;
    }
    currentMode.value = 'simple_select';
    reportGeometryEditFeedback('success', 'lineSplitSuccess');
  }

  async function handleSplitSelectedPolygon() {
    if (!await guardWrite()) return;
    if (!canSplitSelectedPolygon?.value || typeof editableMapRef?.value?.splitPolygonWithLine !== 'function') {
      reportGeometryEditFeedback('error', 'polygonSplitNoCutter');
      return;
    }
    const cutterFeature = selectedPolygonSplitLineFeature?.value;
    if (!selectedFeatureId.value || !cutterFeature) {
      reportGeometryEditFeedback('error', 'polygonSplitNoCutter');
      return;
    }
    if (typeof editableMapRef.value.canSplitPolygonWithLine === 'function'
      && !editableMapRef.value.canSplitPolygonWithLine(selectedFeatureId.value, cutterFeature)) {
      reportGeometryEditFeedback('error', 'polygonSplitNoPieces');
      return;
    }

    commitHistory();
    const didSplit = editableMapRef.value.splitPolygonWithLine(selectedFeatureId.value, cutterFeature, { commitHistory: false });
    if (didSplit === false) {
      reportGeometryEditFeedback('error', 'polygonSplitNoPieces');
      return;
    }
    currentMode.value = 'simple_select';
    reportGeometryEditFeedback('success', 'polygonSplitSuccess');
  }

  async function handleMergeSelectedPolygons() {
    if (!await guardWrite()) return;
    if (!canMergeSelectedPolygons?.value || !canModifyActiveLayer.value || !activeLayer.value) {
      reportGeometryEditFeedback('error', 'polygonMergeFailed');
      return;
    }
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    const selectedIds = new Set(selectedFeatureIds.value);
    const selectedPolygons = (fc.features ?? [])
      .filter((feature) => selectedIds.has(getFeatureId(feature)))
      .filter(isFeatureEditableForMutation);
    if (selectedPolygons.length < 2) {
      reportGeometryEditFeedback('error', 'polygonMergeFailed');
      return;
    }

    const mergedGeometry = unionPolygonFeatures(selectedPolygons);
    if (!mergedGeometry) {
      reportGeometryEditFeedback('error', 'polygonMergeFailed');
      return;
    }

    const baseFeature = selectedPolygons[0];
    const mergedId = getFeatureId(baseFeature);
    const mergedFeature = cloneMergedPolygonFeature(baseFeature, mergedGeometry);
    let insertedMergedFeature = false;
    const nextFeatures = (fc.features ?? []).flatMap((feature) => {
      if (!selectedIds.has(getFeatureId(feature))) return [feature];
      if (insertedMergedFeature) return [];
      insertedMergedFeature = true;
      return [mergedFeature];
    });

    if (!insertedMergedFeature) {
      reportGeometryEditFeedback('error', 'polygonMergeFailed');
      return;
    }
    commitHistory();
    activeLayer.value.featureCollection = { ...fc, features: nextFeatures };
    setFeatureSelection([mergedId], mergedId);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    editableMapRef?.value?.selectFeature?.(mergedId, { directEdit: false });
    reportGeometryEditFeedback('success', 'polygonMergeSuccess');
  }

  async function handleIntersectSelectedPolygons() {
    if (!await guardWrite()) return;
    if (!canIntersectSelectedPolygons?.value || !canModifyActiveLayer.value || !activeLayer.value) {
      reportGeometryEditFeedback('error', 'geometryIntersectFailed');
      return;
    }
    const selectedPolygons = getSelectedEditablePolygonFeatures();
    if (selectedPolygons.length < 2) {
      reportGeometryEditFeedback('error', 'geometryIntersectFailed');
      return;
    }

    let intersection = null;
    try {
      intersection = intersect(featureCollection(selectedPolygons));
    } catch {
      reportGeometryEditFeedback('error', 'geometryIntersectFailed');
      return;
    }
    const result = replaceSelectedBaseFeatureGeometry(selectedPolygons[0], intersection?.geometry);
    if (result === 'no-change') {
      reportGeometryEditFeedback('info', 'geometryEditNoChange');
      return;
    }
    if (!result) {
      reportGeometryEditFeedback('error', 'geometryIntersectFailed');
      return;
    }
    reportGeometryEditFeedback('success', 'geometryIntersectSuccess');
  }

  async function handleDifferenceSelectedPolygons() {
    if (!await guardWrite()) return;
    if (!canDifferenceSelectedPolygons?.value || !canModifyActiveLayer.value || !activeLayer.value) {
      reportGeometryEditFeedback('error', 'geometryDifferenceFailed');
      return;
    }
    const selectedPolygons = getSelectedEditablePolygonFeatures();
    if (selectedPolygons.length < 2) {
      reportGeometryEditFeedback('error', 'geometryDifferenceFailed');
      return;
    }

    let diffedFeature = null;
    try {
      diffedFeature = difference(featureCollection(selectedPolygons));
    } catch {
      reportGeometryEditFeedback('error', 'geometryDifferenceFailed');
      return;
    }
    const result = replaceSelectedBaseFeatureGeometry(selectedPolygons[0], diffedFeature?.geometry);
    if (result === 'no-change') {
      reportGeometryEditFeedback('info', 'geometryEditNoChange');
      return;
    }
    if (!result) {
      reportGeometryEditFeedback('error', 'geometryDifferenceFailed');
      return;
    }
    reportGeometryEditFeedback('success', 'geometryDifferenceSuccess');
  }

  async function handleStartPolygonSplitSketch() {
    if (!await guardWrite()) return;
    if (!canStartPolygonSplitSketch?.value || typeof editableMapRef?.value?.startPolygonSplitSketch !== 'function') return;
    const didStart = editableMapRef.value.startPolygonSplitSketch(selectedFeatureId.value);
    if (didStart === false) return;
    currentMode.value = 'draw_line_string';
  }

  function handleCancelPolygonSplitSketch() {
    if (typeof editableMapRef?.value?.cancelPolygonSplitSketch !== 'function') return;
    const didCancel = editableMapRef.value.cancelPolygonSplitSketch();
    if (didCancel === false) return;
    currentMode.value = 'simple_select';
  }

  async function handleDuplicateSelectedFeature() {
    if (!await guardWrite()) return;
    if (!canDuplicateSelectedFeature.value) return;
    const layer = activeLayer.value;
    const selected = layer?.featureCollection?.features?.find((f) => getFeatureId(f) === selectedFeatureId.value);
    if (!selected) return;
    const dupId = buildDuplicateFeatureId(layer, selectedFeatureId.value);
    const dup = cloneFeatureForDuplicate(selected, dupId, {
      name: `${selectedEditorProperties.value?.name ?? t('map.drawTab.labels.feature')} ${t('map.drawTab.labels.copySuffix')}`,
    });
    const fc = layer.featureCollection ?? emptyFeatureCollection();
    commitHistory();
    layer.featureCollection = { ...fc, features: [...(fc.features ?? []), dup] };
    setFeatureSelection([dupId], dupId);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    editableMapRef?.value?.selectFeature?.(dupId, { directEdit: false });
  }

  // ---- Delete ----

  async function handleDeleteSelected() {
    if (!await guardWrite()) return;
    if (!canDeleteSelection.value) return;
    const wasDirectSelect = currentMode.value === 'direct_select';
    if (editableMapRef?.value?.canDeleteSelected?.() === false) return;
    commitHistory();
    const didDelete = editableMapRef?.value?.deleteSelected?.();
    if (didDelete === false) return;
    if (!wasDirectSelect) {
      currentMode.value = 'simple_select';
    }
  }

  async function handleDeleteSelectedFeatures() {
    if (!await guardWrite()) return;
    if (!canModifyActiveLayer.value || !activeLayer.value || selectedFeatureIds.value.length === 0) return;
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    const selectedIdsBeforeDelete = selectedFeatureIds.value;
    const idsToDelete = new Set((fc.features ?? [])
      .filter((feature) => selectedFeatureIds.value.includes(getFeatureId(feature)))
      .filter(isFeatureEditableForMutation)
      .map((feature) => getFeatureId(feature)));
    if (idsToDelete.size === 0) return;
    const next = (fc.features ?? []).filter((f) => !idsToDelete.has(getFeatureId(f)));
    if (next.length === (fc.features?.length ?? 0)) return;
    commitHistory();
    activeLayer.value.featureCollection = { ...fc, features: next };
    const remainingSelectedIds = selectedIdsBeforeDelete.filter((id) => !idsToDelete.has(id));
    setFeatureSelection(remainingSelectedIds, remainingSelectedIds[0]);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    if (editableMapRef?.value?.selectFeatures) {
      editableMapRef.value.selectFeatures([]);
    } else {
      editableMapRef?.value?.setDrawMode?.('simple_select');
    }
  }

  async function handleClearAll() {
    if (!await guardWrite()) return;
    if (!canModifyActiveLayer.value) return;
    const confirmed = await showConfirm(t('map.drawTab.messages.clearAllConfirm'));
    if (!confirmed) return;
    const count = activeLayer.value?.featureCollection?.features?.length ?? 0;
    if (count <= 0) return;
    commitHistory();
    editableMapRef?.value?.clearAll?.();
    clearFeatureSelection();
    currentMode.value = 'simple_select';
    showSuccess(t('map.drawTab.messages.clearAllSuccess'));
  }

  // ---- Feature properties ----

  async function updateFeatureProperty(featureId, key, value) {
    if (!await guardWrite()) return;
    if (!activeLayer.value || !featureId) return;
    const targetFeature = activeLayer.value.featureCollection?.features
      ?.find((feature) => getFeatureId(feature) === featureId);
    if (!canMutateFeatureProperty(targetFeature, key, value)) return;
    commitHistory();
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    activeLayer.value.featureCollection = {
      ...fc,
      features: (fc.features ?? []).map((f) => {
        if (getFeatureId(f) !== featureId) return f;
        return { ...f, properties: { ...(f.properties ?? {}), [key]: value } };
      }),
    };
    setFeatureSelection(
      selectedFeatureIds.value.includes(featureId) ? selectedFeatureIds.value : [featureId],
      featureId
    );
    editableMapRef?.value?.updateFeatureProperties?.(featureId, { [key]: value }, { commitHistory: false });
    setFeatureSelection(
      selectedFeatureIds.value.includes(featureId) ? selectedFeatureIds.value : [featureId],
      featureId
    );
    if (key === 'visible' && value === false) resetDrawSelectionMode();
    if (key === 'locked' && value === true) resetDrawSelectionMode();
  }

  async function updateSelectedFeatureProperty(key, value) {
    if (!await guardWrite()) return;
    if (selectedFeatureId.value && !textLayerLayoutPropertyKeys.has(key)) {
      updateFeatureProperty(selectedFeatureId.value, key, value);
      return;
    }
    // Fallback: update active layer style
    if (!activeLayer.value) return;
    commitHistory();
    activeLayer.value[key] = value;
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    activeLayer.value.featureCollection = {
      ...fc,
      features: (fc.features ?? []).map((f) => ({
        ...f,
        properties: { ...(f.properties ?? {}), [key]: value },
      })),
    };
    syncAllLayersAfterMutation();
    if ((key === 'visible' && value === false) || (key === 'locked' && value === true)) {
      resetDrawSelectionMode();
    }
  }

  function getDefaultedFeatureStateValue(feature, key) {
    const props = feature?.properties ?? {};
    if (key === 'visible') return props.visible ?? true;
    if (key === 'locked') return props.locked ?? false;
    return props[key];
  }

  async function updateSelectedFeaturesProperty(key, value) {
    if (!await guardWrite()) return;
    if (!canModifyActiveLayer.value || !activeLayer.value || selectedFeatureIds.value.length === 0) return;
    const selectedIdsBeforeMutation = selectedFeatureIds.value;
    const mutationFeatureIds = getSelectedMutationFeatureIds(key, value);
    if (mutationFeatureIds.length === 0) return;
    const idsSet = new Set(mutationFeatureIds);
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    let hasChanges = false;
    const next = (fc.features ?? []).map((f) => {
      if (!idsSet.has(getFeatureId(f))) return f;
      if (getDefaultedFeatureStateValue(f, key) === value) return f;
      hasChanges = true;
      return { ...f, properties: { ...(f.properties ?? {}), [key]: value } };
    });
    if (!hasChanges) return;
    commitHistory();
    activeLayer.value.featureCollection = { ...fc, features: next };
    syncAllLayersAfterMutation();
    if ((key === 'visible' && value === false) || (key === 'locked' && value === true)) {
      resetDrawSelectionMode();
      return;
    }
    setFeatureSelection(selectedIdsBeforeMutation, selectedFeatureId.value);
    currentMode.value = 'simple_select';
    editableMapRef?.value?.selectFeatures?.(getEditableSelectedFeatureIds(next, selectedIdsBeforeMutation));
  }

  function handleSetSelectedFeaturesVisible(visible) { updateSelectedFeaturesProperty('visible', visible); }
  function handleSetSelectedFeaturesLocked(locked) { updateSelectedFeaturesProperty('locked', locked); }

  // ---- Feature table ----

  function handleUpdateFeatureTableCell(featureId, key, value) {
    if (!canModifyActiveLayer.value) return;
    const nextKey = String(key || '');
    if (nextKey !== 'name' && !activeLayerFeatureTableColumns.value.some((c) => c.key === nextKey)) return;
    updateFeatureProperty(featureId, nextKey, value);
  }

  function handleApplySelectedFeatureBatchName() {
    const next = selectedFeatureBatchName.value.trim();
    if (!next) return;
    updateSelectedFeaturesProperty('name', next);
  }

  function handleApplySelectedFeatureBatchProperty() {
    const nextKey = String(selectedFeatureBatchPropertyKey.value || '');
    if (!canApplySelectedFeatureBatchProperty.value) return;
    updateSelectedFeaturesProperty(nextKey, selectedFeatureBatchPropertyValue.value);
  }

  async function handleApplyTextLabelField() {
    if (!await guardWrite()) return;
    if (!canApplyTextLabelField.value || !activeLayer.value) return;
    const nextKey = String(selectedTextLabelFieldKey.value || '');
    const selectedIds = new Set(selectedFeatureIds.value);
    const shouldLimitToSelection = selectedIds.size > 0;
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    let hasChanges = false;
    const nextFeatures = (fc.features ?? []).map((feature) => {
      const featureId = getFeatureId(feature);
      if (shouldLimitToSelection && !selectedIds.has(featureId)) return feature;
      if (!isFeatureEditableForMutation(feature)) return feature;
      const nextLabel = formatFeatureTableValue(feature?.properties?.[nextKey]);
      if ((feature?.properties?.annotationText ?? '') === nextLabel) return feature;
      hasChanges = true;
      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          annotationText: nextLabel,
        },
      };
    });
    if (!hasChanges) return;
    commitHistory();
    activeLayer.value.featureCollection = { ...fc, features: nextFeatures };
    syncAllLayersAfterMutation();
    setFeatureSelection(selectedFeatureIds.value, selectedFeatureId.value);
  }

  // ---- Move between layers ----

  async function handleMoveSelectedFeatureToLayer(targetLayerId) {
    if (!await guardWrite()) return;
    if (!canDuplicateSelectedFeature.value) return;
    const source = activeLayer.value;
    const target = layers.value.find((l) => l.id === targetLayerId);
    const feature = source?.featureCollection?.features?.find((f) => getFeatureId(f) === selectedFeatureId.value);
    if (!source || !target || !feature || source.id === target.id) return;
    if (target.geometryType !== source.geometryType || target.visible === false || target.locked === true) return;
    commitHistory();
    const srcFc = source.featureCollection ?? emptyFeatureCollection();
    const tgtFc = target.featureCollection ?? emptyFeatureCollection();
    source.featureCollection = { ...srcFc, features: (srcFc.features ?? []).filter((f) => getFeatureId(f) !== selectedFeatureId.value) };
    target.featureCollection = { ...tgtFc, features: [...(tgtFc.features ?? []), feature] };
    activeLayerId.value = target.id;
    setFeatureSelection([selectedFeatureId.value], selectedFeatureId.value);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    editableMapRef?.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
  }

  async function handleMoveSelectedFeaturesToLayer(targetLayerId) {
    if (!await guardWrite()) return;
    if (!canMoveSelectedFeatures.value) return;
    const source = activeLayer.value;
    const target = layers.value.find((l) => l.id === targetLayerId);
    if (!source || !target || source.id === target.id) return;
    if (target.geometryType !== source.geometryType || target.visible === false || target.locked === true) return;
    const srcFc = source.featureCollection ?? emptyFeatureCollection();
    const srcFeatures = srcFc.features ?? [];
    const selectedIds = new Set(selectedFeatureIds.value);
    const toMove = srcFeatures.filter((f) => selectedIds.has(getFeatureId(f)) && isFeatureEditableForMutation(f));
    if (!toMove.length) return;
    const idsSet = new Set(toMove.map((f) => getFeatureId(f)));
    commitHistory();
    source.featureCollection = { ...srcFc, features: srcFeatures.filter((f) => !idsSet.has(getFeatureId(f))) };
    const tgtFc = target.featureCollection ?? emptyFeatureCollection();
    target.featureCollection = { ...tgtFc, features: [...(tgtFc.features ?? []), ...toMove] };
    const movedIds = toMove.map((f) => getFeatureId(f)).filter(Boolean);
    activeLayerId.value = target.id;
    setFeatureSelection(movedIds, movedIds[0]);
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    if (selectedFeatureIds.value.length > 1) {
      editableMapRef?.value?.selectFeatures?.(selectedFeatureIds.value);
      return;
    }
    editableMapRef?.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
  }

  return {
    handleEditSelectedShape,
    handleDuplicateSelectedFeature,
    handleReverseSelectedGeometry,
    handleSimplifySelectedGeometry,
    handleBufferSelectedFeature,
    handleCloseSelectedLine,
    handleConvertSelectedLineToPolygon,
    handleMoveSelectedVertex,
    handleSplitSelectedLine,
    handleSplitSelectedPolygon,
    handleStartPolygonSplitSketch,
    handleCancelPolygonSplitSketch,
    handleMergeSelectedPolygons,
    handleIntersectSelectedPolygons,
    handleDifferenceSelectedPolygons,
    handleDeleteSelected,
    handleDeleteSelectedFeatures,
    handleClearAll,
    updateFeatureProperty,
    updateSelectedFeatureProperty,
    updateSelectedFeaturesProperty,
    handleUpdateFeatureTableCell,
    handleApplySelectedFeatureBatchName,
    handleApplySelectedFeatureBatchProperty,
    handleApplyTextLabelField,
    handleSetSelectedFeaturesVisible,
    handleSetSelectedFeaturesLocked,
    handleMoveSelectedFeatureToLayer,
    handleMoveSelectedFeaturesToLayer,
  };
}
