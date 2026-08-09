import { computed, ref } from 'vue';
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
    currentMode: currentMode.value,
  });

  const applyHistorySnapshot = (snapshot) => {
    if (!snapshot) return;
    isApplyingHistory.value = true;
    try {
      layers.value = Array.isArray(snapshot.layers) ? snapshot.layers : [];
      activeLayerId.value = snapshot.activeLayerId || layers.value[0]?.id || '';
      currentStyleKey.value = snapshot.currentStyleKey || 'gaode';
      const restoredSelectedFeatureId = snapshot.selectedFeatureId || '';
      const restoredSelectedFeatureIds = Array.isArray(snapshot.selectedFeatureIds)
        ? snapshot.selectedFeatureIds
        : (restoredSelectedFeatureId ? [restoredSelectedFeatureId] : []);
      const restoredMode = snapshot.currentMode || 'simple_select';
      currentMode.value = restoredMode;
      syncLayerIdSeedFromLayers(layers.value);
      syncAllLayersAfterMutation();
      setFeatureSelection(restoredSelectedFeatureIds, restoredSelectedFeatureId);
      if (restoredMode === 'direct_select') {
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
      isApplyingHistory.value = false;
    }
  };

  const commitHistory = () => {
    if (isApplyingHistory.value) return;
    drawHistory.commit(buildHistorySnapshot());
    refreshHistoryState();
  };

  const undoHistory = () => {
    const previousSnapshot = drawHistory.undo(buildHistorySnapshot());
    applyHistorySnapshot(previousSnapshot);
    refreshHistoryState();
  };

  const redoHistory = () => {
    const nextSnapshot = drawHistory.redo(buildHistorySnapshot());
    applyHistorySnapshot(nextSnapshot);
    refreshHistoryState();
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
