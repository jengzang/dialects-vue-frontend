<template>
  <div class="villages-ml-page">
      <!-- Module Navigation -->
      <div class="module-navigation glass-panel">
        <button
          v-for="module in modules"
          :key="module.id"
          class="module-button"
          :class="{ 'active': activeModule === module.id, 'locked': module.requireAuth && !isAuthenticated }"
          @click="selectModule(module.id)"
          :disabled="module.requireAuth && !isAuthenticated"
        >
          <span class="module-icon">{{ module.icon }}</span>
          <span class="module-label">{{ module.label }}</span>
          <span v-if="module.requireAuth" class="lock-badge">🔒</span>
        </button>
      </div>

      <!-- Sub-tab Navigation (if module has subtabs) -->
      <div v-if="currentModule && currentModule.subtabs" class="subtab-navigation glass-panel">
        <button
          v-for="subtab in currentModule.subtabs"
          :key="subtab.id"
          class="subtab-button"
          :class="{ 'active': activeSubtab === subtab.id }"
          @click="selectSubtab(subtab.id)"
        >
          {{ subtab.label }}
        </button>
      </div>

      <!-- Module Content -->
      <div class="module-content">
        <!-- Dynamic Component Loading (New Pages) -->
        <component
          v-if="currentComponent"
          :is="currentComponent"
          v-bind="currentComponentProps"
        />

        <!-- Legacy Tab: Village Search -->
        <div v-else-if="activeModule === 'search' && activeSubtab === 'search'" class="legacy-tab">
          <SearchPanel @search="handleSearch" />
          <div class="two-column-layout">
            <VillageListPanel
              :villages="searchResults"
              :total="searchTotal"
              :current-page="searchPage"
              :page-size="searchPageSize"
              :loading="searchLoading"
              @page-change="handlePageChange"
              @village-select="handleVillageSelect"
            />
            <VillageDetailPanel
              :village="selectedVillage"
              @close="selectedVillage = null"
            />
          </div>
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

        <!-- Fallback for missing components -->
        <div v-else class="empty-state glass-panel">
          <p>模塊開發中...</p>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { userStore } from '@/utils/store.js'
import {
  searchVillages,
  getCharTendency,
  runClustering,
  getSemanticNetwork
} from '@/api'
import { showError, showSuccess, showWarning } from '@/utils/message.js'

const router = useRouter()
const route = useRoute()

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// Lazy load components
const Dashboard = defineAsyncComponent(() => import('./VillagesML/Dashboard.vue'))
const VillageDeepDive = defineAsyncComponent(() => import('./VillagesML/VillageDeepDive.vue'))
const CharacterEmbeddings = defineAsyncComponent(() => import('./VillagesML/CharacterEmbeddings.vue'))
const CharacterSignificance = defineAsyncComponent(() => import('./VillagesML/CharacterSignificance.vue'))
const SemanticCategories = defineAsyncComponent(() => import('./VillagesML/SemanticCategories.vue'))
const SemanticComposition = defineAsyncComponent(() => import('./VillagesML/SemanticComposition.vue'))
const SpatialHotspots = defineAsyncComponent(() => import('./VillagesML/SpatialHotspots.vue'))
const SpatialIntegration = defineAsyncComponent(() => import('./VillagesML/SpatialIntegration.vue'))
const NgramAnalysis = defineAsyncComponent(() => import('./VillagesML/NgramAnalysis.vue'))
const StructuralPatterns = defineAsyncComponent(() => import('./VillagesML/StructuralPatterns.vue'))
const RegionalAggregates = defineAsyncComponent(() => import('./VillagesML/RegionalAggregates.vue'))
const RegionalVectors = defineAsyncComponent(() => import('./VillagesML/RegionalVectors.vue'))
const FeatureExtraction = defineAsyncComponent(() => import('./VillagesML/FeatureExtraction.vue'))
const SubsetAnalysis = defineAsyncComponent(() => import('./VillagesML/SubsetAnalysis.vue'))
const CacheManagement = defineAsyncComponent(() => import('./VillagesML/CacheManagement.vue'))
const SystemInfo = defineAsyncComponent(() => import('./VillagesML/SystemInfo.vue'))

// Import existing components for legacy tabs
import SearchPanel from '@/components/villagesML/SearchPanel.vue'
import VillageListPanel from '@/components/villagesML/VillageListPanel.vue'
import VillageDetailPanel from '@/components/villagesML/VillageDetailPanel.vue'
import RegionSelectorPanel from '@/components/villagesML/RegionSelectorPanel.vue'
import TendencyHeatmapPanel from '@/components/villagesML/TendencyHeatmapPanel.vue'
import ClusteringSettingsPanel from '@/components/villagesML/ClusteringSettingsPanel.vue'
import ClusteringResultsPanel from '@/components/villagesML/ClusteringResultsPanel.vue'
import SemanticSettingsPanel from '@/components/villagesML/SemanticSettingsPanel.vue'
import NetworkGraphPanel from '@/components/villagesML/NetworkGraphPanel.vue'

