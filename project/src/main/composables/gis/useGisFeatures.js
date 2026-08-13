import { showConfirm, showSuccess } from '@/utils/ui/message.js';
import { useI18n } from 'vue-i18n';

export function useGisFeatures(options = {}) {
  const { t } = useI18n();
  const {
    layers,
    activeLayerId,
    activeLayer,
    selectedFeatureId,
    selectedFeatureIds,
    editableMapRef,
    currentMode,
    getFeatureId,
    canModifyActiveLayer,
    canDuplicateSelectedFeature,
    canEditSelectedShape,
    canUseSelectedGeometryTools,
    canCloseSelectedLine,
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
    canApplySelectedFeatureBatchProperty,
    selectedFeatureBatchName,
    selectedFeatureBatchPropertyKey,
    selectedFeatureBatchPropertyValue,
    featureMoveLayerOptions,
    isAuthenticated,
    onAuthRequired,
  } = options;

  async function guardWrite() {
    if (isAuthenticated?.value) return true;
    if (onAuthRequired) return onAuthRequired();
    return true;
  }

  function emptyFeatureCollection() {
    return { type: 'FeatureCollection', features: [] };
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

  async function mutateSelectedGeometry(buildNext) {
    if (!await guardWrite()) return;
    if (!canModifyActiveLayer.value || !canEditSelectedShape.value || !canUseSelectedGeometryTools?.value) return;
    const layer = activeLayer.value;
    const fc = layer?.featureCollection ?? emptyFeatureCollection();
    const targetFeature = (fc.features ?? []).find((feature) => getFeatureId(feature) === selectedFeatureId.value);
    if (!layer || !targetFeature || !isFeatureEditableForMutation(targetFeature)) return;
    const nextResult = buildNext(targetFeature.geometry, layer, targetFeature);
    const nextGeometry = nextResult?.geometry ?? nextResult;
    if (!nextGeometry?.type || JSON.stringify(nextGeometry) === JSON.stringify(targetFeature.geometry)) return;

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
    });
  }

  async function handleCloseSelectedLine() {
    if (!canCloseSelectedLine?.value) return;
    await mutateSelectedGeometry((geometry) => {
      if (geometry?.type !== 'LineString' || !isValidLineCoordinates(geometry.coordinates ?? [])) return null;
      const coordinates = closeCoordinateRing(geometry.coordinates ?? []);
      return { ...geometry, coordinates };
    });
  }

  async function handleConvertSelectedLineToPolygon() {
    if (!canConvertSelectedLineToPolygon?.value) return;
    await mutateSelectedGeometry((geometry, layer) => {
      if (geometry?.type !== 'LineString') return null;
      const ring = closeCoordinateRing(geometry.coordinates ?? []);
      if (!isValidPolygonRings([ring])) return null;
      return {
        geometry: { type: 'Polygon', coordinates: [ring] },
        layerGeometryType: 'Polygon',
      };
    });
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
    if (selectedFeatureId.value) {
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
    handleCloseSelectedLine,
    handleConvertSelectedLineToPolygon,
    handleDeleteSelected,
    handleDeleteSelectedFeatures,
    handleClearAll,
    updateFeatureProperty,
    updateSelectedFeatureProperty,
    updateSelectedFeaturesProperty,
    handleUpdateFeatureTableCell,
    handleApplySelectedFeatureBatchName,
    handleApplySelectedFeatureBatchProperty,
    handleSetSelectedFeaturesVisible,
    handleSetSelectedFeaturesLocked,
    handleMoveSelectedFeatureToLayer,
    handleMoveSelectedFeaturesToLayer,
  };
}
