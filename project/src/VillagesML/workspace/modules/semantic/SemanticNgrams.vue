<template>
  <div class="semantic-ngrams-page">
    <h3 class="villagesml-subtab-title">
      語義分析 - N-gram分析
      <HelpIcon
        content="分析語義類別的Bigram（二元）和Trigram（三元）組合模式。PMI（互信息）衡量類別間關聯強度，PMI>2表示強關聯。支持詳細模式（76子類）和普通模式（9大類）"
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

    <!-- Bigrams and Trigrams -->
    <div class="ngrams-section">
      <div class="bigrams vml-glass-panel">
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
              class="vml-number-input"
            />
          </div>
          <button
            class="solid-button"
            :disabled="loadingBigrams"
            @click="loadBigrams"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingBigrams" class="vml-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
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

      <div class="trigrams vml-glass-panel">
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
              class="vml-number-input"
            />
          </div>
          <button
            class="solid-button"
            :disabled="loadingTrigrams"
            @click="loadTrigrams"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingTrigrams" class="vml-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
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
    <div class="pmi-section vml-glass-panel">
      <h2>點互信息 (PMI) 分析</h2>
      <p class="section-description">
        PMI 衡量兩個類別共現的關聯強度。PMI > 0 表示正相關（傾向共現），PMI &lt; 0 表示負相關（傾向不共現）。
      </p>
      <div class="controls">
        <div class="input-group">
          <label class="input-label">最小PMI值</label>
          <input
            v-model.number="minPMI"
            type="number"
            step="0.1"
            placeholder="例如：0"
            class="vml-number-input"
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
            class="vml-number-input"
          />
          <span class="input-hint">返回前N個最高PMI的組合</span>
        </div>
        <button
          class="solid-button"
          :disabled="loadingPMI"
          @click="loadPMI"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingPMI" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
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
                  :class="{ 'negative': (item.pmi_score || 0) < 0 }"
                  :style="{ width: `${getStrengthWidth(item.pmi_score)}%` }"
                ></div>
              </div>
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
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import {
  getSemanticBigrams,
  getSemanticTrigrams,
  getSemanticPMI
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryDisplayName, getSubcategoryName } from '@/VillagesML/config/villagesML.js'
import { SEMANTIC_LEXICON_V1, SEMANTIC_LEXICON_V4, CATEGORY_NAMES_ZH } from '@/VillagesML/config/semanticLexicon.js'

// State
const bigrams = ref([])
const trigrams = ref([])
const pmiData = ref([])

const loadingBigrams = ref(false)
const loadingTrigrams = ref(false)
const loadingPMI = ref(false)

const bigramMinCount = ref(5)
const trigramMinCount = ref(3)
const minPMI = ref(0)
const pmiTopN = ref(50)

// Detail mode toggle
const detailMode = ref(false)

// Lexicon modal
const showLexiconModal = ref(false)

// Computed: 计算 PMI 数据的最大绝对值
const maxAbsPMI = computed(() => {
  if (pmiData.value.length === 0) return 1
  return Math.max(...pmiData.value.map(item => Math.abs(item.pmi_score || 0)))
})

// Helper function to get category name based on detail mode
const getCategoryName = (category) => getCategoryDisplayName(category, detailMode.value)

// Calculate strength bar width percentage
const getStrengthWidth = (pmiScore) => {
  const absPMI = Math.abs(pmiScore || 0)
  return (absPMI / maxAbsPMI.value) * 100
}

// Methods
const loadBigrams = async () => {
  loadingBigrams.value = true
  try {
    bigrams.value = await getSemanticBigrams({
      min_frequency: bigramMinCount.value,
      limit: 50,
      ...(detailMode.value && { detail: true })
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
      limit: 50,
      ...(detailMode.value && { detail: true })
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
      limit: pmiTopN.value,
      ...(detailMode.value && { detail: true })
    })
  } catch (error) {
    showError('加載PMI數據失敗')
  } finally {
    loadingPMI.value = false
  }
}

const getPMIClass = (pmi_score) => {
  if (pmi_score >= 5) return 'pmi-very-strong'
  if (pmi_score >= 3) return 'pmi-strong'
  if (pmi_score >= 1) return 'pmi-moderate'
  return 'pmi-weak'
}

// Watch detailMode changes and auto-refresh tables with data
watch(detailMode, () => {
  // 如果 bigrams 表格有数据，自动刷新
  if (bigrams.value.length > 0) {
    loadBigrams()
  }

  // 如果 trigrams 表格有数据，自动刷新
  if (trigrams.value.length > 0) {
    loadTrigrams()
  }

  // 如果 PMI 表格有数据，自动刷新
  if (pmiData.value.length > 0) {
    loadPMI()
  }
})
</script>

<style scoped>
.semantic-ngrams-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.ngrams-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.bigrams,
.trigrams {
  padding: 16px;
  min-width: 0;
  overflow: hidden;
}

.bigrams h3,
.trigrams h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--text-primary);
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
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
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
  background: var(--glass-30);
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
  background: rgba(var(--vml-blue-rgb), 0.15);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pmi-section {
  padding: 16px;
  margin-bottom: 16px;
}

.pmi-section h2 {
  margin-bottom: 10px;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.pmi-results {
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: visible;
}

.pmi-header,
.pmi-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 2fr;
  gap: 16px;
  padding: 8px 16px;
  align-items: center;
  min-width: 500px;  /* 表格最小宽度，确保移动端可横向滚动 */
}

.pmi-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.pmi-row {
  background: var(--glass-30);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.pmi-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.pmi-row.pmi-very-strong {
  background: rgba(var(--color-success-rgb), 0.15);
}

.pmi-row.pmi-strong {
  background: rgba(var(--color-success-rgb), 0.1);
}

.pmi-row.pmi-moderate {
  background: rgba(var(--color-warning-rgb), 0.1);
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
  background: var(--glass-50);
  border-radius: 10px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.strength-fill.negative {
  background: linear-gradient(90deg, var(--color-error), var(--color-error-dark));
}

@media (max-width: 600px) {
  .ngrams-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .semantic-ngrams-page {
    padding: 8px;
  }

  .pmi-section {
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  padding: 16px;
  background: var(--glass-50);
  border-radius: 12px;
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
  border-radius: 12px;
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
