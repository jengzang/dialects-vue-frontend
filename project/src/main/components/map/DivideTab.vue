<template>
  <div>
    <div
      class="page"
      style="max-width: 90%;overflow: hidden"
    >
      <div class="page-content-stack">
        <div
          class="page-footer"
          style="flex-direction: column"
        >
          <p style="margin:0">
            {{ t('map.divideTab.title') }}
          </p>
          <small
            class="hint"
            v-html="t('map.divideTab.hint')"
          />
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
      </div>
    </div>

    <LocationAndRegionInput
      ref="locationRef"
      v-model="locationModel"
      limit-context="divide"
      @update:run-disabled="uiStore.buttonStates.divide.isLocationDisabled = $event"
    />

    <div class="run-container">
      <button
        id="allmap-first"
        class="allmap-first"
        :disabled="buttonState.isRunning || isDisabled"
        :class="{ 'disabled-style': isDisabled }"
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
import { mapStore, uiStore, userStore, isDivideButtonDisabled, setRunning } from "@/main/store/store.js";
import { getCoordinates } from '@/api'
import { showError, showWarning } from '@/utils/message.js';

const router = useRouter()
const { t } = useI18n()

const locationRef = ref(null)
const buttonState = uiStore.buttonStates.divide
const isDisabled = isDivideButtonDisabled
const selectedRegion = ref(null)
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

// Watch for region selection changes
watch(selectedRegion, (val) => {
  if (val) {
    emit('region-selected', val)
  }
})

const runAction = async () => {
  setRunning('divide', true);

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

  try {
    if (!queryParams.iscustom) {
      showWarning(t('map.mapLibre.messages.anonymousNoCustomData'));
    }

    const data = await getCoordinates(queryParams)

    // 更新 Store
    mapStore.mapData = data;
    mapStore.mergedData = [];
    mapStore.mode = 'dot';

    // 切換回地圖 Tab
    await router.replace({
      path: '/menu/map/view'
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
$apple-font:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  Arial,
  sans-serif;

$text-strong: rgba(8, 24, 48, 0.92);
$text-main: rgba(20, 40, 70, 0.86);
$text-secondary: rgba(60, 60, 67, 0.72);

/* 页面内字体统一，不改 page 全局布局 */
.page-content-stack,
.page-footer,
.horizontal-dropdown,
.allmap-first {
  font-family: $apple-font;
}

/* 顶部标题与提示 */
.page-footer {
  p {
    font-size: clamp(20px, 2.2vw, 26px);
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: $text-strong;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.45);
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

/* 横向下拉区域 */
.horizontal-dropdown {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
  gap: 6px;
  width: 100%;
  max-width: 300px;
  margin: auto;
}

/* 下拉框左侧文字 */
.query-label {
  font-family: $apple-font;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
  color: rgba(20, 40, 70, 0.82);
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
    font-family: $apple-font;
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
  background: var(--glass-light);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: $text-main;
  border: 1px solid rgba(200, 200, 200, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 80px;
  margin: auto;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: var(--glass-medium);
    border-color: var(--color-primary);
  }
}

/* 运行按钮 */
.allmap-first {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #007aff, mediumblue);
  border: none;
  border-radius: 30px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 6px 20px rgba(0, 0, 0, 0.19);
  pointer-events: auto;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;

  &:hover {
    background: linear-gradient(145deg, #4e5d5b, #212d2b);
    transform: translateY(-3px);
  }

  &:disabled,
  &.disabled-style {
    background: #ccc;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none;
  }
}
</style>
