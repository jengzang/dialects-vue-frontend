<template>
  <div>
      <div class="page-content-stack">
      <div class="page-footer">
        <h3 style="margin:0">{{ t('map.customTab.title') }}</h3>
        <button
          type="button"
          class="help-icon-head"
          @click="openHelpModal"
          :title="t('map.customTab.buttons.help')"
          :aria-label="t('map.customTab.buttons.help')"
        >
          {{ t('map.customTab.buttons.help') }}
        </button>
        <div class="button-row" v-if="!userStore.isAuthenticated">
          <button class="enter-btn" @click="handleLogin">{{ t('map.customTab.labels.login') }}</button>
        </div>
      </div>

        <!-- LocationAndRegionInput 组件 -->
        <LocationAndRegionInput
          v-model="locationData"
          :useInputMode="true"
          style="margin-top: 12px;"
        />

        <!-- 特征搜索输入框 -->
        <div class="feature-search-container">
          <div class="label-row">
            <label for="featureSearch" class="query-label">{{ t('map.customTab.labels.featureSearch') }}</label>

            <span v-if="!userStore.isAuthenticated" class="data-count-badge warning">
              {{ t('map.customTab.badges.loginRequired') }}
            </span>
            <span v-else-if="userTotalCount === 0" class="data-count-badge hint">
              {{ t('map.customTab.badges.noData') }}
            </span>
            <span v-else class="data-count-badge success">
              {{ t('map.customTab.badges.dataCount', { count: userTotalCount }) }}
            </span>
          </div>
          <div class="search-input-wrapper">
            <input
              id="featureSearch"
              v-model="featureSearchInput"
              type="text"
              :placeholder="t('map.customTab.placeholders.featureSearch')"
              @input="handleFeatureInput"
              @focus="handleInputFocus"
              class="feature-search-input"
            />
            <span v-if="isSearching" class="loading-icon">⏳</span>
          </div>

          <!-- Dropdown 下拉列表 (使用 Teleport) -->
          <Teleport to="body">
            <div
              v-if="showSuggestions && featureSuggestions.length > 0"
              class="dropdown-panel"
              :style="dropdownStyle"
              ref="featureDropdownEl"
            >
              <div
                class="dropdown-item"
                v-for="feature in featureSuggestions"
                :key="feature"
                @mousedown.prevent="selectFeature(feature)"
              >
                {{ feature }}
              </div>
            </div>
          </Teleport>
        </div>

        <!-- 已选择的特征显示 -->
        <div v-if="selectedFeature" class="selected-feature">
          {{ t('map.customTab.selected', { feature: selectedFeature }) }}
        </div>

        <!-- 运行查询按钮 -->
        <div class="button-group">
          <button
            class="action-btn primary-btn"
            @click="handleRunQuery"
            :disabled="isDisabled"
          >
            <span v-if="buttonState.isRunning">{{ t('map.customTab.buttons.running') }}</span>
            <span v-else>{{ t('map.customTab.buttons.run') }}</span>
          </button>
        </div>

        <!-- 分隔线 -->
        <div class="divider">
          <span>{{ t('map.customTab.divider') }}</span>
        </div>

        <!-- 使用说明链接 -->
        <div class="help-trigger-wrapper">
          <span class="help-trigger" @click="openHelpModal">
            {{ t('map.customTab.helpTrigger') }}
          </span>
        </div>

        <div class="button-group">
          <button
            class="action-btn add-entry-btn"
            @click="openEntryModal"
            :disabled="!userStore.isAuthenticated"
          >
            添加數據
          </button>
        </div>
      </div>

    <CustomDataEntryModal
      v-model="isEntryModalOpen"
    />
    <!-- 帮助弹窗 -->
    <AppModal
      :model-value="isHelpModalOpen"
      size="lg"
      :title="t('map.customTab.helpModal.title')"
      :close-label="t('common.button.close')"
      @update:modelValue="closeHelpModal"
    >
        <div class="help-content">
              <div class="help-section">
                <h4 class="section-title">🌟 {{ t('map.customTab.helpModal.sections.overview.title') }}</h4>
                <ul class="help-list">
                  <li v-for="item in helpOverviewItems" :key="item.key">
                    <strong>{{ item.label }}</strong>{{ item.text }}
                  </li>
                </ul>
              </div>

              <div class="help-section" style="border-left: 4px solid #007aff;">
                <h4 class="section-title">🎨 {{ t('map.customTab.helpModal.sections.fieldGuide.title') }}</h4>
                <ul class="help-list">
                  <li v-for="item in helpFieldGuideItems" :key="item.key">
                    <strong>{{ item.label }}</strong>{{ item.text }}
                  </li>
                </ul>
                <div class="example-hint">
                  <ul>
                    <li v-for="example in helpFieldGuideExamples" :key="example">{{ example }}</li>
                  </ul>
                </div>
                <div class="table-container">
                  <table class="example-table">
                    <thead>
                      <tr>
                        <th style="min-width: 60px;">簡稱</th>
                        <th style="min-width: 40px;">分區</th>
                        <th style="min-width: 90px;">經緯度</th>
                        <th style="min-width: 50px;">聲韻調</th>
                        <th style="min-width: 30px;">特徵</th>
                        <th style="min-width: 40px;">值</th>
                        <th style="min-width: 60px;">說明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="highlight-location">陽春圭崗</td>
                        <td class="highlight-region">嶺南</td>
                        <td class="highlight-geo">111.742615,22.35676</td>
                        <td>韻母</td>
                        <td><strong>豪</strong></td>
                        <td><span class="value-tag">ɐu</span></td>
                        <td class="note-text">個人田調</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="help-section" style="border-left: 4px solid #007aff;">
                <h4 class="section-title">💫 {{ t('map.customTab.helpModal.sections.customCollection.title') }}</h4>
                <p class="help-paragraph">{{ t('map.customTab.helpModal.sections.customCollection.intro') }}</p>
                <ul class="help-list">
                  <li v-for="item in helpCollectionItems" :key="item.key">
                    <strong>{{ item.label }}</strong>{{ item.text }}
                  </li>
                </ul>
                <div class="example-hint">
                  <ul>
                    <li v-for="note in helpCollectionNotes" :key="note">{{ note }}</li>
                  </ul>
                </div>
                <div class="table-container">
                  <table class="example-table">
                    <thead>
                      <tr>
                        <th style="min-width: 60px;">簡稱</th>
                        <th style="min-width: 30px;">分區</th>
                        <th style="min-width: 70px;">經緯度</th>
                        <th style="min-width: 50px;">聲韻調</th>
                        <th style="min-width: 30px;">特徵</th>
                        <th style="min-width: 40px;">值</th>
                        <th style="min-width: 60px;">說明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td rowspan="5" class="highlight-location">陽春雙滘</td>
                        <td rowspan="10" class="highlight-region">2025田調</td>
                        <td rowspan="5" class="highlight-geo">111.332451,<br>22.109056</td>
                        <td>韻母</td>
                        <td><strong>止·精組·開</strong></td>
                        <td><span class="value-tag">ei/i</span></td>
                        <td class="note-text">兩讀</td>
                      </tr>
                      <tr>
                        <td>聲母</td>
                        <td><strong>來</strong></td>
                        <td><span class="value-tag">l</span></td>
                        <td class="note-text"></td>
                      </tr>
                      <tr>
                        <td>調值</td>
                        <td><strong>陰去</strong></td>
                        <td><span class="value-tag">53</span></td>
                        <td class="note-text">可能是受涯話影響</td>
                      </tr>
                      <tr>
                        <td>詞彙</td>
                        <td><strong>昨天</strong></td>
                        <td><span class="value-tag">從日</span></td>
                        <td class="note-text">ʦuŋ21 ȵɐt51</td>
                      </tr>
                      <tr>
                        <td>詞彙</td>
                        <td><strong>玩耍</strong></td>
                        <td><span class="value-tag">嬲</span></td>
                        <td class="note-text">liɛu53</td>
                      </tr>
                      <tr>
                        <td rowspan="5" class="highlight-location">阳春合水</td>
                        <td rowspan="5" class="highlight-geo">111.856357,<br>22.289037</td>
                        <td>韻母</td>
                        <td><strong>止·精組·開</strong></td>
                        <td><span class="value-tag">ei</span></td>
                        <td class="note-text">兩陽的特點</td>
                      </tr>
                      <tr>
                        <td>泥來母</td>
                        <td><strong>來母</strong></td>
                        <td><span class="value-tag">l</span></td>
                        <td class="note-text"></td>
                      </tr>
                      <tr>
                        <td>調值</td>
                        <td><strong>陰去</strong></td>
                        <td><span class="value-tag">33</span></td>
                        <td class="note-text"></td>
                      </tr>
                      <tr>
                        <td>詞彙</td>
                        <td><strong>昨天</strong></td>
                        <td><span class="value-tag">撞日</span></td>
                        <td class="note-text">tsoŋ53 ŋɐt53</td>
                      </tr>
                      <tr>
                        <td>詞彙</td>
                        <td><strong>玩耍</strong></td>
                        <td><span class="value-tag">耍</span></td>
                        <td class="note-text">ʃa323</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="help-section" style="border-left: 4px solid #007aff;">
                <h4 class="section-title">💡 {{ t('map.customTab.helpModal.sections.dailyUsage.title') }}</h4>
                <p class="help-paragraph">{{ t('map.customTab.helpModal.sections.dailyUsage.intro') }}</p>
                <ul class="help-list" style="margin-top: 8px;">
                  <li>📁 <strong>「分區」即文件夾：</strong>比如填入 <code>我的探店地圖</code>（「聲韻調」可留空）。</li>
                  <li>🏷️ <strong>「特徵」即分類：</strong>比如填入 <code>咖啡館</code>、<code>火鍋店</code> 或 <code>燒烤攤</code>。</li>
                  <li>📍 <strong>「簡稱」即名字：</strong>可以填入景點/店鋪名稱（如<code>時光咖啡館</code>）。</li>
                  <li>✅️ <strong>「值」即標記：</strong>可以填入評分（如<code>9分</code>）或簡介。</li>
                </ul>

                <div class="usage-diagram">
                  <div class="usage-level region-level">
                    <div class="level-icon">📂</div>
                    <div class="level-content">
                      <div class="field-tag">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.label') }}</div>
                      <div class="usage-text">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.text') }}</div>
                      <div class="usage-example">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.region.example') }}</div>
                    </div>
                  </div>

                  <div class="connector-line">⬇️ {{ t('map.customTab.helpModal.sections.dailyUsage.connectors.regionToLocation') }}</div>

                  <div class="usage-level location-level">
                    <div class="level-icon">📍</div>
                    <div class="level-content">
                      <div class="field-tag">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.label') }}</div>
                      <div class="usage-text">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.text') }}</div>
                      <div class="usage-example">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.location.example') }}</div>
                    </div>
                  </div>

                  <div class="connector-line">⬇️ {{ t('map.customTab.helpModal.sections.dailyUsage.connectors.locationToData') }}</div>

                  <div class="usage-level data-level">
                    <div class="level-group">
                      <div class="sub-level feature-box">
                        <div class="level-icon-sm">🏷️</div>
                        <div>
                          <div class="field-tag-sm">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.label') }}</div>
                          <div class="usage-text-sm">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.text') }}</div>
                          <div class="usage-example-sm">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.feature.example') }}</div>
                        </div>
                      </div>

                      <div class="arrow-right">👉</div>

                      <div class="sub-level value-box">
                        <div class="level-icon-sm">💬</div>
                        <div>
                          <div class="field-tag-sm">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.label') }}</div>
                          <div class="usage-text-sm">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.text') }}</div>
                          <div class="usage-example-sm">{{ t('map.customTab.helpModal.sections.dailyUsage.cards.value.example') }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p class="example-hint" style="margin: 0;">
                  ✨ {{ t('map.customTab.helpModal.sections.dailyUsage.result') }}
                </p>
              </div>

              <div class="help-section" style="border-left: 4px solid #007aff;">
                <h4 class="section-title">📍 {{ t('map.customTab.helpModal.sections.steps.title') }}</h4>
                <ul class="help-list">
                  <li v-for="item in helpStepsItems" :key="item.key">
                    <strong>{{ item.label }}</strong>{{ item.text }}
                  </li>
                </ul>
              </div>
        </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import CustomDataEntryModal from '@/main/components/map/custom-entry/CustomDataEntryModal.vue'
import { getAllCustomData, getCustomFeature } from '@/api'
import { userStore, resultCache, mapStore, uiStore, isCustomButtonDisabled, setRunning } from '@/main/store/store.js'
import { showSuccess, showError, showWarning, showInfo } from '@/utils/message.js'
import AppModal from '@/components/common/AppModal.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { requireAuth } = useAuthGuard()
const helpOverviewItems = computed(() => [
  {
    key: 'privateSpace',
    label: t('map.customTab.helpModal.sections.overview.items.privateSpace.label'),
    text: t('map.customTab.helpModal.sections.overview.items.privateSpace.text')
  },
  {
    key: 'mapRendering',
    label: t('map.customTab.helpModal.sections.overview.items.mapRendering.label'),
    text: t('map.customTab.helpModal.sections.overview.items.mapRendering.text')
  }
])
const helpFieldGuideItems = computed(() => [
  {
    key: 'feature',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.feature.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.feature.text')
  },
  {
    key: 'value',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.value.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.value.text')
  },
  {
    key: 'featureType',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.featureType.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.featureType.text')
  },
  {
    key: 'location',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.location.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.location.text')
  },
  {
    key: 'region',
    label: t('map.customTab.helpModal.sections.fieldGuide.items.region.label'),
    text: t('map.customTab.helpModal.sections.fieldGuide.items.region.text')
  }
])
const helpFieldGuideExamples = computed(() => [
  t('map.customTab.helpModal.sections.fieldGuide.examples.middleChinese'),
  t('map.customTab.helpModal.sections.fieldGuide.examples.personalCorpus')
])
const helpCollectionItems = computed(() => [
  {
    key: 'region',
    label: t('map.customTab.helpModal.sections.customCollection.items.region.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.region.text')
  },
  {
    key: 'featureType',
    label: t('map.customTab.helpModal.sections.customCollection.items.featureType.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.featureType.text')
  },
  {
    key: 'feature',
    label: t('map.customTab.helpModal.sections.customCollection.items.feature.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.feature.text')
  },
  {
    key: 'value',
    label: t('map.customTab.helpModal.sections.customCollection.items.value.label'),
    text: t('map.customTab.helpModal.sections.customCollection.items.value.text')
  }
])
const helpCollectionNotes = computed(() => [
  t('map.customTab.helpModal.sections.customCollection.notes.scope'),
  t('map.customTab.helpModal.sections.customCollection.notes.search'),
  t('map.customTab.helpModal.sections.customCollection.notes.display')
])
const helpStepsItems = computed(() => [
  {
    key: 'mode',
    label: t('map.customTab.helpModal.sections.steps.items.mode.label'),
    text: t('map.customTab.helpModal.sections.steps.items.mode.text')
  },
  {
    key: 'coordinates',
    label: t('map.customTab.helpModal.sections.steps.items.coordinates.label'),
    text: t('map.customTab.helpModal.sections.steps.items.coordinates.text')
  },
  {
    key: 'save',
    label: t('map.customTab.helpModal.sections.steps.items.save.label'),
    text: t('map.customTab.helpModal.sections.steps.items.save.text')
  }
])

// 地点和分区数据
const locationData = ref({
  locations: [],
  regions: [],
  regionUsing: 'map'
})

// 特征搜索相关状态
const featureSearchInput = ref('')
const featureSuggestions = ref([])
const selectedFeature = ref('')
const isSearching = ref(false)
// 使用 uiStore 中的按钮状态（不再定义本地 isRunning）
const buttonState = uiStore.buttonStates.custom
const isDisabled = isCustomButtonDisabled
const showSuggestions = ref(false)
const featureDropdownEl = ref(null)
// 數據總量
const userTotalCount = ref(0)

// 同步 selectedFeature 到 store
watch(selectedFeature, (newVal) => {
  uiStore.buttonStates.custom.hasSelectedFeature = !!newVal
}, { immediate: true })

// Watch for custom tab visibility - only fetch data when tab is active
watch(
  () => route.params.sub,
  (newSub) => {
    if (newSub === 'custom' && userStore.isAuthenticated) {
      fetchUserTotalCount()
    }
  },
  { immediate: true } // Run immediately if already on custom tab
)

// 帮助弹窗状态
const isHelpModalOpen = ref(false)
const isEntryModalOpen = ref(false)

// Dropdown 样式（动态计算位置）
const dropdownStyle = reactive({
  position: 'absolute',
  top: '0px',
  left: '0px',
  minWidth: '200px',
  zIndex: 99999
})

// 防抖计时器
let featureDebounceTimer = null

// 打开/关闭帮助弹窗
const openHelpModal = () => {
  isHelpModalOpen.value = true
}

const closeHelpModal = () => {
  isHelpModalOpen.value = false
}

// 登录
const handleLogin = () => {
  requireAuth()
}

const openEntryModal = () => {
  if (!userStore.isAuthenticated) {
    showWarning(t('map.customTab.validation.loginFirst'))
    requireAuth()
    return
  }
  isEntryModalOpen.value = true
}

// 处理输入事件（防抖搜索）
const handleFeatureInput = () => {
  clearTimeout(featureDebounceTimer)

  // 允许空搜索，后端会返回所有特征
  featureDebounceTimer = setTimeout(() => {
    searchCustomFeatures()
  }, 300)
}

// 处理输入框聚焦事件
const handleInputFocus = () => {
  if (featureSuggestions.value.length > 0) {
    showSuggestions.value = true
    updateDropdownPosition()
  }
}

// 搜索自定义特征
const searchCustomFeatures = async () => {
  // ✅ 登录检查（早返回）
  if (!userStore.isAuthenticated) {
    featureSuggestions.value = []
    showSuggestions.value = false
    return  // 静默返回，不显示错误
  }

  const word = featureSearchInput.value.trim()

  isSearching.value = true

  try {
    // 构建查询参数
    const queryParams = {
      locations: (locationData.value.locations && locationData.value.locations.length > 0)
        ? locationData.value.locations.filter(Boolean)
        : [''],
      regions: (locationData.value.regions && locationData.value.regions.length > 0)
        ? locationData.value.regions.filter(Boolean)
        : [''],
      word: word
    }

    // 调用 API
    const response = await getCustomFeature(queryParams)

    if (Array.isArray(response) && response.length > 0) {
      // 后端返回的是对象数组: { "簡稱": "test", "聲韻調": "", "特徵": "流" }
      // 只提取 "特徵" 字段并去重
      featureSuggestions.value = [...new Set(response.map(item => item.特徵).filter(Boolean))]
      showSuggestions.value = true

      // 更新下拉列表位置
      nextTick(() => {
        updateDropdownPosition()
      })
    } else {
      featureSuggestions.value = []
      showSuggestions.value = false
      showInfo(t('map.customTab.messages.noMatch'))
    }
  } catch (error) {
    console.error('搜索特征失败:', error)
    showError(t('map.customTab.messages.searchFailed', { error: error.message }))
    featureSuggestions.value = []
    showSuggestions.value = false
  } finally {
    isSearching.value = false
  }
}

// 更新下拉列表位置
const updateDropdownPosition = () => {
  const inputEl = document.getElementById('featureSearch')
  if (inputEl) {
    const rect = inputEl.getBoundingClientRect()
    dropdownStyle.position = 'absolute'
    dropdownStyle.top = `${rect.bottom + window.scrollY}px`
    dropdownStyle.left = `${rect.left + window.scrollX}px`
    dropdownStyle.minWidth = `${rect.width}px`
    dropdownStyle.zIndex = 99999
  }
}

// 选择特征
const selectFeature = (feature) => {
  selectedFeature.value = feature
  featureSearchInput.value = feature
  showSuggestions.value = false
}

// 点击外部关闭下拉列表
const onClickOutside = (event) => {
  const inputEl = document.getElementById('featureSearch')
  const dropdownEl = featureDropdownEl.value

  const isInsideInput = inputEl?.contains(event.target)
  const isInsideDropdown = dropdownEl?.contains(event.target)

  if (!isInsideInput && !isInsideDropdown) {
    showSuggestions.value = false
  }
}

async function fetchUserTotalCount() {
  if (!userStore.isAuthenticated) return
  try {
    // 不帶任何參數請求，獲取所有個人記錄
    const response = await getAllCustomData()
    if (Array.isArray(response.data)) {
      userTotalCount.value = response.data.length
    }
  } catch (error) {
    console.error('獲取數據總量失敗:', error)
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  // fetchUserTotalCount() moved to route watcher below
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  clearTimeout(featureDebounceTimer)
})

// 运行查询
const handleRunQuery = () => {
  if (!selectedFeature.value) {
    showWarning(t('map.customTab.validation.selectFeature'))
    return
  }

  setRunning('custom', true)

  try {
    // 清空地图数据
    mapStore.mergedData = []
    resultCache.latestResults = []
    mapStore.selectedFeature = ''
    resultCache.features = []
    mapStore.mapData = null

    // 构建查询参数
    const query = {
      feature: selectedFeature.value
    }

    // 添加地点参数
    if (locationData.value.locations && locationData.value.locations.length > 0) {
      query.locations = locationData.value.locations.join(',')
    }

    // 添加分区参数
    if (locationData.value.regions && locationData.value.regions.length > 0) {
      query.regions = locationData.value.regions.join(',')
    }

    // 添加分区模式
    query.regionMode = locationData.value.regionUsing || 'map'

    // 跳转到地图页面
    router.replace({
      path: '/menu/map/view',
      query
    })

    showSuccess(t('map.customTab.messages.loading'))

    // 清空選中的特徵
    selectedFeature.value = ''
    featureSearchInput.value = ''

    // 延迟重置运行状态（跳转后组件不会被销毁，需要手动重置）
    setTimeout(() => {
      setRunning('custom', false)
    }, 1000)
  } catch (error) {
    console.error('跳转失败:', error)
    showError(t('map.customTab.messages.searchFailed', { error: error.message }))
    setRunning('custom', false)
  }
}

// 逐条添加：跳转到 map 页面并打开面板
const handleAddSingle = () => {
  // 如果当前不是查中古或查音位模式，清空地图数据
  const currentMode = resultCache.mode || ''
  if (currentMode !== '查中古' && currentMode !== '查音位') {
    // 清空地图绘图数据
    mapStore.mergedData = []
    resultCache.latestResults = []
    mapStore.selectedFeature = ''
    resultCache.features = []
  }

  // 设置查询模式为"查中古"，确保面板能够显示
  resultCache.mode = '查中古'
  router.replace({
    path: '/menu/map/view',
    query: { openPanel: 'true' }
  })
}

// 批量添加：跳转到个人数据管理页面
const handleAddBatch = () => {
  // 检查是否已登录
  if (!userStore.isAuthenticated) {
    showWarning(t('map.customTab.validation.loginFirst'))
    requireAuth()
    return
  }

  // 跳转到个人数据管理页面
  router.push({
    path: '/auth/data',
    query: { username: userStore.username }
  })
}
</script>

<style scoped>
/* 特征搜索容器 */
.feature-search-container {
  width: 100%;
  max-width: 400px;
  margin: 10px auto 0;
  position: relative;
}


/* 搜索输入框包装器 */
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.feature-search-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.feature-search-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 加载图标 */
.loading-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
}

