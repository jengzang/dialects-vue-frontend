<template>
  <div class="semantic-composition-page">
    <h3 class="villagesml-subtab-title">
      語義分析 - 組合模式
      <HelpIcon
        content="分析村名語義類別的組合規律。使用PMI（互信息）量化類別間關聯強度，PMI>2表示強關聯。"
        size="md"
        fontSize="16px"
        trigger="both"
      />
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

    <!-- Composition Patterns -->
    <div class="patterns-section vml-glass-panel">
<!--      <h2>組合模式</h2>-->
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
            class="vml-number-input"
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
            class="vml-number-input"
          />
          <span class="input-hint">返回前N個最常見的模式（最多1000）</span>
        </div>
        <button
          class="solid-button"
          :disabled="loadingPatterns"
          @click="loadPatterns"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingPatterns" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
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

    <!-- Lexicon Modal -->
    <AppModal
      :model-value="showLexiconModal"
      size="lg"
      title="📖 語義詞典"
      @update:modelValue="showLexiconModal = false"
    >
      <div class="lexicon-body">
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
import { ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { getSemanticCompositionPatterns } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getPatternTypeName, getCategoryDisplayName, getSubcategoryName } from '@/VillagesML/config/villagesML.js'
import { SEMANTIC_LEXICON_V1, SEMANTIC_LEXICON_V4, CATEGORY_NAMES_ZH } from '@/VillagesML/config/semanticLexicon.js'

// State
const patterns = ref([])
const loadingPatterns = ref(false)
const minCount = ref(5)
const topN = ref(50)
const detailMode = ref(false)
const showLexiconModal = ref(false)

// Methods
const loadPatterns = async () => {
  loadingPatterns.value = true
  try {
    patterns.value = await getSemanticCompositionPatterns({
      min_frequency: minCount.value,
      limit: topN.value,
      ...(detailMode.value && { detail: true })
    })
  } catch (error) {
    showError('加載組合模式失敗')
  } finally {
    loadingPatterns.value = false
  }
}

const translatePattern = (patternStr) => {
  if (!patternStr) return ''
  return patternStr
    .split('+')
    .map(cat => getCategoryDisplayName(cat.trim(), detailMode.value))
    .join('+')
}

watch(detailMode, () => {
  if (patterns.value.length > 0) loadPatterns()
})
</script>

<style scoped lang="scss">
.semantic-composition-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.patterns-section {
  padding: 16px;
  margin-bottom: 16px;
  @include flex-col;
  align-items: center;
}

.patterns-section h2 {
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
  flex-wrap: wrap;
}

.input-group {
  @include flex-col;
  gap: 4px;
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

.patterns-table {
  border-radius: var(--radius-md);
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2.5fr 2.5fr 1fr 1fr 2fr;
  gap: 10px;
  padding: 12px 16px;
  align-items: center;
  min-width: 500px;  /* 表格最小宽度，确保移动端可横向滚动 */
}

.table-header > div,
.table-row > div {
  min-width: 0;  /* 允许 grid 子元素缩小 */
}

.table-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.col-components {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;  /* 允许 flex 容器缩小 */
}

.component-tag {
  padding: 3px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.component-tag.modifier {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning-dark);
}

.component-tag.head {
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .semantic-composition-page {
    padding: 8px;
  }

  .patterns-section {
    padding: 12px;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
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
  justify-content: space-between;
  align-items: center;
}

.toggle-left {
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

.toggle-hint {
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.lexicon-button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-sm2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lexicon-button:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--vml-blue-rgb), 0.3);
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
  @include flex-col;
  gap: 16px;
}

.category-item {
  padding: 16px;
  background: var(--glass-50);
  border-radius: var(--radius-md);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.1);
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
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-md);
}

.char-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  padding: 6px 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.char-tag:hover {
  background: var(--color-primary);
  color: var(--action-primary-text);
  transform: translateY(-2px);
}

</style>
