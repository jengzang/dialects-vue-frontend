<template>
  <div class="yubao-page">
    <!-- 顶部控制栏 -->
    <div class="top-controls">
      <!-- Tab 切换 + 查看全部按钮 -->
      <div class="header-container">
        <div class="tab-container">
          <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 查看全部按钮 -->
        <button class="view-all-btn" @click="showAllModal = true" :title="t('words.yuBaoPage.viewAll')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        </button>
      </div>

      <!-- 搜索框 + 视图模式选择器 -->
      <div class="search-container">
        <div class="search-section" v-if="!isLoading">
          <div class="input-wrapper">
            <!-- 词汇搜索框 -->
            <textarea
                v-if="activeTab === 'vocabulary'"
                ref="vocabularyInputEl"
                v-model="vocabularyInput"
                @input="onVocabularyInput"
                @focus="onVocabularyFocus"
                @blur="onBlur"
                :placeholder="t('words.yuBaoPage.search.vocabularyPlaceholder')"
                class="search-input"
                rows="1"
            ></textarea>

            <!-- 语法搜索框 -->
            <textarea
                v-else
                ref="grammarInputEl"
                v-model="grammarInput"
                @input="onGrammarInput"
                @focus="onGrammarFocus"
                @blur="onBlur"
                :placeholder="t('words.yuBaoPage.search.grammarPlaceholder')"
                class="search-input"
                rows="1"
            ></textarea>

            <!-- 下拉建议 -->
            <Teleport to="body">
              <div
                  v-if="activeTab === 'vocabulary' && vocabularySuggestions.length"
                  class="inline-suggestion"
                  :style="vocabularySuggestionStyle"
              >
                <div
                    v-for="(item, idx) in vocabularySuggestions"
                    :key="idx"
                    class="suggest-line"
                    @mousedown.prevent="applyVocabularySuggestion(item)"
                >
                  {{ item }}
                </div>
              </div>

              <div
                  v-if="activeTab === 'grammar' && grammarSuggestions.length"
                  class="inline-suggestion"
                  :style="grammarSuggestionStyle"
              >
                <div
                    v-for="(item, idx) in grammarSuggestions"
                    :key="idx"
                    class="suggest-line"
                    @mousedown.prevent="applyGrammarSuggestion(item)"
                >
                  {{ item }}
                </div>
              </div>
            </Teleport>
          </div>
        </div>

        <!-- 视图模式选择器 -->
        <div class="view-mode-selector">
          <button
              class="mode-btn"
              :class="{ active: viewMode === 'table' }"
              @click="viewMode = 'table'"
              :title="t('words.yuBaoPage.viewModes.table')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="9" x2="9" y2="21"/>
              <line x1="15" y1="9" x2="15" y2="21"/>
            </svg>
          </button>

          <button
              class="mode-btn"
              :class="{ active: viewMode === 'card' }"
              @click="viewMode = 'card'"
              :title="t('words.yuBaoPage.viewModes.card')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>

          <button
              class="mode-btn"
              :class="{ active: viewMode === 'map' }"
              @click="viewMode = 'map'"
              :title="t('words.yuBaoPage.viewModes.map')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <!-- 加载状态 -->
    <div v-if="isLoading" class="content-area">
      <div class="loading-state loading-state-base">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
      </div>
    </div>

    <!-- 表格模式 - 只有输入有效时才显示 -->
    <UniversalTable
        v-else-if="viewMode === 'table' && isValidInput"
        :db-key="'yubao'"
        :table-name="activeTab === 'vocabulary' ? 'vocabulary' : 'grammar'"
        :columns="currentColumns"
        :default-filter="currentDefaultFilter"
        :key="`${activeTab}-${currentInputValue}`"
    />

    <!-- 表格模式 - 输入无效时的提示 -->
    <div v-else-if="viewMode === 'table'" class="content-area">
      <div class="empty-state empty-state-base">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p v-if="!currentInputValue">{{ t('words.yuBaoPage.states.enterSearch') }}</p>
        <p v-else>{{ t('words.yuBaoPage.states.chooseSuggestion') }}</p>
        <small v-if="!currentInputValue">
          {{ t('words.yuBaoPage.states.queryHint', { type: currentSearchTypeLabel }) }}
        </small>
        <small v-else>{{ t('words.yuBaoPage.states.clickSuggestion') }}</small>
      </div>
    </div>

    <!-- 卡片/地图模式 -->
    <div v-else-if="viewMode === 'card'" class="content-area">
      <!-- 卡片模式 -->
      <div class="card-mode">

        <div v-if="isLoadingCards" class="cards-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.yuBaoPage.states.loadingCards') }}</span>
        </div>

        <template v-else-if="cardData.length > 0">

          <div class="local-filter-bar">
            <div class="filter-input-wrapper">
              <svg class="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                  v-model="localFilterQuery"
                  type="text"
                  :placeholder="t('words.yuBaoPage.search.localFilterPlaceholder')"
                  class="local-filter-input"
              />
              <button v-if="localFilterQuery" @click="localFilterQuery = ''" class="clear-filter-btn">×</button>
            </div>
            <span class="filter-count" v-if="localFilterQuery">
        {{ t('words.yuBaoPage.filter.showingCount', { visible: filteredCardData.length, total: cardData.length }) }}
      </span>
          </div>
          <div class="cards-grid">
            <div
                v-for="(item, idx) in visibleCards"
                :key="activeTab + idx"
                class="card"
                :class="activeTab === 'vocabulary' ? 'vocabulary-card' : 'grammar-card'"
            >
              <template v-if="activeTab === 'vocabulary'">
                <div class="card-row row-1">
        <span class="location-chain">
          {{ [item.province, item.city, item.county, item.village, item.location].filter(Boolean).join('-') || '-' }}
        </span>
                  <span v-if="item.lang_cat1 || item.lang_cat2 || item.lang_cat3" class="category-chain">
          {{ [item.lang_cat1, item.lang_cat2, item.lang_cat3].filter(Boolean).join('-') }}
        </span>
                </div>
                <div class="card-row row-2">
                  <span class="word-text">{{ item.pronunciation || '-' }}</span>
                  <span class="pronunciation-text">
          {{ item.note2 || item.word || '-' }} {{ item.note1 ? `（${item.note1}）` : '' }}
        </span>
                </div>
              </template>

              <template v-else>
                <div class="card-row row-1">
        <span class="forms-chain">
          {{ [item.form_a, item.form_b, item.form_c, item.form_d, item.form_e].filter(Boolean).join('-') || '-' }}
        </span>
                  <span v-if="item.lang_cat1 || item.lang_cat2 || item.lang_cat3" class="category-chain">
          {{ [item.lang_cat1, item.lang_cat2, item.lang_cat3].filter(Boolean).join('-') }}
        </span>
                </div>
                <div class="card-row row-2">
                  <span class="phonetic-text">{{ item.phonetic || '-' }}</span>
                </div>
                <div class="card-row row-3">
                  <span class="memo-text">{{ item.memo || '-' }}</span>
                </div>
              </template>
            </div>
          </div>
          <div ref="loadMoreTrigger" class="load-more-trigger">
            <div v-if="hasMore" class="loading-status">
              <div class="ui-loading--inline" aria-hidden="true">↻</div>
              <span>{{ t('words.yuBaoPage.states.loadingMore') }}</span>
            </div>
            <span v-else-if="filteredCardData.length > 0" class="no-more">{{ t('words.yuBaoPage.states.loadedAll') }}</span>
          </div>

          <div v-if="filteredCardData.length === 0" class="empty-state empty-state-base">
            <p>{{ t('words.yuBaoPage.states.noFilterResult', { query: localFilterQuery }) }}</p>
          </div>

        </template>

        <div v-else class="empty-state empty-state-base">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p v-if="!currentInputValue">{{ t('words.yuBaoPage.states.enterSearch') }}</p>
          <p v-else-if="!isValidInput">{{ t('words.yuBaoPage.states.chooseSuggestion') }}</p>
          <p v-else>{{ t('words.yuBaoPage.states.noData') }}</p>
          <small v-if="!currentInputValue">
            {{ t('words.yuBaoPage.states.queryHint', { type: currentSearchTypeLabel }) }}
          </small>
          <small v-else>{{ t('words.yuBaoPage.states.clickSuggestion') }}</small>
        </div>
      </div>

    </div>

    <!-- 地图模式 -->
    <div v-else-if="viewMode === 'map'" class="map-mode">
      <div v-if="isLoadingCards" class="cards-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
      </div>
      <template v-else>
        <div v-if="!isValidInput || cardData.length === 0" class="empty-state empty-state-base">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p v-if="!currentInputValue">{{ t('words.yuBaoPage.states.enterSearch') }}</p>
          <p v-else-if="!isValidInput">{{ t('words.yuBaoPage.states.chooseSuggestion') }}</p>
          <p v-else>{{ t('words.yuBaoPage.states.noData') }}</p>
          <small v-if="!currentInputValue">
            {{ t('words.yuBaoPage.states.queryHint', { type: currentSearchTypeLabel }) }}
          </small>
          <small v-else>{{ t('words.yuBaoPage.states.clickSuggestion') }}</small>
        </div>
        <YuBaoMap
            v-else
            :map-data="cardData"
            :active-tab="activeTab"
        />
      </template>

    </div>

    <!-- 查看全部弹窗 -->
    <AppModal
      :model-value="showAllModal"
      size="sm"
      :title="t('words.yuBaoPage.modal.allItemsTitle', { name: activeTabLabel })"
      close-label="關閉"
      @update:modelValue="closeAllModal"
    >
      <div class="search-in-modal">
        <input
          v-model="modalSearchQuery"
          type="text"
          :placeholder="t('words.yuBaoPage.search.modalPlaceholder')"
          class="modal-search-input"
        />
      </div>
      <div class="items-list">
        <div
          v-for="(item, idx) in filteredAllItems"
          :key="idx"
          class="item-line"
          @click="selectFromModal(item)"
        >
          {{ item }}
        </div>
      </div>
      <div class="all-items-modal-footer">
        {{ t('words.yuBaoPage.modal.total', { count: filteredAllItems.length }) }}
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getYubaoVocabularyWords, getYubaoGrammarSentences, getYubaoVocabularyItems, getYubaoGrammarItems } from '@/api'
import * as OpenCC from 'opencc-js'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import { watchDebounced } from '@vueuse/core'
import YuBaoMap from '@/main/components/map/YuBaoMap.vue'
import AppModal from '@/components/common/AppModal.vue'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'
import { useStorageState } from '@/composables/core/useStorageState.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const converter = OpenCC.Converter({ from: 'tw', to: 'cn' })
const vocabularyCache = useStorageState('yubao_vocabulary_all', { defaultValue: null })
const grammarCache = useStorageState('yubao_grammar_all', { defaultValue: null })

