<template>
<!--  <ExploreLayout>-->
    <div class="spatial-integration-page">
<!--      <h3 class="villagesml-subtab-title">空間分析 - 空間整合</h3>-->
      <h1 class="page-title">🌐 空間整合分析</h1>

      <!-- Query Mode Selector -->
      <div class="mode-selector glass-panel">
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'overview' }"
          @click="queryMode = 'overview'"
        >
          總覽
        </button>
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'by-char' }"
          @click="queryMode = 'by-char'"
        >
          按字符
        </button>
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'by-cluster' }"
          @click="queryMode = 'by-cluster'"
        >
          按聚類
        </button>
      </div>

      <!-- Overview Mode -->
      <div v-if="queryMode === 'overview'" class="overview-section">
        <div class="query-form glass-panel">
          <h3>空間整合查詢</h3>
          <p class="query-note">查詢所有字符-聚類整合數據</p>
          <button
            class="query-button"
            :disabled="loadingIntegration"
            @click="loadIntegration"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingIntegration" class="loading-state glass-panel">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="integrationData && integrationData.length > 0" class="integration-results">
          <!-- Statistics -->
          <div class="stats-section glass-panel">
            <h3>統計信息</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">字符數量</div>
                <div class="stat-value">{{ uniqueCharacters.length }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">聚類數量</div>
                <div class="stat-value">{{ uniqueClusters.length }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">總記錄數</div>
                <div class="stat-value">{{ integrationData.length }}</div>
              </div>
            </div>
          </div>

          <!-- Integration Table -->
          <div class="table-scroll-wrapper">
            <div class="integration-table">
              <div class="table-header">
                <div>字符</div>
                <div>類別</div>
                <div>聚類ID</div>
                <div>聚類傾向</div>
                <div>全局傾向</div>
                <div>傾向偏差</div>
                <div>聚類大小</div>
                <div>村莊數</div>
                <div>平均距離</div>
                <div>空間一致性</div>
                <div>空間特異性</div>
                <div>顯著性</div>
                <div>主導城市</div>
                <div>主導區縣</div>
              </div>
              <div class="table-body">
                <div
                  v-for="item in integrationData"
                  :key="item.id"
                  class="table-row"
                  :class="{ 'significant-row': item.is_significant }"
                >
                  <div class="char-cell">{{ item.character }}</div>
                  <div>
                    <span class="category-badge">{{ getCategoryName(item.character_category) }}</span>
                  </div>
                  <div>{{ item.cluster_id }}</div>
                  <div class="tendency-cell" :style="{ color: getTendencyColor(item.cluster_tendency_mean) }">
                    {{ item.cluster_tendency_mean?.toFixed(3) || 'N/A' }}
                  </div>
                  <div class="tendency-cell">
                    {{ item.global_tendency_mean?.toFixed(3) || 'N/A' }}
                  </div>
                  <div class="deviation-cell" :style="{ color: getDeviationColor(item.tendency_deviation) }">
                    {{ item.tendency_deviation >= 0 ? '+' : '' }}{{ item.tendency_deviation?.toFixed(3) || 'N/A' }}
                  </div>
                  <div>{{ item.cluster_size?.toLocaleString() || 'N/A' }}</div>
                  <div>{{ item.n_villages_with_char?.toLocaleString() || 'N/A' }}</div>
                  <div>{{ item.avg_distance_km?.toFixed(1) || 'N/A' }} km</div>
                  <div>{{ item.spatial_coherence?.toFixed(3) || 'N/A' }}</div>
                  <div>{{ item.spatial_specificity?.toFixed(3) || 'N/A' }}</div>
                  <div>
                    <span v-if="item.is_significant" class="significant-badge">✨ 顯著</span>
                    <span v-else class="not-significant">-</span>
                  </div>
                  <div>{{ item.dominant_city || 'N/A' }}</div>
                  <div>{{ item.dominant_county || 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- By Character Mode -->
      <div v-if="queryMode === 'by-char'" class="by-char-section">
        <div class="query-form glass-panel">
          <h3>按字符查詢空間分佈</h3>
          <div class="form-group">
            <label>字符:</label>
            <input
              v-model="queryChar"
              type="text"
              maxlength="1"
              placeholder="輸入單個字符"
              class="char-input"
            />
          </div>
          <button
            class="query-button"
            :disabled="!queryChar || loadingByChar"
            @click="loadByChar"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingByChar" class="loading-state glass-panel">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="charData" class="char-results">
          <!-- Spatial Distribution Map -->
          <div class="map-section glass-panel">
            <h3>{{ queryChar }} 的空間分佈</h3>
            <SpatialMap
              v-if="charMapLayers.length > 0"
              :layers="charMapLayers"
              @point-click="handlePointClick"
            />
            <div v-else class="map-placeholder">
              <p>🗺️ 暫無地圖數據</p>
            </div>
          </div>

          <!-- Tendency Data -->
          <div v-if="charData.tendency" class="tendency-section glass-panel">
            <h3>區域傾向性</h3>
            <div class="tendency-list">
              <div
                v-for="(item, index) in charData.tendency.slice(0, 10)"
                :key="index"
                class="tendency-item"
              >
                <div class="tendency-region">{{ item.region }}</div>
                <div class="tendency-bar">
                  <div
                    class="tendency-fill"
                    :style="{
                      width: `${Math.abs(item.z_score) * 10}%`,
                      background: item.z_score >= 0 ? 'var(--color-primary)' : '#e74c3c'
                    }"
                  ></div>
                </div>
                <div class="tendency-value">Z: {{ item.z_score?.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- By Cluster Mode -->
      <div v-if="queryMode === 'by-cluster'" class="by-cluster-section">
        <div class="query-form glass-panel">
          <h3>按聚類查詢</h3>
          <div class="form-group">
            <label>聚類ID:</label>
            <input
              v-model.number="clusterId"
              type="number"
              min="1"
              placeholder="輸入聚類ID"
              class="number-input"
            />
          </div>
          <button
            class="query-button"
            :disabled="!clusterId || loadingByCluster"
            @click="loadByCluster"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingByCluster" class="loading-state glass-panel">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="clusterData" class="cluster-results">
          <!-- Cluster Map -->
          <div class="map-section glass-panel">
            <h3>聚類 #{{ clusterId }} 空間分佈</h3>
            <SpatialMap
              v-if="clusterMapLayers.length > 0"
              :layers="clusterMapLayers"
              @point-click="handlePointClick"
            />
            <div v-else class="map-placeholder">
              <p>🗺️ 暫無地圖數據</p>
            </div>
          </div>

          <!-- Cluster Statistics -->
          <div v-if="clusterData.characters && clusterData.characters.length > 0" class="characteristics-section glass-panel">
            <h3>聚類統計</h3>
            <div class="characteristics-grid">
              <div class="char-item">
                <div class="char-label">聚類大小</div>
                <div class="char-value">{{ clusterData.characters[0]?.cluster_size || 'N/A' }} 村</div>
              </div>
              <div class="char-item">
                <div class="char-label">平均距離</div>
                <div class="char-value">{{ clusterData.characters[0]?.avg_distance_km?.toFixed(2) || 'N/A' }} km</div>
              </div>
              <div class="char-item">
                <div class="char-label">空間一致性</div>
                <div class="char-value">{{ clusterData.characters[0]?.spatial_coherence?.toFixed(3) || 'N/A' }}</div>
              </div>
              <div class="char-item">
                <div class="char-label">主要城市</div>
                <div class="char-value">{{ clusterData.characters[0]?.dominant_city || 'N/A' }}</div>
              </div>
              <div class="char-item">
                <div class="char-label">主要區縣</div>
                <div class="char-value">{{ clusterData.characters[0]?.dominant_county || 'N/A' }}</div>
              </div>
              <div class="char-item">
                <div class="char-label">字符數量</div>
                <div class="char-value">{{ clusterData.total_characters || 0 }}</div>
              </div>
            </div>
          </div>

          <!-- Character Tendency List -->
          <div v-if="clusterData.characters" class="villages-section glass-panel">
            <h3>字符傾向性 ({{ clusterData.characters.length }})</h3>
            <div class="characters-list">
              <div
                v-for="char in clusterData.characters.slice(0, 50)"
                :key="char.character"
                class="character-item"
                :class="{ 'significant': char.is_significant }"
              >
                <span class="char-name">{{ char.character }}</span>
                <span class="char-tendency" :style="{ color: getTendencyColor(char.cluster_tendency_mean) }">
                  {{ char.cluster_tendency_mean?.toFixed(3) || 'N/A' }}
                </span>
                <span class="char-villages">{{ char.n_villages_with_char }} 村</span>
                <span v-if="char.is_significant" class="char-badge">✨ 顯著</span>
              </div>
            </div>
            <div v-if="clusterData.characters.length > 50" class="more-info">
              顯示前 50 個字符，共 {{ clusterData.characters.length }} 個
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Section -->
      <div v-if="summary" class="summary-section glass-panel">
        <h2>整合摘要</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon">🔥</div>
            <div class="summary-label">總熱點數</div>
            <div class="summary-value">{{ summary.total_hotspots }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">🎯</div>
            <div class="summary-label">總聚類數</div>
            <div class="summary-value">{{ summary.total_clusters }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📊</div>
            <div class="summary-label">覆蓋率</div>
            <div class="summary-value">{{ (summary.coverage * 100).toFixed(1) }}%</div>
          </div>
        </div>
        <button
          class="load-button"
          :disabled="loadingSummary"
          @click="loadSummary"
        >
          加載摘要
        </button>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, computed } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import SpatialMap from './SpatialMap.vue'
import {
  getSpatialIntegration,
  getSpatialIntegrationByChar,
  getSpatialIntegrationByCluster,
  getSpatialIntegrationSummary
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryName } from '@/config/villagesML.js'

// State
const queryMode = ref('overview')
const queryChar = ref('')
const clusterId = ref(null)

const integrationData = ref(null)
const charData = ref(null)
const clusterData = ref(null)
const summary = ref(null)

const loadingIntegration = ref(false)
const loadingByChar = ref(false)
const loadingByCluster = ref(false)
const loadingSummary = ref(false)

// Computed properties
const uniqueCharacters = computed(() => {
  if (!integrationData.value) return []
  return [...new Set(integrationData.value.map(item => item.character))]
})

const uniqueClusters = computed(() => {
  if (!integrationData.value) return []
  return [...new Set(integrationData.value.map(item => item.cluster_id))]
})

// 地图图层数据
const charMapLayers = computed(() => {
  if (!charData.value || !charData.value.clusters) return []

  const features = charData.value.clusters.map(item => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [item.centroid_lon, item.centroid_lat]
    },
    properties: {
      type: 'integration',
      character: queryChar.value,
      cluster_id: item.cluster_id,
      cluster_tendency_mean: item.cluster_tendency_mean,
      cluster_tendency_std: item.tendency_std,  // 後端字段名是 tendency_std
      cluster_size: item.cluster_size,
      n_villages_with_char: item.n_villages_with_char,
      spatial_coherence: item.spatial_coherence,
      dominant_city: item.dominant_city,
      dominant_county: item.dominant_county,
      is_significant: item.is_significant,
      avg_p_value: item.avg_p_value
    }
  }))

  return [{
    id: 'char-integration',
    type: 'circle',
    data: {
      type: 'FeatureCollection',
      features
    },
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'cluster_size'],
        0, 8,
        50, 12,
        100, 16,
        500, 20
      ],
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'cluster_tendency_mean'],
        -2, 'rgba(128, 0, 128, 0.3)',
        0, 'rgba(128, 0, 128, 0.6)',
        2, 'rgba(128, 0, 128, 0.9)'
      ],
      'circle-opacity': 0.7,
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'is_significant'], 1],
        3,
        1
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'is_significant'], 1],
        '#FFD700',
        '#ffffff'
      ]
    }
  }]
})

