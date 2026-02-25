<template>
  <!-- Modal Overlay -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show && village" class="village-analysis-overlay" @click.self="close">
        <div class="village-analysis-modal" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div class="village-modal-header">
            <div class="village-modal-title">
              🏘️ {{ village.name }} - 深度分析
            </div>
            <button class="village-modal-close" type="button" @click="close">×</button>
          </div>

          <!-- Modal Body -->
          <div class="village-modal-body">
<!--            &lt;!&ndash; Basic Info Section &ndash;&gt;-->
<!--            <div class="info-section">-->
<!--              <div class="info-grid">-->
<!--                <div class="info-item">-->
<!--                  <span class="info-label">地級市：</span>-->
<!--                  <span class="info-value">{{ village.city }}</span>-->
<!--                </div>-->
<!--                <div class="info-item">-->
<!--                  <span class="info-label">區縣：</span>-->
<!--                  <span class="info-value">{{ village.county }}</span>-->
<!--                </div>-->
<!--                <div class="info-item">-->
<!--                  <span class="info-label">鄉鎮：</span>-->
<!--                  <span class="info-value">{{ village.township }}</span>-->
<!--                </div>-->
<!--                <div class="info-item">-->
<!--                  <span class="info-label">經度：</span>-->
<!--                  <span class="info-value">{{ village.longitude?.toFixed(6) || 'N/A' }}</span>-->
<!--                </div>-->
<!--                <div class="info-item">-->
<!--                  <span class="info-label">緯度：</span>-->
<!--                  <span class="info-value">{{ village.latitude?.toFixed(6) || 'N/A' }}</span>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->

            <!-- Analysis Panels -->
            <div class="analysis-panels">
              <VillageInfoPanel
                :village-id="village.id"
                :data="basicInfo"
                :loading="loading"
              />

              <FeatureVectorPanel
                :village-id="village.id"
                :data="features"
                :loading="loading"
              />

              <SpatialFeaturesPanel
                :village-id="village.id"
                :data="spatialFeatures"
                :loading="loading"
              />

              <SemanticStructurePanel
                :village-id="village.id"
                :data="semanticStructure"
                :loading="loading"
              />

              <NgramPanel
                :village-id="village.id"
                :data="ngrams"
                :loading="loading"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VillageInfoPanel from '../village/VillageInfoPanel.vue'
import FeatureVectorPanel from '../village/FeatureVectorPanel.vue'
import SpatialFeaturesPanel from '../village/SpatialFeaturesPanel.vue'
import SemanticStructurePanel from '../village/SemanticStructurePanel.vue'
import NgramPanel from '../village/NgramPanel.vue'
import { getVillageComplete } from '@/api'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  village: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['close'])

// Single data state for complete response
const completeData = ref(null)
const loading = ref(false)

// Transform and extract sections from complete data
const basicInfo = computed(() => {
  if (!completeData.value?.basic_info) return null
  const info = completeData.value.basic_info
  return {
    id: info.village_id,
    name: info.village_name,
    city: info.city,
    county: info.county,
    township: info.township,
    longitude: info.longitude,
    latitude: info.latitude,
    pinyin: info.pinyin,
    village_committee: info.village_committee
  }
})

const features = computed(() => {
  if (!completeData.value?.features) return null
  const f = completeData.value.features
  return {
    features: {
      semantic: {
        山地: f.sem_mountain,
        水系: f.sem_water,
        聚落: f.sem_settlement,
        方位: f.sem_direction,
        宗族: f.sem_clan,
        象徵: f.sem_symbolic,
        農業: f.sem_agriculture,
        植被: f.sem_vegetation,
        基建: f.sem_infrastructure
      },
      morphology: {
        名稱長度: f.name_length,
        後綴1: f.suffix_1,
        後綴2: f.suffix_2,
        後綴3: f.suffix_3,
        前綴1: f.prefix_1,
        前綴2: f.prefix_2,
        前綴3: f.prefix_3
      },
      clustering: {
        'K-means聚類': f.kmeans_cluster_id,
        'DBSCAN聚類': f.dbscan_cluster_id,
        'GMM聚類': f.gmm_cluster_id
      }
    }
  }
})

const spatialFeatures = computed(() => completeData.value?.spatial_features || null)
const semanticStructure = computed(() => completeData.value?.semantic_structure || null)
const ngrams = computed(() => completeData.value?.ngrams || null)

const close = () => {
  emit('close')
}

// Load data when modal opens
watch(() => props.show, (isShown) => {
  if (isShown && props.village) {
    loadCompleteData()
  }
}, { immediate: true })

const loadCompleteData = async () => {
  loading.value = true
  try {
    completeData.value = await getVillageComplete(props.village.id)
    console.log('Complete data loaded:', completeData.value)
  } catch (error) {
    console.error('Failed to load complete data:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Overlay */
.village-analysis-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(6px);
}

/* Modal */
.village-analysis-modal {
  width: min(1200px, 94vw);
  height: 90dvh;
  max-height: 90dvh;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  display: flex;
  flex-direction: column;
}

/* Header */
.village-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.village-modal-title {
  font-size: 18px;
  font-weight: 650;
  color: #333;
}

.village-modal-close {
  appearance: none;
  border: none;
  background: rgba(142, 142, 147, 0.2);
  color: #666;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.village-modal-close:hover {
  background: rgba(142, 142, 147, 0.3);
  transform: rotate(90deg);
}

/* Body */
.village-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
}

/* Info Section */
.info-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.info-value {
  color: var(--text-secondary);
}

/* Analysis Panels */
.analysis-panels {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

