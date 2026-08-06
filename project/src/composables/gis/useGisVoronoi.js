import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { featureCollection } from '@turf/turf';

import nationalBorderGeoJsonUrl from '/data/gis/china_country.geojson?url';
import provincesGeoJsonUrl from '/data/gis/china_provinces.geojson?url';
import citiesGeoJsonUrl from '/data/gis/china_cities_simplified_balanced.geojson?url';
import countiesGeoJsonUrl from '/data/gis/china_counties_simplified_light.geojson?url';

import { getLocationPartitions } from '@/api/main/geo/LocationAndRegion.js';
import { usePartitionCache } from '@/composables/data/usePartitionCache.js';
import { showError, showSuccess } from '@/utils/ui/message.js';
import {
  clipVoronoiFeatureCollectionToNationalBorder,
  prepareNationalBorderForVoronoiClip,
} from '@/main/utils/drawMap/voronoiClip.js';
import {
  PARTITION_MODE_MAP,
  PARTITION_MODE_YINDIAN,
  buildPartitionColorMap,
  buildPartitionPointFeatureCollection,
  buildPartitionPoints,
  buildVoronoiSelectionOptions,
  calculatePartitionVoronoi,
  normalizePartitionPoint,
} from '@/main/utils/drawMap/partitionVoronoi.js';
import { useVoronoiCustomImport } from '@/composables/import/useVoronoiCustomImport.js';
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js';
import { globalPayload } from '@/main/store/store.js';

const voronoiExportLimit = 20;
const voronoiExportStorageKey = 'map-draw-voronoi-export-state';
const nationalBorderCacheKey = 'map-draw-national-border-cache-v3';
const nationalBorderAssetCacheName = 'map-draw-assets';

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

const levelOptionsMap = {
  country: '国界',
  provinces: '省界',
  cities: '市界',
  counties: '县界',
};

