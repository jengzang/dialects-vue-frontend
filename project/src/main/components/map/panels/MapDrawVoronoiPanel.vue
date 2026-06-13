<template>
  <Transition name="draw-panel-slide">
    <aside
      v-show="isOpen"
      class="draw-tool-panel main-glass-panel voronoi-panel"
      :class="offsetClass"
    >
      <div class="draw-tool-panel-header">
        <div>
          <div class="draw-tool-panel-title">
            {{ t('map.drawTab.buttons.voronoi') }}
          </div>
          <div class="draw-tool-panel-subtitle">
            {{ t('map.drawTab.voronoi.panelHint') }}
          </div>
        </div>
      </div>

      <div class="draw-tool-panel-body">
        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.voronoi.summaryTitle') }}
          </div>
          <div class="voronoi-summary-grid">
            <div class="voronoi-summary-card">
              <span class="voronoi-summary-label">{{ t('map.drawTab.voronoi.totalPoints') }}</span>
              <strong class="voronoi-summary-value">{{ totalPoints }}</strong>
            </div>
            <div class="voronoi-summary-card">
              <span class="voronoi-summary-label">{{ t('map.drawTab.voronoi.activePoints') }}</span>
              <strong class="voronoi-summary-value">{{ activePoints }}</strong>
            </div>
            <div class="voronoi-summary-card">
              <span class="voronoi-summary-label">{{ t('map.drawTab.voronoi.ignoredPoints') }}</span>
              <strong class="voronoi-summary-value">{{ ignoredCount }}</strong>
            </div>
            <div class="voronoi-summary-card">
              <span class="voronoi-summary-label">{{ t('map.drawTab.voronoi.partitionGroups') }}</span>
              <strong class="voronoi-summary-value">{{ groupCount }}</strong>
            </div>
          </div>
        </section>

        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.voronoi.settingsTitle') }}
          </div>
          <div class="draw-basemap-select">
            <span class="draw-field-label">{{ t('map.divideTab.labels.partitionSource') }}</span>
            <SimpleSelectDropdown
              :model-value="partitionMode"
              :options="partitionModeOptions"
              @update:model-value="$emit('update:partition-mode', $event)"
            />
          </div>
          <div class="draw-basemap-select">
            <span class="draw-field-label">{{ t('map.divideTab.labels.regionLevel') }}</span>
            <SimpleSelectDropdown
              :model-value="regionLevel"
              :options="regionLevelOptions"
              @update:model-value="$emit('update:region-level', $event)"
            />
          </div>
        </section>

        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.voronoi.actionsTitle') }}
          </div>
          <div class="draw-tool-button-grid">
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="isLoadingPoints"
              @click="$emit('load-points')"
            >
              {{ isLoadingPoints ? t('map.drawTab.voronoi.loadingPoints') : t('map.drawTab.voronoi.loadPoints') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              @click="$emit('open-ignore-modal')"
            >
              {{ t('map.drawTab.voronoi.ignorePointsAction') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!activePoints"
              @click="$emit('preview-points')"
            >
              {{ t('map.drawTab.voronoi.previewPoints') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="primary"
              type="button"
              :disabled="!activePoints || isCalculating"
              @click="$emit('calculate')"
            >
              {{ isCalculating ? t('map.drawTab.buttons.voronoiRunning') : t('map.drawTab.voronoi.calculate') }}
            </button>
          </div>
          <div v-if="statusText" class="draw-style-hint">
            {{ statusText }}
          </div>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  totalPoints: { type: Number, default: 0 },
  activePoints: { type: Number, default: 0 },
  ignoredCount: { type: Number, default: 0 },
  groupCount: { type: Number, default: 0 },
  partitionMode: { type: String, default: 'map' },
  regionLevel: { type: Number, default: 3 },
  isLoadingPoints: { type: Boolean, default: false },
  isCalculating: { type: Boolean, default: false },
  statusText: { type: String, default: '' },
  offsetMode: { type: String, default: 'none' },
})

defineEmits([
  'update:partition-mode',
  'update:region-level',
  'load-points',
  'open-ignore-modal',
  'preview-points',
  'calculate',
])

const { t } = useI18n()

const partitionModeOptions = computed(() => [
  { label: t('map.divideTab.options.mapPartition'), value: 'map' },
  { label: t('map.divideTab.options.yindianPartition'), value: 'yindian' },
])

const regionLevelOptions = computed(() => [
  { label: t('map.divideTab.options.level1'), value: 1 },
  { label: t('map.divideTab.options.level2'), value: 2 },
  { label: t('map.divideTab.options.level3'), value: 3 },
])

const offsetClass = computed(() => {
  if (props.offsetMode === 'double') {
    return { 'offset-double': true }
  }
  if (props.offsetMode === 'single') {
    return { 'offset-left': true }
  }
  return {}
})
</script>

<style scoped lang="scss">
@use './panelShared';

.voronoi-panel.offset-double {
  right: 47rem;
}

.voronoi-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.voronoi-summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.8rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.55);
}

.voronoi-summary-label {
  font-size: 0.78rem;
  color: rgba(11, 37, 64, 0.68);
}

.voronoi-summary-value {
  font-size: 1.08rem;
  color: #0b2540;
}

@media (max-width: 900px) {
  .voronoi-panel.offset-double,
  .voronoi-panel.offset-left {
    right: auto;
  }

  .voronoi-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
