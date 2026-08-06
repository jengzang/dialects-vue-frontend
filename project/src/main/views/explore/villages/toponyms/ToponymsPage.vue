<template>
  <main class="toponyms-page glass-container glass-container-shell">
    <section class="toponyms-page__hero">
      <h1>{{ t('villages.pages.toponyms.title') }}</h1>
      <p>{{ t('villages.pages.toponyms.subtitle') }}</p>
    </section>

    <section class="toponyms-page__controls main-glass-panel">
      <div class="toponyms-page__controls-inner main-glass-panel-inner">
        <ToponymSearchBar
          v-model:query="query"
          v-model:match-mode="matchMode"
          v-model:place-type-code="placeTypeCode"
          v-model:point-limit="pointLimit"
          :loading="pointsLoading"
          @search="handleSearch"
        />
        <ToponymLayerControls
          :layer-state="layerState"
          :loading-layers="loadingLayers"
          :layer-errors="layerErrors"
          @toggle-layer="handleToggleLayer"
        />
      </div>
    </section>

    <section class="toponyms-page__body">
      <div class="toponyms-page__chart main-glass-panel">
        <div class="toponyms-page__chart-inner main-glass-panel-inner">
          <ToponymDistributionChart
            :country-layer="countryLayer"
            :loaded-layers="loadedLayers"
            :layer-state="layerState"
            :scatter-data="scatterData"
            :loading="pointsLoading"
            :error="countryError || pointsError"
            :has-searched="hasSearched"
            @select-point="handleSelectPoint"
          />
        </div>
      </div>

      <ToponymResultsPanel
        :has-searched="hasSearched"
        :loading="pointsLoading"
        :error="pointsError"
        :point-count="pointCount"
        :scatter-count="scatterData.length"
        :truncated="pointsTruncated"
        :suggestions="suggestions"
        :suggestions-loading="suggestionsLoading"
        :suggestions-error="suggestionsError"
        :selected-point="selectedPoint"
        :local-detail="selectedLocalDetail"
        :local-loading="detailsLoading"
        :local-error="detailsError"
        :official-detail="officialDetail"
        :official-loading="officialLoading"
        :official-error="officialError"
        @select-suggestion="handleSelectSuggestion"
        @request-official-detail="handleOfficialDetailRequest"
      />
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  getToponymDetails,
  getToponymNames,
  getToponymOfficialDetail,
  getToponymPoints,
} from '@/api';
import ToponymLayerControls from './ToponymLayerControls.vue';
import ToponymDistributionChart from './ToponymDistributionChart.vue';
import ToponymResultsPanel from './ToponymResultsPanel.vue';
import ToponymSearchBar from './ToponymSearchBar.vue';
import { buildToponymScatterData } from './toponymsChartData.js';
import { getDefaultToponymsLayerState, loadToponymsGisAsset } from './toponymsGisAssets.js';

const { t } = useI18n();

const query = ref('');
const matchMode = ref('prefix');
const placeTypeCode = ref('22200');
const pointLimit = ref(5000);
const hasSearched = ref(false);

const suggestions = ref([]);
const suggestionsLoading = ref(false);
const suggestionsError = ref('');
const suggestionRequestId = ref(0);
let suggestionTimer = null;

const pointRows = ref([]);
const pointCount = ref(0);
const pointsTruncated = ref(false);
const pointsLoading = ref(false);
const pointsError = ref('');
const pointsRequestId = ref(0);

const selectedPoint = ref(null);
const selectedLocalDetail = ref(null);
const detailsLoading = ref(false);
const detailsError = ref('');
const detailsRequestId = ref(0);

const officialDetail = ref(null);
const officialLoading = ref(false);
const officialError = ref('');
let officialAbortController = null;

const layerState = reactive(getDefaultToponymsLayerState());
const loadedLayers = reactive({});
const loadingLayers = reactive({});
const layerErrors = reactive({});
const layerRequestIds = reactive({});
const countryError = ref('');

const scatterData = computed(() => buildToponymScatterData(pointRows.value));
const countryLayer = computed(() => loadedLayers.country || null);

onMounted(() => {
  loadCountryLayer();
});

onBeforeUnmount(() => {
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }

  if (officialAbortController) {
    officialAbortController.abort();
  }
});

watch([query, matchMode, placeTypeCode], () => {
  scheduleSuggestionLoad();
});

async function loadCountryLayer() {
  loadingLayers.country = true;
  layerErrors.country = '';
  countryError.value = '';

  try {
    loadedLayers.country = await loadToponymsGisAsset('country');
  } catch (error) {
    countryError.value = error.message || t('villages.pages.toponyms.errors.countryLayer');
    layerErrors.country = countryError.value;
  } finally {
    loadingLayers.country = false;
  }
}

function scheduleSuggestionLoad() {
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }

  const keyword = query.value.trim();
  if (!keyword) {
    suggestions.value = [];
    suggestionsError.value = '';
    suggestionsLoading.value = false;
    return;
  }

  suggestionTimer = setTimeout(() => {
    loadSuggestions(keyword);
  }, 280);
}

