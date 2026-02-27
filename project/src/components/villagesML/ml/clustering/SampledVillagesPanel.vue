<template>
  <div class="sampled-villages-panel">
    <!-- 左側：參數設置 -->
    <div class="settings-section glass-panel">
      <h3 class="panel-title">採樣村莊聚類</h3>
      <p class="panel-description">對採樣村莊進行聚類分析，適合大規模數據集</p>

      <!-- 認證提示 -->
      <div v-if="!isAuthenticated" class="auth-notice">
        <span class="notice-icon">🔒</span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="settings-form">
        <!-- 算法選擇 -->
        <AlgorithmSelector v-model="settings.algorithm" />

        <!-- K值設置 -->
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
          </div>
        </div>

        <!-- 採樣策略 -->
        <div class="setting-row">
          <label class="setting-label">採樣策略</label>
          <div class="setting-control">
            <select v-model="settings.sampling_strategy" class="setting-select">
              <option value="stratified">分層採樣</option>
              <option value="random">隨機採樣</option>
              <option value="systematic">系統採樣</option>
            </select>
            <span class="setting-hint">{{ samplingStrategyHint }}</span>
          </div>
        </div>

        <!-- 採樣大小 -->
        <div class="setting-row">
          <label class="setting-label">採樣大小</label>
          <div class="setting-control">
            <input
              type="number"
              v-model.number="settings.sample_size"
              min="100"
              max="20000"
              step="100"
              class="setting-input"
            />
            <span class="setting-hint">採樣村莊數量（100-20000）</span>
          </div>
        </div>

        <!-- 特徵選擇 -->
        <FeatureToggles v-model="settings.features" />

        <!-- 預處理設置 -->
        <PreprocessingSettings v-model="settings.preprocessing" />

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
import { runSampledVillagesClustering } from '@/api'
import { showSuccess, showError, showWarning } from '@/utils/message.js'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import FeatureToggles from './shared/FeatureToggles.vue'
import ClusteringResultsPanel from '../ClusteringResultsPanel.vue'

const settings = computed(() => villagesMLStore.sampledVillagesSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const loading = ref(false)
const results = ref(null)

const samplingStrategyHint = computed(() => {
  switch (settings.value.sampling_strategy) {
    case 'stratified':
      return '按區域分層採樣，保持區域比例'
    case 'random':
      return '完全隨機採樣'
    case 'systematic':
      return '系統間隔採樣'
    default:
      return ''
  }
})

async function runClustering() {
  if (!isAuthenticated.value) {
    showWarning('請先登錄')
    return
  }

  if (settings.value.algorithm !== 'dbscan' && (!settings.value.k || settings.value.k < 2)) {
    showError('聚類數量 k 必須 ≥ 2')
    return
  }

  if (settings.value.sample_size < 100 || settings.value.sample_size > 20000) {
    showError('採樣大小必須在 100-20000 之間')
    return
  }

  loading.value = true
  villagesMLStore.clusteringLoading = true

  try {
    const params = {
      algorithm: settings.value.algorithm,
      k: settings.value.k,
      sampling_strategy: settings.value.sampling_strategy,
      sample_size: settings.value.sample_size,
      filter: settings.value.filter,
      features: settings.value.features,
      preprocessing: settings.value.preprocessing,
      dbscan_config: settings.value.dbscan_config,
      random_state: settings.value.random_state
    }

    const data = await runSampledVillagesClustering(params)
    results.value = data
    villagesMLStore.clusteringResults = data

    showSuccess(`聚類完成！發現 ${data.n_clusters} 個聚類`)
  } catch (error) {
    console.error('採樣村莊聚類失敗:', error)
    showError(error.message || '聚類失敗')
  } finally {
    loading.value = false
    villagesMLStore.clusteringLoading = false
  }
}
</script>

<style scoped>
.sampled-villages-panel {
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

.setting-hint {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
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

@media (max-width: 1024px) {
  .sampled-villages-panel {
    grid-template-columns: 1fr;
  }
}
</style>