// --- 基础状态 ---
const { state: activeTab, set: setActiveTab } = useRouteQueryState('tab', {
  defaultValue: 'vocabulary',
  parse: (value) => ['vocabulary', 'grammar'].includes(value) ? value : 'vocabulary',
  serialize: (value) => value,
})
const vocabularyInput = ref('')
const grammarInput = ref('')
const vocabularyInputEl = ref(null)
const grammarInputEl = ref(null)
const vocabularySuggestions = ref([])
const grammarSuggestions = ref([])
const vocabularySuggestionStyle = ref({})
const grammarSuggestionStyle = ref({})
const allVocabulary = ref([])
const allGrammar = ref([])
const isLoading = ref(false)
const showAllModal = ref(false)
const modalSearchQuery = ref('')
// const viewMode = ref('card')
const viewMode = ref(activeTab.value === 'vocabulary' ? 'map' : 'card')
// 为每个 tab 维护独立的卡片数据
const vocabularyCardData = ref([])
const grammarCardData = ref([])
// 计算属性：根据当前 tab 返回对应的数据
const cardData = computed(() => {
  return activeTab.value === 'vocabulary' ? vocabularyCardData.value : grammarCardData.value
})
const isLoadingCards = ref(false)
const localFilterQuery = ref('')

// --- 无限滚动控制变量 (必须放在 initObserver 之前) ---
const displayCount = ref(50)
const step = 30
const loadMoreTrigger = ref(null)
let observer = null; // ✅ 修正：必须在这里显式声明 observer
const isInternalLoading = ref(false); // 内部锁

