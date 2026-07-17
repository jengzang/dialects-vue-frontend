<template>
  <div class="ngram-stats-page">
    <h3 class="villagesml-subtab-title">
      模式分析 - N-gram 統計
      <HelpIcon content="分析2-4字N-gram的區域分布、傾向性和顯著性。支持按位置（前綴/中間/後綴）篩選。Z分數衡量N-gram在特定區域的使用傾向，P值<0.05表示統計顯著" />
    </h3>

    <!-- Info Banner (if coming from explore page) -->
    <div v-if="route.query.ngram" class="info-banner vml-glass-panel">
      <span>正在分析 N-gram：<strong>{{ route.query.ngram }}</strong></span>
      <button @click="clearNgram" class="text-button">清除</button>
    </div>

    <!-- Shared Controls -->
    <div class="shared-controls vml-glass-panel">
      <div class="controls vml-control-surface vml-control-row">
        <!-- N-gram 选择器 -->
        <div class="ngram-selector vml-control-field">
          <SimpleSelectDropdown
            v-if="availableNgrams.length > 0"
            v-model="ngram"
            :options="ngramOptions"
            :searchable="true"
            searchPlaceholder="搜索 N-gram..."
            width="100%"
          />
          <input
            v-else
            v-model="ngram"
            type="text"
            placeholder="輸入 N-gram"
            class="vml-input"
          />
          <button
            v-if="availableNgrams.length === 0"
            class="load-list-btn"
            :disabled="loadingNgramList"
            @click="loadAvailableNgrams"
            title="加載 N-gram 列表"
          >
            {{ loadingNgramList ? '⏳' : '📋' }}
          </button>
        </div>
        <div class="vml-control-field vml-control-field--compact">
          <SimpleSelectDropdown
            v-model="level"
            :options="levelOptions"
            width="120px"
          />
        </div>
        <div class="vml-control-actions">
          <button
            class="query-button"
            :disabled="!ngram || loading"
            @click="loadNgramData"
          >
            查詢
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="vml-loading vml-glass-panel">
      <div class="ui-loading--page" aria-hidden="true"></div>
    </div>

    <template v-else-if="ngramData.length > 0">
      <!-- Regional Distribution -->
      <div class="regional-section vml-glass-panel">
        <div class="section-header">
          <h2>區域分佈</h2>
          <button class="toggle-section-btn" @click="toggleRegionalSection">
            {{ regionalExpanded ? '收起' : '展開' }}
          </button>
        </div>

        <div v-show="regionalExpanded">
          <div class="regional-results">
          <!-- Position Filter Tabs -->
          <div class="position-tabs">
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'all' }"
              @click="regionalPositionFilter = 'all'"
            >
              全部 ({{ positionCounts.all }})
            </button>
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'middle' }"
              @click="regionalPositionFilter = 'middle'"
            >
              中間 ({{ positionCounts.middle }})
            </button>
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'prefix' }"
              @click="regionalPositionFilter = 'prefix'"
            >
              前綴 ({{ positionCounts.prefix }})
            </button>
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'suffix' }"
              @click="regionalPositionFilter = 'suffix'"
            >
              後綴 ({{ positionCounts.suffix }})
            </button>
          </div>

          <!-- Results Info -->
          <div class="results-info">
            <span>共 {{ filteredRegionalData.length }} 個區域（按頻率排序）</span>
          </div>

          <!-- Regional Chart -->
          <div class="regional-chart">
            <div
              v-for="(item, index) in filteredRegionalData"
              :key="index"
              class="regional-bar"
            >
              <div class="region-info-row">
                <div class="region-header">
                  <RegionDisplay :item="item" mode="full" :skipCity="false" class="region-name" />
                </div>
                <div class="regional-stats">
                  <div class="stat-item">
                    <span class="stat-label">頻率:</span>
                    <span class="stat-value">{{ item.frequency }}</span>
                  </div>
                  <div class="stat-item" v-if="item.position">
                    <span class="stat-label">位置:</span>
                    <span class="stat-value">{{ getNgramPositionLabel(item.position) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="bar-container">
                <div
                  class="bar-fill"
                  :style="{ width: `${item.frequency != null ? (item.frequency / maxRegionalFrequency * 100) : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tendency Analysis -->
    <div class="tendency-section vml-glass-panel">
      <div class="section-header">
        <h2>傾向性分析</h2>
        <button class="toggle-section-btn" @click="toggleTendencySection">
          {{ tendencyExpanded ? '收起' : '展開' }}
        </button>
      </div>

      <div v-show="tendencyExpanded">
        <div class="tendency-results">
          <!-- Position Filter Tabs -->
          <div class="position-tabs">
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'all' }"
              @click="tendencyPositionFilter = 'all'"
            >
              全部 ({{ positionCounts.all }})
            </button>
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'middle' }"
              @click="tendencyPositionFilter = 'middle'"
            >
              中間 ({{ positionCounts.middle }})
            </button>
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'prefix' }"
              @click="tendencyPositionFilter = 'prefix'"
            >
              前綴 ({{ positionCounts.prefix }})
            </button>
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'suffix' }"
              @click="tendencyPositionFilter = 'suffix'"
            >
              後綴 ({{ positionCounts.suffix }})
            </button>
          </div>

          <!-- Results Info -->
          <div class="results-info">
            <span>共 {{ filteredTendencyData.length }} 個區域（按 Z 分數從高到低排序）</span>
          </div>

          <!-- Tendency Chart -->
          <div class="regional-chart">
            <div
              v-for="(item, index) in filteredTendencyData"
              :key="index"
              class="regional-bar"
            >
              <div class="region-info-row">
                <div class="region-header">
                  <RegionDisplay :item="item" mode="full" :skipCity="false" class="region-name" />
                </div>
                <div class="regional-stats">
                  <div class="stat-item">
                    <span class="stat-label">Z分數:</span>
                    <span class="stat-value" :class="getTendencyClassByZScore(item.z_score)">
                      {{ item.z_score != null ? item.z_score.toFixed(2) : 'N/A' }}
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">對數幾率:</span>
                    <span class="stat-value">
                      {{ item.log_odds != null ? item.log_odds.toFixed(2) : 'N/A' }}
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">傾向:</span>
                    <span class="stat-value">
                      {{ item.tendency_score != null ? item.tendency_score.toFixed(2) : 'N/A' }}x
                    </span>
                </div>
                <div class="stat-item" v-if="item.position">
                  <span class="stat-label">位置:</span>
                  <span class="stat-value">{{ getNgramPositionLabel(item.position) }}</span>
                </div>
              </div>
            </div>
            <div class="bar-container">
                <div
                  class="bar-fill"
                  :style="{
                    width: `${item.z_score != null ? (Math.abs(item.z_score) / maxTendencyZScore * 100) : 0}%`,
                    background: (item.z_score || 0) >= 0 ? 'var(--color-primary)' : 'var(--color-error)'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- Significance Analysis -->
    <div class="significance-section vml-glass-panel">
      <h2>顯著性分析</h2>
      <div class="controls vml-control-surface vml-control-row">
        <!-- N-gram 选择器 -->
        <div class="ngram-selector vml-control-field">
          <SimpleSelectDropdown
            v-if="availableNgrams.length > 0"
            v-model="significanceNgram"
            :options="ngramOptions"
            :searchable="true"
            searchPlaceholder="搜索 N-gram..."
            width="100%"
          />
          <input
            v-else
            v-model="significanceNgram"
            type="text"
            placeholder="輸入 N-gram"
            class="vml-input"
          />
          <button
            v-if="availableNgrams.length === 0"
            class="load-list-btn"
            :disabled="loadingNgramList"
            @click="loadAvailableNgrams"
            title="加載 N-gram 列表"
          >
            {{ loadingNgramList ? '⏳' : '📋' }}
          </button>
        </div>
        <div class="vml-control-field vml-control-field--compact">
          <SimpleSelectDropdown
            v-model="significanceLevel"
            :options="levelOptions"
            width="120px"
          />
        </div>
        <div class="vml-control-actions">
          <button
            class="query-button"
            :disabled="!significanceNgram || loadingSignificance"
            @click="loadSignificance"
          >
            查詢
          </button>
        </div>
      </div>

      <div v-if="loadingSignificance" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
      </div>

      <div v-else-if="significanceData.length > 0" class="significance-results">
        <div class="table-scroll-wrapper">
          <div class="significance-table">
            <div class="table-header">
              <div class="col">區域</div>
              <div class="col">N-gram</div>
              <div class="col">位置</div>
              <div class="col">Z分數</div>
              <div class="col">P值</div>
              <div class="col">提升度</div>
            <div class="col">顯著性</div>
          </div>
          <div class="table-body">
            <div
              v-for="(item, index) in significanceData.slice(0, 20)"
              :key="index"
              class="table-row"
              :class="{ 'significant': item.is_significant }"
            >
              <div class="col">{{ item.region_name }}</div>
              <div class="col">{{ item.ngram }}</div>
              <div class="col">{{ getNgramPositionLabel(item.position) }}</div>
              <div class="col">{{ item.z_score != null ? item.z_score.toFixed(2) : 'N/A' }}</div>
              <div class="col">
                <span :class="getPValueClass(item.p_value)">
                  {{ item.p_value != null ? item.p_value.toExponential(2) : 'N/A' }}
                </span>
              </div>
              <div class="col">{{ item.lift != null ? item.lift.toFixed(4) : 'N/A' }}</div>
              <div class="col">
                <span class="sig-badge" :class="getSignificanceBadge(item.p_value)">
                  {{ getSignificanceLabel(item.p_value) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RegionDisplay from '@/VillagesML/components/RegionDisplay.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import {
  getNgramTendency,
  getNgramSignificance,
  getNgramFrequency
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getSignificanceLabel, getSignificanceLevel, getNgramPositionLabel } from '@/VillagesML/config/villagesML.js'
import { buildCurrentVillagesMLPath } from '@/VillagesML/utils/currentDataset.js'

const route = useRoute()
const router = useRouter()

// Unified State
const ngram = ref('')
const level = ref('city')
const hierarchy = ref({ city: null, county: null, township: null })
const ngramData = ref([])
const loading = ref(false)

// N-gram 列表状态
const availableNgrams = ref([])
const loadingNgramList = ref(false)

// Section-specific State
const regionalPositionFilter = ref('all')
const regionalExpanded = ref(true)

const tendencyPositionFilter = ref('all')
const tendencyExpanded = ref(true)

const significanceNgram = ref('')
const significanceLevel = ref('city')
const significanceData = ref([])
const loadingSignificance = ref(false)

// Options for SimpleSelectDropdown
const levelOptions = [
  { label: '城市', value: 'city' },
  { label: '區縣', value: 'county' },
  { label: '鄉鎮', value: 'township' }
]

// N-gram 下拉选项
const ngramOptions = computed(() => {
  const options = [{ label: '請選擇 N-gram', value: '' }]
  availableNgrams.value.forEach(item => {
    options.push({
      label: `${item.ngram} (${item.frequency}次,${(item.percentage).toFixed(1) }%)`,
      value: item.ngram
    })
  })
  return options
})

// Computed
const maxRegionalFrequency = computed(() => {
  if (filteredRegionalData.value.length === 0) return 1
  return Math.max(...filteredRegionalData.value.map(item => item.frequency || 0))
})

const maxTendencyZScore = computed(() => {
  if (filteredTendencyData.value.length === 0) return 1
  return Math.max(...filteredTendencyData.value.map(item => Math.abs(item.z_score || 0)))
})

const sortedRegionalData = computed(() => {
  // Sort by frequency for regional distribution
  return [...ngramData.value].sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
})

const sortedTendencyData = computed(() => {
  // Sort by z_score value (positive first, negative last)
  return [...ngramData.value].sort((a, b) => (b.z_score || 0) - (a.z_score || 0))
})

const filteredRegionalData = computed(() => {
  return sortedRegionalData.value.filter(item => item.position === regionalPositionFilter.value)
})

const filteredTendencyData = computed(() => {
  return sortedTendencyData.value.filter(item => item.position === tendencyPositionFilter.value)
})

const positionCounts = computed(() => {
  const counts = {
    all: 0,
    prefix: 0,
    middle: 0,
    suffix: 0
  }
  ngramData.value.forEach(item => {
    if (item.position && counts[item.position] !== undefined) {
      counts[item.position]++
    }
  })
  return counts
})

// Methods
const loadAvailableNgrams = async () => {
  loadingNgramList.value = true
  try {
    // 获取 2-4 字的高频 N-gram
    const results = await Promise.all([
      getNgramFrequency({ n: 2, top_k: 200, position: 'all' }),
      getNgramFrequency({ n: 3, top_k: 150, position: 'all' }),
      getNgramFrequency({ n: 4, top_k: 100, position: 'all' })
    ])

    // 合并结果并按频率排序
    availableNgrams.value = results
      .flat()
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))

    console.log(`[NgramStats] 加載了 ${availableNgrams.value.length} 個 N-gram`)
  } catch (error) {
    showError('加載 N-gram 列表失敗')
    console.error('[NgramStats] 加載失敗:', error)
  } finally {
    loadingNgramList.value = false
  }
}

