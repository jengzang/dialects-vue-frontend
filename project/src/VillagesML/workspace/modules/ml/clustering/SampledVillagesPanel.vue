<template>
  <div class="sampled-villages-panel">
    <h3 class="villagesml-subtab-title">
      ML計算 - 採樣村莊聚類
      <HelpIcon content="對採樣村莊進行聚類，適合大規模數據集。採樣策略：隨機採樣、分層採樣（按區域比例）、系統採樣（等間隔）。特徵包括語義、字符嵌入、結構。支持K-Means、DBSCAN、GMM算法" />
    </h3>
    <div class="vml-two-col">
    <!-- 左側：參數設置 -->
    <div class="vml-glass-panel">
      <h3 class="panel-title">採樣村莊聚類</h3>
      <p class="panel-description">對採樣村莊進行聚類分析，適合大規模數據集</p>

      <!-- 認證提示 -->
      <div v-if="!isAuthenticated" class="vml-auth-notice">
        <span class="notice-icon">🔒</span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="vml-settings-form">
        <!-- 算法選擇 -->
        <AlgorithmSelector v-model="settings.algorithm" />

        <!-- K值設置 -->
        <div v-if="settings.algorithm !== 'dbscan'" class="vml-setting-row">
          <label class="vml-setting-label">聚類數量 (k)</label>
          <div class="vml-setting-control">
            <input
              type="number"
              v-model.number="settings.k"
              min="2"
              max="20"
              class="vml-input"
            />
          </div>
        </div>

        <!-- 採樣策略 -->
        <div class="vml-setting-row">
          <label class="vml-setting-label">採樣策略</label>
          <div class="vml-setting-control">
            <SimpleSelectDropdown
              v-model="settings.sampling_strategy"
              :options="samplingStrategyOptions"
            />
            <span class="vml-setting-hint">{{ samplingStrategyHint }}</span>
          </div>
        </div>

        <!-- 採樣大小 -->
        <div class="vml-setting-row">
          <label class="vml-setting-label">採樣大小</label>
          <div class="vml-setting-control">
            <input
              type="number"
              v-model.number="settings.sample_size"
              min="100"
              max="20000"
              step="100"
              class="vml-input"
            />
            <span class="vml-setting-hint">採樣村莊數量（100-20000）</span>
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
          <span v-if="loading" class="ui-loading--hourglass" aria-hidden="true">⏳</span>
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
import { villagesMLStore } from '@/VillagesML/store/villagesMLStore.js'
import { userStore } from '@/main/store/store.js'
import { runSampledVillagesClustering } from '@/api/index.js'
import { showSuccess, showError, showWarning } from '@/utils/message.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import FeatureToggles from './shared/FeatureToggles.vue'
import ClusteringResultsPanel from '../ClusteringResultsPanel.vue'

const settings = computed(() => villagesMLStore.sampledVillagesSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const loading = ref(false)
const results = ref(null)

// Options for SimpleSelectDropdown
const samplingStrategyOptions = [
  { label: '分層採樣', value: 'stratified' },
  { label: '隨機採樣', value: 'random' },
  { label: '系統採樣', value: 'systematic' }
]

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
      k: settings.value.algorithm === 'dbscan' ? null : settings.value.k,
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

.vml-two-col > .vml-glass-panel {
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

.results-section {
  overflow-y: auto;
}
</style>
