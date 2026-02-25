<template>
  <div class="pattern-structural-page">
    <h3 class="villagesml-subtab-title">模式分析 - 結構分析</h3>

    <div class="glass-panel">
      <h2>🏗️ 模式結構分析</h2>

      <!-- Controls -->
      <div class="controls">
        <select v-model="patternType" class="select-input">
          <option value="">全部類型</option>
          <option value="prefix">前綴模式</option>
          <option value="suffix">後綴模式</option>
          <option value="compound">複合模式</option>
        </select>
        <button
          class="query-button"
          :disabled="loading"
          @click="loadStructuralAnalysis"
        >
          查詢
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <!-- Results -->
      <div v-else-if="structuralData.length > 0" class="structural-results">
        <div class="structural-list">
          <div
            v-for="(item, index) in structuralData"
            :key="index"
            class="structural-item"
          >
            <div class="item-header">
              <span class="item-pattern">{{ item.pattern }}</span>
              <div class="header-actions">
                <span class="item-count">{{ item.frequency }} 次</span>
                <button class="action-button-small" @click="goToTendency(item.pattern)">
                  查看傾向性
                </button>
              </div>
            </div>
            <div class="item-details">
              <div class="item-structure">
                <span class="structure-label">類型:</span>
                <span class="structure-value">{{ item.pattern_type }}</span>
              </div>
              <div class="item-examples">
                <span class="examples-label">示例:</span>
                <span class="example-tag" @click="goToTendency(item.pattern)">
                  {{ item.example }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPatternStructural } from '@/api/index.js'
import { showError } from '@/utils/message.js'

const router = useRouter()
const route = useRoute()

// State
const structuralData = ref([])
const loading = ref(false)
const patternType = ref('')

// Methods
const loadStructuralAnalysis = async () => {
  loading.value = true
  try {
    const params = {}
    if (patternType.value) {
      params.pattern_type = patternType.value
    }
    structuralData.value = await getPatternStructural(params)
  } catch (error) {
    showError('加載結構分析失敗')
  } finally {
    loading.value = false
  }
}

const goToTendency = (pattern) => {
  // 去掉模式中的 X（通配符）
  const cleanPattern = pattern.replace(/X/g, '')
  router.push({
    query: {
      ...route.query,
      subtab: 'tendency',
      pattern: cleanPattern
    }
  })
}
</script>

<style scoped>
.pattern-structural-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.glass-panel {
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-panel h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.select-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 200px;
}

.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.query-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.structural-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.structural-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.structural-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-pattern {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-count {
  padding: 4px 12px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.item-details {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.item-structure {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.structure-label {
  color: var(--text-secondary);
}

.structure-value {
  color: var(--text-primary);
  font-weight: 500;
}

.item-examples {
  display: flex;
  align-items: center;
  gap: 8px;
}

.examples-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.examples-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  padding: 4px 12px;
  background: rgba(80, 200, 120, 0.2);
  color: #2d8659;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-tag:hover {
  background: rgba(80, 200, 120, 0.3);
  transform: translateY(-2px);
}

.action-button-small {
  padding: 6px 12px;
  background: rgba(74, 144, 226, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.action-button-small:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .select-input {
    width: 100%;
  }
}
</style>
