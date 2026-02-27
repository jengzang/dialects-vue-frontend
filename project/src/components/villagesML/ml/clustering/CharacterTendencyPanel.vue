<template>
  <div class="char-tendency-panel">
    <h3 class="villagesml-subtab-title">ML計算 - 字符傾向性聚類</h3>
    <!-- 左側：參數設置 -->
    <div class="two-col-layout">
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
              <option value="city">市級</option>
              <option value="county">縣級</option>
              <option value="township">鎮級</option>
            </select>
          </div>
        </div>

        <!-- 區域過濾 -->
<!--        <div class="setting-row">-->
<!--          <label class="setting-label">區域過濾</label>-->
<!--          <div class="setting-control">-->
<!--            <input-->
<!--              type="text"-->
<!--              v-model="settings.region_filter"-->
<!--              placeholder="留空表示全部區域"-->
<!--              class="setting-input"-->
<!--            />-->
<!--            <span class="setting-hint">可選：指定特定區域名稱</span>-->
<!--          </div>-->
<!--        </div>-->

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
              <option value="lift">Lift</option>
              <option value="log_odds">Log-Odds</option>
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
          class="run-button solid-button"
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
    case 'lift':
      return 'Lift 值，衡量字符與區域的提升度'
    case 'log_odds':
      return '對數勝率，適合二元傾向性分析'
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

  if (settings.value.top_n_chars < 10 || settings.value.top_n_chars > 500) {
    showError('Top N 字符必須在 10-500 之間')
    return
  }

  loading.value = true
  villagesMLStore.clusteringLoading = true

  try {
    const params = {
      algorithm: settings.value.algorithm,
      k: settings.value.algorithm === 'dbscan' ? null : settings.value.k,
      region_level: settings.value.region_level,
      region_filter: settings.value.region_filter ? [settings.value.region_filter] : null,
      top_n_chars: settings.value.top_n_chars,
      tendency_metric: settings.value.tendency_metric,
      preprocessing: settings.value.preprocessing,
      dbscan_config: {
        eps: settings.value.dbscan_config.eps ?? 0.5,
        min_samples: settings.value.dbscan_config.min_samples ?? 5
      },
      random_state: settings.value.random_state
    }

    const data = await runCharacterTendencyClustering(params)
    results.value = data
    villagesMLStore.clusteringResults = data

    showSuccess(`聚類完成！發現 ${data.metrics?.n_clusters ?? data.k} 個聚類`)
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
  padding: 12px;
}

.two-col-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 16px;
}

.settings-section {
  padding: 20px;
  overflow-y: auto;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.panel-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.5;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #856404;
  font-weight: 500;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.setting-label {
  min-width: 100px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  padding-top: 10px;
}

.setting-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-input,
.setting-select {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 14px;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.7);
}

.setting-hint {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
}

.dbscan-params {
  padding: 16px;
  background: rgba(74, 144, 226, 0.08);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.run-button {
  margin-top: 8px;
  padding: 12px 24px;
}

.results-section {
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .two-col-layout {
    grid-template-columns: 1fr;
  }
}
</style>
