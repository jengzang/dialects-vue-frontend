<template>
  <div class="divide-tab-container">
    <div
      class="page"
      style="overflow: hidden;max-height: none;"
    >
      <div class="page-content-stack">
        <div
          class="page-footer"
          style="flex-direction: column"
        >
          <!-- <p style="margin:0">
            {{ t('map.divideTab.title') }}
          </p> -->
          <small
            class="hint"
            v-html="t('map.divideTab.hint')"
          />
        </div>

        <div class="all-data-toggle-row">
          <CheckBox
            v-model="useAllData"
            class="all-data-toggle"
            :label="t('map.divideTab.labels.useAllData')"
            :font-size="14"
            :size="16"
          />
          <small class="all-data-hint">
            {{ t('map.divideTab.hints.useAllData') }}
          </small>
        </div>

        <div
          class="dropdown-row horizontal-dropdown"
          style="margin-top: 12px;"
        >
          <label
            class="query-label"
            style="margin:0;font-size: 14px;"
          >
            {{ t('map.divideTab.labels.regionLevel') }}
          </label>

          <div
            class="dropdown-wrapper"
            style="width: 200px"
          >
            <SimpleSelectDropdown
              v-model="selectedRegion"
              :options="regionOptions"
              :placeholder="t('map.divideTab.placeholders.selectLevel')"
            />
          </div>
        </div>

        <div
          v-if="useAllData"
          class="all-data-mode-panel"
        >
          <label class="query-label">
            {{ t('map.divideTab.labels.partitionSource') }}
          </label>
          <RadioGroup
            v-model="allDataPartitionMode"
            name="divide-all-data-partition-mode"
            :options="partitionModeOptions"
          />
          <CheckBox
            v-model="ignoreDialectIslands"
            class="all-data-toggle"
            :label="t('map.divideTab.labels.ignoreDialectIslands')"
            :font-size="14"
            :size="16"
          />
          <small class="all-data-hint">
            {{ allDataStatusText }}
          </small>
        </div>
      </div>
    </div>

    <LocationAndRegionInput
      v-if="!useAllData"
      ref="locationRef"
      v-model="locationModel"
      limit-context="divide"
      @update:run-disabled="uiStore.buttonStates.divide.isLocationDisabled = $event"
    />

    <div class="run-container">
      <button
        id="allmap-first"
        class="allmap-first"
        :disabled="buttonState.isRunning || runDisabled"
        :class="{ 'disabled-style': runDisabled }"
        @click="runAction"
      >
        <span v-if="buttonState.isRunning">{{ t('map.divideTab.buttons.running') }}</span>
        <span v-else>{{ t('map.divideTab.buttons.run') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LocationAndRegionInput from "@/main/components/geo/LocationAndRegionInput.vue";
import SimpleSelectDropdown from "@/components/selector/SimpleSelectDropdown.vue";
import RadioGroup from '@/components/selector/RadioGroup.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { mapStore, uiStore, userStore, isDivideButtonDisabled, setRunning } from "@/main/store/store.js";
import { getCoordinates, getLocationPoints } from '@/api'
import { showError, showWarning } from '@/utils/ui/message.js';
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { requestMapFitView } from '@/utils/map/MapData.js'

const router = useRouter()
const route = useRouter()
const { t } = useI18n()
const { getPartitionPoints } = usePartitionCache()

const locationRef = ref(null)
const buttonState = uiStore.buttonStates.divide
const isDisabled = isDivideButtonDisabled
const selectedRegion = ref(null)
const useAllData = ref(false)
const allDataPartitionMode = ref('map')
const allPartitionRows = ref([])
const isLoadingAllData = ref(false)
const allDataLoadError = ref('')
const ignoreDialectIslands = ref(false)
const locationModel = ref({
  locations: [],
  regions: [],
  regionUsing: 'map'
})

const emit = defineEmits(['region-selected'])

// Region options for dropdown
const regionOptions = computed(() => [
  { label: t('map.divideTab.options.level1'), value: 1 },
  { label: t('map.divideTab.options.level2'), value: 2 },
  { label: t('map.divideTab.options.level3'), value: 3 }
])

const partitionModeOptions = computed(() => [
  { label: t('map.divideTab.options.mapPartition'), value: 'map' },
  { label: t('map.divideTab.options.yindianPartition'), value: 'yindian' }
])

const effectiveDrawableCount = computed(() => {
  if (allPartitionRows.value.length === 0) return 0
  if (!ignoreDialectIslands.value) return allPartitionRows.value.length
  let count = 0
  allPartitionRows.value.forEach((row) => {
    if (getStringField(row, ['方言島', '方言岛']) !== '1') count++
  })
  return count
})

const allDataStatusText = computed(() => {
  if (isLoadingAllData.value) return t('map.divideTab.messages.allDataLoading')
  if (allDataLoadError.value) return allDataLoadError.value
  if (allPartitionRows.value.length > 0) {
    return t('map.divideTab.messages.allDataLoaded', { count: effectiveDrawableCount.value })
  }
  return t('map.divideTab.messages.allDataNotLoaded')
})

const runDisabled = computed(() => {
  if (!useAllData.value) {
    return isDisabled.value
  }

  return isDisabled.value || isLoadingAllData.value || allPartitionRows.value.length === 0
})

// Watch for region selection changes
watch(selectedRegion, (val) => {
  if (val) {
    emit('region-selected', val)
  }
})

watch(useAllData, (enabled) => {
  uiStore.buttonStates.divide.isLocationDisabled = false
  if (enabled) {
    loadAllPartitionData()
  }
})

const getStringField = (row, keys) => {
  if (!row || typeof row !== 'object') return ''
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const value = row[key]
      return value === null || value === undefined ? '' : String(value).trim()
    }
  }
  return ''
}

