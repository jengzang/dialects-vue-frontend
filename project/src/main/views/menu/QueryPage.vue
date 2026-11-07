<template>
  <TabSwitcher
    class="page-tabs--vertically-centered"
    pin-navigation
    :tabs="tabs"
    :model-value="currentTab"
    :route-value="currentTab"
    :resolve-route="resolveTabRoute"
  >
    <template #default="{ currentTab }">
      <div class="tab-content-inner query-page-root">
      <h1 class="page-title">
        <BarIcon :icon="activePageIcon" />
        {{ activePageTitle }}
      </h1>

      <div v-show="currentTab === 'tab1'" class="query-hero">
        <textarea
            id="hanzi-input"
            class="query-hero-input"
            rows="1"
            :aria-label="$t('query.tab1.label')"
            :placeholder="$t('query.tab1.placeholder')"
            v-model="hanziInput"
            @input="handleHanziInput"
            autocomplete="off"
        ></textarea>
      </div>
      <RouterLink
          v-show="currentTab === 'tab1'"
          class="query-cross-link"
          :to="notesQueryLink"
      >
        {{ $t('query.tab1.notesCrossLink') }}
        <svg
            class="query-cross-link-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </RouterLink>


      <div v-show="currentTab === 'tab2'" class="card-row-outer">
        <CardExcludeRow
          v-model="tabStates.tab2.card"
          v-model:exclude-values="tabStates.tab2.excludeColumns"
          :options="cardOptions"
          :aria-label="$t('query.tab2.title')"
          :exclude-options="excludeOptions"
          :open="excludeDropdownOpen === 'tab2'"
          :disabled="buttonState.isRunning"
          :no-exclude-text="$t('query.tab2.noExclude')"
          @toggle="toggleExcludeDropdown('tab2')"
        />
      </div>

      <div v-show="currentTab === 'tab2'" class="query-page-panel glass-panel">
        <p v-if="zhongguInputMode !== 'direct'" class="panel-hint">{{ $t('query.tab2.selectHint') }}</p>
        <!-- 直接輸入模式 -->
        <div v-if="zhongguInputMode === 'direct'" class="direct-input-box">
          <ZhongGuDirectInput
            :exclude-columns="tabStates.tab2.excludeColumns"
            :table-name="selectedCharacterTable"
            @update:runDisabled="setTabContentDisabled('query', 'tab2', $event)"
            ref="ZhongguDirectInputRef"
          />
        </div>

        <!-- 選擇器模式 -->
        <div v-else class="triple-select-box">
          <!-- ✅ 鍵名 + 鍵值：同一行，用容器包 -->
          <div class="dropdown-row">
            <KeyButtonGroup
              :available-keys="availableKeys"
              v-model="tabStates.tab2.keys"
              :exclusive-rules="exclusiveRules"
              :single-select-keys="singleSelectKeys"
            />
            <DropdownValueSelector
              :selected-keys="tabStates.tab2.keys"
              v-model="tabStates.tab2.valueMap"
              :key-value-map="keyValueMap"
            />
          </div>
          <ZhongguSelector
              :active-keys="tabStates.tab2.keys"
              :value-map="tabStates.tab2.valueMap"
              :is-dropdown-open="excludeDropdownOpen === 'tab2'"
              :selected-card="tabStates.tab2.card"
              :exclude-columns="tabStates.tab2.excludeColumns"
              :table-name="selectedCharacterTable"
              @update:runDisabled="setTabContentDisabled('query', 'tab2', $event)"
              ref="ZhongguRef"
          />
        </div>
      </div>

      <!-- 📤 tab3：查音位頁面 -->
      <div v-show="currentTab === 'tab3'" class="card-row-outer">
        <CardExcludeRow
          v-model="tabStates.tab3.card"
          v-model:exclude-values="tabStates.tab3.excludeColumns"
          :options="cardOptions"
          :aria-label="$t('query.tab3.title')"
          :exclude-options="excludeOptions"
          :open="excludeDropdownOpen === 'tab3'"
          :disabled="buttonState.isRunning"
          :no-exclude-text="$t('query.tab3.noExclude')"
          @toggle="toggleExcludeDropdown('tab3')"
        />
      </div>

      <div v-show="currentTab === 'tab3'" class="query-page-panel glass-panel">
        <p class="panel-hint">{{ $t('query.tab3.selectHint') }}</p>
        <!-- 三欄選擇 -->
        <div class="triple-select-box">
          <div class="dropdown-row">
            <KeyButtonGroup
              :available-keys="availableKeys"
              v-model="tabStates.tab3.keys"
              :exclusive-rules="exclusiveRules"
              :single-select-keys="singleSelectKeys"
            />

            <!-- 🔄 輸入框 -->
            <YinweiSelector
                ref="YinweiSelectorRef"
                :locationRef="locationRef"
                :selected-card="tabStates.tab3.card"
                @update:runDisabled="setTabContentDisabled('query', 'tab3', $event)"
            />

            <div class="info-text" style="margin: 10px 0 15px">
              <span class="info-icon">ℹ️</span>
              <span v-html="$t('query.tab3.analysisText', { card: tabStates.tab3.card, keys: selectedKeysString })"></span>
            </div>
          </div>
        </div>
      </div>


      <LocationAndRegionInput
          ref="locationRef"
          @update:runDisabled="uiStore.buttonStates.query.isLocationDisabled = $event"
          v-model="locationModel"
          :limitContext="locationLimitContext"
      />

      <RecentQueryPills
        :entries="recentQueries.entries.value"
        :disabled="buttonState.isRunning || isRestoringHistory"
        @restore="restoreRecentQuery"
      >
        <TutorialQuickStartPill :target="`query:${currentTab}`" />
      </RecentQueryPills>

      <!-- ✅ 炫酷按鈕 -->
      <div class="run-container">
        <button
            class="run-btn"
            @click="runAction"
            :disabled="buttonState.isRunning || isRunDisabled || isRestoringHistory"
            :class="{ disabled: isRunDisabled }"
        >
          <span v-if="buttonState.isRunning"><InlineIcon icon="🔄" />{{ $t('query.button.running') }}</span>
          <span v-else-if="isRunDisabled"><InlineIcon icon="🚫" />{{ $t('query.button.invalid') }}</span>
          <span v-else><InlineIcon icon="🚀" />{{ $t('query.button.run') }}</span>
        </button>
      </div>
      <!-- 🔹 建議與操作區 -->
      <!-- <div v-if="currentTab === 'tab1'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('query.tab1.description') }}</small>
      </div>
      <div v-else-if="currentTab === 'tab2'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('query.tab2.description') }}</small>
      </div>
      <div v-else-if="currentTab === 'tab3'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('query.tab3.description') }}</small>
      </div>
      <div v-else-if="currentTab === 'tab4'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('query.tab4.description') }}</small>
      </div> -->
      </div>
    </template>
  </TabSwitcher>
