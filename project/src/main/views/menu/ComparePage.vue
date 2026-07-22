<template>
  <TabsContainer
    v-slot="{ currentTab }"
    :tabs="tabs"
    :model-value="currentTab"
    :route-value="currentTab"
    :resolve-route="resolveTabRoute"
  >
    <div class="tab-content-inner compare-page-root">
      <!-- Tab1: 比較漢字 -->
      <div
        v-show="currentTab === 'tab1'"
        class="page"
      >
        <div class="page-content-stack tab1-layout">
          <!-- 組1 輸入 -->
          <div class="compare-group group1-style">
            <div class="group-label">
              {{ $t('compare.group.label1') }}
            </div>
            <div class="query-box">
              <input
                v-model="tabStates.tab1.group1.chars"
                class="single-char-input"
                type="text"
                maxlength="1"
                :placeholder="$t('compare.placeholder.enterChar')"
                autocomplete="off"
                @input="handleSingleCharInput('group1')"
              >
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
            <div class="group-label">
              {{ $t('compare.group.label2') }}
            </div>
            <div class="query-box">
              <input
                v-model="tabStates.tab1.group2.chars"
                class="single-char-input"
                type="text"
                maxlength="1"
                :placeholder="$t('compare.placeholder.enterChar')"
                autocomplete="off"
                @input="handleSingleCharInput('group2')"
              >
            </div>
          </div>

          <!-- 特徵選擇 -->
          <div class="feature-selection">
            <label class="feature-label">{{ $t('compare.feature.selectLabel') }}</label>
            <RadioGroup
              v-model="tabStates.tab1.features"
              name="tab1-feature"
              :options="tab1FeatureOptions"
            />
          </div>
        </div>
      </div>

      <!-- Tab2: 比較中古 --  -->
      <div
        v-show="currentTab === 'tab2'"
        class="page"
        style="max-height: 50dvh;overflow-x: auto;"
      >
        <div class="page-content-stack">
          <!-- 單一中古選擇器 -->
          <div
            class="compare-group"
            style="padding:0;"
          >
            <!-- 直接輸入模式 -->
            <div v-if="zhongguInputMode === 'direct'" class="direct-compare-box">
              <div class="card-row">
                <ChoiceSelector
                  v-model="tabStates.tab2.current.card"
                  :options="cardOptions"
                  :aria-label="$t('compare.group.label1')"
                />
                <div
                  :ref="(el) => excludeFilterTriggerRef.tab2_current = el"
                  class="dropdown"
                  style="margin: 0;padding: 8px 10px;min-width: 60px;max-height:30px"
                  :class="{ disabled: buttonState.isRunning }"
                  @click="toggleExcludeDropdown('tab2', 'current')"
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
                      v-for="option in excludeOptions"
                      :key="option.value"
                      class="dropdown-item choice-dropdown-item"
                      :class="{ active: isExcludeSelected(option.value, 'tab2', 'current') }"
                      @click="toggleExcludeOption(option.value, 'tab2', 'current')"
                    >
                      <span class="check-icon">{{ isExcludeSelected(option.value, 'tab2', 'current') ? '✓' : '' }}</span>
                      {{ option.label }}
                    </div>
                  </div>
                </Teleport>
              </div>

              <ZhongGuDirectInput
                ref="CompareDirectInputRef"
                :exclude-columns="tabStates.tab2.current.excludeColumns"
                :table-name="selectedCharacterTable"
              />

              <div class="selected-groups-container">
                <div class="selected-group group1-style">
                  <div class="selected-group-header">
                    <span>{{ $t('compare.group.label1') }}</span>
                    <button
                      class="add-btn add-to-group1"
                      :disabled="!canAddToGroup"
                      @click="addToGroup('group1')"
                    >
                      {{ $t('compare.button.add') }}
                    </button>
                  </div>
                  <div class="selected-items-list">
                    <div
                      v-for="(item, index) in tabStates.tab2.group1Items"
                      :key="index"
                      class="selected-item"
                    >
                      <span class="item-label">{{ formatSelectedItem(item) }}</span>
                      <button
                        class="remove-btn"
                        @click="removeFromGroup('group1', index)"
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      v-if="tabStates.tab2.group1Items.length === 0"
                      class="empty-hint"
                    >
                      {{ $t('compare.messages.noConditionsAdded') }}
                    </div>
                  </div>
                </div>

                <div class="selected-group group2-style">
                  <div class="selected-group-header">
                    <span>{{ $t('compare.group.label2') }}</span>
                    <button
                      class="add-btn add-to-group2"
                      :disabled="!canAddToGroup"
                      @click="addToGroup('group2')"
                    >
                      {{ $t('compare.button.add') }}
                    </button>
                  </div>
                  <div class="selected-items-list">
                    <div
                      v-for="(item, index) in tabStates.tab2.group2Items"
                      :key="index"
                      class="selected-item"
                    >
                      <span class="item-label">{{ formatSelectedItem(item) }}</span>
                      <button
                        class="remove-btn"
                        @click="removeFromGroup('group2', index)"
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      v-if="tabStates.tab2.group2Items.length === 0"
                      class="empty-hint"
                    >
                      {{ $t('compare.messages.noConditionsAdded') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 選擇器模式 -->
            <div v-else class="triple-select-box">
              <!-- 卡片選擇區 -->
              <div class="card-row">
                <ChoiceSelector
                  v-model="tabStates.tab2.current.card"
                  :options="cardOptions"
                  :aria-label="$t('compare.group.label1')"
                />

                <div
                  :ref="(el) => excludeFilterTriggerRef.tab2_current = el"
                  class="dropdown"
                  style="margin: 0;padding: 8px 10px;min-width: 60px;max-height:30px"
                  :class="{ disabled: buttonState.isRunning }"
                  @click="toggleExcludeDropdown('tab2', 'current')"
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
                      v-for="option in excludeOptions"
                      :key="option.value"
                      class="dropdown-item choice-dropdown-item"
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
                  v-model="tabStates.tab2.current.keys"
                  :available-keys="availableKeys"
                  :exclusive-rules="exclusiveRules"
                  :single-select-keys="singleSelectKeys"
                />
                <DropdownValueSelector
                  v-model="tabStates.tab2.current.valueMap"
                  :selected-keys="tabStates.tab2.current.keys"
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
                    <button
                      class="add-btn add-to-group1"
                      :disabled="!canAddToGroup"
                      @click="addToGroup('group1')"
                    >
                      {{ $t('compare.button.add') }}
                    </button>
                  </div>
                  <div class="selected-items-list">
                    <div
                      v-for="(item, index) in tabStates.tab2.group1Items"
                      :key="index"
                      class="selected-item"
                    >
                      <span class="item-label">{{ formatSelectedItem(item) }}</span>
                      <button
                        class="remove-btn"
                        @click="removeFromGroup('group1', index)"
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      v-if="tabStates.tab2.group1Items.length === 0"
                      class="empty-hint"
                    >
                      {{ $t('compare.messages.noConditionsAdded') }}
                    </div>
                  </div>
                </div>

                <!-- 組2已選 -->
                <div class="selected-group group2-style">
                  <div class="selected-group-header">
                    <span>{{ $t('compare.group.label2') }}</span>
                    <!--                <span>組2已選 ({{ tabStates.tab2.group2Items.length }})</span>-->
                    <button
                      class="add-btn add-to-group2"
                      :disabled="!canAddToGroup"
                      @click="addToGroup('group2')"
                    >
                      {{ $t('compare.button.add') }}
                    </button>
                  </div>
                  <div class="selected-items-list">
                    <div
                      v-for="(item, index) in tabStates.tab2.group2Items"
                      :key="index"
                      class="selected-item"
                    >
                      <span class="item-label">{{ formatSelectedItem(item) }}</span>
                      <button
                        class="remove-btn"
                        @click="removeFromGroup('group2', index)"
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      v-if="tabStates.tab2.group2Items.length === 0"
                      class="empty-hint"
                    >
                      {{ $t('compare.messages.noConditionsAdded') }}
                    </div>
                  </div>
                </div>
              </div>

              <ZhongguSelector
                ref="ZhongguRefCurrent"
                :active-keys="tabStates.tab2.current.keys"
                :value-map="tabStates.tab2.current.valueMap"
                :is-dropdown-open="excludeDropdownOpen === 'tab2_current'"
                :selected-card="tabStates.tab2.current.card"
                :exclude-columns="tabStates.tab2.current.excludeColumns"
                :table-name="selectedCharacterTable"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tab4: 比較調類 -->
      <div
        v-show="currentTab === 'tab4'"
        class="page"
      >
        <div class="page-content-stack">
          <div class="tone-tip">
            {{ $t('compare.messages.selectTwoToneClasses') }}
          </div>
          <div class="compare-group">
            <div class="tone-selection">
              <label
                v-for="(toneLabel, i) in toneClassLabels"
                :key="i + 1"
                class="tone-checkbox"
                :class="getToneCheckboxClass(i + 1)"
              >
                <input
                  v-model="tabStates.tab4.selectedToneClasses"
                  type="checkbox"
                  :value="i + 1"
                  :disabled="tabStates.tab4.selectedToneClasses.length >= 2 && !tabStates.tab4.selectedToneClasses.includes(i + 1)"
                >
                <span>{{ toneLabel }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab5: 比较音值 -->
      <div
        v-show="currentTab === 'tab5'"
        class="page tab5-page"
      >
        <div class="page-content-stack">
          <!-- <div class="tone-tip">
            {{ $t('compare.messages.tab5Hint') }}
          </div> -->
          <div class="compare-group tab5-location-group">
            <div class="tab5-location-control-layout">
              <div class="tab5-location-input">
                <LocationMultiInput
                  v-model="tabStates.tab5.locations"
                  :max-locations="5"
                  @update:matched-locations="tabStates.tab5.matchedLocations = $event"
                />
              </div>

              <div
                class="tab5-sankey-controls"
                :aria-label="t('compare.sankeyControls.title', '桑基图操作')"
              >
                <div class="tab5-sankey-control-row">
                  <CheckBox
                    v-model="tabStates.tab5.enableLinkOptimization"
                    :label="t('compare.sankeyControls.optimizeLinks', '优化连线')"
                    :font-size="12"
                  />

                  <CheckBox
                    v-model="tabStates.tab5.ignorePolyphonicChars"
                    :label="t('compare.sankeyControls.ignorePolyphonicChars', '忽略多音字')"
                    :font-size="12"
                  />
                </div>

                <label class="tab5-sankey-slider">
                  <span class="tab5-sankey-slider-label">
                    {{ t('compare.sankeyControls.minLinkCharCount', '连线最少字数') }}
                    <strong>{{ tabStates.tab5.minLinkCharCountDraft }}</strong>
                  </span>
                  <input
                    v-model.number="tabStates.tab5.minLinkCharCountDraft"
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    :style="{ '--progress': (tabStates.tab5.minLinkCharCountDraft / 50 * 100) + '%' }"
                    @change="scheduleTab5SankeyFilterApply"
                  >
                </label>

                <label class="tab5-sankey-slider">
                  <span class="tab5-sankey-slider-label">
                    {{ t('compare.sankeyControls.minNodeCharCount', '节点最少字数') }}
                    <strong>{{ tabStates.tab5.minNodeCharCountDraft }}</strong>
                  </span>
                  <input
                    v-model.number="tabStates.tab5.minNodeCharCountDraft"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    :style="{ '--progress': (tabStates.tab5.minNodeCharCountDraft / 100 * 100) + '%' }"
                    @change="scheduleTab5SankeyFilterApply"
                  >
                </label>
              </div>
            </div>
          </div>
        </div>
        <PhoneticCompare
          :query-locations="tabStates.tab5.queryLocations"
          :enable-link-optimization="tabStates.tab5.enableLinkOptimization"
          :ignore-polyphonic-chars="tabStates.tab5.ignorePolyphonicChars"
          :min-link-char-count="tabStates.tab5.minLinkCharCount"
          :min-node-char-count="tabStates.tab5.minNodeCharCount"
        />
      </div>

      <LocationAndRegionInput
        v-show="currentTab !== 'tab5'"
        ref="locationRef"
        v-model="locationModel"
        :limit-context="locationLimitContext"
        @update:run-disabled="uiStore.buttonStates.compare.isLocationDisabled = $event"
      />

      <!-- 運行按鈕 -->
      <div class="run-container">
        <!-- Tab1, Tab2, Tab4 运行按钮 -->
        <button
          v-if="currentTab !== 'tab5'"
          class="run-btn"
          :disabled="buttonState.isRunning || isRunDisabled"
          :class="{ disabled: isRunDisabled }"
          @click="runAction"
        >
          <span v-if="buttonState.isRunning">🔄 {{ $t('compare.button.running') }}</span>
          <span v-else-if="isRunDisabled">🚫 {{ $t('compare.button.invalid') }}</span>
          <span v-else>🚀 {{ $t('compare.button.startCompare') }}</span>
        </button>

        <!-- Tab5 独立运行按钮 -->
        <button
          v-else
          class="run-btn"
          :disabled="buttonState.isRunning || isTab5RunDisabled"
          :class="{ disabled: isTab5RunDisabled }"
          @click="runTab5Action"
        >
          <span v-if="buttonState.isRunning">🔄 {{ $t('compare.button.running') }}</span>
          <span v-else-if="isTab5RunDisabled">🚫 {{ $t('compare.button.invalid') }}</span>
          <span v-else>🚀 {{ $t('compare.button.startCompare') }}</span>
        </button>
      </div>

      <!-- 提示區 -->
      <div
        v-if="currentTab === 'tab1'"
        class="page-footer"
        style="margin-top: 20px"
      >
        <small class="hint">{{ $t('compare.messages.tab1Hint') }}</small>
      </div>
      <div
        v-else-if="currentTab === 'tab2'"
        class="page-footer"
        style="margin-top: 20px"
      >
        <small class="hint">{{ $t('compare.messages.tab2Hint') }}</small>
      </div>
      <div
        v-else-if="currentTab === 'tab4'"
        class="page-footer"
        style="margin-top: 20px"
      >
        <small class="hint">{{ $t('compare.messages.tab4Hint') }}</small>
      </div>
      <div
        v-else-if="currentTab === 'tab5'"
        class="page-footer"
        style="margin-top: 20px"
      >
        <small class="hint">{{ $t('compare.messages.tab5Hint') }}</small>
      </div>
    </div>
  </TabsContainer>
</template>

<script setup>
import { computed, nextTick, reactive, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import TabsContainer from "@/components/common/TabsContainer.vue";
import LocationAndRegionInput from "@/main/components/geo/LocationAndRegionInput.vue";
import LocationMultiInput from "@/main/components/geo/LocationMultiInput.vue";
import PhoneticCompare from "@/main/components/pho/PhoneticCompare.vue";
import ZhongguSelector from "@/main/components/query/ZhongguSelector.vue";
import ZhongGuDirectInput from "@/main/components/query/ZhongGuDirectInput.vue";
import KeyButtonGroup from "@/main/components/query/KeyButtonGroup.vue";
import RadioGroup from '@/components/selector/RadioGroup.vue';
import DropdownValueSelector from "@/main/components/query/DropdownValueSelector.vue";
import ChoiceSelector from "@/components/selector/ChoiceSelector.vue";
import CheckBox from "@/components/selector/CheckBox.vue";
import {
  queryStore,
  uiStore,
  isCompareButtonDisabled,
  mapStore,
  preferredCharacterTable,
  setRunning,
  setTabContentDisabled,
  userStore,
  tutorialAssistState,
  clearTutorialAssistRequest,
  zhongguInputMode,
} from '@/main/store/store.js'
import { compareChars, compareZhongGu, compareTones } from '@/api/index.js'
import { getCoordinates } from '@/api'
import { requestMapFitView } from '@/utils/map/MapData.js'
import { showWarning } from '@/utils/ui/message.js'
import { useQueryConfig } from '@/composables/data/useQueryConfig.js'

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
  tone: 'tab4',
  phonetic: 'tab5'
}
const tabToRouteSub = {
  tab1: 'char',
  tab2: 'zhonggu',
  tab4: 'tone',
  tab5: 'phonetic'
}
const currentTab = computed(() => routeSubToTab[route.params.sub] || 'tab2')
const tabs = computed(() => [
  { name: 'tab1', label: t('compare.tabs.tab1') },
  { name: 'tab2', label: t('compare.tabs.tab2') },
  { name: 'tab4', label: t('compare.tabs.tab4') },
  { name: 'tab5', label: t('compare.tabs.tab5') }
])

// Compute limit context based on current tab
const locationLimitContext = computed(() => {
  // 映射到 constants.js 中的配置 key
  return `compare_${currentTab.value}`  // 'compare_tab1', 'compare_tab2', 'compare_tab4', 'compare_tab5'
})

const tab1FeatureOptions = computed(() => [
  {
    value: '聲母',
    label: t('compare.feature.initial')
  },
  {
    value: '韻母',
    label: t('compare.feature.final')
  },
  {
    value: '聲調',
    label: t('compare.feature.tone')
  }
])

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
  },
  tab5: {
    locations: [],
    matchedLocations: [],
    queryLocations: [],

    enableLinkOptimization: false,
    ignorePolyphonicChars: false,

    // 真正传给 PhoneticCompare 的值
    minLinkCharCount: 3,
    minNodeCharCount: 10,

    // 滑块拖动时的临时显示值
    minLinkCharCountDraft: 3,
    minNodeCharCountDraft: 10
  }
})

