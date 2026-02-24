<template>
  <div class="villagesml-module">
    <!-- 只有一層 CommonBar: Module tabs with submenu support -->
    <CommonBar
      title="地名分析"
      :tabs="moduleTabs"
      :active-tab-getter="isModuleActive"
      :show-login-button="false"
      :submenu-config="submenuConfig"
      :tab-to-submenu-map="tabToSubmenuMap"
      :sidebar-component="SimpleSidebar"
      :show-sidebar-title="false"
      height="7dvh"
      mobile-height="7dvh"
    />

    <!-- Content area -->
    <div class="content-area">
      <!-- Dynamic Component Loading with KeepAlive -->
      <KeepAlive v-if="currentComponent">
        <component
          :is="currentComponent"
          :key="`${activeModule}-${activeSubtab || 'default'}`"
          v-bind="currentComponentProps"
        />
      </KeepAlive>

      <!-- Legacy Tab: Village Search -->
      <div v-else-if="activeModule === 'search'" class="legacy-tab">
        <SearchPanel @search="handleSearch" />
        <VillageListPanel
          :villages="searchResults"
          :total="searchTotal"
          :current-page="searchPage"
          :page-size="searchPageSize"
          :loading="searchLoading"
          @page-change="handlePageChange"
          @open-deep-analysis="openDeepAnalysisModal"
        />
      </div>

      <!-- Legacy Tab: Regional Analysis -->
      <div v-else-if="activeModule === 'character' && activeSubtab === 'frequency'" class="legacy-tab">
        <RegionSelectorPanel @analyze="handleRegionalAnalysis" />
        <TendencyHeatmapPanel
          :data="tendencyData"
          :loading="regionalLoading"
        />
      </div>

      <!-- Legacy Tab: Clustering Analysis -->
      <div v-else-if="activeModule === 'compute' && activeSubtab === 'clustering'" class="legacy-tab">
        <div class="two-column-layout">
          <ClusteringSettingsPanel
            :loading="clusteringLoading"
            @run="handleRunClustering"
          />
          <ClusteringResultsPanel :results="clusteringResults" />
        </div>
      </div>

      <!-- Legacy Tab: Semantic Network -->
      <div v-else-if="activeModule === 'semantic' && activeSubtab === 'network'" class="legacy-tab">
        <div class="two-column-layout">
          <SemanticSettingsPanel
            :loading="semanticLoading"
            @run="handleRunSemantic"
          />
          <NetworkGraphPanel
            :network="semanticNetwork"
            :loading="semanticLoading"
          />
        </div>
      </div>

      <!-- Fallback -->
      <div v-else class="empty-state glass-panel">
        <p>模塊開發中...</p>
      </div>

      <!-- Deep Analysis Modal -->
      <VillageDeepAnalysisModal
        :show="showDeepAnalysisModal"
        :village="selectedVillageForAnalysis"
        @close="closeDeepAnalysisModal"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { userStore } from '@/utils/store.js'
import {
  searchVillages,
  getCharTendency,
  runClustering,
  getSemanticNetwork
} from '@/api'
import { showError, showSuccess, showWarning } from '@/utils/message.js'
import { VILLAGESML_MODULES, getModuleConfig, getVisibleModules } from '@/config/villagesML.js'

// Import CommonBar and SimpleSidebar
import CommonBar from '@/components/bar/CommonBar.vue'
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue'

const router = useRouter()
const route = useRoute()

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// ========================================
// CommonBar Navigation Configuration
// ========================================

// State
const activeModule = computed(() => route.query.module || 'search')
const activeSubtab = computed(() => route.query.subtab || null)

// Module tabs for CommonBar (只有主模組，沒有子標籤)
const moduleTabs = computed(() => {
  const visibleModules = getVisibleModules(isAuthenticated.value)

  return visibleModules.map(module => ({
    ...module,  // 直接使用 VILLAGESML_MODULES 的所有配置（包括 path）
    tab: module.id,  // CommonBar 需要 tab 屬性
    to: module.path  // 使用配置中的 path
  }))
})

// Submenu configuration (子標籤配置，用於彈出選單)
const submenuConfig = computed(() => {
  const config = {}

  VILLAGESML_MODULES.forEach(module => {
    if (module.subtabs && module.subtabs.length > 0) {
      config[module.id] = {
        children: module.subtabs.map(subtab => ({
          icon: subtab.icon || '📄',
          label: subtab.label,
          path: subtab.path  // 使用配置中的 path
        }))
      }
    }
  })

  return config
})

