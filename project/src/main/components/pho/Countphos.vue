<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getFeatureCounts } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import LocationMultiInput from '@/main/components/geo/LocationMultiInput.vue'
import CountLocationJumpNav from '@/main/components/pho/CountLocationJumpNav.vue'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'

const { t } = useI18n()

const loadCountsTask = useAsyncTask()
const loading = loadCountsTask.loading
const error = ref(null)
const matrixData = ref(null)
const queryStrings = ref([])
const matchedLocations = ref([])
const isMatching = ref(false) // 添加匹配状态

// 音節統計數據
const featureData = ref({})  // 存儲每個地點的原始數據
const aggregatedData = ref({}) // 存儲匯總統計數據

// 弹窗状态
const showLocationModal = ref(false)
const modalData = ref({
  syllable: '',
  featureType: '',
  locations: [],
  totalCount: 0
})

const displayLocations = computed(() => {
  if (!matrixData.value) return []
  return Object.keys(matrixData.value)
})

const locationNavItems = computed(() => {
  const orderedLocations = Object.keys(featureData.value)
  const totalItems = []

  const totalKeys = Object.keys(aggregatedData.value)
  totalKeys.forEach((featureType) => {
    totalItems.push({
      id: `count-total-${featureType}`,
      fullLabel: `總-${featureType}`,
      targetKey: featureType,
      kind: 'total'
    })
  })

  orderedLocations.forEach((location, index) => {
    totalItems.push({
      id: `count-location-${index}`,
      fullLabel: location,
      targetKey: location,
      kind: 'location'
    })
  })

  return totalItems
})

const getLocationAnchorId = (location) => `count-location-anchor-${location}`
const getAggregatedAnchorId = (featureType) => `count-total-anchor-${featureType}`

const handleLocationNavJump = async (nav) => {
  await nextTick()

  if (nav.kind === 'total') {
    const titleEl = document.querySelector(`#${getAggregatedAnchorId(nav.targetKey)} .category-title`)
    if (titleEl) {
      titleEl.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
    return
  }

  const target = document.getElementById(getLocationAnchorId(nav.targetKey))

  if (!target) return

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })
}

// 处理匹配到的地点列表
const handleMatchedLocations = (locations) => {
  matchedLocations.value = locations
}

// 处理匹配状态
const handleIsMatching = (matching) => {
  isMatching.value = matching
}

const loadData = async () => {
  if (matchedLocations.value.length === 0) {
    error.value = t('phonology.phonology.countphos.states.minLocationError')
    return
  }

  error.value = null
  featureData.value = {}
  aggregatedData.value = {}

  await loadCountsTask.run(async () => {
    // 調用 API
    const result = await getFeatureCounts({ locations: matchedLocations.value })

    // 存儲原始數據
    featureData.value = result

    // 計算匯總數據
    aggregatedData.value = calculateAggregatedData(result)
  }, {
    onError: (err) => {
      console.error('加載失敗:', err)
      error.value = err.message || t('phonology.phonology.countphos.states.loadError')
    }
  })
}

// 計算匯總統計數據
const calculateAggregatedData = (data) => {
  const aggregated = {}

  // 遍歷每個地點的數據
  Object.keys(data).forEach(locationName => {
    const locationData = data[locationName]

    // 遍歷每個特徵類型（聲母/韻母/聲調）
    Object.keys(locationData).forEach(featureType => {
      if (!aggregated[featureType]) {
        aggregated[featureType] = {}
      }

      const features = locationData[featureType]

      // 遍歷每個音節
      Object.keys(features).forEach(syllable => {
        if (!aggregated[featureType][syllable]) {
          aggregated[featureType][syllable] = {
            totalCount: 0,        // 總數量
            locationCount: 0,     // 出現在多少個地點
            locations: []         // 具體哪些地點
          }
        }

        aggregated[featureType][syllable].totalCount += features[syllable]
        aggregated[featureType][syllable].locationCount += 1
        aggregated[featureType][syllable].locations.push(locationName)
      })
    })
  })

  const preferredOrder = ['聲母', '韻母', '聲調']
  const orderedAggregated = {}

  preferredOrder.forEach((type) => {
    if (aggregated[type]) {
      orderedAggregated[type] = aggregated[type]
    }
  })

  Object.keys(aggregated).forEach((type) => {
    if (!Object.prototype.hasOwnProperty.call(orderedAggregated, type)) {
      orderedAggregated[type] = aggregated[type]
    }
  })

  return orderedAggregated
}

