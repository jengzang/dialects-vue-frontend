<template>
  <div class="spatial-clusters-tab">
    <h2>
      🎯 空間聚類
      <HelpIcon content="基於地理坐標的村莊聚類分析。支持多種聚類算法（DBSCAN、HDBSCAN、K-Means等）。展示聚類中心、規模、平均距離和空間範圍統計" />
    </h2>

    <!-- Run 選擇器 -->
    <div class="cluster-controls">
      <div class="run-selector" v-if="availableRuns.length">
        <label>聚類方案</label>
        <SimpleSelectDropdown :match-trigger-width="true"
          v-model="selectedRunId"
          :options="runOptions"
        />
      </div>
    </div>

    <!-- Clusters 地圖 -->
    <div v-if="loading" class="vml-loading"">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="clusters.length > 0" class="clusters-content">
      <div v-if="clustersMetadata" class="clusters-metadata">
        <span class="metadata-item"><strong>運行ID:</strong> {{ clustersMetadata.run_id }}</span>
        <span class="metadata-item"><strong>總聚類數:</strong> {{ clustersMetadata.total_clusters?.toLocaleString() }}</span>
        <span class="metadata-item"><strong>噪聲點:</strong> {{ clustersMetadata.noise_points }}</span>
      </div>
      <SpatialMap mode="clusters" :clusters="clusters" />
    </div>

    <!-- 統計摘要 -->
    <div v-if="clustersSummary" class="summary-panel">
      <h3>聚類統計摘要 · {{ clustersSummary.run_id }}</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">🎯</div>
          <div class="summary-label">總聚類數</div>
          <div class="summary-value">{{ clustersSummary.total_clusters?.toLocaleString() }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🏘️</div>
          <div class="summary-label">村莊總數</div>
          <div class="summary-value">{{ clustersSummary.total_villages?.toLocaleString() }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-label">噪聲點</div>
          <div class="summary-value">{{ clustersSummary.noise_points }}</div>
        </div>
        <div class="summary-card" v-if="clustersSummary.cluster_size">
          <div class="summary-icon">📈</div>
          <div class="summary-label">平均 / 最大聚類規模</div>
          <div class="summary-value">{{ clustersSummary.cluster_size.avg?.toFixed(2) }}</div>
          <div class="summary-sub">最小 {{ clustersSummary.cluster_size.min?.toFixed(2) }} · 最大 {{ clustersSummary.cluster_size.max?.toFixed(2) }}</div>
        </div>
        <div class="summary-card" v-if="clustersSummary.spatial_extent">
          <div class="summary-icon">📍</div>
          <div class="summary-label">平均聚類內距離</div>
          <div class="summary-value">{{ clustersSummary.spatial_extent.avg_distance_km?.toFixed(2) }} km</div>
          <div class="summary-sub">
            經 {{ clustersSummary.spatial_extent.lon_range?.[0]?.toFixed(2) }}–{{ clustersSummary.spatial_extent.lon_range?.[1]?.toFixed(2) }}
            · 緯 {{ clustersSummary.spatial_extent.lat_range?.[0]?.toFixed(2) }}–{{ clustersSummary.spatial_extent.lat_range?.[1]?.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import SpatialMap from './SpatialMap.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { getSpatialClusters, getSpatialClustersAvailableRuns, getSpatialClustersSummary } from '@/api/index.js'
import { showError } from '@/utils/ui/message.js'
import {
  SPATIAL_CLUSTERING_RUN_LABELS,
  DEFAULT_SPATIAL_CLUSTERING_RUN_ID
} from '@/VillagesML/config/villagesML.js'

// State
const availableRuns = ref([])
const selectedRunId = ref('')
const clusters = ref([])
const clustersMetadata = ref(null)
const clustersSummary = ref(null)
const loading = ref(false)

// Options for SimpleSelectDropdown
const runOptions = computed(() =>
  availableRuns.value.map(run => ({
    label: runLabel(run),
    value: run.run_id
  }))
)

const runLabel = (run) => {
  const name = SPATIAL_CLUSTERING_RUN_LABELS[run.run_id] || run.run_id
  return `${name} — ${run.unique_clusters.toLocaleString()} 聚類，均 ${run.avg_cluster_size?.toFixed(2)} 點`
}

const loadAvailableRuns = async () => {
  try {
    const response = await getSpatialClustersAvailableRuns()
    availableRuns.value = response.available_runs || []
    // 默認選自動多密度聚類，否則 fallback 到 active
    const hdbscan = availableRuns.value.find(r => r.run_id === DEFAULT_SPATIAL_CLUSTERING_RUN_ID)
    selectedRunId.value = hdbscan?.run_id || response.active_run_id || availableRuns.value[0]?.run_id || ''
  } catch {
    // 靜默失敗
  }
}

const loadAll = async () => {
  loading.value = true
  try {
    const [clustersRes, summaryRes] = await Promise.all([
      getSpatialClusters({ run_id: selectedRunId.value || undefined, limit: 0 }),
      getSpatialClustersSummary(selectedRunId.value || undefined)
    ])
    clusters.value = Array.isArray(clustersRes) ? clustersRes : (clustersRes.clusters || [])
    clustersMetadata.value = Array.isArray(clustersRes) ? null : {
      run_id: clustersRes.run_id,
      total_clusters: clustersRes.total_clusters,
      noise_points: clustersRes.noise_points
    }
    clustersSummary.value = summaryRes
  } catch {
    showError('加載聚類數據失敗')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAvailableRuns()
  // 自动加载聚类数据
  if (selectedRunId.value) {
    loadAll()
  }
})

// 监听 selectedRunId 变化，自动加载数据
watch(selectedRunId, (newRunId) => {
  if (newRunId) {
    loadAll()
  }
})
</script>

<style scoped lang="scss">
.spatial-clusters-tab {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 16px;
  background: var(--glass-60);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-40);
  box-shadow: var(--shadow-glass);
}

h2, h3 { font-size: 24px; margin-bottom: 16px; color: var(--text-primary); font-weight: 600; }
h3 { font-size: 16px; margin-top: 20px; }

.cluster-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content:center;margin-bottom: 16px; }

.run-selector { display: flex; flex-direction: column; gap: 4px; }
.run-selector label { font-size: 12px; color: var(--text-secondary); }
.run-select {
  padding: 8px 12px; border-radius: var(--radius-sm2); font-size: 13px;
  border: 1px solid var(--glass-60); background: var(--glass-50);
  max-width: 360px;
}

.load-button {
  padding: 10px 24px; background: var(--color-primary); color: var(--action-primary-text);
  border: none; border-radius: var(--radius-sm2); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.3s ease;
}
.load-button.secondary { background: rgba(var(--vml-blue-rgb), 0.2); color: var(--color-primary); }
.load-button:hover:not(:disabled) { opacity: 0.85; }
.load-button:disabled { opacity: 0.5; cursor: not-allowed; }

.clusters-content { margin-top: 20px; width: 100%;  display: flex; flex-direction: column; }
.clusters-metadata {
  display: flex; flex-wrap: wrap; gap: 16px; padding: 16px;
  background: rgba(var(--vml-blue-rgb), 0.1); border-radius: var(--radius-sm2); margin-bottom: 16px; font-size: 14px;
}
.metadata-item strong { color: var(--color-primary); margin-right: 4px; }

.summary-panel { margin-top: 30px; padding: 12px; background: var(--glass-30); border-radius: var(--radius-md); width:100%}
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 16px; }
.summary-card { padding: 12px; background: var(--glass-50); border-radius: var(--radius-md); text-align: center; }
.summary-icon { font-size: 32px; margin-bottom: 8px; }
.summary-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.summary-value { font-size: 26px; font-weight: 700; color: var(--color-primary); }
.summary-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

@media (max-aspect-ratio: 1/1) { .spatial-clusters-tab { padding: 12px; } }
</style>