const loadNgramData = async () => {
  if (!ngram.value) return

  loading.value = true
  try {
    ngramData.value = await getNgramTendency({
      ngram: ngram.value,
      region_level: level.value,
      ...hierarchy.value
    })
  } catch (error) {
    showError('加載 N-gram 數據失敗')
  } finally {
    loading.value = false
  }
}

const loadSignificance = async () => {
  if (!significanceNgram.value) return

  loadingSignificance.value = true
  try {
    significanceData.value = await getNgramSignificance({
      ngram: significanceNgram.value,
      region_level: significanceLevel.value
    })
  } catch (error) {
    showError('加載顯著性數據失敗')
  } finally {
    loadingSignificance.value = false
  }
}

const getTendencyClass = (zScore) => {
  if (Math.abs(zScore) >= 2) return 'strong-tendency'
  if (Math.abs(zScore) >= 1) return 'moderate-tendency'
  return ''
}

const getTendencyClassByZScore = (zScore) => {
  // z_score > 0 means preference, < 0 means avoidance
  if (!zScore) return ''
  if (zScore >= 2) return 'strong-preference'
  if (zScore >= 1) return 'moderate-preference'
  if (zScore <= -2) return 'strong-avoidance'
  if (zScore <= -1) return 'moderate-avoidance'
  return ''
}

