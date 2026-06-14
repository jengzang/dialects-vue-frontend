<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :title="t('map.drawTab.voronoi.exportModalTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="voronoi-export-modal">
      <div class="feature-scope-summary main-glass-panel-inner">
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
            class="scope-clear-btn summary-action-button"
            data-variant="danger"
            type="button"
            @click="emit('clear-selection')"
          >
            {{ t('map.drawTab.voronoi.clearSelection') }}
          </button>
          <label class="scope-toggle-label summary-toggle-label">
            <input
              :checked="clipToNationalBorder"
              type="checkbox"
              @change="emit('update:clip-to-national-border', $event.target.checked)"
            >
            <span>{{ t('map.drawTab.voronoi.clipToNationalBorder') }}</span>
          </label>
        </div>
      </div>

      <section class="scope-panel main-glass-panel-inner voronoi-export-list-panel">
        <div v-if="groups.length === 0" class="feature-scope-state main-list-state">
          <div class="main-list-state-title">{{ t('map.drawTab.voronoi.exportListEmpty') }}</div>
        </div>
        <div v-else class="voronoi-export-list">
          <label
            v-for="group in groups"
            :key="group.key"
            class="scope-checkbox-item voronoi-export-item"
            :class="{ 'is-disabled': !selectedKeys.includes(group.key) && isSelectionFull }"
          >
            <input
              :checked="selectedKeys.includes(group.key)"
              :disabled="!selectedKeys.includes(group.key) && isSelectionFull"
              type="checkbox"
              @change="emit('toggle-selection', group.key)"
            >
            <span class="scope-selection-copy voronoi-export-item-copy">
              <span class="scope-selection-title">{{ group.name }}</span>
              <span class="scope-selection-meta">{{ t('map.drawTab.voronoi.exportLayerMeta', { count: group.pointCount }) }}</span>
            </span>
          </label>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="main-glass-button" type="button" @click="handleClose(false)">
          {{ t('map.drawTab.buttons.cancel') }}
        </button>
        <button
          class="main-glass-button scope-confirm-btn"
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

defineProps({
  modelValue: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
  selectedKeys: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 },
  exportLimit: { type: Number, default: 20 },
  isSelectionFull: { type: Boolean, default: false },
  clipToNationalBorder: { type: Boolean, default: false },
  isExporting: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:clip-to-national-border',
  'toggle-selection',
  'clear-selection',
  'confirm',
])

const { t } = useI18n()

function handleClose(value = false) {
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
.voronoi-export-modal {
  display: flex;
  flex-direction: column;
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
}

.summary-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.summary-action-button {
  flex: 0 0 auto;
  white-space: nowrap;
}

.summary-toggle-label {
  flex: 0 0 auto;
  white-space: nowrap;
}

.summary-label {
  font-size: 11px;
  color: #64748b;
}

.summary-value {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.summary-number {
  color: #007aff;
}

.scope-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
}

.scope-toolbar-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.scope-toolbar-info {
  font-size: 12px;
  color: #475569;
  font-weight: 700;
}

.scope-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #334155;
}

.scope-toggle-label input {
  margin: 0;
  accent-color: #007aff;
}

.scope-clear-btn {
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(254, 226, 226, 0.92);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  padding: 9px 14px;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(239, 68, 68, 0.14);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.scope-clear-btn:hover {
  background: rgba(254, 202, 202, 0.98);
  border-color: rgba(220, 38, 38, 0.38);
  box-shadow: 0 10px 22px rgba(239, 68, 68, 0.18);
  transform: translateY(-1px);
}

.scope-clear-btn:active {
  transform: translateY(0);
}

.voronoi-export-hint {
  padding: 10px 14px;
  font-size: 11px;
  line-height: 1.55;
  color: #64748b;
}

.scope-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 240px;
  max-height: 360px;
  overflow: auto;
  padding: 14px 16px;
}

.voronoi-export-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scope-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.9);
}

.scope-checkbox-item input {
  margin-top: 2px;
  accent-color: #007aff;
}

.voronoi-export-item.is-disabled {
  opacity: 0.55;
}

.voronoi-export-item-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  gap: 10px;
}

.scope-selection-copy {
  min-width: 0;
}

.scope-selection-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}

.scope-selection-meta {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 760px) {
  .feature-scope-summary {
    flex-wrap: wrap;
  }

  .summary-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px;
  }

  .scope-panel {
    min-height: 220px;
    max-height: 320px;
  }
}
</style>
