<template>
  <div class="region-selector-panel glass-panel">
    <div class="panel-header">
      <h3 class="panel-title">區域選擇</h3>
      <button class="analyze-button solid-button" @click="handleAnalyze" :disabled="!localName">
        🔍 開始分析
      </button>
    </div>

    <div class="selector-group">
      <FilterableSelect
        v-model="localName"
        :level="localLevel"
        @update:level="handleLevelChange"
        @update:modelValue="handleNameChange"
        @update:hierarchy="(h) => localHierarchy = h"
        placeholder="請選擇或輸入區域"
      />

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import FilterableSelect from '@/components/common/FilterableSelect.vue'

const emit = defineEmits(['analyze'])

const localLevel = ref(villagesMLStore.regionLevel)
const localName = ref(villagesMLStore.regionName)
const localHierarchy = ref({ city: null, county: null, township: null })

const handleLevelChange = (newLevel) => {
  localLevel.value = newLevel
  localName.value = ''
  villagesMLStore.regionLevel = newLevel
}

const handleNameChange = () => {
  villagesMLStore.regionName = localName.value
}

const handleAnalyze = () => {
  if (!localName.value) return
  emit('analyze', {
    level: localLevel.value,
    name: localName.value,
    hierarchy: localHierarchy.value
  })
}
</script>

<style scoped>
.region-selector-panel {
  padding: 20px;
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analyze-button {
  padding: 12px 24px;
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
