<template>
  <div class="result-view-switcher ui-tabs-navigation ui-tabs-navigation--segmented" role="group" :aria-label="t('words.wordList.viewModes.label')">
    <button
      v-for="mode in modes"
      :key="mode.value"
      class="mode-button ui-tab-item"
      :class="{ active: modelValue === mode.value }"
      type="button"
      :aria-label="t(`${labelPrefix}.${mode.value}`)"
      :title="t(`${labelPrefix}.${mode.value}`)"
      :aria-pressed="modelValue === mode.value"
      @click="emit('update:modelValue', mode.value)"
    >
      <component :is="mode.icon" :size="16" aria-hidden="true" />
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

.mode-button.ui-tab-item {
  @include flex-center;
  gap: 6px;
  min-height: 32px;
  padding: 6px 10px;
}

@media (max-aspect-ratio: 1 / 1) {
  .mode-button.ui-tab-item {
    width: 32px;
    padding: 0;
  }

  .mode-label {
    display: none;
  }
}
</style>
