<template>
  <div v-if="showLegend" class="map-legend">
    <div class="legend-title">{{ legendTitle }}</div>
    <div class="legend-items">
      <div
        v-for="item in legendItems"
        :key="item.label"
        class="legend-item"
      >
        <div
          class="legend-color"
          :style="{ backgroundColor: item.color }"
        ></div>
        <span class="legend-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mapStore } from '@/main/store/store.js'

const { t } = useI18n()

const showLegend = computed(() => mapStore.mode === 'compare')

const legendTitle = computed(() => {
  if (!mapStore.compareType) return t('map.legend.title')

  const typeMap = {
    'chars': t('map.legend.compareTypes.chars'),
    'zhonggu': t('map.legend.compareTypes.zhonggu'),
    'tones': t('map.legend.compareTypes.tones')
  }

  return typeMap[mapStore.compareType] || t('map.legend.title')
})

const legendItems = computed(() => {
  if (!mapStore.compareGroups) return []

  return Object.entries(mapStore.compareGroups).map(([key, value]) => ({
    label: value.label,
    color: value.color
  }))
})
</script>

<style lang="scss" scoped>
.map-legend {
  position: absolute;
  bottom: 30px;
  right: 20px;
  background: var(--glass-90);
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  border-radius: var(--radius-sm2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.legend-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.legend-items {
  @include flex-col;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.legend-label {
  font-size: 13px;
  color: var(--text-medium);
}
</style>