/* 已选择特征显示 */
.selected-feature {
  text-align: center;
  margin-top: 12px;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 8px;
  color: #0050b3;
  font-size: 14px;
}

.selected-feature strong {
  color: #003a8c;
}

/* 按钮组容器 */
.button-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-top: 10px;
  flex-wrap: wrap;
}

/* 按鈕與幫助圖標容器 */
.button-with-help {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

/* 頁面頭部幫助圖標 - 蘋果液態玻璃風格 */
.help-icon-head {
  width: auto;
  min-width: 24px;
  height: 24px;
  padding: 0 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #007aff;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border: none;

  /* 液態玻璃效果 */
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.7)
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  /* 邊框和陰影 */
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 4px 12px rgba(0, 122, 255, 0.15),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);

  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.help-icon-head:hover {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0.85)
  );
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.5),
    0 6px 16px rgba(0, 122, 255, 0.25),
    0 0 0 0.5px rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.help-icon-head:active {
  transform: scale(1.05);
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 2px 8px rgba(0, 122, 255, 0.2);
}

/* 通用按钮样式（非悬浮） */
.action-btn {
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 主要按钮（运行查询） */
.primary-btn {
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0051d5, #003db3);
}

/* 逐条添加按钮 */
.add-single-btn {
  background: linear-gradient(135deg, #499f4c, #2c813b);
  color: white;
}

.add-single-btn:hover {
  background: linear-gradient(135deg, #5EDE68, #34C759);
}

/* 批量添加按钮 */
.add-batch-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;

}

.add-batch-btn:hover {
  background: linear-gradient(135deg, #5568d3, #5f3d8a);

}

/* 使用说明触发器 */
.divider {
  margin: 40px 0 12px;
  text-align: center;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: linear-gradient(to right, transparent, #7c7575, transparent);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  display: inline-block;
  padding: 0 12px;
  color: #353535;
  font-weight: bold;
  font-size: 17px;
  position: relative;
  z-index: 1;
}

/* 使用说明触发器 */
.help-trigger-wrapper {
  text-align: center;
  margin: 12px 0;
}

.help-trigger {
  font-size: 13px;
  color: #007aff;
  cursor: pointer;
  transition: opacity 0.2s;
  text-decoration: none;
}

.help-trigger:hover {
  opacity: 0.7;
  text-decoration: underline;
}

/* 帮助弹窗样式 */
.custom-tab-help-shell {
  position: relative;
  margin:
    calc(-1 * var(--modal-content-padding-top))
    calc(-1 * var(--modal-content-padding-inline))
    calc(-1 * var(--modal-content-padding-bottom));
  padding: 30px;
}

.custom-tab-help-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.help-section {
  background: rgba(255, 255, 255, 0.5);
  padding: 15px;
  border-radius: 10px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #007aff;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-list li {
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

.help-list li strong {
  color: #333;
  font-weight: 600;
}

.help-paragraph {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .button-group {
    gap:10px;
    flex-direction: column;
  }

  .action-btn {
    width: 90%;
  }

  .feature-search-container {
    max-width: 90%;
  }

  .custom-tab-help-shell {
    padding: 20px;
  }
}
/* 新增：標籤行布局 */
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 0 4px;
}

.query-label {
  margin-bottom: 0; /* 覆蓋原有 margin */
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 數據量徽章樣式 */
.data-count-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}
/* 未登錄：橘紅色系 */
.data-count-badge.warning {
  color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
  border-color: rgba(255, 149, 0, 0.2);
}

/* 暫無數據：灰色系 */
.data-count-badge.hint {
  color: #8e8e93;
  background: rgba(142, 142, 147, 0.1);
  border-color: rgba(142, 142, 147, 0.2);
}

/* 有數據：藍色系 */
.data-count-badge.success {
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.2);
}

/* 適配移動端 */
@media (max-aspect-ratio: 1/1) {
  .label-row {
    flex-direction: row; /* 移動端也保持一行，若文字太擁擠可改為 column */
  }
}

/* 表格容器 */
.table-container {
  overflow-x: auto; /* 確保移動端可以橫向滑動 */
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  margin-bottom: 8px;
}

/* 表格本體 */
.example-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px; /* 稍微調小字體以容納更多列 */
  text-align: left;
  min-width: 500px; /* 防止在手機上擠成一團 */
}

/* 表頭 */
.example-table th {
  background-color: #f5f7fa;
  color: #333;
  font-weight: 600;
  padding: 8px 6px;
  border-bottom: 2px solid #d9d9d9;
  white-space: nowrap;
}

/* 單元格 */
.example-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #eee;
  border-right: 1px solid #f0f0f0;
  color: #555;
  vertical-align: middle;
}

/* 去掉最後一列邊框 */
.example-table td:last-child {
  border-right: none;
}

/* 重點列高亮 */
.highlight-location {
  color: #333;
  font-weight: 700;
  background-color: #fffcf5; /* 淺黃背景 */
}

.highlight-region {
  color: #007aff;
  font-weight: 600;
  background-color: #f0f7ff; /* 淺藍背景 */
}

.highlight-geo {
  font-family: monospace;
  font-size: 11px;
  color: #888;
  background-color: #fafafa;
}

/* 值標籤 */
.value-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #0050b3;
  font-weight: bold;
}

