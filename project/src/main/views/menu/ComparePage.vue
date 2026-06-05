<template>
  <TabsContainer
    :tabs="tabs"
    :model-value="currentTab"
    :route-value="currentTab"
    :resolve-route="resolveTabRoute"
    v-slot="{ currentTab }"
  >
    <div class="tab-content-inner compare-page-root">
      <!-- Tab1: 比較漢字 -->
      <div v-show="currentTab === 'tab1'" class="page">
        <div class="page-content-stack tab1-layout">
          <!-- 組1 輸入 -->
          <div class="compare-group group1-style">
            <div class="group-label">{{ $t('compare.group.label1') }}</div>
            <div class="query-box">
              <input
                  class="single-char-input"
                  type="text"
                  maxlength="1"
                  :placeholder="$t('compare.placeholder.enterChar')"
                  v-model="tabStates.tab1.group1.chars"
                  @input="handleSingleCharInput('group1')"
                  autocomplete="off"
              />
            </div>
          </div>

          <!-- VS 分隔符 -->
          <!-- <div class="vs-divider">
            <div class="vs-line"></div>
            <div class="vs-badge">⚡ VS ⚡</div>
            <div class="vs-line"></div>
          </div> -->

          <!-- 組2 輸入 -->
          <div class="compare-group group2-style">
            <div class="group-label">{{ $t('compare.group.label2') }}</div>
            <div class="query-box">
              <input
                  class="single-char-input"
                  type="text"
                  maxlength="1"
                  :placeholder="$t('compare.placeholder.enterChar')"
                  v-model="tabStates.tab1.group2.chars"
                  @input="handleSingleCharInput('group2')"
                  autocomplete="off"
              />
            </div>
          </div>

          <!-- 特徵選擇 -->
          <div class="feature-selection">
            <label class="feature-label">{{ $t('compare.feature.selectLabel') }}</label>
            <div class="feature-checkboxes">
              <label class="checkbox-item">
                <input type="radio" name="tab1-feature" value="聲母" v-model="tabStates.tab1.features" />
                <span>{{ $t('compare.feature.initial') }}</span>
              </label>
              <label class="checkbox-item">
                <input type="radio" name="tab1-feature" value="韻母" v-model="tabStates.tab1.features" />
                <span>{{ $t('compare.feature.final') }}</span>
              </label>
              <label class="checkbox-item">
                <input type="radio" name="tab1-feature" value="聲調" v-model="tabStates.tab1.features" />
                <span>{{ $t('compare.feature.tone') }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab2: 比較中古 --  -->
      <div v-show="currentTab === 'tab2'" class="page" style="max-height: 50dvh;">
        <div class="page-content-stack">
          <!-- 單一中古選擇器 -->
          <div class="compare-group" style="padding:0;">
            <!-- <div class="group-label">選擇中古音條件</div> -->
            <div class="triple-select-box">
              <!-- 卡片選擇區 -->
              <div class="card-row">
                <ChoiceSelector
                  v-model="tabStates.tab2.current.card"
                  :options="cardOptions"
                  :aria-label="$t('compare.group.label1')"
                />

                <div class="dropdown"
                     :ref="(el) => excludeFilterTriggerRef.tab2_current = el"
                     @click="toggleExcludeDropdown('tab2', 'current')"
                     style="margin: 0;padding: 8px 10px;min-width: 60px;max-height:30px"
                     :class="{ disabled: buttonState.isRunning }"
                >
                  {{ getExcludeDisplayText('tab2', 'current') || $t('compare.excludeOptions.noExclude') }}
                  <span class="arrow">▾</span>
                </div>

                <Teleport to="body">
                  <div
                      v-if="excludeDropdownOpen === 'tab2_current'"
                      class="dropdown-panel choice-dropdown-panel"
                      :style="excludeDropdownStyle"
                  >
                    <div
                        class="dropdown-item choice-dropdown-item"
                        v-for="option in excludeOptions"
                        :key="option.value"
                        :class="{ active: isExcludeSelected(option.value, 'tab2', 'current') }"
                        @click="toggleExcludeOption(option.value, 'tab2', 'current')"
                    >
                      <span class="check-icon">{{ isExcludeSelected(option.value, 'tab2', 'current') ? '✓' : '' }}</span>
                      {{ option.label }}
                    </div>
                  </div>
                </Teleport>
              </div>

              <!-- 鍵名 + 鍵值 -->
              <div class="dropdown-row">
                <KeyButtonGroup
                  :available-keys="availableKeys"
                  v-model="tabStates.tab2.current.keys"
                  :exclusive-rules="exclusiveRules"
                  :single-select-keys="singleSelectKeys"
                />
                <DropdownValueSelector
                  :selected-keys="tabStates.tab2.current.keys"
                  v-model="tabStates.tab2.current.valueMap"
                  :key-value-map="keyValueMap"
                />
              </div>

          <!-- 已選列表 -->
          <div class="selected-groups-container">
            <!-- 組1已選 -->
            <div class="selected-group group1-style">
              <div class="selected-group-header">
<!--                <span>組1已選 ({{ tabStates.tab2.group1Items.length }})</span>-->
                <span>{{ $t('compare.group.label1') }}</span>
                <button class="add-btn add-to-group1" @click="addToGroup('group1')" :disabled="!canAddToGroup">
                  ➕ {{ $t('compare.button.add') }}
                </button>
              </div>
              <div class="selected-items-list">
                <div
                    v-for="(item, index) in tabStates.tab2.group1Items"
                    :key="index"
                    class="selected-item"
                >
                  <span class="item-label">{{ formatSelectedItem(item) }}</span>
                  <button class="remove-btn" @click="removeFromGroup('group1', index)">✕</button>
                </div>
                <div v-if="tabStates.tab2.group1Items.length === 0" class="empty-hint">
                  {{ $t('compare.messages.noConditionsAdded') }}
                </div>
              </div>
            </div>

            <!-- 組2已選 -->
            <div class="selected-group group2-style">
              <div class="selected-group-header">
                <span>{{ $t('compare.group.label2') }}</span>
<!--                <span>組2已選 ({{ tabStates.tab2.group2Items.length }})</span>-->
                <button class="add-btn add-to-group2" @click="addToGroup('group2')" :disabled="!canAddToGroup">
                  ➕ {{ $t('compare.button.add') }}
                </button>
              </div>
              <div class="selected-items-list">
                <div
                    v-for="(item, index) in tabStates.tab2.group2Items"
                    :key="index"
                    class="selected-item"
                >
                  <span class="item-label">{{ formatSelectedItem(item) }}</span>
                  <button class="remove-btn" @click="removeFromGroup('group2', index)">✕</button>
                </div>
                <div v-if="tabStates.tab2.group2Items.length === 0" class="empty-hint">
                  {{ $t('compare.messages.noConditionsAdded') }}
                </div>
              </div>
            </div>
          </div>

          <ZhongguSelector
              :active-keys="tabStates.tab2.current.keys"
              :value-map="tabStates.tab2.current.valueMap"
              :is-dropdown-open="excludeDropdownOpen === 'tab2_current'"
              :selected-card="tabStates.tab2.current.card"
              :exclude-columns="tabStates.tab2.current.excludeColumns"
              :table-name="selectedCharacterTable"
              ref="ZhongguRefCurrent"
          />
            </div>
          </div>
        </div>
      </div>
      <!-- Tab4: 比較調類 -->
      <div v-show="currentTab === 'tab4'" class="page">
        <div class="page-content-stack">
          <div class="tone-tip">{{ $t('compare.messages.selectTwoToneClasses') }}</div>
          <div class="compare-group">
            <!-- <div class="group-label">??????</div> -->
            <div class="tone-selection">
              <label
                v-for="(toneLabel, i) in toneClassLabels"
                :key="i + 1"
                class="tone-checkbox"
                :class="getToneCheckboxClass(i + 1)"
              >
                <input
                  type="checkbox"
                  :value="i + 1"
                  v-model="tabStates.tab4.selectedToneClasses"
                  :disabled="tabStates.tab4.selectedToneClasses.length >= 2 && !tabStates.tab4.selectedToneClasses.includes(i + 1)"
                />
                <span>{{ toneLabel }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <LocationAndRegionInput
          ref="locationRef"
          @update:runDisabled="uiStore.buttonStates.compare.isLocationDisabled = $event"
          v-model="locationModel"
          :limitContext="locationLimitContext"
      />

      <!-- 運行按鈕 -->
      <div class="run-container">
        <button
            class="run-btn"
            @click="runAction"
            :disabled="buttonState.isRunning || isRunDisabled"
            :class="{ disabled: isRunDisabled }"
        >
          <span v-if="buttonState.isRunning">🔄 {{ $t('compare.button.running') }}</span>
          <span v-else-if="isRunDisabled">🚫 {{ $t('compare.button.invalid') }}</span>
          <span v-else>🚀 {{ $t('compare.button.startCompare') }}</span>
        </button>
      </div>

      <!-- 提示區 -->
      <div v-if="currentTab === 'tab1'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('compare.messages.tab1Hint') }}</small>
      </div>
      <div v-else-if="currentTab === 'tab2'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('compare.messages.tab2Hint') }}</small>
      </div>
      <div v-else-if="currentTab === 'tab4'" class="page-footer" style="margin-top: 20px">
        <small class="hint">{{ $t('compare.messages.tab4Hint') }}</small>
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
import KeyButtonGroup from "@/main/components/query/KeyButtonGroup.vue";
import DropdownValueSelector from "@/main/components/query/DropdownValueSelector.vue";
import ChoiceSelector from "@/components/selector/ChoiceSelector.vue";
import {
  queryStore,
  uiStore,
  isCompareButtonDisabled,
  mapStore,
  preferredCharacterTable,
  setRunning,
  setTabContentDisabled,
  userStore
} from '@/main/store/store.js'
import { compareChars, compareZhongGu, compareTones } from '@/api/index.js'
import { getCoordinates } from '@/api'
import { showWarning } from '@/utils/message.js'
import { useQueryConfig } from '@/composables/domain/useQueryConfig.js'

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
  tone: 'tab4'
}
const tabToRouteSub = {
  tab1: 'char',
  tab2: 'zhonggu',
  tab4: 'tone'
}
const currentTab = computed(() => routeSubToTab[route.params.sub] || 'tab2')
const tabs = computed(() => [
  { name: 'tab1', label: t('compare.tabs.tab1') },
  { name: 'tab2', label: t('compare.tabs.tab2') },
  { name: 'tab4', label: t('compare.tabs.tab4') }
])

// Compute limit context based on current tab
const locationLimitContext = computed(() => {
  // 映射到 constants.js 中的配置 key
  return `compare_${currentTab.value}`  // 'compare_tab1', 'compare_tab2', 'compare_tab4'
})

// Tab1 state - dual input for character comparison
const hanziInput = ref({
  group1: '',
  group2: ''
})

// ✨ 過濾器相關狀態
const excludeOptions = computed(() => [
  { value: '多地位標記', label: t('compare.excludeOptions.allMulti') },
  ...(selectedCharacterTable.value === 'characters'
    ? [
        { value: '多等', label: t('compare.excludeOptions.excludeMultiGrade') },
        { value: '多韻', label: t('compare.excludeOptions.excludeMultiRime') },
        { value: '多聲母', label: t('compare.excludeOptions.excludeMultiInitial') },
        { value: '多調', label: t('compare.excludeOptions.excludeMultiTone') }
      ]
    : [])
])
const excludeFilterTriggerRef = reactive({
  tab2_current: null,  // ✅ 添加 current 的 ref
  tab2_group1: null,
  tab2_group2: null
})
const dropdownOpen = ref(null)
const currentActiveKey = ref(null)
const triggerRefs = ref({})
const keyTriggerEl = ref(null)
const excludeDropdownOpen = ref(null) // 'tab2' 或 'tab3' 或 null
const excludeDropdownStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 99999
})

