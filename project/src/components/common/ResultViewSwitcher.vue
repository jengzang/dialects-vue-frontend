<template>
  <div class="result-view-switcher" :class="originalAppearance ? 'ui-tabs-navigation ui-tabs-navigation--segmented' : 'view-mode-selector'" role="group" :aria-label="t('words.wordList.viewModes.label')">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :class="[originalAppearance ? 'mode-button ui-tab-item' : 'mode-btn', { active: modelValue === mode.value }]"
      type="button"
      :aria-label="t(`${labelPrefix}.${mode.value}`)"
      :title="t(`${labelPrefix}.${mode.value}`)"
      :aria-pressed="modelValue === mode.value"
      @click="emit('update:modelValue', mode.value)"
    >
      <component :is="mode.icon" v-if="originalAppearance" :size="16" aria-hidden="true" />
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <template v-if="mode.value === 'table'">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="9" x2="9" y2="21" />
          <line x1="15" y1="9" x2="15" y2="21" />
        </template>
        <template v-else-if="mode.value === 'card'">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </template>
        <template v-else>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </template>
      </svg>
      <span class="mode-label">{{ t(`${labelPrefix}.${mode.value}`) }}</span>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { PhTable, PhSquaresFour, PhMapPin } from '@phosphor-icons/vue'

defineProps({
  modelValue: { type: String, default: 'card' },
  labelPrefix: { type: String, default: 'words.wordList.viewModes' },
  originalAppearance: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const modes = [
  { value: 'table', icon: PhTable },
  { value: 'card', icon: PhSquaresFour },
  { value: 'map', icon: PhMapPin },
]
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.result-view-switcher {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  padding: 4px;
}

.result-view-switcher.view-mode-selector {
  background: var(--glass-60);
  border: 0.5px solid var(--glass-80);
  border-radius: var(--radius-md);
  box-shadow:
    0 4px 24px rgba(var(--color-shadow-rgb), 0.06),
    0 2px 6px rgba(var(--color-shadow-rgb), 0.04),
    inset 0 1px 0 var(--glass-90);
  @include glass-blur(30px, 180%);
}

.mode-button.ui-tab-item {
  @include flex-center;
  gap: 6px;
  min-height: 32px;
  padding: 6px 10px;
}

.mode-btn {
  @include flex-center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  color: var(--text-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(.active) {
    color: var(--text-primary);
    background: rgba(var(--color-shadow-rgb), 0.04);
  }

  &.active {
    color: var(--color-primary);
    background: var(--glass-50);
    box-shadow:
      0 1px 3px rgba(var(--color-shadow-rgb), 0.08),
      0 1px 2px rgba(var(--color-shadow-rgb), 0.06);

    :root[data-color-theme='green'] &,
    :root[data-color-theme='dark'] & {
      color: var(--text-primary);
      background: var(--surface-panel-strong);
    }
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .mode-btn,
  .mode-button.ui-tab-item {
    width: 32px;
    padding: 0;
  }

  .mode-label {
    display: none;
  }
}
</style>
