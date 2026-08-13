<template>
  <TabsContainer
    :tabs="tabs"
    :model-value="currentTab"
    :route-value="currentTab"
    :resolve-route="resolveTabRoute"
  >
    <!-- <template #header>
      <h1 class="page-title">
        <BarIcon :icon="activePageIcon" />
        {{ activePageTitle }}
      </h1>
    </template> -->

    <!-- Tab 右侧额外内容 -->
    <template #tab-extra>
      <!-- 比较模式：显示比较对象 -->
      <div
        v-if="currentTab === 'map' && mapStore.mode === 'compare' && comparePair"
        class="single-btn-wrapper"
      >
        <button class="feature-btn active">
          {{ comparePair }}
        </button>
      </div>

      <!-- Feature 模式：显示特征选择 -->
      <div
        v-else-if="currentTab === 'map' && mapStore.mode === 'feature' && availableFeatures.length > 0"
        class="feature-control-area"
      >
        <!-- 幫助圖標 -->
        <HelpIcon
          :content="helpText"
          size="sm"
          placement="bottom"
          icon="?"
          icon-color="var(--color-primary)"
          style="margin-left: 5px;"
        />
        <div
          v-if="availableFeatures.length > 1"
          class="dropdown-wrapper"
        >
          <SimpleSelectDropdown
            v-model="selectedFeature"
            :options="featureOptions"
            :placeholder="t('map.placeholder.selectFeature')"
          />
        </div>
        <div
          v-else-if="availableFeatures.length === 1"
          class="single-btn-wrapper"
        >
          <button
            class="feature-btn active"
            @click="selectFeature(availableFeatures[0])"
          >
            {{ mapStore.featureLabels[availableFeatures[0]] || availableFeatures[0] }}
          </button>
        </div>
      </div>
    </template>

    <!-- Tab 内容 -->
    <template #default="{ currentTab: activeTab }">
      <div
        class="tab-content"
        style="justify-items: center; position: relative;"
      >
        <!-- 使用 v-show 代替 v-if，保持组件状态 -->
        <MapLibre
          v-show="activeTab === 'map'"
          :active-feature="selectedFeature"
          :is-custom="true"
          :dot-level="selectedLevel"
          @map-click="handleMapClick"
        />
        <DivideTab
          v-show="activeTab === 'divide'"
          @region-selected="(val) => selectedLevel = val"
        />
        <CustomTab
          v-show="activeTab === 'custom'"
        />
        <!-- 自定義數據提交面板（只在 map tab 顯示） -->
        <CustomDataPanel
          v-if="activeTab === 'map' && mapStore.mode !== 'syllableHeatmap'"
          :map-click-coordinates="mapClickCoordinates"
          :selected-feature="selectedFeature"
          @submit-success="handleSubmitSuccess"
        />
      </div>
    </template>
  </TabsContainer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { mapStore } from '@/main/store/store.js'

import BarIcon from '@/components/common/BarIcon.vue'
import TabsContainer from '@/components/common/TabsContainer.vue'
import DivideTab from "@/main/components/map/Tabs/DivideTab.vue";
import CustomTab from '@/main/components/map/Tabs/CustomTab.vue'
import MapLibre from "@/main/components/map/MapLibre.vue";
import CustomDataPanel from '@/main/components/map/custom/CustomDataPanel.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SimpleSelectDropdown from "@/components/selector/SimpleSelectDropdown.vue";
import { showSuccess, showError } from '@/utils/ui/message.js'
import { addCustomFeatureData, refreshCurrentCustomLayer } from '@/utils/map/MapData.js'

const { t } = useI18n()
const selectedLevel = ref(3)
const router = useRouter()
const route = useRoute()
const { state: routeFeature } = useRouteQueryState('feature', {
  defaultValue: '',
})
const { state: routePhonology } = useRouteQueryState('phonology', {
  defaultValue: '',
})

// 地圖點擊坐標
const mapClickCoordinates = ref(null)

// Tab 邏輯 (需要保留，因为 tab-extra 插槽中要用)
const routeSubToTab = {
  view: 'map',
  divide: 'divide',
  custom: 'custom'
}
const tabToRouteSub = {
  map: 'view',
  divide: 'divide',
  custom: 'custom',
}
const currentTab = computed(() => routeSubToTab[route.params.sub] || 'map')

// 是否处于 map 路由（用于判断基于路由的自动加载等）
const isMapRoute = computed(() => {
  try {
    return typeof route.path === 'string' && route.path.includes('/menu/map')
  } catch (e) {
    return false
  }
})

const tabs = computed(() => [
  { name: 'map', label: t('map.tabs.map') },
  { name: 'divide', label: t('map.tabs.divide') },
  { name: 'custom', label: t('map.tabs.custom') }
])

const pageTitleKeys = {
  map: 'navigation.pageTitles.map.view',
  divide: 'navigation.pageTitles.map.divide',
  custom: 'navigation.pageTitles.map.custom'
}

const pageTitleIcons = {
  map: '🗺️',
  divide: '🎨',
  custom: '🗂️'
}

const activePageTitle = computed(() => t(pageTitleKeys[currentTab.value] || pageTitleKeys.map))
const activePageIcon = computed(() => pageTitleIcons[currentTab.value] || pageTitleIcons.map)