// --- 表格配置 ---
const vocabularyColumns = computed(() => [
  { key: 'province', label: t('words.yuBaoPage.columns.province'), filterable: true, width: 0.8 },
  { key: 'city', label: t('words.yuBaoPage.columns.city'), filterable: true, width: 0.8 },
  { key: 'county', label: t('words.yuBaoPage.columns.county'), filterable: true, width: 0.8 },
  { key: 'village', label: t('words.yuBaoPage.columns.town'), filterable: true, width: 0.8 },
  { key: 'location', label: t('words.yuBaoPage.columns.village'), filterable: false, width: 1.2 },
  { key: 'note2', label: t('words.yuBaoPage.columns.character'), filterable: true, width: 1.2 },
  { key: 'pronunciation', label: t('words.yuBaoPage.columns.pronunciation'), filterable: false, width: 1.5 },
  { key: 'note1', label: t('words.yuBaoPage.columns.note'), filterable: false, width: 1.5 },
  { key: 'lang_cat1', label: t('words.yuBaoPage.columns.region1'), filterable: true, width: 1 },
  { key: 'lang_cat2', label: t('words.yuBaoPage.columns.region2'), filterable: true, width: 1 },
  { key: 'lang_cat3', label: t('words.yuBaoPage.columns.region3'), filterable: true, width: 1 },
])
const grammarColumns = computed(() => [
  { key: 'form_a', label: t('words.yuBaoPage.columns.province'), filterable: true, width: 1 },
  { key: 'form_b', label: t('words.yuBaoPage.columns.city'), filterable: true, width: 1 },
  { key: 'form_c', label: t('words.yuBaoPage.columns.county'), filterable: true, width: 1 },
  { key: 'form_d', label: t('words.yuBaoPage.columns.town'), filterable: true, width: 1 },
  { key: 'form_e', label: t('words.yuBaoPage.columns.village'), filterable: false, width: 1 },
  { key: 'memo', label: t('words.yuBaoPage.columns.note'), filterable: false, width: 3 },
  { key: 'phonetic', label: t('words.yuBaoPage.columns.pronunciation'), filterable: false, width: 4 },
  { key: 'lang_cat1', label: t('words.yuBaoPage.columns.region1'), filterable: true, width: 1 },
  { key: 'lang_cat2', label: t('words.yuBaoPage.columns.region2'), filterable: true, width: 1 },
  { key: 'lang_cat3', label: t('words.yuBaoPage.columns.region3'), filterable: true, width: 1 },
])

