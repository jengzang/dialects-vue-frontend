<template>
  <div class="spatial-hotspots-tab">
<!--      <h3 class="villagesml-subtab-title">空間分析 - 空間熱點</h3>-->
    <h2>
      🔥 空間熱點
      <HelpIcon content="識別村莊密集分布的熱點區域。每個熱點包含中心坐標、半徑和密度分數，反映該區域的村莊聚集程度" />
    </h2>

    <div v-if="loadingHotspots" class="vml-loading"">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="hotspots.length > 0" class="hotspots-content">
      <!-- Hotspots List -->
      <div class="hotspots-list">
        <div
          v-for="hotspot in hotspots"
          :key="hotspot.hotspot_id"
          class="hotspot-card"
          :class="{ 'selected': selectedHotspot?.hotspot_id === hotspot.hotspot_id }"
          @click="selectHotspot(hotspot)"
        >
          <div class="hotspot-header">
            <span class="hotspot-id">熱點 #{{ hotspot.hotspot_id }}</span>
            <span class="hotspot-count">{{ hotspot.village_count }} 村</span>
          </div>
          <div class="hotspot-info">
            <div class="info-item">
              <span class="label">中心:</span>
              <span class="value">
                {{ hotspot.center_lat?.toFixed(4) || 'N/A' }}, {{ hotspot.center_lon?.toFixed(4) || 'N/A' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">半徑:</span>
              <span class="value">{{ hotspot.radius_km?.toFixed(2) || 'N/A' }} km</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Hotspot Detail -->
      <div v-if="selectedHotspot" ref="hotspotDetailRef" class="hotspot-detail">
        <h3>熱點詳情 #{{ selectedHotspot.hotspot_id }}</h3>

        <div v-if="loadingHotspotDetail" class="vml-loading"">
          <div class="ui-loading--page" aria-hidden="true"></div>
        </div>

        <div v-else-if="hotspotDetail" class="detail-content">
          <div class="detail-stats">
            <div class="stat-card">
              <div class="stat-label">村莊數量</div>
              <div class="stat-value">{{ hotspotDetail.village_count || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">密度分數</div>
              <div class="stat-value">
                {{ hotspotDetail.density_score?.toFixed(4) || 'N/A' }}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">半徑</div>
              <div class="stat-value">
                {{ hotspotDetail.radius_km?.toFixed(2) || 'N/A' }} km
              </div>
            </div>
<!--            <div class="stat-card">-->
<!--              <div class="stat-label">中心坐標</div>-->
<!--              <div class="stat-value">-->
<!--                {{ hotspotDetail.center_lat?.toFixed(4) || 'N/A' }}, {{ hotspotDetail.center_lon?.toFixed(4) || 'N/A' }}-->
<!--              </div>-->
<!--            </div>-->
          </div>

          <!-- 熱點地圖 -->
          <SpatialMap mode="hotspot" :hotspot="hotspotDetail" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import SpatialMap from './SpatialMap.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { getSpatialHotspots, getSpatialHotspotDetail } from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const hotspots = ref([])
const selectedHotspot = ref(null)
const hotspotDetail = ref(null)
const loadingHotspots = ref(false)
const loadingHotspotDetail = ref(false)
const hotspotDetailRef = ref(null)

// Methods
const loadHotspots = async () => {
  loadingHotspots.value = true
  try {
    const data = await getSpatialHotspots()
    // 按村莊數量從高到低排序
    hotspots.value = data.sort((a, b) => (b.village_count || 0) - (a.village_count || 0))
  } catch (error) {
    showError('加載熱點數據失敗')
  } finally {
    loadingHotspots.value = false
  }
}

const selectHotspot = async (hotspot) => {
  selectedHotspot.value = hotspot
  hotspotDetail.value = null

  // 自动加载详细信息
  loadingHotspotDetail.value = true
  try {
    hotspotDetail.value = await getSpatialHotspotDetail(hotspot.hotspot_id)

    // 竖屏时自动滚动到页面底部
    if (window.innerHeight > window.innerWidth) {
      // 等待 DOM 完全渲染（包括地图组件）
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        })
      }, 300)
    }
  } catch (error) {
    showError('加載熱點詳情失敗')
  } finally {
    loadingHotspotDetail.value = false
  }
}

// 页面加载时自动加载热点数据
onMounted(() => {
  loadHotspots()
})
</script>

<style scoped>
.spatial-hotspots-tab {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 16px;
  background: var(--glass-60);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-40);
  box-shadow: var(--shadow-glass);
}

h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-weight: 600;
}

.load-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.load-button:hover:not(:disabled) {
  background: var(--vml-blue-dark);
}

.load-button:disabled {
  @include disabled-state;
}


.hotspots-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.hotspots-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  max-height: 500px;
  overflow: auto;
}

.hotspot-card {
  padding: 16px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.hotspot-card:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.hotspot-card.selected {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary);
}

.hotspot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hotspot-id {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.hotspot-count {
  padding: 4px 12px;
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning-dark);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.hotspot-info {
  @include flex-col;
  gap: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-item .label {
  color: var(--text-secondary);
}

.info-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.hotspot-detail {
  padding: 12px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
}

.hotspot-detail h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.detail-content {
  margin-top: 20px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 16px;
  background: var(--glass-50);
  border-radius: var(--radius-sm2);
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

@media (max-width: 600px) {
  .hotspots-content {
    grid-template-columns: 1fr;
  }
}

@media (max-aspect-ratio: 1/1) {
  .spatial-hotspots-tab {
    padding: 12px;
  }

  .hotspot-detail {
    padding: 12px;
  }
  .detail-stats{
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
