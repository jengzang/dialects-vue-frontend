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
  } = options;

  function emptyFeatureCollection() {
    return { type: 'FeatureCollection', features: [] };
  }

  // ---- Shape editing ----

  function handleEditSelectedShape() {
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

  function handleDuplicateSelectedFeature() {
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
    if (!selectedFeatureId.value || !canModifyActiveLayer.value) return;
    commitHistory();
    editableMapRef?.value?.deleteSelected?.();
    currentMode.value = 'simple_select';
  }

  function handleDeleteSelectedFeatures() {
    if (!canModifyActiveLayer.value || !activeLayer.value || selectedFeatureIds.value.length === 0) return;
    const idsToDelete = new Set(selectedFeatureIds.value);
    const fc = activeLayer.value.featureCollection ?? emptyFeatureCollection();
    const next = (fc.features ?? []).filter((f) => !idsToDelete.has(getFeatureId(f)));
    if (next.length === (fc.features?.length ?? 0)) return;
    commitHistory();
    activeLayer.value.featureCollection = { ...fc, features: next };
    clearFeatureSelection();
    currentMode.value = 'simple_select';
    syncAllLayersAfterMutation();
    editableMapRef?.value?.setDrawMode?.('simple_select');
  }

  async function handleClearAll() {
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

  function updateFeatureProperty(featureId, key, value) {
    if (!activeLayer.value || !featureId) return;
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

  function updateSelectedFeatureProperty(key, value) {
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
  }

  function getDefaultedFeatureStateValue(feature, key) {
    const props = feature?.properties ?? {};
    if (key === 'visible') return props.visible ?? true;
    if (key === 'locked') return props.locked ?? false;
    return props[key];
  }

  function updateSelectedFeaturesProperty(key, value) {
    if (!canModifyActiveLayer.value || !activeLayer.value || selectedFeatureIds.value.length === 0) return;
    const idsSet = new Set(selectedFeatureIds.value);
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
    setFeatureSelection(selectedFeatureIds.value, selectedFeatureId.value);
    currentMode.value = 'simple_select';
    if (selectedFeatureIds.value.length > 1) {
      editableMapRef?.value?.selectFeatures?.(selectedFeatureIds.value);
      return;
    }
    editableMapRef?.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
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

  function handleMoveSelectedFeatureToLayer(targetLayerId) {
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

  function handleMoveSelectedFeaturesToLayer(targetLayerId) {
    if (!canMoveSelectedFeatures.value) return;
    const source = activeLayer.value;
    const target = layers.value.find((l) => l.id === targetLayerId);
    if (!source || !target || source.id === target.id) return;
    if (target.geometryType !== source.geometryType || target.visible === false || target.locked === true) return;
    const idsSet = new Set(selectedFeatureIds.value);
    const srcFc = source.featureCollection ?? emptyFeatureCollection();
    const srcFeatures = srcFc.features ?? [];
    const toMove = srcFeatures.filter((f) => idsSet.has(getFeatureId(f)));
    if (!toMove.length) return;
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