// --- 计算属性 ---

// 计算属性：当前表格列配置
const currentColumns = computed(() => {
  return activeTab.value === 'vocabulary' ? vocabularyColumns.value : grammarColumns.value
})

const currentInputValue = computed(() => (
  activeTab.value === 'vocabulary'
    ? vocabularyInput.value.trim()
    : grammarInput.value.trim()
))

const currentSearchTypeLabel = computed(() => (
  activeTab.value === 'vocabulary'
    ? t('words.yuBaoPage.types.vocabulary')
    : t('words.yuBaoPage.types.grammar')
))

const activeTabLabel = computed(() => (
  activeTab.value === 'vocabulary'
    ? t('words.yuBaoVocabulary.name')
    : t('words.yuBaoGrammar.name')
))

// 检查输入是否有效（是否在数据列表中完全匹配）
const isValidInput = computed(() => {
  if (activeTab.value === 'vocabulary') {
    const input = vocabularyInput.value.trim()
    return input && allVocabulary.value.includes(input)
  } else {
    const input = grammarInput.value.trim()
    return input && allGrammar.value.includes(input)
  }
})

// 计算属性：当前默认过滤条件
const currentDefaultFilter = computed(() => {
  // 只有输入有效时才应用过滤
  if (!isValidInput.value) {
    return {}
  }

  if (activeTab.value === 'vocabulary') {
    const word = vocabularyInput.value.trim()
    return { 'word': [word] }  // 使用列表格式
  } else {
    const sentence = grammarInput.value.trim()
    return { 'sentence': [sentence] }  // 使用列表格式
  }
})

// Tab 配置
const tabs = computed(() => [
  { key: 'vocabulary', label: t('words.yuBaoVocabulary.name') },
  { key: 'grammar', label: t('words.yuBaoGrammar.name') }
])

// 計算屬性：根據關鍵詞過濾 cardData
const filteredCardData = computed(() => {
  if (!cardData.value.length) return []
  if (!localFilterQuery.value.trim()) return cardData.value

  // 修改 1：搜索詞轉簡體 + 轉小寫
  const query = converter(localFilterQuery.value).toLowerCase().trim()

  return cardData.value.filter(item => {
    return Object.values(item).some(val => {
      // 修改 2：數據內容轉簡體 + 轉小寫 + 包含判斷
      return converter(String(val || '')).toLowerCase().includes(query)
    })
  })
})

// 防抖定时器
let vocabularyDebounceTimer = null
let grammarDebounceTimer = null

// 计算属性：根据当前tab和搜索查询过滤的全部条目
const filteredAllItems = computed(() => {
  const allItems = activeTab.value === 'vocabulary' ? allVocabulary.value : allGrammar.value
  if (!modalSearchQuery.value.trim()) {
    return allItems
  }
  return localMatch(modalSearchQuery.value, allItems)
})

// 切换 Tab
function switchTab(tabKey) {
  setActiveTab(tabKey)
}

// 加载所有词汇数据
async function loadAllVocabulary() {
  try {
    // 先走本地缓存，弹窗联想只需要全集数据，不必每次打开都重新打接口。
    const cached = vocabularyCache.read()
    if (cached && cached.items && Array.isArray(cached.items)) {
      allVocabulary.value = cached.items.filter(item => item && typeof item === 'string' && item.trim())
      console.log('Loaded vocabulary cache:', allVocabulary.value.length)
      return
    }

    const response = await getYubaoVocabularyWords({ all: true })

    if (response && response.items && Array.isArray(response.items)) {
      allVocabulary.value = response.items.filter(item => item && typeof item === 'string' && item.trim())
      // 只缓存后端原始返回，后面仍然沿用现有过滤逻辑生成可用列表。
      vocabularyCache.write(response)
      console.log('Loaded vocabulary API data:', allVocabulary.value.length)
    } else {
      console.error('Vocabulary data format error:', response)
    }
  } catch (error) {
    console.error('Failed to load vocabulary data:', error)
  }
}

