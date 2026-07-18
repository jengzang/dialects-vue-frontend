<template>
<!--  <ExploreLayout>-->
    <div class="character-significance-page">
      <h3 class="villagesml-subtab-title">
        字符分析 - 顯著性
        <HelpIcon
          content="使用卡方檢驗判斷字符在某地區的使用頻率是否與全局期望顯著不同。檢驗統計量：χ² = Σ[(O-E)²/E]，其中O為觀察頻率，E為期望頻率。顯著性標記：***（p<0.001極顯著）、**（p<0.01非常顯著）、*（p<0.05顯著）、n.s.（p≥0.05不顯著）。Cramér's V效應量衡量關聯強度，V>0.3表示中等效應，V>0.5表示大效應"
          size="md"
          fontSize="16px"
          trigger="both"
        />
      </h3>

      <!-- Query Form -->
      <div class="query-form vml-glass-panel">
        <RadioGroup
            name="queryModeRadio"
            :options="queryModeOptions"
            v-model="queryMode"
        />
        <!-- By Character Mode -->
        <div v-if="queryMode === 'by-char'" class="form-content">
          <h3>按字符查詢顯著性</h3>
          <div class="form-group">
            <label>字符:</label>
            <input
              v-model="queryChar"
              type="text"
              maxlength="1"
              placeholder="輸入單個字符"
              class="vml-char-input"
            />
          </div>
          <div class="form-group">
            <label>區域層級:</label>
            <SimpleSelectDropdown :match-trigger-width="true"
              v-model="regionLevel"
              :options="regionLevelOptions"
            />
          </div>
          <button
            class="query-button"
            :disabled="!queryChar || loading"
            @click="queryByChar"
          >
            查詢
          </button>
        </div>

        <!-- By Region Mode -->
        <div v-else class="form-content">
          <h3>按區域查詢顯著字符</h3>
          <div class="form-group">
            <label>區域選擇:</label>
            <FilterableSelect
              v-model="regionName"
              :level="regionLevel"
              @update:level="(newLevel) => regionLevel = newLevel"
              @update:hierarchy="(h) => regionHierarchy = h"
              placeholder="請選擇或輸入"
            />
          </div>
          <div class="form-group">
            <label>返回數量:</label>
            <input
              v-model.number="topN"
              type="number"
              min="10"
              max="100"
              class="vml-number-input"
            />
          </div>
          <button
            class="query-button"
            :disabled="!regionName || loading"
            @click="queryByRegion"
          >
            查詢
          </button>
        </div>
      </div>

      <!-- Results Table -->
      <div v-if="results.length > 0" class="results-table vml-glass-panel">
        <h3>顯著性分析結果</h3>

        <div v-if="loading" class="vml-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>分析中...</p>
        </div>

        <div v-else class="table-scroll-wrapper">
          <div class="table-container">
            <div class="table-header">
              <div class="col">{{ queryMode === 'by-char' ? '區域' : '字符' }}</div>
              <div class="col">卡方值</div>
              <div class="col">P值</div>
              <div class="col">效應量</div>
              <div class="col">顯著性</div>
            </div>
            <div class="table-body">
              <div
                v-for="(item, index) in results"
                :key="index"
                class="table-row"
                :class="{ 'significant': item.p_value < 0.05 }"
              >
                <div class="col">
                  {{ queryMode === 'by-char' ? item.region_name : (item.character || item.char) }}
                </div>
                <div class="col">
                  {{ (item.chi_square_statistic !== undefined ? item.chi_square_statistic : item.chi_square).toFixed(2) }}
                </div>
                <div class="col">
                  <span :class="getPValueClass(item.p_value)">
                    {{ item.p_value.toFixed(3) }}
                  </span>
                </div>
                <div class="col">{{ item.effect_size.toFixed(2) }}</div>
                <div class="col">
                  <span class="significance-badge" :class="getSignificanceBadge(item.p_value)">
                    {{ getSignificanceLabel(item.p_value) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Statistics -->
      <div v-if="summary" class="summary-panel vml-glass-panel">
        <h3>統計摘要</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">總字符數</div>
            <div class="summary-value">{{ summary.total_characters || summary.total_tests }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">總區域數</div>
            <div class="summary-value">{{ summary.total_regions }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">顯著數量</div>
            <div class="summary-value">{{ summary.significant_count }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">平均卡方值</div>
            <div class="summary-value">{{ summary.avg_abs_chi_square?.toFixed(2) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">最大卡方值</div>
            <div class="summary-value">{{ summary.max_abs_chi_square?.toFixed(2) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">顯著比例</div>
            <div class="summary-value">
              {{ ((summary.significant_count / (summary.total_characters || summary.total_tests)) * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref } from 'vue'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import {
  getCharSignificanceByChar,
  getCharSignificanceByRegion,
  getCharSignificanceSummary
} from '@/api/index.js'
import { showError } from '@/utils/ui/message.js'
import { getSignificanceLabel } from '@/VillagesML/config/villagesML.js'
import RadioGroup from "@/components/selector/RadioGroup.vue";

// State
const queryMode = ref('by-char')
const queryChar = ref('')
const regionLevel = ref('city')
const regionName = ref('')
const regionHierarchy = ref({ city: null, county: null, township: null })
const topN = ref(30)
const results = ref([])
const summary = ref(null)
const loading = ref(false)

// Options for SimpleSelectDropdown
const regionLevelOptions = [
  { label: '城市', value: 'city' },
  { label: '區縣', value: 'county' },
  { label: '鄉鎮', value: 'township' }
]

const queryModeOptions = [
  { value: 'by-char', label: '按字符查詢' },
  { value: 'by-region', label: '按區域查詢' }
]

// Methods
const queryByChar = async () => {
  if (!queryChar.value) return

  console.log('queryByChar called with:', queryChar.value, regionLevel.value)
  loading.value = true
  try {
    const result = await getCharSignificanceByChar({
      char: queryChar.value,
      region_level: regionLevel.value
    })
    console.log('Significance by char result:', result)
    results.value = result || []
  } catch (error) {
    console.error('Query by char error:', error)
    showError('查詢失敗')
  } finally {
    loading.value = false
  }
}

const queryByRegion = async () => {
  if (!regionName.value) return

  console.log('queryByRegion called with:', {
    regionLevel: regionLevel.value,
    regionName: regionName.value,
    hierarchy: regionHierarchy.value,
    topN: topN.value
  })

  loading.value = true
  try {
    // Build query params with full hierarchy
    const params = {
      region_level: regionLevel.value,
      top_k: topN.value
    }

    // Add hierarchical filters based on available data
    if (regionHierarchy.value.city) {
      params.city = regionHierarchy.value.city
    }
    if (regionHierarchy.value.county) {
      params.county = regionHierarchy.value.county
    }
    if (regionHierarchy.value.township) {
      params.township = regionHierarchy.value.township
    }

    // Fallback to region_name for backward compatibility
    if (!params.city && !params.county && !params.township) {
      params.region_name = regionName.value
    }

    console.log('API params:', params)
    const result = await getCharSignificanceByRegion(params)
    console.log('Significance by region result:', result)
    results.value = result || []

    // Load summary
    const summaryResult = await getCharSignificanceSummary({
      region_level: regionLevel.value
    })
    console.log('Summary result:', summaryResult)
    summary.value = summaryResult
  } catch (error) {
    console.error('Query by region error:', error)
    showError('查詢失敗')
  } finally {
    loading.value = false
  }
}

const getPValueClass = (pValue) => {
  if (pValue < 0.001) return 'p-very-significant'
  if (pValue < 0.01) return 'p-significant'
  if (pValue < 0.05) return 'p-marginal'
  return 'p-not-significant'
}

const getSignificanceBadge = (pValue) => {
  if (pValue < 0.001) return 'badge-very-significant'
  if (pValue < 0.01) return 'badge-significant'
  if (pValue < 0.05) return 'badge-marginal'
  return 'badge-not-significant'
}

// getSignificanceLabel is now imported from @/VillagesML/config/villagesML.js

</script>

<style scoped lang="scss">
.query-button{
  margin: 0 auto 0;
}
.character-significance-page {
  padding: 12px;
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

.mode-selector {
  display: flex;
  justify-content: center; /* 新增：水平居中 */
  align-items: center;     /* 新增：垂直居中 */
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.query-form {
  padding: 16px;
  margin-bottom: 20px;
}

.form-content {
  @include flex-col;
  gap: 12px;
  margin-top: 16px;
}

.form-content h3 {
  font-size: 16px;
  margin: 0 16px 0 0;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.form-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px 12px;
  margin-bottom: 12px;
}

.form-group label {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-secondary);
}

.vml-number-input {
  padding: 8px 12px;
}

.results-table {
  padding: 16px;
  margin-bottom: 20px;
}

.results-table h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.table-container {
  border-radius: var(--radius-md);
  overflow: hidden;
  display: inline-block;
  min-width: 100%;
}

.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: auto auto auto auto auto;
  gap: 16px;
  padding: 10px 12px;
  align-items: center;
}

.table-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
}

.table-row {
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.3s ease;
  font-size: 14px;
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.table-row.significant {
  background: rgba(var(--color-success-rgb), 0.1);
}

.col {
  display: flex;
  align-items: center;
  white-space: nowrap;
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

.significance-badge {
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

.summary-panel {
  padding: 16px;
}

.summary-panel h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.summary-item {
  padding: 16px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
  text-align: center;
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

@media (min-aspect-ratio: 1/1) {
  .form-content {
    flex-flow: row wrap;
    align-items: center;
  }

  .form-group {
    grid-template-columns: auto 1fr;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .character-significance-page {
    padding: 8px;
  }

  .mode-selector {
    padding: 8px;
  }

  .query-form {
    padding: 12px;
  }

  .results-table {
    padding: 12px;
  }

  .summary-panel {
    padding: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .form-group {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

/* 移动端横向滚动样式 */
@media (max-aspect-ratio: 1/1) {
  .table-scroll-wrapper {
    overflow-x: auto;
  }

}
</style>
