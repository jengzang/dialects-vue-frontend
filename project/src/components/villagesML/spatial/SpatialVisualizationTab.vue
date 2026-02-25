<template>
  <div class="spatial-visualization-tab">
<!--      <h3 class="villagesml-subtab-title">空間分析 - 空間可視化</h3>-->
    <h2>🗺️ 空間可視化</h2>

    <div class="viz-container">
      <!-- 左側控制面板 -->
      <div class="control-panel" :class="{ 'is-collapsed': isPanelCollapsed }">
        <button class="collapse-btn" @click="isPanelCollapsed = !isPanelCollapsed">
          {{ isPanelCollapsed ? '◀' : '▶' }}
        </button>

        <div v-if="!isPanelCollapsed" class="panel-content">
          <!-- 圖層選擇 -->
          <div class="section">
            <h3>圖層選擇</h3>
            <div class="layer-checkboxes">
              <label class="checkbox-item">
                <input type="checkbox" v-model="layers.hotspots" @change="onLayerChange">
                <span>🔴 空間熱點</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="layers.clusters" @change="onLayerChange">
                <span>🔵 空間聚類</span>
              </label>
              <div v-if="layers.clusters && availableRuns.length" class="run-selector-inline">
                <select v-model="selectedRunId" class="filter-select" style="margin-bottom:0">
                  <option v-for="run in availableRuns" :key="run.run_id" :value="run.run_id">
                    {{ SPATIAL_CLUSTERING_RUN_LABELS[run.run_id] || run.run_id }}
                  </option>
                </select>
              </div>
              <label class="checkbox-item">
                <input type="checkbox" v-model="layers.ngrams" @change="onLayerChange">
                <span>🟢 N-gram 分佈</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="layers.characters" @change="onLayerChange">
                <span>🟡 字符傾向</span>
              </label>
            </div>
            <p class="layer-note">💡 提示：如需字符-聚類整合分析，請使用「空間整合」標籤頁</p>
          </div>

          <!-- N-gram 過濾器 -->
          <div v-if="layers.ngrams" class="section">
            <h3>N-gram 設置</h3>
            <p class="layer-note">⚠️ 僅支持 2-4 字符的 N-gram，區域固定為鄉鎮級</p>
            <input
              v-model="filters.ngram"
              type="text"
              placeholder="輸入 2-4 字 N-gram（如：新村）"
              class="filter-input"
              maxlength="4"
            >
          </div>

          <!-- 字符過濾器 -->
          <div v-if="layers.characters" class="section">
            <h3>字符設置</h3>
            <input
              v-model="filters.character"
              type="text"
              placeholder="輸入字符（如：村）"
              maxlength="1"
              class="filter-input"
            >
            <select v-model="filters.charLevel" class="filter-select">
              <option value="city">城市</option>
              <option value="county">區縣</option>
              <option value="township">鄉鎮</option>
            </select>
          </div>

          <!-- 應用按鈕 -->
          <div class="section">
            <button
              class="apply-btn"
              @click="loadData"
              :disabled="loading"
            >
              {{ loading ? '加載中...' : '應用' }}
            </button>
          </div>

          <!-- 圖例 -->
          <div v-if="hasActiveLayers" class="section legend-section">
            <h3>圖例</h3>
            <div class="legend-items">
              <div v-if="layers.hotspots" class="legend-item">
                <span class="legend-color" style="background: rgba(255, 100, 100, 0.6);"></span>
                <span>熱點區域</span>
              </div>
              <div v-if="layers.clusters" class="legend-item">
                <span class="legend-color" style="background: rgba(74, 144, 226, 0.7);"></span>
                <span>聚類中心</span>
              </div>
              <div v-if="layers.ngrams" class="legend-item">
                <span class="legend-color" style="background: rgba(80, 200, 120, 0.7);"></span>
                <span>N-gram 分佈</span>
              </div>
              <div v-if="layers.characters" class="legend-item">
                <div class="legend-gradient"></div>
                <span>字符傾向（藍→白→紅）</span>
              </div>
            </div>
          </div>

          <!-- 統計信息 -->
          <div v-if="statistics.total > 0" class="section stats-section">
            <h3>統計</h3>
            <div class="stats-items">
              <div class="stat-item">
                <span class="stat-label">總點數:</span>
                <span class="stat-value">{{ statistics.total }}</span>
              </div>
              <div v-if="statistics.hotspots > 0" class="stat-item">
                <span class="stat-label">熱點:</span>
                <span class="stat-value">{{ statistics.hotspots }}</span>
              </div>
              <div v-if="statistics.clusters > 0" class="stat-item">
                <span class="stat-label">聚類:</span>
                <span class="stat-value">{{ statistics.clusters }}</span>
              </div>
              <div v-if="statistics.ngrams > 0" class="stat-item">
                <span class="stat-label">N-gram:</span>
                <span class="stat-value">{{ statistics.ngrams }}</span>
              </div>
              <div v-if="statistics.characters > 0" class="stat-item">
                <span class="stat-label">字符:</span>
                <span class="stat-value">{{ statistics.characters }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側地圖 -->
      <div class="map-panel">
        <SpatialMap
          v-if="mapReady"
          :layers="mapLayers"
          @point-click="handlePointClick"
        />
        <div v-else class="map-placeholder">
          <p>請選擇圖層並點擊"應用"以加載地圖</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SpatialMap from './SpatialMap.vue'
import {
  getSpatialHotspots,
  getSpatialClusters,
  getSpatialClustersAvailableRuns,
  getNgramTendency,
  getCharTendencyByChar
} from '@/api'
import { showError, showWarning } from '@/utils/message.js'
import {
  SPATIAL_CLUSTERING_RUN_LABELS,
  DEFAULT_SPATIAL_CLUSTERING_RUN_ID
} from '@/config/villagesML.js'

// 圖層狀態
const layers = ref({
  hotspots: false,
  clusters: false,
  ngrams: false,
  characters: false
})

// 聚類方案
const availableRuns = ref([])
const selectedRunId = ref('')

// 過濾器
const filters = ref({
  ngram: '',
  character: '',
  charLevel: 'city'
})

// UI 狀態
const loading = ref(false)
const isPanelCollapsed = ref(false)
const mapReady = ref(false)

// 地圖圖層數據
const mapLayers = ref([])

// 統計信息
const statistics = ref({
  total: 0,
  hotspots: 0,
  clusters: 0,
  ngrams: 0,
  characters: 0
})

// 計算屬性
const hasActiveLayers = computed(() => {
  return Object.values(layers.value).some(v => v)
})

// 圖層變化處理
const onLayerChange = () => {
  // 如果取消所有圖層，重置地圖
  if (!hasActiveLayers.value) {
    mapReady.value = false
    mapLayers.value = []
    statistics.value = {
      total: 0,
      hotspots: 0,
      clusters: 0,
      ngrams: 0,
      characters: 0
    }
  }
}

// 加載數據
const loadData = async () => {
  if (!hasActiveLayers.value) {
    showWarning('請至少選擇一個圖層')
    return
  }

  // 驗證過濾器
  if (layers.value.ngrams && !filters.value.ngram.trim()) {
    showWarning('請輸入 N-gram')
    return
  }
  if (layers.value.ngrams && (filters.value.ngram.trim().length < 2 || filters.value.ngram.trim().length > 4)) {
    showWarning('N-gram 須為 2-4 個字符')
    return
  }

  if (layers.value.characters && !filters.value.character.trim()) {
    showWarning('請輸入字符')
    return
  }

  loading.value = true
  mapLayers.value = []
  statistics.value = {
    total: 0,
    hotspots: 0,
    clusters: 0,
    ngrams: 0,
    characters: 0
  }

  try {
    const layerPromises = []

    // 加載熱點數據
    if (layers.value.hotspots) {
      layerPromises.push(loadHotspotsLayer())
    }

    // 加載聚類數據
    if (layers.value.clusters) {
      layerPromises.push(loadClustersLayer())
    }

    // 加載 N-gram 數據
    if (layers.value.ngrams) {
      layerPromises.push(loadNgramsLayer())
    }

    // 加載字符數據
    if (layers.value.characters) {
      layerPromises.push(loadCharactersLayer())
    }

    // 並行加載所有圖層
    await Promise.all(layerPromises)

    mapReady.value = true
  } catch (error) {
    console.error('Failed to load data:', error)
    showError(error.message || '加載數據失敗')
  } finally {
    loading.value = false
  }
}

// 加載熱點圖層
const loadHotspotsLayer = async () => {
  try {
    const hotspots = await getSpatialHotspots()

    if (!hotspots || hotspots.length === 0) {
      showWarning('沒有熱點數據')
      return
    }

    // 轉換為 GeoJSON
    const features = hotspots.map(h => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [h.center_lon, h.center_lat]
      },
      properties: {
        type: 'hotspot',
        hotspot_id: h.hotspot_id,
        radius_km: h.radius_km,
        village_count: h.village_count,
        density: h.density
      }
    }))

    mapLayers.value.push({
      id: 'hotspots',
      type: 'circle',
      data: {
        type: 'FeatureCollection',
        features
      },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'radius_km'],
          0, 5,
          50, 15,
          100, 25
        ],
        'circle-color': '#ff6464',
        'circle-opacity': 0.4,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ff6464'
      }
    })

    statistics.value.hotspots = hotspots.length
    statistics.value.total += hotspots.length
  } catch (error) {
    console.error('Failed to load hotspots:', error)
    throw error
  }
}

