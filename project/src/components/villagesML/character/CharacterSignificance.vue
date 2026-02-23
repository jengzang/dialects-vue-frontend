<template>
<!--  <ExploreLayout>-->
    <div class="character-significance-page">
      <h1 class="page-title">📊 統計顯著性分析</h1>

      <!-- Query Mode Selector -->
      <div class="mode-selector glass-panel">
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'by-char' }"
          @click="queryMode = 'by-char'"
        >
          按字符查詢
        </button>
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'by-region' }"
          @click="queryMode = 'by-region'"
        >
          按區域查詢
        </button>
      </div>

      <!-- Query Form -->
      <div class="query-form glass-panel">
        <!-- By Character Mode -->
        <div v-if="queryMode === 'by-char'" class="form-content">
          <h3>按字符查詢顯著性</h3>
          <div class="form-group">
            <label>字符:</label>
            <input
              v-model="queryChar"
              type="text"
              maxlength="1"
              placeholder="輸入單個字符"
              class="char-input"
            />
          </div>
          <div class="form-group">
            <label>區域層級:</label>
            <select v-model="regionLevel" class="select-input">
              <option value="city">城市</option>
              <option value="county">區縣</option>
              <option value="township">鄉鎮</option>
            </select>
          </div>
          <button
            class="query-button"
            :disabled="!queryChar || loading"
            @click="queryByChar"
          >
            查詢
          </button>
        </div>

        <!-- By Region Mode -->
        <div v-else class="form-content">
          <h3>按區域查詢顯著字符</h3>
          <div class="form-group">
            <label>區域層級:</label>
            <select v-model="regionLevel" class="select-input">
              <option value="city">城市</option>
              <option value="county">區縣</option>
              <option value="township">鄉鎮</option>
            </select>
          </div>
          <div class="form-group">
            <label>區域名稱:</label>
            <input
              v-model="regionName"
              type="text"
              placeholder="輸入區域名稱"
              class="text-input"
            />
          </div>
          <div class="form-group">
            <label>返回數量:</label>
            <input
              v-model.number="topN"
              type="number"
              min="10"
              max="100"
              class="number-input"
            />
          </div>
          <button
            class="query-button"
            :disabled="!regionName || loading"
            @click="queryByRegion"
          >
            查詢
          </button>
        </div>
      </div>

      <!-- Results Table -->
      <div v-if="results.length > 0" class="results-table glass-panel">
        <h3>顯著性分析結果</h3>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>分析中...</p>
        </div>

        <div v-else class="table-container">
          <div class="table-header">
            <div class="col">{{ queryMode === 'by-char' ? '區域' : '字符' }}</div>
            <div class="col">卡方值</div>
            <div class="col">P值</div>
            <div class="col">效應量</div>
            <div class="col">顯著性</div>
          </div>
          <div class="table-body">
            <div
              v-for="(item, index) in results"
              :key="index"
              class="table-row"
              :class="{ 'significant': item.p_value < 0.05 }"
            >
              <div class="col">
                {{ queryMode === 'by-char' ? item.region_name : (item.character || item.char) }}
              </div>
              <div class="col">
                {{ (item.chi_square_statistic !== undefined ? item.chi_square_statistic : item.chi_square).toFixed(2) }}
              </div>
              <div class="col">
                <span :class="getPValueClass(item.p_value)">
                  {{ item.p_value.toFixed(6) }}
                </span>
              </div>
              <div class="col">{{ item.effect_size.toFixed(2) }}</div>
              <div class="col">
                <span class="significance-badge" :class="getSignificanceBadge(item.p_value)">
                  {{ getSignificanceLabel(item.p_value) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Statistics -->
      <div v-if="summary" class="summary-panel glass-panel">
        <h3>統計摘要</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">總測試數</div>
            <div class="summary-value">{{ summary.total_tests }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">顯著數量</div>
            <div class="summary-value">{{ summary.significant_count }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">顯著比例</div>
            <div class="summary-value">
              {{ ((summary.significant_count / summary.total_tests) * 100).toFixed(2) }}%
            </div>
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
  getCharSignificanceByChar,
  getCharSignificanceByRegion,
  getCharSignificanceSummary
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const queryMode = ref('by-char')
const queryChar = ref('')
const regionLevel = ref('city')
const regionName = ref('')
const topN = ref(30)
const results = ref([])
const summary = ref(null)
const loading = ref(false)

// Methods
const queryByChar = async () => {
  if (!queryChar.value) return

  console.log('queryByChar called with:', queryChar.value, regionLevel.value)
  loading.value = true
  try {
    const result = await getCharSignificanceByChar({
      char: queryChar.value,
      region_level: regionLevel.value
    })
    console.log('Significance by char result:', result)
    results.value = result || []
  } catch (error) {
    console.error('Query by char error:', error)
    showError('查詢失敗')
  } finally {
    loading.value = false
  }
}

const queryByRegion = async () => {
  if (!regionName.value) return

  console.log('queryByRegion called with:', regionLevel.value, regionName.value, topN.value)
  loading.value = true
  try {
    const result = await getCharSignificanceByRegion({
      region_level: regionLevel.value,
      region_name: regionName.value,
      top_k: topN.value
    })
    console.log('Significance by region result:', result)
    results.value = result || []

    // Load summary
    const summaryResult = await getCharSignificanceSummary({
      region_level: regionLevel.value
    })
    console.log('Summary result:', summaryResult)
    summary.value = summaryResult
  } catch (error) {
    console.error('Query by region error:', error)
    showError('查詢失敗')
  } finally {
    loading.value = false
  }
}

const getPValueClass = (pValue) => {
  if (pValue < 0.001) return 'p-very-significant'
  if (pValue < 0.01) return 'p-significant'
  if (pValue < 0.05) return 'p-marginal'
  return 'p-not-significant'
}

const getSignificanceBadge = (pValue) => {
  if (pValue < 0.001) return 'badge-very-significant'
  if (pValue < 0.01) return 'badge-significant'
  if (pValue < 0.05) return 'badge-marginal'
  return 'badge-not-significant'
}

const getSignificanceLabel = (pValue) => {
  if (pValue < 0.001) return '***'
  if (pValue < 0.01) return '**'
  if (pValue < 0.05) return '*'
  return 'n.s.'
}
</script>

<style scoped>
.character-significance-page {
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

.mode-selector {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.mode-button {
  flex: 1;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button:hover {
  background: rgba(74, 144, 226, 0.1);
}

.mode-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.query-form {
  padding: 24px;
  margin-bottom: 30px;
}

.form-content h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.form-group {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-secondary);
}

.char-input,
.text-input,
.number-input,
.select-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.5);
}

.char-input {
  width: 60px;
  font-size: 24px;
  text-align: center;
}

.char-input:focus,
.text-input:focus,
.number-input:focus,
.select-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.query-button {
  width: 100%;
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.query-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.results-table {
  padding: 24px;
  margin-bottom: 30px;
}

.results-table h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
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

.table-container {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
  gap: 12px;
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

.table-row.significant {
  background: rgba(80, 200, 120, 0.1);
}

.col {
  display: flex;
  align-items: center;
}

.p-very-significant {
  color: #27ae60;
  font-weight: 700;
}

.p-significant {
  color: #2ecc71;
  font-weight: 600;
}

.p-marginal {
  color: #f39c12;
  font-weight: 500;
}

.p-not-significant {
  color: var(--text-secondary);
}

.significance-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-very-significant {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.badge-significant {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.badge-marginal {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.badge-not-significant {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

.summary-panel {
  padding: 24px;
}

.summary-panel h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .form-group {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .col {
    justify-content: space-between;
  }

  .col::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-secondary);
  }
}
</style>
