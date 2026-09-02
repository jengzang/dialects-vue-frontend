<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    :title="t('map.drawTab.buttons.riverImport')"
    @update:modelValue="handleClose"
  >
    <div class="river-import-modal">
      <p class="river-import-desc">{{ t('map.drawTab.buttons.riverImportDesc') }}</p>
      <div class="river-import-list">
        <CheckBox
          v-for="level in riverLevels"
          :key="level.key"
          class="river-import-item"
          :model-value="selected.includes(level.key)"
          @update:model-value="(checked) => handleToggle(level.key, checked)"
        >
          <span class="river-import-item-label">{{ level.label }}</span>
          <span class="river-import-item-meta">{{ level.meta }}</span>
        </CheckBox>
      </div>
    </div>

    <template #footer>
      <div class="river-import-footer">
        <button
          class="glass-button"
          type="button"
          @click="handleClose"
        >
          {{ t('map.drawTab.buttons.cancel') }}
        </button>
        <button
          class="glass-button"
          data-variant="primary"
          type="button"
          :disabled="selected.length === 0 || importing"
          @click="handleConfirm"
        >
          {{ importing ? t('map.drawTab.buttons.voronoiRunning') : t('map.drawTab.voronoi.clipBoundaryConfirmImport') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import CheckBox from '@/components/selector/CheckBox.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  importing: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'confirm']);
const { t } = useI18n();

const selected = ref([]);

const riverLevels = computed(() => [
  { key: 'riverL1', label: t('map.drawTab.voronoi.clipBoundaryLevelRiverL1'), meta: '430KB' },
  { key: 'riverL2', label: t('map.drawTab.voronoi.clipBoundaryLevelRiverL2'), meta: '317KB' },
  { key: 'riverL3', label: t('map.drawTab.voronoi.clipBoundaryLevelRiverL3'), meta: '482KB' },
]);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      selected.value = [];
    }
  },
);

function handleToggle(key, checked) {
  if (checked) {
    selected.value = [...selected.value, key];
  } else {
    selected.value = selected.value.filter((item) => item !== key);
  }
}

function handleClose() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  emit('confirm', [...selected.value]);
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.river-import-modal {
  @include flex-col;
  gap: 14px;
}

.river-import-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.river-import-list {
  @include flex-col;
  gap: 8px;
}

.river-import-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  background: var(--glass-50);
  font-size: 14px;

  &:hover {
    background: var(--glass-60);
  }

  .river-import-item-label {
    color: var(--text-deep);
    font-weight: 600;
    flex: 1;
  }

  .river-import-item-meta {
    color: var(--text-tertiary);
    font-size: 12px;
  }
}

.river-import-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