</template>

<script setup>
import BarIcon from '@/components/common/BarIcon.vue'
import InlineIcon from '@/components/common/InlineIcon.vue'
import {computed, nextTick, reactive, ref, onMounted, onBeforeUnmount, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useI18n } from 'vue-i18n'
import TabSwitcher from "@/components/common/TabSwitcher.vue";
import LocationAndRegionInput from "@/main/components/geo/LocationAndRegionInput.vue";
import TutorialQuickStartPill from "@/main/components/tutorial/TutorialQuickStartPill.vue";
import RecentQueryPills from '@/components/common/RecentQueryPills.vue'
import { useRecentQueryHistory } from '@/composables/core/useRecentQueryHistory.js'
import ZhongguSelector from "@/main/components/query/ZhongguSelector.vue";
import ZhongGuDirectInput from "@/main/components/query/ZhongGuDirectInput.vue";
import YinweiSelector from "@/main/components/query/YinweiSelector.vue";
import KeyButtonGroup from "@/main/components/query/KeyButtonGroup.vue";
import DropdownValueSelector from "@/main/components/query/DropdownValueSelector.vue";
import CardExcludeRow from "@/components/selector/CardExcludeRow.vue";
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import {
  globalPayload,
  queryStore,
  uiStore,
  isQueryButtonDisabled,
  preferredCharacterTable,
  setRunning,
  setTabContentDisabled,
  tutorialAssistState,
  clearTutorialAssistRequest,
  zhongguInputMode,
  setZhongguInputMode,
  setPreferredCharacterTable,
} from '@/main/store/store.js'
import { useQueryConfig } from '@/composables/data/useQueryConfig.js'