async function loadAllGrammar() {
  try {
    // 语法数据和词汇数据保持同一套缓存策略，避免两个 tab 行为不一致。
    const cached = grammarCache.read()
    if (cached && cached.items && Array.isArray(cached.items)) {
      allGrammar.value = cached.items.filter(item => item && typeof item === 'string' && item.trim())
      console.log('Loaded grammar cache:', allGrammar.value.length)
      return
    }

    const response = await getYubaoGrammarSentences({ all: true })

    if (response && response.items && Array.isArray(response.items)) {
      allGrammar.value = response.items.filter(item => item && typeof item === 'string' && item.trim())
      grammarCache.write(response)
      console.log('Loaded grammar API data:', allGrammar.value.length)
    } else {
      console.error('Grammar data format error:', response)
    }
  } catch (error) {
    console.error('Failed to load grammar data:', error)
  }
}

function localMatch(query, dataArray) {
  if (!query) return []

  // 用简体归一化做匹配，保留现有“繁简都能搜到”的行为。
  const simplifiedQuery = converter(query).toLowerCase()

  // 这里只做本地 includes，不引入额外排序，保证联想结果仍然稳定可预期。
  const matches = dataArray.filter(item => {
    const simplifiedItem = converter(item).toLowerCase()
    return simplifiedItem.includes(simplifiedQuery)
  })

  // 限制返回数量（最多50条）
  return matches.slice(0, 50)
}

// 词汇输入处理
function onVocabularyInput() {
  clearTimeout(vocabularyDebounceTimer)
  vocabularyDebounceTimer = setTimeout(() => {
    const query = vocabularyInput.value.trim()
    // console.log('🔍 词汇输入:', query)

    if (!query) {
      vocabularySuggestions.value = []
      return
    }

    // 本地匹配
    vocabularySuggestions.value = localMatch(query, allVocabulary.value)
    // console.log('📋 匹配结果数量:', vocabularySuggestions.value.length)
    // console.log('📋 前5条结果:', vocabularySuggestions.value.slice(0, 5))

    // 更新下拉框位置
    updateVocabularySuggestionPosition()
  }, 150)  // 减少到150ms，因为是本地匹配，更快
}

// 词汇聚焦处理
function onVocabularyFocus() {
  if (vocabularyInput.value.trim()) {
    onVocabularyInput()
  }
}

// 语法输入处理
function onGrammarInput() {
  clearTimeout(grammarDebounceTimer)
  grammarDebounceTimer = setTimeout(() => {
    const query = grammarInput.value.trim()
    if (!query) {
      grammarSuggestions.value = []
      return
    }

    // 本地匹配
    grammarSuggestions.value = localMatch(query, allGrammar.value)

    // 更新下拉框位置
    updateGrammarSuggestionPosition()
  }, 150)
}

// 语法聚焦处理
function onGrammarFocus() {
  if (grammarInput.value.trim()) {
    onGrammarInput()
  }
}

// 失焦时关闭建议
function onBlur() {
  setTimeout(() => {
    vocabularySuggestions.value = []
    grammarSuggestions.value = []
  }, 200)
}

// 更新词汇下拉框位置
function updateVocabularySuggestionPosition() {
  nextTick(() => {
    if (vocabularyInputEl.value) {
      const rect = vocabularyInputEl.value.getBoundingClientRect()
      vocabularySuggestionStyle.value = {
        position: 'absolute',
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.top + rect.height + 6 + window.scrollY}px`,
        zIndex: 99999,
        minWidth: `${vocabularyInputEl.value.offsetWidth}px`
      }
    }
  })
}

// 更新语法下拉框位置
function updateGrammarSuggestionPosition() {
  nextTick(() => {
    if (grammarInputEl.value) {
      const rect = grammarInputEl.value.getBoundingClientRect()
      grammarSuggestionStyle.value = {
        position: 'absolute',
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.top + rect.height + 6 + window.scrollY}px`,
        zIndex: 99999,
        minWidth: `${grammarInputEl.value.offsetWidth}px`
      }
    }
  })
}

// 应用词汇建议
function applyVocabularySuggestion(item) {
  vocabularyInput.value = item
  vocabularySuggestions.value = []
  nextTick(() => {
    if (vocabularyInputEl.value) {
      vocabularyInputEl.value.focus()
    }
  })
}

