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

<style scoped>
.card-group {
  display: flex;
  flex-direction: row;
  border-radius: 12px;
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
  max-height: 45px;
  box-shadow: var(--shadow-md);
}

.card-group-item {
  padding: 10px 16px;
  flex: 1;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  user-select: none;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--color-primary-medium);
  border-right-color: var(--border-gray-medium);
  border-left-color: var(--border-gray-medium);
  transition: background 0.2s ease;
  white-space: nowrap;
  /* overflow: hidden; */
  text-overflow: ellipsis;
}

.card-group-item:hover:not(.disabled) {
  background: var(--glass-medium);
}

.card-group-item.disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.card-group-item.first {
  border-radius: 12px 0 0 12px;
  border-left-color: var(--color-primary-medium);
}

.card-group-item.last {
  border-radius: 0 12px 12px 0;
  border-right-color: var(--color-primary-medium);
}

.card-group-item.active {
  background: var(--color-primary-medium);
  color: var(--color-primary);
  font-weight: 600;
}

.card-group-item.active:hover:not(.disabled) {
  background: var(--color-primary-medium2);
}

@media (max-aspect-ratio: 1/1) {
  .card-group-item {
    padding: 12px 12px;
  }
}
</style>
