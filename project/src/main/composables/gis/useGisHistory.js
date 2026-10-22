import { computed, nextTick, ref } from 'vue';
import { createMapDrawHistory } from '@/main/utils/drawMap/history.js';

export function useGisHistory(options = {}) {
  const {
    layers,
    activeLayerId,
    currentMode,
    currentStyleKey,
    selectedFeatureId,
    selectedFeatureIds,
    editableMapRef,
    setFeatureSelection,
    syncLayerIdSeedFromLayers,
    syncAllLayersAfterMutation,
  } = options;

  const drawHistory = createMapDrawHistory({ limit: 50 });
  const historySizes = ref(drawHistory.sizes());
  const isApplyingHistory = ref(false);
  let restoreRequest = 0;
  let pendingEditContext = null;

  const canUndoHistory = computed(() => historySizes.value.undo > 0);
  const canRedoHistory = computed(() => historySizes.value.redo > 0);

  const refreshHistoryState = () => {
    historySizes.value = drawHistory.sizes();
  };

  const buildHistorySnapshot = () => ({
    layers: layers.value,
    activeLayerId: activeLayerId.value,
    currentStyleKey: currentStyleKey.value,
    selectedFeatureId: selectedFeatureId.value,
    selectedFeatureIds: selectedFeatureIds.value,
    currentMode: currentMode.value === 'direct_select' ? 'direct_select' : 'simple_select',
    editContext: pendingEditContext ?? editableMapRef?.value?.getEditContext?.() ?? null,
  });

  const applyHistorySnapshot = async (snapshot) => {
    if (!snapshot) return;
    const request = ++restoreRequest;
    pendingEditContext = snapshot.editContext ?? null;
    isApplyingHistory.value = true;
    try {
      layers.value = Array.isArray(snapshot.layers) ? snapshot.layers : [];
      activeLayerId.value = snapshot.activeLayerId || layers.value[0]?.id || '';
      currentStyleKey.value = snapshot.currentStyleKey || 'gaode';
      const restoredSelectedFeatureId = snapshot.selectedFeatureId || '';
      const restoredSelectedFeatureIds = Array.isArray(snapshot.selectedFeatureIds)
        ? snapshot.selectedFeatureIds
        : (restoredSelectedFeatureId ? [restoredSelectedFeatureId] : []);
      const restoredMode = snapshot.currentMode === 'direct_select' ? 'direct_select' : 'simple_select';
      const restoredLayerId = activeLayerId.value;
      currentMode.value = restoredMode;
      syncLayerIdSeedFromLayers(layers.value);
      syncAllLayersAfterMutation();
      await nextTick();
      if (request !== restoreRequest || activeLayerId.value !== restoredLayerId) return;
      setFeatureSelection(restoredSelectedFeatureIds, restoredSelectedFeatureId);
      if (snapshot.editContext && editableMapRef?.value?.restoreEditContext?.(snapshot.editContext)) {
        // The map validates restored paths against the synchronized geometry and permissions.
      } else if (restoredMode === 'direct_select') {
        const sid = selectedFeatureId.value;
        if (sid) {
          editableMapRef?.value?.selectFeature?.(sid);
        } else {
          currentMode.value = 'simple_select';
          editableMapRef?.value?.setDrawMode?.('simple_select');
        }
      } else if (restoredMode === 'simple_select' && selectedFeatureIds.value.length > 1) {
        editableMapRef?.value?.selectFeatures?.(selectedFeatureIds.value);
      } else if (restoredMode === 'simple_select' && selectedFeatureId.value) {
        editableMapRef?.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });
      } else {
        editableMapRef?.value?.setDrawMode?.(restoredMode);
      }
      editableMapRef?.value?.syncReadonlyLayers?.();
    } finally {
      if (request === restoreRequest) {
        pendingEditContext = null;
        isApplyingHistory.value = false;
      }
    }
  };

  const commitHistory = () => {
    if (isApplyingHistory.value) return;
    drawHistory.commit(buildHistorySnapshot());
    refreshHistoryState();
  };

  const undoHistory = () => {
    const previousSnapshot = drawHistory.undo(buildHistorySnapshot());
    const restoration = applyHistorySnapshot(previousSnapshot);
    refreshHistoryState();
    return restoration;
  };

  const redoHistory = () => {
    const nextSnapshot = drawHistory.redo(buildHistorySnapshot());
    const restoration = applyHistorySnapshot(nextSnapshot);
    refreshHistoryState();
    return restoration;
  };

  return {
    canUndoHistory,
    canRedoHistory,
    historySizes,
    isApplyingHistory,
    commitHistory,
    undoHistory,
    redoHistory,
    buildHistorySnapshot,
    applyHistorySnapshot,
    refreshHistoryState,
  };
}
