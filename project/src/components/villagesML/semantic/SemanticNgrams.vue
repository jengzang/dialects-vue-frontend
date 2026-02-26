<template>
  <div class="semantic-ngrams-page">
    <h3 class="villagesml-subtab-title">語義分析 - N-gram分析</h3>

    <!-- Detail Mode Toggle -->
    <div class="detail-toggle glass-panel">
      <div class="toggle-left">
        <label class="toggle-container">
          <input type="checkbox" v-model="detailMode" class="toggle-checkbox" />
          <span class="toggle-label">詳細模式</span>
        </label>
        <span class="toggle-hint">（語義分類更細緻）</span>
      </div>
      <button class="lexicon-button" @click="showLexiconModal = true">
        📖 查看詞典
      </button>
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
            class="solid-button"
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
            class="solid-button"
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
          class="solid-button"
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

    <!-- Lexicon Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showLexiconModal" class="lexicon-overlay" @click.self="showLexiconModal = false">
          <div class="lexicon-modal">
            <div class="lexicon-header">
              <h3>📖 語義詞典</h3>
              <button class="close-button" @click="showLexiconModal = false">×</button>
            </div>
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
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  getSemanticBigrams,
  getSemanticTrigrams,
  getSemanticPMI
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryDisplayName, getSubcategoryName } from '@/config/villagesML.js'
import { SEMANTIC_LEXICON_V1, SEMANTIC_LEXICON_V4, CATEGORY_NAMES_ZH } from '@/config/semanticLexicon.js'

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

// Helper function to get category name based on detail mode
const getCategoryName = (category) => getCategoryDisplayName(category, detailMode.value)

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

.pmi-section {
  padding: 16px;
  margin-bottom: 16px;
}

.pmi-section h2 {
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

@media (max-width: 1024px) {
  .ngrams-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .pmi-header,
  .pmi-row {
    grid-template-columns: 1fr;
    gap: 8px;
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

.toggle-checkbox {
  position: relative;
  width: 48px;
  height: 24px;
  appearance: none;
  background: rgba(200, 200, 200, 0.3);
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  transition: background 0.3s ease;
}

.toggle-checkbox:checked {
  background: var(--color-primary);
}

.toggle-checkbox::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  background: white;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-checkbox:checked::before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.toggle-hint {
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
.lexicon-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.lexicon-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lexicon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.lexicon-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.lexicon-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
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

/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .lexicon-modal,
.modal-fade-leave-active .lexicon-modal {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .lexicon-modal,
.modal-fade-leave-to .lexicon-modal {
  transform: scale(0.9);
}
</style>
