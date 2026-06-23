<template>
  <AppModal
    :model-value="visible"
    size="sm"
    transition-name="fade-scale"
    :title="t('query.components.yinweiSelector.modalTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div v-if="!hasLocations" class="empty-state">
      <div class="icon-warn">!</div>
      <p class="empty-text">{{ t('query.components.yinweiSelector.emptyState') }}</p>
    </div>

    <ul v-else class="glass-list">
      <li v-for="(loc, index) in locationList" :key="index" class="glass-list-item">
        <div class="item-row">
          <span class="loc-name">{{ loc }}</span>
          <button
            class="query-btn"
            @click="emit('query-location', loc)"
            :disabled="loadingStates[loc]"
          >
            {{
              loadingStates[loc]
                ? t('query.components.yinweiSelector.queryingButton')
                : t('query.components.yinweiSelector.queryButton')
            }}
          </button>
        </div>

        <Transition name="slide-down">
          <div v-if="apiResults[loc] && apiResults[loc][loc]" class="result-box">
            <div class="stat-section" v-if="apiResults[loc][loc]['聲母']">
              <h4 class="stat-title">{{ t('query.components.yinweiSelector.initial') }}</h4>
              <div class="stat-tags">
                <span v-for="(count, key) in apiResults[loc][loc]['聲母']" :key="key" class="glass-tag">
                  <span class="tag-key">{{ key }}</span>
                  <span class="tag-count">{{ count }}</span>
                </span>
              </div>
            </div>

            <div class="stat-section" v-if="apiResults[loc][loc]['韻母']">
              <h4 class="stat-title">{{ t('query.components.yinweiSelector.final') }}</h4>
              <div class="stat-tags">
                <span v-for="(count, key) in apiResults[loc][loc]['韻母']" :key="key" class="glass-tag">
                  <span class="tag-key">{{ key }}</span>
                  <span class="tag-count">{{ count }}</span>
                </span>
              </div>
            </div>

            <div class="stat-section" v-if="apiResults[loc][loc]['聲調']">
              <h4 class="stat-title">{{ t('query.components.yinweiSelector.tone') }}</h4>
              <div class="stat-tags">
                <span v-for="(count, key) in apiResults[loc][loc]['聲調']" :key="key" class="glass-tag">
                  <span class="tag-key">{{ key }}</span>
                  <span class="tag-count">{{ count }}</span>
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </li>
    </ul>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  hasLocations: {
    type: Boolean,
    default: false
  },
  locationList: {
    type: Array,
    default: () => []
  },
  loadingStates: {
    type: Object,
    default: () => ({})
  },
  apiResults: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'query-location'])
const { t } = useI18n()

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 30px 0;
  color: #666;
}

.empty-text {
  white-space: pre-line;
}

.icon-warn {
  font-size: 40px;
  margin-bottom: 10px;
}

.glass-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.glass-list-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.glass-list-item:last-child {
  border-bottom: none;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.loc-name {
  font-weight: 500;
  font-size: 16px;
}

.query-btn {
  background: #007aff;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.25);
}

.query-btn:hover {
  background: #006ce6;
  transform: scale(1.02);
}

.query-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  opacity: 1;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.result-box {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.stat-section {
  margin-bottom: 12px;
}

.stat-section:last-child {
  margin-bottom: 0;
}

.stat-title {
  font-size: 12px;
  font-weight: 700;
  color: #8e8e93;
  margin: 0 0 6px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.glass-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 13px;
  color: #333;
  transition: transform 0.2s;
}

.glass-tag:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.8);
}

.tag-key {
  font-family: 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  margin-right: 6px;
}

.tag-count {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  font-weight: 700;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
}
</style>