// 应用语法建议
function applyGrammarSuggestion(item) {
  grammarInput.value = item
  grammarSuggestions.value = []
  nextTick(() => {
    if (grammarInputEl.value) {
      grammarInputEl.value.focus()
    }
  })
}

// 从弹窗中选择条目
function selectFromModal(item) {
  if (activeTab.value === 'vocabulary') {
    vocabularyInput.value = item
  } else {
    grammarInput.value = item
  }
  showAllModal.value = false
  modalSearchQuery.value = ''
}

function closeAllModal() {
  showAllModal.value = false
}
// 加载卡片数据（一次性加载所有数据）
async function loadCardsPage() {
  // 只有当输入有效（在数据列表中完全匹配）时才请求API
  if (!isValidInput.value) {
    // 清空当前 tab 的数据，不影响另一个 tab
    if (activeTab.value === 'vocabulary') {
      vocabularyCardData.value = []
    } else {
      grammarCardData.value = []
    }
    isLoadingCards.value = false
    return
  }

  isLoadingCards.value = true

  try {
    const searchValue = activeTab.value === 'vocabulary'
      ? vocabularyInput.value.trim()
      : grammarInput.value.trim()

    const response = activeTab.value === 'vocabulary'
      ? await getYubaoVocabularyItems({
        word: searchValue,
        page: 1,
        page_size: 2000
      })
      : await getYubaoGrammarItems({
        sentence: searchValue,
        page: 1,
        page_size: 2000
      })

    // console.log('📦 卡片数据响应:', response)

    if (response && response.items) {
      // console.log(response.items)
      // 更新对应 tab 的数据
      if (activeTab.value === 'vocabulary') {
        vocabularyCardData.value = response.items

      } else {
        grammarCardData.value = response.items
      }
      console.log('✅ 加载了', response.items.length, '条卡片数据')
    } else {
      if (activeTab.value === 'vocabulary') {
        vocabularyCardData.value = []
      } else {
        grammarCardData.value = []
      }
      console.warn('⚠️ 响应格式不正确:', response)
    }
  } catch (error) {
    console.error('加载卡片数据失败:', error)
    if (activeTab.value === 'vocabulary') {
      vocabularyCardData.value = []
    } else {
      grammarCardData.value = []
    }
  } finally {
    isLoadingCards.value = false
  }
}


// 監聽具體的輸入內容變化，而不僅僅是有效性狀態
// 将原有的 watch 改为带防抖的 watch
// 修复：无论当前在哪个视图模式，只要输入有效就加载数据（地图和卡片都需要这份数据）
watchDebounced(
    [vocabularyInput, grammarInput],
    () => {
      if (isValidInput.value) {
        loadCardsPage()  // 移除 viewMode 检查，始终加载数据
      }
    },
    { debounce: 300 } // 只有输入停顿 300ms 且匹配成功才发 SQL 请求
)
// watch([vocabularyInput, grammarInput], () => {
//   // 每次輸入變化時，檢查當前是否有效
//   if (isValidInput.value) {
//     // 如果是有效輸入，且在卡片模式，立即加載
//     if (viewMode.value === 'card') {
//       // 建議這裡加一個簡單的防抖，或者直接調用（因爲 isValidInput 已經是很嚴格的過濾了）
//       loadCardsPage()
//     }
//   } else {
//     // 如果輸入變成了無效內容（比如刪除了一半），清空卡片
//     cardData.value = []
//   }
// })


onMounted(async () => {
  // 如果 URL 中没有 sub 参数，默认跳转到 vocabulary
  if (!route.query.tab) {
    await router.replace({
      path: '/explore/yubao',
      query: { ...route.query, tab: 'vocabulary' }
    })
  }

  // 加载所有数据（用于下拉建议）
  isLoading.value = true
  await Promise.all([
    loadAllVocabulary(),
    loadAllGrammar()
  ])
  isLoading.value = false

  // 如果默认是卡片模式，加载卡片数据
  if (viewMode.value === 'card') {
    await loadCardsPage(1)
  }
})

// 2. 计算属性：真正渲染的数据
const visibleCards = computed(() => {
  return filteredCardData.value.slice(0, displayCount.value);
});

// 3. 计算属性：是否还有更多没显示
const hasMore = computed(() => {
  return displayCount.value < filteredCardData.value.length;
});

// 4. 定义加载更多的方法
const loadMore = () => {
  if (hasMore.value && !isInternalLoading.value) {
    isInternalLoading.value = true;

    // 增加一个微小的延迟，等待 Vue 完成上一次的 DOM 渲染
    setTimeout(() => {
      displayCount.value += step;
      // console.log('✅ 懒加载生效，当前条数:', displayCount.value);
      isInternalLoading.value = false;
    }, 100); // 100ms 的渲染缓冲
  }
};