// 加載聚類圖層
const loadClustersLayer = async () => {
  try {
    const clusters = await getSpatialClusters({ run_id: selectedRunId.value || undefined, limit: 0 })

    if (!clusters || clusters.length === 0) {
      showWarning('沒有聚類數據')
      return
    }

    // 轉換為 GeoJSON
    const features = clusters.map(c => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [c.centroid_lon, c.centroid_lat]
      },
      properties: {
        type: 'cluster',
        cluster_id: c.cluster_id,
        cluster_size: c.size,
        avg_distance_km: c.avg_distance_km
      }
    }))

    mapLayers.value.push({
      id: 'clusters',
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
          0, 5,
          100, 10,
          1000, 15,
          10000, 20
        ],
        'circle-color': '#4a90e2',
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    })

    statistics.value.clusters = clusters.length
    statistics.value.total += clusters.length
  } catch (error) {
    console.error('Failed to load clusters:', error)
    throw error
  }
}

// 加載 N-gram 圖層
const loadNgramsLayer = async () => {
  try {
    const ngramData = await getNgramTendency({
      ngram: filters.value.ngram.trim(),
      region_level: 'township'
    })

    if (!ngramData || ngramData.length === 0) {
      showWarning(`沒有找到 "${filters.value.ngram}" 的區域數據`)
      return
    }

    const features = ngramData
      .filter(item => item.centroid_lon != null && item.centroid_lat != null)
      .map(item => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [item.centroid_lon, item.centroid_lat] },
        properties: {
          type: 'ngram',
          ngram: item.ngram,
          region_name: item.region_name,
          region_level: item.region_level,
          city: item.city,
          county: item.county,
          township: item.township,
          n: item.n,
          position: item.position,
          tendency_score: item.tendency_score,
          log_odds: item.log_odds,
          z_score: item.z_score,
          frequency: item.frequency,
          regional_total: item.regional_total,
          expected_frequency: item.expected_frequency,
          global_total: item.global_total
        }
      }))

    if (features.length === 0) {
      showWarning('區域數據缺少坐標')
      return
    }

    mapLayers.value.push({
      id: 'ngrams',
      type: 'circle',
      data: { type: 'FeatureCollection', features },
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'frequency'],
          0, 5, 50, 10, 200, 15, 500, 20
        ],
        'circle-color': [
          'interpolate', ['linear'], ['get', 'tendency_score'],
          0, '#90EE90', 1, '#50c878', 2, '#228B22'
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    })

    statistics.value.ngrams = features.length
    statistics.value.total += features.length
  } catch (error) {
    console.error('Failed to load ngrams:', error)
    throw error
  }
}

