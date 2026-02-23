<template>
  <div class="cache-management-page">
    <!-- Header -->
    <div class="page-header">
      <h2>🔐 緩存管理 Cache Management</h2>
      <p class="subtitle">查看和管理計算緩存統計</p>
      <div v-if="!isAuthenticated" class="auth-warning">
        <span class="lock-icon">🔒</span>
        <span>此功能需要登入</span>
        <button @click="goToAuth" class="glass-button small">前往登入</button>
      </div>
    </div>

    <!-- Cache Statistics -->
    <div class="glass-panel stats-panel">
      <div class="panel-header">
        <h3>緩存統計 Cache Statistics</h3>
        <button @click="refreshStats" :disabled="loading" class="glass-button small">
          <span v-if="!loading">🔄 刷新</span>
          <span v-else>刷新中...</span>
        </button>
      </div>
      <div v-if="cacheStats" class="stats-content">
        <!-- Overview Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <div class="stat-label">總緩存條目</div>
              <div class="stat-value">{{ cacheStats.total_entries }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💾</div>
            <div class="stat-info">
              <div class="stat-label">緩存大小</div>
              <div class="stat-value">{{ formatSize(cacheStats.total_size) }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-label">命中率</div>
              <div class="stat-value">{{ formatPercent(cacheStats.hit_rate) }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-label">平均響應時間</div>
              <div class="stat-value">{{ cacheStats.avg_response_time }}ms</div>
            </div>
          </div>
        </div>

        <!-- Cache Usage Chart -->
        <div class="chart-section">
          <h4>緩存使用趨勢 Cache Usage Trend</h4>
          <div ref="usageChart" class="chart-container"></div>
        </div>

        <!-- Hit Rate Chart -->
        <div class="chart-section">
          <h4>命中率趨勢 Hit Rate Trend</h4>
          <div ref="hitRateChart" class="chart-container"></div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>載入緩存統計中...</p>
      </div>
    </div>

    <!-- Cache Details -->
    <div class="glass-panel details-panel">
      <div class="panel-header">
        <h3>緩存詳情 Cache Details</h3>
      </div>
      <div v-if="cacheStats" class="details-content">
        <table class="glass-table">
          <thead>
            <tr>
              <th>緩存類型</th>
              <th>條目數</th>
              <th>大小</th>
              <th>命中次數</th>
              <th>未命中次數</th>
              <th>命中率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cache in cacheStats.cache_types" :key="cache.type">
              <td>{{ cache.type }}</td>
              <td>{{ cache.entries }}</td>
              <td>{{ formatSize(cache.size) }}</td>
              <td>{{ cache.hits }}</td>
              <td>{{ cache.misses }}</td>
              <td>{{ formatPercent(cache.hit_rate) }}</td>
              <td>
                <button @click="clearCacheType(cache.type)" class="glass-button small secondary">
                  清除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cache Management Actions -->
    <div class="glass-panel actions-panel">
      <div class="panel-header">
        <h3>緩存操作 Cache Actions</h3>
      </div>
      <div class="actions-content">
        <div class="action-card">
          <div class="action-info">
            <h4>清除所有緩存</h4>
            <p>刪除所有緩存條目，釋放內存空間</p>
          </div>
          <button @click="clearAllCache" :disabled="loading" class="glass-button danger">
            清除所有緩存
          </button>
        </div>
        <div class="action-card">
          <div class="action-info">
            <h4>清除過期緩存</h4>
            <p>僅刪除已過期的緩存條目</p>
          </div>
          <button @click="clearExpiredCache" :disabled="loading" class="glass-button secondary">
            清除過期緩存
          </button>
        </div>
        <div class="action-card">
          <div class="action-info">
            <h4>優化緩存</h4>
            <p>重新組織緩存結構，提高性能</p>
          </div>
          <button @click="optimizeCache" :disabled="loading" class="glass-button primary">
            優化緩存
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getCacheStats, clearCache } from '@/api/index.js'
import { showError, showSuccess, showConfirm } from '@/utils/message.js'
import { userStore } from '@/utils/store.js'

// Router
const router = useRouter()

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// State
const cacheStats = ref(null)
const loading = ref(false)
const loadingMessage = ref('載入中...')

// Chart refs
const usageChart = ref(null)
const hitRateChart = ref(null)

// Methods
const goToAuth = () => {
  router.push('/auth?redirect=/explore?tab=villages')
}

const refreshStats = async () => {
  if (!isAuthenticated.value) return

  loading.value = true
  loadingMessage.value = '正在刷新統計...'

  try {
    const response = await getCacheStats()

    // Mock cache stats
    cacheStats.value = {
      total_entries: 1234,
      total_size: 52428800, // 50 MB
      hit_rate: 0.8523,
      avg_response_time: 45,
      cache_types: [
        { type: 'clustering', entries: 456, size: 20971520, hits: 1234, misses: 234, hit_rate: 0.8405 },
        { type: 'semantic', entries: 389, size: 15728640, hits: 987, misses: 156, hit_rate: 0.8635 },
        { type: 'features', entries: 289, size: 10485760, hits: 678, misses: 123, hit_rate: 0.8464 },
        { type: 'spatial', entries: 100, size: 5242880, hits: 234, misses: 45, hit_rate: 0.8387 }
      ],
      usage_trend: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        entries: Math.floor(Math.random() * 500) + 800
      })),
      hit_rate_trend: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        rate: 0.7 + Math.random() * 0.2
      }))
    }

    await nextTick()
    renderCharts()
    showSuccess('統計刷新成功')
  } catch (error) {
    showError(error.message || '刷新統計失敗')
  } finally {
    loading.value = false
  }
}

