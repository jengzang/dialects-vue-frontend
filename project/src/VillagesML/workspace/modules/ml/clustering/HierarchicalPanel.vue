<template>
  <div class="hierarchical-panel">
    <h1 class="villagesml-subtab-title">
      <BarIcon icon="🌳" />ML計算 - 層次聚類
      <HelpIcon content="市-縣-鎮三級層次聚類分析。先對市級聚類，再在每個市級聚類內對縣級聚類，最後在每個縣級聚類內對鎮級聚類。特徵包括語義類別、字符嵌入、結構特徵。適合發現多尺度的地名模式" />
    </h1>
    <div class="vml-two-col">
    <div class="vml-glass-panel">
      <h3 class="panel-title">層次聚類</h3>
      <p class="panel-description">市-縣-鎮三級層次聚類分析</p>

      <div v-if="!isAuthenticated" class="vml-auth-notice">
        <span class="notice-icon"><InlineIcon icon="🔒" /></span>
        <span>此功能需要登錄後使用</span>
      </div>

      <div v-else class="vml-settings-form">
        <AlgorithmSelector v-model="settings.algorithm" />

        <div class="hierarchical-k-settings">
          <h4 class="section-title">層次聚類數量</h4>

          <div class="vml-setting-row">
            <label class="vml-setting-label">市級 k</label>
            <input
              type="number"
              v-model.number="settings.k_city"
              min="2"
              max="10"
              class="vml-input"
            />
          </div>

          <div class="vml-setting-row">
            <label class="vml-setting-label">縣級 k</label>
            <input
              type="number"
              v-model.number="settings.k_county"
              min="2"
              max="15"
              class="vml-input"
            />
          </div>

          <div class="vml-setting-row">
            <label class="vml-setting-label">鎮級 k</label>
            <input
              type="number"
              v-model.number="settings.k_township"
              min="2"
              max="20"
              class="vml-input"
            />
          </div>

          <p class="vml-setting-hint">建議：市級 2-5，縣級 3-10，鎮級 5-15</p>
        </div>

        <FeatureToggles v-model="settings.features" />
        <PreprocessingSettings v-model="settings.preprocessing" />

        <button @click="runClustering" :disabled="loading" class="run-button solid-button">
          <span v-if="loading" class="ui-loading--hourglass" aria-hidden="true">⏳</span>
          <span v-else><InlineIcon icon="🚀" /></span>
          {{ loading ? '運行中...' : '運行聚類' }}
        </button>
      </div>
    </div>

    <div class="results-section">
      <HierarchicalResultsPanel :results="results" :loading="loading" />
    </div>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { ref, computed } from 'vue'
import { villagesMLStore } from '@/VillagesML/store/villagesMLStore.js'
import { userStore } from '@/main/store/store.js'
import { runHierarchicalClustering } from '@/api/index.js'
import { showSuccess, showError, showWarning } from '@/utils/ui/message.js'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import AlgorithmSelector from './shared/AlgorithmSelector.vue'
import PreprocessingSettings from './shared/PreprocessingSettings.vue'
import FeatureToggles from './shared/FeatureToggles.vue'
import HierarchicalResultsPanel from '../HierarchicalResultsPanel.vue'

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

<style scoped lang="scss">
.hierarchical-panel {
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

.hierarchical-k-settings {
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