import { translateResultTerm } from '@/i18n/utils/resultI18n.js'
import { readMenuBarMemory, writeMenuBarMemory } from '@/main/config/BarAndTabs/MenuBarConfig.js'
import { showWarning } from '@/utils/ui/message.js'
import { limitEffectiveChars } from '@/main/utils/query/queryLimits.js'

const { t } = useI18n()
const selectedCharacterTable = preferredCharacterTable

// 使用查询配置 Composable
const { keyValueMap, availableKeys, exclusiveRules, singleSelectKeys } = useQueryConfig(selectedCharacterTable)

const locationRef = ref(null)
const router = useRouter()
const route = useRoute()
const routeSubToTab = {
  char: 'tab1',
  zhonggu: 'tab2',
  yinwei: 'tab3',
  tone: 'tab4'
}
const tabToRouteSub = {
  tab1: 'char',
  tab2: 'zhonggu',
  tab3: 'yinwei',
  tab4: 'tone'
}
const currentTab = computed(() => routeSubToTab[route.params.sub] || 'tab2')
const tabs = [
  { name: 'tab1', label: t('query.tab1.title') },
  { name: 'tab2', label: t('query.tab2.title') },
  { name: 'tab3', label: t('query.tab3.title') },
  { name: 'tab4', label: t('query.tab4.title') }
]

const pageTitleKeys = {
  tab1: 'navigation.pageTitles.query.tab1',
  tab2: 'navigation.pageTitles.query.tab2',
  tab3: 'navigation.pageTitles.query.tab3',
  tab4: 'navigation.pageTitles.query.tab4'
}

const pageTitleIcons = {
  tab1: '🔣',
  tab2: '📜',
  tab3: '🗣️',
  tab4: '🎼'
}

const activePageTitle = computed(() => t(pageTitleKeys[currentTab.value] || pageTitleKeys.tab2))
const activePageIcon = computed(() => pageTitleIcons[currentTab.value] || pageTitleIcons.tab2)

const notesQueryLink = computed(() => ({
  path: buildLocalePath(resolveRouteLocale(route), '/menu/vocabulary/view'),
  query: { source: 'character-notes' },
}))

// Compute limit context based on current tab
const locationLimitContext = computed(() => {
  return currentTab.value  // 'tab1', 'tab2', 'tab3', or 'tab4'
})

const hanziInput = ref('')
const hasShownCharLimitWarning = ref(false)

// ✨ 過濾器相關狀態
const excludeOptions = computed(() => {
  const options = [
    { value: '多地位標記', label: t('query.tab2.excludeOptions.allMulti') }
  ]

  if (selectedCharacterTable.value === 'characters') {
    options.push(
      { value: '多等', label: t('query.tab2.excludeOptions.excludeMultiGrade') },
      { value: '多韻', label: t('query.tab2.excludeOptions.excludeMultiRime') },
      { value: '多聲母', label: t('query.tab2.excludeOptions.excludeMultiInitial') },
      { value: '多調', label: t('query.tab2.excludeOptions.excludeMultiTone') }
    )
  }

  return options
})
const excludeDropdownOpen = ref(null) // 'tab2' 或 'tab3' 或 null

const tabStates = reactive({
  tab2: {
    card: '韻母',
    keys: ['攝'],
    valueMap: {}, // Tab2 专用的下拉菜单选择值
    excludeColumns: [] // ✨ 新增：多音字过滤选项
  },
  tab3: {
    card: '韻母',
    keys: ['攝'], // Tab3 专用的键名
    valueMap: {},
    excludeColumns: [] // ✨ 新增：多音字过滤选项
    // Tab3 没有 valueMap 下拉框，如果有也放在这
  }
})