const clearCacheType = async (type) => {
  const confirmed = await showConfirm(`確定要清除 ${type} 緩存嗎？`, {
    title: '清除確認',
    confirmText: '清除',
    cancelText: '取消'
  })

  if (!confirmed) return

  loading.value = true
  loadingMessage.value = `正在清除 ${type} 緩存...`

  try {
    await clearCache({ type })
    showSuccess(`${type} 緩存已清除`)
    await refreshStats()
  } catch (error) {
    showError(error.message || '清除緩存失敗')
  } finally {
    loading.value = false
  }
}

const clearAllCache = async () => {
  const confirmed = await showConfirm('確定要清除所有緩存嗎？此操作不可撤銷。', {
    title: '清除所有緩存',
    confirmText: '清除',
    cancelText: '取消'
  })

  if (!confirmed) return

  loading.value = true
  loadingMessage.value = '正在清除所有緩存...'

  try {
    await clearCache({ type: 'all' })
    showSuccess('所有緩存已清除')
    await refreshStats()
  } catch (error) {
    showError(error.message || '清除緩存失敗')
  } finally {
    loading.value = false
  }
}

const clearExpiredCache = async () => {
  loading.value = true
  loadingMessage.value = '正在清除過期緩存...'

  try {
    await clearCache({ type: 'expired' })
    showSuccess('過期緩存已清除')
    await refreshStats()
  } catch (error) {
    showError(error.message || '清除過期緩存失敗')
  } finally {
    loading.value = false
  }
}

const optimizeCache = async () => {
  loading.value = true
  loadingMessage.value = '正在優化緩存...'

  try {
    // Mock optimization
    await new Promise(resolve => setTimeout(resolve, 2000))
    showSuccess('緩存優化完成')
    await refreshStats()
  } catch (error) {
    showError(error.message || '緩存優化失敗')
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  if (!cacheStats.value) return

  renderUsageChart()
  renderHitRateChart()
}

const renderUsageChart = () => {
  if (!usageChart.value) return

  const chart = echarts.init(usageChart.value)
  const data = cacheStats.value.usage_trend

  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map(d => `${d.hour}:00`),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '緩存條目數' },
    series: [{
      type: 'line',
      data: data.map(d => d.entries),
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(74, 144, 226, 0.5)' },
          { offset: 1, color: 'rgba(74, 144, 226, 0.1)' }
        ])
      },
      lineStyle: { color: '#4a90e2' }
    }]
  })
}

const renderHitRateChart = () => {
  if (!hitRateChart.value) return

  const chart = echarts.init(hitRateChart.value)
  const data = cacheStats.value.hit_rate_trend

  chart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    xAxis: {
      type: 'category',
      data: data.map(d => `${d.hour}:00`),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '命中率 (%)', min: 0, max: 100 },
    series: [{
      type: 'line',
      data: data.map(d => (d.rate * 100).toFixed(2)),
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(80, 200, 120, 0.5)' },
          { offset: 1, color: 'rgba(80, 200, 120, 0.1)' }
        ])
      },
      lineStyle: { color: '#50c878' }
    }]
  })
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

const formatPercent = (value) => {
  return (value * 100).toFixed(2) + '%'
}

// Lifecycle
onMounted(() => {
  if (isAuthenticated.value) {
    refreshStats()
  }
})
</script>

<style scoped>
.cache-management-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.auth-warning {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(231, 76, 60, 0.1);
  border: 2px solid rgba(231, 76, 60, 0.3);
  border-radius: 12px;
  color: #e74c3c;
  font-weight: 500;
}

.lock-icon {
  font-size: 20px;
}

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(74, 144, 226, 0.2);
}

.panel-header h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
}

.glass-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.glass-button.secondary {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.glass-button.small {
  padding: 6px 12px;
  font-size: 13px;
}

.glass-button.danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(74, 144, 226, 0.2);
}

.stat-icon {
  font-size: 36px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #4a90e2;
}

.chart-section {
  margin-bottom: 32px;
}

.chart-section h4 {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.chart-container {
  width: 100%;
  height: 300px;
}

.glass-table {
  width: 100%;
  border-collapse: collapse;
}

.glass-table thead {
  background: rgba(74, 144, 226, 0.1);
}

.glass-table th,
.glass-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
}

.glass-table th {
  font-weight: 600;
  color: var(--text-primary);
}

.actions-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 2px solid rgba(74, 144, 226, 0.2);
}

.action-info h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.action-info p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  margin-top: 16px;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .cache-management-page {
    padding: 12px;
  }

  .action-card {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .chart-container {
    height: 250px;
  }
}
</style>