<template>
  <div class="hierarchical-panel">
    <div class="settings-section glass-panel">
      <h3 class="panel-title">層次聚類</h3>
      <p class="panel-description">市-縣-鎮三級層次聚類分析</p>

      <div v-if="!isAuthenticated" class="auth-notice">
        <span class="notice-icon">🔒</span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="settings-form">
        <AlgorithmSelector v-model="settings.algorithm" />

        <div class="hierarchical-k-settings">
          <h4 class="section-title">層次聚類數量</h4>

          <div class="setting-row">
            <label class="setting-label">市級 k</label>
            <input type="number" v-model.number="settings.k_city" min="2" max="10" class="setting-input" />
          </div>

          <div class="setting-row">
            <label class="setting-label">縣級 k</label>
            <input type="number" v-model.number="settings.k_county" min="2" max="15" class="setting-input" />
          </div>

          <div class="setting-row">
            <label class="setting-label">鎮級 k</label>
            <input type="number" v-model.number="settings.k_township" min="2" max="20" class="setting-input" />
          </div>

          <p class="setting-hint">建議：市級 2-5，縣級 3-10，鎮級 5-15</p>
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
import { runHierarchicalClustering } from '@/api'
import { showSuccess, showError, showWarning } from '@/utils/message.js'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import FeatureToggles from './shared/FeatureToggles.vue'
import ClusteringResultsPanel from '../ClusteringResultsPanel.vue'

const settings = computed(() => villagesMLStore.hierarchicalSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const loading = ref(false)
const results = ref(null)

async function runClustering() {
  if (!isAuthenticated.value) {
    showWarning('請先登錄')
    return
  }

  if (settings.value.k_city < 2 || settings.value.k_county < 2 || settings.value.k_township < 2) {
    showError('所有層級的 k 值必須 ≥ 2')
    return
  }

  loading.value = true
  villagesMLStore.clusteringLoading = true

  try {
    const params = {
      algorithm: settings.value.algorithm,
      k_city: settings.value.k_city,
      k_county: settings.value.k_county,
      k_township: settings.value.k_township,
      features: settings.value.features,
      preprocessing: settings.value.preprocessing,
      dbscan_config: settings.value.dbscan_config,
      random_state: settings.value.random_state
    }

    const data = await runHierarchicalClustering(params)
    results.value = data
    villagesMLStore.clusteringResults = data

    showSuccess('層次聚類完成！')
  } catch (error) {
    console.error('層次聚類失敗:', error)
    showError(error.message || '聚類失敗')
  } finally {
    loading.value = false
    villagesMLStore.clusteringLoading = false
  }
}
</script>

<style scoped>
.hierarchical-panel {
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

.hierarchical-k-settings {
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

.setting-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.setting-label {
  min-width: 80px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-input {
  padding: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  width: 100px;
}

.setting-hint {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  margin-top: 0.5rem;
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
  .hierarchical-panel {
    grid-template-columns: 1fr;
  }
}
</style>