// 打开地点详情弹窗
const openLocationModal = (syllable, featureType, stats) => {
  modalData.value = {
    syllable,
    featureType,
    locations: stats.locations,
    totalCount: stats.totalCount
  }
  showLocationModal.value = true
}

// 关闭弹窗
const closeLocationModal = () => {
  showLocationModal.value = false
}
</script>

<template>
  <div class="phonology-page">
    <!-- <div class="page-header">
      <h2 class="page-title">🧮 音節統計</h2>
    </div> -->

    <!-- 地点输入组件 -->
    <div class="input-section">
        <LocationMultiInput
            v-model="queryStrings"
            @update:matchedLocations="handleMatchedLocations"
            @update:isMatching="handleIsMatching"
            :max-locations="PHONOLOGY_LOCATION_LIMITS.countphos"
        />
      <button
          class="load-btn"
          @click="loadData"
          :disabled="matchedLocations.length === 0 || loading || isMatching"
      >
        <span v-if="isMatching" class="ui-loading--inline" aria-hidden="true">↻</span>
        <span v-else-if="loading">{{ $t('phonology.phonology.countphos.actions.loading') }}</span>
        <span v-else>{{ $t('phonology.phonology.countphos.actions.query') }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ $t('phonology.phonology.countphos.actions.loading') }}</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">{{ $t('phonology.phonology.countphos.actions.retry') }}</button>
    </div>

    <div v-else-if="Object.keys(featureData).length > 0" class="results-container">
      <!-- 匯總統計部分 -->
      <section class="aggregated-section">
<!--        <h3 class="section-title">匯總統計</h3>-->
        <h3 class="section-title">{{ $t('phonology.phonology.countphos.subtitle', { count: matchedLocations.length }) }}</h3>

        <div
            v-for="(features, featureType) in aggregatedData"
            :key="featureType"
            :id="getAggregatedAnchorId(featureType)"
            class="feature-category"
        >
          <h4 class="category-title">{{ featureType }}</h4>
          <div class="syllable-grid">
            <div
                v-for="(stats, syllable) in features"
                :key="syllable"
                class="syllable-card"
            >
              <div class="syllable-name">{{ syllable }}</div>
              <div class="syllable-stats">
                <span class="stat-item">
                  <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.total') }}:</span>
                  <span class="stat-value">{{ stats.totalCount }}</span>
                </span>
                <span class="stat-item">
                  <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.locationCount') }}:</span>
                  <span class="stat-value">{{ stats.locationCount }}</span>
                </span>
              </div>
              <div class="location-tags">
                <!-- 显示前10个地点 -->
                <span
                    v-for="loc in stats.locations.slice(0, 10)"
                    :key="loc"
                    class="location-tag"
                >
                  {{ loc }}
                </span>
                <!-- 如果超过10个，显示展开按钮 -->
                <button
                    v-if="stats.locations.length > 10"
                    class="expand-btn"
                    @click="openLocationModal(syllable, featureType, stats)"
                >
                  {{ $t('phonology.phonology.countphos.stats.more', { count: stats.locations.length - 10 }) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 地點詳情部分 -->
      <section class="locations-section">
        <h3 class="section-title">{{ $t('phonology.phonology.countphos.sections.locations') }}</h3>
        <p class="section-subtitle">{{ $t('phonology.phonology.countphos.sections.locationsSubtitle') }}</p>

        <div
            v-for="(locationData, locationName) in featureData"
            :key="locationName"
            :id="getLocationAnchorId(locationName)"
            class="location-detail"
        >
          <h4 class="location-name">{{ locationName }}</h4>

          <div
              v-for="(features, featureType) in locationData"
              :key="featureType"
              class="feature-group"
          >
            <h5 class="feature-type">{{ featureType }}</h5>
            <div class="feature-tags">
              <span
                  v-for="(count, syllable) in features"
                  :key="syllable"
                  class="feature-tag"
              >
                <span class="tag-syllable">{{ syllable }}</span>
                <span class="tag-count">{{ count }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="empty">
      <p>{{ $t('phonology.phonology.countphos.states.emptyInput') }}</p>
    </div>

    <CountLocationJumpNav
      v-if="Object.keys(featureData).length > 0 && locationNavItems.length > 0"
      :items="locationNavItems"
      @jump="handleLocationNavJump"
    />

    <!-- 地点详情弹窗 -->
    <AppModal
      :model-value="showLocationModal"
      size="sm"
      :title="$t('phonology.phonology.countphos.modal.title', { featureType: modalData.featureType, syllable: modalData.syllable })"
      :close-label="t('common.button.close')"
      :z-index="20000"
      @update:modelValue="closeLocationModal"
    >
      <div class="modal-stats">
        <span class="modal-stat-item">
          <span class="modal-stat-label">{{ $t('phonology.phonology.countphos.stats.total') }}:</span>
          <span class="modal-stat-value">{{ modalData.totalCount }}</span>
        </span>
        <span class="modal-stat-item">
          <span class="modal-stat-label">{{ $t('phonology.phonology.countphos.stats.locationCount') }}:</span>
          <span class="modal-stat-value">{{ modalData.locations.length }}</span>
        </span>
      </div>

      <div class="modal-locations-list">
        <span
            v-for="(loc, index) in modalData.locations"
            :key="index"
            class="modal-location-chip"
        >
          {{ loc }}
        </span>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.phonology-page {
  margin-top: 20px;
  min-width: 80dvw;
}
.page-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-dark-light);
}

.input-section {
  max-width: 600px;
  margin: 0 auto 30px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  align-items: center;
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
}

.load-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-hover) 0%, #004ba0 100%);
  box-shadow: 0 6px 16px var(--color-primary-shadow-light), 0 3px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.load-btn:active:not(:disabled) {
  transform: translateY(0);
}