const initObserver = () => {
  if (observer) observer.disconnect(); // 清理旧监听

  observer = new IntersectionObserver((entries) => {
    // console.log('👀 探测器状态:', entries[0].isIntersecting ? '可见' : '不可见');
    if (entries[0].isIntersecting && hasMore.value && !isLoadingCards.value) {
      loadMore();
    }
  }, {
    rootMargin: '200px', // 提前触发，体验更好
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
    // console.log('✅ 探测器已成功挂载');
  } else {
    console.warn('❌ 挂载失败：DOM 节点尚未渲染');
  }
};
// 5. 设置监听器
// 监听数据变化
watch(cardData, async (newVal) => {
  if (newVal.length > 0) {
    // 关键：等待 Vue 完成 DOM 更新（让红条真正出现在页面上）
    await nextTick();
    initObserver();
  }
}, { immediate: true });

// 监听视图切换（防止从表格切回卡片时监听失效）
watch(viewMode, async (newMode) => {
  if (newMode === 'card' && cardData.value.length > 0) {
    await nextTick();
    initObserver();
  } else if (newMode === 'map') {
    // 切换到地图模式时，确保数据已加载
    if (isValidInput.value && cardData.value.length === 0) {
      await loadCardsPage()
    }
  }
});


</script>

<style scoped>
.yubao-page {
  width: 90dvw;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;
}

/* 顶部控制栏 */
.top-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: stretch;
}

/* 头部容器（Tab + 查看全部按钮） */
.header-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* 搜索容器（搜索框 + 视图模式） */
.search-container {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;  /* 允许flex收缩 */
}

/* Tab 容器 - 改进的苹果液态玻璃风格 */
.tab-container {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 12px;
  border: 0.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06),
              0 2px 6px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6e6e73;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.tab-btn:hover:not(.active) {
  background: rgba(0, 0, 0, 0.04);
  color: #1d1d1f;
}

.tab-btn.active {
  background: #ffffff;
  color: #0071e3;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.06);
  font-weight: 600;
}

/* 查看全部按钮 */
.view-all-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 12px;
  border: 0.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06),
              0 2px 6px rgba(0, 0, 0, 0.04);
  color: #0071e3;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.view-all-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.08),
              0 3px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.view-all-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 搜索区域 */
.search-section {
  flex: 1;
  min-width: 0;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  padding: 5px 7px;
  font-size: 14px;
  line-height: 1.5;
  color: #1d1d1f;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  outline: none;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  transition: all 0.2s;
  overflow: hidden;
}

.search-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
  background: #ffffff;
}

.search-input::placeholder {
  color: #6e6e73;
}

/* 视图模式选择器 */
.view-mode-selector {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 12px;
  border: 0.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06),
              0 2px 6px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.mode-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #6e6e73;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-btn:hover:not(.active) {
  background: rgba(0, 0, 0, 0.04);
  color: #1d1d1f;
}

.mode-btn.active {
  background: #ffffff;
  color: #0071e3;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.06);
}

/* 响应式 - 竖屏时分两行 */
@media (max-width: 650px) {
  .top-controls {
    flex-direction: column;
    gap:4px;
  }

  .search-container {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .yubao-page {
    padding: 4px;
  }
  .top-controls {
    margin-bottom: 8px;
  }

  .header-container {
    width: 100%;
    justify-content: center;
  }

  .tab-container {
    justify-content: center;
  }
}

.search-in-modal {
  margin-bottom: 16px;
}

.modal-search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.8);
}

.modal-search-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
  background: #ffffff;
}

.items-list {
  flex: 1;
  overflow-y: auto;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  padding: 8px;
}

.item-line {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.item-line:hover {
  background: rgba(0, 113, 227, 0.08);
  color: #0071e3;
}

.all-items-modal-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  font-size: 13px;
  color: #6e6e73;
}

/* 加载状态 */
.loading-state {
  padding: 60px 20px;
  gap: 16px;
}

/* 内容区 */
.content-area {
  background: var(--glass-medium);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid var(--border-gray-light);
  box-shadow: var(--shadow-md);
  padding: 25px;
  min-height: 300px;
  max-height: 69dvh;
  overflow: auto;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 搜索区域 */
.search-section {
  width: 100%;
  justify-items: center;
}

.input-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  min-height: 48px;
  max-height: 200px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-dark);
  background: var(--bg-white);
  border: 1.5px solid var(--border-gray);
  border-radius: 12px;
  outline: none;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

.search-input::placeholder {
  color: dimgrey;
}

