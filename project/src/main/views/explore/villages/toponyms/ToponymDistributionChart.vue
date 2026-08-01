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
  </section>
</template>

<script setup>
import * as echarts from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  buildRiverLineSeriesData,
  extractToponymPointFromChartParams,
} from './toponymsChartData.js';

const COUNTRY_MAP_NAME = 'toponyms-country';
const LAYER_MAP_NAMES = {
  provinces: 'toponyms-provinces',
  cities: 'toponyms-cities',
};
const POINT_CLICK_FILTER = {
  seriesType: 'scatter',
};

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

const emit = defineEmits(['select-point']);
const { t } = useI18n();
const chartEl = ref(null);
let chartInstance = null;
let resizeObserver = null;
const registeredLayers = new Set();

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

function initChart() {
  if (!chartEl.value || chartInstance) return;

  chartInstance = echarts.init(chartEl.value);
  chartInstance.on('click', handleChartClick);

  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize();
  });
  resizeObserver.observe(chartEl.value);
}

function renderChart() {
  if (!chartInstance || !props.countryLayer) return;

  registerCountryMap();
  registerOptionalMapLayers();

  chartInstance.setOption(
    {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: buildTooltipOption(),
      geo: {
        map: COUNTRY_MAP_NAME,
        roam: true,
        silent: false,
        zoom: 1.18,
        scaleLimit: {
          min: 0.8,
          max: 18,
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
        ...buildMapOverlaySeries(),
        ...buildRiverSeries(),
        buildPointSeries(),
      ],
    },
    true
  );
}

function registerCountryMap() {
  if (!props.countryLayer || registeredLayers.has(COUNTRY_MAP_NAME)) return;
  echarts.registerMap('toponyms-country', props.countryLayer);
  registeredLayers.add(COUNTRY_MAP_NAME);
}

function registerOptionalMapLayers() {
  for (const [key, mapName] of Object.entries(LAYER_MAP_NAMES)) {
    const layer = props.loadedLayers[key];
    if (!props.layerState[key] || !layer) continue;
    registerMapLayer(mapName, layer);
  }
}

function registerMapLayer(mapName, geoJson) {
  if (!geoJson || registeredLayers.has(mapName)) return;
  echarts.registerMap(mapName, geoJson);
  registeredLayers.add(mapName);
}

function buildMapOverlaySeries() {
  return Object.entries(LAYER_MAP_NAMES)
    .filter(([key]) => props.layerState[key] && props.loadedLayers[key])
    .map(([key, mapName]) => ({
      id: `toponym-${key}`,
      name: t(`villages.pages.toponyms.layers.${key}`),
      type: 'map',
      map: mapName,
      roam: false,
      silent: true,
      z: key === 'provinces' ? 2 : 3,
      itemStyle: {
        areaColor: cssToken('--glass-05'),
        borderColor: cssToken(key === 'provinces' ? '--border-control' : '--border-glass'),
        borderWidth: key === 'provinces' ? 1 : 0.6,
      },
      emphasis: {
        disabled: true,
      },
      data: [],
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
        opacity: key === 'riverL1' ? 0.56 : 0.32,
        width: key === 'riverL1' ? 1.4 : 0.8,
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
    symbolSize: getPointSize(),
    large: props.scatterData.length > 2000,
    largeThreshold: 2000,
    itemStyle: {
      color: cssToken('--color-primary'),
      opacity: 0.72,
      borderColor: cssToken('--surface-panel-strong'),
      borderWidth: 0.5,
    },
    emphasis: {
      scale: true,
      itemStyle: {
        color: cssToken('--color-primary-hover'),
        opacity: 0.95,
      },
    },
  };
}

function buildTooltipOption() {
  return {
    trigger: 'item',
    confine: true,
    textStyle: {
      color: cssToken('--text-deep'),
    },
    formatter(params) {
      if (params.seriesType !== 'scatter') return params.seriesName || '';
      const point = extractToponymPointFromChartParams(params);
      if (!point) return '';
      return [
        t('villages.pages.toponyms.chart.pointTooltip'),
        point.id,
        point.coordinates.map((value) => Number(value).toFixed(6)).join(', '),
      ].join('<br>');
    },
  };
}

function getPointSize() {
  if (props.scatterData.length > 50000) return 3;
  if (props.scatterData.length > 10000) return 4;
  return 6;
}

function handleChartClick(params) {
  if (params?.seriesType !== POINT_CLICK_FILTER.seriesType) return;
  const point = extractToponymPointFromChartParams(params);
  if (!point) return;
  emit('select-point', point);
}

function cssToken(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
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
    position: absolute;
    inset-block-start: 14px;
    inset-inline-start: 14px;
    max-inline-size: 340px;
    padding: 8px 10px;
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm2);
    background: var(--surface-panel-strong);
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
    pointer-events: none;
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
