<template>
  <TabsContainer
    :tabs="tabs"
    :model-value="currentTab"
    :route-value="currentTab"
    :resolve-route="resolveTabRoute"
    v-slot="{ currentTab }"
  >
    <div class="tab-content-inner query-page-root">
      <div v-show="currentTab === 'tab1'" class="page">
        <div class="page-content-stack">
          <!-- 🔹 輸入框區塊 -->
          <div class="query-box">
            <label class="query-label" for="hanzi-input">{{ $t('query.tab1.label') }}</label>
            <textarea
                id="hanzi-input"
                style="height: 5dvh;white-space:nowrap;"
                :placeholder="$t('query.tab1.placeholder')"
                v-model="hanziInput"
                @input="handleHanziInput"
                autocomplete="off"
            ></textarea>
          </div>
        </div>
      </div>


      <div v-show="currentTab === 'tab2'" class="page">
        <div class="page-content-stack">
          <!-- 直接輸入模式 -->
          <div v-if="zhongguInputMode === 'direct'" class="direct-input-box">
            <div class="card-row">
              <ChoiceSelector
                v-model="tabStates.tab2.card"
                :options="cardOptions"
                :aria-label="$t('query.tab2.title')"
              />
              <div class="dropdown"
                   :ref="(el) => excludeFilterTriggerRef.tab2 = el"
                   @click="toggleExcludeDropdown('tab2')"
                   style="margin: 0;padding: 8px 10px;min-width: 60px;max-height:30px"
                   :class="{ disabled: buttonState.isRunning }"
              >
                {{ getExcludeDisplayText('tab2') || $t('query.tab2.noExclude') }}
                <span class="arrow">▾</span>
              </div>
              <Teleport to="body">
                <div
                    v-if="excludeDropdownOpen === 'tab2'"
                    class="dropdown-panel choice-dropdown-panel"
                    :style="excludeDropdownStyle"
                >
                  <div
                      class="dropdown-item choice-dropdown-item"
                      v-for="option in excludeOptions"
                      :key="option.value"
                      :class="{ active: isExcludeSelected(option.value, 'tab2') }"
                      @click="toggleExcludeOption(option.value, 'tab2')"
                  >
                    <span class="check-icon">{{ isExcludeSelected(option.value, 'tab2') ? '✓' : '' }}</span>
                    {{ option.label }}
                  </div>
                </div>
              </Teleport>
            </div>
            <ZhongGuDirectInput
              :exclude-columns="tabStates.tab2.excludeColumns"
              :table-name="selectedCharacterTable"
              @update:runDisabled="setTabContentDisabled('query', 'tab2', $event)"
              ref="ZhongguDirectInputRef"
            />
          </div>

          <!-- 選擇器模式 -->
          <div v-else class="triple-select-box">
            <!-- ✅ 卡片選擇區：獨立一行 -->
            <div class="card-row">
              <ChoiceSelector
                v-model="tabStates.tab2.card"
                :options="cardOptions"
                :aria-label="$t('query.tab2.title')"
              />

                <div class="dropdown"
                     :ref="(el) => excludeFilterTriggerRef.tab2 = el"
                     @click="toggleExcludeDropdown('tab2')"
                     style="margin: 0;padding: 8px 10px;min-width: 60px;max-height:30px "
                     :class="{ disabled: buttonState.isRunning }"
                >
                  {{ getExcludeDisplayText('tab2') || $t('query.tab2.noExclude') }}
                  <span class="arrow">▾</span>
                </div>

                <Teleport to="body">
                  <div
                      v-if="excludeDropdownOpen === 'tab2'"
                      class="dropdown-panel choice-dropdown-panel"
                      :style="excludeDropdownStyle"
                  >
                    <div
                        class="dropdown-item choice-dropdown-item"
                        v-for="option in excludeOptions"
                        :key="option.value"
                        :class="{ active: isExcludeSelected(option.value, 'tab2') }"
                        @click="toggleExcludeOption(option.value, 'tab2')"
                    >
                      <span class="check-icon">{{ isExcludeSelected(option.value, 'tab2') ? '✓' : '' }}</span>
                      {{ option.label }}
                    </div>
                  </div>
                </Teleport>

            </div>

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
      </div>

      <!-- 📤 tab3：查音位頁面 -->
      <div v-show="currentTab === 'tab3'" class="page">
        <div class="page-content-stack">
          <!-- 三欄選擇 -->
          <div class="triple-select-box">
            <!-- ✅ 卡片選擇區：獨立一行 -->
            <div class="card-row">
              <ChoiceSelector
                v-model="tabStates.tab3.card"
                :options="cardOptions"
                :aria-label="$t('query.tab3.title')"
              />

              <!-- ✨ 過濾器下拉框 -->

                <div
                    class="dropdown"
                    :ref="(el) => excludeFilterTriggerRef.tab3 = el"
                    @click="toggleExcludeDropdown('tab3')"
                    style="margin: 0;padding: 8px 10px;min-width: 60px;max-height:30px "
                    :class="{ disabled: buttonState.isRunning }"
                >
                  {{ getExcludeDisplayText('tab3') || $t('query.tab3.noExclude') }}
                  <span class="arrow">▾</span>
                </div>

                <Teleport to="body">
                  <div
                      v-if="excludeDropdownOpen === 'tab3'"
                      class="dropdown-panel choice-dropdown-panel"
                      :style="excludeDropdownStyle"
                  >

                    <div
                        class="dropdown-item choice-dropdown-item"
                        v-for="option in excludeOptions"
                        :key="option.value"
                        :class="{ active: isExcludeSelected(option.value, 'tab3') }"
                        @click="toggleExcludeOption(option.value, 'tab3')"
                    >
                      <span class="check-icon">{{ isExcludeSelected(option.value, 'tab3') ? '✓' : '' }}</span>
                      {{ option.label }}
                    </div>
                  </div>
                </Teleport>

            </div>

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
      </div>


      <LocationAndRegionInput
          ref="locationRef"
          @update:runDisabled="uiStore.buttonStates.query.isLocationDisabled = $event"
          v-model="locationModel"
          :limitContext="locationLimitContext"
      />

      <!-- ✅ 炫酷按鈕 -->
      <div class="run-container">
        <button
            class="run-btn"
            @click="runAction"
            :disabled="buttonState.isRunning || isRunDisabled"
            :class="{ disabled: isRunDisabled }"
        >
          <span v-if="buttonState.isRunning">🔄 {{ $t('query.button.running') }}</span>
          <span v-else-if="isRunDisabled">🚫 {{ $t('query.button.invalid') }}</span>
          <span v-else>🚀 {{ $t('query.button.run') }}</span>
        </button>
      </div>
      <!-- 🔹 建議與操作區 -->
      <div v-if="currentTab === 'tab1'" class="page-footer" style="margin-top: 20px">
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
      </div>
    </div>
  </TabsContainer>