const tabStates = reactive({
  tab1: {
    group1: {
      chars: ''
    },
    group2: {
      chars: ''
    },
    features: '聲母'  // Internal value in Chinese for API
  },
  tab2: {
    // 當前選擇器狀態
    current: {
      card: '韻母',  // Internal value in Chinese for API
      keys: ['攝'],
      valueMap: {},
      excludeColumns: []
    },
    // 組1已選項目列表
    group1Items: [],
    // 組2已選項目列表
    group2Items: []
  },
  tab4: {
    selectedToneClasses: []
  }
})


// Tab2 相關方法
// 檢查是否可以添加到組
const canAddToGroup = computed(() => {
  const current = tabStates.tab2.current
  // 至少要有一個 key 被選中，且該 key 有值
  return current.keys.length > 0 && current.keys.some(key => {
    const values = current.valueMap[key]
    return values && values.length > 0
  })
})

// 添加到指定組
function addToGroup(groupName) {
  const current = tabStates.tab2.current

  // 從 ZhongguRefCurrent 獲取當前的 combinations
  const combinations = ZhongguRefCurrent.value?.combinations || []

  // 獲取目標組的已有條件
  const targetGroup = groupName === 'group1' ? tabStates.tab2.group1Items : tabStates.tab2.group2Items

  // ✅ 檢查排除設置是否一致（方案C：強制統一）
  if (targetGroup.length > 0) {
    const existingExclude = targetGroup[0].excludeColumns
    const currentExclude = current.excludeColumns

    // 比較兩個數組是否相同
    const isSame = existingExclude.length === currentExclude.length &&
                   existingExclude.every(col => currentExclude.includes(col))

    if (!isSame) {
      const existingText = existingExclude.length > 0 ? existingExclude.join(', ') : t('compare.excludeOptions.noExclude')
      const currentText = currentExclude.length > 0 ? currentExclude.join(', ') : t('compare.excludeOptions.noExclude')
      showWarning(
        t('compare.messages.excludeSettingsMismatch', {
          existing: existingText,
          current: currentText
        })
      )
      return  // 不允許添加
    }
  }

  // 創建當前選擇的快照，包含 combinations
  const snapshot = {
    card: current.card,
    keys: [...current.keys],
    valueMap: JSON.parse(JSON.stringify(current.valueMap)),
    excludeColumns: [...current.excludeColumns],
    combinations: [...combinations]  // 保存 path_strings
  }

  // 添加到對應組
  targetGroup.push(snapshot)

  // console.log(`已添加到${groupName}:`, snapshot)
}

