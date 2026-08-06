import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { showConfirm, showError, showSuccess } from '@/utils/ui/message.js';
import {
  AUTO_DRAFT_ID,
  buildAutoDraftRecord,
  buildDraftStateSignature,
  deleteDraftRecord,
  getDraftRecordById,
  listDraftRecords,
  migrateLegacyDraftsFromLocalStorage,
  saveDraftRecord,
  updateDraftRecord,
} from '@/main/utils/drawMap/draftStorage.js';

const mapDrawStorageKey = 'map-draw-workbench-state';

export function useGisDrafts(options = {}) {
  const { t } = useI18n();
  const {
    layers,
    activeLayerId,
    currentStyleKey,
    isDrawingPanelOpen,
    isLayersPanelOpen,
    isAuthenticated,
    clearFeatureSelection,
    syncLayerIdSeedFromLayers,
    syncAllLayersAfterMutation,
    commitHistory,
  } = options;

  const showLocalStorageModal = ref(false);
  const showSaveLocalDraftModal = ref(false);
  const selectedStoredDraftId = ref('');
  const newDraftName = ref('');
  const storedDrafts = ref([]);
  const savedWorkbenchSignature = ref('');
  const isRestoringAutoDraft = ref(false);
  const autoDraftChecked = ref(false);
  const pendingAutoDraftSaves = new Set();

  const hasLayersToPersist = computed(() => {
    return layers.value.some((layer) => (layer?.featureCollection?.features?.length ?? 0) > 0);
  });

  const storedDraftOptions = computed(() => {
    return storedDrafts.value.map((draft) => ({
      label: draft.name,
      value: draft.id,
    }));
  });

  const buildPersistedWorkbenchState = () => ({
    layers: layers.value,
    activeLayerId: activeLayerId.value,
    currentStyleKey: currentStyleKey.value,
    isDrawingPanelOpen: isDrawingPanelOpen.value,
    isLayersPanelOpen: isLayersPanelOpen.value,
  });

  const getCurrentWorkbenchSignature = () => buildDraftStateSignature(buildPersistedWorkbenchState());

  const hasUnsavedWorkbenchChanges = computed(() => {
    return getCurrentWorkbenchSignature() !== savedWorkbenchSignature.value;
  });

  const markWorkbenchClean = (state = buildPersistedWorkbenchState()) => {
    savedWorkbenchSignature.value = buildDraftStateSignature(state);
  };

  // ---- Auto draft ----

  const saveAutoDraft = async () => {
    if (!isAuthenticated.value || isRestoringAutoDraft.value) return;
    if (!hasUnsavedWorkbenchChanges.value) return;
    const savePromise = Promise.resolve(saveDraftRecord(buildAutoDraftRecord(buildPersistedWorkbenchState())))
      .catch((error) => { console.warn('save map draw auto draft failed', error); })
      .finally(() => { pendingAutoDraftSaves.delete(savePromise); });
    pendingAutoDraftSaves.add(savePromise);
    await savePromise;
  };

  const clearAutoDraft = async () => {
    try {
      if (pendingAutoDraftSaves.size > 0) await Promise.all([...pendingAutoDraftSaves]);
      await deleteDraftRecord(AUTO_DRAFT_ID);
    } catch (error) { console.warn('clear map draw auto draft failed', error); }
  };

  const draftStateHasContent = (state) => {
    return (state?.layers || []).some((layer) => (layer?.featureCollection?.features?.length ?? 0) > 0);
  };

  const restoreAutoDraftIfAvailable = async () => {
    const autoDraft = await getDraftRecordById(AUTO_DRAFT_ID);
    if (!autoDraft?.state) return;
    if (!draftStateHasContent(autoDraft.state)) { await deleteDraftRecord(AUTO_DRAFT_ID); return; }
    const currentSig = getCurrentWorkbenchSignature();
    const autoSig = autoDraft.signature || buildDraftStateSignature(autoDraft.state);
    if (autoSig === currentSig) { await deleteDraftRecord(AUTO_DRAFT_ID); return; }
    const confirmed = await showConfirm(t('map.drawTab.messages.autoDraftRestoreConfirm'));
    if (!confirmed) { await deleteDraftRecord(AUTO_DRAFT_ID); return; }
    isRestoringAutoDraft.value = true;
    try {
      commitHistory();
      applyDraftState(autoDraft.state);
      markWorkbenchClean(autoDraft.state);
      await deleteDraftRecord(AUTO_DRAFT_ID);
      showSuccess(t('map.drawTab.messages.autoDraftRestoreSuccess'));
    } finally { isRestoringAutoDraft.value = false; }
  };

  const checkAutoDraftOnce = async () => {
    if (autoDraftChecked.value) return;
    autoDraftChecked.value = true;
    try { await restoreAutoDraftIfAvailable(); } catch (error) { console.warn('restore auto draft failed', error); }
  };

  // ---- Apply state ----

  const applyDraftState = (state) => {
    layers.value = Array.isArray(state?.layers) ? state.layers : [];
    activeLayerId.value = state?.activeLayerId || layers.value[0]?.id || '';
    currentStyleKey.value = state?.currentStyleKey || 'gaode';
    isDrawingPanelOpen.value = state?.isDrawingPanelOpen ?? true;
    isLayersPanelOpen.value = state?.isLayersPanelOpen ?? false;
    clearFeatureSelection();
    syncLayerIdSeedFromLayers(layers.value);
    syncAllLayersAfterMutation();
  };

  // ---- Manual draft operations ----

  const buildDraftRecord = (name) => ({
    id: `${Date.now()}`,
    name,
    savedAt: new Date().toISOString(),
    version: 1,
    state: buildPersistedWorkbenchState(),
  });

  const restoreStoredDrafts = async () => {
    await migrateLegacyDraftsFromLocalStorage(mapDrawStorageKey);
    storedDrafts.value = await listDraftRecords();
    selectedStoredDraftId.value = storedDrafts.value[0]?.id || '';
    newDraftName.value = '';
  };

  const openSaveLocalDraftModal = () => {
    if (!hasLayersToPersist.value) { showError(t('map.drawTab.messages.noLayersToSave')); return; }
    newDraftName.value = '';
    showSaveLocalDraftModal.value = true;
  };

  const confirmSaveAsNewLocal = async () => {
    if (!hasLayersToPersist.value) { showError(t('map.drawTab.messages.noLayersToSave')); return; }
    if (!newDraftName.value.trim()) { showError(t('map.drawTab.messages.localDraftNameRequired')); return; }
    try {
      const next = buildDraftRecord(newDraftName.value.trim());
      await saveDraftRecord(next);
      storedDrafts.value = await listDraftRecords();
      selectedStoredDraftId.value = next.id;
      newDraftName.value = next.name;
      showSaveLocalDraftModal.value = false;
      markWorkbenchClean(next.state);
      await clearAutoDraft();
      showSuccess(t('map.drawTab.messages.saveToLocalSuccess'));
    } catch (error) {
      showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
    }
  };

  const handleUpdateLocal = async () => {
    if (!hasLayersToPersist.value) { showError(t('map.drawTab.messages.noLayersToSave')); return; }
    if (!selectedStoredDraftId.value) return;
    try {
      const current = await getDraftRecordById(selectedStoredDraftId.value);
      if (!current) return;
      const draft = await updateDraftRecord(selectedStoredDraftId.value, {
        name: current.name, savedAt: new Date().toISOString(), state: buildPersistedWorkbenchState(),
      });
      if (!draft) return;
      storedDrafts.value = await listDraftRecords();
      selectedStoredDraftId.value = draft.id;
      newDraftName.value = draft.name;
      markWorkbenchClean(draft.state);
      await clearAutoDraft();
      showSuccess(t('map.drawTab.messages.updateLocalSuccess'));
    } catch (error) {
      showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
    }
  };

  const handleRestoreLocal = async () => {
    if (!selectedStoredDraftId.value) return;
    try {
      const draft = await getDraftRecordById(selectedStoredDraftId.value);
      if (!draft) return;
      commitHistory();
      applyDraftState(draft.state);
      newDraftName.value = draft.name || '';
      markWorkbenchClean(draft.state);
      await clearAutoDraft();
      showSuccess(t('map.drawTab.messages.restoreLocalSuccess'));
    } catch (error) {
      showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
    }
  };

  const handleDeleteLocal = async () => {
    if (!selectedStoredDraftId.value) return;
    const confirmed = await showConfirm(t('map.drawTab.messages.deleteLocalConfirm'));
    if (!confirmed) return;
    try {
      await deleteDraftRecord(selectedStoredDraftId.value);
      storedDrafts.value = await listDraftRecords();
      selectedStoredDraftId.value = storedDrafts.value[0]?.id || '';
      const next = storedDrafts.value.find((d) => d.id === selectedStoredDraftId.value);
      newDraftName.value = next?.name || '';
      showSuccess(t('map.drawTab.messages.deleteLocalSuccess'));
    } catch (error) {
      showError(t('map.drawTab.messages.saveToLocalFailed', { error: error.message || error }));
    }
  };

  const handleBeforeUnload = (event) => {
    if (!hasUnsavedWorkbenchChanges.value) return;
    saveAutoDraft();
    event.preventDefault();
    event.returnValue = t('map.drawTab.messages.unsavedChangesWarning');
  };

  return {
    showLocalStorageModal,
    showSaveLocalDraftModal,
    selectedStoredDraftId,
    newDraftName,
    storedDrafts,
    storedDraftOptions,
    hasLayersToPersist,
    hasUnsavedWorkbenchChanges,
    getCurrentWorkbenchSignature,
    markWorkbenchClean,
    saveAutoDraft,
    clearAutoDraft,
    restoreAutoDraftIfAvailable,
    checkAutoDraftOnce,
    buildDraftRecord,
    applyDraftState,
    restoreStoredDrafts,
    openSaveLocalDraftModal,
    confirmSaveAsNewLocal,
    handleUpdateLocal,
    handleRestoreLocal,
    handleDeleteLocal,
    handleBeforeUnload,
  };
}