.load-btn:disabled {
  background: var(--bg-hover-medium);
  color: var(--text-secondary);
  cursor: not-allowed;
  box-shadow: none;
}

/* 按钮内的小旋转器 */

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 15px;
}



.loading p {
  color: var(--text-secondary);
  font-size: 15px;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 15px;
}

.error p {
  color: var(--color-error);
  font-size: 16px;
  font-weight: 500;
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
}

.retry-btn:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}


/* 結果容器 */
.results-container {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 區塊標題 */
.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 14px;
  color: var(--text-dark-light);
  margin-bottom: 20px;
}

/* 匯總統計部分 */
.aggregated-section {
  background: var(--glass-medium2);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: 12px;
  border: 1px solid var(--border-gray-light);
}

.feature-category {
  margin-bottom: 24px;
}

.feature-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-gray-light);
}

.syllable-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.syllable-card {
  background: var(--glass-very-light2);
  border: 1px solid var(--border-gray-lighter);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.syllable-card:hover {
  background: var(--glass-light2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.syllable-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.syllable-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  gap: 4px;
  font-size: 13px;
}

.stat-label {
  color: var(--text-dark-light);
  white-space: nowrap;
}

.stat-value {
  color: var(--color-primary);
  font-weight: 600;
}

.location-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.location-tag {
  background: rgba(0, 122, 255, 0.1);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 地點詳情部分 */
.locations-section {
  background: var(--glass-medium2);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-gray-light);
}

.location-detail {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(247, 251, 255, 0.66));
  border: 1px solid rgba(0, 122, 255, 0.12);
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 10px 24px rgba(20, 38, 60, 0.06);
}

.location-detail:last-child {
  margin-bottom: 0;
}

.location-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 122, 255, 0.12);
}

.feature-group {
  margin-bottom: 16px;
}

.feature-group:last-child {
  margin-bottom: 0;
}

.feature-type {
  font-size: 15px;
  font-weight: 700;
  color: #35679b;
  margin-bottom: 10px;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 122, 255, 0.12);
  border-radius: 999px;
  padding: 6px 10px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  transition: all 0.2s ease;
}

.feature-tag:hover {
  background: rgba(255, 255, 255, 0.96);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 122, 255, 0.08);
}

.tag-syllable {
  font-size: 14px;
  font-weight: 700;
  color: #274b73;
}

.tag-count {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 700;
  background: rgba(0, 122, 255, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--text-secondary);
  font-size: 16px;
}

/* 展开按钮样式 */
.expand-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);
}

.expand-btn:hover {
  background: linear-gradient(135deg, #0051d5, #003d9e);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 122, 255, 0.4);
}

.expand-btn:active {
  transform: translateY(0);
}

.modal-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 122, 255, 0.08);
  border-radius: 12px;
}

.modal-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.modal-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #007aff;
}

.modal-locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.modal-location-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 14px;
  color: #333;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.modal-location-chip:hover {
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
</style>
