<template>
  <div class="region-similarity-page">
    <h3 class="villagesml-subtab-title">
      區域分析 - 相似度分析
      <HelpIcon content="基於村名字符分布計算區域相似度。Cosine相似度：向量夾角余弦值（0-1）。Jaccard相似度：交集/並集比例。支持查找相似區域、兩區域對比和相似度矩陣熱力圖" />
    </h3>
<!--    <h1 class="page-title">🔍 區域相似度分析</h1>-->

    <!-- Mode Selector -->
    <div class="mode-selector vml-control-surface vml-control-row vml-control-row--center">
      <RadioGroup
          name="regionSimilarityMode"
          :options="similarityModeOptions"
          v-model="queryMode"
      />
    </div>

    <!-- Search Mode -->
    <div v-if="queryMode === 'search'" class="search-section">
      <div class="query-form vml-glass-panel">
        <h3>查找相似區域</h3>

        <div class="form-group vml-control-surface vml-control-row">
          <div class="vml-control-field">
            <label>目標區域:</label>
            <FilterableSelect
              v-model="targetRegion"
              :level="targetRegionLevel"
              :allowed-levels="['city', 'county']"
              @update:level="(newLevel) => targetRegionLevel = newLevel"
              @update:hierarchy="(h) => targetRegionHierarchy = h"
              placeholder="請選擇或輸入區域"
            />
          </div>
        </div>

        <div class="form-row vml-control-surface vml-control-row">
          <div class="form-group vml-control-field">
            <label>相似度指標:</label>
            <SimpleSelectDropdown :match-trigger-width="true"
              v-model="metric"
              :options="metricOptions"
            />
          </div>

          <div class="form-group vml-control-field vml-control-field--compact">
            <label>返回數量:</label>
            <input v-model.number="topK" type="number" min="1" max="50" class="vml-number-input" />
          </div>

          <div class="form-group vml-control-field vml-control-field--compact">
            <label>最小相似度:</label>
            <input v-model.number="minSimilarity" type="number" min="0" max="1" step="0.1" class="vml-number-input" />
          </div>
          <div class="vml-control-actions">
            <button
              class="query-button"
              :disabled="!targetRegion || loadingSearch"
              @click="searchSimilarRegions"
            >
              {{ loadingSearch ? '查詢中...' : '查詢' }}
            </button>
          </div>
        </div>


      </div>

      <!-- Search Results -->
      <div v-if="loadingSearch" class="vml-loading vml-glass-panel">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="searchResults && searchResults.length > 0" class="search-results">