export function useGisVoronoi(options = {}) {
  const { t } = useI18n();
  const {
    layers,
    activeLayerId,
    editableMapRef,
    currentMode,
    isDrawingPanelOpen,
    isLayersPanelOpen,
    createEmptyLayer,
    commitHistory,
    syncAllLayersAfterMutation,
    setMode,
    fetchHighPrecisionBoundaries,
    importInputRef: _importInputRef,
  } = options;

  const { getPartitionData } = usePartitionCache();

  // ---- Voronoi state ----
  const voronoiRawPartitionData = ref([]);
  const voronoiPartitionPoints = ref([]);
  const voronoiOfficialPoints = ref([]);
  const voronoiCustomImportRows = ref([]);
  const voronoiCustomImportMeta = ref(null);
  const useVoronoiOfficialData = ref(true);
  const showVoronoiPreviewModal = ref(false);
  const voronoiImportFileInputRef = ref(null);

  const voronoiImport = useVoronoiCustomImport();
  const voronoiTabularState = useTabularImportPreview({
    schema: voronoiImport.schema,
    requireExplicitConfirmation: true,
  });

  const ignoredVoronoiLocations = ref([]);
  const voronoiPreviewLayers = ref([]);
  const voronoiPreviewType = ref('');
  const hoveredPolygon = ref(null);
  const voronoiPartitionMode = ref(PARTITION_MODE_YINDIAN);
  const voronoiRegionLevel = ref(1);
  const isVoronoiPanelOpen = ref(false);
  const isVoronoiLoadingPoints = ref(false);
  const isVoronoiCalculating = ref(false);
  const showVoronoiIgnoreModal = ref(false);
  const showFieldMergeModal = ref(false);
  const isAddingDialectPoints = ref(false);
  const showAddDialectPartitionModal = ref(false);
  const addDialectPartitionKey = ref('');
  const pendingAddPartitionKey = ref('');
  let addPointCounter = 0;

  const voronoiStatusText = ref('');
  const voronoiLastResult = ref(null);
  const voronoiExportSelections = ref([]);
  const voronoiExportProgress = ref({ current: 0, total: 0 });
  const isVoronoiExporting = ref(false);

  const voronoiFieldMergeMap = ref(new Map());
  const voronoiExpandRatio = ref(50);
  const voronoiEnableExpand = ref(false);

  // Clip boundary
  const clipBoundaryConfig = ref({ enabled: false, level: 'country', selectedNames: [] });
  const showClipBoundaryModal = ref(false);
  const showImportBoundaryModal = ref(false);
  const showRiverImportModal = ref(false);
  const isRiverImporting = ref(false);
  const importBoundaryConfig = ref({ level: 'country', selectedNames: [] });
  const highPrecisionEnabled = ref(false);
  const isBoundaryOptionsLoading = ref(false);

  // Image export state
  const showImageExportModal = ref(false);
  const showImagePreviewModal = ref(false);
  const imageExportSettings = ref(null);
  const imageExportViewState = ref(null);

  // GeoJSON caches
  let provincesGeoJsonCache = null;
  let citiesGeoJsonCache = null;
  let countiesGeoJsonCache = null;
  let nationalBorderPreparedCache = null;

  // ---- Computeds ----

  const isVillageDataSource = computed(() => voronoiCustomImportMeta.value?.partitionMode === 'village');

  const normalizeVoronoiLocationName = (value) => String(value || '').trim();

  const addDialectPartitionOptions = computed(() => {
    const level = Number(voronoiRegionLevel.value) || 3;
    const keys = [...new Set(voronoiPartitionPoints.value.map((p) => {
      if (level === 1) return p.partitionLevel1;
      if (level === 2) return p.partitionLevel2;
      return p.partitionLevel3;
    }).filter(Boolean))];
    return keys.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN')).map((k) => ({ label: k, value: k }));
  });

  const customPointsByPartition = computed(() => {
    const level = Number(voronoiRegionLevel.value) || 3;
    const manualPoints = voronoiCustomImportRows.value.filter((p) => p.source === 'manual');
    const groups = {};
    for (const p of manualPoints) {
      let key;
      if (level === 1) key = p.partitionLevel1;
      else if (level === 2) key = p.partitionLevel2;
      else key = p.partitionLevel3;
      if (!key) continue;
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  });

  const fieldMergeEntries = computed(() => {
    const level = Number(voronoiRegionLevel.value) || 3;
    const keys = [...new Set(voronoiPartitionPoints.value.map((p) => {
      if (level === 1) return p.partitionLevel1;
      if (level === 2) return p.partitionLevel2;
      return p.partitionLevel3;
    }).filter(Boolean))];
    return keys.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN')).map((key) => ({
      original: key,
      groupName: voronoiFieldMergeMap.value.get(key) ?? key,
    }));
  });

  const hasFieldMerge = computed(() => fieldMergeEntries.value.length > 0);

  const hasVoronoiCustomImport = computed(() => voronoiCustomImportRows.value.length > 0);
  const voronoiCustomImportSummaryText = computed(() => {
    const meta = voronoiCustomImportMeta.value;
    if (!meta) return '';
    return t('map.drawTab.voronoi.customImport.summary.message', {
      count: voronoiCustomImportRows.value.length,
      total: meta.summary?.totalRowCount || voronoiCustomImportRows.value.length,
    });
  });
  const voronoiTotalPointCount = computed(() => voronoiPartitionPoints.value.length);
  const voronoiOfficialPointCount = computed(() => voronoiOfficialPoints.value.length);
  const voronoiCustomPointCount = computed(() => voronoiCustomImportRows.value.length);
  const voronoiActivePointCount = computed(() => activeVoronoiPoints.value.length);
  const voronoiGroupCount = computed(() => {
    const level = Number(voronoiRegionLevel.value) || 3;
    return new Set(activeVoronoiPoints.value.map((item) => (
      level === 1 ? item.partitionLevel1 : level === 2 ? item.partitionLevel2 : item.partitionLevel3
    ))).size;
  });

  const voronoiPanelOffsetMode = computed(() => {
    const count = [isDrawingPanelOpen.value, isLayersPanelOpen.value].filter(Boolean).length;
    return count >= 2 ? 'double' : count === 1 ? 'single' : 'none';
  });

  const voronoiSelectionOptions = computed(() => {
    return buildVoronoiSelectionOptions(applyFieldMerge(voronoiPartitionPoints.value), Number(voronoiRegionLevel.value) || 3);
  });

  const voronoiColorMap = computed(() => {
    return buildPartitionColorMap(activeVoronoiPoints.value, Number(voronoiRegionLevel.value) || 3);
  });

  const voronoiExportGroups = computed(() => {
    const groups = voronoiLastResult.value?.groups ?? {};
    const merged = voronoiLastResult.value?.merged?.features ?? [];
    const level = Number(voronoiRegionLevel.value) || 3;
    return Object.keys(groups).sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN')).map((key) => {
      const cell = groups[key] ?? emptyFeatureCollection();
      const mergedFeat = merged.find((f) => f?.properties?.partitionKey === key) ?? null;
      const pointCount = mergedFeat?.properties?.pointCount
        ?? activeVoronoiPoints.value.filter((item) => {
          if (level === 1) return item.partitionLevel1 === key;
          if (level === 2) return item.partitionLevel2 === key;
          return item.partitionLevel3 === key;
        }).length;
      return { key, name: key, pointCount, cellCollection: cell, mergedFeature: mergedFeat };
    });
  });

  const selectedVoronoiExportCount = computed(() => voronoiExportSelections.value.length);
  const isVoronoiExportSelectionFull = computed(() => selectedVoronoiExportCount.value >= voronoiExportLimit);
  const showVoronoiExportProgressOverlay = computed(() => isVoronoiExporting.value && voronoiExportProgress.value.total > 0);

  const boundaryOptionsMap = computed(() => {
    const countryOpts = [{ label: t('map.drawTab.voronoi.clipBoundaryLevelCountry'), value: '中国' }];
    const provOpts = (provincesGeoJsonCache?.features ?? []).map((f) => f?.properties?.name).filter(Boolean).map((n) => ({ label: n, value: n }));
    const cityOpts = (citiesGeoJsonCache?.features ?? []).map((f) => f?.properties?.name).filter(Boolean).map((n) => ({ label: n, value: n }));
    const countyOpts = (countiesGeoJsonCache?.features ?? []).map((f) => f?.properties?.name).filter(Boolean).map((n) => ({ label: n, value: n }));
    return { country: countryOpts, provinces: provOpts, cities: cityOpts, counties: countyOpts };
  });

  const clipBoundarySummary = computed(() => {
    if (!clipBoundaryConfig.value.enabled) return t('map.drawTab.voronoi.clipBoundarySettings');
    const levelLabel = levelOptionsMap[clipBoundaryConfig.value.level] || '';
    const names = clipBoundaryConfig.value.selectedNames;
    const base = !names.length ? levelLabel : `${levelLabel} · ${names.slice(0, 3).join(', ')}${names.length > 3 ? '...' : ''}`;
    return clipBoundaryConfig.value.highPrecision ? `⚡ ${base}` : base;
  });

  // ---- Field merge + point filtering ----

  function applyFieldMerge(points) {
    if (voronoiFieldMergeMap.value.size === 0) return points;
    const effective = (val) => (val != null && String(val).trim() !== '') ? val : undefined;
    return points.map((p) => {
      const g1 = effective(voronoiFieldMergeMap.value.get(p.partitionLevel1));
      const g2 = effective(voronoiFieldMergeMap.value.get(p.partitionLevel2));
      const g3 = effective(voronoiFieldMergeMap.value.get(p.partitionLevel3));
      if (g1 === undefined && g2 === undefined && g3 === undefined) return p;
      return { ...p, partitionLevel1: g1 ?? p.partitionLevel1, partitionLevel2: g2 ?? p.partitionLevel2, partitionLevel3: g3 ?? p.partitionLevel3 };
    });
  }

  const activeVoronoiPoints = computed(() => {
    const ignored = new Set(ignoredVoronoiLocations.value.map(normalizeVoronoiLocationName).filter(Boolean));
    const filtered = voronoiPartitionPoints.value.filter((item) => !ignored.has(normalizeVoronoiLocationName(item.name)));
    return applyFieldMerge(filtered);
  });

  function initFieldMergeMap() {
    const next = new Map();
    const level = Number(voronoiRegionLevel.value) || 3;
    voronoiPartitionPoints.value.forEach((p) => {
      let key;
      if (level === 1) key = p.partitionLevel1;
      else if (level === 2) key = p.partitionLevel2;
      else key = p.partitionLevel3;
      if (key && !next.has(key)) next.set(key, key);
    });
    voronoiFieldMergeMap.value = next;
  }

  function updateFieldMerge(original, groupName) {
    const next = new Map(voronoiFieldMergeMap.value);
    next.set(original, String(groupName ?? ''));
    voronoiFieldMergeMap.value = next;
  }

  function resetFieldMerge() { initFieldMergeMap(); }

  // ---- GeoJSON loaders ----

  async function loadProvincesGeoJson() {
    if (provincesGeoJsonCache) return provincesGeoJsonCache;
    const res = await fetch(provincesGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    provincesGeoJsonCache = await res.json();
    return provincesGeoJsonCache;
  }
  async function loadCitiesGeoJson() {
    if (citiesGeoJsonCache) return citiesGeoJsonCache;
    const res = await fetch(citiesGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    citiesGeoJsonCache = await res.json();
    return citiesGeoJsonCache;
  }
  async function loadCountiesGeoJson() {
    if (countiesGeoJsonCache) return countiesGeoJsonCache;
    const res = await fetch(countiesGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    countiesGeoJsonCache = await res.json();
    return countiesGeoJsonCache;
  }

  async function readNationalBorderCache() {
    if (nationalBorderPreparedCache) return nationalBorderPreparedCache;
    const cacheStorage = typeof window !== 'undefined' && 'caches' in window ? await caches.open(nationalBorderAssetCacheName) : null;
    const cachedRes = cacheStorage ? await cacheStorage.match(nationalBorderGeoJsonUrl) : null;
    if (!cachedRes) { localStorage.removeItem(nationalBorderCacheKey); return null; }
    const fc = await cachedRes.json();
    nationalBorderPreparedCache = prepareNationalBorderForVoronoiClip(fc);
    localStorage.setItem(nationalBorderCacheKey, JSON.stringify({ version: 3, cachedAt: Date.now() }));
    return nationalBorderPreparedCache;
  }
  async function writeNationalBorderCache(fc) {
    const cacheStorage = typeof window !== 'undefined' && 'caches' in window ? await caches.open(nationalBorderAssetCacheName) : null;
    if (cacheStorage) {
      const res = new Response(JSON.stringify(fc), { headers: { 'Content-Type': 'application/geo+json' } });
      await cacheStorage.put(nationalBorderGeoJsonUrl, res);
    }
    localStorage.setItem(nationalBorderCacheKey, JSON.stringify({ version: 3, cachedAt: Date.now() }));
  }
  async function loadNationalBorderFeatureCollection() {
    const cached = await readNationalBorderCache();
    if (cached) return cached;
    const res = await fetch(nationalBorderGeoJsonUrl);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const fc = await res.json();
    nationalBorderPreparedCache = prepareNationalBorderForVoronoiClip(fc);
    await writeNationalBorderCache(fc);
    return nationalBorderPreparedCache;
  }

  async function loadBorderFeatureCollection(level, selectedNames, highPrecision = false) {
    if (level === 'country') return loadNationalBorderFeatureCollection();
    if (highPrecision) {
      const fc = await fetchHighPrecisionBoundaries(selectedNames);
      if (!fc) return null;
      return prepareNationalBorderForVoronoiClip(fc);
    }
    let geoJson;
    if (level === 'provinces') geoJson = await loadProvincesGeoJson();
    else if (level === 'counties') geoJson = await loadCountiesGeoJson();
    else geoJson = await loadCitiesGeoJson();
    const filtered = (geoJson.features ?? []).filter((f) => selectedNames.includes(f?.properties?.name));
    if (!filtered.length) return null;
    return prepareNationalBorderForVoronoiClip({ type: 'FeatureCollection', features: filtered });
  }

  // ---- Voronoi data loading ----

  function setVoronoiStatus(key, params = {}) {
    voronoiStatusText.value = t(`map.drawTab.voronoi.${key}`, params);
  }

  function syncVoronoiPartitionPoints() {
    const next = [];
    if (useVoronoiOfficialData.value) next.push(...voronoiOfficialPoints.value);
    if (voronoiCustomImportRows.value.length) next.push(...voronoiCustomImportRows.value);
    voronoiPartitionPoints.value = next;
  }

  function normalizeVoronoiPoints(partitionData = voronoiRawPartitionData.value) {
    voronoiOfficialPoints.value = buildPartitionPoints(partitionData, { partitionMode: voronoiPartitionMode.value });
    syncVoronoiPartitionPoints();
  }

  function clearVoronoiPreviewState() {
    ignoredVoronoiLocations.value = [];
    voronoiLastResult.value = null;
    voronoiExportSelections.value = [];
    voronoiPreviewType.value = '';
    voronoiPreviewLayers.value = [];
  }

  function clearVoronoiCustomImport() {
    voronoiCustomImportRows.value = [];
    voronoiCustomImportMeta.value = null;
    syncVoronoiPartitionPoints();
    clearVoronoiPreviewState();
    setVoronoiStatus('customImportCleared');
  }

  const loadVoronoiPoints = async () => {
    if (isVoronoiLoadingPoints.value) return;
    isVoronoiLoadingPoints.value = true;
    try {
      const data = await getPartitionData(() => getLocationPartitions());
      voronoiRawPartitionData.value = Array.isArray(data) ? data : [];
      normalizeVoronoiPoints(voronoiRawPartitionData.value);
      setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
    } catch (error) {
      console.error('[MapDrawTab] Load Voronoi points failed:', error);
      showError(t('map.drawTab.messages.voronoiFailed', { error: error.message || error }));
    } finally { isVoronoiLoadingPoints.value = false; }
  };

  async function ensureVoronoiPointsLoaded() {
    if (voronoiPartitionPoints.value.length) return;
    await loadVoronoiPoints();
  }

  // ---- Village data ----

  function consumeVillageVoronoiPayload(payload) {
    clearVoronoiCustomImport();
    voronoiCustomImportRows.value = (payload.points || []).map((p, i) => ({ ...p, source: 'village', customRowId: `village-${i + 1}` }));
    voronoiCustomImportMeta.value = { partitionMode: 'village', summary: { totalRowCount: (payload.points || []).length } };
    useVoronoiOfficialData.value = false;
    voronoiPartitionMode.value = PARTITION_MODE_MAP;
    voronoiRegionLevel.value = 1;
    syncVoronoiPartitionPoints();
    initFieldMergeMap();
    ignoredVoronoiLocations.value = [];
    voronoiLastResult.value = null;
    voronoiPreviewType.value = '';
    voronoiPreviewLayers.value = [];
    isDrawingPanelOpen.value = false;
    isVoronoiPanelOpen.value = true;
    setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
    globalPayload.value = null;
  }

  // ---- Custom import ----

  function triggerVoronoiFileImport() { voronoiImportFileInputRef.value?.click(); }

  async function handleVoronoiFileChange(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
      await voronoiTabularState.loadFile(file);
      showVoronoiPreviewModal.value = true;
    } catch (error) {
      showError(t('map.drawTab.voronoi.customImport.messages.parseFailed', { error: error?.message || String(error || '') }));
    } finally { if (event?.target) event.target.value = ''; }
  }

  function handleVoronoiPreviewReset() {
    voronoiTabularState.resetState();
    voronoiImport.clearImportedData();
    showVoronoiPreviewModal.value = false;
  }

  function handleVoronoiPreviewConfirm() {
    const rows = voronoiImport.applyPreviewSummary(voronoiTabularState.summary.value);
    if (!rows.length) { showError(t('map.drawTab.voronoi.customImport.messages.noValidRows')); return; }
    handleVoronoiCustomImportConfirm({ rows, partitionMode: voronoiImport.partitionMode.value, summary: voronoiImport.summary.value });
    showVoronoiPreviewModal.value = false;
  }

  function handleVoronoiCustomImportConfirm({ rows, partitionMode, summary }) {
    voronoiCustomImportRows.value = Array.isArray(rows)
      ? rows.map((row, i) => ({ ...row, name: String(row?.name || '').trim(), source: row?.source || 'custom', customRowId: row?.customRowId || `custom-${i + 1}`, partitionMode }))
      : [];
    voronoiCustomImportMeta.value = { partitionMode, summary };
    syncVoronoiPartitionPoints();
    clearVoronoiPreviewState();
    setVoronoiStatus('customImportLoaded', { count: voronoiCustomImportRows.value.length });
  }

  // ---- Ignore / Preview / Calculate ----

  async function openVoronoiIgnoreModal() { await ensureVoronoiPointsLoaded(); showVoronoiIgnoreModal.value = true; }

  async function refreshVoronoiPreview(type = voronoiPreviewType.value) {
    if (type === 'points') { await previewVoronoiPoints({ force: true }); return; }
    if (type === 'polygons') { await handleBuildVoronoi({ force: true }); }
  }

  async function handleVoronoiIgnoreConfirm(locations) {
    const prev = voronoiPreviewType.value;
    ignoredVoronoiLocations.value = Array.isArray(locations) ? locations.map(normalizeVoronoiLocationName).filter(Boolean) : [];
    voronoiLastResult.value = null;
    voronoiExportSelections.value = [];
    voronoiPreviewType.value = '';
    voronoiPreviewLayers.value = [];
    setVoronoiStatus('ignoreUpdated', { count: ignoredVoronoiLocations.value.length });
    await refreshVoronoiPreview(prev);
  }

  async function previewVoronoiPoints({ force = false } = {}) {
    if (!force && voronoiPreviewType.value === 'points') {
      voronoiPreviewType.value = ''; voronoiPreviewLayers.value = [];
      setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
      return;
    }
    await ensureVoronoiPointsLoaded();
    const ptCollection = buildPartitionPointFeatureCollection(activeVoronoiPoints.value, Number(voronoiRegionLevel.value) || 3, voronoiColorMap.value);
    voronoiPreviewType.value = 'points';
    voronoiPreviewLayers.value = [{ id: 'voronoi-preview-points', type: 'points', featureCollection: ptCollection }];
    setVoronoiStatus('previewReady', { count: ptCollection.features.length });
  }

  async function handleBuildVoronoi({ force = false } = {}) {
    if (isVoronoiCalculating.value) return;
    if (!force && voronoiPreviewType.value === 'polygons') {
      voronoiPreviewType.value = ''; voronoiPreviewLayers.value = [];
      setVoronoiStatus('pointsLoaded', { count: voronoiPartitionPoints.value.length });
      return;
    }
    isVoronoiCalculating.value = true;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      await ensureVoronoiPointsLoaded();
      const level = Number(voronoiRegionLevel.value) || 3;
      const pts = activeVoronoiPoints.value;
      const expandRatio = voronoiEnableExpand.value ? voronoiExpandRatio.value : -1;
      const result = calculatePartitionVoronoi(pts, level, voronoiColorMap.value, expandRatio);
      voronoiLastResult.value = result;
      voronoiPreviewType.value = 'polygons';
      voronoiPreviewLayers.value = [{ id: 'voronoi-preview-polygons', type: 'polygons', featureCollection: result.merged }];
      setVoronoiStatus('calculated', { count: result.merged.features.length });
    } catch (error) {
      console.error('[MapDrawTab] Voronoi calculation failed:', error);
      showError(t('map.drawTab.messages.voronoiFailed', { error: error.message || error }));
    } finally { isVoronoiCalculating.value = false; }
  }

  // ---- Export to layers ----

  async function exportVoronoiToLayer() {
    await ensureVoronoiPointsLoaded();
    const level = Number(voronoiRegionLevel.value) || 3;
    const pts = activeVoronoiPoints.value;
    const expandRatio2 = voronoiEnableExpand.value ? voronoiExpandRatio.value : -1;
    const result = calculatePartitionVoronoi(pts, level, voronoiColorMap.value, expandRatio2);
    voronoiLastResult.value = result;
    const keys = voronoiExportGroups.value.map((item) => item.key);
    const sel = voronoiExportSelections.value.filter((item) => keys.includes(item));
    voronoiExportSelections.value = sel.length ? sel : keys.slice(0, voronoiExportLimit);
    showImageExportModal.value = false;
    // This opens Voronoi export modal
    return true;
  }

  function toggleVoronoiExportSelection(key) {
    const next = new Set(voronoiExportSelections.value);
    if (next.has(key)) { next.delete(key); voronoiExportSelections.value = Array.from(next); return; }
    if (next.size >= voronoiExportLimit) { showError(t('map.drawTab.voronoi.exportSelectionLimit', { count: voronoiExportLimit })); return; }
    next.add(key);
    voronoiExportSelections.value = Array.from(next);
  }

  async function confirmVoronoiExport() {
    if (isVoronoiExporting.value) return;
    if (!voronoiExportSelections.value.length) { showError(t('map.drawTab.voronoi.exportSelectionRequired')); return; }
    const selectedGroups = voronoiExportGroups.value.filter((item) => voronoiExportSelections.value.includes(item.key));
    isVoronoiExporting.value = true;
    try {
      const config = clipBoundaryConfig.value;
      const prepared = config.enabled
        ? await loadBorderFeatureCollection(config.level, config.selectedIds || config.selectedNames, config.highPrecision)
        : null;
      voronoiExportProgress.value = { current: 0, total: selectedGroups.length };
      const exportedLayers = [];
      for (const [idx, group] of selectedGroups.entries()) {
        voronoiExportProgress.value.current = idx + 1;
        const layer = createEmptyLayer('Polygon');
        const src = group.mergedFeature ? featureCollection([group.mergedFeature]) : emptyFeatureCollection();
        const clipped = prepared ? await clipVoronoiFeatureCollectionToNationalBorder(src, prepared) : src;
        if (!(clipped.features?.length ?? 0)) continue;
        const styled = {
          ...clipped,
          features: (clipped.features ?? []).map((f) => ({
            ...f,
            id: f.id ?? `voronoi-${group.key}-${idx + 1}`,
            properties: {
              ...(f.properties ?? {}),
              stroke: f.properties?.stroke ?? '#4a5568',
              strokeWidth: f.properties?.strokeWidth ?? 2,
              fill: f.properties?.fill ?? '#a0aec0',
              fillOpacity: f.properties?.fillOpacity ?? 0.22,
              visible: true,
              locked: false,
            },
          })),
        };
        layer.name = group.name;
        layer.stroke = styled.features[0]?.properties?.stroke ?? '#4a5568';
        layer.strokeWidth = styled.features[0]?.properties?.strokeWidth ?? 2;
        layer.fill = styled.features[0]?.properties?.fill ?? '#a0aec0';
        layer.fillOpacity = styled.features[0]?.properties?.fillOpacity ?? 0.22;
        layer.featureCollection = styled;
        exportedLayers.push(layer);
      }
      if (!exportedLayers.length) { showError(t('map.drawTab.voronoi.exportEmptyAfterClip')); return; }
      commitHistory();
      layers.value.unshift(...exportedLayers);
      activeLayerId.value = exportedLayers[0].id;
      isLayersPanelOpen.value = true;
      isDrawingPanelOpen.value = true;
      currentMode.value = 'simple_select';
      editableMapRef?.value?.setDrawMode?.('simple_select');
      voronoiPreviewType.value = '';
      voronoiPreviewLayers.value = [];
      syncAllLayersAfterMutation();
      showSuccess(t('map.drawTab.messages.importLayerSuccess', { count: exportedLayers.length }));
    } catch (error) {
      showError(t('map.drawTab.messages.exportLayerFailed', { error: error.message || error }));
    } finally {
      isVoronoiExporting.value = false;
      voronoiExportProgress.value = { current: 0, total: 0 };
    }
  }

  // ---- Clip boundary ----

  async function handleOpenClipBoundary() {
    showClipBoundaryModal.value = true;
    isBoundaryOptionsLoading.value = true;
    Promise.all([loadProvincesGeoJson().catch(() => {}), loadCitiesGeoJson().catch(() => {}), loadCountiesGeoJson().catch(() => {})])
      .finally(() => { isBoundaryOptionsLoading.value = false; });
  }

  function handleClipBoundaryConfirm(config) { clipBoundaryConfig.value = { ...config }; }

  function onAdminBoundaryClicked() {
    showImportBoundaryModal.value = true;
    isBoundaryOptionsLoading.value = true;
    Promise.all([loadProvincesGeoJson().catch(() => {}), loadCitiesGeoJson().catch(() => {}), loadCountiesGeoJson().catch(() => {})])
      .finally(() => { isBoundaryOptionsLoading.value = false; });
  }

  function onRiverImportClicked() { showRiverImportModal.value = true; }

  // ---- Add points on map ----

  function toggleAddDialectPoints() {
    if (isAddingDialectPoints.value) { isAddingDialectPoints.value = false; return; }
    pendingAddPartitionKey.value = addDialectPartitionKey.value || addDialectPartitionOptions.value[0]?.value || '';
    showAddDialectPartitionModal.value = true;
  }

  function confirmAddDialectPartition() {
    addDialectPartitionKey.value = pendingAddPartitionKey.value;
    showAddDialectPartitionModal.value = false;
    isAddingDialectPoints.value = true;
    if (currentMode.value !== 'simple_select') { setMode('simple_select'); }
  }

  function deleteCustomPointsByPartition(partitionKey) {
    const level = Number(voronoiRegionLevel.value) || 3;
    const before = voronoiCustomImportRows.value.length;
    voronoiCustomImportRows.value = voronoiCustomImportRows.value.filter((p) => {
      if (p.source !== 'manual') return true;
      let key;
      if (level === 1) key = p.partitionLevel1;
      else if (level === 2) key = p.partitionLevel2;
      else key = p.partitionLevel3;
      return key !== partitionKey;
    });
    const removed = before - voronoiCustomImportRows.value.length;
    if (removed > 0) {
      syncVoronoiPartitionPoints();
      setVoronoiStatus('deletedPartitionPoints', { key: partitionKey, count: removed });
      if (addDialectPartitionKey.value === partitionKey) addDialectPartitionKey.value = '';
    }
  }

  function handleMapClickForAddPoint({ lng, lat }) {
    if (!isAddingDialectPoints.value || !addDialectPartitionKey.value || currentMode.value !== 'simple_select') return;
    addPointCounter += 1;
    const mode = voronoiPartitionMode.value;
    const rawRow = { name: `自定义点-${addPointCounter}`, lng, lat };
    rawRow[`${mode}Partition`] = addDialectPartitionKey.value;
    const point = normalizePartitionPoint(rawRow, { partitionMode: mode });
    if (!point) { showError(t('map.drawTab.voronoi.addPointInvalid')); return; }
    point.source = 'manual';
    point.customRowId = `manual-${Date.now()}-${addPointCounter}`;
    voronoiCustomImportRows.value.push(point);
    syncVoronoiPartitionPoints();
    setVoronoiStatus('addPointAdded', { name: point.name });
    if (voronoiPreviewType.value === 'points') refreshVoronoiPreview('points');
  }

  // ---- Image export ----

  const handleImageExported = () => {};
  const handleLayerExported = () => {};

  const handleConfirmImageExport = (settings) => {
    showImageExportModal.value = false;
    imageExportSettings.value = settings;
    imageExportViewState.value = {
      center: editableMapRef?.value?.currentCenter?.value ?? null,
      zoom: editableMapRef?.value?.currentZoom?.value ?? null,
      bearing: editableMapRef?.value?.currentBearing?.value ?? 0,
      pitch: editableMapRef?.value?.currentPitch?.value ?? 0,
    };
    showImagePreviewModal.value = true;
  };

  const handleImagePreviewExported = async () => {
    showImagePreviewModal.value = false;
    showSuccess(t('map.drawTab.messages.exportImageSuccess'));
  };

  const handleExportImage = async (settings = {}) => {
    try { await editableMapRef?.value?.exportImage?.(settings); showSuccess(t('map.drawTab.messages.exportImageSuccess')); }
    catch (error) { showError(t('map.drawTab.messages.exportImageFailed', { error: error.message || error })); }
  };

  // ---- Watchers ----

  watch(voronoiPartitionMode, async () => {
    normalizeVoronoiPoints();
    clearVoronoiPreviewState();
    addDialectPartitionKey.value = '';
    await refreshVoronoiPreview();
    if (!voronoiPreviewType.value) voronoiPreviewLayers.value = [];
  });

  watch(voronoiRegionLevel, async () => {
    voronoiLastResult.value = null;
    voronoiExportSelections.value = [];
    addDialectPartitionKey.value = addDialectPartitionOptions.value[0]?.value ?? '';
    await refreshVoronoiPreview();
    if (!voronoiPreviewType.value) voronoiPreviewLayers.value = [];
  });

  watch(useVoronoiOfficialData, () => {
    syncVoronoiPartitionPoints();
    clearVoronoiPreviewState();
    setVoronoiStatus('sourceUpdated', { count: voronoiPartitionPoints.value.length });
  });

  watch(clipBoundaryConfig, (value) => {
    localStorage.setItem(voronoiExportStorageKey, JSON.stringify({ clipBoundaryConfig: value }));
  }, { deep: true });

  watch(isVoronoiPanelOpen, async (isOpen) => {
    if (!isOpen) { isAddingDialectPoints.value = false; return; }
    await ensureVoronoiPointsLoaded();
  });

  watch(() => globalPayload.value, (payload) => {
    if (payload && payload._type === 'villageVoronoi' && Array.isArray(payload.points) && payload.points.length > 0) {
      consumeVillageVoronoiPayload(payload);
    }
  }, { immediate: true });

  // ---- Legacy storage restore ----
  const restoreVoronoiConfig = () => {
    try {
      const raw = localStorage.getItem(voronoiExportStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.clipBoundaryConfig) clipBoundaryConfig.value = parsed.clipBoundaryConfig;
    } catch { /* ignore */ }
  };

  return {
    // State refs
    voronoiRawPartitionData, voronoiPartitionPoints, voronoiOfficialPoints,
    voronoiCustomImportRows, voronoiCustomImportMeta, useVoronoiOfficialData,
    showVoronoiPreviewModal, voronoiImportFileInputRef, voronoiImport, voronoiTabularState,
    ignoredVoronoiLocations, voronoiPreviewLayers, voronoiPreviewType, hoveredPolygon,
    voronoiPartitionMode, voronoiRegionLevel, isVoronoiPanelOpen,
    isVoronoiLoadingPoints, isVoronoiCalculating, showVoronoiIgnoreModal, showFieldMergeModal,
    isAddingDialectPoints, showAddDialectPartitionModal, addDialectPartitionKey, pendingAddPartitionKey,
    voronoiStatusText, voronoiLastResult, voronoiExportSelections, voronoiExportProgress,
    isVoronoiExporting, voronoiFieldMergeMap, voronoiExpandRatio, voronoiEnableExpand,
    clipBoundaryConfig, showClipBoundaryModal, showImportBoundaryModal, showRiverImportModal,
    isRiverImporting, importBoundaryConfig, highPrecisionEnabled, isBoundaryOptionsLoading,
    showImageExportModal, showImagePreviewModal, imageExportSettings, imageExportViewState,
    // Computeds
    isVillageDataSource, addDialectPartitionOptions, customPointsByPartition,
    fieldMergeEntries, hasFieldMerge, hasVoronoiCustomImport, voronoiCustomImportSummaryText,
    voronoiTotalPointCount, voronoiOfficialPointCount, voronoiCustomPointCount,
    voronoiActivePointCount, voronoiGroupCount, voronoiPanelOffsetMode,
    voronoiSelectionOptions, voronoiColorMap, voronoiExportGroups,
    selectedVoronoiExportCount, isVoronoiExportSelectionFull, showVoronoiExportProgressOverlay,
    boundaryOptionsMap, clipBoundarySummary,
    // Functions
    loadVoronoiPoints, ensureVoronoiPointsLoaded, clearVoronoiCustomImport,
    clearVoronoiPreviewState, syncVoronoiPartitionPoints, normalizeVoronoiPoints,
    setVoronoiStatus, previewVoronoiPoints, handleBuildVoronoi,
    exportVoronoiToLayer, toggleVoronoiExportSelection, confirmVoronoiExport,
    handleVoronoiIgnoreConfirm, openVoronoiIgnoreModal, refreshVoronoiPreview,
    handleVoronoiCustomImportConfirm, handleVoronoiFileChange, handleVoronoiPreviewReset,
    handleVoronoiPreviewConfirm, triggerVoronoiFileImport, consumeVillageVoronoiPayload,
    updateFieldMerge, resetFieldMerge, initFieldMergeMap,
    toggleAddDialectPoints, confirmAddDialectPartition, deleteCustomPointsByPartition,
    handleMapClickForAddPoint, handleOpenClipBoundary, handleClipBoundaryConfirm,
    onAdminBoundaryClicked, onRiverImportClicked,
    handleImageExported, handleLayerExported, handleConfirmImageExport,
    handleImagePreviewExported, handleExportImage,
    loadProvincesGeoJson, loadCitiesGeoJson, loadCountiesGeoJson,
    loadNationalBorderFeatureCollection, loadBorderFeatureCollection,
    restoreVoronoiConfig,
  };
}