const cards = ['聲母', '韻母', '聲調']

const cardOptions = computed(() =>
  cards.map((item) => ({
    value: item,
    label: translateResultTerm(t, item)
  }))
)

const tab3KeyTriggerEl = ref(null)
const keyTriggerEl = ref(null)
const YinweiSelectorRef = ref(null)

// 1️⃣ 使用 uiStore 中的按钮状态（不再定义本地状态）
// 直接从 store 获取状态引用
const buttonState = uiStore.buttonStates.query

// 2️⃣ 监听 Tab 1 的输入框内容 (因为它没有子组件 emit 事件，需要手动监听)
watch(hanziInput, (newVal) => {
  const limited = limitEffectiveChars(newVal, 5);
  setTabContentDisabled('query', 'tab1', limited.effectiveCount === 0);
}, { immediate: true });

function handleHanziInput() {
  const limited = limitEffectiveChars(hanziInput.value, 5);

  if (limited.hasExtraEffectiveChars) {
    if (!hasShownCharLimitWarning.value) {
      showWarning(t('query.tab1.maxCharsWarning', { max: 5 }));
      hasShownCharLimitWarning.value = true;
    }
    return;
  }

  hasShownCharLimitWarning.value = false;
}

// 3️⃣ 同步当前 Tab 到 store
watch(currentTab, (newTab) => {
  uiStore.currentSubTab.query = newTab
}, { immediate: true })

watch(
  () => tutorialAssistState.requestToken,
  (token) => {
    if (!token || !tutorialAssistState.payload) {
      return
    }

    if (tutorialAssistState.target === 'query:tab1' && currentTab.value === 'tab1') {
      const payload = tutorialAssistState.payload
      hanziInput.value = payload.chars || ''
      locationModel.value = {
        ...payload.loc,
        locations: payload.loc?.locations || [],
        regions: payload.loc?.regions || [],
        regionUsing: payload.loc?.regionUsing || 'yindian'
      }
      clearTutorialAssistRequest()
      return
    }

    if (tutorialAssistState.target === 'query:tab2' && currentTab.value === 'tab2') {
      handleApplyConfig(tutorialAssistState.payload)
      clearTutorialAssistRequest()
      return
    }

    if (tutorialAssistState.target === 'query:tab3' && currentTab.value === 'tab3') {
      handleApplyConfig(tutorialAssistState.payload)
      clearTutorialAssistRequest()
    }

    if (tutorialAssistState.target === 'query:tab4' && currentTab.value === 'tab4') {
      const payload = tutorialAssistState.payload
      locationModel.value = {
        ...payload.loc,
        locations: payload.loc?.locations || [],
        regions: payload.loc?.regions || [],
        regionUsing: payload.loc?.regionUsing || 'yindian'
      }
      clearTutorialAssistRequest()
    }
  }
)

function getNormalizedKeys(keys = []) {
  const allowedKeys = availableKeys.value || []
  const nextKeys = keys.filter(key => allowedKeys.includes(key))
  return nextKeys.length > 0 ? nextKeys : (allowedKeys[0] ? [allowedKeys[0]] : [])
}

function getNormalizedValueMap(keys = [], valueMap = {}) {
  return keys.reduce((nextMap, key) => {
    const allowedValues = keyValueMap.value[key] || []
    const values = Array.isArray(valueMap[key])
      ? valueMap[key].filter(value => allowedValues.includes(value))
      : []

    if (values.length > 0) {
      nextMap[key] = values
    }

    return nextMap
  }, {})
}

function getNormalizedExcludeColumns(excludeColumns = []) {
  const allowedColumns = excludeOptions.value.map(option => option.value)
  return excludeColumns.filter(column => allowedColumns.includes(column))
}

