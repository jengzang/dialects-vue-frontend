<template>
  <div class="pattern-frequency-page">
    <h3 class="villagesml-subtab-title">
      模式分析 - 頻率分析
      <HelpIcon content="統計村名模式的出現頻率。全局模式：分析全省範圍內最常見的模式。區域模式：分析特定區域內的高頻模式。支持設置最小佔比和返回數量" />
    </h3>

    <div class="vml-glass-panel">
      <h2>🔍 模式頻率分析</h2>

      <!-- Query Mode Selection -->
      <div class="mode-selector">
        <RadioGroup
            name="patternQueryMode"
            :options="queryModeOptions"
            v-model="queryMode"
        />
      </div>

      <!-- Controls -->
      <div class="controls vml-control-surface vml-control-row vml-control-row--center">
        <!-- Regional Selection (only show when regional mode) -->
        <div v-if="queryMode === 'regional'" class="control-group vml-control-field">
          <FilterableSelect
            v-model="regionName"
            :level="regionLevel"
            @update:level="(newLevel) => regionLevel = newLevel"
            @update:hierarchy="(h) => regionHierarchy = h"
            placeholder="請選擇或輸入區域"
          />
        </div>

        <div class="control-group vml-control-field vml-control-field--compact">
          <label class="control-label">返回數量</label>
          <input
            v-model.number="topN"
            type="number"
            min="10"
            :max="queryMode === 'global' ? 100 : 50"
            class="vml-number-input"
          />
        </div>

        <div v-if="queryMode === 'global'" class="control-group vml-control-field vml-control-field--compact">
          <label class="control-label">最小佔比(%)</label>
          <input
            v-model.number="minPercentage"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            placeholder="如: 1"
            class="vml-number-input"
          />
        </div>

        <div class="vml-control-actions">
          <button
            class="query-button"
            :disabled="loading || (queryMode === 'regional' && !regionName)"
            @click="loadPatterns"
          >
            查詢
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <!-- Results -->
      <div v-else-if="patterns.length > 0" class="results">
        <div class="pattern-grid">
          <div
            v-for="(pattern, index) in patterns"
            :key="index"
            class="pattern-card"
            :class="{ 'top-5': index < 5 }"
          >
            <div class="pattern-rank">{{ index + 1 }}</div>
            <div class="pattern-text">{{ pattern.pattern }}</div>
            <div class="pattern-stats">
              <!-- 全局模式：显示村庄数 -->
              <div v-if="queryMode === 'global'" class="stat-item">
                <span class="stat-label">村莊數:</span>
                <span class="stat-value">{{ pattern.village_count || 0 }}</span>
              </div>
              <!-- 区域模式：显示区域名称 -->
              <div v-else class="stat-item">
                <span class="stat-label">區域:</span>
                <span class="stat-value region-name">{{ pattern.region_name || '-' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">佔比:</span>
                <span class="stat-value">{{ pattern.frequency != null ? (pattern.frequency * 100).toFixed(2) : '0.00' }}%</span>
              </div>
            </div>
            <div class="pattern-bar">
              <div
                class="bar-fill"
                :style="{ width: `${pattern.frequency != null ? (pattern.frequency / maxFrequency) * 100 : 0}%` }"
              ></div>
            </div>
            <button class="action-button" @click="goToTendency(pattern.pattern)">
              查看傾向性
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import {
  getPatternFrequencyGlobal,
  getPatternFrequencyRegional
} from '@/api/index.js'
import { showError } from '@/utils/ui/message.js'
import RadioGroup from "@/components/selector/RadioGroup.vue";

const router = useRouter()
const route = useRoute()

// State
const queryMode = ref('global')
const queryModeOptions = [
  { value: 'global', label: '全局模式' },
  { value: 'regional', label: '區域模式' }
]

const patterns = ref([])
const loading = ref(false)

// Global mode params
const topN = ref(50)
const minPercentage = ref(1.0) // 最小佔比百分比（如1表示1%，转换为0.01传给后端）

// Regional mode params
const regionLevel = ref('city')
const regionName = ref('')
const regionHierarchy = ref({ city: null, county: null, township: null })

// Computed
const maxFrequency = computed(() => {
  if (patterns.value.length === 0) return 1
  return Math.max(...patterns.value.map(item => item.frequency || 0))
})

// Methods
const loadPatterns = async () => {
  loading.value = true
  try {
    if (queryMode.value === 'global') {
      const params = {
        top_k: topN.value
      }
      // 只有当用户输入了最小佔比时才传递该参数
      if (minPercentage.value > 0) {
        params.min_frequency = minPercentage.value / 100 // 将百分比转换为小数（如1% → 0.01）
      }
      patterns.value = await getPatternFrequencyGlobal(params)
    } else {
      if (!regionName.value) return
      patterns.value = await getPatternFrequencyRegional({
        region_level: regionLevel.value,
        ...regionHierarchy.value,
        top_k: topN.value
      })
    }
  } catch (error) {
    showError('加載模式頻率失敗')
  } finally {
    loading.value = false
  }
}

const goToTendency = (pattern) => {
  router.push({
    query: {
      ...route.query,
      subtab: 'tendency',
      pattern: pattern
    }
  })
}
</script>

<style scoped lang="scss">
.pattern-frequency-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

// .vml-glass-panel {
//   @include flex-col;
// }

.vml-glass-panel h2 {
  white-space: nowrap;
  flex-shrink: 0;
}

.mode-selector {
  display: flex;
  gap: 24px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.controls {
  margin: 12px 0 16px;
}

.control-group {
  min-width: 0;
}

.control-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.vml-number-input {
  width: 150px;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.pattern-card {
  padding: 12px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
  position: relative;
}

.pattern-card:hover {
  transform: translateY(-5px);
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.pattern-card.top-5 {
  background: rgba(var(--color-warning-rgb), 0.15);
  border: 2px solid rgba(var(--color-warning-rgb), 0.3);
}

.pattern-rank {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border-radius: var(--radius-full);
  @include flex-center;
  font-weight: 700;
  font-size: 14px;
}

.pattern-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.pattern-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-item {
  @include flex-col;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.region-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.pattern-bar {
  height: 8px;
  background: var(--glass-50);
  border-radius: var(--radius-xs);
  overflow: hidden;
  margin-bottom: 12px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--vml-blue-dark));
  transition: width 0.5s ease;
}

.action-button {
  width: 100%;
  padding: 8px 16px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary);
}

@media (min-aspect-ratio: 1/1) {
  .vml-glass-panel {
    flex-direction: row;
    align-items: center;
  }

  .controls {
    flex: 1;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .vml-number-input {
    width: 100%;
  }

}
</style>