// 加載字符圖層
const loadCharactersLayer = async () => {
  try {
    const charData = await getCharTendencyByChar({
      character: filters.value.character.trim(),
      region_level: filters.value.charLevel
    })

    if (!charData || charData.length === 0) {
      showWarning(`沒有找到 "${filters.value.character}" 的區域數據`)
      return
    }

    const features = charData
      .filter(item => item.centroid_lon != null && item.centroid_lat != null)
      .map(item => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [item.centroid_lon, item.centroid_lat] },
        properties: {
          type: 'character',
          char: filters.value.character.trim(),
          region_name: item.region_name,
          region_level: item.region_level,
          city: item.city,
          county: item.county,
          township: item.township,
          lift: item.lift,
          z_score: item.z_score
        }
      }))

    if (features.length === 0) {
      showWarning('區域數據缺少坐標')
      return
    }

    mapLayers.value.push({
      id: 'characters',
      type: 'circle',
      data: { type: 'FeatureCollection', features },
      paint: {
        'circle-radius': 12,
        'circle-color': [
          'interpolate', ['linear'], ['get', 'lift'],
          0, '#0000ff',
          0.5, '#6495ed',
          1, '#ffffff',
          2, '#ff6b6b',
          4, '#ff0000'
        ],
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#333333'
      }
    })

    statistics.value.characters = features.length
    statistics.value.total += features.length
  } catch (error) {
    console.error('Failed to load characters:', error)
    throw error
  }
}

