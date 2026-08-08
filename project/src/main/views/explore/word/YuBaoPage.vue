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
import * as OpenCC from 'opencc-js/t2cn'
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
      path: '/menu/yubao',
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



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$white: var(--glass-50);
$purple: var(--color-purple-light);

$text-primary: var(--text-primary);
$text-secondary: var(--text-secondary);
$text-tertiary: var(--text-lightest);


$transition-fast: 0.2s;
$transition-control: 0.25s;
$transition-base: 0.3s;

$ease-standard: cubic-bezier(0.4, 0, 0.2, 1);@mixin saturated-glass($blur: 30px, $saturation: 180%) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

@mixin segmented-shell {
  padding: 4px;
  background: var(--glass-60);
  border: 0.5px solid var(--glass-80);
  border-radius: var(--radius-md);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 var(--glass-90);

  @include saturated-glass;
}

@mixin control-active {
  color: $primary;
  background: $white;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06);

  :root[data-color-theme='dark'] & {
    color: var(--text-primary);
    background: var(--surface-panel-strong);
  }
}

@mixin field-focus {
  background: $white;
  border-color: $primary;
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

/* 页面主体 */
.yubao-page {
  width: 90dvw;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;

  @media (max-width: 768px) {
    padding: 4px;
  }
}

/* 顶部控制栏 */
.top-controls {
  display: flex;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 24px;

  @media (max-width: 650px) {
    flex-direction: column;
    gap: 4px;
  }

  @media (max-width: 640px) {
    margin-bottom: 8px;
  }
}

.header-container {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
}

.search-container {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  min-width: 0;

  @media (max-width: 650px) {
    width: 100%;
  }
}

/* Tab 切换 */
.tab-container {
  display: flex;
  gap: 4px;

  @include segmented-shell;

  @media (max-width: 640px) {
    justify-content: center;
  }
}

.tab-btn {
  padding: 8px 16px;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm2);
  transition: all $transition-control $ease-standard;

  &:hover:not(.active) {
    color: $text-primary;
    background: rgba(0, 0, 0, 0.04);
  }

  &.active {
    font-weight: 600;

    @include control-active;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 14px;
  }
}

/* 查看全部按钮 */
.view-all-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
  color: $primary;
  cursor: pointer;
  background: var(--glass-60);
  border: 0.5px solid var(--glass-80);
  border-radius: var(--radius-md);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all $transition-control $ease-standard;

  @include flex-center;
  @include saturated-glass;

  &:hover {
    background: var(--glass-90);
    box-shadow:
      0 6px 30px rgba(0, 0, 0, 0.08),
      0 3px 8px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(0);
  }
}

/* 搜索区域 */
.search-section {
  flex: 1;
  width: 100%;
  min-width: 0;
  justify-items: center;
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
  overflow: hidden;
  color: var(--text-dark);
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    sans-serif;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  background: var(--bg-white);
  border: 1.5px solid var(--border-gray);
  border-radius: var(--radius-md);
  outline: none;
  transition: all $transition-base $ease-standard;

  &:focus {
    background: $white;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
  }

  &::placeholder {
    color: dimgrey;
  }
}

/* 视图模式选择器 */
.view-mode-selector {
  display: flex;
  flex-shrink: 0;
  gap: 4px;

  @include segmented-shell;
}

.mode-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  color: $text-secondary;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm2);
  transition: all $transition-control $ease-standard;

  @include flex-center;

  &:hover:not(.active) {
    color: $text-primary;
    background: rgba(0, 0, 0, 0.04);
  }

  &.active {
    @include control-active;
  }
}

/* 内容区 */
.content-area {
  min-height: 300px;
  max-height: 69dvh;
  padding: 25px;
  overflow: auto;
  background: var(--glass-60);
  border: 1px solid var(--border-gray-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);

  @include glass-blur(20px);

  @media (max-width: 768px) {
    padding: 20px;
  }
}

/* 加载状态 */
.loading-state {
  gap: 16px;
  padding: 60px 20px;
}

/*
 * 搜索建议通过 Teleport 挂载到 body，
 * 不能嵌套到 .yubao-page 或 .input-wrapper 下。
 */
.inline-suggestion {
  position: absolute !important;
  z-index: 99999 !important;
  width: fit-content;
  max-width: 400px;
  max-height: 40vh;
  padding: 8px 12px;
  overflow-y: auto;
  color: var(--text-dark);
  font-size: 14px;
  white-space: pre-line;
  pointer-events: auto !important;
  background: var(--glass-60) !important;
  border: 1px solid var(--border-gray-light) !important;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg2);
  transition: background-color $transition-fast ease;

  @include glass-blur(12px);

  @media (max-width: 768px) {
    max-width: 90vw;
  }
}