function syncTabStateWithTable(tab) {
  const state = tabStates[tab]
  const nextKeys = getNormalizedKeys(state.keys)

  state.keys = nextKeys
  state.valueMap = getNormalizedValueMap(nextKeys, state.valueMap)
  state.excludeColumns = getNormalizedExcludeColumns(state.excludeColumns)
}

watch(selectedCharacterTable, () => {
  syncTabStateWithTable('tab2')
  syncTabStateWithTable('tab3')
}, { immediate: true })

// 4️⃣ 🔥 最终计算属性：控制按钮是否禁用（使用 store 的 computed helper）
const isRunDisabled = isQueryButtonDisabled

const locationModel = ref({
  locations: [],
  regions: [],
  regionUsing: 'map'
})

const recentQueries = useRecentQueryHistory(() => `query:${currentTab.value}`)
const isRestoringHistory = ref(false)

function rememberRecentQuery(locationList) {
  const tab = currentTab.value
  const loc = { ...locationModel.value }
  if (!loc.locations.length && !loc.regions.length) loc.locations = locationList
  const snapshot = { table: selectedCharacterTable.value, loc }
  let summary = ''
  if (tab === 'tab1') {
    snapshot.chars = hanziInput.value
    summary = snapshot.chars
  } else if (tab === 'tab2') {
    snapshot.mode = zhongguInputMode.value
    snapshot.state = tabStates.tab2
    if (snapshot.mode === 'direct') {
      snapshot.direct = {
        positionInput: ZhongguDirectInputRef.value?.positionInput || '',
        charInput: ZhongguDirectInputRef.value?.charInput || '',
      }
      summary = [snapshot.direct.positionInput, snapshot.direct.charInput].filter(Boolean).join(' ')
    } else {
      summary = Object.values(snapshot.state.valueMap).flat().join('、')
    }
    summary = [summary, snapshot.state.card].filter(Boolean).join(' · ')
  } else if (tab === 'tab3') {
    snapshot.state = tabStates.tab3
    snapshot.phoInput = YinweiSelectorRef.value?.tab3KeyInput || ''
    summary = [snapshot.phoInput, snapshot.state.card].filter(Boolean).join(' · ')
  }
  recentQueries.record(snapshot, [summary, [...loc.locations, ...loc.regions].join(' ')].filter(Boolean).join(' · '))
}

async function restoreRecentQuery(snapshot) {
  if (buttonState.isRunning || isRestoringHistory.value) return
  const tab = currentTab.value
  isRestoringHistory.value = true
  try {
    setPreferredCharacterTable(snapshot.table)
    if (tab === 'tab2') setZhongguInputMode(snapshot.mode)
    await nextTick()
    if (tab !== currentTab.value) return
    locationModel.value = snapshot.loc
    if (tab === 'tab1') hanziInput.value = snapshot.chars
    if (tab === 'tab2') {
      tabStates.tab2 = snapshot.state
      if (snapshot.mode === 'direct' && ZhongguDirectInputRef.value) {
        ZhongguDirectInputRef.value.positionInput = snapshot.direct.positionInput
        ZhongguDirectInputRef.value.charInput = snapshot.direct.charInput
      }
    }
    if (tab === 'tab3') {
      tabStates.tab3 = snapshot.state
      await nextTick()
      if (tab !== currentTab.value) return
      YinweiSelectorRef.value?.restoreInput(snapshot.phoInput)
    }
  } finally {
    isRestoringHistory.value = false
  }
}

function onClickOutside(event) {
  const isInsideTrigger = [
    keyTriggerEl.value,
    tab3KeyTriggerEl.value,
    // ✨ 检查过滤器 trigger
    event.target.closest('.card-exclude-trigger')
  ].some(el => el?.contains(event.target))

  const isInsidePanel = event.target.closest('.dropdown-panel')

  if (!isInsideTrigger && !isInsidePanel) {
    excludeDropdownOpen.value = null // ✨ 关闭过滤器下拉框
  }
}

// ✨ 過濾器相關函數
// 切換過濾器下拉框
function toggleExcludeDropdown(tab) {
  if (buttonState.isRunning) return
  excludeDropdownOpen.value = excludeDropdownOpen.value === tab ? null : tab
}