// Tab to submenu map (模組 ID 映射到 submenu key)
const tabToSubmenuMap = computed(() => {
  const map = {}
  VILLAGESML_MODULES.forEach(module => {
    if (module.subtabs && module.subtabs.length > 0) {
      map[module.id] = module.id
    }
  })
  return map
})

// Current module config
const currentModule = computed(() => getModuleConfig(activeModule.value))
const currentModuleLabel = computed(() => currentModule.value?.label || '村落機器學習')

// Active state getter for CommonBar
const isModuleActive = (moduleId) => {
  return activeModule.value === moduleId
}

// ========================================
// Component Loading
// ========================================

// ========================================
// Component Loading
// ========================================

// Lazy load page components
const CharacterEmbeddings = defineAsyncComponent(() => import('@/components/villagesML/character/CharacterEmbeddings.vue'))
const CharacterSignificance = defineAsyncComponent(() => import('@/components/villagesML/character/CharacterSignificance.vue'))
const SemanticCategories = defineAsyncComponent(() => import('@/components/villagesML/semantic/SemanticCategories.vue'))
const SemanticComposition = defineAsyncComponent(() => import('@/components/villagesML/semantic/SemanticComposition.vue'))
const SpatialHotspotsTab = defineAsyncComponent(() => import('@/components/villagesML/spatial/SpatialHotspotsTab.vue'))
const SpatialClustersTab = defineAsyncComponent(() => import('@/components/villagesML/spatial/SpatialClustersTab.vue'))
const SpatialVisualizationTab = defineAsyncComponent(() => import('@/components/villagesML/spatial/SpatialVisualizationTab.vue'))
const SpatialIntegration = defineAsyncComponent(() => import('@/components/villagesML/spatial/SpatialIntegration.vue'))
const NgramAnalysis = defineAsyncComponent(() => import('@/components/villagesML/pattern/NgramAnalysis.vue'))
const StructuralPatterns = defineAsyncComponent(() => import('@/components/villagesML/pattern/StructuralPatterns.vue'))
const RegionalAggregates = defineAsyncComponent(() => import('@/components/villagesML/regional/RegionalAggregates.vue'))
const RegionalVectors = defineAsyncComponent(() => import('@/components/villagesML/regional/RegionalVectors.vue'))
const FeatureExtraction = defineAsyncComponent(() => import('@/components/villagesML/ml/FeatureExtraction.vue'))
const SubsetAnalysis = defineAsyncComponent(() => import('@/components/villagesML/ml/SubsetAnalysis.vue'))
const CacheManagement = defineAsyncComponent(() => import('@/components/villagesML/system/CacheManagement.vue'))
const SystemInfo = defineAsyncComponent(() => import('@/components/villagesML/system/SystemInfo.vue'))

// Import panel components for legacy tabs
import SearchPanel from '@/components/villagesML/search/SearchPanel.vue'
import VillageListPanel from '@/components/villagesML/search/VillageListPanel.vue'
import VillageDeepAnalysisModal from '@/components/villagesML/search/VillageDeepAnalysisModal.vue'
import RegionSelectorPanel from '@/components/villagesML/character/RegionSelectorPanel.vue'
import TendencyHeatmapPanel from '@/components/villagesML/character/TendencyHeatmapPanel.vue'
import ClusteringSettingsPanel from '@/components/villagesML/ml/ClusteringSettingsPanel.vue'
import ClusteringResultsPanel from '@/components/villagesML/ml/ClusteringResultsPanel.vue'
import SemanticSettingsPanel from '@/components/villagesML/semantic/SemanticSettingsPanel.vue'
import NetworkGraphPanel from '@/components/villagesML/semantic/NetworkGraphPanel.vue'

// Module configuration (from villagesML.js)
const modules = VILLAGESML_MODULES.map(m => ({
  id: m.id,
  label: m.label,
  icon: m.icon,
  requireAuth: m.requireAuth,
  component: null, // Will be mapped below
  subtabs: m.subtabs?.map(s => ({
    id: s.id,
    label: s.label,
    component: null // Will be mapped below
  }))
}))