async function loadSuggestions(keyword) {
  const requestId = suggestionRequestId.value + 1;
  suggestionRequestId.value = requestId;
  suggestionsLoading.value = true;
  suggestionsError.value = '';

  try {
    const payload = await getToponymNames({
      q: keyword,
      match_mode: matchMode.value,
      place_type_code: placeTypeCode.value,
      limit: 20,
    });

    if (requestId !== suggestionRequestId.value) return;
    suggestions.value = payload.items.filter((item) => typeof item === 'string');
  } catch (error) {
    if (requestId !== suggestionRequestId.value) return;
    suggestions.value = [];
    suggestionsError.value = error.message || t('villages.pages.toponyms.errors.suggestions');
  } finally {
    if (requestId === suggestionRequestId.value) {
      suggestionsLoading.value = false;
    }
  }
}

async function handleSearch() {
  const keyword = query.value.trim();
  hasSearched.value = true;
  pointsError.value = '';
  selectedPoint.value = null;
  selectedLocalDetail.value = null;
  detailsError.value = '';
  officialDetail.value = null;
  officialError.value = '';

  if (!keyword) {
    pointRows.value = [];
    pointCount.value = 0;
    pointsTruncated.value = false;
    pointsError.value = t('villages.pages.toponyms.errors.emptyQuery');
    return;
  }

  const requestId = pointsRequestId.value + 1;
  pointsRequestId.value = requestId;
  pointsLoading.value = true;

  try {
    const payload = await getToponymPoints({
      q: keyword,
      match_mode: matchMode.value,
      place_type_code: placeTypeCode.value,
      limit: pointLimit.value,
    });

    if (requestId !== pointsRequestId.value) return;
    pointRows.value = payload.items;
    pointCount.value = payload.count;
    pointsTruncated.value = payload.truncated;
  } catch (error) {
    if (requestId !== pointsRequestId.value) return;
    pointRows.value = [];
    pointCount.value = 0;
    pointsTruncated.value = false;
    pointsError.value = error.message || t('villages.pages.toponyms.errors.points');
  } finally {
    if (requestId === pointsRequestId.value) {
      pointsLoading.value = false;
    }
  }
}

function handleSelectSuggestion(name) {
  query.value = name;
  handleSearch();
}

async function handleSelectPoint(point) {
  const id = String(point?.id || '').trim();
  if (!id) return;

  selectedPoint.value = {
    id,
    coordinates: Array.isArray(point.coordinates) ? point.coordinates : point.value || [],
  };
  selectedLocalDetail.value = null;
  detailsError.value = '';
  officialDetail.value = null;
  officialError.value = '';

  const requestId = detailsRequestId.value + 1;
  detailsRequestId.value = requestId;
  detailsLoading.value = true;

  try {
    const payload = await getToponymDetails(id);
    if (requestId !== detailsRequestId.value) return;
    selectedLocalDetail.value = payload.items[0] || null;
  } catch (error) {
    if (requestId !== detailsRequestId.value) return;
    detailsError.value = error.message || t('villages.pages.toponyms.errors.details');
  } finally {
    if (requestId === detailsRequestId.value) {
      detailsLoading.value = false;
    }
  }
}

async function handleOfficialDetailRequest() {
  const id = selectedPoint.value?.id || selectedLocalDetail.value?.id;
  if (!id) return;

  if (officialAbortController) {
    officialAbortController.abort();
  }

  officialAbortController = new AbortController();
  officialLoading.value = true;
  officialError.value = '';
  officialDetail.value = null;

  try {
    officialDetail.value = await getToponymOfficialDetail(id, {
      signal: officialAbortController.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') return;
    officialError.value = error.message || t('villages.pages.toponyms.errors.official');
  } finally {
    officialLoading.value = false;
  }
}

async function handleToggleLayer({ key, visible }) {
  if (key === 'country') return;

  layerState[key] = visible;
  layerErrors[key] = '';

  if (!visible || loadedLayers[key]) {
    return;
  }

  const requestId = (layerRequestIds[key] || 0) + 1;
  layerRequestIds[key] = requestId;
  loadingLayers[key] = true;

  try {
    const layer = await loadToponymsGisAsset(key);
    if (layerRequestIds[key] !== requestId || !layerState[key]) return;
    loadedLayers[key] = layer;
  } catch (error) {
    if (layerRequestIds[key] !== requestId) return;
    layerState[key] = false;
    layerErrors[key] = error.message || t('villages.pages.toponyms.errors.optionalLayer');
  } finally {
    if (layerRequestIds[key] === requestId) {
      loadingLayers[key] = false;
    }
  }
}

</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponyms-page {
  @include flex-col;
  gap: 16px;
  width: 100%;
  min-height: 70dvh;
  padding: 20px;

  &__hero {
    @include flex-col;
    gap: 6px;

    h1,
    p {
      margin: 0;
    }

    h1 {
      color: var(--text-deep);
      font-size: 26px;
      line-height: 1.25;
    }

    p {
      max-inline-size: 760px;
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.6;
    }
  }

  &__controls {
    width: 100%;
  }

  &__controls-inner {
    @include flex-col;
    gap: 14px;
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 16px;
    align-items: stretch;
  }

  &__chart {
    min-block-size: 68dvh;
  }

  &__chart-inner {
    min-block-size: 68dvh;
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .toponyms-page {
    padding: 14px;

    &__body {
      grid-template-columns: 1fr;
    }

    &__chart,
    &__chart-inner {
      min-block-size: 54dvh;
    }
  }
}
</style>