</template>

<script setup>
import {computed, nextTick, reactive, ref, onMounted, onBeforeUnmount, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useI18n } from 'vue-i18n'
import TabsContainer from "@/components/common/TabsContainer.vue";
import LocationAndRegionInput from "@/main/components/geo/LocationAndRegionInput.vue";
import ZhongguSelector from "@/main/components/query/ZhongguSelector.vue";
import ZhongGuDirectInput from "@/main/components/query/ZhongGuDirectInput.vue";
import YinweiSelector from "@/main/components/query/YinweiSelector.vue";
import KeyButtonGroup from "@/main/components/query/KeyButtonGroup.vue";
import DropdownValueSelector from "@/main/components/query/DropdownValueSelector.vue";
import ChoiceSelector from "@/components/selector/ChoiceSelector.vue";
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
} from '@/main/store/store.js'
import { useQueryConfig } from '@/composables/domain/useQueryConfig.js'

import { translateResultTerm } from '@/i18n/utils/resultI18n.js'
import { readMenuBarMemory, writeMenuBarMemory } from '@/main/config/BarAndTabs/MenuBarConfig.js'
import { showWarning } from '@/utils/message.js'
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
const excludeFilterTriggerRef = reactive({ tab2: null, tab3: null })
const excludeDropdownOpen = ref(null) // 'tab2' 或 'tab3' 或 null
const excludeDropdownStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 99999
})

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

function onClickOutside(event) {
  const isInsideTrigger = [
    keyTriggerEl.value,
    tab3KeyTriggerEl.value,
    // ✨ 检查过滤器 triggers
    excludeFilterTriggerRef.tab2,
    excludeFilterTriggerRef.tab3
  ].some(el => el?.contains(event.target))

  const isInsidePanel = event.target.closest('.dropdown-panel')

  if (!isInsideTrigger && !isInsidePanel) {
    excludeDropdownOpen.value = null // ✨ 关闭过滤器下拉框
  }
}

// ✨ 過濾器相關函數
// 獲取過濾器顯示文本
function getExcludeDisplayText(tab) {
  const list = tabStates[tab]?.excludeColumns || []
  if (list.length === 0) return ''

  // ✨ 新增：将 value 转换为 label
  const labels = list.map(value => {
    const option = excludeOptions.value.find(opt => opt.value === value)
    return option ? option.label : value  // 找不到就用原值
  })

  if (labels.length > 2) {
    return `${labels.slice(0, 1).join(', ')}...`
  }
  return labels.join(', ')
}



