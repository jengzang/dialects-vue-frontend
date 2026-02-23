<template>
<!--  <ExploreLayout>-->
    <div class="semantic-composition-page">
      <h1 class="page-title">🧩 語義組合模式</h1>

      <!-- Composition Patterns -->
      <div class="patterns-section glass-panel">
        <h2>組合模式</h2>
        <div class="controls">
          <input
            v-model.number="minCount"
            type="number"
            min="1"
            placeholder="最小出現次數"
            class="number-input"
          />
          <input
            v-model.number="topN"
            type="number"
            min="10"
            max="100"
            placeholder="返回數量"
            class="number-input"
          />
          <button
            class="query-button"
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
            <div class="col-count">出現次數</div>
            <div class="col-example">示例</div>
          </div>
          <div class="table-body">
            <div
              v-for="(pattern, index) in patterns"
              :key="index"
              class="table-row"
            >
              <div class="col-pattern">{{ pattern.pattern }}</div>
              <div class="col-count">{{ pattern.count }}</div>
              <div class="col-example">{{ pattern.example }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bigrams and Trigrams -->
      <div class="ngrams-section">
        <div class="bigrams glass-panel">
          <h3>二元組合 (Bigrams)</h3>
          <div class="controls">
            <input
              v-model.number="bigramMinCount"
              type="number"
              min="1"
              placeholder="最小次數"
              class="number-input"
            />
            <button
              class="query-button"
              :disabled="loadingBigrams"
              @click="loadBigrams"
            >
              查詢
            </button>
          </div>

          <div v-if="loadingBigrams" class="loading-state">
            <div class="spinner"></div>
          </div>

          <div v-else-if="bigrams.length > 0" class="bigrams-list">
            <div
              v-for="(bigram, index) in bigrams"
              :key="index"
              class="bigram-item"
            >
              <div class="bigram-text">{{ bigram.bigram }}</div>
              <div class="bigram-count">{{ bigram.count }}</div>
              <div class="bigram-categories">
                <span
                  v-for="cat in bigram.categories"
                  :key="cat"
                  class="category-badge"
                >
                  {{ cat }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="trigrams glass-panel">
          <h3>三元組合 (Trigrams)</h3>
          <div class="controls">
            <input
              v-model.number="trigramMinCount"
              type="number"
              min="1"
              placeholder="最小次數"
              class="number-input"
            />
            <button
              class="query-button"
              :disabled="loadingTrigrams"
              @click="loadTrigrams"
            >
              查詢
            </button>
          </div>

          <div v-if="loadingTrigrams" class="loading-state">
            <div class="spinner"></div>
          </div>

          <div v-else-if="trigrams.length > 0" class="trigrams-list">
            <div
              v-for="(trigram, index) in trigrams"
              :key="index"
              class="trigram-item"
            >
              <div class="trigram-text">{{ trigram.trigram }}</div>
              <div class="trigram-count">{{ trigram.count }}</div>
              <div class="trigram-categories">
                <span
                  v-for="cat in trigram.categories"
                  :key="cat"
                  class="category-badge"
                >
                  {{ cat }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PMI Analysis -->
      <div class="pmi-section glass-panel">
        <h2>點互信息 (PMI) 分析</h2>
        <div class="controls">
          <input
            v-model.number="minPMI"
            type="number"
            step="0.1"
            placeholder="最小PMI值"
            class="number-input"
          />
          <input
            v-model.number="pmiTopN"
            type="number"
            min="10"
            max="100"
            placeholder="返回數量"
            class="number-input"
          />
          <button
            class="query-button"
            :disabled="loadingPMI"
            @click="loadPMI"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingPMI" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="pmiData.length > 0" class="pmi-results">
          <div class="pmi-header">
            <div class="col-pair">字符對</div>
            <div class="col-pmi">PMI值</div>
            <div class="col-count">共現次數</div>
            <div class="col-strength">關聯強度</div>
          </div>
          <div class="pmi-body">
            <div
              v-for="(item, index) in pmiData"
              :key="index"
              class="pmi-row"
              :class="getPMIClass(item.pmi)"
            >
              <div class="col-pair">{{ item.pair }}</div>
              <div class="col-pmi">{{ item.pmi.toFixed(3) }}</div>
              <div class="col-count">{{ item.count }}</div>
              <div class="col-strength">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :style="{ width: `${Math.min(item.pmi * 10, 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Semantic Indices -->
      <div class="indices-section glass-panel">
        <h2>語義指數</h2>
        <button
          class="query-button"
          :disabled="loadingIndices"
          @click="loadIndices"
        >
          計算指數
        </button>

        <div v-if="loadingIndices" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="indices" class="indices-grid">
          <div class="index-card">
            <div class="index-icon">📊</div>
            <div class="index-label">多樣性指數</div>
            <div class="index-value">{{ indices.diversity_index?.toFixed(4) }}</div>
          </div>
          <div class="index-card">
            <div class="index-icon">🔀</div>
            <div class="index-label">熵值</div>
            <div class="index-value">{{ indices.entropy?.toFixed(4) }}</div>
          </div>
          <div class="index-card">
            <div class="index-icon">🎯</div>
            <div class="index-label">集中度</div>
            <div class="index-value">{{ indices.concentration?.toFixed(4) }}</div>
          </div>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  getSemanticCompositionPatterns,
  getSemanticBigrams,
  getSemanticTrigrams,
  getSemanticPMI,
  getSemanticIndices
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const patterns = ref([])
const bigrams = ref([])
const trigrams = ref([])
const pmiData = ref([])
const indices = ref(null)

const loadingPatterns = ref(false)
const loadingBigrams = ref(false)
const loadingTrigrams = ref(false)
const loadingPMI = ref(false)
const loadingIndices = ref(false)

const minCount = ref(5)
const topN = ref(50)
const bigramMinCount = ref(5)
const trigramMinCount = ref(3)
const minPMI = ref(0)
const pmiTopN = ref(50)

// Methods
const loadPatterns = async () => {
  loadingPatterns.value = true
  try {
    patterns.value = await getSemanticCompositionPatterns({
      min_count: minCount.value,
      top_n: topN.value
    })
  } catch (error) {
    showError('加載組合模式失敗')
  } finally {
    loadingPatterns.value = false
  }
}

const loadBigrams = async () => {
  loadingBigrams.value = true
  try {
    bigrams.value = await getSemanticBigrams({
      min_count: bigramMinCount.value,
      top_n: 50
    })
  } catch (error) {
    showError('加載二元組合失敗')
  } finally {
    loadingBigrams.value = false
  }
}

const loadTrigrams = async () => {
  loadingTrigrams.value = true
  try {
    trigrams.value = await getSemanticTrigrams({
      min_count: trigramMinCount.value,
      top_n: 50
    })
  } catch (error) {
    showError('加載三元組合失敗')
  } finally {
    loadingTrigrams.value = false
  }
}

const loadPMI = async () => {
  loadingPMI.value = true
  try {
    pmiData.value = await getSemanticPMI({
      min_pmi: minPMI.value,
      top_n: pmiTopN.value
    })
  } catch (error) {
    showError('加載PMI數據失敗')
  } finally {
    loadingPMI.value = false
  }
}

const loadIndices = async () => {
  loadingIndices.value = true
  try {
    indices.value = await getSemanticIndices()
  } catch (error) {
    showError('計算指數失敗')
  } finally {
    loadingIndices.value = false
  }
}

const getPMIClass = (pmi) => {
  if (pmi >= 5) return 'pmi-very-strong'
  if (pmi >= 3) return 'pmi-strong'
  if (pmi >= 1) return 'pmi-moderate'
  return 'pmi-weak'
}
</script>

<style scoped>
.semantic-composition-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.patterns-section,
.pmi-section,
.indices-section {
  padding: 24px;
  margin-bottom: 30px;
}

.patterns-section h2,
.pmi-section h2,
.indices-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
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

.patterns-table {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 3fr;
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

.ngrams-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.bigrams,
.trigrams {
  padding: 24px;
}

.bigrams h3,
.trigrams h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.bigrams-list,
.trigrams-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
}

.bigram-item,
.trigram-item {
  display: grid;
  grid-template-columns: 2fr 1fr 3fr;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  align-items: center;
}

.bigram-text,
.trigram-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.bigram-count,
.trigram-count {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}

.bigram-categories,
.trigram-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-badge {
  padding: 3px 10px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pmi-results {
  border-radius: 12px;
  overflow: hidden;
}

.pmi-header,
.pmi-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 12px 16px;
  align-items: center;
}

.pmi-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.pmi-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.pmi-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.pmi-row.pmi-very-strong {
  background: rgba(39, 174, 96, 0.15);
}

.pmi-row.pmi-strong {
  background: rgba(46, 204, 113, 0.1);
}

.pmi-row.pmi-moderate {
  background: rgba(243, 156, 18, 0.1);
}

.col-pair {
  font-weight: 600;
  color: var(--text-primary);
}

.col-pmi {
  font-weight: 600;
  color: var(--color-primary);
}

.col-count {
  color: var(--text-secondary);
}

.strength-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--secondary-color));
  transition: width 0.5s ease;
}

.indices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.index-card {
  padding: 30px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease;
}

.index-card:hover {
  transform: translateY(-5px);
}

.index-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.index-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.index-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
}

@media (max-width: 1024px) {
  .ngrams-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .controls {
    flex-direction: column;
  }

  .number-input {
    width: 100%;
  }

  .table-header,
  .table-row,
  .pmi-header,
  .pmi-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