/* 說明文字 */
.note-text {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

/* 提示塊 */
.example-hint {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.03);
  padding: 8px 12px;
  border-radius: 6px;
}

.example-hint ul {
  margin: 0;
  padding-left: 18px;
}

.example-hint li {
  margin-bottom: 4px;
}
/* --- 日常應用層級圖樣式 --- */

.usage-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 10px;
  border-radius: 12px;
}

/* 通用層級卡片 */
.usage-level {
  display: flex;
  align-items: center;
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: relative;
}

/* 各層級配色 */
.region-level { border-left: 5px solid #007aff; } /* 藍色 */
.location-level { border-left: 5px solid #ff9500; } /* 橘色 */
.data-level {
  border-left: 5px solid #34c759; /* 綠色 */
  flex-direction: column;
  padding: 10px;
}

/* 圖標 */
.level-icon {
  font-size: 24px;
  margin-right: 15px;
  width: 30px;
  text-align: center;
}

/* 內容區 */
.level-content {
  flex: 1;
}

/* 字段標籤 (如：分區) */
.field-tag {
  font-weight: 700;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.usage-text {
  font-size: 13px;
  color: #555;
  margin-bottom: 4px;
}

.usage-example {
  font-size: 12px;
  color: #007aff;
  background: rgba(0, 122, 255, 0.08);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  font-family: monospace;
}

/* 連接線 */
.connector-line {
  font-size: 12px;
  color: #999;
  font-weight: bold;
  margin: 8px 0;
  position: relative;
}

/* 第三層：左右佈局 (特徵 -> 值) */
.level-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sub-level {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px;
  background: #f5fcf5; /* 淺綠背景 */
  border-radius: 6px;
}

.feature-box { margin-right: 5px; }
.value-box { margin-left: 5px; }

.level-icon-sm { font-size: 18px; margin-right: 8px; }
.field-tag-sm { font-weight: 700; font-size: 12px; color: #2e7d32; }
.usage-text-sm { font-size: 11px; color: #555; }
.usage-example-sm {
  font-size: 11px;
  color: #2e7d32;
  font-family: monospace;
  margin-top: 2px;
  font-weight: bold;
}

.arrow-right {
  color: #999;
  font-size: 14px;
  margin: 0 4px;
}

/* Dropdown 样式 */
.dropdown-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 6px 0;
  position: absolute;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 80px;
  max-height: 40dvh;
  overflow: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item.active {
  background-color: #e6f0ff;
  color: #02469e;
  font-weight: bold;
}

.dropdown-item:hover {
  background-color: #e6f0ff;
}
</style>