/* 下拉建议 - 复用 LocationAndRegionInput 的样式 */
.inline-suggestion {
  position: absolute !important;
  background: var(--glass-medium2) !important;
  border: 1px solid var(--border-gray-light) !important;
  box-shadow: var(--shadow-lg2);
  padding: 8px 12px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  white-space: pre-line;
  font-size: 14px;
  color: var(--text-dark);
  max-width: 400px;
  width: fit-content;
  z-index: 99999 !important;
  pointer-events: auto !important;
  max-height: 40vh;
  overflow-y: auto;
  transition: background-color 0.2s ease;
}

.suggest-line {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  margin: 2px 0;
}

.suggest-line:hover {
  background-color: var(--bg-blue-hover);
}

/* 响应式 */
@media (max-width: 768px) {
  .yubao-page {
    padding: 4px;
  }

  .content-area {
    padding: 20px;
  }

  .tab-btn {
    padding: 8px 12px;
    font-size: 14px;
  }

  .inline-suggestion {
    max-width: 90vw;
  }
}

/* ===== 卡片模式样式 ===== */
.card-mode {
  min-height: 400px;
}

.cards-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: #6e6e73;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  padding: 4px;
  min-height: 100px; /* 给个保底高度 */
}

/* 卡片基础样式 - Apple 液态玻璃风格 */
.card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: 16px;
  border: 0.5px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06),
              0 2px 8px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 1);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.08),
              0 4px 12px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 1);
  border-color: rgba(0, 113, 227, 0.2);
}

/* 卡片行 */
.card-row {
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.5;
}

/* 第1行样式 */
.row-1 {
  font-size: 12px;
  color: #6e6e73;
  flex-wrap: wrap;
}

.location-chain,
.forms-chain {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  color: #1d1d1f;
}

.category-chain {
  font-size: 11px;
  color: #af52de;
  font-weight: 600;
  white-space: nowrap;
}

/* 第2行样式 - 词汇卡片 */
.vocabulary-card .row-2 {
  font-size: 16px;
  font-weight: 600;
  flex-wrap: wrap;
}

.word-text {
  color: #1d1d1f;
  font-size: 20px;
  letter-spacing: -0.01em;
}

.pronunciation-text {
  color: #0071e3;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

/* 第2行样式 - 语法卡片 */
.grammar-card .row-2 {
  padding: 10px 12px;
  background: rgba(0, 113, 227, 0.06);
  border-radius: 10px;
  margin: 0 -4px;
}

.phonetic-text {
  color: #0071e3;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
  line-height: 1.6;
  word-break: break-all;
}

/* 第3行样式 - 语法卡片 */
.grammar-card .row-3 {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
  margin: 0 -4px;
}

.memo-text {
  color: #6e6e73;
  font-size: 13px;
  line-height: 1.6;
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  gap: 12px;
  color: #6e6e73;
}

.empty-state svg {
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
}

.empty-state small {
  font-size: 13px;
  color: #6e6e73;
}

/* 响应式 - 卡片模式 */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 16px 18px;
  }

  .word-text {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card {
    padding: 14px 16px;
    gap: 12px;
  }

  .word-text {
    font-size: 16px;
  }

  .pronunciation-text,
  .phonetic-text {
    font-size: 13px;
  }

  .row-1 {
    font-size: 11px;
  }
}
/* ... 原有樣式 ... */

/* === 新增：本地篩選框樣式 === */
.local-filter-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
}

.filter-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 300px; /* 控制搜索框寬度 */
}

.filter-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6e6e73;
  pointer-events: none;
}

.local-filter-input {
  padding: 8px 32px 8px 32px; /* 留出圖標和清除按鈕的位置 */
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.8);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.local-filter-input:focus {
  background: #fff;
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.clear-filter-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: rgba(0,0,0,0.1);
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-filter-btn:hover {
  background: rgba(0,0,0,0.2);
}

.filter-count {
  font-size: 13px;
  color: #6e6e73;
  font-weight: 500;
}

/* 響應式調整 */
@media (max-width: 480px) {
  .filter-input-wrapper {
    max-width: 100%;
  }
}

.load-more-trigger {
  grid-column: 1 / -1; /* 跨越 Grid 的所有列 */
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50px;
}

.loading-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6e6e73;
  font-size: 14px;
}


.no-more {
  color: #999;
  font-size: 13px;
  letter-spacing: 1px;
}

/* ===== 地图模式样式 ===== */
.map-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;      /* Minimum height for map visibility */
  max-height: 69dvh;      /* Match content-area max-height */
  height: 69dvh;          /* Explicit height for percentage-based children */
}

.map-mode .yubao-map-container {
  width: 100%;
  height: 100%;
}
</style>
