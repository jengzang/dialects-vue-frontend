<template>
  <div class="region-similarity-page">
    <h1 class="page-title">🔍 區域相似度分析</h1>

    <!-- Mode Selector -->
    <div class="mode-selector glass-panel">
      <button
        class="mode-button"
        :class="{ 'active': queryMode === 'search' }"
        @click="queryMode = 'search'"
      >
        查找相似區域
      </button>
      <button
        class="mode-button"
        :class="{ 'active': queryMode === 'pair' }"
        @click="queryMode = 'pair'"
      >
        兩區域對比
      </button>
      <button
        class="mode-button"
        :class="{ 'active': queryMode === 'matrix' }"
        @click="queryMode = 'matrix'"
      >
        相似度矩陣
      </button>
    </div>

    <!-- Search Mode -->
    <div v-if="queryMode === 'search'" class="search-section">
      <div class="query-form glass-panel">
        <h3>查找相似區域</h3>

        <div class="form-group">
          <label>目標區域:</label>
          <select v-model="targetRegion" class="select-input">
            <option :value="null">請選擇區域</option>
            <option v-for="region in regionList" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>相似度指標:</label>
            <select v-model="metric" class="select-input">
              <option value="cosine">Cosine 相似度</option>
              <option value="jaccard">Jaccard 相似度</option>
            </select>
          </div>

          <div class="form-group">
            <label>返回數量:</label>
            <input v-model.number="topK" type="number" min="1" max="50" class="number-input" />
          </div>

          <div class="form-group">
            <label>最小相似度:</label>
            <input v-model.number="minSimilarity" type="number" min="0" max="1" step="0.1" class="number-input" />
          </div>
        </div>

        <button
          class="query-button"
          :disabled="!targetRegion || loadingSearch"
          @click="searchSimilarRegions"
        >
          {{ loadingSearch ? '查詢中...' : '查詢' }}
        </button>
      </div>

      <!-- Search Results -->
      <div v-if="loadingSearch" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="searchResults && searchResults.length > 0" class="search-results">
        <div class="results-header glass-panel">
          <h3>找到 {{ searchResults.length }} 個相似區域</h3>
        </div>

        <div class="results-grid">
          <div
            v-for="(result, index) in searchResults"
            :key="result.region"
            class="result-card glass-panel"
          >
            <div class="card-header">
              <span class="rank-badge">#{{ index + 1 }}</span>
              <h4>{{ result.region }}</h4>
            </div>

            <div class="similarity-bar-container">
              <div class="similarity-label">相似度: {{ (result.similarity * 100).toFixed(1) }}%</div>
              <div class="similarity-bar">
                <div
                  class="similarity-fill"
                  :style="{ width: `${result.similarity * 100}%` }"
                ></div>
              </div>
            </div>

            <div class="char-info">
              <div class="char-section">
                <div class="char-label">共同字符 ({{ result.common_chars?.length || 0 }}):</div>
                <div class="char-list">{{ result.common_chars?.slice(0, 10).join('、') || '無' }}</div>
              </div>
              <div class="char-section">
                <div class="char-label">特征字符 ({{ result.unique_chars?.length || 0 }}):</div>
                <div class="char-list">{{ result.unique_chars?.slice(0, 10).join('、') || '無' }}</div>
              </div>
            </div>

            <button class="detail-button" @click="compareRegions(targetRegion, result.region)">
              詳細對比
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pair Comparison Mode -->
    <div v-if="queryMode === 'pair'" class="pair-section">
      <div class="query-form glass-panel">
        <h3>兩區域對比</h3>

        <div class="form-row">
          <div class="form-group">
            <label>區域 1:</label>
            <select v-model="region1" class="select-input">
              <option :value="null">請選擇區域</option>
              <option v-for="region in regionList" :key="region" :value="region">
                {{ region }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>區域 2:</label>
            <select v-model="region2" class="select-input">
              <option :value="null">請選擇區域</option>
              <option v-for="region in regionList" :key="region" :value="region">
                {{ region }}
              </option>
            </select>
          </div>
        </div>

        <button
          class="query-button"
          :disabled="!region1 || !region2 || region1 === region2 || loadingPair"
          @click="loadPairComparison"
        >
          {{ loadingPair ? '對比中...' : '對比' }}
        </button>
      </div>

      <!-- Pair Results -->
      <div v-if="loadingPair" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="pairData" class="pair-results">
        <div class="similarity-metrics glass-panel">
          <h3>相似度指標</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Cosine 相似度</div>
              <div class="metric-value">{{ (pairData.cosine_similarity * 100).toFixed(1) }}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Jaccard 相似度</div>
              <div class="metric-value">{{ (pairData.jaccard_similarity * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <div class="comparison-details glass-panel">
          <h3>字符對比</h3>
          <div class="comparison-grid">
            <div class="comparison-section">
              <h4>共同字符 ({{ pairData.common_chars?.length || 0 }})</h4>
              <div class="char-cloud">
                <span v-for="char in pairData.common_chars" :key="char" class="char-tag common">
                  {{ char }}
                </span>
              </div>
            </div>

            <div class="comparison-section">
              <h4>{{ region1 }} 特有 ({{ pairData.unique_to_region1?.length || 0 }})</h4>
              <div class="char-cloud">
                <span v-for="char in pairData.unique_to_region1" :key="char" class="char-tag unique1">
                  {{ char }}
                </span>
              </div>
            </div>

            <div class="comparison-section">
              <h4>{{ region2 }} 特有 ({{ pairData.unique_to_region2?.length || 0 }})</h4>
              <div class="char-cloud">
                <span v-for="char in pairData.unique_to_region2" :key="char" class="char-tag unique2">
                  {{ char }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Matrix Mode -->
    <div v-if="queryMode === 'matrix'" class="matrix-section">
      <div class="query-form glass-panel">
        <h3>相似度矩陣</h3>

        <div class="form-group">
          <label>選擇區域 (最多20個):</label>
          <div class="region-selector">
            <select v-model="selectedRegionToAdd" class="select-input">
              <option :value="null">選擇區域...</option>
              <option
                v-for="region in availableRegionsForMatrix"
                :key="region"
                :value="region"
              >
                {{ region }}
              </option>
            </select>
            <button
              class="add-button"
              :disabled="!selectedRegionToAdd || selectedRegions.length >= 20"
              @click="addRegion"
            >
              添加
            </button>
          </div>
        </div>

        <div v-if="selectedRegions.length > 0" class="selected-regions">
          <div
            v-for="region in selectedRegions"
            :key="region"
            class="region-chip"
          >
            {{ region }}
            <button class="remove-button" @click="removeRegion(region)">×</button>
          </div>
        </div>

        <div class="form-group">
          <label>相似度指標:</label>
          <select v-model="matrixMetric" class="select-input">
            <option value="cosine">Cosine 相似度</option>
            <option value="jaccard">Jaccard 相似度</option>
          </select>
        </div>

        <button
          class="query-button"
          :disabled="selectedRegions.length < 2 || loadingMatrix"
          @click="loadMatrix"
        >
          {{ loadingMatrix ? '生成中...' : '生成矩陣' }}
        </button>
      </div>

      <!-- Matrix Results -->
      <div v-if="loadingMatrix" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="matrixData" class="matrix-results glass-panel">
        <h3>相似度矩陣熱力圖</h3>
        <div ref="heatmapChart" class="heatmap-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  getRegionList,
  getRegionSimilaritySearch,
  getRegionSimilarityPair,
  getRegionSimilarityMatrix
} from '@/api/index.js'
import { showError, showSuccess } from '@/utils/message.js'
import * as echarts from 'echarts'

export default {
  name: 'RegionSimilarity',
  setup() {
    // State
    const queryMode = ref('search')
    const regionList = ref([])
    const loadingRegions = ref(false)

    // Search mode
    const targetRegion = ref(null)
    const metric = ref('cosine')
    const topK = ref(10)
    const minSimilarity = ref(0.0)
    const searchResults = ref(null)
    const loadingSearch = ref(false)

    // Pair mode
    const region1 = ref(null)
    const region2 = ref(null)
    const pairData = ref(null)
    const loadingPair = ref(false)

    // Matrix mode
    const selectedRegions = ref([])
    const selectedRegionToAdd = ref(null)
    const matrixMetric = ref('cosine')
    const matrixData = ref(null)
    const loadingMatrix = ref(false)
    const heatmapChart = ref(null)
    let chartInstance = null

    // Computed
    const availableRegionsForMatrix = computed(() => {
      return regionList.value.filter(r => !selectedRegions.value.includes(r))
    })

    // Methods
    async function loadRegionList() {
      try {
        loadingRegions.value = true
        const data = await getRegionList({ region_level: 'county' })
        regionList.value = data.regions || []
      } catch (error) {
        showError('加載區域列表失敗: ' + error.message)
      } finally {
        loadingRegions.value = false
      }
    }

    async function searchSimilarRegions() {
      try {
        loadingSearch.value = true
        const data = await getRegionSimilaritySearch({
          region: targetRegion.value,
          top_k: topK.value,
          metric: metric.value,
          min_similarity: minSimilarity.value
        })
        searchResults.value = data.similar_regions || []
        if (searchResults.value.length === 0) {
          showError('未找到相似區域')
        }
      } catch (error) {
        showError('查詢失敗: ' + error.message)
      } finally {
        loadingSearch.value = false
      }
    }

    async function compareRegions(r1, r2) {
      region1.value = r1
      region2.value = r2
      queryMode.value = 'pair'
      await loadPairComparison()
    }

    async function loadPairComparison() {
      try {
        loadingPair.value = true
        const data = await getRegionSimilarityPair({
          region1: region1.value,
          region2: region2.value
        })
        pairData.value = data
      } catch (error) {
        showError('對比失敗: ' + error.message)
      } finally {
        loadingPair.value = false
      }
    }

    function addRegion() {
      if (selectedRegionToAdd.value && !selectedRegions.value.includes(selectedRegionToAdd.value)) {
        selectedRegions.value.push(selectedRegionToAdd.value)
        selectedRegionToAdd.value = null
      }
    }

    function removeRegion(region) {
      selectedRegions.value = selectedRegions.value.filter(r => r !== region)
    }

    async function loadMatrix() {
      try {
        loadingMatrix.value = true
        const data = await getRegionSimilarityMatrix({
          regions: selectedRegions.value,
          metric: matrixMetric.value
        })
        matrixData.value = data
        await nextTick()
        renderHeatmap()
      } catch (error) {
        showError('生成矩陣失敗: ' + error.message)
      } finally {
        loadingMatrix.value = false
      }
    }

    function renderHeatmap() {
      if (!heatmapChart.value || !matrixData.value) return

      if (chartInstance) {
        chartInstance.dispose()
      }

      chartInstance = echarts.init(heatmapChart.value)

      const regions = matrixData.value.regions || []
      const matrix = matrixData.value.matrix || []

      // Convert matrix to ECharts format
      const data = []
      for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions.length; j++) {
          data.push([j, i, matrix[i][j]])
        }
      }

      const option = {
        tooltip: {
          position: 'top',
          formatter: (params) => {
            const [x, y, value] = params.data
            return `${regions[y]} vs ${regions[x]}<br/>相似度: ${(value * 100).toFixed(1)}%`
          }
        },
        grid: {
          left: 120,
          right: 50,
          top: 50,
          bottom: 80
        },
        xAxis: {
          type: 'category',
          data: regions,
          splitArea: {
            show: true
          },
          axisLabel: {
            rotate: 45,
            interval: 0
          }
        },
        yAxis: {
          type: 'category',
          data: regions,
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          }
        },
        series: [{
          name: '相似度',
          type: 'heatmap',
          data: data,
          label: {
            show: true,
            formatter: (params) => (params.data[2] * 100).toFixed(0) + '%'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }

      chartInstance.setOption(option)
    }

    // Lifecycle
    onMounted(() => {
      loadRegionList()
    })

    watch(queryMode, () => {
      // Reset data when switching modes
      searchResults.value = null
      pairData.value = null
      matrixData.value = null
    })

    return {
      queryMode,
      regionList,
      targetRegion,
      metric,
      topK,
      minSimilarity,
      searchResults,
      loadingSearch,
      region1,
      region2,
      pairData,
      loadingPair,
      selectedRegions,
      selectedRegionToAdd,
      availableRegionsForMatrix,
      matrixMetric,
      matrixData,
      loadingMatrix,
      heatmapChart,
      searchSimilarRegions,
      compareRegions,
      loadPairComparison,
      addRegion,
      removeRegion,
      loadMatrix
    }
  }
}
</script>

<style scoped>
.region-similarity-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary, #2c3e50);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
}

.mode-selector {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.mode-button {
  flex: 1;
  padding: 12px 24px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mode-button:hover {
  background: rgba(74, 144, 226, 0.1);
  border-color: rgba(74, 144, 226, 0.5);
}

.mode-button.active {
  background: var(--primary-color, #4a90e2);
  color: white;
  border-color: var(--primary-color, #4a90e2);
}

.query-form h3 {
  margin-bottom: 16px;
  font-size: 20px;
  color: var(--text-primary, #2c3e50);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary, #2c3e50);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.select-input,
.number-input {
  width: 100%;
  padding: 10px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.select-input:focus,
.number-input:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
}

.query-button {
  width: 100%;
  padding: 12px 24px;
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.query-button:hover:not(:disabled) {
  background: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
}

.query-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--primary-color, #4a90e2);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary, #2c3e50);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.result-card {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.rank-badge {
  background: var(--primary-color, #4a90e2);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.card-header h4 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary, #2c3e50);
}

.similarity-bar-container {
  margin-bottom: 16px;
}

.similarity-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-primary, #2c3e50);
}

.similarity-bar {
  height: 24px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.similarity-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #4a90e2), var(--secondary-color, #50c878));
  transition: width 0.3s ease;
}

.char-info {
  margin-bottom: 16px;
}

.char-section {
  margin-bottom: 12px;
}

.char-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.char-list {
  font-size: 14px;
  color: var(--text-primary, #2c3e50);
  line-height: 1.6;
}

.detail-button {
  width: 100%;
  padding: 8px 16px;
  background: rgba(74, 144, 226, 0.1);
  color: var(--primary-color, #4a90e2);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detail-button:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--primary-color, #4a90e2);
}

.similarity-metrics h3,
.comparison-details h3 {
  margin-bottom: 16px;
  font-size: 20px;
  color: var(--text-primary, #2c3e50);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  text-align: center;
  padding: 20px;
  background: rgba(74, 144, 226, 0.05);
  border-radius: 8px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--primary-color, #4a90e2);
}

.comparison-grid {
  display: grid;
  gap: 20px;
}

.comparison-section h4 {
  margin-bottom: 12px;
  font-size: 16px;
  color: var(--text-primary, #2c3e50);
}

.char-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.char-tag.common {
  background: rgba(80, 200, 120, 0.2);
  color: #27ae60;
}

.char-tag.unique1 {
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
}

.char-tag.unique2 {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.region-selector {
  display: flex;
  gap: 12px;
}

.add-button {
  padding: 10px 24px;
  background: var(--secondary-color, #50c878);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.add-button:hover:not(:disabled) {
  background: #45b369;
}

.add-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.selected-regions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.region-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(74, 144, 226, 0.1);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-primary, #2c3e50);
}

.remove-button {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.remove-button:hover {
  background: rgba(231, 76, 60, 0.1);
}

.heatmap-container {
  width: 100%;
  height: 600px;
  min-height: 400px;
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .mode-selector {
    flex-direction: column;
  }
}
</style>