// 從組中移除
function removeFromGroup(groupName, index) {
  if (groupName === 'group1') {
    tabStates.tab2.group1Items.splice(index, 1)
  } else if (groupName === 'group2') {
    tabStates.tab2.group2Items.splice(index, 1)
  }
}

// 格式化已選項目顯示
function formatSelectedItem(item) {
  const parts = []
  // ❌ 不再顯示 card（聲韻調），因為必須相同才能比較
  // parts.push(item.card)

  item.keys.forEach(key => {
    const values = item.valueMap[key]
    if (values && values.length > 0) {
      parts.push(`${key}:${values.join('/')}`)
    }
  })

  if (item.excludeColumns && item.excludeColumns.length > 0) {
    parts.push(`排除:${item.excludeColumns.join(',')}`)
  }

  return parts.join(' | ')
}

// Tab2 disabled 狀態（由 watch group items 管理，此 ref 已棄用）

function normalizeSingleChar(value) {
  if (!value) return ''
  const compact = String(value).replace(/[\s,，]/g, '')
  return compact.slice(0, 1)
}

function handleSingleCharInput(group) {
  const current = tabStates.tab1[group].chars
  tabStates.tab1[group].chars = normalizeSingleChar(current)
}

const cards = ['聲母', '韻母', '聲調']
const toneClassLabels = computed(() => [
  t('compare.toneClasses.yinping'),
  t('compare.toneClasses.yangping'),
  t('compare.toneClasses.yinshang'),
  t('compare.toneClasses.yangshang'),
  t('compare.toneClasses.yinqu'),
  t('compare.toneClasses.yangqu'),
  t('compare.toneClasses.yinru'),
  t('compare.toneClasses.yangru'),
  t('compare.toneClasses.qingsheng'),
  t('compare.toneClasses.other')
])

// Helper function to get translated card label
const getCardLabel = (card) => {
  const cardMap = {
    '聲母': t('compare.cards.initial'),
    '韻母': t('compare.cards.final'),
    '聲調': t('compare.cards.tone')
  }
  return cardMap[card] || card
}

// 本地按鈕狀態，與 QueryPage 完全隔離
const cardOptions = computed(() =>
  cards.map((item) => ({
    value: item,
    label: getCardLabel(item)
  }))
)

const buttonState = uiStore.buttonStates.compare

// 2️⃣ 监听 Tab 1 的输入框内容
watch(() => tabStates.tab1, (newVal) => {
  const group1Valid = newVal.group1.chars && newVal.group1.chars.trim() !== ''
  const group2Valid = newVal.group2.chars && newVal.group2.chars.trim() !== ''
  const featuresValid = !!newVal.features
  setTabContentDisabled('compare', 'tab1', !(group1Valid && group2Valid && featuresValid))
}, { immediate: true, deep: true })

// 监听 Tab2：两个组都有至少一个条件才启用
watch(() => [tabStates.tab2.group1Items.length, tabStates.tab2.group2Items.length], ([g1, g2]) => {
  setTabContentDisabled('compare', 'tab2', g1 === 0 || g2 === 0)
}, { immediate: true })

// 监听 Tab 4 的调类选择
watch(() => tabStates.tab4, (newVal) => {
  const isValid = Array.isArray(newVal.selectedToneClasses) && newVal.selectedToneClasses.length === 2
  setTabContentDisabled('compare', 'tab4', !isValid)
}, { immediate: true, deep: true })

// Tab4 调类复选框颜色类
function getToneCheckboxClass(toneValue) {
  const index = tabStates.tab4.selectedToneClasses.indexOf(toneValue)
  if (index === 0) return 'tone-checkbox-green'
  if (index === 1) return 'tone-checkbox-blue'
  return ''
}

