<template>
  <div class="semantic-settings-panel glass-panel">
    <h3 class="panel-title">語義網絡設定</h3>

    <!-- 登錄提示 -->
    <div v-if="!isAuthenticated" class="auth-notice">
      <span class="notice-icon">🔒</span>
      <span class="notice-text">此功能需要登錄</span>
    </div>

    <div class="settings-group">
      <div class="setting-row">
        <label>最小共現次數：</label>
        <input v-model.number="settings.min_cooccurrence" type="number" min="1" class="setting-input" />
      </div>

      <div class="setting-row">
        <label>顯著性水平：</label>
        <input v-model.number="settings.alpha" type="number" min="0.01" max="0.1" step="0.01" class="setting-input" />
      </div>

      <div class="setting-row">
        <label>節點數量：</label>
        <input v-model.number="settings.top_n" type="number" min="10" max="100" class="setting-input" />
      </div>

      <button class="run-button glass-button" @click="runAnalysis" :disabled="loading || !isAuthenticated">
        {{ loading ? '分析中...' : isAuthenticated ? '🔍 生成網絡' : '🔒 需要登錄' }}
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

const settings = reactive(villagesMLStore.semanticSettings)
const isAuthenticated = computed(() => userStore.isAuthenticated)

const runAnalysis = () => {
  emit('run', settings)
}
</script>

<style scoped>
.semantic-settings-panel {
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
  min-width: 120px;
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