const clusterMapLayers = computed(() => {
  if (!clusterData.value || !clusterData.value.characters) return []

  // 显示聚类中心点（一个大圆圈）
  // 使用第一个字符的坐标作为聚类中心（所有字符的坐标应该相同）
  const firstChar = clusterData.value.characters[0]
  if (!firstChar) return []

  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [firstChar.centroid_lon, firstChar.centroid_lat]
    },
    properties: {
      type: 'cluster-center',
      cluster_id: clusterData.value.cluster_id,
      cluster_size: firstChar.cluster_size,
      avg_distance_km: firstChar.avg_distance_km,
      spatial_coherence: firstChar.spatial_coherence,
      dominant_city: firstChar.dominant_city,
      dominant_county: firstChar.dominant_county,
      total_characters: clusterData.value.total_characters
    }
  }

  return [{
    id: 'cluster-center',
    type: 'circle',
    data: {
      type: 'FeatureCollection',
      features: [feature]
    },
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'cluster_size'],
        0, 15,
        50, 20,
        100, 25,
        500, 30,
        1000, 35
      ],
      'circle-color': 'rgba(74, 144, 226, 0.6)',
      'circle-opacity': 0.7,
      'circle-stroke-width': 3,
      'circle-stroke-color': '#4a90e2'
    }
  }]
})