// 3️⃣ 同步当前 Tab 到 store
watch(currentTab, (newTab) => {
  uiStore.currentSubTab.compare = newTab
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

function syncCurrentSelectorWithTable() {
  const current = tabStates.tab2.current
  const nextKeys = getNormalizedKeys(current.keys)

  current.keys = nextKeys
  current.valueMap = getNormalizedValueMap(nextKeys, current.valueMap)
  current.excludeColumns = getNormalizedExcludeColumns(current.excludeColumns)
}

watch(selectedCharacterTable, (newTable, oldTable) => {
  syncCurrentSelectorWithTable()

  if (oldTable && newTable !== oldTable) {
    tabStates.tab2.group1Items = []
    tabStates.tab2.group2Items = []
  }
}, { immediate: true })

// 4️⃣ 最终计算属性：控制按钮是否禁用
const isRunDisabled = isCompareButtonDisabled

// 监听 card（聲韻調）变化，自動清空已選列表
watch(() => tabStates.tab2.current.card, (newCard, oldCard) => {
  // 只有在真正切換時才清空（避免初始化時清空）
  if (oldCard && newCard !== oldCard) {
    console.log(`🔄 聲韻調從 "${oldCard}" 切換到 "${newCard}"，清空已選列表`)
    tabStates.tab2.group1Items = []
    tabStates.tab2.group2Items = []
  }
})

const locationModel = ref({
  locations: [],
  regions: [],
  regionUsing: 'map'
})

const dropdownStyle = reactive({
  value: {
    top: '0px',
    left: '0px'
  },
  key: {
    top: '0px',
    left: '0px'
  }
})

function toggleDropdown(type,key=null) {
  // dropdownOpen.value = dropdownOpen.value === type ? null : type
  // 判断是否正在点击【已经打开】的那个下拉框
  const isClosing = (dropdownOpen.value === type) &&
      (key === null || currentActiveKey.value === key);

  if (isClosing) {
    // 🔽 关闭逻辑
    dropdownOpen.value = null
    currentActiveKey.value = null // 清空当前 Key
  } else {
    // 🔼 打开逻辑
    dropdownOpen.value = type

    // 🔥🔥🔥 关键点：这里进行了赋值！🔥🔥🔥
    currentActiveKey.value = key
    nextTick(() => {
      let triggerEl = null

      // if (type === 'value') triggerEl = valueTriggerEl.value
      if (type === 'value' && key) {
        triggerEl = triggerRefs.value[key]
        // console.log(`get in value:`, triggerEl);  // 检查是否能够正确访问 ref
      } else if (type === 'key') triggerEl = keyTriggerEl.value

      if (triggerEl) {
        const rect = triggerEl.getBoundingClientRect()
        dropdownStyle[type] = {
          position: 'absolute',
          top: `${rect.top + rect.height + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          zIndex: 99999
        }
      }
    })
  }
}

function onClickOutside(event) {
  const isInsideTrigger = [
    keyTriggerEl.value,
    // 检查动态的 triggers
    ...Object.values(triggerRefs.value),
    // ✨ 检查过滤器 triggers
    excludeFilterTriggerRef.tab2_current,
    excludeFilterTriggerRef.tab2_group1,
    excludeFilterTriggerRef.tab2_group2
  ].some(el => el?.contains(event.target))

  const isInsidePanel = event.target.closest('.dropdown-panel')

  if (!isInsideTrigger && !isInsidePanel) {
    dropdownOpen.value = null
    currentActiveKey.value = null
    excludeDropdownOpen.value = null // ✨ 关闭过滤器下拉框
  }
}

// 切换键名的选择状态
function toggleKeySelection(key, targetList) {
  // 定义有选择限制的键值及其最大选择数量
  const restrictedKeys = {
    '攝': 1,
    '韻': 1,
    '系': 1,
    '組': 1,
    '母': 1,
    '入': 1,
    '調': 1
  };

  if (!Array.isArray(targetList)) return;

  const currentLimit = restrictedKeys[key];

  if (currentLimit) {
    if (targetList.includes(key)) {
      // 移除
      const idx = targetList.indexOf(key);
      if (idx > -1) targetList.splice(idx, 1);
    } else {
      // 互斥逻辑：先处理排他
      // 注意：reactive 数组最好用 splice 修改，或者 push/filter 组合
      // 这里创建一个临时数组处理逻辑
      let newList = [...targetList];

      if (key === '系' || key === '組' || key === '母') {
        newList = newList.filter(item => !['系', '組', '母'].includes(item));
      }
      if (key === '攝' || key === '韻') {
        newList = newList.filter(item => !['攝', '韻'].includes(item));
      }
      if (key === '入' || key === '調') {
        newList = newList.filter(item => !['入', '調'].includes(item));
      }
      // 添加当前
      newList.push(key);

      // 将结果写回 reactive 数组 (清空旧的，推入新的)
      targetList.length = 0;
      targetList.push(...newList);
    }
  } else {
    // 普通多选
    const idx = targetList.indexOf(key);
    if (idx > -1) {
      targetList.splice(idx, 1);
    } else {
      targetList.push(key);
    }
  }
}


// 选择键值时的处理
function selectValue(value, key, group = 'group1') {
  const targetState = group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]
  // 确保该 key 对应的值是数组，如果之前是字符串或未定义，初始化为空数组
  if (!Array.isArray(targetState.valueMap[key])) {
    targetState.valueMap[key] = []
  }

  const list = targetState.valueMap[key]
  const index = list.indexOf(value)

  if (index > -1) {
    // 存在则移除 (取消勾选)
    list.splice(index, 1)
  } else {
    // 不存在则添加 (勾选)
    list.push(value)
  }

  // ⚠️ 注意：这里不再调用 dropdownOpen.value = null，为了允许继续多选
  // selectedValueMap.value[key] = value; // 更新选中的值
  // dropdownOpen.value = null; // 关闭下拉框
}
// 2. 新增：全选/取消全选 逻辑
function toggleSelectAll(key, group = 'group1') {
  const targetState = group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]
  const allOptions = keyValueMap.value[key] || []
  const currentSelected = targetState.valueMap[key] || []

  // 如果当前已经全选了，则清空；否则全选
  if (currentSelected.length === allOptions.length) {
    targetState.valueMap[key] = []
  } else {
    targetState.valueMap[key] = [...allOptions]
  }
}

// 3. 新增：判断是否被选中 (辅助 Template 显示样式)
function isSelected(value, key, group = 'group1') {
  const targetState = group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]
  const list = targetState.valueMap[key]
  return Array.isArray(list) && list.includes(value)
}

// 4. 新增：判断是否全选 (辅助 Template 显示全选状态)
function isAllSelected(key, group = 'group1') {
  const targetState = group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]
  const all = keyValueMap.value[key] || []
  const current = targetState.valueMap[key] || []
  return all.length > 0 && all.length === current.length
}

// 5. 新增：格式化选中的文字（显示在输入框内）
// 修改：格式化按钮文字 (超过2个显示省略号)
function getDisplayText(key, group = 'group1') {
  const targetState = group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]
  const list = targetState.valueMap[key]
  // 1. 没选 - 返回空字符串，让 placeholder 显示
  if (!list || list.length === 0) return ''
  // 2. 全选
  const allOptions = keyValueMap.value[key] || []
  if (allOptions.length > 0 && list.length === allOptions.length) {
    return '全選'
  }
  // 3. 超过三个：截取前三个 + 省略号
  if (list.length > 3) {
    return `${list.slice(0, 3).join(', ')}...`
  }
  // 4. 少于等于三个：直接显示
  return list.join(', ')
}

// ✨ 過濾器相關函數
// 獲取過濾器顯示文本
function getExcludeDisplayText(tab, group = 'group1') {
  const targetState = tab === 'tab2' ? (group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]) : null
  if (!targetState) return ''

  const list = targetState.excludeColumns || []
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
function isExcludeSelected(value, tab, group = 'group1') {
  const targetState = tab === 'tab2' ? (group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]) : null
  if (!targetState) return false

  const list = targetState.excludeColumns || []
  return list.includes(value)
}

// 切換過濾器下拉框
function toggleExcludeDropdown(tab, group = 'group1') {
  if (buttonState.isRunning) return

  const dropdownKey = `${tab}_${group}`
  if (excludeDropdownOpen.value === dropdownKey) {
    excludeDropdownOpen.value = null
  } else {
    excludeDropdownOpen.value = dropdownKey
    nextTick(() => {
      const triggerEl = excludeFilterTriggerRef[dropdownKey]
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
function toggleExcludeOption(value, tab, group = 'group1') {
  const targetState = tab === 'tab2' ? (group === 'current' ? tabStates.tab2.current : tabStates.tab2[group]) : null
  if (!targetState) return

  const list = targetState.excludeColumns
  const index = list.indexOf(value)

  if (index > -1) {
    list.splice(index, 1)
  } else {
    list.push(value)
  }
}

// isRunning 状态已移至 uiStore，不再需要本地定义
const ZhongguRef = ref(null);
const ZhongguRef1 = ref(null);  // For tab2 group1
const ZhongguRef2 = ref(null);  // For tab2 group2
const ZhongguRefCurrent = ref(null);  // For tab2 current selector

// 點擊按鈕行為
const runAction = async () => {
  setRunning('compare', true);

  try {
    // 1. 獲取地點邏輯
    function getLocation() {
      if (!locationRef.value?.selectedValue ||
          (Array.isArray(locationRef.value?.selectedValue) && locationRef.value.selectedValue.every(item => item === ''))) {
        return locationRef.value?.allLocationsString || '廣州';
      } else {
        return locationRef.value?.allLocationsString;
      }
    }

    // 2. 準備基礎參數
    const locationVal = getLocation();
    const locationList = locationVal ? [locationVal] : [];

    const regionVal = locationRef.value?.selectedValue;
    const regionList = Array.isArray(regionVal) ? regionVal : (regionVal ? [regionVal] : []);
    queryStore.locations = locationList;
    queryStore.regions = regionList;

    let compareResponse = null;
    let compareType = '';  // 記錄比較類型

    // 3. 根据 tab 调用对应的 compare API
    if (currentTab.value === 'tab1') {
      compareType = 'chars';
      // 比较汉字
      const group1Char = normalizeSingleChar(tabStates.tab1.group1.chars)
      const group2Char = normalizeSingleChar(tabStates.tab1.group2.chars)

      const params = {
        chars: [group1Char, group2Char].filter(Boolean),
        features: tabStates.tab1.features ? [tabStates.tab1.features] : [],
        locations: locationList,
        regions: regionList,
        region_mode: locationRef.value?.regionUsing || 'yindian'
      }

      compareResponse = await compareChars(params)
    }
    else if (currentTab.value === 'tab2') {
      compareType = 'zhonggu';
      // 比较中古 - 使用已選列表中的數據

      // 檢查是否有選擇項目
      if (tabStates.tab2.group1Items.length === 0 || tabStates.tab2.group2Items.length === 0) {
        // console.error('❌ 組1或組2沒有選擇任何條件')
        return
      }

      // ✅ 合併所有條件的 combinations（方案A：OR邏輯）
      const group1Combinations = tabStates.tab2.group1Items.flatMap(item => item.combinations || [])
      const group2Combinations = tabStates.tab2.group2Items.flatMap(item => item.combinations || [])

      // ✅ 排除設置：因為已經強制統一，直接取第一個即可
      const group1Exclude = tabStates.tab2.group1Items[0].excludeColumns
      const group2Exclude = tabStates.tab2.group2Items[0].excludeColumns

      // ✅ 卡片（聲韻調）：因為已經強制統一，直接取第一個即可
      const group1Card = tabStates.tab2.group1Items[0].card
      const group2Card = tabStates.tab2.group2Items[0].card

      const params = {
        path_strings1: group1Combinations,
        column1: null,
        combine_query1: false,
        exclude_columns1: group1Exclude,

        path_strings2: group2Combinations,
        column2: null,
        combine_query2: false,
        exclude_columns2: group2Exclude,

        locations: locationList,
        regions: regionList,
        features: [group1Card, group2Card],
        region_mode: locationRef.value?.regionUsing || 'yindian',
        table_name: selectedCharacterTable.value
      }

      // console.log('🔍 比較中古參數:', {
      //   組1條件數: tabStates.tab2.group1Items.length,
      //   組1組合數: group1Combinations.length,
      //   組2條件數: tabStates.tab2.group2Items.length,
      //   組2組合數: group2Combinations.length,
      //   params
      // })

      // console.log('📤 Tab2 API 參數:', params)
      compareResponse = await compareZhongGu(params)
    }
    else if (currentTab.value === 'tab4') {
      compareType = 'tones';
      // 比较调类
      const params = {
        tone_classes: [...tabStates.tab4.selectedToneClasses],
        locations: locationList,
        regions: regionList,
        region_mode: locationRef.value?.regionUsing || 'yindian'
      }

      compareResponse = await compareTones(params)
    }

    // 4. 从比较结果中提取地点列表
    // 处理不同的响应格式：chars/tones 用 results，zhonggu 用 comparison
    const resultsArray = compareResponse.results || compareResponse.comparison

    if (compareResponse && resultsArray) {
      // console.log('📊 Compare API 响应:', compareResponse)

      const locations = resultsArray.map(r => r.location)
      // console.log('📍 提取的地点列表:', locations)

      // 5. 调用 getCoordinates 获取坐标数据
      const MapData = await getCoordinates({
        locations: locations.join(','),
        regions: regionList,
        region_mode: locationRef.value?.regionUsing || 'yindian',
        iscustom: userStore.isAuthenticated && userStore.role !== 'anonymous' ? "true" : undefined,
        flag: "False"
      })
      // console.log('🗺️ 坐标数据:', MapData)

      // 6. 处理比较结果并分配颜色
      const mergedData = processCompareResults(resultsArray, MapData)
      // console.log('✨ 合并后的数据:', mergedData)
      // console.log('📦 mergedData 长度:', mergedData.length)

      // 7. 存入 mapStore
      mapStore.mapData = MapData
      mapStore.mergedData = mergedData
      mapStore.mode = 'compare'
      mapStore.compareType = compareType  // 設置比較類型

      // 根據比較類型設置不同的圖例
      if (compareType === 'chars') {
        // 漢字比較：4種狀態
        mapStore.compareGroups = {
          same: { color: '#4CAF50', label: t('compare.legend.same') },
          partial: { color: '#FFC107', label: t('compare.legend.partial') },
          diff: { color: '#F44336', label: t('compare.legend.diff') },
          unknown: { color: '#9E9E9E', label: t('compare.legend.unknown') }
        }
      } else if (compareType === 'zhonggu') {
        // 中古比較：相似度百分比
        mapStore.compareGroups = {
          same: { color: '#4CAF50', label: t('compare.legend.samePercent') },
          high_similar: { color: '#8BC34A', label: t('compare.legend.highSimilar') },
          partial: { color: '#FFC107', label: t('compare.legend.partialSimilar') },
          diff: { color: '#F44336', label: t('compare.legend.diffPercent') },
          unknown: { color: '#9E9E9E', label: t('compare.legend.unknown') }
        }
      } else if (compareType === 'tones') {
        // 調類比較：合併狀態
        mapStore.compareGroups = {
          same: { color: '#4CAF50', label: t('compare.legend.merged') },
          maybe: { color: '#8BC34A', label: t('compare.legend.maybeMerged') },  // 使用黃綠色，與中古比較的高度相似顏色一致
          diff: { color: '#F44336', label: t('compare.legend.notMerged') },
          unknown: { color: '#9E9E9E', label: t('compare.legend.unknown') }
        }
      }

      // console.log('💾 已存入 mapStore, mode:', mapStore.mode)
      // console.log('💾 mapStore.mergedData 长度:', mapStore.mergedData.length)

      // 8. 跳转到地图页面
      await router.replace({
        path: '/menu/map/view'
      });
    } else {
      // console.error('❌ Compare API 响应无效:', compareResponse)
    }

  } catch (error) {
    console.error('Compare action failed:', error)
  } finally {
    setRunning('compare', false);
  }
}

// 处理比较结果并生成地图数据
function processCompareResults(results, mapData) {
  // console.log('🔄 开始处理比较结果...')
  // console.log('📥 输入 results:', results)
  // console.log('📥 输入 mapData:', mapData)

  const mergedData = []

  // 将 coordinates_locations 转换为 Map 以便快速查找
  const coordMap = new Map()
  if (mapData && mapData.coordinates_locations) {
    mapData.coordinates_locations.forEach(item => {
      // item 格式: ["地点名", [经度, 纬度]]
      const locationName = item[0]
      const coordinate = item[1]
      coordMap.set(locationName, coordinate)
    })
  }
  // console.log('🗺️ 坐标映射表:', coordMap)

  results.forEach(result => {
    const location = result.location
    // console.log(`🔍 处理地点: ${location}`)

    // 从 coordMap 中查找坐标
    const coordinate = coordMap.get(location)
    if (!coordinate) {
      // console.warn(`⚠️ 未找到地点 ${location} 的坐标数据`)
      return
    }
    // console.log(`✅ 找到坐标:`, coordinate)

    // 检查是否有 comparisons 或 features（ZhongGu 格式直接在 result 下有 features）
    if (result.comparisons && Array.isArray(result.comparisons)) {
      // chars/tones 格式：有 comparisons 数组
      result.comparisons.forEach(comparison => {
        const pair = comparison.pair
        // console.log(`  📌 比较对: ${pair ? pair.join(' vs ') : '未知'}`)

        // 判断是 features 格式（chars）还是 comparison 格式（tones）
        if (comparison.features) {
          // chars API 格式：有多个 features
          // console.log(`  📋 使用 features 格式`)

          if (typeof comparison.features !== 'object') {
            // console.warn(`  ⚠️ features 不是对象:`, comparison.features)
            return
          }

          // 处理每个特征
          Object.entries(comparison.features).forEach(([feature, featureData]) => {
            const status = featureData.status
            // console.log(`    🔸 特征: ${feature}, 状态: ${status}`)

            const item = createComparisonItem(location, coordinate, feature, featureData.status, featureData, pair)
            if (item) {
              // console.log(`    ➕ 添加数据项:`, item)
              mergedData.push(item)
            }
          })
        } else if (comparison.comparison) {
          // tones API 格式：只有一个 comparison
          // console.log(`  📋 使用 comparison 格式`)

          const compData = comparison.comparison
          const status = compData.status
          // console.log(`    🔸 状态: ${status}`)

          const item = createComparisonItem(location, coordinate, t('compare.tabs.tab4'), status, compData, pair)
          if (item) {
            // console.log(`    ➕ 添加数据项:`, item)
            mergedData.push(item)
          }
        } else {
          // console.warn(`  ⚠️ comparison 既没有 features 也没有 comparison:`, comparison)
        }
      })
    } else if (result.features) {
      // ZhongGu 格式：直接在 result 下有 features
      // console.log(`  📋 使用 ZhongGu 格式（features 在 result 下）`)

      Object.entries(result.features).forEach(([feature, featureData]) => {
        // console.log(`    🔸 特征: ${feature}`)

        // ZhongGu 格式：featureData 包含 group1 和 group2
        if (featureData.group1 && featureData.group2) {
          const item = createZhongGuComparisonItem(location, coordinate, feature, featureData)
          if (item) {
            // console.log(`    ➕ 添加数据项:`, item)
            mergedData.push(item)
          }
        }
      })
    } else {
      // console.warn(`⚠️ 地点 ${location} 既没有 comparisons 也没有 features`)
    }
  })

  // console.log(`✅ 处理完成，共生成 ${mergedData.length} 条数据`)
  return mergedData
}

// 创建比较数据项
function formatPairDisplayValue(pair, leftValue, rightValue) {
  return `${pair[0]}: ${leftValue} vs ${pair[1]}: ${rightValue}`
}

function createComparisonItem(location, coordinate, feature, status, data, pair) {
  let color = '#999999'
  let displayValue = ''

  if (status === 'same') {
    color = '#4CAF50'
    displayValue = data.value || t('compare.legend.same')
  } else if (status === 'diff') {
    color = '#F44336'
    if (data.values) {
      const values = Object.entries(data.values)
        .map(([char, vals]) => `${char}:${vals.join('/')}`)
        .join(' vs ')
      displayValue = values
    } else if (data.t1_value || data.t2_value) {
      const t1 = data.t1_value?.join('/') || t('common.label.noData')
      const t2 = data.t2_value?.join('/') || t('common.label.noData')
      displayValue = formatPairDisplayValue(pair, t1, t2)
    } else {
      displayValue = t('compare.legend.diff')
    }
  } else if (status === 'partial') {
    color = '#FFC107'
    if (data.t1_value || data.t2_value) {
      const t1 = data.t1_value?.join('/') || t('common.label.noData')
      const t2 = data.t2_value?.join('/') || t('common.label.noData')
      displayValue = formatPairDisplayValue(pair, t1, t2)
    } else {
      displayValue = t('compare.legend.partial')
    }
  } else if (status === 'maybe') {
    color = '#FF9800'
    if (data.t1_value || data.t2_value) {
      const t1 = data.t1_value?.join('/') || t('common.label.noData')
      const t2 = data.t2_value?.join('/') || t('common.label.noData')
      displayValue = formatPairDisplayValue(pair, t1, t2)
    } else {
      displayValue = t('compare.legend.maybeMerged')
    }
  } else if (status === 'unknown') {
    color = '#9E9E9E'
    if (data.t1_value || data.t2_value) {
      const t1 = data.t1_value?.join('/') || t('common.label.noData')
      const t2 = data.t2_value?.join('/') || t('common.label.noData')
      displayValue = formatPairDisplayValue(pair, t1, t2)
    } else {
      displayValue = t('compare.legend.unknown')
    }
  }

  return {
    location: location,
    coordinate: coordinate,
    feature: feature,
    value: displayValue,
    color: color,
    status: status,
    pair: pair.join(' vs ')
  }
}

function resolveTabRoute(tabName) {
  const sub = tabToRouteSub[tabName] || 'zhonggu'
  return {
    path: `/menu/compare/${sub}`
  }
}

function createZhongGuComparisonItem(location, coordinate, feature, featureData) {
  const group1Data = featureData.group1
  const group2Data = featureData.group2

  let overlap = 0
  const group1Map = new Map()
  const group2Map = new Map()

  group1Data.values.forEach(item => {
    group1Map.set(item.value, item.percentage)
  })

  group2Data.values.forEach(item => {
    group2Map.set(item.value, item.percentage)
  })

  group1Map.forEach((percentage1, value) => {
    if (group2Map.has(value)) {
      const percentage2 = group2Map.get(value)
      overlap += Math.min(percentage1, percentage2)
    }
  })

  let color, status, statusText
  if (overlap >= 80) {
    color = '#4CAF50'
    status = 'same'
    statusText = t('compare.legend.samePercent')
  } else if (overlap >= 60) {
    color = '#8BC34A'
    status = 'high_similar'
    statusText = t('compare.legend.highSimilar')
  } else if (overlap >= 30) {
    color = '#FFC107'
    status = 'partial'
    statusText = t('compare.legend.partialSimilar')
  } else {
    color = '#F44336'
    status = 'diff'
    statusText = t('compare.legend.diffPercent')
  }

  const group1Main = group1Data.values
    .filter(v => v.percentage >= 10)
    .map(v => `${v.value}(${v.percentage.toFixed(1)}%)`)
    .join(', ')

  const group2Main = group2Data.values
    .filter(v => v.percentage >= 10)
    .map(v => `${v.value}(${v.percentage.toFixed(1)}%)`)
    .join(', ')

  const displayValue = `${t('compare.group.label1')}: ${group1Main || t('compare.results.noMainReading')}\n${t('compare.group.label2')}: ${group2Main || t('compare.results.noMainReading')}`

  return {
    location: location,
    coordinate: coordinate,
    feature: feature,
    value: displayValue,
    color: color,
    status: status,
    statusText: statusText,
    overlap: Math.round(overlap),
    pair: `${t('compare.group.label1')} vs ${t('compare.group.label2')}`,
    group1Data: group1Data,
    group2Data: group2Data
  }
}

function handleApplyConfig(data) {
  const tab = currentTab.value
  // 1. 更新卡片 (聲/韻/調)
  if (tab === 'tab2') {
    tabStates.tab2.group1.card = data.card
    tabStates.tab2.group2.card = data.card
  }

  // 2. 更新地點
  locationModel.value = {
    locations: data.loc.locations,
    regions: data.loc.regions,
    regionUsing: data.loc.regionUsing
  }
  // 3. 更新鍵名 (Keys)
  if (tab === 'tab2') {
    tabStates.tab2.group1.keys = data.keys
    tabStates.tab2.group2.keys = data.keys
  }

  // 4. 根據 Tab 更新具體的值
  if (tab === 'tab2') {
    // Tab2: 更新下拉菜單映射
    tabStates.tab2.group1.valueMap = data.valuesMap
    tabStates.tab2.group2.valueMap = data.valuesMap
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
  name: 'ComparePage' // 👈 必须加这个名字，KeepAlive 才能认出它
}
</script>

<style scoped>

.page{
  overflow-x: hidden;
}
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

.page-content-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5dvh;
}

.triple-select-box {
  display: flex;
  gap: 1.5dvw;
  width: 100%;
  justify-content: space-between;
  flex-direction: column;
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

/* ✨ 比較模式專用樣式 */
.tab1-layout {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 0.75rem;
}

.tab1-layout .compare-group {
  width: min(260px, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.tab1-layout .vs-divider {
  width: auto;
  margin: 0;
  align-self: center;
}

.tab1-layout .vs-line {
  display: none;
}

.tab1-layout .feature-selection {
  width: 100%;
  order: 3;
}

.tab1-layout .group-label {
  margin-bottom: 0;
  white-space: nowrap;
}

.tab1-layout .query-box {
  display: flex;
  align-items: center;
  margin: 0;
}

.single-char-input {
  width: 100%;
  max-width: 180px;
  height: 38px;
  border: 1px solid rgba(0, 122, 255, 0.35);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  outline: none;
}

.single-char-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.compare-group {
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(200, 200, 200, 0.3);
}

.group-label {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(0, 122, 255, 0.25));
  color: #007aff;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.group1-style .group-label {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.25));
  color: #2E7D32;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.group2-style .group-label {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(33, 150, 243, 0.25));
  color: #1565C0;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
}

.vs-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  width: 100%;
}

.vs-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #007aff, transparent);
}

.vs-badge {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(
    145deg,
    rgba(0, 122, 255, 0.32),
    rgba(64, 156, 255, 0.22)
  );
  color: #ffffff;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 6px 18px rgba(0, 122, 255, 0.28);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 6px 18px rgba(0, 122, 255, 0.28);
  }
  50% {
    transform: scale(1.05);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.42),
      0 10px 24px rgba(0, 122, 255, 0.36);
  }
}

/* 特徵選擇樣式 */

/* Tab2 添加按鈕行 */
.add-buttons-row {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 0;
}

.add-btn {
  padding: 0.8rem 2rem;
  border-radius: 12px;
  border: 2px solid;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.add-to-group1 {
  background: linear-gradient(145deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
  border-color: #4CAF50;
  color: #2E7D32;
}

.add-to-group1:hover:not(:disabled) {
  background: linear-gradient(145deg, rgba(76, 175, 80, 0.25), rgba(76, 175, 80, 0.15));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.add-to-group2 {
  background: linear-gradient(145deg, rgba(33, 150, 243, 0.15), rgba(33, 150, 243, 0.05));
  border-color: #2196F3;
  color: #1565C0;
}

.add-to-group2:hover:not(:disabled) {
  background: linear-gradient(145deg, rgba(33, 150, 243, 0.25), rgba(33, 150, 243, 0.15));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 已選列表容器 */
.selected-groups-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 0;
}

.selected-group {
  border: 2px solid rgba(0, 122, 255, 0.3);
  border-radius: 12px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
}

.selected-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #007aff;
  margin-bottom: 0.8rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);
  white-space: nowrap;
}

.selected-group.group1-style {
  border-color: rgba(76, 175, 80, 0.4);
}

.selected-group.group1-style .selected-group-header {
  color: #2E7D32;
  border-bottom-color: rgba(76, 175, 80, 0.3);
}

.selected-group.group2-style {
  border-color: rgba(33, 150, 243, 0.4);
}

.selected-group.group2-style .selected-group-header {
  color: #1565C0;
  border-bottom-color: rgba(33, 150, 243, 0.3);
}

.selected-group-header .add-btn {
  font-size: 0.85rem;
  padding: 0.4rem 0.8rem;
  white-space: nowrap;
}

.selected-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.selected-item:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(6, 56, 110, 0.4);
}

.item-label {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
  word-break: break-word;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(244, 67, 54, 0.1);
  color: #F44336;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  transform: scale(1.1);
}

.empty-hint {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  padding: 0;
  font-style: italic;
  white-space: nowrap;
}

/* 特徵選擇樣式 */
.feature-selection {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(200, 200, 200, 0.3);
}

.feature-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.feature-checkboxes {
  display: flex;
  gap: 0.8rem;
  flex-wrap: nowrap;
  justify-content: center;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 122, 255, 0.15);
}

.checkbox-item:hover {
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.3);
}

.checkbox-item input[type="checkbox"],
.checkbox-item input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
}

.checkbox-item span {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

/* 調類選擇樣式 */
.tone-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  padding: 1rem;
}

.tone-tip {
  font-size: 14px;
  color: #007aff;
  font-weight: 600;
}

.tone-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(0, 122, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s;
}

.tone-checkbox:hover {
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.5);
}

.tone-checkbox input[type="checkbox"],
.tone-checkbox input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.tone-checkbox span {
  font-size: 0.95rem;
  font-weight: 600;
  color: #007aff;
}

.tone-checkbox-green {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.tone-checkbox-green:hover {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
}

.tone-checkbox-green span {
  color: #2E7D32;
}

.tone-checkbox-blue {
  background: rgba(33, 150, 243, 0.1);
  border-color: #2196F3;
}

.tone-checkbox-blue:hover {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196F3;
}

.tone-checkbox-blue span {
  color: #1565C0;
}

/* 移動端適配 */
@media (max-width: 600px) {
  .vs-badge {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .group-label {
    font-size: 0.85rem;
    padding: 0.3rem 0.8rem;
  }

  .compare-group {
    padding: 0.8rem;
  }

  .feature-checkboxes {
    gap: 1rem;
  }

  .tone-selection {
    gap: 0.8rem;
  }

  .tone-checkbox {
    padding: 0.5rem 1rem;
  }
  .tab1-layout{
    gap:1px;
  }
}

</style>
