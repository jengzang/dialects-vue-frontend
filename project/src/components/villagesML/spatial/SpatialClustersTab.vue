<template>
  <div class="spatial-clusters-tab">
    <h2>🎯 空間聚類</h2>

    <!-- Run 選擇器 -->
    <div class="cluster-controls">
      <div class="run-selector" v-if="availableRuns.length">
        <label>聚類方案</label>
        <select v-model="selectedRunId" class="run-select">
          <option v-for="run in availableRuns" :key="run.run_id" :value="run.run_id">
            {{ runLabel(run) }}
            — {{ run.unique_clusters.toLocaleString() }} 聚類，均 {{ run.avg_cluster_size?.toFixed(2) }} 點
          </option>
        </select>
      </div>
      <button class="load-button" :disabled="loading" @click="loadAll">
        {{ loading ? '加載中...' : '加載聚類數據' }}
      </button>
    </div>

    <!-- Clusters 地圖 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="clusters.length > 0">
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
import { ref, onMounted } from 'vue'
import SpatialMap from './SpatialMap.vue'
import { getSpatialClusters, getSpatialClustersAvailableRuns, getSpatialClustersSummary } from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const availableRuns = ref([])
const selectedRunId = ref('')
const clusters = ref([])
const clustersMetadata = ref(null)
const clustersSummary = ref(null)
const loading = ref(false)

const RUN_LABELS = {
  'spatial_eps_03': '高密度核心聚類',
  'spatial_eps_05': '中密度擴展聚類',
  'spatial_eps_10': '全域粗粒度聚類',
  'optimized_kde_v1': 'KDE 熱點檢測'
}
const runLabel = (run) => {
  const name = RUN_LABELS[run.run_id] || run.run_id
  return `${name} — ${run.unique_clusters.toLocaleString()} 聚類，均 ${run.avg_cluster_size?.toFixed(2)} 點`
}

const loadAvailableRuns = async () => {
  try {
    const response = await getSpatialClustersAvailableRuns()
    availableRuns.value = response.available_runs || []
    // 默認選 KDE 熱點檢測，否則 fallback 到 active
    const kde = availableRuns.value.find(r => r.run_id === 'optimized_kde_v1')
    selectedRunId.value = kde?.run_id || response.active_run_id || availableRuns.value[0]?.run_id || ''
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

onMounted(loadAvailableRuns)
</script>

<style scoped>
.spatial-clusters-tab {
  padding: 16px;
  background: var(--glass-medium);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

h2, h3 { font-size: 24px; margin-bottom: 16px; color: var(--text-primary); font-weight: 600; }
h3 { font-size: 16px; margin-top: 20px; }

.cluster-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; }

.run-selector { display: flex; flex-direction: column; gap: 4px; }
.run-selector label { font-size: 12px; color: var(--text-secondary); }
.run-select {
  padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid rgba(255,255,255,0.6); background: rgba(255,255,255,0.5);
  max-width: 360px;
}

.load-button {
  padding: 10px 24px; background: var(--color-primary); color: white;
  border: none; border-radius: 8px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.3s ease;
}
.load-button.secondary { background: rgba(74,144,226,0.2); color: var(--color-primary); }
.load-button:hover:not(:disabled) { opacity: 0.85; }
.load-button:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-state { text-align: center; padding: 40px 20px; }
.spinner {
  width: 40px; height: 40px; border: 4px solid rgba(74,144,226,0.2);
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin 1s linear infinite; margin: 0 auto 15px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.clusters-content { margin-top: 20px; }
.clusters-metadata {
  display: flex; flex-wrap: wrap; gap: 16px; padding: 16px;
  background: rgba(74,144,226,0.1); border-radius: 8px; margin-bottom: 16px; font-size: 14px;
}
.metadata-item strong { color: var(--color-primary); margin-right: 4px; }

.summary-panel { margin-top: 30px; padding: 12px; background: rgba(255,255,255,0.3); border-radius: 12px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 16px; }
.summary-card { padding: 12px; background: rgba(255,255,255,0.5); border-radius: 12px; text-align: center; }
.summary-icon { font-size: 32px; margin-bottom: 8px; }
.summary-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.summary-value { font-size: 26px; font-weight: 700; color: var(--color-primary); }
.summary-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

@media (max-aspect-ratio: 1/1) { .spatial-clusters-tab { padding: 12px; } }
</style>