// Tab2 相關方法
// 檢查是否可以添加到組
const canAddToGroup = computed(() => {
  if (zhongguInputMode.value === 'direct') {
    const ref = CompareDirectInputRef.value
    if (!ref) return false
    const ps = ref.pathStrings || []
    const cs = ref.chars || ''
    return ps.length > 0 || (cs && cs.length > 0)
  }
  const current = tabStates.tab2.current
  return current.keys.length > 0 && current.keys.some(key => {
    const values = current.valueMap[key]
    return values && values.length > 0
  })
})

// 添加到指定組
function addToGroup(groupName) {
  const current = tabStates.tab2.current
  const targetGroup = groupName === 'group1' ? tabStates.tab2.group1Items : tabStates.tab2.group2Items

  if (zhongguInputMode.value === 'direct') {
    const ref = CompareDirectInputRef.value
    if (!ref) return
    const pathStrings = ref.pathStrings || []
    const chars = ref.chars || ''

    const snapshot = {
      type: 'direct',
      card: current.card,
      pathStrings: [...pathStrings],
      chars,
      excludeColumns: [...current.excludeColumns]
    }
    targetGroup.push(snapshot)
    return
  }

  // 從 ZhongguRefCurrent 獲取當前的 combinations
  const combinations = ZhongguRefCurrent.value?.combinations || []

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
      return
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
  if (item.type === 'direct') {
    const parts = []
    if (item.pathStrings && item.pathStrings.length > 0) {
      parts.push(item.pathStrings.map(s => {
        const matches = [...s.matchAll(/\[(.*?)]\{(.*?)\}/g)]
        return matches.map(m => `${m[1]}${m[2]}`).join('·')
      }).join(', '))
    }
    if (item.chars && item.chars.length > 0) {
      parts.push(item.chars)
    }
    if (item.excludeColumns && item.excludeColumns.length > 0) {
      parts.push(`排除:${item.excludeColumns.join(',')}`)
    }
    return parts.join(' | ') || '(空)'
  }

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
  t('compare.toneClasses.other'),
  t('compare.toneClasses.qingsheng'),
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

const CompareDirectInputRef = ref(null)

// 监听 Tab2：两个组都有至少一个条件才启用
watch(() => {
  return [tabStates.tab2.group1Items.length, tabStates.tab2.group2Items.length]
}, ([g1, g2]) => {
  setTabContentDisabled('compare', 'tab2', g1 === 0 || g2 === 0)
}, { immediate: true, deep: true })

// 监听 Tab 4 的调类选择
watch(() => tabStates.tab4, (newVal) => {
  const isValid = Array.isArray(newVal.selectedToneClasses) && newVal.selectedToneClasses.length === 2
  setTabContentDisabled('compare', 'tab4', !isValid)
}, { immediate: true, deep: true })

// 监听 Tab5：有地點輸入即可啟用
watch(() => tabStates.tab5.matchedLocations, (newLocations) => {
  setTabContentDisabled('compare', 'tab5', !Array.isArray(newLocations) || newLocations.length < 2 || newLocations.length > 5)
}, { immediate: true })


// Tab4 调类复选框颜色类
function getToneCheckboxClass(toneValue) {
  const index = tabStates.tab4.selectedToneClasses.indexOf(toneValue)
  if (index === 0) return 'tone-checkbox-green'
  if (index === 1) return 'tone-checkbox-blue'
  return ''
}

// 切換輸入模式時清空 tab2 已選內容
watch(zhongguInputMode, () => {
  tabStates.tab2.current = {
    card: '韻母',
    keys: ['攝'],
    valueMap: {},
    excludeColumns: []
  }
  tabStates.tab2.group1Items = []
  tabStates.tab2.group2Items = []
})

// 3️⃣ 同步当前 Tab 到 store
watch(currentTab, (newTab) => {
  uiStore.currentSubTab.compare = newTab
}, { immediate: true })

watch(
  () => tutorialAssistState.requestToken,
  (token) => {
    if (!token || !tutorialAssistState.payload) {
      return
    }

    if (tutorialAssistState.target === 'compare:tab1' && currentTab.value === 'tab1') {
      const payload = tutorialAssistState.payload
      tabStates.tab1.group1.chars = normalizeSingleChar(payload.group1Char)
      tabStates.tab1.group2.chars = normalizeSingleChar(payload.group2Char)
      tabStates.tab1.features = payload.feature || '聲母'
      locationModel.value = {
        locations: payload.loc?.locations || [],
        regions: payload.loc?.regions || [],
        regionUsing: payload.loc?.regionUsing || 'yindian'
      }
      clearTutorialAssistRequest()
      return
    }

    if (tutorialAssistState.target === 'compare:tab2' && currentTab.value === 'tab2') {
      const payload = tutorialAssistState.payload
      tabStates.tab2.current = JSON.parse(JSON.stringify(payload.current))
      tabStates.tab2.group1Items = JSON.parse(JSON.stringify(payload.group1Items || []))
      tabStates.tab2.group2Items = JSON.parse(JSON.stringify(payload.group2Items || []))
      locationModel.value = {
        locations: payload.loc?.locations || [],
        regions: payload.loc?.regions || [],
        regionUsing: payload.loc?.regionUsing || 'yindian'
      }
      clearTutorialAssistRequest()
      return
    }

    if (tutorialAssistState.target === 'compare:tab4' && currentTab.value === 'tab4') {
      const payload = tutorialAssistState.payload
      tabStates.tab4.selectedToneClasses = [...(payload.selectedToneClasses || [])]
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

// tab5 独立的按钮禁用逻辑（2~5个地点）
const isTab5RunDisabled = computed(() => {
  const locs = tabStates.tab5.matchedLocations
  return !Array.isArray(locs) || locs.length < 2 || locs.length > 5
})

let tab5SankeyFilterTimer = null

function scheduleTab5SankeyFilterApply() {
  if (tab5SankeyFilterTimer) {
    clearTimeout(tab5SankeyFilterTimer)
  }

  tab5SankeyFilterTimer = setTimeout(() => {
    tabStates.tab5.minLinkCharCount = tabStates.tab5.minLinkCharCountDraft
    tabStates.tab5.minNodeCharCount = tabStates.tab5.minNodeCharCountDraft
    tab5SankeyFilterTimer = null
  }, 200)
}

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

const ZhongguRef = ref(null);
const ZhongguRef1 = ref(null);  // For tab2 group1
const ZhongguRef2 = ref(null);  // For tab2 group2
const ZhongguRefCurrent = ref(null);  // For tab2 current selector
// Tab5 独立的运行逻辑
const runTab5Action = () => {
  if (isTab5RunDisabled.value) return

  if (!userStore.authReady) {
    return
  }

  if (!userStore.isAuthenticated) {
    showWarning(t('user.dataPage.messages.authRequired'))
    router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
    return
  }

  tabStates.tab5.queryLocations = [...tabStates.tab5.matchedLocations]
}

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

      let params

      if (zhongguInputMode.value === 'direct') {
        if (tabStates.tab2.group1Items.length === 0 || tabStates.tab2.group2Items.length === 0) {
          return
        }

        const group1PathStrings = tabStates.tab2.group1Items.flatMap(item => item.pathStrings || [])
        const group1Chars = tabStates.tab2.group1Items.map(item => item.chars || '').filter(Boolean).join('')
        const group2PathStrings = tabStates.tab2.group2Items.flatMap(item => item.pathStrings || [])
        const group2Chars = tabStates.tab2.group2Items.map(item => item.chars || '').filter(Boolean).join('')

        const group1Exclude = tabStates.tab2.group1Items[0].excludeColumns
        const group2Exclude = tabStates.tab2.group2Items[0].excludeColumns
        const group1Card = tabStates.tab2.group1Items[0].card
        const group2Card = tabStates.tab2.group2Items[0].card

        params = {
          path_strings1: group1PathStrings,
          chars1: group1Chars ? [...group1Chars] : [],
          column1: null,
          combine_query1: false,
          exclude_columns1: group1Exclude,

          path_strings2: group2PathStrings,
          chars2: group2Chars ? [...group2Chars] : [],
          column2: null,
          combine_query2: false,
          exclude_columns2: group2Exclude,

          locations: locationList,
          regions: regionList,
          features: [group1Card, group2Card],
          region_mode: locationRef.value?.regionUsing || 'yindian',
          table_name: selectedCharacterTable.value
        }
      } else {
        if (tabStates.tab2.group1Items.length === 0 || tabStates.tab2.group2Items.length === 0) {
          return
        }

        const group1Combinations = tabStates.tab2.group1Items.flatMap(item => item.combinations || [])
        const group2Combinations = tabStates.tab2.group2Items.flatMap(item => item.combinations || [])

        const group1Exclude = tabStates.tab2.group1Items[0].excludeColumns
        const group2Exclude = tabStates.tab2.group2Items[0].excludeColumns

        const group1Card = tabStates.tab2.group1Items[0].card
        const group2Card = tabStates.tab2.group2Items[0].card

        params = {
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
      }

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

      // const locations = resultsArray.map(r => r.location)
      // console.log('📍 提取的地点列表:', locations)

      // 5. 调用 getCoordinates 获取坐标数据
      const MapData = await getCoordinates({
        locations: locationList,
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
      requestMapFitView()

      // 根據比較類型設置不同的圖例
      if (compareType === 'chars') {
        // 漢字比較：4種狀態
        mapStore.compareGroups = {
          same: { color: 'var(--color-success)', label: t('compare.legend.same') },
          partial: { color: 'var(--color-warning)', label: t('compare.legend.partial') },
          diff: { color: 'var(--color-error)', label: t('compare.legend.diff') },
          unknown: { color: 'var(--text-lightest)', label: t('compare.legend.unknown') }
        }
      } else if (compareType === 'zhonggu') {
        // 中古比較：相似度百分比
        mapStore.compareGroups = {
          same: { color: 'var(--color-success)', label: t('compare.legend.samePercent') },
          high_similar: { color: 'var(--text-slate)', label: t('compare.legend.highSimilar') },
          partial: { color: 'var(--color-warning)', label: t('compare.legend.partialSimilar') },
          diff: { color: 'var(--color-error)', label: t('compare.legend.diffPercent') },
          unknown: { color: 'var(--text-lightest)', label: t('compare.legend.unknown') }
        }
      } else if (compareType === 'tones') {
        // 調類比較：合併狀態
        mapStore.compareGroups = {
          same: { color: 'var(--color-success)', label: t('compare.legend.merged') },
          maybe: { color: 'var(--text-slate)', label: t('compare.legend.maybeMerged') },  // 使用中性色 token，保持与其他状态一致的 token 约束
          diff: { color: 'var(--color-error)', label: t('compare.legend.notMerged') },
          unknown: { color: 'var(--text-lightest)', label: t('compare.legend.unknown') }
        }
      }

      // console.log('💾 已存入 mapStore, mode:', mapStore.mode)
      // console.log('💾 mapStore.mergedData 长度:', mapStore.mergedData.length)

      // 8. 跳转到地图页面
      await router.replace({
        path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view')
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

  results.forEach(result => {
    const location = result.location

    // 从 coordMap 中查找坐标
    const coordinate = coordMap.get(location)
    if (!coordinate) {
      return
    }

    // 检查是否有 comparisons 或 features（ZhongGu 格式直接在 result 下有 features）
    if (result.comparisons && Array.isArray(result.comparisons)) {
      // chars/tones 格式：有 comparisons 数组
      result.comparisons.forEach(comparison => {
        const pair = comparison.pair

        if (comparison.features) {
          if (typeof comparison.features !== 'object') {
            return
          }

          // 处理每个特征
          Object.entries(comparison.features).forEach(([feature, featureData]) => {
            const item = createComparisonItem(location, coordinate, feature, featureData.status, featureData, pair)
            if (item) {
              mergedData.push(item)
            }
          })
        } else if (comparison.comparison) {
          const compData = comparison.comparison
          const status = compData.status

          const item = createComparisonItem(location, coordinate, t('compare.tabs.tab4'), status, compData, pair)
          if (item) {
            mergedData.push(item)
          }
        } else {
          // console.warn(`  ⚠️ comparison 既没有 features 也没有 comparison:`, comparison)
        }
      })
    } else if (result.features) {
      Object.entries(result.features).forEach(([feature, featureData]) => {
        if (featureData.group1 && featureData.group2) {
          const item = createZhongGuComparisonItem(location, coordinate, feature, featureData)
          if (item) {
            mergedData.push(item)
          }
        }
      })
    }
  })

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
    color = 'var(--color-success)'
    displayValue = data.value || t('compare.legend.same')
  } else if (status === 'diff') {
    color = 'var(--color-error)'
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
    color = 'var(--color-warning)'
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
    path: buildLocalePath(resolveRouteLocale(route), `/menu/compare/${sub}`)
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
    color = 'var(--color-success)'
    status = 'same'
    statusText = t('compare.legend.samePercent')
  } else if (overlap >= 60) {
    color = '#8BC34A'
    status = 'high_similar'
    statusText = t('compare.legend.highSimilar')
  } else if (overlap >= 30) {
    color = 'var(--color-warning)'
    status = 'partial'
    statusText = t('compare.legend.partialSimilar')
  } else {
    color = 'var(--color-error)'
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

  if (tab5SankeyFilterTimer) {
    clearTimeout(tab5SankeyFilterTimer)
    tab5SankeyFilterTimer = null
  }
})
</script>

<script>
export default {
  name: 'ComparePage' // 👈 必须加这个名字，KeepAlive 才能认出它
}
</script>



<style scoped lang="scss">

$primary: var(--color-primary);
$group1-primary: #4caf50;
$group1-text: #2e7d32;
$group2-primary: #2196f3;
$group2-text: #1565c0;
$danger: #f44336;
$text-primary: var(--text-dark);
$text-muted: var(--text-lightest);

/* 页面主体 */
.tab-content-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  padding: 1rem 0;
  text-align: center;
  animation: fade 0.6s ease;
}

.page {
  max-width: 900px;
}

.page-content-stack {
  @include flex-col;
  align-items: center;
  gap: 1.5dvh;
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

/* Tab2 选择器布局 */
.triple-select-box {
  width: 100%;
  max-width: 90dvw;
  @include flex-col;
  justify-content: space-between;
  gap: 1.5dvw;
}

.card-row {
  width: 100%;
  @include flex-center;
  flex-wrap: wrap;
  gap: 20px;
}

.dropdown-row {
  width: 100%;
  @include flex-col;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

/* 排除条件下拉框 */
.dropdown {
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: auto;
  padding: 6px 12px;
  background: var(--glass-30);
  @include glass-blur;
  border: 1px solid rgba(var(--color-silver-rgb), 0.5);
  border-radius: var(--radius-md);
  white-space: nowrap;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--glass-60);
    border-color: var(--color-primary);
  }
}

.check-icon {
  display: inline-block;
  width: 16px;
}

/* Tab1 汉字比较 */
.tab1-layout {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 0.75rem;

  .compare-group {
    width: min(260px, 100%);
    @include flex-center;
    gap: 0.6rem;
  }

  .feature-selection {
    width: 100%;
    order: 3;
  }

  .group-label {
    margin-bottom: 0;
    white-space: nowrap;
  }

  .query-box {
    display: flex;
    align-items: center;
    margin: 0;
  }
}

.single-char-input {
  width: 100%;
  max-width: 180px;
  height: 38px;
  color: var(--text-primary);
  background: var(--bg-white);
  border: 1px solid rgba(var(--color-primary-rgb), 0.35);
  border-radius: var(--radius-sm2);
  outline: none;
  text-align: center;
  font-size: 16px;
  font-weight: 600;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
  }
}

.compare-group {
  padding: 1rem;
  border-radius: var(--radius-md);
  @include glass-blur;
}

.group-label {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.4rem 1rem;
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb), 0.15),
    rgba(var(--color-primary-rgb), 0.25)
  );
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2);
  color: $primary;
  font-size: 0.95rem;
  font-weight: 600;
}

.group1-style {
  .group-label {
    background: linear-gradient(
      135deg,
      rgba(var(--color-success-rgb), 0.15),
      rgba(var(--color-success-rgb), 0.25)
    );
    box-shadow: 0 2px 8px rgba(var(--color-success-rgb), 0.2);
    color: $group1-text;
  }
}

.group2-style {
  .group-label {
    background: linear-gradient(
      135deg,
      rgba(33, 150, 243, 0.15),
      rgba(33, 150, 243, 0.25)
    );
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
    color: $group2-text;
  }
}

/* Tab2 添加按钮 */
.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  border: 2px solid;
  border-radius: var(--radius-md);
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.add-to-group1 {
  background: linear-gradient(
    145deg,
    rgba(var(--color-success-rgb), 0.25),
    rgba(var(--color-success-rgb), 0.2)
  );
  border-color: $group1-primary;
  color: $group1-text;

  &:hover:not(:disabled) {
    background: linear-gradient(
      145deg,
      rgba(var(--color-success-rgb), 0.4),
      rgba(var(--color-success-rgb), 0.3)
    );
    box-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.3);
    transform: translateY(-2px);
  }
}

