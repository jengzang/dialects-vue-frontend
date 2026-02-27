<template>
  <div class="category-tendency-page">
    <h3 class="villagesml-subtab-title">區域分析 - 類別傾向性</h3>

    <div class="tendency-section glass-panel">
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

      <div v-if="loadingTendency" class="loading-state">
        <div class="spinner"></div>
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

  <!-- Regional N-gram Rankings -->
  <div class="ngram-section glass-panel">
    <h2>區域 N-gram 排行榜</h2>
    <div class="ngram-controls">
      <select v-model.number="ngramN" class="select-input">
        <option :value="2">二元組 (Bigrams)</option>
        <option :value="3">三元組 (Trigrams)</option>
        <option :value="4">四元組 (4-grams)</option>
      </select>
      <select v-model="ngramLevel" class="select-input">
        <option value="city">城市</option>
        <option value="county">區縣</option>
        <option value="township">鄉鎮</option>
      </select>
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

    <div v-if="loadingNgram" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="ngramData.length > 0" class="ngram-results">
      <div class="ngram-header">
        <div class="col-rank">排名</div>
        <div class="col-ngram">N-gram</div>
        <div class="col-frequency">頻率</div>
        <div class="col-percentage">百分比</div>
        <div class="col-bar">分佈</div>
      </div>
      <div class="ngram-body">
        <div
          v-for="(item, index) in ngramData"
          :key="index"
          class="ngram-row"
          :class="{ 'top-10': item.rank <= 10 }"
        >
          <div class="col-rank">{{ item.rank }}</div>
          <div class="col-ngram">{{ item.ngram }}</div>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import { getSemanticCategoryTendency, getNgramRegional } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryName } from '@/config/villagesML.js'

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

const maxNgramPercentage = computed(() => {
  if (ngramData.value.length === 0) return 1
  return Math.max(...ngramData.value.map(item => item.percentage))
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

.tendency-section {
  padding: 16px;
}

.tendency-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.region-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.query-button {
  padding: 10px 20px;
  font-size: 14px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  padding: 12px;
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
  padding: 16px;
  margin-top: 16px;
}

.ngram-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.ngram-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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
  border-radius: 12px;
  overflow: hidden;
}

.ngram-header,
.ngram-row {
  display: grid;
  grid-template-columns: 60px 150px 100px 100px 1fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
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
  }

  .number-input,
  .select-input {
    width: 100%;
  }

  .ngram-header,
  .ngram-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