// isRunning 状态已移至 uiStore，不再需要本地定义
const ZhongguRef = ref(null);
const ZhongguDirectInputRef = ref(null);

function resetRememberedMapSubToView() {
  const rememberedMapPath = readMenuBarMemory('map')
  if (rememberedMapPath && rememberedMapPath !== '/menu/map/view') {
    writeMenuBarMemory('map', '/menu/map/view')
  }
}

// 點擊按鈕行為
const runAction = async () => {
  if (isRunDisabled.value || locationRef.value?.runDisabled || isRestoringHistory.value) return
  setRunning('query', true);

  // 1. 獲取地點邏輯 (保持不變)
  function getLocation() {
    if (!locationRef.value?.selectedValue ||
        (Array.isArray(locationRef.value?.selectedValue) && locationRef.value.selectedValue.every(item => item === ''))) {
      // 如果沒有選區域，或者區域是空的，回傳輸入框的值 (預設 '廣州')
      return locationRef.value?.allLocationsString || t('query.tab3.defaultLocation');
    } else {
      // 否則回傳輸入框的值 (這裡邏輯可能視你具體需求微調，目前保持原樣)
      return locationRef.value?.allLocationsString;
    }
  }

  // 2. 準備基礎參數
  // 注意：API 接受的是 Array (List)，前端可能是 String，這裡要做轉換
  const locationVal = getLocation();
  const locationList = locationVal ? [locationVal] : []; // 轉成 List

  const regionVal = locationRef.value?.selectedValue;
  // 如果 regionVal 是 array 就直接用，如果是字串就轉 array，如果是 null 就空 array
  const regionList = Array.isArray(regionVal) ? regionVal : (regionVal ? [regionVal] : []);
  queryStore.locations = locationList;
  queryStore.regions = regionList;
  // 3. 構建 payload
  let payload = {};
  if (currentTab.value === 'tab2') {

    // 假設 selectedCard.value 是一個字串，後端 features 需要 List
    const featureList = tabStates.tab2.card ? [tabStates.tab2.card] : ['韻母'];

    let pathStrings = []
    let charsForPayload = ''

    if (zhongguInputMode.value === 'direct') {
      pathStrings = ZhongguDirectInputRef.value?.pathStrings || []
      charsForPayload = ZhongguDirectInputRef.value?.chars || ''
    } else {
      pathStrings = ZhongguRef.value?.combinations || []
    }

    payload = {
      // 第一部分：查字參數
      path_strings: pathStrings,
      chars: charsForPayload ? [...charsForPayload] : [],
      column: [],            // 目前前端沒提供，預設空
      combine_query: false,  // 目前前端沒提供，預設 false

      // 第二部分：分析參數
      locations: locationList,
      regions: regionList,
      features: featureList,
      region_mode: locationRef.value?.regionUsing || 'yindian'
    };
    // 1. 准备要发送的数据
    const finalPayload = {
      ...payload,           // 原本的数据 (path_strings, locations 等)
      _sourceTab: 'tab2',    // 👈 手动加上当前的 Tab 标记
      exclude_columns: tabStates.tab2.excludeColumns,  // ✨ 新增
      table_name: selectedCharacterTable.value
    }

    // 2. 存入全局仓库
    globalPayload.value = JSON.parse(JSON.stringify(finalPayload))
  }

  else if (currentTab.value === 'tab3') {
    const featureList = tabStates.tab3.card ? [tabStates.tab3.card] : ['韻母'];
    const selectedKeys = selectedKeysString.value
      .split('·')
      .map(item => item.trim())
      .filter(Boolean);

    if (YinweiSelectorRef.value?.ensureReady) {
      await YinweiSelectorRef.value.ensureReady()
    }
    const phos = YinweiSelectorRef.value?.normalizedPhoInput || '';

    payload = {
      group_inputs: selectedKeys,
      pho_values: phos,
      locations: locationList,
      regions: regionList,
      features: featureList,
      region_mode: locationRef.value?.regionUsing || 'yindian',
    };

    // 1. 准备要发送的数据
    const finalPayload = {
      ...payload,           // 原本的数据 (path_strings, locations 等)
      _sourceTab: 'tab3',    // 👈 手动加上当前的 Tab 标记
      exclude_columns: tabStates.tab3.excludeColumns,  // ✨ 新增
      table_name: selectedCharacterTable.value
    }

    // 2. 存入全局仓库
    globalPayload.value = JSON.parse(JSON.stringify(finalPayload))
  }
  else if  (currentTab.value === 'tab1'){
    const limited = limitEffectiveChars(hanziInput.value, 5);
    const chars = limited.value;

    if (!chars) {
      showWarning(t('query.button.invalid'));
      setRunning('query', false);
      return;
    }

    // 可选：点击查询后，把输入框同步成最终查询内容
    // 这一步不会影响输入法，因为已经是提交时了
    hanziInput.value = chars;
    payload = {
      chars: chars,
      locations: locationList,
      regions: regionList,
      region_mode: locationRef.value?.regionUsing || 'yindian',
    };

    // 1. 准备要发送的数据
    const finalPayload = {
      ...payload,           // 原本的数据 (path_strings, locations 等)
      _sourceTab: 'tab1'    // 👈 手动加上当前的 Tab 标记
    }

    // 2. 存入全局仓库
    globalPayload.value = JSON.parse(JSON.stringify(finalPayload))
  }
  else if  (currentTab.value === 'tab4'){
    payload = {
      locations: locationList,
      regions: regionList,
      region_mode: locationRef.value?.regionUsing || 'yindian',
    };

    // 1. 准备要发送的数据
    const finalPayload = {
      ...payload,           // 原本的数据 (path_strings, locations 等)
      _sourceTab: 'tab4'    // 👈 手动加上当前的 Tab 标记
    }

    // 2. 存入全局仓库
    globalPayload.value = JSON.parse(JSON.stringify(finalPayload))
  }
  rememberRecentQuery(locationList)
  resetRememberedMapSubToView()
  // 3. 纯净跳转
  await router.replace({
    path: buildLocalePath(resolveRouteLocale(route), '/menu/result')
  });
  setRunning('query', false); // 請求結束，關閉 loading 狀態
}


