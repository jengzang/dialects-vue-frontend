<template>
  <div class="phonology-matrix-page">
    <!-- <div class="page-header">
      <h2 class="page-title">📐 音素分類</h2>
    </div> -->

    <!-- 特徵選擇 Tab -->
    <div class="feature-tabs">
      <RadioGroup
        v-model="selectedFeature"
        :options="features"
        name="phonology-custom-feature"
      />
    </div>

    <div v-if="!isTableSupported" class="empty unsupported-state">
      <p>{{ t('phonology.phonology.custom.states.unsupportedTable', { table: currentTableLabel }) }}</p>
    </div>

    <template v-else>
      <!-- 地点输入组件 -->
      <div class="input-section">
        <LocationMultiInput
          v-model="queryStrings"
          :max-locations="PHONOLOGY_LOCATION_LIMITS.custom"
          @update:matchedLocations="handleMatchedLocations"
          @update:isMatching="handleIsMatching"
        />

        <!-- 分類欄位選擇 -->
        <div class="column-selectors">
          <div class="selector-group">
            <label>{{ $t('phonology.phonology.custom.columns.horizontal') }}</label>
            <SimpleSelectDropdown
              v-model="horizontalColumnChinese"
              :options="columnOptionsArray"
            />
          </div>

          <div class="selector-group">
            <label>{{ $t('phonology.phonology.custom.columns.vertical') }}</label>
            <SimpleSelectDropdown
              v-model="verticalColumnChinese"
              :options="columnOptionsArray"
            />
          </div>

          <div class="selector-group">
            <label>{{ $t('phonology.phonology.custom.columns.cellRow') }}</label>
            <SimpleSelectDropdown
              v-model="cellRowColumnChinese"
              :options="columnOptionsArray"
            />
          </div>
        </div>

        <button
          class="load-btn"
          @click="loadData"
          :disabled="matchedLocations.length === 0 || loading || isMatching"
        >
          <span v-if="isMatching" class="ui-loading--inline" aria-hidden="true">↻</span>
          <span v-else-if="loading">{{ $t('phonology.phonology.custom.actions.loading') }}</span>
          <span v-else>{{ $t('phonology.phonology.custom.actions.query') }}</span>
        </button>
      </div>

      <div v-if="loading" class="loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>{{ $t('phonology.phonology.custom.actions.loading') }}</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadData" class="retry-btn">
          {{ $t('phonology.phonology.custom.actions.retry') }}
        </button>
      </div>

      <div v-else-if="matrixData" class="matrix-container">
        <PhonologyMatrix
          v-for="location in displayLocations"
          :key="location"
          :location="location"
          :initials="matrixData.initials"
          :finals="matrixData.finals"
          :tones="matrixData.tones"
          :matrix="matrixData.matrix"
          :cell-detail-enabled="true"
          :cell-details="matrixData.cellDetails"
        />
      </div>

      <div v-else class="empty">
        <p>{{ $t('phonology.phonology.custom.states.emptyInput') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPhonologyClassificationMatrix } from '@/api'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'
import PhonologyMatrix from '@/main/components/TableAndTree/PhonologyTable.vue'
import LocationMultiInput from '@/main/components/geo/LocationMultiInput.vue'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import { TABLE_COLUMN_SCHEMAS } from '@/main/config/index.js'
import { preferredCharacterTable } from '@/main/store/store.js'
import {
  decodeQueryValueBase64Url,
  encodeQueryValueBase64Url,
  parseLocationsFromUrl,
  validatePhonologyParams
} from '@/utils/urlParams.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loadMatrixTask = useAsyncTask()
const loading = loadMatrixTask.loading
const error = ref(null)
const matrixData = ref(null)
const isMatching = ref(false)
const shouldSyncUrl = ref(false)
const selectedCharacterTable = preferredCharacterTable
const CUSTOM_LOCATION_LIMIT = PHONOLOGY_LOCATION_LIMITS.custom
const isApplyingRouteQuery = ref(false)
const isApplyingFeatureDefaults = ref(false)

// 特徵選擇（聲母/韻母/聲調） - Keep original values for API
const FEATURE_KEYS = ['聲母', '韻母', '聲調']
const features = computed(() => FEATURE_KEYS.map(key => t(`phonology.phonology.custom.features.${getFeatureKey(key)}`)))

// Helper to get translation key from Chinese value
const getFeatureKey = (chineseValue) => {
  const map = { '聲母': 'initial', '韻母': 'final', '聲調': 'tone' }
  return map[chineseValue]
}

// Helper to get Chinese value from translated value
const getChineseFeature = (translatedValue) => {
  const index = features.value.indexOf(translatedValue)
  return index >= 0 ? FEATURE_KEYS[index] : FEATURE_KEYS[0]
}

const COLUMN_TRANSLATION_KEYS = {
  '攝': 'rhyme',
  '韻': 'rhymeDetail',
  '等': 'grade',
  '呼': 'openness',
  '入': 'entering',
  '清濁': 'voicing',
  '系': 'series',
  '組': 'group',
  '母': 'initial',
  '調': 'tone',
  '部位': 'place',
  '方式': 'manner'
}

const PHONOLOGY_CUSTOM_TABLE_CONFIGS = {
  characters: {
    columnKeys: ['攝', '韻', '等', '呼', '入', '清濁', '系', '組', '母', '調', '部位', '方式'],
    featureDefaults: {
      '聲母': { horizontal: '清濁', vertical: '部位', cellRow: '母' },
      '韻母': { horizontal: '等', vertical: '攝', cellRow: '入' },
      '聲調': { horizontal: '清濁', vertical: '調', cellRow: '組' }
    }
  },
  fenyun: {
    columnKeys: ['聲母', '韻母', '韻部', '聲調'],
    featureDefaults: {
      '聲母': { horizontal: '聲調', vertical: '韻部', cellRow: '聲母' },
      '韻母': { horizontal: '聲調', vertical: '韻部', cellRow: '韻母' },
      '聲調': { horizontal: '韻部', vertical: '聲母', cellRow: '聲調' }
    }
  },
  hongwu: {
    columnKeys: ['聲母', '韻部', '聲調', '清濁', '聲類'],
    featureDefaults: {
      '聲母': { horizontal: '清濁', vertical: '聲類', cellRow: '聲母' },
      '韻母': { horizontal: '清濁', vertical: '韻部', cellRow: '聲調' },
      '聲調': { horizontal: '清濁', vertical: '韻部', cellRow: '聲調' }
    }
  },
  old_chinese: {
    columnKeys: ['聲母', '韻母', '韻部', '聲調', '聲母組', '諧聲域'],
    featureDefaults: {
      '聲母': { horizontal: '聲母組', vertical: '聲調', cellRow: '聲母' },
      '韻母': { horizontal: '聲調', vertical: '韻部', cellRow: '韻母' },
      '聲調': { horizontal: '聲母組', vertical: '韻部', cellRow: '聲調' }
    }
  },
  zhongyuan: {
    columnKeys: ['聲母', '韻母', '呼', '等', '聲調'],
    featureDefaults: {
      '聲母': { horizontal: '呼', vertical: '等', cellRow: '聲母' },
      '韻母': { horizontal: '呼', vertical: '等', cellRow: '韻母' },
      '聲調': { horizontal: '呼', vertical: '韻母', cellRow: '聲調' }
    }
  }
}

const isTableSupported = computed(() => Boolean(PHONOLOGY_CUSTOM_TABLE_CONFIGS[selectedCharacterTable.value]))
const currentTableConfig = computed(() => PHONOLOGY_CUSTOM_TABLE_CONFIGS[selectedCharacterTable.value] || null)
const currentTableLabel = computed(() => TABLE_COLUMN_SCHEMAS[selectedCharacterTable.value]?.meta?.label || selectedCharacterTable.value)
const activeColumnKeys = computed(() => currentTableConfig.value?.columnKeys || [])
const currentFeatureDefaults = computed(() => currentTableConfig.value?.featureDefaults || PHONOLOGY_CUSTOM_TABLE_CONFIGS.characters.featureDefaults)

const getColumnLabel = (columnKey) => {
  const translationKey = COLUMN_TRANSLATION_KEYS[columnKey]

  if (selectedCharacterTable.value === 'characters' && translationKey) {
    return t(`phonology.phonology.custom.columnOptions.${translationKey}`)
  }

  return columnKey
}

const columnOptionsArray = computed(() => activeColumnKeys.value.map(columnKey => ({
  label: getColumnLabel(columnKey),
  value: columnKey
})))

const parseCustomLocationQuery = (value) => {
  return parseLocationsFromUrl(
    {
      query: {
        loc: value
      }
    },
    {
      limit: CUSTOM_LOCATION_LIMIT
    }
  )
}

const serializeCustomLocationQuery = (locations) => {
  if (!Array.isArray(locations)) return []

  return locations
    .filter(Boolean)
    .slice(0, CUSTOM_LOCATION_LIMIT)
    .map((location) => encodeQueryValueBase64Url(location))
}

const locationQueryState = useRouteQueryState('loc', {
  defaultValue: [],
  parse: parseCustomLocationQuery,
  serialize: serializeCustomLocationQuery,
  replace: true,
  removeIf: (locations) => !Array.isArray(locations) || locations.length === 0,
})

const featureQueryState = useRouteQueryState('feature', {
  defaultValue: '',
  parse: decodeQueryValueBase64Url,
  serialize: encodeQueryValueBase64Url,
  replace: true,
})

const horizontalQueryState = useRouteQueryState('h', {
  defaultValue: '',
  parse: decodeQueryValueBase64Url,
  serialize: encodeQueryValueBase64Url,
  replace: true,
})

const verticalQueryState = useRouteQueryState('v', {
  defaultValue: '',
  parse: decodeQueryValueBase64Url,
  serialize: encodeQueryValueBase64Url,
  replace: true,
})

const cellRowQueryState = useRouteQueryState('c', {
  defaultValue: '',
  parse: decodeQueryValueBase64Url,
  serialize: encodeQueryValueBase64Url,
  replace: true,
})

const { state: locationQuery } = locationQueryState
const { state: featureQuery } = featureQueryState
const { state: horizontalQuery } = horizontalQueryState
const { state: verticalQuery } = verticalQueryState
const { state: cellRowQuery } = cellRowQueryState

// 验证参数
const validation = validatePhonologyParams(
  {
    locations: locationQuery.value,
    feature: featureQuery.value,
    horizontalColumn: horizontalQuery.value,
    verticalColumn: verticalQuery.value,
    cellRowColumn: cellRowQuery.value
  },
  FEATURE_KEYS,
  activeColumnKeys.value
)

if (!validation.isValid) {
  console.warn('Invalid URL parameters:', validation.errors)
}

// 初始化地点
const queryStrings = ref([...locationQuery.value])
const matchedLocations = ref([])

// 辅助函数：获取初始分类字段值
const getInitialColumn = (urlValue, defaultValue, allowedColumns = activeColumnKeys.value) => {
  return urlValue && allowedColumns.includes(urlValue) ? urlValue : defaultValue
}

const initialSelectedFeature = FEATURE_KEYS.includes(featureQuery.value)
  ? featureQuery.value
  : FEATURE_KEYS[0]

const initialFeatureDefaults = currentFeatureDefaults.value[initialSelectedFeature] || currentFeatureDefaults.value[FEATURE_KEYS[0]]

// 初始化特征 - Use Chinese value internally
const selectedFeatureChinese = ref(initialSelectedFeature)
const selectedFeature = computed({
  get: () => {
    const index = FEATURE_KEYS.indexOf(selectedFeatureChinese.value)
    return features.value[index]
  },
  set: (translatedValue) => {
    selectedFeatureChinese.value = getChineseFeature(translatedValue)
  }
})

// 初始化分类字段 - Use Chinese values internally
const horizontalColumnChinese = ref(
  getInitialColumn(
    horizontalQuery.value,
    initialFeatureDefaults.horizontal
  )
)

const verticalColumnChinese = ref(
  getInitialColumn(
    verticalQuery.value,
    initialFeatureDefaults.vertical
  )
)

const cellRowColumnChinese = ref(
  getInitialColumn(
    cellRowQuery.value,
    initialFeatureDefaults.cellRow
  )
)

const displayLocations = computed(() => {
  if (!matrixData.value) return []
  return matrixData.value.locations || []
})

// 处理匹配到的地点列表
const handleMatchedLocations = (locations) => {
  matchedLocations.value = Array.isArray(locations)
    ? locations.slice(0, CUSTOM_LOCATION_LIMIT)
    : []
}

// 处理匹配状态
const handleIsMatching = (matching) => {
  isMatching.value = matching
}

// 更新 URL 参数：全部 query state 走 applyToQuery，最后只 replace 一次
async function updatePhonologyCustomUrl() {
  const nextQuery = { ...route.query }

  locationQueryState.applyToQuery(
    nextQuery,
    matchedLocations.value.slice(0, CUSTOM_LOCATION_LIMIT)
  )

  featureQueryState.applyToQuery(
    nextQuery,
    selectedFeatureChinese.value
  )

  horizontalQueryState.applyToQuery(
    nextQuery,
    horizontalColumnChinese.value
  )

  verticalQueryState.applyToQuery(
    nextQuery,
    verticalColumnChinese.value
  )

  cellRowQueryState.applyToQuery(
    nextQuery,
    cellRowColumnChinese.value
  )

  await router.replace({
    query: nextQuery
  })
}

// 監聽特徵選擇變化
watch(selectedFeatureChinese, async (newFeature) => {
  if (isApplyingRouteQuery.value) {
    return
  }

  // 清空表格和錯誤信息
  matrixData.value = null
  error.value = null

  // 更新分類欄位為新特徵的默認值
  if (!isTableSupported.value) {
    return
  }

  const defaults = currentFeatureDefaults.value[newFeature] || currentFeatureDefaults.value[FEATURE_KEYS[0]]

  isApplyingFeatureDefaults.value = true
  horizontalColumnChinese.value = defaults.horizontal
  verticalColumnChinese.value = defaults.vertical
  cellRowColumnChinese.value = defaults.cellRow
  await nextTick()
  isApplyingFeatureDefaults.value = false

  if (shouldSyncUrl.value) {
    await updatePhonologyCustomUrl()
  }
})

// 監聽分類字段變化
watch([horizontalColumnChinese, verticalColumnChinese, cellRowColumnChinese], async () => {
  if (isApplyingRouteQuery.value || isApplyingFeatureDefaults.value) {
    return
  }

  if (shouldSyncUrl.value) {
    await updatePhonologyCustomUrl()
  }
})

watch(selectedCharacterTable, async () => {
  matrixData.value = null
  error.value = null

  if (!isTableSupported.value) {
    return
  }

  const defaults = currentFeatureDefaults.value[selectedFeatureChinese.value] || currentFeatureDefaults.value[FEATURE_KEYS[0]]

  isApplyingFeatureDefaults.value = true
  horizontalColumnChinese.value = defaults.horizontal
  verticalColumnChinese.value = defaults.vertical
  cellRowColumnChinese.value = defaults.cellRow
  await nextTick()
  isApplyingFeatureDefaults.value = false

  if (shouldSyncUrl.value) {
    await updatePhonologyCustomUrl()
  }
})

// 數據轉換函數：將 API 返回的數據轉換為 PhonologyMatrix 組件需要的格式
const transformMatrixData = (apiData) => {
  // 驗證數據結構
  if (!apiData) {
    throw new Error(t('phonology.phonology.custom.states.apiError'))
  }

  if (!apiData.matrix) {
    console.error('API 數據結構:', apiData)
    throw new Error(t('phonology.phonology.custom.states.missingMatrix'))
  }

  // 轉換 matrix：提取 feature_value 的 keys 並附加字數
  const transformedMatrix = {}
  const transformedCellDetails = {}

  for (const h in apiData.matrix) {
    transformedMatrix[h] = {}
    transformedCellDetails[h] = {}

    for (const v in apiData.matrix[h]) {
      transformedMatrix[h][v] = {}
      transformedCellDetails[h][v] = {}

      for (const c in apiData.matrix[h][v]) {
        const sortedEntries = Object.entries(apiData.matrix[h][v][c])
          .map(([key, chars], index) => ({
            key,
            chars: Array.isArray(chars) ? chars : (chars ? [String(chars)] : []),
            index
          }))
          .sort((a, b) => {
            const diff = b.chars.length - a.chars.length
            return diff !== 0 ? diff : a.index - b.index
          })

        transformedMatrix[h][v][c] = sortedEntries.map(
          ({ key, chars }) => `${key}[${chars.length}]`
        )

        transformedCellDetails[h][v][c] = sortedEntries.map(({ key, chars }) => ({
          label: key,
          count: chars.length,
          details: [
            {
              char: chars.join(' '),
              values: []
            }
          ]
        }))
      }
    }
  }

  return {
    locations: Array.isArray(apiData.locations)
      ? apiData.locations.slice(0, CUSTOM_LOCATION_LIMIT)
      : [],
    initials: apiData.horizontal_values,
    finals: apiData.vertical_values,
    tones: apiData.cell_row_values,
    matrix: transformedMatrix,
    cellDetails: transformedCellDetails
  }
}

const loadData = async () => {
  if (!isTableSupported.value) {
    error.value = t('phonology.phonology.custom.states.unsupportedTable', { table: currentTableLabel.value })
    return
  }

  if (matchedLocations.value.length === 0) {
    error.value = t('phonology.phonology.custom.states.minLocationError')
    return
  }

  error.value = null

  await loadMatrixTask.run(async () => {
    const requestBody = {
      locations: matchedLocations.value.slice(0, CUSTOM_LOCATION_LIMIT),
      feature: selectedFeatureChinese.value, // Use Chinese value for API
      horizontal_column: horizontalColumnChinese.value, // Use Chinese value for API
      vertical_column: verticalColumnChinese.value, // Use Chinese value for API
      cell_row_column: cellRowColumnChinese.value, // Use Chinese value for API
      table_name: selectedCharacterTable.value
    }

    const result = await getPhonologyClassificationMatrix(requestBody)

    // 調試：查看返回的數據結構
    // console.log('API result:', result)

    // 轉換數據格式
    matrixData.value = transformMatrixData(result.data || result)

    // 首次查询成功后启用 URL 同步
    shouldSyncUrl.value = true

    // 更新 URL
    await updatePhonologyCustomUrl()
  }, {
    onError: (err) => {
      console.error('加載音韻矩陣失敗:', err)
      error.value = err.message || t('phonology.phonology.custom.states.loadError')
    }
  })
}

// 页面加载时自动查询
onMounted(() => {
  if (!isTableSupported.value) {
    return
  }

  const hasLocations = locationQuery.value.length > 0
  const hasAllColumns = horizontalQuery.value &&
    verticalQuery.value &&
    cellRowQuery.value

  if (hasLocations && hasAllColumns && validation.isValid) {
    const unwatch = watch(matchedLocations, (locations) => {
      if (locations.length > 0) {
        loadData()
        unwatch()
      }
    })
  }
})

// 处理浏览器前进/后退
watch(
  [locationQuery, featureQuery, horizontalQuery, verticalQuery, cellRowQuery],
  async () => {
    const nextFeature = featureQuery.value
    const nextHorizontalColumn = horizontalQuery.value
    const nextVerticalColumn = verticalQuery.value
    const nextCellRowColumn = cellRowQuery.value
    const nextLocations = Array.isArray(locationQuery.value)
      ? locationQuery.value.slice(0, CUSTOM_LOCATION_LIMIT)
      : []

    isApplyingRouteQuery.value = true

    // 更新特征
    if (nextFeature !== selectedFeatureChinese.value &&
      FEATURE_KEYS.includes(nextFeature)) {
      selectedFeatureChinese.value = nextFeature
    }

    const activeFeature = FEATURE_KEYS.includes(nextFeature)
      ? nextFeature
      : selectedFeatureChinese.value

    const defaults = currentFeatureDefaults.value[activeFeature] || currentFeatureDefaults.value[FEATURE_KEYS[0]]

    // 更新分类字段；URL 中没有合法值时，使用当前特征默认值兜底
    horizontalColumnChinese.value = nextHorizontalColumn &&
      activeColumnKeys.value.includes(nextHorizontalColumn)
      ? nextHorizontalColumn
      : defaults.horizontal

    verticalColumnChinese.value = nextVerticalColumn &&
      activeColumnKeys.value.includes(nextVerticalColumn)
      ? nextVerticalColumn
      : defaults.vertical

    cellRowColumnChinese.value = nextCellRowColumn &&
      activeColumnKeys.value.includes(nextCellRowColumn)
      ? nextCellRowColumn
      : defaults.cellRow

    // 更新地点 - 只有当 URL 的地点和当前匹配的地点不同时，才清空数据
    if (JSON.stringify(nextLocations) !== JSON.stringify(matchedLocations.value)) {
      queryStrings.value = [...nextLocations]
      matchedLocations.value = []
      matrixData.value = null
      error.value = null
    }

    await nextTick()
    isApplyingRouteQuery.value = false
  }
)
</script>

<style lang="scss" scoped>
.phonology-matrix-page {
  width: 90dvw;

  /* 特征选择 */
  .feature-tabs {
    margin: 20px auto;
  }

  /* 输入区域 */
  .input-section {
    max-width: 600px;
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin: 0 auto 30px;
  }

  /* 不支持当前字表 */
  .unsupported-state {
    max-width: 640px;
    margin: 24px auto;
  }

  /* 分类字段选择 */
  .column-selectors {
    max-width: 600px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
    margin: 10px auto;
  }

  .selector-group {
    min-width: 150px;
    @include flex-col;
    gap: 6px;

    label {
      color: var(--text-dark);
      text-align: center;
      font-size: 13px;
      font-weight: 600;
    }
  }

  /* 查询按钮 */
  .load-btn {
    max-width: 100px;
    @include flex-center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(
      135deg,
      var(--color-primary) 0%,
      var(--color-primary-hover) 100%
    );
    border: none;
    border-radius: var(--radius-md);
    box-shadow:
      0 4px 12px var(--color-primary-shadow),
      0 2px 4px var(--bg-overlay-light2);
    color: var(--action-primary-text);
    white-space: nowrap;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(
        135deg,
        var(--color-primary-hover) 0%,
        var(--color-primary-hover) 100%
      );
      box-shadow:
        0 6px 16px var(--color-primary-shadow-light),
        var(--shadow-sm-dark);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: var(--bg-hover-medium);
      box-shadow: none;
      color: var(--text-secondary);
      cursor: not-allowed;
    }
  }

  /* 加载和错误状态 */
  .loading,
  .error {
    min-height: 50vh;
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }

  .loading {
    p {
      color: var(--text-secondary);
      font-size: 15px;
    }
  }

  .error {
    p {
      color: var(--color-error);
      font-size: 16px;
      font-weight: 500;
    }
  }

  .retry-btn {
    padding: 10px 20px;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    color: var(--text-white);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }

  /* 矩阵结果 */
  .matrix-container {
    @include flex-col;
    gap: 30px;
  }

  /* 空状态 */
  .empty {
    @include flex-center;
    color: var(--text-secondary);
    font-size: 16px;
  }

  /* 竖屏 */
  @media (max-aspect-ratio: 1/1) {
    .input-section {
      max-width: 100%;
    }

    .load-btn {
      padding: 10px 20px;
      font-size: 14px;
    }
  }
}
</style>