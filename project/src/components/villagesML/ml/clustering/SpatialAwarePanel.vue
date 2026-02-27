<template>
  <div class="spatial-aware-panel">
    <div class="settings-section glass-panel">
      <h3 class="panel-title">空間感知聚類</h3>
      <p class="panel-description">基於空間聚類結果的二次聚類分析</p>

      <div v-if="!isAuthenticated" class="auth-notice">
        <span class="notice-icon">🔒</span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="settings-form">
        <AlgorithmSelector v-model="settings.algorithm" />

        <div v-if="settings.algorithm !== 'dbscan'" class="setting-row">
          <label class="setting-label">聚類數量 (k)</label>
          <input type="number" v-model.number="settings.k" min="2" max="20" class="setting-input" />
        </div>

        <div class="setting-row">
          <label class="setting-label">空間聚類 Run ID</label>
          <div class="setting-control">
            <select v-model="settings.spatial_run_id" class="setting-select">
              <option value="spatial_eps_05">超密集核心聚類</option>
              <option value="spatial_hdbscan_v1">自動多密度聚類</option>
              <option value="spatial_eps_10">標準密度聚類</option>
              <option value="spatial_eps_20">全域覆蓋聚類</option>
            </select>
            <span class="setting-hint">選擇已有的空間聚類結果</span>
          </div>
        </div>

        <FeatureToggles v-model="settings.features" />
        <PreprocessingSettings v-model="settings.preprocessing" />

        <button @click="runClustering" :disabled="loading" class="run-button">
          <span v-if="loading" class="loading-spinner">⏳</span>
          <span v-else>🚀</span>
          {{ loading ? '運行中...' : '運行聚類' }}
        </button>
      </div>
    </div>

    <div class="results-section">
      <ClusteringResultsPanel :results="results" :loading="loading" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { userStore } from '@/utils/store.js'
import { runSpatialAwareClustering } from '@/api'
import { showSuccess, showError, showWarning } from '@/utils/message.js'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import FeatureToggles from './shared/FeatureToggles.vue'
import ClusteringResultsPanel from '../ClusteringResultsPanel.vue'

const settings = computed(() => villagesMLStore.spatialAwareSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const loading = ref(false)
const results = ref(null)

async function runClustering() {
  if (!isAuthenticated.value) {
    showWarning('請先登錄')
    return
  }

  if (settings.value.algorithm !== 'dbscan' && (!settings.value.k || settings.value.k < 2)) {
    showError('聚類數量 k 必須 ≥ 2')
    return
  }

  loading.value = true
  villagesMLStore.clusteringLoading = true

  try {
    const params = {
      algorithm: settings.value.algorithm,
      k: settings.value.k,
      spatial_run_id: settings.value.spatial_run_id,
      features: settings.value.features,
      preprocessing: settings.value.preprocessing,
      dbscan_config: settings.value.dbscan_config,
      random_state: settings.value.random_state
    }

    const data = await runSpatialAwareClustering(params)
    results.value = data
    villagesMLStore.clusteringResults = data

    showSuccess(`聚類完成！發現 ${data.n_clusters} 個聚類`)
  } catch (error) {
    console.error('空間感知聚類失敗:', error)
    showError(error.message || '聚類失敗')
  } finally {
    loading.value = false
    villagesMLStore.clusteringLoading = false
  }
}
</script>

<style scoped>
.spatial-aware-panel {
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
  .spatial-aware-panel {
    grid-template-columns: 1fr;
  }
}
</style>
