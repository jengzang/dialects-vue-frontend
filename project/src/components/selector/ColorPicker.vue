<template>
  <input
    class="color-picker"
    type="color"
    :value="modelValue || '#ffffff'"
    :aria-label="label"
    :title="label"
    :style="{ '--picker-size': `${size}px` }"
    @input="$emit('update:modelValue', $event.target.value)"
  >
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '#ffffff' },
  label: { type: String, required: true },
  size: { type: Number, default: 32 },
})
defineEmits(['update:modelValue'])
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.color-picker {
  flex: 0 0 auto;
  width: var(--picker-size);
  height: var(--picker-size);
  padding: 0;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: var(--radius-full);
  box-shadow: 0 0 0 1px var(--bg-hover-strong), var(--shadow-sm);
  transition: transform 0.2s ease;
  appearance: none;

  &:hover { transform: scale(1.1); }

  &::-webkit-color-swatch-wrapper { padding: 0; }
  &::-webkit-color-swatch {
    border: 2px solid var(--text-white);
    border-radius: var(--radius-full);
  }
  &::-moz-color-swatch {
    border: 2px solid var(--text-white);
    border-radius: var(--radius-full);
  }
}
</style>