.add-to-group2 {
  background: linear-gradient(
    145deg,
    rgba(33, 150, 243, 0.25),
    rgba(33, 150, 243, 0.2)
  );
  border-color: $group2-primary;
  color: $group2-text;

  &:hover:not(:disabled) {
    background: linear-gradient(
      145deg,
      rgba(33, 150, 243, 0.4),
      rgba(33, 150, 243, 0.3)
    );
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    transform: translateY(-2px);
  }
}

/* Tab2 已选条件 */
.selected-groups-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 90dvw;
  margin-top: 0;
}

.selected-group {
  max-width: 38dvw;
  padding: 1rem;
  background: var(--glass-50);
  border: 2px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: var(--radius-md);

  &.group1-style {
    border-color: rgba(var(--color-success-rgb), 0.7);

    .selected-group-header {
      border-bottom-color: rgba(var(--color-success-rgb), 0.3);
      color: $group1-text;
    }
  }

  &.group2-style {
    border-color: rgba(33, 150, 243, 0.7);

    .selected-group-header {
      border-bottom-color: rgba(33, 150, 243, 0.3);
      color: $group2-text;
    }
  }
}

.selected-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(var(--color-primary-rgb), 0.2);
  white-space: nowrap;
  color: $primary;
  font-size: 1.1rem;
  font-weight: 700;

  .add-btn {
    padding: 0.4rem 0.8rem;
    white-space: nowrap;
    font-size: 0.85rem;
  }
}

