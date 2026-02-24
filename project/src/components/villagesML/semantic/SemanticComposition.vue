<template>
<!--  <ExploreLayout>-->
    <div class="semantic-composition-page">
      <h1 class="page-title">🧩 語義組合模式</h1>

      <!-- Composition Patterns -->
      <div class="patterns-section glass-panel">
        <h2>組合模式</h2>
        <p class="section-description">
          分析村名中語義類別的組合模式，例如「方位+聚落」、「水系+聚落」等。
        </p>
        <div class="controls">
          <div class="input-group">
            <label class="input-label">最小出現次數</label>
            <input
              v-model.number="minCount"
              type="number"
              min="1"
              placeholder="例如：5"
              class="number-input"
            />
            <span class="input-hint">過濾掉出現次數少於此值的模式</span>
          </div>
          <div class="input-group">
            <label class="input-label">返回數量</label>
            <input
              v-model.number="topN"
              type="number"
              min="10"
              max="1000"
              placeholder="例如：50"
              class="number-input"
            />
            <span class="input-hint">返回前N個最常見的模式（最多1000）</span>
          </div>
          <button
            class="query-button"
            :disabled="loadingPatterns"
            @click="loadPatterns"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingPatterns" class="loading-state">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="patterns.length > 0" class="patterns-table">
          <div class="table-header">
            <div class="col-pattern">模式</div>
            <div class="col-type">類型</div>
            <div class="col-count">頻率</div>
            <div class="col-percentage">佔比</div>
            <div class="col-components">組成</div>
          </div>
          <div class="table-body">
            <div
              v-for="(pattern, index) in patterns"
              :key="index"
              class="table-row"
            >
              <div class="col-pattern">{{ translatePattern(pattern.pattern) }}</div>
              <div class="col-type">{{ getPatternTypeName(pattern.pattern_type) }}</div>
              <div class="col-count">{{ pattern.frequency }}</div>
              <div class="col-percentage">{{ pattern.percentage?.toFixed(2) || '0.00' }}%</div>
              <div class="col-components">
                <span v-if="pattern.modifier" class="component-tag modifier">{{ getCategoryName(pattern.modifier) }}</span>
                <span v-if="pattern.head" class="component-tag head">{{ getCategoryName(pattern.head) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bigrams and Trigrams -->
      <div class="ngrams-section">
        <div class="bigrams glass-panel">
          <h3>二元組合 (Bigrams)</h3>
          <p class="subsection-description">
            分析相鄰兩個語義類別的組合，顯示頻率、佔比和PMI關聯強度。
          </p>
          <div class="controls">
            <div class="input-group">
              <label class="input-label">最小次數</label>
              <input
                v-model.number="bigramMinCount"
                type="number"
                min="1"
                placeholder="例如：5"
                class="number-input"
              />
            </div>
            <button
              class="query-button"
              :disabled="loadingBigrams"
              @click="loadBigrams"
            >
              查詢
            </button>
          </div>

          <div v-if="loadingBigrams" class="loading-state">
            <div class="spinner"></div>
          </div>

          <div v-else-if="bigrams.length > 0" class="bigrams-list">
            <div
              v-for="(bigram, index) in bigrams"
              :key="index"
              class="bigram-item"
            >
              <div class="bigram-text">{{ getCategoryName(bigram.category1) }} + {{ getCategoryName(bigram.category2) }}</div>
              <div class="bigram-count">{{ bigram.frequency }}</div>
              <div class="bigram-stats">
                <span class="stat-item">{{ bigram.percentage?.toFixed(2) || '0.00' }}%</span>
                <span class="stat-item">PMI: {{ bigram.pmi_score?.toFixed(3) || '0.000' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="trigrams glass-panel">
          <h3>三元組合 (Trigrams)</h3>
          <p class="subsection-description">
            分析連續三個語義類別的組合模式，顯示頻率和佔比。
          </p>
          <div class="controls">
            <div class="input-group">
              <label class="input-label">最小次數</label>
              <input
                v-model.number="trigramMinCount"
                type="number"
                min="1"
                placeholder="例如：3"
                class="number-input"
              />
            </div>
            <button
              class="query-button"
              :disabled="loadingTrigrams"
              @click="loadTrigrams"
            >
              查詢
            </button>
          </div>

          <div v-if="loadingTrigrams" class="loading-state">
            <div class="spinner"></div>
          </div>

          <div v-else-if="trigrams.length > 0" class="trigrams-list">
            <div
              v-for="(trigram, index) in trigrams"
              :key="index"
              class="trigram-item"
            >
              <div class="trigram-text">{{ getCategoryName(trigram.category1) }} + {{ getCategoryName(trigram.category2) }} + {{ getCategoryName(trigram.category3) }}</div>
              <div class="trigram-count">{{ trigram.frequency }}</div>
              <div class="trigram-stats">
                <span class="stat-item">{{ trigram.percentage?.toFixed(2) || '0.00' }}%</span>
                <span v-if="trigram.pmi_score" class="stat-item">PMI: {{ trigram.pmi_score?.toFixed(3) || '0.000' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PMI Analysis -->
      <div class="pmi-section glass-panel">
        <h2>點互信息 (PMI) 分析</h2>
        <p class="section-description">
          PMI 衡量兩個類別共現的關聯強度。PMI > 0 表示正相關（傾向共現），PMI < 0 表示負相關（傾向不共現）。
        </p>
        <div class="controls">
          <div class="input-group">
            <label class="input-label">最小PMI值</label>
            <input
              v-model.number="minPMI"
              type="number"
              step="0.1"
              placeholder="例如：0"
              class="number-input"
            />
            <span class="input-hint">過濾PMI分數低於此值的組合</span>
          </div>
          <div class="input-group">
            <label class="input-label">返回數量</label>
            <input
              v-model.number="pmiTopN"
              type="number"
              min="10"
              max="1000"
              placeholder="例如：50"
              class="number-input"
            />
            <span class="input-hint">返回前N個最高PMI的組合</span>
          </div>
          <button
            class="query-button"
            :disabled="loadingPMI"
            @click="loadPMI"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingPMI" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="pmiData.length > 0" class="pmi-results">
          <div class="pmi-header">
            <div class="col-pair">類別對</div>
            <div class="col-pmi">PMI值</div>
            <div class="col-count">共現次數</div>
            <div class="col-strength">關聯強度</div>
          </div>
          <div class="pmi-body">
            <div
              v-for="(item, index) in pmiData"
              :key="index"
              class="pmi-row"
              :class="getPMIClass(item.pmi_score)"
            >
              <div class="col-pair">{{ getCategoryName(item.category1) }} + {{ getCategoryName(item.category2) }}</div>
              <div class="col-pmi">{{ item.pmi_score?.toFixed(3) || '0.000' }}</div>
              <div class="col-count">{{ item.frequency }}</div>
              <div class="col-strength">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :style="{ width: `${Math.min((item.pmi_score || 0) * 10, 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Semantic Indices -->
      <div class="indices-section glass-panel">
        <h2>語義指數</h2>
        <p class="section-description">
          獲取區域的語義強度指數，分析不同地區村莊命名的語義特徵偏好。語義強度 = 該區域村莊名稱中，平均每個村莊包含該語義類別字符的次數。
        </p>

        <div class="controls">
          <div class="input-group">
            <label class="input-label">語義類別</label>
            <select v-model="indicesCategory" class="select-input">
              <option value="">全部類別</option>
              <option value="water">水系</option>
              <option value="mountain">山地</option>
              <option value="settlement">聚落</option>
              <option value="direction">方位</option>
              <option value="clan">宗族</option>
              <option value="vegetation">植物</option>
              <option value="agriculture">農業</option>
              <option value="symbolic">象徵</option>
              <option value="infrastructure">基建</option>
            </select>
            <span class="input-hint">過濾特定語義類別</span>
          </div>

          <div class="input-group">
            <label class="input-label">行政級別</label>
            <select v-model="indicesRegionLevel" class="select-input">
              <option value="">全部級別</option>
              <option value="city">市級</option>
              <option value="county">區縣級</option>
              <option value="township">鄉鎮級</option>
            </select>
            <span class="input-hint">過濾特定行政級別</span>
          </div>

          <div class="input-group" v-if="indicesRegionLevel">
            <label class="input-label">區域名稱</label>
            <div class="input-with-clear">
              <FilterableSelect
                v-model="indicesRegionName"
                :level="indicesRegionLevel"
                placeholder="請選擇或輸入區域"
                :show-level-selector="false"
              />
              <button
                v-if="indicesRegionName"
                @click="indicesRegionName = ''"
                class="clear-button"
                type="button"
              >
                ✕
              </button>
            </div>
            <span class="input-hint">查詢特定區域</span>
          </div>

          <div class="input-group">
            <label class="input-label">最小村莊數</label>
            <input
              v-model.number="indicesMinVillages"
              type="number"
              min="1"
              placeholder="例如：50"
              class="number-input"
              :disabled="!canUseMinVillages"
            />
            <span class="input-hint">
              {{ canUseMinVillages ? '過濾村莊數少的區域（提高可靠性）' : '需要登錄才能使用此功能' }}
            </span>
          </div>

          <div class="input-group">
            <label class="input-label">返回數量</label>
            <input
              v-model.number="indicesLimit"
              type="number"
              min="10"
              :max="maxIndicesLimit"
              placeholder="例如：100"
              class="number-input"
            />
            <span class="input-hint">
              限制返回記錄數（10-{{ maxIndicesLimit }}）
<!--              <span v-if="userStore.role !== 'admin'" class="limit-warning">非管理員最多100條</span>-->
            </span>
          </div>

          <button
            class="query-button"
            :disabled="loadingIndices"
            @click="loadIndices"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingIndices" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="indices && indices.length > 0" class="indices-table">
          <div class="table-header">
            <div class="col-region">區域</div>
            <div class="col-level">級別</div>
            <div class="col-category">語義類別</div>
            <div class="col-index">語義指數</div>
            <div class="col-normalized">標準化指數</div>
            <div class="col-rank">省內排名</div>
            <div class="col-villages" v-if="indicesMinVillages">村莊數</div>
          </div>
          <div class="table-body">
            <div
              v-for="(item, index) in indices"
              :key="index"
              class="table-row"
            >
              <div class="col-region">{{ item.region_name }}</div>
              <div class="col-level">
                <span class="level-badge">{{ getRegionLevelName(item.region_level) }}</span>
              </div>
              <div class="col-category">
                <span class="category-badge">{{ getCategoryName(item.semantic_category) }}</span>
              </div>
              <div class="col-index">{{ item.semantic_index?.toFixed(2) || 'N/A' }}</div>
              <div class="col-normalized">{{ item.normalized_index?.toFixed(2) || 'N/A' }}</div>
              <div class="col-rank">
                <span class="rank-badge" :class="getRankClass(item.rank_in_region)">
                  #{{ item.rank_in_region }}
                </span>
              </div>
              <div class="col-villages" v-if="indicesMinVillages">{{ item.village_count || 'N/A' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import {
  getSemanticCompositionPatterns,
  getSemanticBigrams,
  getSemanticTrigrams,
  getSemanticPMI,
  getSemanticIndices
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getPatternTypeName, getCategoryName } from '@/config/villagesML.js'
import { userStore } from '@/utils/store.js'

// State
const patterns = ref([])
const bigrams = ref([])
const trigrams = ref([])
const pmiData = ref([])
const indices = ref(null)

const loadingPatterns = ref(false)
const loadingBigrams = ref(false)
const loadingTrigrams = ref(false)
const loadingPMI = ref(false)
const loadingIndices = ref(false)

const minCount = ref(5)
const topN = ref(50)
const bigramMinCount = ref(5)
const trigramMinCount = ref(3)
const minPMI = ref(0)
const pmiTopN = ref(50)

// Indices query parameters
const indicesCategory = ref('')
const indicesRegionLevel = ref('')
const indicesRegionName = ref('')
const indicesMinVillages = ref(null)
const indicesLimit = ref(100)

// Computed properties for role-based limits
const maxIndicesLimit = computed(() => {
  return userStore.role === 'admin' ? 1000 : 100
})

const canUseMinVillages = computed(() => {
  return userStore.isAuthenticated
})

// Watch limit to enforce max
watch(indicesLimit, (newValue) => {
  if (newValue > maxIndicesLimit.value) {
    indicesLimit.value = maxIndicesLimit.value
  }
})

// Methods
const loadPatterns = async () => {
  loadingPatterns.value = true
  try {
    patterns.value = await getSemanticCompositionPatterns({
      min_frequency: minCount.value,
      limit: topN.value
    })
  } catch (error) {
    showError('加載組合模式失敗')
  } finally {
    loadingPatterns.value = false
  }
}

const loadBigrams = async () => {
  loadingBigrams.value = true
  try {
    bigrams.value = await getSemanticBigrams({
      min_frequency: bigramMinCount.value,
      limit: 50
    })
  } catch (error) {
    showError('加載二元組合失敗')
  } finally {
    loadingBigrams.value = false
  }
}

const loadTrigrams = async () => {
  loadingTrigrams.value = true
  try {
    trigrams.value = await getSemanticTrigrams({
      min_frequency: trigramMinCount.value,
      limit: 50
    })
  } catch (error) {
    showError('加載三元組合失敗')
  } finally {
    loadingTrigrams.value = false
  }
}

const loadPMI = async () => {
  loadingPMI.value = true
  try {
    pmiData.value = await getSemanticPMI({
      min_pmi: minPMI.value,
      limit: pmiTopN.value
    })
  } catch (error) {
    showError('加載PMI數據失敗')
  } finally {
    loadingPMI.value = false
  }
}

const loadIndices = async () => {
  loadingIndices.value = true
  try {
    const params = {}
    // 只添加非空值的參數
    if (indicesCategory.value && indicesCategory.value !== '') {
      params.category = indicesCategory.value
    }
    if (indicesRegionLevel.value && indicesRegionLevel.value !== '') {
      params.region_level = indicesRegionLevel.value
    }
    if (indicesRegionName.value && indicesRegionName.value !== '') {
      params.region_name = indicesRegionName.value
    }
    if (indicesMinVillages.value && indicesMinVillages.value > 0) {
      params.min_villages = indicesMinVillages.value
    }
    if (indicesLimit.value && indicesLimit.value > 0) {
      params.limit = indicesLimit.value
    }

    indices.value = await getSemanticIndices(params)
  } catch (error) {
    showError('加載語義指數失敗')
  } finally {
    loadingIndices.value = false
  }
}

const getPMIClass = (pmi_score) => {
  if (pmi_score >= 5) return 'pmi-very-strong'
  if (pmi_score >= 3) return 'pmi-strong'
  if (pmi_score >= 1) return 'pmi-moderate'
  return 'pmi-weak'
}

// Translate pattern string (e.g., "direction+settlement" -> "方位+聚落")
const translatePattern = (patternStr) => {
  if (!patternStr) return ''
  return patternStr
    .split('+')
    .map(cat => getCategoryName(cat.trim()))
    .join('+')
}

// Get rank badge class based on rank
const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-normal'
}

// Get region level name in Chinese
const getRegionLevelName = (level) => {
  const names = {
    'city': '市級',
    'county': '區縣',
    'township': '鄉鎮'
  }
  return names[level] || level
}

// Watch region level changes and clear region name
watch(indicesRegionLevel, () => {
  indicesRegionName.value = ''
})

</script>

<style scoped>
.semantic-composition-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.patterns-section,
.pmi-section,
.indices-section {
  padding: 24px;
  margin-bottom: 30px;
}

.patterns-section h2,
.pmi-section h2,
.indices-section h2 {
  font-size: 20px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.subsection-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 15px;
  line-height: 1.5;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-with-clear {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-button {
  padding: 8px 12px;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.clear-button:hover {
  background: rgba(231, 76, 60, 0.2);
  border-color: #e74c3c;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.input-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.number-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 150px;
}

.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.number-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(200, 200, 200, 0.3);
}

.limit-warning {
  color: #e74c3c;
  font-weight: 500;
  margin-left: 8px;
}

.select-input,
.text-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 150px;
}

.select-input:focus,
.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.query-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.patterns-table {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 12px 16px;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.col-components {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.component-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.component-tag.modifier {
  background: rgba(243, 156, 18, 0.2);
  color: #d68910;
}

.component-tag.head {
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
}

.ngrams-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.bigrams,
.trigrams {
  padding: 24px;
}

.bigrams h3,
.trigrams h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.bigrams-list,
.trigrams-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
}

.bigram-item,
.trigram-item {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  align-items: center;
}

.bigram-text,
.trigram-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.bigram-count,
.trigram-count {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}

.bigram-stats,
.trigram-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.stat-item {
  padding: 4px 10px;
  background: rgba(74, 144, 226, 0.15);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pmi-results {
  border-radius: 12px;
  overflow: hidden;
}

.pmi-header,
.pmi-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 12px 16px;
  align-items: center;
}

.pmi-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.pmi-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.pmi-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.pmi-row.pmi-very-strong {
  background: rgba(39, 174, 96, 0.15);
}

.pmi-row.pmi-strong {
  background: rgba(46, 204, 113, 0.1);
}

.pmi-row.pmi-moderate {
  background: rgba(243, 156, 18, 0.1);
}

.col-pair {
  font-weight: 600;
  color: var(--text-primary);
}

.col-pmi {
  font-weight: 600;
  color: var(--color-primary);
}

.col-count {
  color: var(--text-secondary);
}

.strength-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.indices-table {
  border-radius: 12px;
  overflow: hidden;
  margin-top: 20px;
}

.indices-table .table-header,
.indices-table .table-row {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 1.2fr 1fr 1.2fr 0.8fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
}

/* When village_count column is shown */
.indices-table .table-header:has(.col-villages),
.indices-table .table-row:has(.col-villages) {
  grid-template-columns: 1.5fr 0.8fr 1.2fr 1fr 1.2fr 0.8fr 0.8fr;
}

.indices-table .table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.indices-table .table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.indices-table .table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.category-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(74, 144, 226, 0.15);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.level-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(80, 200, 120, 0.15);
  color: #2ecc71;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.rank-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b6914;
}

.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #5a5a5a;
}

.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #e8a87c);
  color: #6b3e1a;
}

.rank-normal {
  background: rgba(74, 144, 226, 0.15);
  color: var(--color-primary);
}

@media (max-width: 1024px) {
  .ngrams-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .controls {
    flex-direction: column;
  }

  .number-input {
    width: 100%;
  }

  .table-header,
  .table-row,
  .pmi-header,
  .pmi-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
