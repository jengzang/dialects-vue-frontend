<template>
  <ExploreLayout>
    <div class="village-deep-dive-page">
      <h1 class="page-title">🏘️ 村名深度分析</h1>

      <!-- Village Selector -->
      <div class="village-selector glass-panel">
        <div class="selector-header">
          <h2>選擇村莊</h2>
          <button v-if="selectedVillageId" class="clear-button" @click="clearSelection">
            清除
          </button>
        </div>
        <div class="search-group">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="輸入村名搜尋..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="village in searchResults"
            :key="village.id"
            class="result-item"
            :class="{ 'selected': selectedVillageId === village.id }"
            @click="selectVillage(village.id)"
          >
            <div class="village-name">{{ village.name }}</div>
            <div class="village-location">
              {{ village.city }} / {{ village.county }} / {{ village.township }}
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis Panels (shown when village is selected) -->
      <div v-if="selectedVillageId" class="analysis-panels">
        <!-- Complete Information -->
        <VillageInfoPanel
          :village-id="selectedVillageId"
          :data="completeInfo"
          :loading="loadingComplete"
        />

        <!-- Feature Vector -->
        <FeatureVectorPanel
          :village-id="selectedVillageId"
          :data="features"
          :loading="loadingFeatures"
        />

        <!-- Spatial Features -->
        <SpatialFeaturesPanel
          :village-id="selectedVillageId"
          :data="spatialFeatures"
          :loading="loadingSpatial"
        />

        <!-- Semantic Structure -->
        <SemanticStructurePanel
          :village-id="selectedVillageId"
          :data="semanticStructure"
          :loading="loadingSemantic"
        />

        <!-- N-gram Decomposition -->
        <NgramPanel
          :village-id="selectedVillageId"
          :data="ngrams"
          :loading="loadingNgrams"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state glass-panel">
        <div class="empty-icon">🔍</div>
        <p>請搜尋並選擇一個村莊以查看詳細分析</p>
      </div>
    </div>
  </ExploreLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  searchVillages,
  getVillageComplete,
  getVillageFeatures,
  getVillageSpatialFeatures,
  getVillageSemanticStructure,
  getVillageNgrams
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// Import components
import VillageInfoPanel from '@/components/villagesML/deepdive/VillageInfoPanel.vue'
import FeatureVectorPanel from '@/components/villagesML/deepdive/FeatureVectorPanel.vue'
import SpatialFeaturesPanel from '@/components/villagesML/deepdive/SpatialFeaturesPanel.vue'
import SemanticStructurePanel from '@/components/villagesML/deepdive/SemanticStructurePanel.vue'
import NgramPanel from '@/components/villagesML/deepdive/NgramPanel.vue'

const route = useRoute()

// State
const searchKeyword = ref('')
const searchResults = ref([])
const selectedVillageId = ref(null)

const completeInfo = ref(null)
const features = ref(null)
const spatialFeatures = ref(null)
const semanticStructure = ref(null)
const ngrams = ref(null)

const loadingComplete = ref(false)
const loadingFeatures = ref(false)
const loadingSpatial = ref(false)
const loadingSemantic = ref(false)
const loadingNgrams = ref(false)

let searchTimeout = null

// Methods
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    if (!searchKeyword.value.trim()) {
      searchResults.value = []
      return
    }

    try {
      const result = await searchVillages({
        keyword: searchKeyword.value,
        page: 1,
        page_size: 10
      })
      searchResults.value = result.villages || []
    } catch (error) {
      showError('搜尋失敗')
    }
  }, 500)
}

const selectVillage = (villageId) => {
  selectedVillageId.value = villageId
  loadVillageData(villageId)
}

const clearSelection = () => {
  selectedVillageId.value = null
  completeInfo.value = null
  features.value = null
  spatialFeatures.value = null
  semanticStructure.value = null
  ngrams.value = null
}

const loadVillageData = async (villageId) => {
  // Load complete information
  loadingComplete.value = true
  try {
    completeInfo.value = await getVillageComplete(villageId)
  } catch (error) {
    showError('加載村莊信息失敗')
  } finally {
    loadingComplete.value = false
  }

  // Load features
  loadingFeatures.value = true
  try {
    features.value = await getVillageFeatures(villageId)
  } catch (error) {
    showError('加載特徵向量失敗')
  } finally {
    loadingFeatures.value = false
  }

  // Load spatial features
  loadingSpatial.value = true
  try {
    spatialFeatures.value = await getVillageSpatialFeatures(villageId)
  } catch (error) {
    showError('加載空間特徵失敗')
  } finally {
    loadingSpatial.value = false
  }

  // Load semantic structure
  loadingSemantic.value = true
  try {
    semanticStructure.value = await getVillageSemanticStructure(villageId)
  } catch (error) {
    showError('加載語義結構失敗')
  } finally {
    loadingSemantic.value = false
  }

  // Load ngrams
  loadingNgrams.value = true
  try {
    ngrams.value = await getVillageNgrams(villageId)
  } catch (error) {
    showError('加載N-gram分解失敗')
  } finally {
    loadingNgrams.value = false
  }
}

// Watch for route changes
watch(() => route.query.villageId, (newId) => {
  if (newId) {
    selectedVillageId.value = parseInt(newId)
    loadVillageData(parseInt(newId))
  }
}, { immediate: true })
</script>

<style scoped>
.village-deep-dive-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.village-selector {
  padding: 20px;
  margin-bottom: 30px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.selector-header h2 {
  font-size: 18px;
  color: var(--text-primary);
}

.clear-button {
  padding: 6px 16px;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover {
  background: rgba(231, 76, 60, 0.2);
}

.search-group {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.8);
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.3);
}

.result-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.result-item.selected {
  background: rgba(74, 144, 226, 0.2);
  border: 2px solid var(--primary-color);
}

.village-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.village-location {
  font-size: 13px;
  color: var(--text-secondary);
}

.analysis-panels {
  display: grid;
  gap: 20px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
}
</style>
