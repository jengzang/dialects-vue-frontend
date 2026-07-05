<template>
  <div class="vml-glass-panel region-selector-panel">
    <h3 class="panel-title">
      區域選擇
      <HelpIcon
        content="選擇分析區域（市/縣/鎮），系統將計算該字符在各區域的TF-IDF傾向性得分。支持三級行政區切換"
        size="md"
        fontSize="16px"
        trigger="both"
      />
    </h3>

    <FilterableSelect
      v-model="localName"
      :level="localLevel"
      @update:level="handleLevelChange"
      @update:modelValue="handleNameChange"
      @update:hierarchy="(h) => localHierarchy = h"
      placeholder="請選擇或輸入區域"
    />

    <button class="analyze-button solid-button" @click="handleAnalyze" :disabled="!localName">
      🔍 開始分析
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { villagesMLStore } from '@/VillagesML/store/villagesMLStore.js'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'

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
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.analyze-button {
  padding: 12px 24px;
  white-space: nowrap;
  flex-shrink: 0;
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-aspect-ratio: 1/1) {
  .region-selector-panel {
    flex-direction: row;
    align-items: center;
  }
}

@media (max-aspect-ratio: 1/1) {
  .region-selector-panel {
    gap: 16px;
  }
}
</style>