.selected-items-list {
  @include flex-col;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  background: var(--bg-white);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-sm2);
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-white);
    border-color: rgba(var(--color-primary-rgb), 0.4);
  }
}

.item-label {
  flex: 1;
  color: $text-primary;
  font-size: 0.9rem;
  word-break: break-word;
}

.remove-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  background: rgba(244, 67, 54, 0.1);
  border: none;
  border-radius: var(--radius-full);
  color: $danger;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  @include flex-center;

  &:hover {
    background: rgba(244, 67, 54, 0.2);
    transform: scale(1.1);
  }
}

.empty-hint {
  padding: 0;
  white-space: nowrap;
  text-align: center;
  color: $text-muted;
  font-size: 0.9rem;
  font-style: italic;
}

/* Tab1 特征选择 */
.feature-selection {
  width: 100%;
  padding: 0.3rem 0.4rem;
  border-radius: var(--radius-sm2);
}

.feature-label {
  display: block;
  color: $text-primary;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Tab4 调类选择 */
.tone-tip {
  color: $primary;
  font-size: 14px;
  font-weight: 600;
}

.tone-selection {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
}

.tone-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--glass-70);
  border: 2px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.1);
    border-color: rgba(var(--color-primary-rgb), 0.5);
  }

  input {
    &[type='checkbox'],
    &[type='radio'] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      color-scheme: light;
    }
  }

  span {
    color: $primary;
    font-size: 0.95rem;
    font-weight: 600;
  }

  &-green {
    background: rgba(var(--color-success-rgb), 0.1);
    border-color: $group1-primary;

    &:hover {
      background: rgba(var(--color-success-rgb), 0.2);
      border-color: $group1-primary;
    }

    span {
      color: $group1-text;
    }
  }

  &-blue {
    background: rgba(33, 150, 243, 0.1);
    border-color: $group2-primary;

    &:hover {
      background: rgba(33, 150, 243, 0.2);
      border-color: $group2-primary;
    }

    span {
      color: $group2-text;
    }
  }
}

