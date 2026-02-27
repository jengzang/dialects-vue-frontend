<template>
  <div class="setting-row">
    <label class="setting-label">聚類算法</label>
    <div class="setting-control">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="setting-select"
      >
        <option value="kmeans">K-Means</option>
        <option value="dbscan">DBSCAN</option>
        <option value="gmm">GMM</option>
      </select>
      <span class="setting-hint">{{ algorithmHint }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

defineEmits(['update:modelValue'])

const algorithmHint = computed(() => {
  switch (props.modelValue) {
    case 'kmeans':
      return '需指定聚類數量 k，適合球形聚類'
    case 'dbscan':
      return '基於密度的聚類，自動發現聚類數量'
    case 'gmm':
      return '高斯混合模型，支持橢圓形聚類'
    default:
      return ''
  }
})
</script>

<style scoped>
.setting-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.setting-label {
  min-width: 100px;
  font-weight: 500;
  color: var(--text-primary);
  padding-top: 0.5rem;
}

.setting-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-select {
  padding: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-select:hover {
  border-color: var(--primary-color);
}

.setting-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.setting-hint {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}
</style>
