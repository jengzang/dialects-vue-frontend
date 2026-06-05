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
                style="height: 5dvh"
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
         <!-- 三欄選擇 -->
          <div class="triple-select-box">
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

              <div class="info-text" style="margin: 15px 0">
                <span class="info-icon">ℹ️</span>
                <span v-html="$t('query.tab3.analysisText', { card: tabStates.tab3.card, keys: selectedKeysString })"></span>
              </div>
              <!-- 🔄 輸入框 -->
              <YinweiSelector
                  ref="YinweiSelectorRef"
                  :locationRef="locationRef"
                  @update:runDisabled="setTabContentDisabled('query', 'tab3', $event)"
              />
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
    <FloatingDice
        v-if="selectedCharacterTable === 'characters'"
        :current-tab="currentTab"
        @applyConfig="handleApplyConfig"
    />
  </TabsContainer>
</template>

<script setup>
import {computed, nextTick, reactive, ref, onMounted, onBeforeUnmount, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useI18n } from 'vue-i18n'
import TabsContainer from "@/components/common/TabsContainer.vue";
import LocationAndRegionInput from "@/main/components/geo/LocationAndRegionInput.vue";
import ZhongguSelector from "@/main/components/query/ZhongguSelector.vue";
import YinweiSelector from "@/main/components/query/YinweiSelector.vue";
import FloatingDice from "@/main/components/query/FloatingDice.vue";
import KeyButtonGroup from "@/main/components/query/KeyButtonGroup.vue";
import DropdownValueSelector from "@/main/components/query/DropdownValueSelector.vue";
import ChoiceSelector from "@/components/selector/ChoiceSelector.vue";
import {
  globalPayload,
  queryStore,
  uiStore,
  isQueryButtonDisabled,
  preferredCharacterTable,
  setRunning,
  setTabContentDisabled
} from '@/main/store/store.js'
import { useQueryConfig } from '@/composables/domain/useQueryConfig.js'
import { translateResultTerm } from '@/i18n/utils/resultI18n.js'
import { showWarning } from '@/utils/message.js'
import { limitEffectiveChars } from '@/main/utils/queryLimits.js'

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
  // 如果为空或只有空白，则禁用
  setTabContentDisabled('query', 'tab1', !newVal || newVal.trim() === '')
}, { immediate: true })

function handleHanziInput(event) {
  const rawValue = event?.target?.value ?? ''
  const limited = limitEffectiveChars(rawValue, 10)

  if (rawValue !== limited.value) {
    hanziInput.value = limited.value
    if (event?.target) {
      event.target.value = limited.value
    }
  }

  if (limited.hasExtraEffectiveChars) {
    if (!hasShownCharLimitWarning.value) {
      showWarning(t('query.tab1.maxCharsWarning', { max: 10 }))
      hasShownCharLimitWarning.value = true
    }
    return
  }

  hasShownCharLimitWarning.value = false
}

// 3️⃣ 同步当前 Tab 到 store
watch(currentTab, (newTab) => {
  uiStore.currentSubTab.query = newTab
}, { immediate: true })

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

    // 這裡對應後端的 path_strings
    const pathStrings = ZhongguRef.value?.combinations || [];
    payload = {
      // 第一部分：查字參數
      path_strings: pathStrings,
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
    const selectedKeys = selectedKeysString.value.replace(/·/g, '');
    const phos = YinweiSelectorRef.value.tab3KeyInput;

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
    const chars = hanziInput.value;
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
  // 3. 纯净跳转
  await router.replace({
    path: '/menu/result'
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
  // 3. 更新鍵名 (Keys)
  if (tab === 'tab2') {
    tabStates.tab2.keys = data.keys
  }
  else {
    tabStates.tab3.keys = data.keys
  }

  // 4. 根據 Tab 更新具體的值
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
    path: `/menu/query/${sub}`
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

<style scoped>

/* 📄 內容區塊動畫 */
.tab-content-inner {
  width: 100%;
  max-width: 900px;
  animation: fade 0.6s ease;

  /* ✅ 新增這些 */
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center; /* 垂直置中 */
  padding: 1rem 0;
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

.run-label {
  font-size: 18px;
  font-weight: bold;
  color: darkblue;
  white-space: nowrap;
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

.page-content-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5dvh;
}

.card-row {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap; /* ✨ 支持自动换行 */
}
@media (max-aspect-ratio: 1/1) {
  .card-row{
    gap:0;
  }
}

.dropdown-row {
  display: flex;
  width: 100%;
  justify-content: center;
  white-space: nowrap;
  flex-direction: column;
  align-items: center;
}

.button-group{
  flex-wrap: wrap; /* 按钮换行 */
  display: flex;
  justify-content: center;
  border-bottom: 1px solid var(--color-blue-dark);  /* 添加苹果蓝色调的下划线 */
}
.key-item {
  flex: 0 1 auto; /* 保证它们的大小适应内容 */
}
/* 键名按钮样式 */
.key-button {
  padding: 8px 16px;
  border: 1px solid var(--color-primary-medium);
  border-radius: 12px;
  background: var(--glass-light);
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: 14px;
  margin: 5px;
}

@media(max-width: 600px) {
  .key-button{
    padding: 8px 10px;
    margin: 3px;
  }
}

.key-button.active {
  background: var(--color-primary-medium2);
  color: white;
  font-weight: 600;
}
.key-dropdown-group{
  display: flex;
  flex-wrap: wrap;
  column-gap:30px;
}
/* 键值展示样式 */
.key-value-dropdown {
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  width: 135px;
}
.key-name{
  align-self: center;
}

.key-value-dropdown .dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.key-value-dropdown .dropdown-item:hover {
  background-color: var(--color-blue-very-light);
}

/* 选中的键名显示的效果 */
.key-value-dropdown .dropdown-item.active {
  background-color: var(--color-primary-medium);
  color: var(--color-primary);
}

/* 下拉菜单分割线 */
.dropdown-divider {
  height: 1px;
  background: var(--border-divider);
  margin: 2px 0;
}

/* 键名文字颜色 */
.key-name-text {
  color: var(--color-blue-custom);
}

/* 下拉框包装器 */
.dropdown-wrapper {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-primary-medium);
  border-radius: 8px;
  overflow: hidden;
  background: var(--glass-light);
}

/* 输入框样式 */
.dropdown-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 0px;
  font-size: 14px;
  background: transparent;
  width: 80px;
  color: #333;
  text-align: center;
}

.dropdown-input::placeholder {
  color: #6a6a6a;
  font-size: 12px;
  text-align: center;
}

/* 箭头触发区域 */
.arrow-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--color-primary-medium);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  user-select: none;
  min-width: 36px;
  max-width: 36px;
}

.arrow-trigger:hover {
  background: var(--color-primary-medium2);
}

.arrow-trigger:active {
  transform: scale(0.95);
}

.arrow-icon {
  font-size: 14px;
  color: white;
  font-weight: bold;
}

/* 全选按钮特殊样式 */
.select-all-item {
  color: var(--text-tertiary);
  font-size: 0.9em;
  border-bottom: 1px solid #f0f0f0;
}

.check-icon {
  width: 16px;
  display: inline-block;
}

/* Dropdown 样式 */

/* Dropdown 触发器样式（用于 tab2/tab3 的"不排除"下拉框） */
.dropdown {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: var(--glass-light);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 14px;
  border: 1px solid rgba(200, 200, 200, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 80px;
  margin: auto;
  transition: all 0.2s;
  white-space: nowrap;
}

.dropdown:hover {
  background: var(--glass-medium);
  border-color: var(--color-primary);
}


</style>
