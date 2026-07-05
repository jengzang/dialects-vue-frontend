<template>
  <div class="category-tendency-page">
    <h3 class="villagesml-subtab-title">
      區域分析 - 類別傾向性
      <HelpIcon content="分析區域對語義類別的偏好。Z分數衡量該區域使用某語義類別的傾向，Lift值表示相對於全局平均的提升倍數。同時提供區域N-gram排行榜功能" />
    </h3>

    <div class="vml-glass-panel">
      <div class="tendency-section">
      <h3>區域語義類別傾向性</h3>
      <p class="section-description">
        分析特定區域中各語義類別的傾向性，使用Z分數和Lift值衡量該區域對不同語義類別的偏好程度。
      </p>

      <div class="region-selector">
        <FilterableSelect
          v-model="regionName"
          :level="regionLevel"
          @update:level="(newLevel) => regionLevel = newLevel"
          @update:hierarchy="(h) => regionHierarchy = h"
          placeholder="請選擇或輸入區域"
        />
        <button
          class="query-button solid-button"
          :disabled="!regionName || loadingTendency"
          @click="loadCategoryTendency"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingTendency" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
      </div>

      <div v-else-if="categoryTendency.length > 0" class="tendency-results">
        <div
          v-for="item in categoryTendency"
          :key="item.category"
          class="tendency-item"
        >
          <div class="tendency-category">{{ getCategoryName(item.category) }}</div>
          <div class="tendency-bar">
            <div
              class="tendency-fill"
              :style="{
                width: `${Math.min(Math.abs(item.z_score) * 10, 100)}%`,
                background: item.z_score >= 0 ? 'var(--color-primary)' : '#e74c3c'
              }"
            ></div>
          </div>
          <div class="tendency-value">Z: {{ item.z_score.toFixed(2) }}</div>
          <div class="tendency-freq">Lift: {{ item.lift.toFixed(4) }}</div>
        </div>
      </div>
    </div>
    </div>
  </div>

  <!-- Regional N-gram Rankings -->
  <div class="vml-glass-panel">
    <div class="ngram-section">
    <h2>區域 N-gram 排行榜</h2>
    <div class="ngram-controls">
      <SimpleSelectDropdown :match-trigger-width="true"
        v-model="ngramN"
        :options="ngramNOptions"
      />

      <SimpleSelectDropdown
        v-model="ngramLevel"
        :options="ngramLevelOptions"
      />

      <FilterableSelect
        v-model="ngramFilterRegion"
        :level="ngramParentFilterLevel"
        :show-level-selector="false"
        :show-counts="false"
        placeholder="篩選父區域（可選）"
        @update:hierarchy="(h) => ngramFilterHierarchy = h"
      />
      <input
        v-model.number="ngramTopK"
        type="number"
        min="1"
        max="500"
        placeholder="返回數量 (1-500)"
        class="number-input"
      />
      <button
        class="query-button solid-button"
        :disabled="loadingNgram"
        @click="loadRegionalNgrams"
      >
        查詢
      </button>
    </div>

    <div v-if="loadingNgram" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
    </div>

    <div v-else-if="ngramData.length > 0" class="ngram-results">
      <div class="table-scroll-wrapper">
        <div class="ngram-table">
          <div class="ngram-header">
            <div class="col-rank">排名</div>
            <div class="col-ngram">N-gram</div>
            <div class="col-region">區域</div>
            <div class="col-frequency">頻率</div>
            <div class="col-percentage">百分比</div>
            <div class="col-bar">分佈</div>
          </div>
          <div class="ngram-body">
            <div
              v-for="(item, index) in processedNgramData"
              :key="index"
              class="ngram-row"
              :class="{ 'top-10': item.rank <= 10 }"
            >
              <div class="col-rank">{{ item.rank }}</div>
              <div class="col-ngram">{{ item.ngram }}</div>
              <div class="col-region">
                <span class="region-badge">{{ item.region_name || item.city || item.county || item.township }}</span>
              </div>
              <div class="col-frequency">{{ item.frequency }}</div>
              <div class="col-percentage">{{ item.percentage.toFixed(2) }}%</div>
              <div class="col-bar">
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{ width: `${(item.percentage / maxNgramPercentage) * 100}%` }"
                  ></div>
                </div>
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
import { ref, computed, watch } from 'vue'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { getSemanticCategoryTendency, getNgramRegional } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryName } from '@/VillagesML/config/villagesML.js'

// State
const categoryTendency = ref([])
const loadingTendency = ref(false)

const regionLevel = ref('city')
const regionName = ref('')
const regionHierarchy = ref({ city: null, county: null, township: null })

