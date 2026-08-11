<template>
  <section class="toponym-distribution-chart">
    <div
      ref="chartEl"
      class="toponym-distribution-chart__canvas"
      role="img"
      :aria-label="t('villages.pages.toponyms.chart.ariaLabel')"
    />
    <div
      v-if="statusText"
      class="toponym-distribution-chart__status"
    >
      {{ statusText }}
    </div>

    <AppModal
      v-model="showConfigModal"
      :title="t('villages.pages.toponyms.chart.configTitle')"
      size="sm"
    >
      <section class="chart-config">
        <fieldset class="chart-config__group">
          <legend>{{ t('villages.pages.toponyms.chart.configPointStyle') }}</legend>

          <label class="chart-config__field">
            <span>{{ t('villages.pages.toponyms.chart.configSize') }}</span>
            <input
              v-model.number="pointConfig.size"
              class="glass-range"
              type="range"
              min="1"
              max="20"
              step="1"
              :style="{ '--glass-range-progress': (((pointConfig.size - 1) / 19) * 100) + '%' }"
            >
            <small>{{ pointConfig.size }}px</small>
          </label>

          <label class="chart-config__field">
            <span>{{ t('villages.pages.toponyms.chart.configShape') }}</span>
            <SimpleSelectDropdown
              :model-value="pointConfig.shape"
              :options="pointShapeOptions"
              match-trigger-width
              @update:model-value="pointConfig.shape = $event"
            />
          </label>
        </fieldset>

        <fieldset class="chart-config__group">
          <ToponymLayerControls
            :layer-state="layerState"
            :loading-layers="loadingLayers"
            :layer-errors="layerErrors"
            @toggle-layer="emit('toggle-layer', $event)"
          />
        </fieldset>
      </section>
    </AppModal>
  </section>
</template>

<script setup>
import * as echarts from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';
import ToponymLayerControls from './ToponymLayerControls.vue';
import {
  buildBoundaryLineSeriesData,
  buildRiverLineSeriesData,
  extractToponymPointFromChartParams,
  findNearestToponymPoint,
} from './toponymsChartData.js';

const COUNTRY_MAP_NAME = 'toponyms-country';
const BOUNDARY_LAYER_KEYS = ['provinces', 'cities'];
const TOPONYM_LARGE_RENDER_THRESHOLD = 2000;
const POINT_COLOR_TOKEN = '--color-primary';
const POINT_CLICK_FILTER = {
  seriesType: 'scatter',
};
const POINT_SHAPE_OPTIONS = [
  { value: 'rect', label: '▬' },
  { value: 'circle', label: '●' },
  { value: 'roundRect', label: '▭' },
  { value: 'triangle', label: '▲' },
  { value: 'diamond', label: '◆' },
  { value: 'pin', label: '📍' },
  { value: 'arrow', label: '➤' },
];

const pointShapeOptions = computed(() => POINT_SHAPE_OPTIONS);

const props = defineProps({
  countryLayer: {
    type: Object,
    default: null,
  },
  loadedLayers: {
    type: Object,
    default: () => ({}),
  },
  layerState: {
    type: Object,
    default: () => ({}),
  },
  loadingLayers: {
    type: Object,
    default: () => ({}),
  },
  layerErrors: {
    type: Object,
    default: () => ({}),
  },
  scatterData: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  hasSearched: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-point', 'toggle-layer']);
const { t } = useI18n();
const chartEl = ref(null);
const showConfigModal = ref(false);
let chartInstance = null;
let resizeObserver = null;
const registeredLayers = new Set();

const pointConfig = reactive({
  size: 6,
  shape: 'rect',
});

const statusText = computed(() => {
  if (props.error) return props.error;
  if (!props.countryLayer) return t('villages.pages.toponyms.chart.countryLoading');
  if (props.loading) return t('villages.pages.toponyms.results.loading');
  if (!props.hasSearched) return t('villages.pages.toponyms.chart.searchFirst');
  if (!props.scatterData.length) return t('villages.pages.toponyms.chart.noDrawablePoints');
  return '';
});

onMounted(async () => {
  await nextTick();
  initChart();
  renderChart();
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  if (chartInstance) {
    chartInstance.off('click', handleChartClick);
    chartInstance.dispose();
    chartInstance = null;
  }
});

watch(
  () => [
    props.countryLayer,
    props.scatterData,
    props.loadedLayers,
    props.layerState,
    props.loading,
    props.error,
  ],
  () => {
    renderChart();
  },
  { deep: true }
);

watch(
  pointConfig,
  () => {
    renderChart();
  },
);

function initChart() {
  if (!chartEl.value || chartInstance) return;

  chartInstance = echarts.init(chartEl.value, null, {
    renderer: 'canvas',
    useDirtyRect: true,
  });
  chartInstance.on('click', handleChartClick);

  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize();
  });
  resizeObserver.observe(chartEl.value);
}

function renderChart() {
  if (!chartInstance || !props.countryLayer) return;

  if (!registeredLayers.has(COUNTRY_MAP_NAME)) {
    echarts.registerMap(COUNTRY_MAP_NAME, props.countryLayer);
    registeredLayers.add(COUNTRY_MAP_NAME);
  }

  const option = {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: buildTooltipOption(),
    geo: {
      map: COUNTRY_MAP_NAME,
      roam: true,
      silent: true,
      zoom: 1.18,
      scaleLimit: {
        min: 0.4,
        max: 28,
      },
      itemStyle: {
        areaColor: cssToken('--surface-panel-subtle'),
        borderColor: cssToken('--border-control'),
        borderWidth: 1,
      },
      emphasis: {
        disabled: true,
      },
    },
    series: [
      ...buildBoundarySeries(),
      ...buildRiverSeries(),
      buildPointSeries(),
    ],
  };

  chartInstance.setOption(option, {
    notMerge: false,
    replaceMerge: ['series'],
    lazyUpdate: false,
  });
}

