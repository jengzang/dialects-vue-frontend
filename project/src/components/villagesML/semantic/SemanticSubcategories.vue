<template>
  <div class="semantic-subcategories-page">
    <h1 class="page-title">🏷️ 語義子類別分析</h1>

    <!-- Mode Selector -->
    <div class="mode-selector glass-panel">
      <button
        class="mode-button"
        :class="{ 'active': viewMode === 'regional' }"
        @click="viewMode = 'regional'"
      >
        區域對比
      </button>
      <button
        class="mode-button"
        :class="{ 'active': viewMode === 'ranking' }"
        @click="viewMode = 'ranking'"
      >
        傾向排行
      </button>
    </div>

    <!-- Regional Comparison Mode -->
    <div v-if="viewMode === 'regional'" class="regional-section">
      <div class="query-form glass-panel">
        <h3>區域子類別對比</h3>

        <div class="form-group">
          <label>區域選擇:</label>
          <FilterableSelect
            v-model="regionName"
            :level="regionLevel"
            @update:level="(newLevel) => regionLevel = newLevel"
            placeholder="請選擇或輸入區域"
          />
        </div>

        <div class="form-group">
          <label>父類別:</label>
          <select v-model="regionalParentCategory" class="select-input">
            <option v-for="cat in parentCategories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <button
          class="query-button"
          :disabled="!regionName || !regionalParentCategory || loadingRegional"
          @click="loadRegionalComparison"
        >
          {{ loadingRegional ? '查詢中...' : '查詢' }}
        </button>
      </div>

      <!-- Regional Results -->
      <div v-if="loadingRegional" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="regionalData" class="regional-results">
        <div class="regional-header glass-panel">
          <h3>{{ regionalData.region_name }} - {{ getSubcategoryName(regionalData.parent_category) || regionalData.parent_category }} 子類別分布</h3>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">
            包含 {{ regionalData.subcategories?.length || 0 }} 個子類別：
            <span v-for="(subcat, index) in regionalData.subcategories" :key="subcat.subcategory" style="margin-left: 4px;">
              {{ getSubcategoryName(subcat.subcategory) || subcat.subcategory }}<span v-if="index < regionalData.subcategories.length - 1">、</span>
            </span>
          </p>
        </div>

        <!-- Radar Chart -->
        <div class="chart-section glass-panel">
          <h4>子類別雷達圖</h4>
          <div ref="radarChart" class="radar-container"></div>
        </div>

        <!-- Subcategory Table -->
        <div class="subcategory-table glass-panel">
          <h4>子類別詳情</h4>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>子類別</th>
                  <th>VTF</th>
                  <th>傾向值 (Z)</th>
                  <th>百分比</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="subcat in regionalData.subcategories"
                  :key="subcat.subcategory"
                  :class="{ 'significant': subcat.tendency > 0.2 }"
                >
                  <td>{{ getSubcategoryName(subcat.subcategory) }}</td>
                  <td>{{ subcat.vtf }}</td>
                  <td>
                    <span
                      class="tendency-badge"
                      :class="{ 'positive': subcat.tendency > 0, 'negative': subcat.tendency < 0 }"
                    >
                      {{ subcat.tendency?.toFixed(3) }}
                    </span>
                  </td>
                  <td>{{ (subcat.percentage * 100).toFixed(2) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking Mode -->
    <div v-if="viewMode === 'ranking'" class="ranking-section">
      <div class="query-form glass-panel">
        <h3>子類別傾向排行</h3>

        <div class="form-row">
          <div class="form-group">
            <label>區域層級:</label>
            <select v-model="rankingRegionLevel" class="select-input">
              <option value="city">市級</option>
              <option value="county">縣級</option>
              <option value="township">鄉鎮級</option>
            </select>
          </div>

          <div class="form-group">
            <label>父類別:</label>
            <select v-model="rankingParentCategory" class="select-input">
              <option :value="null">全部類別</option>
              <option v-for="cat in parentCategories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>返回數量:</label>
            <input v-model.number="topN" type="number" min="5" max="50" class="number-input" />
          </div>
        </div>

        <button
          class="query-button"
          :disabled="loadingRanking"
          @click="loadRanking"
        >
          {{ loadingRanking ? '查詢中...' : '查詢' }}
        </button>
      </div>

      <!-- Ranking Results -->
      <div v-if="loadingRanking" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="rankingData && rankingData.length > 0" class="ranking-results">
        <div class="results-header glass-panel">
          <h3>Top {{ rankingData.length }} 子類別傾向排行</h3>
        </div>

        <!-- Bar Chart -->
        <div class="chart-section glass-panel">
          <h4>傾向值柱狀圖</h4>
          <div ref="barChart" class="bar-container"></div>
        </div>

        <!-- Ranking Table -->
        <div class="ranking-table glass-panel">
          <h4>排行榜詳情</h4>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>區域</th>
                  <th>子類別</th>
                  <th>傾向值</th>
                  <th>百分比</th>
                  <th>村莊數</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in rankingData" :key="index">
                  <td>
                    <span class="rank-badge" :class="getRankClass(index)">
                      #{{ index + 1 }}
                    </span>
                  </td>
                  <td>{{ item.region_name }}</td>
                  <td>{{ getSubcategoryName(item.subcategory) }}</td>
                  <td>
                    <span class="tendency-badge positive">
                      {{ item.tendency?.toFixed(3) }}
                    </span>
                  </td>
                  <td>{{ item.percentage?.toFixed(2) }}%</td>
                  <td>{{ item.village_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  getSemanticSubcategoryList,
  getSemanticSubcategoryChars,
  getSemanticSubcategoryVTFGlobal,
  getSemanticSubcategoryVTFRegional,
  getSemanticSubcategoryTendencyTop,
  getSemanticSubcategoryComparison
} from '@/api/index.js'
import { showError, showSuccess } from '@/utils/message.js'
import * as echarts from 'echarts'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import { SEMANTIC_SUBCATEGORY_NAMES } from '@/config/villagesML.js'

export default {
  name: 'SemanticSubcategories',
  components: {
    FilterableSelect
  },
  setup() {
    // Helper function to get subcategory Chinese name
    const getSubcategoryName = (subcategory) => {
      return SEMANTIC_SUBCATEGORY_NAMES[subcategory] || subcategory
    }

    // Parent categories
    const parentCategories = [
      { value: 'mountain', label: '山地 (mountain)' },
      { value: 'water', label: '水系 (water)' },
      { value: 'settlement', label: '聚落 (settlement)' },
      { value: 'direction', label: '方位 (direction)' },
      { value: 'vegetation', label: '植被 (vegetation)' },
      { value: 'structure', label: '建築 (structure)' },
      { value: 'animal', label: '動物 (animal)' },
      { value: 'color', label: '顏色 (color)' },
      { value: 'other', label: '其他 (other)' }
    ]

    // State
    const viewMode = ref('regional')  // 默认显示区域对比

    // List mode (移除，不再需要)
    const selectedParentCategory = ref(null)
    const subcategoryList = ref([])
    const loadingList = ref(false)

    // Regional mode
    const regionName = ref('')
    const regionLevel = ref('city')
    const regionalParentCategory = ref('mountain')
    const regionalData = ref(null)
    const loadingRegional = ref(false)
    const radarChart = ref(null)
    let radarChartInstance = null

    // Ranking mode
    const rankingRegionLevel = ref('city')
    const rankingParentCategory = ref(null)
    const topN = ref(10)
    const rankingData = ref([])
    const loadingRanking = ref(false)
    const barChart = ref(null)
    let barChartInstance = null

    // Methods
    const convertRegionLevel = (level) => {
      const levelMap = {
        'city': '市级',      // 简体中文
        'county': '区县级',    // 简体中文
        'township': '乡镇级'  // 简体中文
      }
      return levelMap[level] || level
    }

    async function loadSubcategoryList() {
      try {
        loadingList.value = true
        const params = {}
        if (selectedParentCategory.value) {
          params.parent_category = selectedParentCategory.value
        }
        const data = await getSemanticSubcategoryList(params)
        subcategoryList.value = data.subcategories || []
      } catch (error) {
        showError('加載子類別列表失敗: ' + error.message)
      } finally {
        loadingList.value = false
      }
    }

    async function viewSubcategoryDetail(subcategory) {
      try {
        const data = await getSemanticSubcategoryChars(subcategory)
        showSuccess(`${subcategory} 包含 ${data.characters?.length || 0} 個字符`)
      } catch (error) {
        showError('加載子類別詳情失敗: ' + error.message)
      }
    }

    async function loadRegionalComparison() {
      if (!regionName.value) {
        showError('請選擇區域')
        return
      }
      try {
        loadingRegional.value = true
        const data = await getSemanticSubcategoryComparison({
          region_name: regionName.value,
          region_level: convertRegionLevel(regionLevel.value),
          parent_category: regionalParentCategory.value
        })
        regionalData.value = data
        console.log('API 返回数据:', data)
        await nextTick()
        // 使用 setTimeout 确保 DOM 完全渲染
        setTimeout(() => {
          renderRadarChart()
        }, 100)
      } catch (error) {
        showError('加載區域對比失敗: ' + error.message)
      } finally {
        loadingRegional.value = false
      }
    }

    function renderRadarChart() {
      if (!radarChart.value || !regionalData.value) {
        console.log('雷达图渲染条件不满足:', {
          hasRadarChart: !!radarChart.value,
          hasRegionalData: !!regionalData.value
        })
        return
      }

      // 检查容器尺寸
      const containerWidth = radarChart.value.offsetWidth
      const containerHeight = radarChart.value.offsetHeight
      console.log('雷达图容器尺寸:', { width: containerWidth, height: containerHeight })

      if (containerWidth === 0 || containerHeight === 0) {
        console.warn('雷达图容器尺寸为0，延迟渲染')
        setTimeout(() => renderRadarChart(), 200)
        return
      }

      if (radarChartInstance) {
        radarChartInstance.dispose()
      }

      radarChartInstance = echarts.init(radarChart.value)

      const subcategories = regionalData.value.subcategories || []
      console.log('子类别数据:', subcategories)

      if (subcategories.length === 0) {
        console.warn('没有子类别数据')
        return
      }

      const indicator = subcategories.map(s => ({
        name: getSubcategoryName(s.subcategory),  // 使用中文名称
        max: Math.max(...subcategories.map(x => x.vtf)) * 1.2
      }))

      const data = subcategories.map(s => s.vtf)

      console.log('雷达图配置:', { indicator, data })

      const option = {
        tooltip: {
          trigger: 'item'
        },
        radar: {
          indicator: indicator,
          shape: 'polygon',
          splitNumber: 5,
          name: {
            textStyle: {
              color: '#333',
              fontSize: 12
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(74, 144, 226, 0.2)'
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['rgba(74, 144, 226, 0.05)', 'rgba(74, 144, 226, 0.1)']
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(74, 144, 226, 0.3)'
            }
          }
        },
        series: [{
          name: '子類別 VTF',
          type: 'radar',
          data: [{
            value: data,
            name: regionalData.value.region_name,
            areaStyle: {
              color: 'rgba(74, 144, 226, 0.3)'
            },
            lineStyle: {
              color: '#4a90e2',
              width: 2
            },
            itemStyle: {
              color: '#4a90e2'
            }
          }]
        }]
      }

      radarChartInstance.setOption(option)
      console.log('雷达图渲染完成')
    }

    async function loadRanking() {
      try {
        loadingRanking.value = true
        const params = {
          region_level: convertRegionLevel(rankingRegionLevel.value),
          top_n: topN.value
        }
        if (rankingParentCategory.value) {
          params.parent_category = rankingParentCategory.value
        }
        const data = await getSemanticSubcategoryTendencyTop(params)
        rankingData.value = Array.isArray(data) ? data : (data.top_tendencies || [])
        loadingRanking.value = false
        await nextTick()
        renderBarChart()
      } catch (error) {
        showError('加載排行榜失敗: ' + error.message)
        loadingRanking.value = false
      }
    }

    function renderBarChart() {
      if (!barChart.value || !rankingData.value || rankingData.value.length === 0) return

      if (barChartInstance) {
        barChartInstance.dispose()
      }

      barChartInstance = echarts.init(barChart.value)

      const labels = rankingData.value.map(item => `${item.region_name}\n${getSubcategoryName(item.subcategory)}`)
      const values = rankingData.value.map(item => item.tendency)

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            const item = rankingData.value[params[0].dataIndex]
            return `${item.region_name}<br/>${getSubcategoryName(item.subcategory)}<br/>傾向值: ${item.tendency.toFixed(3)}<br/>百分比: ${item.percentage.toFixed(2)}%<br/>村莊數: ${item.village_count}`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            interval: 0,
            rotate: 45,
            fontSize: 11
          }
        },
        yAxis: {
          type: 'value',
          name: '傾向值 (Z-score)'
        },
        series: [{
          name: '傾向值',
          type: 'bar',
          data: values,
          itemStyle: {
            color: (params) => {
              const colors = ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
              return colors[Math.min(params.dataIndex, colors.length - 1)]
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params) => params.value.toFixed(2)
          }
        }]
      }

      barChartInstance.setOption(option)
    }

    function getRankClass(index) {
      if (index === 0) return 'gold'
      if (index === 1) return 'silver'
      if (index === 2) return 'bronze'
      return ''
    }

    // Lifecycle
    onMounted(() => {
      // 添加窗口 resize 事件监听
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      // 清理图表实例和事件监听
      if (radarChartInstance) {
        radarChartInstance.dispose()
        radarChartInstance = null
      }
      if (barChartInstance) {
        barChartInstance.dispose()
        barChartInstance = null
      }
      window.removeEventListener('resize', handleResize)
    })

    function handleResize() {
      if (radarChartInstance) {
        radarChartInstance.resize()
      }
      if (barChartInstance) {
        barChartInstance.resize()
      }
    }

    watch(viewMode, () => {
      // Reset data when switching modes
      // 不再需要加载子类别列表
    })

    return {
      parentCategories,
      viewMode,
      selectedParentCategory,
      subcategoryList,
      loadingList,
      regionName,
      regionLevel,
      regionalParentCategory,
      regionalData,
      loadingRegional,
      radarChart,
      rankingRegionLevel,
      rankingParentCategory,
      topN,
      rankingData,
      loadingRanking,
      barChart,
      getSubcategoryName,
      loadSubcategoryList,
      viewSubcategoryDetail,
      loadRegionalComparison,
      loadRanking,
      getRankClass
    }
  }
}
</script>