// Module configuration
const modules = [
  {
    id: 'dashboard',
    label: '儀表板',
    icon: '📊',
    component: Dashboard,
    requireAuth: false
  },
  {
    id: 'search',
    label: '搜尋探索',
    icon: '🔍',
    requireAuth: false,
    subtabs: [
      { id: 'search', label: '村名搜尋', component: 'SearchTab' },
      { id: 'deepdive', label: '深度分析', component: VillageDeepDive }
    ]
  },
  {
    id: 'character',
    label: '字符分析',
    icon: '🔤',
    requireAuth: false,
    subtabs: [
      { id: 'frequency', label: '頻率傾向', component: 'RegionalTab' },
      { id: 'embeddings', label: '嵌入相似', component: CharacterEmbeddings },
      { id: 'significance', label: '顯著性', component: CharacterSignificance }
    ]
  },
  {
    id: 'semantic',
    label: '語義分析',
    icon: '🏷️',
    requireAuth: false,
    subtabs: [
      { id: 'categories', label: '類別標籤', component: SemanticCategories },
      { id: 'composition', label: '組合模式', component: SemanticComposition },
      { id: 'network', label: '語義網絡', component: 'SemanticTab' }
    ]
  },
  {
    id: 'spatial',
    label: '空間分析',
    icon: '🗺️',
    requireAuth: false,
    subtabs: [
      { id: 'hotspots', label: '熱點聚類', component: SpatialHotspots },
      { id: 'integration', label: '空間整合', component: SpatialIntegration }
    ]
  },
  {
    id: 'pattern',
    label: '模式分析',
    icon: '📐',
    requireAuth: false,
    subtabs: [
      { id: 'ngrams', label: 'N-gram', component: NgramAnalysis },
      { id: 'structural', label: '結構模式', component: StructuralPatterns }
    ]
  },
  {
    id: 'regional',
    label: '區域分析',
    icon: '🌍',
    requireAuth: false,
    subtabs: [
      { id: 'aggregates', label: '聚合統計', component: RegionalAggregates },
      { id: 'vectors', label: '特徵向量', component: RegionalVectors }
    ]
  },
  {
    id: 'compute',
    label: 'ML 計算',
    icon: '🤖',
    requireAuth: true,
    subtabs: [
      { id: 'clustering', label: '聚類分析', component: 'ClusteringTab' },
      { id: 'features', label: '特徵提取', component: FeatureExtraction },
      { id: 'subset', label: '子集分析', component: SubsetAnalysis },
      { id: 'cache', label: '緩存管理', component: CacheManagement }
    ]
  },
  {
    id: 'system',
    label: '系統信息',
    icon: 'ℹ️',
    component: SystemInfo,
    requireAuth: false
  }
]

// State
const activeModule = ref('dashboard')
const activeSubtab = ref(null)

// Computed
const currentModule = computed(() => {
  return modules.find(m => m.id === activeModule.value)
})

const currentComponent = computed(() => {
  const module = currentModule.value
  if (!module) return null

  // Single component module (no subtabs)
  if (module.component && !module.subtabs) {
    return module.component
  }

  // Module with subtabs
  if (module.subtabs && activeSubtab.value) {
    const subtab = module.subtabs.find(s => s.id === activeSubtab.value)
    if (subtab) {
      // Handle legacy tab components
      if (subtab.component === 'SearchTab') return null // Will render custom layout
      if (subtab.component === 'RegionalTab') return null
      if (subtab.component === 'ClusteringTab') return null
      if (subtab.component === 'SemanticTab') return null

      return subtab.component
    }
  }

  return null
})

const currentComponentProps = computed(() => {
  // Pass props to components if needed
  return {}
})

// Methods
const selectModule = (moduleId) => {
  const module = modules.find(m => m.id === moduleId)
  if (!module) return

  // Check authentication
  if (module.requireAuth && !isAuthenticated.value) {
    showWarning('此功能需要登錄')
    router.push('/auth?redirect=/explore?page=VillagesML')
    return
  }

  activeModule.value = moduleId

  // Set default subtab if module has subtabs
  if (module.subtabs && module.subtabs.length > 0) {
    activeSubtab.value = module.subtabs[0].id
  } else {
    activeSubtab.value = null
  }

  // Update URL
  updateURL()
}

const selectSubtab = (subtabId) => {
  activeSubtab.value = subtabId
  updateURL()
}

const updateURL = () => {
  const query = { page: 'VillagesML', module: activeModule.value }
  if (activeSubtab.value) {
    query.subtab = activeSubtab.value
  }
  router.replace({ query })
}