// N-gram State
const ngramN = ref(2)
const ngramLevel = ref('city')
const ngramFilterRegion = ref('')
const ngramFilterHierarchy = ref(null)
const ngramParentFilterLevel = computed(() => ngramLevel.value === 'township' ? 'county' : 'city')
const ngramTopK = ref(50)
const ngramData = ref([])
const loadingNgram = ref(false)

// Options
const ngramNOptions = [
  { label: '二元組 (Bigrams)', value: 2 },
  { label: '三元組 (Trigrams)', value: 3 },
  { label: '四元組 (4-grams)', value: 4 }
]

const ngramLevelOptions = [
  { label: '城市', value: 'city' },
  { label: '區縣', value: 'county' },
  { label: '鄉鎮', value: 'township' }
]

const maxNgramPercentage = computed(() => {
  if (ngramData.value.length === 0) return 1
  return Math.max(...ngramData.value.map(item => item.percentage))
})

// 处理后的 N-gram 数据：当没有筛选父区域时，重新排序并计算全局排名
const processedNgramData = computed(() => {
  if (ngramData.value.length === 0) return []

  // 检查是否有筛选父区域
  const hasFilter = ngramFilterHierarchy.value?.city ||
                    ngramFilterHierarchy.value?.county ||
                    ngramFilterHierarchy.value?.township

  // 如果有筛选，直接返回原数据（使用后端的区域内排名）
  if (hasFilter) {
    return ngramData.value
  }

  // 如果没有筛选，按频率重新排序并计算全局排名
  const sorted = [...ngramData.value].sort((a, b) => b.frequency - a.frequency)
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1
  }))
})

// Methods
const loadCategoryTendency = async () => {
  if (!regionName.value) return

  loadingTendency.value = true
  try {
    categoryTendency.value = await getSemanticCategoryTendency({
      region_level: regionLevel.value,
      ...regionHierarchy.value
    })
  } catch (error) {
    showError('加載傾向性失敗')
  } finally {
    loadingTendency.value = false
  }
}

watch(ngramLevel, () => {
  ngramFilterRegion.value = ''
  ngramFilterHierarchy.value = null
})

const loadRegionalNgrams = async () => {
  loadingNgram.value = true
  try {
    const params = {
      n: ngramN.value,
      region_level: ngramLevel.value,
      top_k: ngramTopK.value
    }
    const h = ngramFilterHierarchy.value
    if (h?.city) params.city = h.city
    if (h?.county) params.county = h.county
    if (h?.township) params.township = h.township
    ngramData.value = await getNgramRegional(params)
  } catch (error) {
    showError('加載 N-gram 排行榜失敗')
  } finally {
    loadingNgram.value = false
  }
}
</script>

<style scoped>
.category-tendency-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.vml-glass-panel + .vml-glass-panel {
  margin-top: 16px;
}

.tendency-section {
  display: flex;
  flex-direction: column;
}

.tendency-section h3 {
  font-size: 16px;
  margin: 0;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  width: 100%;
}

.region-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tendency-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 120px 1fr 100px 120px;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.tendency-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.tendency-category {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.tendency-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.tendency-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.tendency-freq {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

.select-input {
  width: 150px;
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.ngram-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ngram-section h2 {
  white-space: nowrap;
  flex-shrink: 0;
}

.ngram-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.number-input {
  width: 180px;
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.ngram-results {
  margin-top: 16px;
}

/* 移动端横向滚动容器 */
.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
}

.ngram-table {
  border-radius: 12px;
  overflow: hidden;
  min-width: 700px;
}

.ngram-header,
.ngram-row {
  display: grid;
  grid-template-columns: 60px 150px 120px 100px 100px 1fr;
  gap: 12px;
  padding: 6px 12px;
  align-items: center;
  min-width: 0;
}

.ngram-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.ngram-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.ngram-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.ngram-row.top-10 {
  background: rgba(243, 156, 18, 0.1);
}

.col-ngram {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.col-region {
  font-size: 13px;
}

.region-badge {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(74, 144, 226, 0.15);
  color: var(--color-primary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.bar-container {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

@media (max-width: 768px) {
  .region-selector {
    flex-direction: column;
  }

  .tendency-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .ngram-controls {
    flex-direction: column;
    width: 100%;
  }

  .ngram-controls > * {
    width: 100% !important;
    max-width: 100% !important;
  }

  .number-input {
    width: 100% !important;
  }

  .select-input,
  .simple-select-dropdown,
  .filterable-select {
    width: 100% !important;
  }
}

@media (min-aspect-ratio: 1/1) {
  .tendency-section {
    flex-flow: row wrap;
    align-items: center;
    gap: 8px 16px;
  }

  .ngram-section {
    flex-direction: row;
    align-items: center;
  }

  .ngram-controls {
    flex: 1;
  }
}

/* 移动端横向滚动条样式 */
@media (max-aspect-ratio: 1/1) {
}
</style>
