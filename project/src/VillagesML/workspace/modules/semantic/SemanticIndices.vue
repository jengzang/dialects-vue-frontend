<template>
  <div class="semantic-indices-page">
    <h3 class="villagesml-subtab-title">
      語義分析 - 語義指數
      <HelpIcon content="計算區域的語義強度指數。語義強度 = 該區域村莊名稱中，平均每個村莊包含該語義類別字符的次數。標準化指數用於跨區域比較，省內排名反映該語義類別在省內的相對強度" />
    </h3>

    <!-- Detail Mode Toggle -->
    <div class="detail-toggle vml-glass-panel">
      <div class="toggle-left">
        <label class="toggle-container">
          <SwitchToggle
            :model-value="detailMode"
            :width="48"
            :height="24"
            :thumb-size="20"
            color="blue"
            variant="solid"
            show-label
            active-text="詳細模式"
            inactive-text="詳細模式"
            label-position="right"
            :aria-label="'詳細模式'"
            @update:modelValue="detailMode = $event"
          />
        </label>
        <span class="toggle-hint">（語義分類更細緻）</span>
      </div>
      <button class="lexicon-button" @click="showLexiconModal = true">
        📖 查看詞典
      </button>
    </div>

    <div class="indices-section vml-glass-panel">
      <h2>語義指數</h2>
      <p class="section-description">
        獲取區域的語義強度指數，分析不同地區村莊命名的語義特徵偏好。語義強度 = 該區域村莊名稱中，平均每個村莊包含該語義類別字符的次數。
      </p>

      <div class="controls">
        <div class="input-group">
          <label class="input-label">語義類別</label>
          <SimpleSelectDropdown :match-trigger-width="true"
            v-model="indicesCategory"
            :options="categoryOptions"
          />
          <span class="input-hint">過濾特定語義類別</span>
        </div>

        <div class="input-group">
          <label class="input-label">行政級別</label>
          <SimpleSelectDropdown :match-trigger-width="true"
            v-model="indicesRegionLevel"
            :options="regionLevelOptions"
          />
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
            class="vml-number-input"
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
            class="vml-number-input"
          />
          <span class="input-hint">
            限制返回記錄數（10-{{ maxIndicesLimit }}）
          </span>
        </div>

        <button
          class="solid-button"
          :disabled="loadingIndices"
          @click="loadIndices"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingIndices" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
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

    <!-- Lexicon Modal -->
    <AppModal
      :model-value="showLexiconModal"
      size="lg"
      title="📖 語義詞典"
      @update:modelValue="showLexiconModal = false"
    >
      <div class="lexicon-body">
              <!-- 9个主类别 -->
              <div class="lexicon-section">
                <h4>主類別 (v1.0.0)</h4>
                <div class="category-list">
                  <div
                    v-for="(chars, category) in SEMANTIC_LEXICON_V1.categories"
                    :key="category"
                    class="category-item"
                  >
                    <div class="category-header">
                      <span class="category-name">{{ CATEGORY_NAMES_ZH[category] }}</span>
                      <span class="category-count">{{ chars.length }} 字</span>
                    </div>
                    <div class="char-list">
                      <span v-for="char in chars" :key="char" class="char-tag">{{ char }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 详细子类别 -->
              <div class="lexicon-section">
                <h4>子類別 (v4.0.0-hybrid)</h4>
                <div class="category-list">
                  <div
                    v-for="(chars, subcategory) in SEMANTIC_LEXICON_V4.subcategories"
                    :key="subcategory"
                    class="category-item"
                  >
                    <div class="category-header">
                      <span class="category-name">{{ getSubcategoryName(subcategory) }}</span>
                      <span class="category-count">{{ chars.length }} 字</span>
                    </div>
                    <div class="char-list">
                      <span v-for="char in chars" :key="char" class="char-tag">{{ char }}</span>
                    </div>
                  </div>
                </div>
              </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { getSemanticIndices } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryDisplayName, getSubcategoryName } from '@/VillagesML/config/villagesML.js'
import { userStore } from '@/main/store/store.js'
import { SEMANTIC_LEXICON_V1, SEMANTIC_LEXICON_V4, CATEGORY_NAMES_ZH } from '@/VillagesML/config/semanticLexicon.js'