// 判斷單項是否選中
function isExcludeSelected(value, tab) {
  const list = tabStates[tab]?.excludeColumns || []
  return list.includes(value)
}

// 切換過濾器下拉框
function toggleExcludeDropdown(tab) {
  if (buttonState.isRunning) return

  if (excludeDropdownOpen.value === tab) {
    excludeDropdownOpen.value = null
  } else {
    excludeDropdownOpen.value = tab
    nextTick(() => {
      const triggerEl = excludeFilterTriggerRef[tab]
      if (triggerEl) {
        const rect = triggerEl.getBoundingClientRect()
        excludeDropdownStyle.value = {
          position: 'absolute',
          top: `${rect.top + rect.height + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          zIndex: 99999
        }
      }
    })
  }
}

// 切換單個選項
function toggleExcludeOption(value, tab) {
  const list = tabStates[tab].excludeColumns
  const index = list.indexOf(value)

  if (index > -1) {
    list.splice(index, 1)
  } else {
    list.push(value)
  }
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

```vue
<style scoped lang="scss">
$text-color: #333;
$placeholder-color: #6a6a6a;
$white: #fff;
$dark-blue: darkblue;

$transition-fast: 0.2s;
$transition-base: 0.3s;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 内容区块动画 */
.tab-content-inner {
  width: 100%;
  max-width: 900px;
  padding: 1rem 0;
  text-align: center;
  animation: fade 0.6s ease;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.run-label {
  color: $dark-blue;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.triple-select-box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5dvw;
  width: 100%;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
}

.page-content-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5dvh;
}

.card-row {
  @include flex-center;

  flex-wrap: wrap;
  gap: 20px;
  width: 100%;

  @media (max-aspect-ratio: 1/1) {
    gap: 0;
  }
}

.dropdown-row {
  @include flex-center;

  flex-direction: column;
  width: 100%;
  white-space: nowrap;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  border-bottom: 1px solid var(--color-blue-dark);
}

.key-item {
  flex: 0 1 auto;
}

/* 键名按钮 */
.key-button {
  padding: 8px 16px;
  margin: 5px;
  font-size: 14px;
  cursor: pointer;
  background: var(--glass-light);
  border: 1px solid var(--color-primary-medium);
  border-radius: 12px;
  transition: background $transition-base ease;

  &.active {
    color: $white;
    font-weight: 600;
    background: var(--color-primary-medium2);
  }

  @media (max-width: 600px) {
    padding: 8px 10px;
    margin: 3px;
  }
}

.key-dropdown-group {
  display: flex;
  flex-wrap: wrap;
  column-gap: 30px;
}

/* 键值展示 */
.key-value-dropdown {
  display: flex;
  flex-direction: row;
  width: 135px;
  margin-top: 10px;

  .dropdown-item {
    padding: 8px 16px;
    overflow: hidden;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color $transition-fast;

    &:hover {
      background-color: var(--color-blue-very-light);
    }

    &.active {
      color: var(--color-primary);
      background-color: var(--color-primary-medium);
    }
  }
}

.key-name {
  align-self: center;
}

.dropdown-divider {
  height: 1px;
  margin: 2px 0;
  background: var(--border-divider);
}

.key-name-text {
  color: var(--color-blue-custom);
}

/* 下拉输入框包装器 */
.dropdown-wrapper {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: var(--glass-light);
  border: 1px solid var(--color-primary-medium);
  border-radius: 8px;
}

.dropdown-input {
  flex: 1;
  width: 80px;
  padding: 8px 0;
  color: $text-color;
  font-size: 14px;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: $placeholder-color;
    font-size: 12px;
    text-align: center;
  }
}

.arrow-trigger {
  @include flex-center;

  min-width: 36px;
  max-width: 36px;
  cursor: pointer;
  user-select: none;
  background: var(--color-primary-medium);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  transition: all $transition-fast ease;

  &:hover {
    background: var(--color-primary-medium2);
  }

  &:active {
    transform: scale(0.95);
  }
}

.arrow-icon {
  color: $white;
  font-size: 14px;
  font-weight: bold;
}

.select-all-item {
  color: var(--text-tertiary);
  font-size: 0.9em;
  border-bottom: 1px solid #f0f0f0;
}

.check-icon {
  display: inline-block;
  width: 16px;
}

/* Tab2 / Tab3 的“不排除”触发器 */
.dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 80px;
  padding: 6px 12px;
  margin: auto;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  background: var(--glass-light);
  border: 1px solid rgba(200, 200, 200, 0.5);
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all $transition-fast;

  &:hover {
    background: var(--glass-medium);
    border-color: var(--color-primary);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
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
</style>
```