const selectedKeysString = computed(() => {
  // 方案 A：按点击顺序显示 (如果先点B再点A，显示 "B·A")
  return tabStates.tab3.keys.join('·')

  // 方案 B：按原列表顺序显示 (即使先点B再点A，依然显示 "A·B")
  // 假设 `keys` 是你定义所有按钮顺序的那个常量数组
  // return keys.filter(k => selectedKey.value.includes(k)).join('·')
})

function handleApplyConfig(data) {
  const tab = currentTab.value
  // 1. 更新卡片 (聲/韻/調)
  if (tab === 'tab2') {
    tabStates.tab2.card = data.card
  }
  else {
    tabStates.tab3.card = data.card
  }

  // 2. 更新地點
  locationModel.value = {
    ...data.loc,
    locations: data.loc.locations,
    regions: data.loc.regions,
    regionUsing: data.loc.regionUsing
  }

  // 3. 直接輸入模式
  if (data.mode === 'direct') {
    if (tab === 'tab2' && ZhongguDirectInputRef.value) {
      ZhongguDirectInputRef.value.positionInput = data.positionInput || ''
      ZhongguDirectInputRef.value.charInput = data.charInput || ''
    }
    return
  }

  // 4. 下拉選擇器模式：更新鍵名 (Keys)
  if (tab === 'tab2') {
    tabStates.tab2.keys = data.keys
  }
  else {
    tabStates.tab3.keys = data.keys
  }

  // 5. 根據 Tab 更新具體的值
  if (data.isTab3) {
    // Tab3: 更新 YinweiSelector 組件的輸入框
    if (YinweiSelectorRef.value) {
      YinweiSelectorRef.value.tab3KeyInput = data.tab3InputValue
    }
  } else {
    // Tab2: 更新下拉菜單映射
    tabStates.tab2.valueMap = data.valuesMap
  }
}