// State
const indices = ref(null)
const loadingIndices = ref(false)

// Indices query parameters
const indicesCategory = ref('')
const indicesRegionLevel = ref('')
const indicesRegionName = ref('')
const indicesMinVillages = ref(null)
const indicesLimit = ref(100)

// Detail mode toggle
const detailMode = ref(false)

// Lexicon modal
const showLexiconModal = ref(false)

// Options for SimpleSelectDropdown
const categoryOptions = [
  { label: '全部類別', value: '' },
  { label: '水系', value: 'water' },
  { label: '山地', value: 'mountain' },
  { label: '聚落', value: 'settlement' },
  { label: '方位', value: 'direction' },
  { label: '宗族', value: 'clan' },
  { label: '植物', value: 'vegetation' },
  { label: '農業', value: 'agriculture' },
  { label: '象徵', value: 'symbolic' },
  { label: '基建', value: 'infrastructure' }
]

const regionLevelOptions = [
  { label: '全部級別', value: '' },
  { label: '市級', value: 'city' },
  { label: '區縣級', value: 'county' },
  { label: '鄉鎮級', value: 'township' }
]

// Helper function to get category name based on detail mode
const getCategoryName = (category) => getCategoryDisplayName(category, detailMode.value)

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

// Watch region level changes and clear region name
watch(indicesRegionLevel, () => {
  indicesRegionName.value = ''
})

// Watch detailMode changes and auto-refresh table if it has data
watch(detailMode, () => {
  if (indices.value && indices.value.length > 0) {
    loadIndices()
  }
})

// Methods
const loadIndices = async () => {
  loadingIndices.value = true
  try {
    const params = {}
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

    indices.value = await getSemanticIndices({
      ...params,
      ...(detailMode.value && { detail: true })
    })
  } catch (error) {
    showError('加載語義指數失敗')
  } finally {
    loadingIndices.value = false
  }
}

const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-normal'
}

const getRegionLevelName = (level) => {
  const names = {
    'city': '市級',
    'county': '區縣',
    'township': '鄉鎮'
  }
  return names[level] || level
}
</script>

<style scoped>
.semantic-indices-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.indices-section {
  padding: 16px;
  margin-bottom: 16px;
}

.indices-section h2 {
  margin-bottom: 10px;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  justify-content: center;
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

.vml-number-input {
  width: 150px;
}

.vml-number-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(200, 200, 200, 0.3);
}

.indices-table {
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: visible;
  margin-top: 20px;
}

.indices-table .table-header,
.indices-table .table-row {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 1.2fr 1fr 1.2fr 0.8fr;
  gap: 12px;
  padding: 8px 16px;
  align-items: center;
  min-width: 700px;  /* 表格最小宽度，确保移动端可横向滚动 */
}

.indices-table .table-header:has(.col-villages),
.indices-table .table-row:has(.col-villages) {
  grid-template-columns: 1.5fr 0.8fr 1.2fr 1fr 1.2fr 0.8fr 0.8fr;
  min-width: 800px;  /* 有村莊數列時的最小宽度 */
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
  background: linear-gradient(135deg, var(--color-gold), #ffed4e);
  color: #8b6914;
}

.rank-silver {
  background: linear-gradient(135deg, var(--color-silver), #e8e8e8);
  color: #5a5a5a;
}

.rank-bronze {
  background: linear-gradient(135deg, var(--color-bronze), #e8a87c);
  color: #6b3e1a;
}

.rank-normal {
  background: rgba(74, 144, 226, 0.15);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .semantic-indices-page {
    padding: 8px;
  }

  .indices-section {
    padding: 12px;
  }


  .vml-number-input {
    width: 100%;
  }
}

/* Detail Mode Toggle */
.detail-toggle {
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.toggle-hint {
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Detail Toggle Layout */
.detail-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Lexicon Button */
.lexicon-button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lexicon-button:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

/* Lexicon Modal Styles */
.lexicon-body {
  padding: 0;
  overflow: visible;
}

.lexicon-section {
  margin-bottom: 32px;
}

.lexicon-section:last-child {
  margin-bottom: 0;
}

.lexicon-section h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.category-count {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
}

.char-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  padding: 6px 12px;
  background: rgba(74, 144, 226, 0.1);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.char-tag:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
}

</style>
