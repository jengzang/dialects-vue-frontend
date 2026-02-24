<template>
  <div class="semantic-composition-page">
    <h3 class="villagesml-subtab-title">語義分析 - 組合模式</h3>

    <!-- Composition Patterns -->
    <div class="patterns-section glass-panel">
      <h2>組合模式</h2>
      <p class="section-description">
        分析村名中語義類別的組合模式，例如「方位+聚落」、「水系+聚落」等。
      </p>
      <div class="controls">
        <div class="input-group">
          <label class="input-label">最小出現次數</label>
          <input
            v-model.number="minCount"
            type="number"
            min="1"
            placeholder="例如：5"
            class="number-input"
          />
          <span class="input-hint">過濾掉出現次數少於此值的模式</span>
        </div>
        <div class="input-group">
          <label class="input-label">返回數量</label>
          <input
            v-model.number="topN"
            type="number"
            min="10"
            max="1000"
            placeholder="例如：50"
            class="number-input"
          />
          <span class="input-hint">返回前N個最常見的模式（最多1000）</span>
        </div>
        <button
          class="solid-button"
          :disabled="loadingPatterns"
          @click="loadPatterns"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingPatterns" class="loading-state">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="patterns.length > 0" class="patterns-table">
        <div class="table-header">
          <div class="col-pattern">模式</div>
          <div class="col-type">類型</div>
          <div class="col-count">頻率</div>
          <div class="col-percentage">佔比</div>
          <div class="col-components">組成</div>
        </div>
        <div class="table-body">
          <div
            v-for="(pattern, index) in patterns"
            :key="index"
            class="table-row"
          >
            <div class="col-pattern">{{ translatePattern(pattern.pattern) }}</div>
            <div class="col-type">{{ getPatternTypeName(pattern.pattern_type) }}</div>
            <div class="col-count">{{ pattern.frequency }}</div>
            <div class="col-percentage">{{ pattern.percentage?.toFixed(2) || '0.00' }}%</div>
            <div class="col-components">
              <span v-if="pattern.modifier" class="component-tag modifier">{{ getCategoryName(pattern.modifier) }}</span>
              <span v-if="pattern.head" class="component-tag head">{{ getCategoryName(pattern.head) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getSemanticCompositionPatterns } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getPatternTypeName, getCategoryName } from '@/config/villagesML.js'

// State
const patterns = ref([])
const loadingPatterns = ref(false)
const minCount = ref(5)
const topN = ref(50)

// Methods
const loadPatterns = async () => {
  loadingPatterns.value = true
  try {
    patterns.value = await getSemanticCompositionPatterns({
      min_frequency: minCount.value,
      limit: topN.value
    })
  } catch (error) {
    showError('加載組合模式失敗')
  } finally {
    loadingPatterns.value = false
  }
}

const translatePattern = (patternStr) => {
  if (!patternStr) return ''
  return patternStr
    .split('+')
    .map(cat => getCategoryName(cat.trim()))
    .join('+')
}
</script>

<style scoped>
.semantic-composition-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.patterns-section {
  padding: 16px;
  margin-bottom: 16px;
}

.patterns-section h2 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.input-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.number-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 150px;
}

.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
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

.patterns-table {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 12px 16px;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.col-components {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.component-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.component-tag.modifier {
  background: rgba(243, 156, 18, 0.2);
  color: #d68910;
}

.component-tag.head {
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
