<template>
  <Teleport to="body">
    <div v-if="visible" class="glass-overlay" @mousedown.self="$emit('close')">
      <div class="feature-stats-modal glass-modal" role="dialog" aria-modal="true" @click.stop>
        <!-- 頭部 -->
        <div class="modal-header">
          <div class="modal-title">📊 {{ locationName }} · {{ featureKey }}-{{ featureVal }} 統計</div>
          <button class="modal-close" type="button" @click="$emit('close')">×</button>
        </div>

        <!-- 主體內容 -->
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <span>載入中...</span>
          </div>

          <div v-else-if="statsData" class="stats-content">
            <!-- 特徵統計列表 -->
            <div v-for="(featureName, index) in displayFeatures" :key="index" class="feature-group">
              <div class="feature-title">{{ featureName }}</div>

              <div class="stats-list">
                <div
                  v-for="(stat, value) in getFeatureStats(featureName)"
                  :key="value"
                  class="stat-item"
                >
                  <div class="stat-header">
                    <span class="stat-label">{{ value }}</span>
                    <span class="stat-count">{{ stat.count }} 字 ({{ (stat.ratio * 100).toFixed(1) }}%)</span>
                  </div>

                  <!-- 漢字列表：始終展開，拼接成字符串顯示 -->
                  <div class="char-list">
                    {{ getCharsString(stat.char_indices) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="error-state">
            <span>暫無資料</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  locationName: { type: String, default: '' },
  featureKey: { type: String, default: '' },
  featureVal: { type: [String, Number], default: '' },
  statsData: { type: Object, default: null },
  charsMap: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

// 獲取要顯示的特徵列表
const displayFeatures = computed(() => {
  if (!props.statsData || !props.statsData.data || !props.statsData.data[props.locationName]) {
    return []
  }
  const locationData = props.statsData.data[props.locationName]
  return Object.keys(locationData).filter(key => key !== 'total_chars')
})

// 獲取特定特徵的統計資料（按 count 降序排序）
const getFeatureStats = (featureName) => {
  if (!props.statsData || !props.statsData.data || !props.statsData.data[props.locationName]) {
    return {}
  }
  const featureData = props.statsData.data[props.locationName][featureName] || {}

  // 轉換為陣列並按 count 降序排序
  const sortedEntries = Object.entries(featureData)
    .sort((a, b) => b[1].count - a[1].count)

  // 轉換回物件（保持排序）
  return Object.fromEntries(sortedEntries)
}

// 將字符索引陣列轉換為字符串（用空格分隔）
const getCharsString = (charIndices) => {
  if (!charIndices || charIndices.length === 0) return ''
  return charIndices.map(idx => props.charsMap[idx]).join(' ')
}
</script>

<style>
/* 非 scoped 樣式 - 全域遮罩和模態框（複用 LocationDetailPopup 的樣式）*/
.glass-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(6px);
}

.glass-modal {
  width: min(720px, 94vw);
  max-height: min(70vh, 640px);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-title {
  font-size: 15px;
  font-weight: 650;
  color: #1d1d1f;
}

.modal-close {
  appearance: none;
  border: none;
  background: rgba(142, 142, 147, 0.15);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  line-height: 28px;
  color: #666;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(142, 142, 147, 0.25);
  color: #333;
}

.modal-body {
  padding: 12px 14px 16px;
  overflow: auto;
  //max-height: calc(min(70vh, 640px) - 100px);
}
</style>

<style scoped>
/* 特徵統計彈窗特定樣式 */
.feature-stats-modal {
  width: min(600px, 94vw);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.stats-content {
  font-size: 14px;
}

.feature-group {
  margin-bottom: 24px;
}

.feature-group:last-child {
  margin-bottom: 0;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.stat-item:hover {
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
}

.stat-label {
  font-weight: 600;
  color: #1d1d1f;
  flex: 1;
}

.stat-count {
  color: #666;
  font-size: 13px;
}

.char-list {
  padding: 12px 16px;
  background: rgba(0, 122, 255, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 14px;
  color: #1d1d1f;
  line-height: 1.8;
  word-break: break-all;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .feature-stats-modal {
    width: 100%;
    max-width: 100%;
    max-height: 90vh;
  }

  .stat-header {
    padding: 10px 12px;
  }

  .char-list {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>