<style scoped>
.semantic-subcategories-page {
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
  background: var(--color-primary, #4a90e2);
  color: white;
  border-color: var(--color-primary, #4a90e2);
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
.text-input,
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
.text-input:focus,
.number-input:focus {
  outline: none;
  border-color: var(--color-primary, #4a90e2);
}

.query-button {
  width: 100%;
  padding: 12px 24px;
  background: var(--color-primary, #4a90e2);
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
  border-top-color: var(--color-primary, #4a90e2);
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

.subcategory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.subcat-card {
  padding: 16px;
}

.subcat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.subcat-header h4 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary, #2c3e50);
}

.parent-badge {
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.subcat-stats {
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
}

.char-preview {
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
  color: var(--color-primary, #4a90e2);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detail-button:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary, #4a90e2);
}

.regional-header h3,
.chart-section h4,
.subcategory-table h4,
.ranking-table h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--text-primary, #2c3e50);
}

.radar-container,
.bar-container {
  width: 100%;
  height: 500px;
  min-height: 400px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: rgba(74, 144, 226, 0.1);
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

th {
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
}

tr.significant {
  background: rgba(80, 200, 120, 0.05);
}

.tendency-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.tendency-badge.positive {
  background: rgba(80, 200, 120, 0.2);
  color: #27ae60;
}

.tendency-badge.negative {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.rank-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  color: white;
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #333;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #cd7f32, #e8a87c);
  color: #333;
}

.rank-badge:not(.gold):not(.silver):not(.bronze) {
  background: var(--color-primary, #4a90e2);
}

@media (max-width: 768px) {
  .subcategory-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .mode-selector {
    flex-direction: column;
  }

  .radar-container,
  .bar-container {
    height: 400px;
  }
}
</style>
