<template>
<!--  <ExploreLayout>-->
    <div class="spatial-integration-page">
      <h1 class="page-title">🌐 空間整合分析</h1>

      <!-- Query Mode Selector -->
      <div class="mode-selector glass-panel">
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'overview' }"
          @click="queryMode = 'overview'"
        >
          總覽
        </button>
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'by-char' }"
          @click="queryMode = 'by-char'"
        >
          按字符
        </button>
        <button
          class="mode-button"
          :class="{ 'active': queryMode === 'by-cluster' }"
          @click="queryMode = 'by-cluster'"
        >
          按聚類
        </button>
      </div>

      <!-- Overview Mode -->
      <div v-if="queryMode === 'overview'" class="overview-section">
        <div class="query-form glass-panel">
          <h3>空間整合查詢</h3>
          <div class="form-group">
            <label>區域選擇 (可選):</label>
            <FilterableSelect
              v-model="regionName"
              :level="regionLevel || 'city'"
              @update:level="(newLevel) => regionLevel = newLevel"
              placeholder="全部區域"
            />
          </div>
          <button
            class="query-button"
            :disabled="loadingIntegration"
            @click="loadIntegration"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingIntegration" class="loading-state glass-panel">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="integrationData" class="integration-results">
          <!-- Map Visualization -->
          <div class="map-section glass-panel">
            <h3>整合地圖</h3>
            <div class="map-placeholder">
              <p>🗺️ 空間整合可視化</p>
              <p class="map-note">
                顯示村莊分佈、熱點區域、聚類中心和傾向性數據
              </p>
            </div>
          </div>

          <!-- Statistics -->
          <div class="stats-section glass-panel">
            <h3>統計信息</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">村莊數量</div>
                <div class="stat-value">{{ integrationData.villages?.length || 0 }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">熱點數量</div>
                <div class="stat-value">{{ integrationData.hotspots?.length || 0 }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">聚類數量</div>
                <div class="stat-value">{{ integrationData.clusters?.length || 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- By Character Mode -->
      <div v-if="queryMode === 'by-char'" class="by-char-section">
        <div class="query-form glass-panel">
          <h3>按字符查詢空間分佈</h3>
          <div class="form-group">
            <label>字符:</label>
            <input
              v-model="queryChar"
              type="text"
              maxlength="1"
              placeholder="輸入單個字符"
              class="char-input"
            />
          </div>
          <button
            class="query-button"
            :disabled="!queryChar || loadingByChar"
            @click="loadByChar"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingByChar" class="loading-state glass-panel">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="charData" class="char-results">
          <!-- Spatial Distribution Map -->
          <div class="map-section glass-panel">
            <h3>{{ queryChar }} 的空間分佈</h3>
            <div class="map-placeholder">
              <p>🗺️ 字符空間分佈圖</p>
              <p class="map-note">
                顯示包含 "{{ queryChar }}" 的村莊分佈和相關熱點
              </p>
            </div>
          </div>

          <!-- Tendency Data -->
          <div v-if="charData.tendency" class="tendency-section glass-panel">
            <h3>區域傾向性</h3>
            <div class="tendency-list">
              <div
                v-for="(item, index) in charData.tendency.slice(0, 10)"
                :key="index"
                class="tendency-item"
              >
                <div class="tendency-region">{{ item.region }}</div>
                <div class="tendency-bar">
                  <div
                    class="tendency-fill"
                    :style="{
                      width: `${Math.abs(item.z_score) * 10}%`,
                      background: item.z_score >= 0 ? 'var(--color-primary)' : '#e74c3c'
                    }"
                  ></div>
                </div>
                <div class="tendency-value">Z: {{ item.z_score?.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- By Cluster Mode -->
      <div v-if="queryMode === 'by-cluster'" class="by-cluster-section">
        <div class="query-form glass-panel">
          <h3>按聚類查詢</h3>
          <div class="form-group">
            <label>聚類ID:</label>
            <input
              v-model.number="clusterId"
              type="number"
              min="1"
              placeholder="輸入聚類ID"
              class="number-input"
            />
          </div>
          <button
            class="query-button"
            :disabled="!clusterId || loadingByCluster"
            @click="loadByCluster"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingByCluster" class="loading-state glass-panel">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="clusterData" class="cluster-results">
          <!-- Cluster Map -->
          <div class="map-section glass-panel">
            <h3>聚類 #{{ clusterId }} 空間分佈</h3>
            <div class="map-placeholder">
              <p>🗺️ 聚類空間分佈圖</p>
              <p class="map-note">
                顯示聚類中的所有村莊和傾向性特徵
              </p>
            </div>
          </div>

          <!-- Cluster Characteristics -->
          <div v-if="clusterData.characteristics" class="characteristics-section glass-panel">
            <h3>聚類特徵</h3>
            <div class="characteristics-grid">
              <div
                v-for="(value, key) in clusterData.characteristics"
                :key="key"
                class="char-item"
              >
                <div class="char-label">{{ key }}</div>
                <div class="char-value">{{ formatValue(value) }}</div>
              </div>
            </div>
          </div>

          <!-- Villages List -->
          <div v-if="clusterData.villages" class="villages-section glass-panel">
            <h3>包含村莊 ({{ clusterData.villages.length }})</h3>
            <div class="villages-list">
              <div
                v-for="village in clusterData.villages.slice(0, 20)"
                :key="village.id"
                class="village-item"
              >
                <span class="village-name">{{ village.name }}</span>
                <span class="village-location">
                  {{ village.city }} / {{ village.county }}
                </span>
              </div>
            </div>
            <div v-if="clusterData.villages.length > 20" class="more-info">
              顯示前 20 個村莊，共 {{ clusterData.villages.length }} 個
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Section -->
      <div v-if="summary" class="summary-section glass-panel">
        <h2>整合摘要</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon">🔥</div>
            <div class="summary-label">總熱點數</div>
            <div class="summary-value">{{ summary.total_hotspots }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">🎯</div>
            <div class="summary-label">總聚類數</div>
            <div class="summary-value">{{ summary.total_clusters }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📊</div>
            <div class="summary-label">覆蓋率</div>
            <div class="summary-value">{{ (summary.coverage * 100).toFixed(1) }}%</div>
          </div>
        </div>
        <button
          class="load-button"
          :disabled="loadingSummary"
          @click="loadSummary"
        >
          加載摘要
        </button>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import {
  getSpatialIntegration,
  getSpatialIntegrationByChar,
  getSpatialIntegrationByCluster,
  getSpatialIntegrationSummary
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const queryMode = ref('overview')
const regionLevel = ref('')
const regionName = ref('')
const queryChar = ref('')
const clusterId = ref(null)

const integrationData = ref(null)
const charData = ref(null)
const clusterData = ref(null)
const summary = ref(null)

const loadingIntegration = ref(false)
const loadingByChar = ref(false)
const loadingByCluster = ref(false)
const loadingSummary = ref(false)

// Methods
const loadIntegration = async () => {
  loadingIntegration.value = true
  try {
    const params = {}
    if (regionLevel.value) {
      params.region_level = regionLevel.value
      params.region_name = regionName.value
    }
    integrationData.value = await getSpatialIntegration(params)
  } catch (error) {
    showError('加載整合數據失敗')
  } finally {
    loadingIntegration.value = false
  }
}

const loadByChar = async () => {
  if (!queryChar.value) return

  loadingByChar.value = true
  try {
    charData.value = await getSpatialIntegrationByChar(queryChar.value)
  } catch (error) {
    showError('加載字符數據失敗')
  } finally {
    loadingByChar.value = false
  }
}

const loadByCluster = async () => {
  if (!clusterId.value) return

  loadingByCluster.value = true
  try {
    clusterData.value = await getSpatialIntegrationByCluster(clusterId.value)
  } catch (error) {
    showError('加載聚類數據失敗')
  } finally {
    loadingByCluster.value = false
  }
}

const loadSummary = async () => {
  loadingSummary.value = true
  try {
    summary.value = await getSpatialIntegrationSummary()
  } catch (error) {
    showError('加載摘要失敗')
  } finally {
    loadingSummary.value = false
  }
}

const formatValue = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return value
}
</script>

<style scoped>
.spatial-integration-page {
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

.mode-selector {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 30px;
}

.mode-button {
  flex: 1;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-button:hover {
  background: rgba(74, 144, 226, 0.1);
}

.mode-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.query-form {
  padding: 24px;
  margin-bottom: 20px;
}

.query-form h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.form-group {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-secondary);
}

.select-input,
.text-input,
.number-input,
.char-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.5);
}

.char-input {
  width: 80px;
  font-size: 24px;
  text-align: center;
}

.select-input:focus,
.text-input:focus,
.number-input:focus,
.char-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.query-button,
.load-button {
  width: 100%;
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.query-button:hover:not(:disabled),
.load-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled,
.load-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.integration-results,
.char-results,
.cluster-results {
  display: grid;
  gap: 20px;
}

.map-section,
.stats-section,
.tendency-section,
.characteristics-section,
.villages-section {
  padding: 24px;
}

.map-section h3,
.stats-section h3,
.tendency-section h3,
.characteristics-section h3,
.villages-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.map-placeholder {
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.map-placeholder p {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.map-note {
  font-size: 14px !important;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.tendency-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 150px 1fr 100px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.tendency-region {
  font-weight: 600;
  color: var(--text-primary);
}

.tendency-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.tendency-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.characteristics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.char-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
}

.char-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.char-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.villages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.village-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.village-name {
  font-weight: 600;
  color: var(--text-primary);
}

.village-location {
  font-size: 13px;
  color: var(--text-secondary);
}

.more-info {
  margin-top: 12px;
  text-align: center;
  padding: 12px;
  background: rgba(243, 156, 18, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.summary-section {
  padding: 24px;
  margin-top: 30px;
}

.summary-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.summary-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .mode-selector {
    flex-direction: column;
  }

  .form-group {
    grid-template-columns: 1fr;
  }

  .tendency-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