// 處理地圖點擊事件
const handleMapClick = (coordinates) => {
  mapClickCoordinates.value = coordinates
}

// 處理提交成功事件
const handleSubmitSuccess = async (response) => {
  showSuccess(t('map.messages.submitSuccess'))

  // 自动打开自定义数据开关
  mapStore.showCustomData = true;

  // 重新加載合併數據
  try {
    await refreshCurrentCustomLayer()
    console.log(t('map.messages.dataRefreshed'))
  } catch (error) {
    console.error(t('map.messages.dataRefreshFailed'), error)
  }
}

// Feature dropdown
const selectedFeature = ref('')

// Computed feature options for dropdown (labels from featureLabels, values stay as hashes)
const featureOptions = computed(() => {
  return availableFeatures.value.map(feat => ({
    label: mapStore.featureLabels[feat] || feat,
    value: feat
  }))
})

// 計算可用特徵
const availableFeatures = computed(() => {
  if (!mapStore.mergedData || mapStore.mergedData.length === 0) return []
  const features = mapStore.mergedData.map(item => item.feature)
  return [...new Set(features)]
})

// 計算比較對象（用於 compare 模式）
const comparePair = computed(() => {
  if (mapStore.mode !== 'compare' || !mapStore.mergedData || mapStore.mergedData.length === 0) {
    return ''
  }
  // 从第一条数据中提取比较对象
  const firstItem = mapStore.mergedData[0]
  return firstItem.pair || ''
})

// 計算幫助文本
const helpText = computed(() => {
  if (!selectedFeature.value) return t('map.help.noFeature')
  return t('map.help.withFeature', { feature: mapStore.featureLabels[selectedFeature.value] || selectedFeature.value })
})

// Watch for feature list changes
watch(availableFeatures, (newVal) => {
  if (newVal && newVal.length > 0) {
    const firstFeature = newVal[0];
    const isCurrentValid = selectedFeature.value && newVal.includes(selectedFeature.value);

    if (!isCurrentValid) {
      selectedFeature.value = firstFeature;
      mapStore.selectedFeature = firstFeature;
    }
  } else {
    selectedFeature.value = '';
    mapStore.selectedFeature = '';
  }
}, { immediate: true });

// Watch for feature selection changes
watch(selectedFeature, (val) => {
  if (val) {
    mapStore.selectedFeature = val
  }
})

// Select feature (for single button case)
const selectFeature = (val) => {
  selectedFeature.value = val
  mapStore.selectedFeature = val
}

// 监听路由参数，自动加载自定义特征
watch(
  () => ({
    feature: route.query.feature || '',
    phonology: route.query.phonology || ''
  }),
  async ({ feature, phonology }, oldVal) => {
    if (!feature) return;
    if (!isMapRoute.value) return;
    if (currentTab.value !== 'map') return;

    // 防止完全相同参数重复触发
    if (
      oldVal &&
      feature === oldVal.feature &&
      phonology === oldVal.phonology
    ) {
      return;
    }

    try {
      console.log('test', { feature, phonology });
      await addCustomFeatureData(feature, phonology);

      selectedFeature.value = feature;
      mapStore.selectedFeature = feature;
      mapStore.selectedFeaturePhonology = phonology;

      mapStore.showCustomData = true;
      mapStore.mode = 'feature';

      showSuccess(t('map.messages.featureLoaded', { feature }));

      await router.replace({
        query: {
          ...route.query,
          feature: undefined,
          phonology: undefined,
          locations: undefined,
          regions: undefined,
          regionMode: undefined
        }
      });
    } catch (error) {
      console.error(t('map.messages.featureLoadFailed'), error);
      showError(t('map.messages.loadFeatureFailed', { error: error.message || error }));
    }
  },
  { immediate: true }
);

const resolveTabRoute = (tabName) => {
  const sub = tabToRouteSub[tabName] || 'view'
  return {
    path: buildLocalePath(resolveRouteLocale(route), `/menu/map/${sub}`),
    query: route.query
  }
}

</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$success-green: var(--color-success);
$text-primary: var(--text-dark);
$white: var(--text-white);

$transition-fast: 0.2s;
$transition-base: 0.3s;
.tab-content {
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100%;
  padding: 1rem 0;
  text-align: center;
  animation: fade 0.6s ease;
}

/* 地图上方的特征控制区 */
.feature-control-area {
  position: relative;
  z-index: 200;
  display: flex;
  justify-content: center;
  margin-left: 12px;
}

.single-btn-wrapper {
  display: flex;
  justify-content: center;
}

.feature-btn {
  padding: 10px 24px;
  color: $text-primary;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  background: var(--glass-30);
  border: 1px solid rgba(var(--color-silver-rgb), 0.5);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all $transition-base ease;

  &.active {
    color: $white;
    background: $success-green;
    border-color: $success-green;
    box-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.3);
  }

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-aspect-ratio: 1/1) {
    padding: 10px 8px;
  }
}

/* SimpleSelectDropdown 外层 */
.dropdown-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

/*
 * 当前模板中未直接使用。
 * 保留原有通用下拉触发器样式。
 */
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
  background: var(--glass-30);
  border: 1px solid rgba(var(--color-silver-rgb), 0.5);
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all $transition-fast;

  &:hover {
    background: var(--glass-60);
    border-color: var(--color-primary);
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