// Computed
const currentComponent = computed(() => {
  const module = currentModule.value
  if (!module) return null

  // System module (no subtabs)
  if (module.id === 'system') {
    return SystemInfo
  }

  // Module with subtabs
  if (module.subtabs && activeSubtab.value) {
    const subtabId = activeSubtab.value
    const moduleId = module.id

    // Map subtab IDs to components
    const componentMap = {
      'character-embeddings': CharacterEmbeddings,
      'character-significance': CharacterSignificance,
      'semantic-categories': SemanticCategories,
      'semantic-composition': SemanticComposition,
      'spatial-hotspots': SpatialHotspotsTab,
      'spatial-clusters': SpatialClustersTab,
      'spatial-visualization': SpatialVisualizationTab,
      'spatial-integration': SpatialIntegration,
      'pattern-ngrams': NgramAnalysis,
      'pattern-structural': StructuralPatterns,
      'regional-aggregates': RegionalAggregates,
      'regional-vectors': RegionalVectors,
      'compute-features': FeatureExtraction,
      'compute-subset': SubsetAnalysis,
      'compute-cache': CacheManagement
    }

    const key = `${moduleId}-${subtabId}`
    const component = componentMap[key]

    // Return component if found, otherwise null (will use legacy tab)
    return component || null
  }

  return null
})

const currentComponentProps = computed(() => {
  return {}
})

// Legacy handlers (for old tab components)
const searchLoading = ref(false)
const regionalLoading = ref(false)
const clusteringLoading = ref(false)
const semanticLoading = ref(false)

const searchResults = computed(() => villagesMLStore.searchResults)
const searchTotal = computed(() => villagesMLStore.searchTotal)
const searchPage = computed(() => villagesMLStore.searchPage)
const searchPageSize = computed(() => villagesMLStore.searchPageSize)

const tendencyData = computed(() => villagesMLStore.tendencyData)
const clusteringResults = computed(() => villagesMLStore.clusteringResults)
const semanticNetwork = computed(() => villagesMLStore.semanticNetwork)

const handleSearch = async () => {
  searchLoading.value = true
  try {
    const result = await searchVillages({
      keyword: villagesMLStore.searchKeyword,
      ...villagesMLStore.searchFilters,
      page: villagesMLStore.searchPage,
      page_size: villagesMLStore.searchPageSize
    })

    const villages = (result.data || []).map(v => ({
      id: v.village_id,
      name: v.village_name,
      city: v.city,
      county: v.county,
      township: v.township,
      longitude: v.longitude,
      latitude: v.latitude
    }))

    villagesMLStore.searchResults = villages
    villagesMLStore.searchTotal = result.total || 0
  } catch (error) {
    showError('搜尋失敗')
  } finally {
    searchLoading.value = false
  }
}

const handlePageChange = (page) => {
  villagesMLStore.searchPage = page
  handleSearch()
}

const handleRegionalAnalysis = async ({ level, name, hierarchy }) => {
  regionalLoading.value = true
  try {
    const result = await getCharTendency({
      region_level: level,
      ...hierarchy,
      top_k: 30
    })

    villagesMLStore.tendencyData = result
    showSuccess('分析完成')
  } catch (error) {
    showError('分析失敗')
  } finally {
    regionalLoading.value = false
  }
}

const handleRunClustering = async (settings) => {
  if (!userStore.isAuthenticated) {
    showWarning('此功能需要登錄，請先登錄')
    router.push('/auth?redirect=/villagesML?module=compute')
    return
  }

  clusteringLoading.value = true
  try {
    const result = await runClustering(settings)
    villagesMLStore.clusteringResults = result
    showSuccess('聚類完成')
  } catch (error) {
    showError('聚類失敗')
  } finally {
    clusteringLoading.value = false
  }
}

const handleRunSemantic = async (settings) => {
  if (!userStore.isAuthenticated) {
    showWarning('此功能需要登錄，請先登錄')
    router.push('/auth?redirect=/villagesML?module=compute')
    return
  }

  semanticLoading.value = true
  try {
    const result = await getSemanticNetwork(settings)
    villagesMLStore.semanticNetwork = result
    showSuccess('網絡生成完成')
  } catch (error) {
    showError('網絡生成失敗')
  } finally {
    semanticLoading.value = false
  }
}

// Deep Analysis Modal
const showDeepAnalysisModal = ref(false)
const selectedVillageForAnalysis = ref(null)

const openDeepAnalysisModal = (village) => {
  selectedVillageForAnalysis.value = village
  showDeepAnalysisModal.value = true
}

const closeDeepAnalysisModal = () => {
  showDeepAnalysisModal.value = false
  selectedVillageForAnalysis.value = null
}
</script>

<style scoped>
/* VillagesML Module Container */
.villagesml-module {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-area {
  width: 100%;
  padding: 10px 6px;
  padding-top: calc(7dvh + 10px); /* CommonBar height + spacing */
  color: #0b2540;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-panel {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: #666;
  font-size: 16px;
}

.legacy-tab {
  animation: fadeIn 0.3s ease;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }
}
</style>