const parseCoordinate = (value) => {
  const parts = String(value || '')
    .split(',')
    .map(part => Number(part.trim()))

  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null
  }

  return [parts[0], parts[1]]
}

const resolvePartitionField = (row) => {
  if (allDataPartitionMode.value === 'map') {
    return getStringField(row, ['地圖集二分區', '地图集二分区'])
  }
  return getStringField(row, ['音典分區', '音典分区'])
}

const buildAllDataMapData = () => {
  const coordinatesLocations = []
  const regionMappings = {}
  const coordinateByName = new Set()

  allPartitionRows.value.forEach((row) => {
    if (ignoreDialectIslands.value && getStringField(row, ['方言島', '方言岛']) === '1') {
      return
    }

    const name = getStringField(row, ['簡稱', '简称'])
    const coordinate = parseCoordinate(getStringField(row, ['經緯度', '经纬度']))
    const region = resolvePartitionField(row)

    if (!name || !coordinate || !region) {
      return
    }

    const key = `${name}|${coordinate[0]},${coordinate[1]}`
    if (coordinateByName.has(key)) {
      return
    }

    coordinateByName.add(key)
    coordinatesLocations.push([name, coordinate])
    regionMappings[name] = region
  })

  if (coordinatesLocations.length === 0) {
    throw new Error(t('map.divideTab.messages.allDataNoDrawablePoints'))
  }

  return {
    coordinates_locations: coordinatesLocations,
    region_mappings: regionMappings
  }
}

const loadAllPartitionData = async () => {
  if (isLoadingAllData.value || allPartitionRows.value.length > 0) {
    return
  }

  isLoadingAllData.value = true
  allDataLoadError.value = ''
  try {
    allPartitionRows.value = await getPartitionPoints(() => getLocationPoints())
  } catch (error) {
    console.error('Failed to fetch all partition data:', error)
    allDataLoadError.value = t('map.divideTab.messages.allDataLoadFailed', { error: error.message })
  } finally {
    isLoadingAllData.value = false
  }
}

const runAllDataAction = async () => {
  if (allPartitionRows.value.length === 0) {
    await loadAllPartitionData()
  }

  if (allPartitionRows.value.length === 0) {
    throw new Error(t('map.divideTab.messages.allDataNotLoaded'))
  }

  mapStore.mapData = buildAllDataMapData()
  mapStore.mergedData = []
  mapStore.mode = 'dot'
  requestMapFitView()

  await router.replace({
    path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view')
  })
}