function resolveTabRoute(tabName) {
  const sub = tabToRouteSub[tabName] || 'zhonggu'
  return {
    path: buildLocalePath(resolveRouteLocale(route), `/menu/query/${sub}`)
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<script>
export default {
  name: 'QueryPage' // 👈 必须加这个名字，KeepAlive 才能认出它
}
</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.page-tabs--vertically-centered {
  min-height: 80dvh;
}

.tab-content-inner {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  padding: 1rem 0;
  text-align: center;
  animation: fade 0.6s ease;
}

.page-title {
  margin-bottom: 1.5dvh;
}

.query-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.query-hero::after {
  content: '';
  width: min(90dvw, 600px);
  margin-top: 1dvh;
  border-bottom: 1px solid var(--border-control-focus);
}

.query-cross-link {
  margin-top: 1.2dvh;
  margin-bottom: 1.2dvh;
  color: var(--color-secondary);
  font-family: var(--font-serif);
  font-size: var(--font-size-16);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  transition: color 0.2s ease;
}

.query-cross-link:hover {
  color: var(--color-secondary-hover);
  text-decoration-thickness: 2px;
}

.query-cross-link-arrow {
  width: 1em;
  height: 1em;
  margin-left: 0.35em;
  vertical-align: -0.1em;
  transition: transform 0.2s ease;
}

.query-cross-link:hover .query-cross-link-arrow {
  transform: translateX(3px);
}

.query-hero-input {
  --query-hero-input-height: clamp(64px, 9dvh, 92px);
  width: min(90dvw, 600px);
  max-width: none;
  height: var(--query-hero-input-height);
  box-sizing: border-box;
  padding: 0 1.5rem;
  font-family: var(--font-sans);
  font-size: clamp(var(--font-size-24), 3.2dvh, var(--font-size-32));
  line-height: calc(var(--query-hero-input-height) - 4px);
  text-align: center;
  color: var(--text-primary);
  background: var(--surface-panel);
  border: 2px solid var(--border-control-focus);
  border-radius: var(--radius-lg);
  resize: none;
  white-space: nowrap;
  overflow-x: auto;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.query-hero-input::placeholder {
  font-size: var(--font-size-18);
  color: var(--text-tertiary);
}

.query-hero-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.query-page-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5dvh;
  margin: 0 auto;
  padding: 2dvh;
  max-height: 35dvh;
  overflow-y: auto;
  font-size: var(--font-size-18);
}

@media (max-aspect-ratio: 1/1) {
  .tab-content-inner {
    padding-bottom: calc(1rem + 8dvh);
  }

  .query-page-panel {
    padding: 10px;
    font-size: var(--font-size-16);
  }

  .query-hero-input {
    --query-hero-input-height: 60px;
    padding: 0 4px;
    font-size: var(--font-size-20);
  }

  .query-hero-input::placeholder {
    font-size: var(--font-size-16);
  }
}

@media (min-aspect-ratio: 1/1) {
  .tab-content-inner {
    padding-bottom: calc(1rem + 4dvh);
  }
}


@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* 📱 響應式：小螢幕按鈕變小 */
@media(max-width: 600px) {
  .triple-select-box{
    flex-wrap: wrap;
  }
}

.triple-select-box {
  display: flex;
  gap: 1.5dvw;
  width: 100%;
  justify-content: space-between;
  flex-direction: column;
}

.panel-hint {
  display: none;
  margin: 0;
  color: var(--text-tertiary);
  font-size: var(--font-size-13);
}

@media (min-aspect-ratio: 1/1) {
  .panel-hint {
    display: block;
  }
}

.card-row-outer {
  width: min(90dvw, 600px);
  margin: 0 auto 1.2dvh;
}

.dropdown-row {
  display: flex;
  width: 100%;
  justify-content: center;
  white-space: nowrap;
  flex-direction: column;
  align-items: center;
}


</style>