const getTendencyClassByScore = (tendencyScore) => {
  // tendency_score > 1 means preference, < 1 means avoidance
  if (tendencyScore >= 2) return 'strong-preference'
  if (tendencyScore >= 1.5) return 'moderate-preference'
  if (tendencyScore <= 0.5) return 'strong-avoidance'
  if (tendencyScore <= 0.75) return 'moderate-avoidance'
  return ''
}

const getPValueClass = (pValue) => {
  const level = getSignificanceLevel(pValue)
  if (level.symbol === '***') return 'p-very-significant'
  if (level.symbol === '**') return 'p-significant'
  if (level.symbol === '*') return 'p-marginal'
  return 'p-not-significant'
}

const getSignificanceBadge = (pValue) => {
  const level = getSignificanceLevel(pValue)
  if (level.symbol === '***') return 'badge-very-significant'
  if (level.symbol === '**') return 'badge-significant'
  if (level.symbol === '*') return 'badge-marginal'
  return 'badge-not-significant'
}

const clearNgram = () => {
  router.push(buildCurrentVillagesMLPath({ module: 'pattern', subtab: 'ngram-stats' }))
  ngram.value = ''
  significanceNgram.value = ''
}

const toggleRegionalSection = () => {
  regionalExpanded.value = !regionalExpanded.value
}