.suggest-line {
  padding: 8px 12px;
  margin: 2px 0;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color $transition-fast ease;

  &:hover {
    background-color: var(--bg-blue-hover);
  }
}

/* 查看全部弹窗 */
.search-in-modal {
  margin-bottom: 16px;
}

.modal-search-input {
  width: 95%;
  padding: 10px 16px;
  font-size: 14px;
  background: var(--glass-80);
  color: var(--text-dark);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  outline: none;
  transition: all $transition-fast;

  &:focus {
    @include field-focus;
    
  }
}

.items-list {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  background: var(--glass-50);
  border-radius: var(--radius-md);
}

.item-line {
  padding: 10px 12px;
  margin-bottom: 4px;
  color: $text-primary;
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-sm2);
  transition: all 0.15s;

  &:hover {
    color: $primary;
    background: rgba(var(--color-primary-rgb), 0.08);
  }
}

.all-items-modal-footer {
  padding-top: 12px;
  margin-top: 12px;
  color: $text-secondary;
  font-size: 13px;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* 卡片模式 */
.card-mode {
  min-height: 400px;
}

.cards-loading {
  @include flex-col;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: $text-secondary;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  min-height: 100px;
  padding: 4px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.card {
  @include flex-col;
  gap: 14px;
  padding: 18px 20px;
  overflow: hidden;
  background: var(--glass-80);
  border: 0.5px solid var(--glass-90);
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 var(--text-white);
  transition: all $transition-base $ease-standard;

  @include saturated-glass;

  &:hover {
    border-color: rgba(var(--color-primary-rgb), 0.2);
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 var(--text-white);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 16px 18px;
  }

  @media (max-width: 480px) {
    gap: 12px;
    padding: 14px 16px;
  }
}

.card-row {
  display: flex;
  gap: 12px;
  align-items: center;
  line-height: 1.5;
}

.row-1 {
  flex-wrap: wrap;
  color: $text-secondary;
  font-size: 12px;

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

.location-chain,
.forms-chain {
  flex: 1;
  min-width: 0;
  color: $text-primary;
  font-weight: 500;
}

.category-chain {
  color: $purple;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.vocabulary-card {
  .row-2 {
    flex-wrap: wrap;
    font-size: 16px;
    font-weight: 600;
  }
}

.word-text {
  color: $text-primary;
  font-size: 20px;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 18px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
}

.pronunciation-text {
  color: $primary;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.grammar-card {
  .row-2,
  .row-3 {
    padding: 10px 12px;
    margin: 0 -4px;
    border-radius: var(--radius-md);
  }

  .row-2 {
    background: rgba(var(--color-primary-rgb), 0.06);
  }

  .row-3 {
    background: rgba(0, 0, 0, 0.03);
  }
}

.phonetic-text {
  color: $primary;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  word-break: break-all;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.memo-text {
  color: $text-secondary;
  font-size: 13px;
  line-height: 1.6;
}

/* 空状态 */
.empty-state {
  gap: 12px;
  padding: 80px 20px;
  color: $text-secondary;

  svg {
    opacity: 0.5;
  }

  p {
    margin: 0;
    color: $text-primary;
    font-size: 16px;
    font-weight: 500;
  }

  small {
    color: $text-secondary;
    font-size: 13px;
  }
}

/* 本地筛选 */
.local-filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 20px;
}

.filter-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 300px;

  @media (max-width: 480px) {
    max-width: 100%;
  }
}

.filter-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  color: $text-secondary;
  pointer-events: none;
  transform: translateY(-50%);
}

.local-filter-input {
  padding: 8px 32px;
  font-size: 14px;
  background: var(--glass-80);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-sm2);
  outline: none;
  transition: all $transition-fast;

  &:focus {
    @include field-focus;
  }
}

.clear-filter-btn {
  position: absolute;
  top: 50%;
  right: 6px;
  width: 18px;
  height: 18px;
  padding: 0;
  color: $white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: var(--radius-full);
  transform: translateY(-50%);

  @include flex-center;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}

.filter-count {
  color: $text-secondary;
  font-size: 13px;
  font-weight: 500;
}

/* 无限滚动 */
.load-more-trigger {
  grid-column: 1 / -1;
  min-height: 50px;
  padding: 30px 0;

  @include flex-center;
}

.loading-status {
  display: flex;
  gap: 8px;
  align-items: center;
  color: $text-secondary;
  font-size: 14px;
}

.no-more {
  color: $text-tertiary;
  font-size: 13px;
  letter-spacing: 1px;
}

/* 地图模式 */
.map-mode {
  width: 100%;
  height: 69dvh;
  min-height: 400px;
  max-height: 69dvh;

  @include flex-center;

  .yubao-map-container {
    width: 100%;
    height: 100%;
  }
}
</style>