<!--        <div class="results-header vml-glass-panel">-->
<!--          <h3>找到 {{ searchResults.length }} 個相似區域</h3>-->
<!--        </div>-->

        <div class="results-grid">
          <div
            v-for="(result, index) in searchResults"
            :key="result.region"
            class="result-card vml-glass-panel"
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
                <div class="char-label">特征字符 ({{ result.distinctive_chars?.length || 0 }}):</div>
                <div class="char-list">{{ result.distinctive_chars?.slice(0, 10).join('、') || '無' }}</div>
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
      <div class="query-form vml-glass-panel">
        <h3>兩區域對比</h3>

        <div class="form-row vml-control-surface vml-control-row">
          <div class="form-group vml-control-field">
            <label>區域 1:</label>
            <FilterableSelect
              v-model="region1"
              :level="region1Level"
              :allowed-levels="['city', 'county']"
              @update:level="(newLevel) => region1Level = newLevel"
              @update:hierarchy="(h) => region1Hierarchy = h"
              placeholder="請選擇或輸入區域"
            />
          </div>

          <div class="form-group vml-control-field">
            <label>區域 2:</label>
            <FilterableSelect
              v-model="region2"
              :level="region2Level"
              :allowed-levels="['city', 'county']"
              @update:level="(newLevel) => region2Level = newLevel"
              @update:hierarchy="(h) => region2Hierarchy = h"
              placeholder="請選擇或輸入區域"
            />
          </div>
        </div>

        <div class="vml-control-actions">
          <button
            class="query-button"
            :disabled="!region1 || !region2 || region1 === region2 || loadingPair"
            @click="loadPairComparison"
          >
            {{ loadingPair ? '對比中...' : '對比' }}
          </button>
        </div>
      </div>

      <!-- Pair Results -->
      <div v-if="loadingPair" class="vml-loading vml-glass-panel">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="pairData" class="pair-results">
        <div class="similarity-metrics vml-glass-panel">
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
            <div class="metric-card" v-if="pairData.euclidean_distance !== undefined">
              <div class="metric-label">歐氏距離</div>
              <div class="metric-value">{{ pairData.euclidean_distance.toFixed(4) }}</div>
            </div>
            <div class="metric-card" v-if="pairData.feature_dimension">
              <div class="metric-label">特徵維度</div>
              <div class="metric-value">{{ pairData.feature_dimension }}</div>
            </div>
          </div>
        </div>

        <div class="comparison-details vml-glass-panel">
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
              <h4>{{ region1 }} 特有 ({{ pairData.distinctive_chars_r1?.length || 0 }})</h4>
              <div class="char-cloud">
                <span v-for="char in pairData.distinctive_chars_r1" :key="char" class="char-tag unique1">
                  {{ char }}
                </span>
              </div>
            </div>

            <div class="comparison-section">
              <h4>{{ region2 }} 特有 ({{ pairData.distinctive_chars_r2?.length || 0 }})</h4>
              <div class="char-cloud">
                <span v-for="char in pairData.distinctive_chars_r2" :key="char" class="char-tag unique2">
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
      <div class="query-form vml-glass-panel">
        <h3>相似度矩陣</h3>

        <div class="form-group vml-control-surface">
          <div class="region-selector vml-control-row">
            <div class="vml-control-field">
              <label>選擇區域 (最多20個):</label>
              <FilterableSelect
                v-model="selectedRegionToAdd"
                :level="matrixRegionLevel"
                :allowed-levels="['city', 'county']"
                @update:level="(newLevel) => matrixRegionLevel = newLevel"
                @update:hierarchy="(h) => selectedRegionHierarchy = h"
                placeholder="選擇區域..."
              />
            </div>
            <div class="vml-control-actions">
              <button
                class="add-button"
                :disabled="!selectedRegionToAdd || selectedRegions.length >= 20"
                @click="addRegion"
              >
                添加
              </button>
            </div>
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

        <div class="form-group vml-control-surface vml-control-row">
          <div class="vml-control-field">
            <label>相似度指標:</label>
            <SimpleSelectDropdown :match-trigger-width="true"
              v-model="matrixMetric"
              :options="metricOptions"
            />
          </div>
          <div class="vml-control-actions">
            <button
              class="query-button"
              :disabled="selectedRegions.length < 2 || loadingMatrix"
              @click="loadMatrix"
            >
              {{ loadingMatrix ? '生成中...' : '生成矩陣' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Matrix Results -->
      <div v-if="loadingMatrix" class="vml-loading vml-glass-panel">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="matrixData" class="matrix-results vml-glass-panel">
        <h3>相似度矩陣熱力圖</h3>
        <div ref="heatmapChart" class="heatmap-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount, onMounted, watch, nextTick } from 'vue'
import {
  getRegionSimilaritySearch,
  getRegionSimilarityPair,
  getRegionSimilarityMatrix
} from '@/api/index.js'
import { showError, showSuccess } from '@/utils/ui/message.js'
import * as echarts from 'echarts'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import RadioGroup from "@/components/selector/RadioGroup.vue";

export default {
  name: 'RegionSimilarity',
  components: {
    RadioGroup,
    FilterableSelect,
    SimpleSelectDropdown,
    HelpIcon,
  },
  setup() {
    // State
    const queryMode = ref('search')
    const similarityModeOptions = [
      { value: 'search', label: '查找相似區域' },
      { value: 'pair', label: '兩區域對比' },
      { value: 'matrix', label: '相似度矩陣' }
    ]

    // Search mode
    const targetRegion = ref('')
    const targetRegionLevel = ref('county')
    const targetRegionHierarchy = ref(null)
    const metric = ref('cosine')
    const topK = ref(10)
    const minSimilarity = ref(0.0)
    const searchResults = ref(null)
    const loadingSearch = ref(false)

    // Pair mode
    const region1 = ref('')
    const region1Level = ref('county')
    const region1Hierarchy = ref(null)
    const region2 = ref('')
    const region2Level = ref('county')
    const region2Hierarchy = ref(null)
    const pairData = ref(null)
    const loadingPair = ref(false)

    // Matrix mode
    const selectedRegions = ref([])
    const selectedRegionsHierarchy = ref([])  // 存儲每個區域的層級信息
    const selectedRegionToAdd = ref('')
    const selectedRegionHierarchy = ref(null)
    const matrixRegionLevel = ref('county')
    const matrixMetric = ref('cosine')
    const matrixData = ref(null)
    const loadingMatrix = ref(false)

    // Options for SimpleSelectDropdown
    const metricOptions = [
      { label: 'Cosine 相似度', value: 'cosine' },
      { label: 'Jaccard 相似度', value: 'jaccard' }
    ]
    const heatmapChart = ref(null)
    let chartInstance = null

    // Methods
    async function searchSimilarRegions() {
      if (!targetRegion.value) {
        showError('請選擇目標區域')
        return
      }
      try {
        loadingSearch.value = true

        // 構建參數：優先使用層級信息
        const params = {
          region_level: targetRegionLevel.value,
          top_k: topK.value,
          metric: metric.value,
          min_similarity: minSimilarity.value
        }

        // 使用層級信息（推薦）
        if (targetRegionHierarchy.value) {
          if (targetRegionHierarchy.value.city) params.city = targetRegionHierarchy.value.city
          if (targetRegionHierarchy.value.county) params.county = targetRegionHierarchy.value.county
          if (targetRegionHierarchy.value.township) params.township = targetRegionHierarchy.value.township
        } else {
          // 向後兼容：使用區域名稱
          params.region_name = targetRegion.value
        }

        const data = await getRegionSimilaritySearch(params)
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

        // 構建參數：使用層級信息
        const params = {
          region_level: region1Level.value  // 假設兩個區域同級
        }

        // 區域1層級信息
        if (region1Hierarchy.value) {
          if (region1Hierarchy.value.city) params.city1 = region1Hierarchy.value.city
          if (region1Hierarchy.value.county) params.county1 = region1Hierarchy.value.county
          if (region1Hierarchy.value.township) params.township1 = region1Hierarchy.value.township
        } else {
          params.region1 = region1.value
        }

        // 區域2層級信息
        if (region2Hierarchy.value) {
          if (region2Hierarchy.value.city) params.city2 = region2Hierarchy.value.city
          if (region2Hierarchy.value.county) params.county2 = region2Hierarchy.value.county
          if (region2Hierarchy.value.township) params.township2 = region2Hierarchy.value.township
        } else {
          params.region2 = region2.value
        }

        const data = await getRegionSimilarityPair(params)
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
        // 保存層級信息
        if (selectedRegionHierarchy.value) {
          selectedRegionsHierarchy.value.push({
            name: selectedRegionToAdd.value,
            ...selectedRegionHierarchy.value
          })
        }
        selectedRegionToAdd.value = null
        selectedRegionHierarchy.value = null
      }
    }

    function removeRegion(region) {
      const index = selectedRegions.value.indexOf(region)
      if (index > -1) {
        selectedRegions.value.splice(index, 1)
        selectedRegionsHierarchy.value.splice(index, 1)
      }
    }

    async function loadMatrix() {
      try {
        loadingMatrix.value = true

        // 構建參數：使用層級信息數組
        const params = {
          region_level: matrixRegionLevel.value,
          metric: matrixMetric.value
        }

        // 如果有層級信息，使用新格式
        if (selectedRegionsHierarchy.value.length > 0) {
          params.regions = selectedRegionsHierarchy.value.map(r => ({
            city: r.city,
            county: r.county,
            township: r.township
          }))
        } else {
          // 向後兼容：使用區域名稱
          params.region_names = selectedRegions.value
        }

        const data = await getRegionSimilarityMatrix(params)
        matrixData.value = data
        loadingMatrix.value = false
        await nextTick()
        renderHeatmap()
      } catch (error) {
        showError('生成矩陣失敗: ' + error.message)
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
      let minVal = 1
      for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions.length; j++) {
          const v = matrix[i][j]
          data.push([j, i, v])
          if (i !== j && v < minVal) minVal = v
        }
      }
      // 动态 min：取非对角线最小值，向下取整到0.05
      const dynamicMin = Math.max(0, Math.floor(minVal * 20) / 20)

      const option = {
        tooltip: {
          position: 'top',
          formatter: (params) => {
            const [x, y, value] = params.data
            return `${regions[y]} vs ${regions[x]}<br/>相似度: ${(value * 100).toFixed(2)}%`
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
          min: dynamicMin,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d32f2f', '#962020']
          }
        },
        series: [{
          name: '相似度',
          type: 'heatmap',
          data: data,
          label: {
            show: true,
            formatter: (params) => (params.data[2] * 100).toFixed(2) + '%'
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
    watch(queryMode, () => {
      // Reset data when switching modes
      searchResults.value = null
      pairData.value = null
      matrixData.value = null
    })

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.dispose()
        chartInstance = null
      }
    })

    return {
      queryMode,
      similarityModeOptions,
      targetRegion,
      targetRegionLevel,
      metric,
      topK,
      minSimilarity,
      searchResults,
      loadingSearch,
      region1,
      region1Level,
      region2,
      region2Level,
      pairData,
      loadingPair,
      selectedRegions,
      selectedRegionToAdd,
      matrixRegionLevel,
      matrixMetric,
      matrixData,
      loadingMatrix,
      heatmapChart,
      metricOptions,
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

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.region-similarity-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.vml-glass-panel {
  padding: 20px;
  margin-bottom: 20px;
}

.mode-selector {
  margin-bottom: 20px;
}

.query-form {
  @include flex-col;
  gap: 12px;
}

.query-form h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.form-group {
  min-width: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
}

.form-row {
  width: 100%;
}

.vml-number-input {
  padding: 10px;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  background: var(--glass-80);
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.vml-number-input:focus {
  outline: none;
  border-color: var(--color-primary, var(--vml-blue));
}

.results-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
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
  background: var(--color-primary, var(--vml-blue));
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 14px;
}

.card-header h4 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.similarity-bar-container {
  margin-bottom: 16px;
}

.similarity-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.similarity-bar {
  height: 24px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.similarity-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, var(--vml-blue)), var(--color-success));
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
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.char-list {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.detail-button {
  width: 100%;
  padding: 8px 16px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  color: var(--color-primary, var(--vml-blue));
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detail-button:hover {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary, var(--vml-blue));
}

.similarity-metrics h3,
.comparison-details h3 {
  margin-bottom: 16px;
  font-size: 20px;
  color: var(--text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  text-align: center;
  padding: 20px;
  background: rgba(var(--vml-blue-rgb), 0.05);
  border-radius: var(--radius-sm2);
}

.metric-label {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-primary, var(--vml-blue));
}

.comparison-grid {
  display: grid;
  gap: 20px;
}

.comparison-section h4 {
  margin-bottom: 12px;
  font-size: 16px;
  color: var(--text-primary);
}

.char-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
}

.char-tag.common {
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.char-tag.unique1 {
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--vml-blue);
}

.char-tag.unique2 {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning);
}

.region-selector {
  align-items: center;
}

.add-button {
  padding: 10px 24px;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--radius-sm2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.add-button:hover:not(:disabled) {
  background: var(--color-success);
}

.add-button:disabled {
  background: var(--border-gray);
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
  background: rgba(var(--vml-blue-rgb), 0.1);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-xl);
  font-size: 14px;
  color: var(--text-primary);
}

.remove-button {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  @include flex-center;
  border-radius: var(--radius-full);
  transition: background 0.3s ease;
}

.remove-button:hover {
  background: rgba(var(--color-error-rgb), 0.1);
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

  .form-row > *,
  .form-group > .simple-select-dropdown,
  .form-group > .filterable-select {
    width: 100%;
  }
  .mode-button{
    padding: 6px;
  }
  .vml-number-input{
    width: 100%;
  }
}
</style>
