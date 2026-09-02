<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :title="t('map.drawTab.voronoi.exportModalTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="voronoi-export-modal">
      <div class="feature-scope-summary glass-subpanel">
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.voronoi.partitionGroups') }}</span>
          <span class="summary-value summary-number">{{ groups.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.voronoi.exportSelectedCount') }}</span>
          <span class="summary-value summary-number">{{ selectedCount }}/{{ exportLimit }}</span>
        </div>
        <div class="summary-actions">
          <button
            class="pill-btn scope-clear-btn summary-action-button"
            type="button"
            @click="emit('clear-selection')"
          >
            {{ t('map.drawTab.voronoi.clearSelection') }}
          </button>
          <button
            class="pill-btn summary-action-button"
            style="background: rgba(var(--color-success-rgb), 0.3);"
            type="button"
            @click="emit('open-clip-boundary')"
          >
            {{ clipBoundarySummary }}
          </button>
        </div>
      </div>

      <section class="scope-panel glass-subpanel voronoi-export-list-panel">
        <div v-if="groups.length === 0" class="feature-scope-state main-list-state">
          <div class="main-list-state-title">{{ t('map.drawTab.voronoi.exportListEmpty') }}</div>
        </div>
        <div v-else class="voronoi-export-list">
          <CheckBox
            v-for="group in groups"
            :key="group.key"
            class="scope-checkbox-item voronoi-export-item"
            :class="{ 'is-disabled': !selectedKeys.includes(group.key) && isSelectionFull }"
            :model-value="selectedKeys.includes(group.key)"
            :disabled="!selectedKeys.includes(group.key) && isSelectionFull"
            @update:modelValue="emit('toggle-selection', group.key)"
          >
            <span class="scope-selection-copy voronoi-export-item-copy">
              <span class="scope-selection-title">{{ group.name }}</span>
              <span class="scope-selection-meta">{{ t('map.drawTab.voronoi.exportLayerMeta', { count: group.pointCount }) }}</span>
            </span>
          </CheckBox>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="glass-button" type="button" @click="handleClose(false)">
          {{ t('map.drawTab.buttons.cancel') }}
        </button>
        <button
          class="glass-button scope-confirm-btn"
          data-variant="primary"
          type="button"
          :disabled="selectedCount === 0 || isExporting"
          @click="emit('confirm')"
        >
          {{ isExporting ? t('map.drawTab.buttons.voronoiRunning') : t('map.drawTab.voronoi.confirmExport') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
  selectedKeys: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 },
  exportLimit: { type: Number, default: 20 },
  isSelectionFull: { type: Boolean, default: false },
  clipBoundaryConfig: { type: Object, default: () => ({ enabled: false, level: 'country', selectedNames: [] }) },
  clipBoundarySummary: { type: String, default: '' },
  isExporting: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'toggle-selection',
  'clear-selection',
  'confirm',
  'open-clip-boundary',
])

const { t } = useI18n()

function handleClose(value = false) {
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.voronoi-export-modal {
  @include flex-col;
  gap: 14px;
}

.feature-scope-summary,
.voronoi-export-toolbar,
.voronoi-export-hint,
.voronoi-export-list-panel,
.voronoi-export-list {
  min-width: 0;
}

.feature-scope-summary {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 10px;
  padding: 14px 16px;
  overflow-x: auto;

  @media (max-width: 760px) {
    flex-wrap: wrap;
  }

  .summary-item {
    flex: 1 1 0;
    @include flex-col;
    gap: 2px;
  }

  .summary-actions {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    flex: 0 0 auto;

    @media (max-width: 760px) {
      width: 100%;
      margin-left: 0;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 10px;
    }
  }

  .summary-action-button {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .summary-label {
    font-size: 11px;
    color: $text-muted;
  }

  .summary-value {
    font-size: 14px;
    font-weight: 700;
    color: $text-strong;
  }

  .summary-number {
    color: $primary;
  }
}

.scope-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;

  &-main {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  &-info {
    font-size: 12px;
    color: $text-secondary;
    font-weight: 700;
  }
}

/* 清空选择: 仅尺寸/颜色覆盖, 视觉见 main/_buttons.scss 的 .pill-btn */
.scope-clear-btn {
  --pill-btn-padding: 9px 14px;
  --pill-btn-font-size: 12px;
  --pill-btn-font-weight: 700;
  --pill-btn-border: 1px solid rgba(var(--color-error-light-rgb), 0.28);
  --pill-btn-bg: var(--bg-error-light);
  --pill-btn-color: var(--color-error-dark);
  --pill-btn-shadow: 0 8px 18px rgba(var(--color-error-light-rgb), 0.14);
  --pill-btn-hover-bg: rgba(var(--color-error-rgb), 0.08);
  --pill-btn-hover-border: rgba(var(--color-error-rgb), 0.38);
  --pill-btn-hover-shadow: 0 10px 22px rgba(var(--color-error-light-rgb), 0.18);
}

.voronoi-export-hint {
  padding: 10px 14px;
  font-size: 11px;
  line-height: 1.55;
  color: $text-muted;
}

.scope-panel {
  @include flex-col;
  gap: 10px;
  min-height: 240px;
  max-height: 360px;
  overflow: auto;
  padding: 14px 16px;

  @media (max-width: 760px) {
    min-height: 220px;
    max-height: 320px;
  }
}

.voronoi-export-list {
  @include flex-col;
  gap: 8px;
}

.scope-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid $muted-hover;
  background: $glass-heavy;

  input {
    margin-top: 2px;
    accent-color: $primary;
  }
}

.voronoi-export-item {
  &.is-disabled {
    opacity: 0.55;
  }

  &-copy {
    min-width: 0;
    flex: 1;
    display: flex;
    gap: 10px;
  }
}

.scope-selection-copy {
  min-width: 0;

  .scope-selection-title {
    font-size: 13px;
    font-weight: 700;
    color: $text-strong;
    white-space: nowrap;
  }

  .scope-selection-meta {
    font-size: 11px;
    color: $text-muted;
    white-space: nowrap;
  }
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
