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
import { ref, computed, watch, onMounted } from 'vue'
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
  parsePhonologyCustomParams,
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

// 解析 URL 参数
const urlParams = parsePhonologyCustomParams(route)
const { set: setFeatureQuery } = useRouteQueryState('feature', {
  defaultValue: urlParams.feature || '',
  parse: (value) => decodeURIComponent(value),
  serialize: (value) => encodeURIComponent(value),
  replace: true
})

// 验证参数
const validation = validatePhonologyParams(
  urlParams,
  FEATURE_KEYS,
  activeColumnKeys.value
)

if (!validation.isValid) {
  console.warn('Invalid URL parameters:', validation.errors)
}

// 初始化地点
const queryStrings = ref(urlParams.locations)
const matchedLocations = ref([])

// 辅助函数：获取初始分类字段值
const getInitialColumn = (urlValue, defaultValue, allowedColumns = activeColumnKeys.value) => {
  return urlValue && allowedColumns.includes(urlValue) ? urlValue : defaultValue
}

const initialSelectedFeature = FEATURE_KEYS.includes(urlParams.feature) ? urlParams.feature : FEATURE_KEYS[0]
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
    urlParams.horizontalColumn,
    initialFeatureDefaults.horizontal
  )
)

const verticalColumnChinese = ref(
  getInitialColumn(
    urlParams.verticalColumn,
    initialFeatureDefaults.vertical
  )
)

const cellRowColumnChinese = ref(
  getInitialColumn(
    urlParams.cellRowColumn,
    initialFeatureDefaults.cellRow
  )
)

const displayLocations = computed(() => {
  if (!matrixData.value) return []
  return matrixData.value.locations || []
})

// 处理匹配到的地点列表
const handleMatchedLocations = (locations) => {
  matchedLocations.value = locations
}

// 处理匹配状态
const handleIsMatching = (matching) => {
  isMatching.value = matching
}

// 更新 URL 参数
function updatePhonologyCustomUrl() {
  const query = {
    ...route.query,
    feature: encodeURIComponent(selectedFeatureChinese.value),
    h: encodeURIComponent(horizontalColumnChinese.value),
    v: encodeURIComponent(verticalColumnChinese.value),
    c: encodeURIComponent(cellRowColumnChinese.value)
  }

  if (matchedLocations.value.length > 0) {
    query.loc = matchedLocations.value.map(loc => encodeURIComponent(loc))
  } else {
    delete query.loc
  }

  router.replace({ query })
}

// 監聽特徵選擇變化
watch(selectedFeatureChinese, async (newFeature) => {
  await setFeatureQuery(newFeature)

  // 清空表格和錯誤信息
  matrixData.value = null
  error.value = null

  // 更新分類欄位為新特徵的默認值
  if (!isTableSupported.value) {
    return
  }

  const defaults = currentFeatureDefaults.value[newFeature]
  horizontalColumnChinese.value = defaults.horizontal
  verticalColumnChinese.value = defaults.vertical
  cellRowColumnChinese.value = defaults.cellRow
})

// 監聽分類字段變化
watch([horizontalColumnChinese, verticalColumnChinese, cellRowColumnChinese], () => {
  if (shouldSyncUrl.value) {
    updatePhonologyCustomUrl()
  }
})

watch(selectedCharacterTable, () => {
  matrixData.value = null
  error.value = null

  if (!isTableSupported.value) {
    return
  }

  const defaults = currentFeatureDefaults.value[selectedFeatureChinese.value]
  horizontalColumnChinese.value = defaults.horizontal
  verticalColumnChinese.value = defaults.vertical
  cellRowColumnChinese.value = defaults.cellRow

  if (shouldSyncUrl.value) {
    updatePhonologyCustomUrl()
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
          // chars
        }))
      }
    }
  }

  return {
    locations: apiData.locations,
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
      locations: matchedLocations.value,
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
    updatePhonologyCustomUrl()
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

  const hasLocations = urlParams.locations.length > 0
  const hasAllColumns = urlParams.horizontalColumn &&
    urlParams.verticalColumn &&
    urlParams.cellRowColumn

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
watch(() => route.query, () => {
  const newParams = parsePhonologyCustomParams(route)

  // 更新特征
  if (newParams.feature !== selectedFeatureChinese.value &&
    FEATURE_KEYS.includes(newParams.feature)) {
    selectedFeatureChinese.value = newParams.feature
  }

  // 更新地点 - 只有当 URL 的地点和当前匹配的地点不同时，才清空数据
  const newLocations = newParams.locations
  if (JSON.stringify(newLocations) !== JSON.stringify(matchedLocations.value)) {
    queryStrings.value = newLocations
    matrixData.value = null
    error.value = null
  }

  // 更新分类字段
  if (newParams.horizontalColumn &&
    activeColumnKeys.value.includes(newParams.horizontalColumn)) {
    horizontalColumnChinese.value = newParams.horizontalColumn
  }

  if (newParams.verticalColumn &&
    activeColumnKeys.value.includes(newParams.verticalColumn)) {
    verticalColumnChinese.value = newParams.verticalColumn
  }

  if (newParams.cellRowColumn &&
    activeColumnKeys.value.includes(newParams.cellRowColumn)) {
    cellRowColumnChinese.value = newParams.cellRowColumn
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.phonology-matrix-page {
  width: 90dvw;

  .input-section {
    max-width: 600px;
    margin: 0 auto 30px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: center;
    align-items: center;
  }

  .unsupported-state {
    max-width: 640px;
    margin: 24px auto;
  }

  /* 特徵 radio 外層只保留間距；radio 樣式交給 RadioGroup 組件 */
  .feature-tabs {
    margin: 20px auto;
  }

  .column-selectors {
    display: flex;
    gap: 16px;
    margin: 10px auto 10px;
    justify-content: center;
    flex-wrap: wrap;
    max-width: 600px;
  }

  .selector-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 150px;

    label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-dark);
      text-align: center;
    }

    select {
      padding: 10px 12px;
      border: 1px solid var(--border-gray-light);
      border-radius: var(--radius-md);
      background: var(--glass-light2);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--color-primary);
        background: var(--glass-medium2);
      }

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
      }
    }
  }

  .load-btn {
    padding: 12px 24px;
    max-width: 100px;
    white-space: nowrap;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: var(--text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px var(--color-primary-shadow), 0 2px 4px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-hover) 0%, #004ba0 100%);
      box-shadow: 0 6px 16px var(--color-primary-shadow-light), 0 3px 6px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: var(--bg-hover-medium);
      color: var(--text-secondary);
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
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
    color: var(--text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-md);

    &:hover {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }

  .matrix-container {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 16px;
  }

  /* 移动端适配 */
  @media (max-aspect-ratio: 1/1) {
    .page-title {
      font-size: 24px;
    }

    .input-section {
      max-width: 100%;
    }

    .load-btn {
      font-size: 14px;
      padding: 10px 20px;
    }
  }
}
</style>