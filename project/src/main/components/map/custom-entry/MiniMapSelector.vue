<template>
  <div class="mini-map-wrapper" :class="wrapperClass">
    <div ref="mapContainer" class="mini-map-container"></div>
    <div v-if="mode === 'picker' && !readonly" class="mini-map-hint">
      {{ resolvedHintText }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyle } from '@/utils/map/MapSource.js';

const DEFAULT_CENTER = [113.2644, 23.1291];

const props = defineProps({
  coord: {
    type: Array,
    default: null,
  },
  points: {
    type: Array,
    default: () => [],
  },
  visible: {
    type: Boolean,
    default: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'picker',
  },
  hintText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:coord']);
const { t } = useI18n();

const mapContainer = ref(null);
const mapInstance = ref(null);
const pointMarkers = [];
let pickedMarker = null;

const wrapperClass = computed(() => ({
  'is-readonly': props.readonly,
  'is-picker': props.mode === 'picker',
  'is-multi': props.mode === 'multi-preview',
}));

const resolvedHintText = computed(() => props.hintText || t('customEntry.miniMap.defaultHint'));

const normalizedPoints = computed(() => {
  if (props.mode === 'multi-preview') {
    return props.points.map((point) => normalizePoint(point)).filter(Boolean);
  }

  const singleCoord = normalizeCoord(props.coord);
  if (!singleCoord) return [];

  return [
    {
      coord: singleCoord,
      label: Array.isArray(props.points) && props.points[0]?.label ? props.points[0].label : '',
      active: true,
    },
  ];
});

function normalizeCoord(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function normalizePoint(point) {
  if (!point) return null;
  const coord = normalizeCoord(point.coord || point.coordinates || [point.lng, point.lat]);
  if (!coord) return null;
  return {
    coord,
    label: point.label || point.name || '',
    active: Boolean(point.active),
  };
}

function createMap() {
  if (!mapContainer.value || mapInstance.value || !props.visible) return;

  const initialCoord = normalizeCoord(props.coord);
  mapInstance.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle('gaode'),
    center: initialCoord || DEFAULT_CENTER,
    zoom: initialCoord ? 9.5 : 5.5,
    attributionControl: false,
  });

  mapInstance.value.addControl(new maplibregl.NavigationControl(), 'top-left');

  mapInstance.value.on('load', () => {
    renderMarkers();
    fitToMarkers();
  });

  if (props.mode === 'picker' && !props.readonly) {
    mapInstance.value.on('click', (event) => {
      const nextCoord = [event.lngLat.lng, event.lngLat.lat];
      placePickedMarker(nextCoord);
      emit('update:coord', nextCoord);
    });
  }
}

function clearPointMarkers() {
  pointMarkers.splice(0).forEach((marker) => marker.remove());
}

function createPointElement(point) {
  if (point.label) {
    const element = document.createElement('div');
    element.className = `mini-map-point-label${point.active ? ' is-active' : ''}`;
    element.textContent = point.label;
    return element;
  }

  const element = document.createElement('div');
  element.className = `mini-map-point${point.active ? ' is-active' : ''}`;
  return element;
}

function renderMarkers() {
  if (!mapInstance.value) return;

  clearPointMarkers();

  normalizedPoints.value.forEach((point) => {
    if (props.mode === 'picker' && !props.readonly) {
      placePickedMarker(point.coord);
      return;
    }

    const element = createPointElement(point);
    const marker = new maplibregl.Marker({
      element: element,
      anchor: point.label ? 'center' : 'bottom',
    })
      .setLngLat(point.coord)
      .addTo(mapInstance.value);

    pointMarkers.push(marker);
  });
}

function placePickedMarker(coord) {
  if (!mapInstance.value || !coord) return;

  if (pickedMarker) {
    pickedMarker.remove();
  }

  const element = document.createElement('div');
  element.className = 'mini-map-pin';

  pickedMarker = new maplibregl.Marker({
    element,
    anchor: 'center',
  })
    .setLngLat(coord)
    .addTo(mapInstance.value);
}

function fitToMarkers() {
  if (!mapInstance.value) return;

  const coords = [];
  if (props.mode === 'picker') {
    const coord = normalizeCoord(props.coord);
    if (coord) coords.push(coord);
  } else {
    normalizedPoints.value.forEach((point) => coords.push(point.coord));
  }

  if (coords.length === 0) return;

  if (coords.length === 1) {
    mapInstance.value.flyTo({ center: coords[0], zoom: 9.5 });
    return;
  }

  const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
  coords.slice(1).forEach((coord) => bounds.extend(coord));
  mapInstance.value.fitBounds(bounds, { padding: 50, maxZoom: 9.5, duration: 0 });
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible && !mapInstance.value) {
      await nextTick();
      createMap();
    }

    if (visible && mapInstance.value) {
      await nextTick();
      mapInstance.value.resize();
      renderMarkers();
      fitToMarkers();
    }
  },
  { immediate: true }
);

watch(
  () => props.coord,
  (coord) => {
    if (!mapInstance.value) return;
    if (props.mode === 'picker') {
      const nextCoord = normalizeCoord(coord);
      if (nextCoord) {
        placePickedMarker(nextCoord);
        mapInstance.value.easeTo({
          center: nextCoord,
          duration: 0,
        });
      }
    } else {
      renderMarkers();
      fitToMarkers();
    }
  },
  { deep: true }
);

watch(
  normalizedPoints,
  () => {
    if (!mapInstance.value) return;

    if (props.mode === 'picker') return;

    renderMarkers();
    fitToMarkers();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  createMap();
});

onBeforeUnmount(() => {
  clearPointMarkers();
  if (pickedMarker) {
    pickedMarker.remove();
    pickedMarker = null;
  }
  mapInstance.value?.remove();
  mapInstance.value = null;
});
</script>

<style scoped lang="scss">
@use '@/styles/main/_surfaces.scss';

.mini-map-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.mini-map-container {
  width: 100%;
  height: 100%;
}

.mini-map-hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #475569;
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
}

:deep(.maplibregl-ctrl-top-left) {
  top: 8px;
  left: 8px;
}

:deep(.maplibregl-ctrl-group) {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

:deep(.maplibregl-canvas) {
  border-radius: 14px;
}

:deep(.mini-map-pin) {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007aff;
  border: 3px solid #fff;
  box-shadow:
    0 0 0 3px rgba(0, 122, 255, 0.25),
    0 8px 16px rgba(0, 122, 255, 0.28);
}

:deep(.mini-map-point) {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #34c759;
  border: 2px solid #fff;
  box-shadow: 0 6px 14px rgba(52, 199, 89, 0.28);

  &.is-active {
    background: #007aff;
    box-shadow: 0 8px 18px rgba(0, 122, 255, 0.34);
  }
}

:deep(.mini-map-point-label) {
  padding: 2px 4px;
  border-radius: 4px;
  background-color: #1b2e2b;
  color: #a6ffdc;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(114, 124, 245, 0.5);
  font-family: 'SimHei', '黑体', sans-serif;
  cursor: pointer;
  text-align: center;

  &.is-active {
    background-color: #007aff;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.5);
  }
}

@media (max-width: 768px) {
  .mini-map-wrapper {
    height: 220px;
  }

  .mini-map-hint {
    right: 8px;
    bottom: 8px;
    font-size: 11px;
  }
}
</style>