// 處理點擊事件
const handlePointClick = (properties) => {
  console.log('Point clicked:', properties)
  // 可以在這裡添加彈窗顯示詳細信息
}

// 初始化
onMounted(async () => {
  try {
    const response = await getSpatialClustersAvailableRuns()
    availableRuns.value = response.available_runs || []
    const hdbscan = availableRuns.value.find(r => r.run_id === DEFAULT_SPATIAL_CLUSTERING_RUN_ID)
    selectedRunId.value = hdbscan?.run_id || response.active_run_id || ''
  } catch { /* 靜默失敗 */ }
})
</script>

<style scoped>
.spatial-visualization-tab {
  padding: 16px;
  background: var(--glass-medium);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-weight: 600;
}

.viz-container {
  display: flex;
  gap: 16px;
  height: 600px;
}

/* 控制面板 */
.control-panel {
  position: relative;
  width: 280px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
  transition: width 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.control-panel.is-collapsed {
  width: 40px;
  padding: 8px;
}

.collapse-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  z-index: 10;
}

.collapse-btn:hover {
  background: rgba(74, 144, 226, 0.2);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.section:last-child {
  border-bottom: none;
}

.section h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

/* 圖層複選框 */
.layer-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.2s;
}

.checkbox-item:hover {
  background: rgba(74, 144, 226, 0.05);
}

.checkbox-item input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-item span {
  font-size: 14px;
  color: var(--text-primary);
}

/* 過濾器輸入 */
.filter-input,
.filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border 0.3s;
  margin-bottom: 8px;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #4a90e2;
}

.layer-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 12px;
  padding: 8px;
  background: rgba(74, 144, 226, 0.05);
  border-radius: 6px;
  line-height: 1.4;
}

/* 應用按鈕 */
.apply-btn {
  width: 100%;
  padding: 10px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.apply-btn:hover:not(:disabled) {
  background: #3a7bc8;
}

.apply-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 圖例 */
.legend-section {
  background: rgba(74, 144, 226, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-gradient {
  width: 40px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(to right, #0000ff, #ffffff, #ff0000);
  flex-shrink: 0;
}

/* 統計信息 */
.stats-section {
  background: rgba(80, 200, 120, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.stats-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

/* 地圖面板 */
.map-panel {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.map-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.map-placeholder p {
  font-size: 16px;
  color: var(--text-secondary);
}

/* 移動端響應式 */
@media (max-width: 768px) {
  .viz-container {
    flex-direction: column;
    height: auto;
  }

  .control-panel {
    width: 100%;
    max-height: 300px;
  }

  .control-panel.is-collapsed {
    width: 100%;
    max-height: 40px;
  }

  .map-panel {
    height: 400px;
  }
}
</style>
