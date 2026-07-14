<template>
  <button
    :class="['btn-action', variant]"
    :disabled="disabled || loading"
    @click="$emit('click')"
    class="action-button"
  >
    <span v-if="loading" class="ui-loading--inline" aria-hidden="true">↻</span>
    <slot v-else></slot>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'danger', 'info', 'yellow', 'teal'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use 'sass:map';

$transition-duration: 0.3s;
$mobile-aspect-ratio: 1;

$solid-variants: (
  'blue': (
    background: #007aff,
    hover: #0051d5
  ),
  'green': (
    background: #28a745,
    hover: #1f8a36
  ),
  'danger': (
    background: darkred,
    hover: #a91f1f
  ),
  'yellow': (
    background: #f39c12,
    hover: #e67e22
  )
);

$gradient-variants: (
  'info': (
    background: linear-gradient(135deg, #667eea, #764ba2),
    hover: linear-gradient(135deg, #5568d3, #5f3d8a)
  ),
  'teal': (
    background: linear-gradient(135deg, #5ac8fa, #4a9fd8),
    hover: linear-gradient(135deg, #4ab8e8, #3a8fc6)
  )
);

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 180px;
  margin: 0 auto;
  padding: 14px 18px;
  color: var(--action-primary-text);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all $transition-duration ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    padding: 12px 20px;
    font-size: 18px;
  }
}

.btn-action {
  @each $name, $colors in $solid-variants {
    &.#{$name} {
      background-color: map.get($colors, background);

      &:hover:not(:disabled) {
        background-color: map.get($colors, hover);
      }
    }
  }

  @each $name, $colors in $gradient-variants {
    &.#{$name} {
      background: map.get($colors, background);

      &:hover:not(:disabled) {
        background: map.get($colors, hover);
      }
    }
  }

  &.yellow {
    color: var(--text-white);
  }

  &.teal {
    box-shadow: 0 4px 12px rgba(90, 200, 250, 0.3);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 16px rgba(90, 200, 250, 0.4);
    }
  }
}
</style>
