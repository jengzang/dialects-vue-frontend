<template>
  <div class="char-tendency-panel">
    <!-- 左側：參數設置 -->
    <div class="settings-section glass-panel">
      <h3 class="panel-title">字符傾向性聚類</h3>
      <p class="panel-description">基於字符使用傾向性的區域聚類分析</p>

      <!-- 認證提示 -->
      <div v-if="!isAuthenticated" class="auth-notice">
        <span class="notice-icon">🔒</span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="settings-form">
        <!-- 算法選擇 -->
        <AlgorithmSelector
          v-model="settings.algorithm"
        />

        <!-- K值設置（僅 kmeans/gmm） -->
        <div v-if="settings.algorithm !== 'dbscan'" class="setting-row">
          <label class="setting-label">聚類數量 (k)</label>
          <div class="setting-control">
            <input
              type="number"
              v-model.number="settings.k"
              min="2"
              max="20"
              class="setting-input"
            />
            <span class="setting-hint">建議 2-10 個聚類</span>
          </div>
        </div>

        <!-- 區域級別 -->
        <div class="setting-row">
          <label class="setting-label">區域級別</label>
          <div class="setting-control">
            <select v-model="settings.region_level" class="setting-select">
              <option value="city">市</option>
              <option value="county">縣</option>
              <option value="township">鎮</option>
            </select>
          </div>
        </div>

        <!-- 區域過濾 -->
        <div class="setting-row">
          <label class="setting-label">區域過濾</label>
          <div class="setting-control">
            <input
              type="text"
              v-model="settings.region_filter"
              placeholder="留空表示全部區域"
              class="setting-input"
            />
            <span class="setting-hint">可選：指定特定區域名稱</span>
          </div>
        </div>

        <!-- Top N 字符 -->
        <div class="setting-row">
          <label class="setting-label">Top N 字符</label>
          <div class="setting-control">
            <input
              type="number"
              v-model.number="settings.top_n_chars"
              min="10"
              max="200"
              class="setting-input"
            />
            <span class="setting-hint">使用前 N 個高頻字符（10-200）</span>
          </div>
        </div>

        <!-- 傾向性指標 -->
        <div class="setting-row">
          <label class="setting-label">傾向性指標</label>
          <div class="setting-control">
            <select v-model="settings.tendency_metric" class="setting-select">
              <option value="z_score">Z-Score</option>
              <option value="tfidf">TF-IDF</option>
              <option value="pmi">PMI</option>
            </select>
            <span class="setting-hint">{{ tendencyMetricHint }}</span>
          </div>
        </div>

        <!-- 預處理設置 -->
        <PreprocessingSettings
          v-model="settings.preprocessing"
        />

        <!-- DBSCAN 參數 -->
        <div v-if="settings.algorithm === 'dbscan'" class="dbscan-params">
          <h4 class="section-title">DBSCAN 參數</h4>
          <div class="setting-row">
            <label class="setting-label">Epsilon (eps)</label>
            <input
              type="number"
              v-model.number="settings.dbscan_config.eps"
              step="0.1"
              min="0.1"
              placeholder="自動調整"
              class="setting-input"
            />
          </div>
          <div class="setting-row">
            <label class="setting-label">Min Samples</label>
            <input
              type="number"
              v-model.number="settings.dbscan_config.min_samples"
              min="2"
              placeholder="自動調整"
              class="setting-input"
            />
          </div>
        </div>

        <!-- 運行按鈕 -->
        <button
          @click="runClustering"
          :disabled="loading"
          class="run-button"
        >
          <span v-if="loading" class="loading-spinner">⏳</span>
          <span v-else>🚀</span>
          {{ loading ? '運行中...' : '運行聚類' }}
        </button>
      </div>
    </div>

    <!-- 右側：結果展示 -->
    <div class="results-section">
      <ClusteringResultsPanel
        :results="results"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { userStore } from '@/utils/store.js'
import { runCharacterTendencyClustering } from '@/api'
import { showSuccess, showError, showWarning } from '@/utils/message.js'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import ClusteringResultsPanel from '../ClusteringResultsPanel.vue'

const settings = computed(() => villagesMLStore.characterTendencySettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const loading = ref(false)
const results = ref(null)

const tendencyMetricHint = computed(() => {
  switch (settings.value.tendency_metric) {
    case 'z_score':
      return '標準化偏差，適合比較不同字符'
    case 'tfidf':
      return 'TF-IDF 權重，強調區域特異性'
    case 'pmi':
      return '點互信息，衡量字符與區域的關聯'
    default:
      return ''
  }
})

async function runClustering() {
  if (!isAuthenticated.value) {
    showWarning('請先登錄')
    return
  }

  // 參數驗證
  if (settings.value.algorithm !== 'dbscan' && (!settings.value.k || settings.value.k < 2)) {
    showError('聚類數量 k 必須 ≥ 2')
    return
  }

  if (settings.value.top_n_chars < 10 || settings.value.top_n_chars > 200) {
    showError('Top N 字符必須在 10-200 之間')
    return
  }

  loading.value = true
  villagesMLStore.clusteringLoading = true

  try {
    const params = {
      algorithm: settings.value.algorithm,
      k: settings.value.k,
      region_level: settings.value.region_level,
      region_filter: settings.value.region_filter || null,
      top_n_chars: settings.value.top_n_chars,
      tendency_metric: settings.value.tendency_metric,
      preprocessing: settings.value.preprocessing,
      dbscan_config: settings.value.dbscan_config,
      random_state: settings.value.random_state
    }

    const data = await runCharacterTendencyClustering(params)
    results.value = data
    villagesMLStore.clusteringResults = data

    showSuccess(`聚類完成！發現 ${data.n_clusters} 個聚類`)
  } catch (error) {
    console.error('字符傾向性聚類失敗:', error)
    showError(error.message || '聚類失敗')
  } finally {
    loading.value = false
    villagesMLStore.clusteringLoading = false
  }
}
</script>

<style scoped>
.char-tendency-panel {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1.5rem;
  height: 100%;
  padding: 1rem;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.panel-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  color: #856404;
  font-size: 0.9rem;
}

.notice-icon {
  font-size: 1.2rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
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

.setting-input,
.setting-select {
  padding: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.setting-input:focus,
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

.dbscan-params {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.run-button {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), #357abd);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.run-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(74, 144, 226, 0.3);
}

.run-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.results-section {
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .char-tendency-panel {
    grid-template-columns: 1fr;
  }
}
</style>
