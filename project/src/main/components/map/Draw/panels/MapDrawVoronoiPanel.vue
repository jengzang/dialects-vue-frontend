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
          <a
            class="voronoi-learn-link"
            href="https://zhuanlan.zhihu.com/p/985825588"
            target="_blank"
            rel="noopener"
          >{{ t('map.drawTab.voronoi.learnMore') }}</a>
        </div>
      </div>

      <div class="draw-tool-panel-body">

        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            {{ t('map.drawTab.voronoi.dataSourceTitle') }}
          </div>
          <div class="voronoi-data-source-actions">
            <button
              class="main-glass-button"
              :data-variant="hasCustomImport ? 'primary' : 'secondary'"
              type="button"
              @click="$emit('open-custom-import')"
            >
              {{ hasCustomImport
                ? t('map.drawTab.voronoi.customImport.actions.replace')
                : t('map.drawTab.voronoi.customImport.actions.selectFile') }}
            </button>
            <button
              v-if="hasCustomImport"
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              @click="$emit('clear-custom-import')"
            >
              {{ t('map.drawTab.voronoi.customImport.actions.clear') }}
            </button>
          </div>
          <div class="voronoi-data-source-toggles">
            <CheckBox
              :model-value="useOfficialData"
              @update:model-value="$emit('update:use-official-data', $event)"
            >
              {{ t('map.drawTab.voronoi.useOfficialData') }}
            </CheckBox>
          </div>
          <div class="voronoi-source-summary-grid">
            <div class="voronoi-summary-card">
              <span class="voronoi-summary-label">{{ t('map.drawTab.voronoi.officialPoints') }}</span>
              <strong class="voronoi-summary-value">{{ officialPointCount }}</strong>
            </div>
            <div class="voronoi-summary-card">
              <span class="voronoi-summary-label">{{ t('map.drawTab.voronoi.customPoints') }}</span>
              <strong class="voronoi-summary-value">{{ customPointCount }}</strong>
            </div>
          </div>
          <div v-if="customImportSummary" class="draw-style-hint">
            {{ customImportSummary }}
          </div>
        </section>

        <section v-if="!isVillageDataSource" class="draw-tool-section">
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
            {{ t('map.drawTab.voronoi.actionsTitle') }}
          </div>
          <div class="draw-tool-button-grid">
            <button
              v-if="hasFieldMerge"
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              @click="$emit('open-field-merge')"
            >
              {{ t('map.drawTab.voronoi.fieldMergeOpenButton') }}
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
              class="main-glass-button draw-tool-mode-button"
              :data-variant="isPointsPreviewActive ? 'primary' : 'secondary'"
              :data-active="isPointsPreviewActive"
              type="button"
              :disabled="!activePoints"
              @click="$emit('preview-points')"
            >
              <span
                v-if="isPointsPreviewActive"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
              {{ t('map.drawTab.voronoi.previewPoints') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              type="button"
              :disabled="!activePoints"
              @click="$emit('export-layer')"
            >
              {{ t('map.drawTab.voronoi.exportToLayer') }}
            </button>
            <button
              class="main-glass-button draw-tool-mode-button"
              :data-variant="isPolygonPreviewActive ? 'primary' : 'secondary'"
              :data-active="isPolygonPreviewActive"
              type="button"
              :disabled="!activePoints || isCalculating"
              @click="$emit('calculate')"
            >
              <span
                v-if="isPolygonPreviewActive"
                class="draw-tool-check"
                aria-hidden="true"
              >✓</span>
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
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  totalPoints: { type: Number, default: 0 },
  activePoints: { type: Number, default: 0 },
  ignoredCount: { type: Number, default: 0 },
  groupCount: { type: Number, default: 0 },
  partitionMode: { type: String, default: 'yindian' },
  regionLevel: { type: Number, default: 1 },
  isLoadingPoints: { type: Boolean, default: false },
  isCalculating: { type: Boolean, default: false },
  statusText: { type: String, default: '' },
  isPointsPreviewActive: { type: Boolean, default: false },
  isPolygonPreviewActive: { type: Boolean, default: false },
  offsetMode: { type: String, default: 'none' },
  useOfficialData: { type: Boolean, default: true },
  hasCustomImport: { type: Boolean, default: false },
  officialPointCount: { type: Number, default: 0 },
  customPointCount: { type: Number, default: 0 },
  customImportSummary: { type: String, default: '' },
  isVillageDataSource: { type: Boolean, default: false },
  hasFieldMerge: { type: Boolean, default: false },
})

defineEmits([
  'update:partition-mode',
  'update:region-level',
  'update:use-official-data',
  'open-custom-import',
  'clear-custom-import',
  'open-ignore-modal',
  'preview-points',
  'export-layer',
  'calculate',
  'open-field-merge',
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
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

@use './panelShared';

.voronoi-learn-link {
  display: inline-block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.voronoi-panel {
  &.offset-double {
    right: 47rem;
  }
}

.voronoi-summary-grid,
.voronoi-source-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.voronoi-data-source-actions {
  align-items: center;
  justify-content: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.voronoi-data-source-toggles {
  margin-top: 0.85rem;
}

.voronoi-summary-card {
  @include flex-col;
  gap: 0.25rem;
  padding: 0.8rem;
  border-radius: 14px;
  background: var(--glass-50);
  border: 1px solid var(--glass-60);

  .voronoi-summary-label {
    font-size: 0.78rem;
    color: rgba(var(--text-deep-rgb), 0.68);
  }

  .voronoi-summary-value {
    font-size: 1.08rem;
    color: $deep-blue;
  }
}

@media (max-width: 900px) {
  .voronoi-panel {
    &.offset-double,
    &.offset-left {
      right: auto;
    }
  }
}
</style>
