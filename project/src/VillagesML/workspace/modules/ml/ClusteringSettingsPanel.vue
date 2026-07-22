<template>
  <div class="vml-glass-panel">
    <h3 class="panel-title">聚類設定</h3>

    <!-- 登錄提示 -->
    <div v-if="!isAuthenticated" class="auth-notice">
      <span class="notice-icon">🔒</span>
      <span class="notice-text">此功能需要登錄</span>
    </div>

    <div class="settings-group vml-control-surface">
      <div class="setting-row vml-setting-row">
        <label>區域級別：</label>
        <SimpleSelectDropdown :match-trigger-width="true"
          v-model="settings.region_level"
          :options="regionLevelOptions"
        />
      </div>

      <div class="setting-row vml-setting-row">
        <label>算法：</label>
        <SimpleSelectDropdown :match-trigger-width="true"
          v-model="settings.algorithm"
          :options="algorithmOptions"
        />
      </div>

      <div class="setting-row vml-setting-row" v-if="settings.algorithm !== 'dbscan'">
        <label>聚類數 K：</label>
        <input
          v-model.number="settings.k"
          type="number"
          min="2"
          max="20"
          class="setting-input vm-setting-input"
        />
      </div>

      <!-- DBSCAN 參數配置 -->
      <div v-if="settings.algorithm === 'dbscan'" class="dbscan-config">
        <div class="config-header">
          <span class="config-title">DBSCAN 參數</span>
        </div>

        <div class="setting-row vml-setting-row">
          <label>鄰域半徑 (eps)：</label>
          <input
            v-model.number="settings.dbscan_config.eps"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            class="setting-input vm-setting-input"
          />
        </div>

        <div class="setting-row vml-setting-row">
          <label>最小樣本數：</label>
          <input
            v-model.number="settings.dbscan_config.min_samples"
            type="number"
            min="1"
            max="20"
            class="setting-input vm-setting-input"
          />
        </div>
      </div>

      <div class="feature-toggles">
        <CheckBox :model-value="settings.features.use_semantic" label="語義特徵" @update:modelValue="settings.features.use_semantic = $event" />
        <CheckBox :model-value="settings.features.use_morphology" label="形態特徵" @update:modelValue="settings.features.use_morphology = $event" />
        <CheckBox :model-value="settings.features.use_diversity" label="多樣性特徵" @update:modelValue="settings.features.use_diversity = $event" />
      </div>

      <button class="run-button solid-button" @click="runClustering" :disabled="loading || !isAuthenticated">
        {{ loading ? '運行中...' : isAuthenticated ? '🚀 運行聚類' : '🔒 需要登錄' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted, ref } from 'vue'
import { villagesMLStore } from '@/VillagesML/store/villagesMLStore.js'
import { userStore } from '@/main/store/store.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  regionCount: { type: Number, default: 0 }
})

const emit = defineEmits(['run'])

const settings = reactive(villagesMLStore.clusteringSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)

// Options
const regionLevelOptions = [
  { label: '市級', value: 'city' },
  { label: '區縣級', value: 'county' },
  { label: '鄉鎮級', value: 'township' }
]

const algorithmOptions = [
  { label: 'K-Means', value: 'kmeans' },
  { label: 'DBSCAN', value: 'dbscan' },
  { label: 'GMM', value: 'gmm' }
]

// 智能參數建議（針對 DBSCAN）
const suggestedParams = computed(() => {
  const count = props.regionCount

  // 針對不同規模的區域數量給出建議
  // eps 單位：特徵空間中的歐幾里得距離（無量綱）
  // 邏輯：點越少（市級），特徵距離越遠，需要更大的 eps
  //      點越多（鄉鎮級），特徵距離越近，需要更小的 eps
  if (count <= 30) {
    // 市級（如21個城市）- 點少，特徵差異大
    return { eps: 1.0, min_samples: 2 }
  } else if (count < 100) {
    // 區縣級（~120個）- 點中等，特徵差異適中
    return { eps: 0.5, min_samples: 3 }
  } else if (count < 500) {
    // 較大規模
    return { eps: 0.3, min_samples: 5 }
  } else {
    // 鄉鎮級（~1600個）- 點多，特徵相似
    return { eps: 0.2, min_samples: 8 }
  }
})

// 初始化時設置建議值
onMounted(() => {
  if (settings.dbscan_config.eps === null || settings.dbscan_config.eps === undefined) {
    settings.dbscan_config.eps = suggestedParams.value.eps
  }
  if (settings.dbscan_config.min_samples === null || settings.dbscan_config.min_samples === undefined) {
    settings.dbscan_config.min_samples = suggestedParams.value.min_samples
  }
})

// 當區域級別改變時，自動更新建議值
watch(() => settings.region_level, () => {
  settings.dbscan_config.eps = suggestedParams.value.eps
  settings.dbscan_config.min_samples = suggestedParams.value.min_samples
})

// 快速調整參數（從 ResultsPanel 觸發）
const adjustParams = (action) => {
  const currentEps = settings.dbscan_config.eps || suggestedParams.value.eps
  const currentMinSamples = settings.dbscan_config.min_samples || suggestedParams.value.min_samples

  switch (action) {
    case 'decrease_eps':
      settings.dbscan_config.eps = Math.max(0.1, currentEps - 0.3)
      break
    case 'increase_eps':
      settings.dbscan_config.eps = Math.min(10, currentEps + 0.3)
      break
    case 'decrease_min_samples':
      settings.dbscan_config.min_samples = Math.max(1, currentMinSamples - 1)
      break
    case 'increase_min_samples':
      settings.dbscan_config.min_samples = Math.min(20, currentMinSamples + 1)
      break
  }
}

// 暴露方法給父組件
defineExpose({
  adjustParams
})

const runClustering = () => {
  emit('run', settings)
}
</script>

<style scoped lang="scss">
.vml-glass-panel {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.settings-group {
  gap: 16px;
}

.setting-row {
  align-items: center;
}

.setting-row label {
  min-width: 100px;
  font-size: 14px;
  font-weight: 500;
}

.setting-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md);
  background: var(--glass-50);
  backdrop-filter: blur(10px);
  font-size: 14px;
  white-space: nowrap;
}

.feature-toggles {
  @include flex-col;
  gap: 8px;
  padding: 12px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
}

.feature-toggles label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}


.auth-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(var(--color-warning-rgb), 0.15);
  border: 1px solid rgba(var(--color-warning-rgb), 0.3);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 16px;
}

.notice-text {
  font-size: 13px;
  color: var(--color-warning-dark);
  font-weight: 500;
}

.dbscan-config {
  @include flex-col;
  gap: 12px;
  padding: 16px;
  background: rgba(var(--vml-blue-rgb), 0.08);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.2);
  border-radius: var(--radius-md);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
