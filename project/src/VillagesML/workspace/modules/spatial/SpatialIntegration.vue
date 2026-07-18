<template>
<!--  <ExploreLayout>-->
    <div class="spatial-integration-page">
<!--      <h3 class="villagesml-subtab-title">空間分析 - 空間整合</h3>-->
      <h1 class="page-title">
        🌐 空間整合分析
        <HelpIcon content="整合字符傾向與空間聚類數據。分析字符在特定聚類中的傾向偏差、空間一致性和統計顯著性。支持按字符或按聚類查詢" />
      </h1>

      <!-- Query Mode Selector -->
      <div class="mode-selector vml-control-surface vml-control-row vml-control-row--center">
        <RadioGroup
            name="spatialQueryMode"
            :options="queryModeOptions"
            v-model="queryMode"
        />
      </div>

      <!-- Overview Mode -->
      <div v-if="queryMode === 'overview'" class="overview-section">

        <div v-if="loadingIntegration" class="vml-loading vml-glass-panel">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="integrationData && integrationData.length > 0" class="integration-results">
          <!-- Statistics -->
          <div class="stats-section vml-glass-panel">
            <h3>空間整合查詢</h3>
            <p class="query-note">查詢統計顯著的字符-聚類整合數據</p>
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
                <div class="stat-label">顯著記錄數</div>
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
        <div class="query-form vml-glass-panel">
          <h3>按字符查詢空間分佈</h3>

          <!-- Load Characters Button -->
          <div v-if="availableCharacters.length === 0" class="vml-control-surface vml-control-actions">
            <button
              class="query-button load-clusters-button"
              :disabled="loadingCharacters"
              @click="loadCharacters"
            >
              {{ loadingCharacters ? '加載中...' : '加載字符列表' }}
            </button>
          </div>

          <!-- Character Selector -->
          <div v-else class="form-group vml-control-surface vml-control-row">
            <div class="vml-control-field">
              <label>選擇字符:</label>
              <SimpleSelectDropdown :match-trigger-width="true"
                v-model="queryChar"
                :options="characterOptions"
              />
            </div>
          </div>
        </div>

        <div v-if="loadingByChar" class="vml-loading vml-glass-panel">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="charData" class="char-results">
          <!-- Spatial Distribution Map -->
          <div class="map-section vml-glass-panel">
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
          <div v-if="charData.tendency" class="tendency-section vml-glass-panel">
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
                      background: item.z_score >= 0 ? 'var(--color-primary)' : 'var(--color-error)'
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
        <div class="query-form vml-glass-panel">
          <h3>按聚類查詢</h3>

          <!-- Load Clusters Button -->
          <div v-if="availableClusters.length === 0" class="vml-control-surface vml-control-actions">
            <button
              class="load-clusters-button"
              :disabled="loadingClusters"
              @click="loadClusters"
            >
              {{ loadingClusters ? '加載中...' : '加載聚類列表' }}
            </button>
          </div>

          <!-- Cluster Selector -->
          <div v-else class="form-group vml-control-surface vml-control-row">
            <div class="vml-control-field">
              <label>選擇聚類:</label>
              <SimpleSelectDropdown :match-trigger-width="true"
                v-model="clusterId"
                :options="clusterOptions"
              />
            </div>
          </div>
        </div>

        <div v-if="loadingByCluster" class="vml-loading vml-glass-panel">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="clusterData" class="cluster-results">
          <!-- Cluster Map -->
          <div class="map-section vml-glass-panel">
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
          <div v-if="clusterData.characters && clusterData.characters.length > 0" class="characteristics-section vml-glass-panel">
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
          <div v-if="clusterData.characters" class="villages-section vml-glass-panel">
            <h3>字符傾向性 ({{ clusterData.characters.length }})</h3>
            <div class="characters-table">
              <div class="char-table-header">
                <div>字符</div>
                <div>類別</div>
                <div>聚類傾向</div>
                <div>全局傾向</div>
                <div>傾向偏差</div>
                <div>村莊數</div>
                <div>空間一致性</div>
                <div>空間特異性</div>
                <div>p值</div>
                <div>顯著性</div>
              </div>
              <div class="char-table-body">
                <div
                  v-for="char in clusterData.characters.slice(0, 50)"
                  :key="char.character"
                  class="char-table-row"
                  :class="{ 'significant': char.is_significant }"
                >
                  <div class="char-name">{{ char.character }}</div>
                  <div>
                    <span class="category-badge-small">{{ getCategoryName(char.character_category) }}</span>
                  </div>
                  <div class="char-tendency" :style="{ color: getTendencyColor(char.cluster_tendency_mean) }">
                    {{ char.cluster_tendency_mean?.toFixed(3) || 'N/A' }}
                  </div>
                  <div class="char-tendency">
                    {{ char.global_tendency_mean?.toFixed(3) || 'N/A' }}
                  </div>
                  <div class="char-deviation" :style="{ color: getDeviationColor(char.tendency_deviation) }">
                    {{ char.tendency_deviation >= 0 ? '+' : '' }}{{ char.tendency_deviation?.toFixed(3) || 'N/A' }}
                  </div>
                  <div class="char-villages">{{ char.n_villages_with_char }}</div>
                  <div>{{ char.spatial_coherence?.toFixed(3) || 'N/A' }}</div>
                  <div>{{ char.spatial_specificity?.toFixed(2) || 'N/A' }}</div>
                  <div class="char-pvalue">{{ char.p_value?.toExponential(2) || 'N/A' }}</div>
                  <div>
                    <span v-if="char.is_significant" class="char-badge">✨ 顯著</span>
                    <span v-else class="not-significant">-</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="clusterData.characters.length > 50" class="more-info">
              顯示前 50 個字符，共 {{ clusterData.characters.length }} 個
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Section -->
      <div v-if="summary" class="summary-section vml-glass-panel">
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
          class="query-button load-button"
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
import { ref, computed, watch, onMounted } from 'vue'
import SpatialMap from './SpatialMap.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import {
  getSpatialIntegration,
  getSpatialIntegrationByChar,
  getSpatialIntegrationByCluster,
  getSpatialIntegrationSummary,
  getSpatialIntegrationAvailableCharacters,
  getSpatialIntegrationClusterList
} from '@/api/index.js'
import { showError } from '@/utils/ui/message.js'
import { getCategoryName } from '@/VillagesML/config/villagesML.js'
import RadioGroup from "@/components/selector/RadioGroup.vue";