// Methods
const loadIntegration = async () => {
  loadingIntegration.value = true
  try {
    integrationData.value = await getSpatialIntegration({ limit: 1000 })
  } catch (error) {
    showError('加載整合數據失敗')
  } finally {
    loadingIntegration.value = false
  }
}

const loadByChar = async () => {
  if (!queryChar.value) return

  loadingByChar.value = true
  try {
    charData.value = await getSpatialIntegrationByChar(queryChar.value)
  } catch (error) {
    showError('加載字符數據失敗')
  } finally {
    loadingByChar.value = false
  }
}

const loadByCluster = async () => {
  if (!clusterId.value) return

  loadingByCluster.value = true
  try {
    clusterData.value = await getSpatialIntegrationByCluster(clusterId.value)
  } catch (error) {
    showError('加載聚類數據失敗')
  } finally {
    loadingByCluster.value = false
  }
}

const loadSummary = async () => {
  loadingSummary.value = true
  try {
    summary.value = await getSpatialIntegrationSummary()
  } catch (error) {
    showError('加載摘要失敗')
  } finally {
    loadingSummary.value = false
  }
}

const formatValue = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return value
}

// 处理地图点击事件
const handlePointClick = (properties) => {
  console.log('Point clicked:', properties)
}

// 根据倾向性值返回颜色
const getTendencyColor = (tendency) => {
  if (!tendency) return '#666'
  if (tendency > 1) return '#228B22'  // 深绿色（高倾向性）
  if (tendency > 0.5) return '#50c878'  // 绿色
  if (tendency > 0) return '#90EE90'  // 浅绿色
  if (tendency > -0.5) return '#ff6b6b'  // 浅红色
  if (tendency > -1) return '#e74c3c'  // 红色
  return '#c0392b'  // 深红色（低倾向性）
}
</script>