const syncFromURL = () => {
  const { module, subtab } = route.query

  if (module) {
    const moduleObj = modules.find(m => m.id === module)
    if (moduleObj) {
      activeModule.value = module

      if (subtab && moduleObj.subtabs) {
        const subtabObj = moduleObj.subtabs.find(s => s.id === subtab)
        if (subtabObj) {
          activeSubtab.value = subtab
        } else if (moduleObj.subtabs.length > 0) {
          activeSubtab.value = moduleObj.subtabs[0].id
        }
      } else if (moduleObj.subtabs && moduleObj.subtabs.length > 0) {
        activeSubtab.value = moduleObj.subtabs[0].id
      }
    }
  }
}

// Legacy handlers (for old tab components)
const searchLoading = ref(false)
const regionalLoading = ref(false)
const clusteringLoading = ref(false)
const semanticLoading = ref(false)

const searchResults = computed(() => villagesMLStore.searchResults)
const searchTotal = computed(() => villagesMLStore.searchTotal)
const searchPage = computed(() => villagesMLStore.searchPage)
const searchPageSize = computed(() => villagesMLStore.searchPageSize)
const selectedVillage = computed({
  get: () => villagesMLStore.selectedVillage,
  set: (val) => { villagesMLStore.selectedVillage = val }
})

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

    villagesMLStore.searchResults = result.villages
    villagesMLStore.searchTotal = result.total
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

const handleVillageSelect = (village) => {
  villagesMLStore.selectedVillage = village
}

const handleRegionalAnalysis = async ({ level, name }) => {
  regionalLoading.value = true
  try {
    const result = await getCharTendency({
      region_level: level,
      region_name: name,
      top_n: 30
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
    router.push('/auth?redirect=/explore?page=VillagesML')
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
    router.push('/auth?redirect=/explore?page=VillagesML')
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

// Lifecycle
onMounted(() => {
  syncFromURL()
})

// Watch route changes
watch(() => route.query, () => {
  syncFromURL()
}, { deep: true })
</script>

<style scoped>
.villages-ml-page {
  display: flex;
  flex-direction: column;
  height: 92dvh;
  width:98dvw;
  max-width: 1600px;
  margin: 0 auto;
  padding: 10px 20px;
  box-sizing: border-box;
  overflow: hidden; /* Prevent page-level scroll */
}

.glass-panel {
  background: var(--glass-heavy);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.module-navigation {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Desktop: allow wrapping */
  flex-shrink: 0; /* Don't shrink tabs */
  overflow-x: auto; /* Enable horizontal scroll when needed */
  scrollbar-width: thin; /* Firefox */
  justify-content: space-around;
}

/* Hide scrollbar but keep functionality */
.module-navigation::-webkit-scrollbar {
  height: 6px;
}

.module-navigation::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.module-navigation::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.3);
  border-radius: 3px;
}

.module-navigation::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.5);
}

.module-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
}

.module-button:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.2);
  transform: translateY(-2px);
}

.module-button.active {
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
}

.module-button.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.module-button:disabled {
  cursor: not-allowed;
}

.module-icon {
  font-size: 18px;
}

.module-label {
  font-weight: 500;
}

.lock-badge {
  font-size: 12px;
}

.subtab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  flex-shrink: 0; /* Don't shrink subtabs */
  scrollbar-width: thin;
}

.subtab-navigation::-webkit-scrollbar {
  height: 6px;
}

.subtab-navigation::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.subtab-navigation::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.3);
  border-radius: 3px;
}

.subtab-navigation::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.5);
}

.subtab-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.subtab-button:hover {
  background: rgba(74, 144, 226, 0.2);
}

.subtab-button.active {
  background: var(--color-primary-light);
  color: white;
}

.module-content {
  flex: 1; /* Take remaining space */
  overflow-y: auto; /* Enable scrolling */
  overflow-x: hidden;
  animation: fadeIn 0.3s ease;
  min-height: 0; /* Important for flex child scrolling */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: var(--text-secondary);
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

/* Responsive */
@media (max-width: 768px) {
  .villages-ml-page {
    padding: 8px 12px;
    height: 91dvh; /* Use dvh on mobile too */
  }

  .module-navigation {
    /* Mobile: NO wrapping, use horizontal scroll */
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    /* Show scrollbar on mobile for better UX */
    scrollbar-width: auto;
  }

  .module-navigation::-webkit-scrollbar {
    height: 8px; /* Slightly larger on mobile */
  }

  .module-button {
    flex-shrink: 0; /* Prevent buttons from shrinking */
  }

  .subtab-navigation {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: auto;
  }

  .subtab-navigation::-webkit-scrollbar {
    height: 8px;
  }

  .subtab-button {
    flex-shrink: 0;
  }

  .two-column-layout {
    grid-template-columns: 1fr;
  }
}
</style>