// State
const queryMode = ref('overview')
const queryModeOptions = [
  { value: 'overview', label: '總覽' },
  { value: 'by-char', label: '按字符' },
  { value: 'by-cluster', label: '按聚類' }
]

const queryChar = ref('')
const clusterId = ref(null)

const integrationData = ref(null)
const charData = ref(null)
const clusterData = ref(null)
const summary = ref(null)
const availableClusters = ref([])
const availableCharacters = ref([])

const loadingIntegration = ref(false)
const loadingByChar = ref(false)
const loadingByCluster = ref(false)
const loadingSummary = ref(false)
const loadingClusters = ref(false)
const loadingCharacters = ref(false)

// Dropdown options
const characterOptions = computed(() => {
  const options = [{ label: '請選擇字符', value: '' }]
  availableCharacters.value.forEach(char => {
    options.push({
      label: `${char.character} - ${getCategoryName(char.category)} (${char.total_villages}村, ${char.total_clusters}聚類)`,
      value: char.character
    })
  })
  return options
})

const clusterOptions = computed(() => {
  const options = [{ label: '請選擇聚類', value: null }]
  availableClusters.value.forEach(cluster => {
    options.push({
      label: `聚類 #${cluster.cluster_id} - ${cluster.dominant_city}${cluster.dominant_county} (${cluster.cluster_size}村, ${cluster.total_characters}字符)`,
      value: cluster.cluster_id
    })
  })
  return options
})

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
      cluster_tendency_std: item.tendency_std,
      global_tendency_mean: item.global_tendency_mean,
      tendency_deviation: item.tendency_deviation,
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
        0, 4,
        50, 6,
        100, 9,
        500, 11
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
        2,
        1
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'is_significant'], 1],
        '#ffd700',
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
        0, 8,
        50, 11,
        100, 14,
        500, 17,
        1000, 20
      ],
      'circle-color': 'rgba(74, 144, 226, 0.6)',
      'circle-opacity': 0.7,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#4a90e2'
    }
  }]
})

