<template>
  <div class="ngram-stats-page">
    <h3 class="villagesml-subtab-title">模式分析 - N-gram 統計</h3>

    <!-- Info Banner (if coming from explore page) -->
    <div v-if="route.query.ngram" class="info-banner glass-panel">
      <span>正在分析 N-gram：<strong>{{ route.query.ngram }}</strong></span>
      <button @click="clearNgram" class="text-button">清除</button>
    </div>

    <!-- Regional Distribution -->
    <div class="regional-section glass-panel">
      <h2>區域分佈</h2>
      <div class="controls">
        <input
          v-model="regionalNgram"
          type="text"
          placeholder="輸入 N-gram"
          class="text-input"
        />
        <select v-model="regionalLevel" class="select-input">
          <option value="city">城市</option>
          <option value="county">區縣</option>
          <option value="township">鄉鎮</option>
        </select>
        <button
          class="query-button"
          :disabled="!regionalNgram || loadingRegional"
          @click="loadRegionalDistribution"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingRegional" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else-if="regionalData.length > 0" class="regional-results">
        <div class="regional-chart">
          <div
            v-for="(item, index) in regionalData.slice(0, 20)"
            :key="index"
            class="regional-bar"
          >
            <RegionDisplay :item="item" mode="full" class="region-name" />
            <div class="bar-container">
              <div
                class="bar-fill"
                :style="{ width: `${(item.percentage || item.frequency / maxRegionalFreq) * 100}%` }"
              ></div>
            </div>
            <div class="region-value">
              {{ item.frequency }} ({{ ((item.percentage || 0) * 100).toFixed(1) }}%)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tendency Analysis -->
    <div class="tendency-section glass-panel">
      <h2>傾向性分析</h2>
      <div class="controls">
        <input
          v-model="tendencyNgram"
          type="text"
          placeholder="輸入 N-gram"
          class="text-input"
        />
        <select v-model="tendencyLevel" class="select-input">
          <option value="city">城市</option>
          <option value="county">區縣</option>
          <option value="township">鄉鎮</option>
        </select>
        <button
          class="query-button"
          :disabled="!tendencyNgram || loadingTendency"
          @click="loadTendency"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingTendency" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else-if="tendencyData.length > 0" class="tendency-results">
        <div class="tendency-table">
          <div class="table-header">
            <div class="col">區域</div>
            <div class="col">Z分數</div>
            <div class="col">頻率</div>
            <div class="col">傾向性</div>
          </div>
          <div class="table-body">
            <div
              v-for="(item, index) in tendencyData.slice(0, 20)"
              :key="index"
              class="table-row"
              :class="getTendencyClass(item.z_score)"
            >
              <RegionDisplay :item="item" mode="full" class="col" />
              <div class="col">{{ item.z_score.toFixed(2) }}</div>
              <div class="col">{{ item.frequency }}</div>
              <div class="col">
                <div class="tendency-bar">
                  <div
                    class="tendency-fill"
                    :style="{
                      width: `${Math.abs(item.z_score) * 10}%`,
                      background: item.z_score >= 0 ? 'var(--color-primary)' : '#e74c3c'
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Significance Analysis -->
    <div class="significance-section glass-panel">
      <h2>顯著性分析</h2>
      <div class="controls">
        <input
          v-model="significanceNgram"
          type="text"
          placeholder="輸入 N-gram"
          class="text-input"
        />
        <select v-model="significanceLevel" class="select-input">
          <option value="city">城市</option>
          <option value="county">區縣</option>
          <option value="township">鄉鎮</option>
        </select>
        <button
          class="query-button"
          :disabled="!significanceNgram || loadingSignificance"
          @click="loadSignificance"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingSignificance" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else-if="significanceData.length > 0" class="significance-results">
        <div class="significance-table">
          <div class="table-header">
            <div class="col">區域</div>
            <div class="col">卡方值</div>
            <div class="col">P值</div>
            <div class="col">顯著性</div>
          </div>
          <div class="table-body">
            <div
              v-for="(item, index) in significanceData.slice(0, 20)"
              :key="index"
              class="table-row"
              :class="{ 'significant': item.p_value < 0.05 }"
            >
              <div class="col">{{ item.region_name }}</div>
              <div class="col">{{ item.chi_square.toFixed(4) }}</div>
              <div class="col">
                <span :class="getPValueClass(item.p_value)">
                  {{ item.p_value.toFixed(6) }}
                </span>
              </div>
              <div class="col">
                <span class="sig-badge" :class="getSignificanceBadge(item.p_value)">
                  {{ getSignificanceLabel(item.p_value) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RegionDisplay from '@/components/common/RegionDisplay.vue'
import {
  getNgramRegional,
  getNgramTendency,
  getNgramSignificance
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

const route = useRoute()
const router = useRouter()

// State
const regionalNgram = ref('')
const regionalLevel = ref('city')
const regionalHierarchy = ref({ city: null, county: null, township: null })
const regionalData = ref([])

const tendencyNgram = ref('')
const tendencyLevel = ref('city')
const tendencyHierarchy = ref({ city: null, county: null, township: null })
const tendencyData = ref([])

const significanceNgram = ref('')
const significanceLevel = ref('city')
const significanceData = ref([])

const loadingRegional = ref(false)
const loadingTendency = ref(false)
const loadingSignificance = ref(false)

// Computed
const maxRegionalFreq = computed(() => {
  if (regionalData.value.length === 0) return 1
  return Math.max(...regionalData.value.map(item => item.frequency))
})

// Methods
const loadRegionalDistribution = async () => {
  if (!regionalNgram.value) return

  loadingRegional.value = true
  try {
    regionalData.value = await getNgramRegional({
      ngram: regionalNgram.value,
      region_level: regionalLevel.value,
      ...regionalHierarchy.value
    })
  } catch (error) {
    showError('加載區域分佈失敗')
  } finally {
    loadingRegional.value = false
  }
}

const loadTendency = async () => {
  if (!tendencyNgram.value) return

  loadingTendency.value = true
  try {
    tendencyData.value = await getNgramTendency({
      ngram: tendencyNgram.value,
      region_level: tendencyLevel.value,
      ...tendencyHierarchy.value
    })
  } catch (error) {
    showError('加載傾向性數據失敗')
  } finally {
    loadingTendency.value = false
  }
}

const loadSignificance = async () => {
  if (!significanceNgram.value) return

  loadingSignificance.value = true
  try {
    significanceData.value = await getNgramSignificance({
      ngram: significanceNgram.value,
      region_level: significanceLevel.value
    })
  } catch (error) {
    showError('加載顯著性數據失敗')
  } finally {
    loadingSignificance.value = false
  }
}

const getTendencyClass = (zScore) => {
  if (Math.abs(zScore) >= 2) return 'strong-tendency'
  if (Math.abs(zScore) >= 1) return 'moderate-tendency'
  return ''
}

const getPValueClass = (pValue) => {
  if (pValue < 0.001) return 'p-very-significant'
  if (pValue < 0.01) return 'p-significant'
  if (pValue < 0.05) return 'p-marginal'
  return 'p-not-significant'
}

const getSignificanceBadge = (pValue) => {
  if (pValue < 0.001) return 'badge-very-significant'
  if (pValue < 0.01) return 'badge-significant'
  if (pValue < 0.05) return 'badge-marginal'
  return 'badge-not-significant'
}

const getSignificanceLabel = (pValue) => {
  if (pValue < 0.001) return '***'
  if (pValue < 0.01) return '**'
  if (pValue < 0.05) return '*'
  return 'n.s.'
}

const clearNgram = () => {
  router.push({
    path: '/villagesML',
    query: {
      module: 'pattern',
      subtab: 'ngram-stats'
    }
  })
  regionalNgram.value = ''
  tendencyNgram.value = ''
  significanceNgram.value = ''
}

onMounted(() => {
  const ngramParam = route.query.ngram
  if (ngramParam) {
    regionalNgram.value = ngramParam
    tendencyNgram.value = ngramParam
    significanceNgram.value = ngramParam
    // Optionally auto-trigger first query
    loadRegionalDistribution()
  }
})
</script>

<style scoped>
.ngram-stats-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.info-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 10px;
  font-size: 14px;
}

.info-banner strong {
  color: var(--color-primary);
  margin: 0 6px;
}

.text-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.text-button:hover {
  background: rgba(74, 144, 226, 0.1);
  border-color: var(--color-primary);
}

.regional-section,
.tendency-section,
.significance-section {
  padding: 16px;
  margin-bottom: 16px;
}

.regional-section h2,
.tendency-section h2,
.significance-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.select-input,
.text-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.select-input {
  width: 150px;
}

.text-input {
  flex: 1;
}

.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.query-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
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

.regional-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.regional-bar {
  display: grid;
  grid-template-columns: 150px 1fr 150px;
  gap: 12px;
  align-items: center;
}

.region-name {
  font-weight: 500;
  color: var(--text-primary);
}

.region-value {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: right;
}

.bar-container {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.tendency-table,
.significance-table {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 2fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.table-row.strong-tendency {
  background: rgba(243, 156, 18, 0.15);
}

.table-row.moderate-tendency {
  background: rgba(243, 156, 18, 0.08);
}

.table-row.significant {
  background: rgba(80, 200, 120, 0.1);
}

.tendency-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.p-very-significant {
  color: #27ae60;
  font-weight: 700;
}

.p-significant {
  color: #2ecc71;
  font-weight: 600;
}

.p-marginal {
  color: #f39c12;
  font-weight: 500;
}

.p-not-significant {
  color: var(--text-secondary);
}

.sig-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-very-significant {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.badge-significant {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.badge-marginal {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.badge-not-significant {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .select-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
