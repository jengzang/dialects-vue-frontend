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

<style scoped>
.tab-switcher {
  display: inline-flex;
  border: 1px solid #d0d0d0;
  border-radius: 12px;
  padding: 4px;
  background-color: #f0f0f5;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.tab-button {
  appearance: none;
  background: none;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.25s ease;
  color: #333;
  font-weight: 500;
}

.tab-button:hover {
  background-color: rgba(0, 122, 255, 0.1);
}

.tab-button.active {
  background-color: white;
  color: #007aff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

/* Mobile responsive */
@media (max-aspect-ratio: 1/1) {
  .tab-switcher {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
