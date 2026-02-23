<template>
  <div class="clustering-settings-panel glass-panel">
    <h3 class="panel-title">聚類設定</h3>

    <!-- 登錄提示 -->
    <div v-if="!isAuthenticated" class="auth-notice">
      <span class="notice-icon">🔒</span>
      <span class="notice-text">此功能需要登錄</span>
    </div>

    <div class="settings-group">
      <div class="setting-row">
        <label>算法：</label>
        <select v-model="settings.algorithm" class="setting-input">
          <option value="kmeans">K-Means</option>
          <option value="dbscan">DBSCAN</option>
          <option value="gmm">GMM</option>
        </select>
      </div>

      <div class="setting-row" v-if="settings.algorithm !== 'dbscan'">
        <label>聚類數 K：</label>
        <input v-model.number="settings.k" type="number" min="2" max="10" class="setting-input" />
      </div>

      <div class="feature-toggles">
        <label><input type="checkbox" v-model="settings.features.semantic" /> 語義特徵</label>
        <label><input type="checkbox" v-model="settings.features.morphology" /> 形態特徵</label>
        <label><input type="checkbox" v-model="settings.features.diversity" /> 多樣性特徵</label>
      </div>

      <button class="run-button glass-button" @click="runClustering" :disabled="loading || !isAuthenticated">
        {{ loading ? '運行中...' : isAuthenticated ? '🚀 運行聚類' : '🔒 需要登錄' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { userStore } from '@/utils/store.js'

const props = defineProps({
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['run'])

const settings = reactive(villagesMLStore.clusteringSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)

const runClustering = () => {
  emit('run', settings)
}
</script>

<style scoped>
.clustering-settings-panel {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-row label {
  min-width: 100px;
  font-size: 14px;
  font-weight: 500;
}

.setting-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 14px;
}

.feature-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.feature-toggles label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.run-button {
  padding: 12px 24px;
  margin-top: 8px;
}

.run-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 16px;
}

.notice-text {
  font-size: 13px;
  color: #856404;
  font-weight: 500;
}
</style>
