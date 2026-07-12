<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    width="90vw"
    max-height="90dvh"
    :close-on-backdrop="false"
    @update:modelValue="handleVisibleChange"
  >
    <template #header>
      <div class="entry-modal-header">
        <div style="justify-content: space-between; display: flex">
          <h3 class="entry-modal-title">
            {{ t('customEntry.modal.title') }}
          </h3>
          <!-- <span class="entry-modal-dev-badge">{{ t('customEntry.modal.devNotice') }}</span> -->
        </div>
        <div
          class="entry-modal-mode-switcher"
          role="group"
          :aria-label="t('customEntry.modal.modeGroupLabel')"
        >
          <button
            class="entry-mode-button"
            :class="{ active: activeMode === 'point' }"
            type="button"
            @click="activeMode = 'point'"
          >
            {{ t('customEntry.modal.modes.point') }}
          </button>
          <button
            class="entry-mode-button"
            :class="{ active: activeMode === 'feature' }"
            type="button"
            @click="activeMode = 'feature'"
          >
            {{ t('customEntry.modal.modes.feature') }}
          </button>
        </div>
        <button
          class="close-btn close-btn-lg close-btn-inline"
          type="button"
          :aria-label="t('customEntry.modal.close')"
          @click="closeModal"
        >
          ×
        </button>
      </div>
    </template>

    <KeepAlive>
      <PointCentricMode v-if="activeMode === 'point'" :key="`point-${modalSessionKey}`" />
      <FeatureCentricMode v-else :key="`feature-${modalSessionKey}`" />
    </KeepAlive>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import PointCentricMode from './point/PointCentricMode.vue';
import FeatureCentricMode from './feature/FeatureCentricMode.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();
const activeMode = ref('point');
const modalSessionKey = ref(0);

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleVisibleChange = (value) => {
  emit('update:modelValue', value);
};

watch(
  () => props.modelValue,
  (visible, prev) => {
    if (prev && !visible) {
      activeMode.value = 'point';
      modalSessionKey.value += 1;
    }
  }
);
</script>

<style scoped lang="scss">
@use '../_map-variables' as *;

.entry-modal-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    gap: 12px;

    .entry-modal-mode-switcher {
      grid-row: 2;
      grid-column: 1 / -1;
      justify-content: center;
      width: 100%;
    }

    .entry-mode-button {
      flex: 1;
      min-width: 0;
      text-align: center;
    }
  }
}

.entry-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: $text-strong;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.entry-modal-dev-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(var(--color-warning-rgb), 0.12);
  color: $warning-dark;
  border: 1px solid rgba(var(--color-warning-rgb), 0.24);
  white-space: nowrap;
}

.entry-modal-subtitle {
  grid-column: 1 / 2;
  font-size: 13px;
  color: $text-muted;
}

.entry-modal-mode-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: var(--radius-pill);
  background: rgba(var(--bg-blue-tint-rgb), 0.96);

  .entry-mode-button {
    min-width: 128px;
    padding: 8px 14px;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: $text-secondary;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      color 0.18s ease,
      box-shadow 0.18s ease;

    &.active {
      background: var(--text-white);
      color: $primary;
      box-shadow: 0 8px 16px $bg-subtle;
    }
  }
}

.entry-modal-empty {
  padding: 36px 24px;
  border-radius: 18px;
  text-align: center;
  background: $glass-strong;

  &-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  &-title {
    font-size: 18px;
    font-weight: 700;
    color: $text-strong;
  }

  &-text {
    max-width: 520px;
    margin: 12px auto 0;
    font-size: 14px;
    line-height: 1.7;
    color: $text-secondary;
  }
}
</style>