// Methods
const loadIntegration = async () => {
  loadingIntegration.value = true
  try {
    integrationData.value = await getSpatialIntegration({
      is_significant: true,
      limit: 1000
    })
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

const loadClusters = async () => {
  loadingClusters.value = true
  try {
    const response = await getSpatialIntegrationClusterList()
    availableClusters.value = response.clusters
    // 已经按聚类大小降序排序，无需再排序
  } catch (error) {
    showError('加載聚類列表失敗')
  } finally {
    loadingClusters.value = false
  }
}

const loadCharacters = async () => {
  loadingCharacters.value = true
  try {
    const response = await getSpatialIntegrationAvailableCharacters()
    availableCharacters.value = response.characters
    // 按村庄数量降序排序
    availableCharacters.value.sort((a, b) => b.total_villages - a.total_villages)
  } catch (error) {
    showError('加載字符列表失敗')
  } finally {
    loadingCharacters.value = false
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
  if (tendency > 1) return 'green'  // 深绿色（高倾向性）
  if (tendency > 0.5) return '#34c759'  // 绿色
  if (tendency > 0) return '#90EE90'  // 浅绿色
  if (tendency > -0.5) return '#ff3b30'  // 浅红色
  if (tendency > -1) return '#d32f2f'  // 红色
  return '#962020'  // 深红色（低倾向性）
}

// 根据偏差值返回颜色
const getDeviationColor = (deviation) => {
  if (!deviation) return '#666'
  if (deviation > 0.5) return 'green'  // 深绿色（正偏差）
  if (deviation > 0.2) return '#34c759'  // 绿色
  if (deviation > 0) return '#90EE90'  // 浅绿色
  if (deviation > -0.2) return '#ff3b30'  // 浅红色
  if (deviation > -0.5) return '#d32f2f'  // 红色
  return '#962020'  // 深红色（负偏差）
}

// 监听 queryMode 变化，自动加载对应数据
watch(queryMode, (newMode) => {
  if (newMode === 'overview') {
    loadIntegration()
  } else if (newMode === 'by-char' && availableCharacters.value.length === 0) {
    loadCharacters()
  } else if (newMode === 'by-cluster' && availableClusters.value.length === 0) {
    loadClusters()
  }
})

// 监听 queryChar 变化，自动加载字符数据
watch(queryChar, (newChar) => {
  if (newChar && newChar !== '') {
    loadByChar()
  }
})

// 监听 clusterId 变化，自动加载聚类数据
watch(clusterId, (newId) => {
  if (newId) {
    loadByCluster()
  }
})

// 页面加载时自动加载总览数据
onMounted(() => {
  loadIntegration()
})
</script>

<style scoped lang="scss">
.spatial-integration-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Prevent surface containers from forcing overflow */
.vml-glass-panel {
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
  margin-bottom: 16px;
}

.query-form {
  padding: 12px;
  margin-bottom: 16px;
}

.query-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.query-form h3 {
  font-size: 16px;
  margin: 0;
  color: var(--text-primary);
}

.query-note {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  padding: 4px 12px;
  background: rgba(var(--vml-blue-rgb), 0.05);
  border-radius: var(--radius-sm);
}

.form-group {
  max-width: 520px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.load-clusters-button {
  background: rgba(var(--vml-blue-rgb), 0.8);
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
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
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
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
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
  @include flex-col;
  gap: 10px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
}

.tendency-region {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tendency-bar {
  height: 20px;
  background: var(--glass-50);
  border-radius: var(--radius-md);
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
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
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
  @include flex-col;
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
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
  gap: 12px;
}

.character-item.significant {
  background: rgba(var(--color-gold-rgb), 0.1);
  border: 1px solid rgba(var(--color-gold-rgb), 0.3);
}

.characters-list {
  @include flex-col;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.characters-table {
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
}

.char-table-header {
  display: grid;
  grid-template-columns: 50px 80px 85px 85px 85px 70px 90px 90px 100px 80px;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 13px;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: center;
}

.char-table-header > div {
  text-align: center;
}

.char-table-body {
  @include flex-col;
}

.char-table-row {
  display: grid;
  grid-template-columns: 50px 80px 85px 85px 85px 70px 90px 90px 100px 80px;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  font-size: 13px;
  transition: background 0.3s ease;
  text-align: center;
}

.char-table-row > div {
  text-align: center;
}

.char-table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.char-table-row.significant {
  background: rgba(var(--color-gold-rgb), 0.1);
  border-left: 3px solid var(--color-gold);
}

.char-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.category-badge-small {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(var(--vml-blue-rgb), 0.15);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 11px;
  font-weight: 500;
}

.char-tendency {
  font-size: 13px;
  font-weight: 600;
}

.char-deviation {
  font-size: 13px;
  font-weight: 600;
}

.char-pvalue {
  font-size: 11px;
  color: var(--text-secondary);
}

.char-villages {
  font-size: 13px;
  color: var(--text-secondary);
}

.char-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(var(--color-gold-rgb), 0.2);
  color: var(--color-warning-dark);
  border-radius: var(--radius-md);
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
  background: rgba(var(--color-warning-rgb), 0.1);
  border-radius: var(--radius-sm2);
  color: var(--text-secondary);
  font-size: 13px;
}

.summary-section {
  padding: 12px;
  margin-top: 20px;
}

.summary-section h2 {
  margin-bottom: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-card {
  padding: 12px;
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
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
}

.integration-table {
  border-radius: var(--radius-md);
  overflow: hidden;
  display: inline-block;
  min-width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 50px 80px 70px 75px 75px 75px 70px 70px 85px 85px 85px 70px 85px 85px;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
  font-size: 13px;
}

.table-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  text-align: center;
}

.table-header > div {
  text-align: center;
}

.table-row {
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.3s ease;
  text-align: center;
}

.table-row > div {
  text-align: center;
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.table-row.significant-row {
  background: rgba(var(--color-gold-rgb), 0.1);
  border-left: 3px solid var(--color-gold);
}

.char-cell {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.tendency-cell {
  font-weight: 600;
}

.deviation-cell {
  font-weight: 600;
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(var(--vml-blue-rgb), 0.15);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
}

.significant-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(var(--color-gold-rgb), 0.2);
  color: var(--color-warning-dark);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
}

.not-significant {
  color: var(--text-secondary);
  font-size: 12px;
}

/* 移动端横向滚动样式 */
@media (max-aspect-ratio: 1/1) {
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 20px;
  }

  .mode-selector {
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
