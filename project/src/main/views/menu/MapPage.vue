<template>
  <TabsContainer
    :tabs="tabs"
    :model-value="currentTab"
    :route-value="currentTab"
    :resolve-route="resolveTabRoute"
  >
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
            {{ availableFeatures[0] }}
          </button>
        </div>

        <!-- 幫助圖標 -->
        <HelpIcon
          :content="helpText"
          size="sm"
          placement="bottom"
          icon="?"
          icon-color="#007aff"
          style="margin-left: 5px;"
        />
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
          v-if="activeTab === 'map'"
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
import { mapStore } from '@/main/store/store.js'

import TabsContainer from '@/components/common/TabsContainer.vue'
import DivideTab from "@/main/components/map/DivideTab.vue";
import CustomTab from '@/main/components/map/CustomTab.vue'
import MapLibre from "@/main/components/map/MapLibre.vue";
import CustomDataPanel from '@/main/components/map/CustomDataPanel.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SimpleSelectDropdown from "@/components/selector/SimpleSelectDropdown.vue";
import { showSuccess, showError } from '@/utils/message.js'
import { refreshCurrentCustomLayer } from '@/utils/map/MapData.js'

const { t } = useI18n()
const selectedLevel = ref(3)
const router = useRouter()
const route = useRoute()
const { state: routeFeature } = useRouteQueryState('feature', {
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
  custom: 'custom'
}
const isMapRoute = computed(() => route.path.startsWith('/menu/map/'))
const currentTab = computed(() => {
  if (!isMapRoute.value) return null
  return routeSubToTab[route.params.sub] || 'map'
})

const tabs = computed(() => [
  { name: 'map', label: t('map.tabs.map') },
  { name: 'divide', label: t('map.tabs.divide') },
  { name: 'custom', label: t('map.tabs.custom') }
])

// 處理地圖點擊事件
const handleMapClick = (coordinates) => {
  mapClickCoordinates.value = coordinates
}

// 處理提交成功事件
const handleSubmitSuccess = async () => {
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

// Computed feature options for dropdown
const featureOptions = computed(() => {
  return availableFeatures.value.map(feat => ({
    label: feat,
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
  return t('map.help.withFeature', { feature: selectedFeature.value })
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
  () => routeFeature.value,
  async (newFeature, oldFeature) => {
    // 防止重复触发
    if (!newFeature || newFeature === oldFeature) return
    if (!isMapRoute.value) return

    // 只在 map tab 中触发
    if (currentTab.value !== 'map') return

    try {
      // 提取路由参数
      const phonology = route.query.phonology || ''

      // 自动选中该特征并设置其声韵调类型
      selectedFeature.value = newFeature
      mapStore.selectedFeature = newFeature
      mapStore.selectedFeaturePhonology = phonology

      // 自动开启自定义数据显示
      mapStore.showCustomData = true

      // 自动切换到 feature 模式（关闭"查看地名"开关）
      mapStore.mode = 'feature'

      // 调用 refreshCurrentCustomLayer 加载数据
      await refreshCurrentCustomLayer()

      showSuccess(t('map.messages.featureLoaded', { feature: newFeature }))

      // 清除路由参数（避免刷新重复加载）
      await router.replace({
        query: {
          ...route.query,
          feature: undefined,
          phonology: undefined,
          locations: undefined,
          regions: undefined,
          regionMode: undefined
        }
      })
    } catch (error) {
      console.error(t('map.messages.featureLoadFailed'), error)
      showError(t('map.messages.loadFeatureFailed', { error: error.message || error }))
    }
  },
  { immediate: true } // 立即执行一次，检查初始路由参数
)

const resolveTabRoute = (tabName) => {
  const sub = tabToRouteSub[tabName] || 'view'
  return {
    path: `/menu/map/${sub}`,
    query: route.query
  }
}

</script>

<style scoped>
/* 僅保留外層容器樣式 */
.tab-content {
  width: 100%;
  animation: fade 0.6s ease;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  padding: 1rem 0;
}

@keyframes fade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 特徵控制區 (放在地圖上方) */
.feature-control-area {
  margin-left: 12px;
  z-index: 200; /* 確保下拉框在地圖之上 */
  position: relative;
  display: flex;
  justify-content: center;
}
/* === 單一按鈕樣式 (復刻你之前的 Button 風格) === */
.single-btn-wrapper {
  display: flex;
  justify-content: center;
}

.feature-btn {
  padding: 10px 24px;
  border-radius: 20px;
  border: 1px solid rgba(200, 200, 200, 0.5);
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
}

.feature-btn.active {
  background: #34c759; /* 綠色表示激活 */
  color: white;
  border-color: #34c759;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.feature-btn:hover {
  transform: translateY(-2px);
}

/* Dropdown 样式 */
.dropdown-wrapper {
  flex: 1;
  position: relative;
  align-items: center;
  display: flex;
  justify-content: center;
}

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