<style scoped>
.spatial-integration-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Override glass-panel to prevent overflow */
.glass-panel {
  min-width: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0px;
  text-align: center;
}

.mode-selector {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.mode-button {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button:hover {
  background: rgba(74, 144, 226, 0.1);
}

.mode-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.query-form {
  padding: 12px;
  margin-bottom: 16px;
}

.query-form h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.query-note {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(74, 144, 226, 0.05);
  border-radius: 6px;
}

.form-group {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.select-input,
.text-input,
.number-input,
.char-input {
  padding: 8px 12px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.char-input {
  font-size: 20px;
  text-align: center;
}

.select-input:focus,
.text-input:focus,
.number-input:focus,
.char-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.query-button,
.load-button {
  width: 100%;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.query-button:hover:not(:disabled),
.load-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled,
.load-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.integration-results,
.char-results,
.cluster-results {
  display: grid;
  gap: 16px;
}

.map-section,
.stats-section,
.tendency-section,
.characteristics-section,
.villages-section {
  padding: 12px;
  min-width: 0;
}

.map-section h3,
.stats-section h3,
.tendency-section h3,
.characteristics-section h3,
.villages-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.map-placeholder {
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
}

.map-placeholder p {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.map-note {
  font-size: 13px !important;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.tendency-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.tendency-region {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tendency-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.tendency-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.characteristics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.char-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
}

.char-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.char-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.villages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 350px;
  overflow-y: auto;
}

.village-item,
.character-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  gap: 12px;
}

.character-item.significant {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.char-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 40px;
}

.char-tendency {
  font-size: 14px;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.char-villages {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: right;
}

.char-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.2);
  color: #c87f0a;
  border-radius: 10px;
  font-weight: 500;
}

.village-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.village-location {
  font-size: 12px;
  color: var(--text-secondary);
}

.more-info {
  margin-top: 10px;
  text-align: center;
  padding: 10px;
  background: rgba(243, 156, 18, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.summary-section {
  padding: 12px;
  margin-top: 20px;
}

.summary-section h2 {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
}

.summary-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

/* 移动端横向滚动容器 */
.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.integration-table {
  border-radius: 12px;
  overflow: hidden;
  display: inline-block;
  min-width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: auto auto auto auto auto auto auto auto;
  gap: 16px;
  padding: 12px 16px;
  align-items: center;
  font-size: 13px;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

/* 移动端横向滚动样式 */
@media (max-aspect-ratio: 1/1) {
  .table-scroll-wrapper::-webkit-scrollbar {
    height: 8px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-thumb {
    background: rgba(74, 144, 226, 0.5);
    border-radius: 4px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.7);
  }
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }

  .mode-selector {
    flex-direction: column;
    gap: 8px;
  }

  .form-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .tendency-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stats-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