function buildBoundarySeries() {
  return BOUNDARY_LAYER_KEYS
    .filter((key) => props.layerState[key] && props.loadedLayers[key])
    .map((key) => ({
      id: `toponym-${key}`,
      name: t(`villages.pages.toponyms.layers.${key}`),
      type: 'lines',
      coordinateSystem: 'geo',
      polyline: true,
      silent: true,
      z: key === 'provinces' ? 2 : 3,
      data: buildBoundaryLineSeriesData(props.loadedLayers[key]),
      lineStyle: {
        color: cssToken(key === 'provinces' ? '--border-medium' : '--border-control'),
        opacity: key === 'provinces' ? 0.65 : 0.55,
        width: key === 'provinces' ? 1.2 : 0.7,
      },
    }));
}

function buildRiverSeries() {
  return ['riverL1', 'riverL2', 'riverL3']
    .filter((key) => props.layerState[key] && props.loadedLayers[key])
    .map((key, index) => ({
      id: `toponym-${key}`,
      name: t(`villages.pages.toponyms.layers.${key}`),
      type: 'lines',
      coordinateSystem: 'geo',
      polyline: true,
      silent: true,
      z: 8 + index,
      data: buildRiverLineSeriesData(props.loadedLayers[key]),
      lineStyle: {
        color: cssToken('--color-primary'),
        opacity: key === 'riverL1' ? 0.5 : 0.32,
        width: key === 'riverL1' ? 1.1 : 0.8,
      },
    }));
}

function buildPointSeries() {
  return {
    id: 'toponym-points',
    name: t('villages.pages.toponyms.chart.pointsSeries'),
    type: 'scatter',
    coordinateSystem: 'geo',
    z: 20,
    data: props.scatterData,
    symbol: pointConfig.shape,
    symbolSize: pointConfig.size,
    large: true,
    largeThreshold: TOPONYM_LARGE_RENDER_THRESHOLD,
    progressive: 0,
    progressiveThreshold: Number.MAX_SAFE_INTEGER,
    itemStyle: {
      color: cssToken(POINT_COLOR_TOKEN),
      opacity: 0.72,
    },
    emphasis: {
      disabled: true,
    },
  };
}

function buildTooltipOption() {
  return {
    trigger: 'item',
    triggerOn: 'click',
    confine: true,
    textStyle: {
      color: cssToken('--text-deep'),
    },
    formatter(params) {
      if (params.seriesType !== 'scatter') return params.seriesName || '';
      const point = extractToponymPointFromChartParams(params);
      if (!point) return '';
      return t('villages.pages.toponyms.chart.pointTooltip');
    },
  };
}

function handleChartClick(params) {
  if (params?.seriesType !== POINT_CLICK_FILTER.seriesType) return;
  let point = extractToponymPointFromChartParams(params);
  if (!point) {
    const rawData = params?.data;
    const fallbackTarget = Array.isArray(rawData) && rawData.length >= 2
      ? rawData.slice(0, 2)
      : (Array.isArray(rawData?.value) ? rawData.value.slice(0, 2) : null);
    if (fallbackTarget) {
      point = findNearestToponymPoint(props.scatterData, fallbackTarget, 0.12);
    }
  }
  if (!point) return;
  const eventPosition = params.event?.event
    ? {
        clientX: params.event.event.clientX,
        clientY: params.event.event.clientY,
      }
    : null;
  emit('select-point', { ...point, eventPosition });
}

function cssToken(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

defineExpose({ showConfigModal });
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-distribution-chart {
  position: relative;
  width: 100%;
  min-block-size: 68dvh;

  &__canvas {
    width: 100%;
    min-block-size: 68dvh;
  }

  &__status {
    @include flex-center;
    position: absolute;
    inset: 0;
    margin: auto;
    max-inline-size: 340px;
    block-size: fit-content;
    padding: 8px 10px;
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm2);
    background: var(--surface-panel-strong);
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
    text-align: center;
    pointer-events: none;
  }
}

.chart-config {
  @include flex-col;
  gap: 18px;

  &__group {
    border: 0;
    margin: 0;
    padding: 0;

    legend {
      padding: 0;
      margin-block-end: 10px;
      color: var(--text-deep);
      font-size: 14px;
      font-weight: 600;
    }
  }

  &__field {
    display: flex;
    align-items: center;
    gap: 10px;
    min-block-size: 36px;

    & + & {
      margin-block-start: 8px;
    }

    > span:first-child {
      min-inline-size: 60px;
      color: var(--text-secondary);
      font-size: 13px;
    }

    .glass-range {
      flex: 1;
      margin: 0;
    }

    small {
      min-inline-size: 32px;
      color: var(--text-tertiary);
      font-size: 12px;
      text-align: end;
    }
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .toponym-distribution-chart {
    min-block-size: 54dvh;

    &__canvas {
      min-block-size: 54dvh;
    }
  }
}
</style>
