<template>
  <div class="char-tendency-panel">
    <h3 class="villagesml-subtab-title">
      ML計算 - 字符傾向性聚類
      <HelpIcon content="基於字符使用傾向性的區域聚類。特徵為每個區域的字符Z分數向量（標準化偏差），衡量該區域對特定字符的偏好程度。算法：K-Means（質心聚類）、DBSCAN（密度聚類）、GMM（高斯混合模型）" />
    </h3>
    <!-- 左側：參數設置 -->
    <div class="vml-two-col">
    <div class="vml-glass-panel">
      <h3 class="panel-title">字符傾向性聚類</h3>
      <p class="panel-description">基於字符使用傾向性的區域聚類分析</p>

      <!-- 認證提示 -->
      <div v-if="!isAuthenticated" class="vml-auth-notice">
        <span class="notice-icon">🔒</span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="vml-settings-form">
        <!-- 算法選擇 -->
        <AlgorithmSelector
          v-model="settings.algorithm"
        />

        <!-- K值設置（僅 kmeans/gmm） -->
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
            <span class="vml-setting-hint">建議 2-10 個聚類</span>
          </div>
        </div>

        <!-- 區域級別 -->
        <div class="vml-setting-row">
          <label class="vml-setting-label">區域級別</label>
          <div class="vml-setting-control">
            <SimpleSelectDropdown
              v-model="settings.region_level"
              :options="regionLevelOptions"
            />
          </div>
        </div>

        <!-- 區域過濾 -->
<!--        <div class="vml-setting-row">-->
<!--          <label class="vml-setting-label">區域過濾</label>-->
<!--          <div class="vml-setting-control">-->
<!--            <input-->
<!--              type="text"-->
<!--              v-model="settings.region_filter"-->
<!--              placeholder="留空表示全部區域"-->
<!--              class="vml-input"-->
<!--            />-->
<!--            <span class="vml-setting-hint">可選：指定特定區域名稱</span>-->
<!--          </div>-->
<!--        </div>-->

        <!-- Top N 字符 -->
        <div class="vml-setting-row">
          <label class="vml-setting-label">Top N 字符</label>
          <div class="vml-setting-control">
            <input
              type="number"
              v-model.number="settings.top_n_chars"
              min="10"
              max="200"
              class="vml-input"
            />
            <span class="vml-setting-hint">使用前 N 個高頻字符（10-200）</span>
          </div>
        </div>

        <!-- 傾向性指標 -->
        <div class="vml-setting-row">
          <label class="vml-setting-label">傾向性指標</label>
          <div class="vml-setting-control">
            <SimpleSelectDropdown
              v-model="settings.tendency_metric"
              :options="tendencyMetricOptions"
            />
            <span class="vml-setting-hint">{{ tendencyMetricHint }}</span>
          </div>
        </div>

        <!-- 預處理設置 -->
        <PreprocessingSettings
          v-model="settings.preprocessing"
        />

        <!-- DBSCAN 參數 -->
        <div v-if="settings.algorithm === 'dbscan'" class="dbscan-params">
          <h4 class="section-title">DBSCAN 參數</h4>
          <div class="vml-setting-row">
            <label class="vml-setting-label">Epsilon (eps)</label>
            <input
              type="number"
              v-model.number="settings.dbscan_config.eps"
              step="0.1"
              min="0.1"
              placeholder="自動調整"
              class="vml-input"
            />
          </div>
          <div class="vml-setting-row">
            <label class="vml-setting-label">Min Samples</label>
            <input
              type="number"
              v-model.number="settings.dbscan_config.min_samples"
              min="2"
              placeholder="自動調整"
              class="vml-input"
            />
          </div>
        </div>

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
import { runCharacterTendencyClustering } from '@/api/index.js'
import { showSuccess, showError, showWarning } from '@/utils/message.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import ClusteringResultsPanel from '../ClusteringResultsPanel.vue'

const settings = computed(() => villagesMLStore.characterTendencySettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const loading = ref(false)
const results = ref(null)

// Options for SimpleSelectDropdown
const regionLevelOptions = [
  { label: '市級', value: 'city' },
  { label: '縣級', value: 'county' },
  { label: '鎮級', value: 'township' }
]

const tendencyMetricOptions = [
  { label: 'Z-Score', value: 'z_score' },
  { label: 'Lift', value: 'lift' },
  { label: 'Log-Odds', value: 'log_odds' }
]

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

<style scoped lang="scss">
.char-tendency-panel {
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

.dbscan-params {
  padding: 16px;
  background: rgba(var(--vml-blue-rgb), 0.08);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.2);
  border-radius: var(--radius-md);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.results-section {
  overflow-y: auto;
}
</style>
