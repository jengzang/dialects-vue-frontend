<template>
  <div class="card-group choice-selector" role="tablist" :aria-label="ariaLabel">
    <div
      v-for="(option, index) in options"
      :key="option.value"
      class="card-group-item choice-selector-item"
      :class="{
        active: modelValue === option.value,
        first: index === 0,
        last: index === options.length - 1,
        disabled
      }"
      role="tab"
      :tabindex="disabled ? -1 : 0"
      :aria-selected="modelValue === option.value"
      :aria-disabled="disabled"
      @click="handleSelect(option.value)"
      @keydown.enter.prevent="handleSelect(option.value)"
      @keydown.space.prevent="handleSelect(option.value)"
    >
      {{ option.label }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  ariaLabel: {
    type: String,
    default: 'Choice selector'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

function handleSelect(value) {
  if (props.disabled || props.modelValue === value) {
    return
  }
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$group-radius: 12px;
$transition-fast: 0.2s ease;

.card-group {
  display: flex;
  flex-direction: row;
  width: fit-content;
  max-width: 100%;
  max-height: 45px;
  overflow: hidden;
  border-radius: $group-radius;
  box-shadow: var(--shadow-md);
}

.card-group-item {
  flex: 1;
  padding: 10px 16px;
  color: inherit;
  font-size: inherit;
  font-weight: 500;
  line-height: inherit;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--color-primary-medium);
  border-right-color: var(--border-gray-medium);
  border-left-color: var(--border-gray-medium);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: background $transition-fast;

  /* overflow: hidden; */

  &:hover:not(.disabled) {
    background: var(--glass-60);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &.first {
    border-left-color: var(--color-primary-medium);
    border-radius: $group-radius 0 0 $group-radius;
  }

  &.last {
    border-right-color: var(--color-primary-medium);
    border-radius: 0 $group-radius $group-radius 0;
  }

  &.active {
    color: var(--color-primary);
    font-weight: 600;
    background: var(--color-primary-medium);

    &:hover:not(.disabled) {
      background: var(--color-primary-medium2);
    }
  }

  @media (max-aspect-ratio: 1/1) {
    padding: 12px;
  }
}
</style>