/* Tab5 音值比较 */
.tab5 {
  &-page {
    width: 93dvw;
    max-width: none;
    max-height: none;
    flex-direction: column;
    align-items: center;
  }

  &-location-group {
    width: 100%;
    max-width: 760px;
    padding: 0;
    border: none;
    text-align: left;
  }

  &-location-control-layout {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 14px;
  }

  &-location-input {
    min-width: 0;
  }

  &-sankey-controls {
    flex: 0 0 190px;
    @include flex-col;
    justify-content: center;
    gap: 8px;
    padding: 4px 10px;
    background: var(--glass-30);
    border: 1px solid rgba(var(--color-silver-rgb), 0.35);
    border-radius: var(--radius-md);
  }

  &-sankey-control-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 12px;
  }

  &-sankey-slider {
    @include flex-col;
    gap: 1px;
    color: var(--text-secondary, var(--text-tertiary));
    font-size: 12px;
    line-height: 1.35;

    input[type='range'] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      background: transparent;
      cursor: pointer;

      &::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--color-primary) 0%,
          var(--color-primary) var(--progress, 0%),
          var(--bg-hover-strong) var(--progress, 0%),
          var(--bg-hover-strong) 100%
        );
      }

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--color-primary);
        margin-top: -5px;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;

        &:hover {
          background: var(--color-primary-hover);
          box-shadow: 0 0 6px var(--color-primary-shadow);
        }
      }

      &::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--color-primary) 0%,
          var(--color-primary) var(--progress, 0%),
          var(--bg-hover-strong) var(--progress, 0%),
          var(--bg-hover-strong) 100%
        );
      }

      &::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--color-primary);
        border: none;
        cursor: pointer;
      }
    }
  }

  &-sankey-slider-label {
    display: flex;
    justify-content: space-between;
    gap: 8px;

    strong {
      color: var(--color-primary, #{$primary});
      font-weight: 700;
    }
  }
}

/* 窄屏 */
@media (max-width: 600px) {
  .triple-select-box {
    flex-wrap: wrap;
  }
}

@media (max-aspect-ratio: #{1 / 1}) {
  .card-row {
    gap: 0;
  }

  .group-label {
    padding: 0.3rem 0.8rem;
    font-size: 0.85rem;
  }

  .compare-group {
    padding: 0.8rem;
  }

  .page {
    padding: 0.5rem !important;
  }

  .selected-groups-container {
    gap: 1rem;
  }

  .tone-selection {
    gap: 0.8rem;
    padding: 0.5rem;
  }

  .tone-checkbox {
    padding: 0.5rem 1rem;
  }

  .tab1-layout {
    gap: 1px;
  }

  .tab5 {
    &-page {
      width: 86dvw !important;
    }

    &-location-group {
      max-width: 520px;
    }

    &-location-control-layout {
      flex-direction: column;
    }

    &-sankey-controls {
      flex: 0 0 auto;
    }
  }

  :deep(.liquid-radio-group) {
    gap: 12px;
  }
}
</style>
