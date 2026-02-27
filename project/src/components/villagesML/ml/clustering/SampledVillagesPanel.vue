<template>
  <div class="sampled-villages-panel">
    <h3 class="villagesml-subtab-title">ML計算 - 採樣村莊聚類</h3>
    <div class="two-col-layout">
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
      dbscan_config: {
        eps: settings.value.dbscan_config.eps ?? 0.5,
        min_samples: settings.value.dbscan_config.min_samples ?? 5
      },
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
