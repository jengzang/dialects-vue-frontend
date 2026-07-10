<template>
  <div class="tab-switcher">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      @click="$emit('update:modelValue', tab.value)"
      :class="{ active: modelValue === tab.value }"
      class="tab-button"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>


$primary-blue: var(--color-primary);
$text-color: var(--text-dark);
$border-color: var(--border-gray);
$switcher-background: #f0f0f5;
$white: #fff;
$transition-duration: 0.25s;
$mobile-aspect-ratio: 1 / 1;

.tab-switcher {
  display: inline-flex;
  padding: 4px;
  background-color: $switcher-background;
  border: 1px solid $border-color;
  border-radius: 12px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    gap: 8px;
  }
}

.tab-button {
  padding: 10px 16px;
  color: $text-color;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  background: none;
  border: none;
  border-radius: 10px;
  transition: all $transition-duration ease;

  &:hover {
    background-color: rgba(0, 122, 255, 0.1);
  }

  &.active {
    color: $primary-blue;
    font-weight: 600;
    background-color: $white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    padding: 12px 6px;
  }
}