const runAction = async () => {
  setRunning('divide', true);

  try {
    if (useAllData.value) {
      await runAllDataAction()
      return
    }

    // Use merged locations from template ref (includes custom regions)
    // This gets textarea locations + custom region locations merged in background
    const locationList = (locationRef.value?.allLocationsArray && locationRef.value.allLocationsArray.length > 0)
      ? locationRef.value.allLocationsArray.filter(Boolean)
      : [];  // 空數組，不傳默認值

    const regionList = (locationModel.value.regions && locationModel.value.regions.length > 0)
      ? locationModel.value.regions.filter(Boolean)
      : [];

    const queryParams = {
      locations: locationList,
      regions: regionList,
      region_mode: locationModel.value.regionUsing || 'map',
      iscustom: userStore.isAuthenticated && userStore.role !== 'anonymous' ? 'true' : undefined,
      flag: 'False'
    }

    if (!queryParams.iscustom) {
      showWarning(t('map.mapLibre.messages.anonymousNoCustomData'));
    }

    const data = await getCoordinates(queryParams)

    // 更新 Store
    mapStore.mapData = data;
    mapStore.mergedData = [];
    mapStore.mode = 'dot';
    requestMapFitView()

    // 切換回地圖 Tab
    await router.replace({
      path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view')
    });

  } catch (error) {
    console.error(error);
    showError(t('map.divideTab.messages.dataFetchFailed', { error: error.message }));
  } finally {
    setRunning('divide', false);
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-strong: var(--text-deep);
$text-main: var(--text-primary);
$text-secondary: var(--text-secondary);

/* 外层容器：防止内部 white-space: nowrap 撑开 */
.divide-tab-container {
  width: 100%;
  min-width: 0;
}

.page {
  width: max(50%, 500px);
  min-width: 0;
}

/* 页面内字体统一，不改 page 全局布局 */
.page-content-stack,
.page-footer,
.horizontal-dropdown,
.allmap-first {
  font-family: var(--font-sans);
}

/* 顶部标题与提示 */
.page-footer {
  p {
    font-size: clamp(20px, 2.2vw, 26px);
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: $text-strong;
    text-shadow: 0 1px 2px var(--glass-50);
  }

  .hint {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.65;
    letter-spacing: 0.01em;
    color: $text-secondary;
  }
}

/* 全部数据模式 */
.all-data-toggle-row,
.all-data-mode-panel {
  @include flex-col;
  align-items: center;
  gap: 2px;
  margin-top: 14px;
}

.all-data-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}

.all-data-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.all-data-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
  text-align: center;
}

.all-data-mode-panel {
  padding: 12px 16px;
  border: 1px solid rgba(var(--color-silver-rgb), 0.45);
  border-radius: var(--radius-lg);
  background: var(--glass-30);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 横向下拉区域 */
.horizontal-dropdown {
  @include flex-center;
  justify-items: center;
  gap: 6px;
  width: 100%;
  max-width: 300px;
  margin: auto;
}

/* 下拉框左侧文字 */
.query-label {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

/* 下拉框外层 */
.dropdown-wrapper {
  flex: 1;
  position: relative;
  align-items: center;
  display: flex;
  justify-content: center;

  /* 影响 SimpleSelectDropdown 组件内部字体 */
  :deep(*) {
    font-family: var(--font-sans);
  }

  :deep(.dropdown) {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: $text-main;
  }

  :deep(.option),
  :deep(.dropdown-option),
  :deep(.select-option),
  :deep(li) {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
}

/* 如果当前组件内仍有 .dropdown，会保留原有玻璃风格 */
.dropdown {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: var(--glass-30);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: $text-main;
  border: 1px solid rgba(var(--color-silver-rgb), 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 80px;
  margin: auto;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: var(--glass-60);
    border-color: var(--color-primary);
  }
}

/* 运行按钮 */
.allmap-first {
  @include flex-center;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  border: none;
  border-radius: 30px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--action-primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: var(--shadow-md2);
  pointer-events: auto;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;

  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-3px);
  }

  &:disabled,
  &.disabled-style {
    background: var(--border-gray);
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none;
  }
}
</style>