const toggleTendencySection = () => {
  tendencyExpanded.value = !tendencyExpanded.value
}

onMounted(() => {
  const ngramParam = route.query.ngram
  if (ngramParam) {
    ngram.value = ngramParam
    significanceNgram.value = ngramParam
    // Auto-trigger query
    loadNgramData()
  }
})

// Watch for route query changes (for KeepAlive scenarios)
watch(
  () => route.query.ngram,
  (newNgram) => {
    if (newNgram) {
      ngram.value = newNgram
      significanceNgram.value = newNgram
      // Auto-trigger query
      loadNgramData()
    }
  }
)
</script>

<style scoped lang="scss">
.ngram-stats-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.info-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-md);
  font-size: 14px;
}

.shared-controls {
  padding: 16px;
  margin-bottom: 16px;
}

.info-banner strong {
  color: var(--color-primary);
  margin: 0 6px;
}

.text-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.text-button:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-color: var(--color-primary);
}

.regional-section,
.tendency-section,
.significance-section {
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toggle-section-btn {
  padding: 6px 16px;
  background: rgba(var(--vml-blue-rgb), 0.2);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-section-btn:hover {
  background: rgba(var(--vml-blue-rgb), 0.3);
  border-color: var(--color-primary);
}

.regional-section h2,
.tendency-section h2,
.significance-section h2 {
  margin-bottom: 16px;
}

.controls {
  margin-bottom: 16px;
}

.ngram-selector {
  flex: 2;
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.load-list-btn {
  padding: 10px 14px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.load-list-btn:hover:not(:disabled) {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary);
}

.load-list-btn:disabled {
  @include disabled-state;
}

.vml-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 14px;
  background: var(--glass-50);
}


.position-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tab-button {
  padding: 8px 16px;
  background: var(--glass-50);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-color: var(--color-primary);
}

.tab-button.active {
  background: var(--color-primary);
  color: var(--action-primary-text);
  border-color: var(--color-primary);
}

.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-sm2);
}

