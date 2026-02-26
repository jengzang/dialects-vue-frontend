<template>
  <div class="semantic-indices-page">
    <h3 class="villagesml-subtab-title">語義分析 - 語義指數</h3>

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
import { ref, watch, computed } from 'vue'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import { getSemanticIndices } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryDisplayName, getSubcategoryName } from '@/config/villagesML.js'
import { userStore } from '@/utils/store.js'
import { SEMANTIC_LEXICON_V1, SEMANTIC_LEXICON_V4, CATEGORY_NAMES_ZH } from '@/config/semanticLexicon.js'

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

.select-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 150px;
}

.select-input:focus {
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

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .indices-table .table-header,
  .indices-table .table-row {
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