.results-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 4px 12px;
  background: var(--glass-80);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary);
}

.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-sm2);
}

.results-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 4px 12px;
  background: var(--glass-80);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary);
}

.results-info {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-sm2);
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.regional-chart {
  @include flex-col;
  gap: 8px;
}

.regional-bar {
  @include flex-col;
  gap: 8px;
  padding: 8px;
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
  transition: background 0.3s ease;
}

.regional-bar:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.region-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.region-header {
  flex-shrink: 0;
}

.region-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.regional-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.tendency {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 13px;
}

.stat-value.strong-preference {
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.stat-value.moderate-preference {
  background: rgba(var(--vml-blue-medium-rgb), 0.2);
  color: var(--vml-blue-darkest);
}

.stat-value.strong-avoidance {
  background: rgba(var(--color-error-rgb), 0.2);
  color: var(--color-error-dark);
}

.stat-value.moderate-avoidance {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning-dark);
}

.region-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.bar-container {
  height: 20px;
  background: var(--glass-50);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.tendency-table,
/* 移动端横向滚动容器 */
.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
}

.significance-table {
  border-radius: var(--radius-md);
  overflow: hidden;
  display: inline-block;
  min-width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 120px 80px 80px 90px 100px 90px 80px;
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

.table-row.significant {
  background: rgba(var(--color-gold-rgb), 0.1);
  border-left: 3px solid var(--color-gold);
}

.table-row.strong-tendency {
  background: rgba(var(--color-warning-rgb), 0.15);
}

.table-row.moderate-tendency {
  background: rgba(var(--color-warning-rgb), 0.08);
}

.table-row.significant {
  background: rgba(var(--color-success-rgb), 0.1);
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

.p-very-significant {
  color: var(--color-success);
  font-weight: 700;
}

.p-significant {
  color: var(--color-success);
  font-weight: 600;
}

.p-marginal {
  color: var(--color-warning);
  font-weight: 500;
}

.p-not-significant {
  color: var(--text-secondary);
}

.sig-badge {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
}

.badge-very-significant {
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.badge-significant {
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.badge-marginal {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning);
}

.badge-not-significant {
  background: rgba(var(--text-secondary-rgb), 0.2);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .regional-chart{
    gap:4px;
  }
  .vml-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .section-header {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
