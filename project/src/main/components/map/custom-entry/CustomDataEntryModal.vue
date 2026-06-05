<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    width="90vw"
    max-height="90dvh"
    :close-on-backdrop="false"
    @update:modelValue="handleVisibleChange"
  >
    <template #header>
      <div class="entry-modal-header">
        <h3 class="entry-modal-title">自定義數據錄入</h3>
        <div class="entry-modal-subtitle">建設中，下一步接入雙模式錄入流程</div>
        <button
          class="close-btn close-btn-lg close-btn-inline"
          type="button"
          aria-label="關閉"
          @click="closeModal"
        >
          ×
        </button>
      </div>
    </template>

    <div class="entry-modal-empty main-glass-panel-inner">
      <div class="entry-modal-empty-icon">🧭</div>
      <div class="entry-modal-empty-title">自定義錄入彈窗骨架已接入</div>
      <p class="entry-modal-empty-text">
        本步僅完成入口與彈窗容器接入，後續將逐步補上「補充單點資料 / 製作特徵分布」兩種模式。
      </p>
    </div>
  </AppModal>
</template>

<script setup>
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleVisibleChange = (value) => {
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
.entry-modal-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px 16px;
  width: 100%;
}

.entry-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.entry-modal-subtitle {
  grid-column: 1 / 2;
  font-size: 13px;
  color: #64748b;
}

.entry-modal-empty {
  padding: 36px 24px;
  border-radius: 18px;
  text-align: center;
  background: rgba(255, 255, 255, 0.82);
}

.entry-modal-empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.entry-modal-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.entry-modal-empty-text {
  max-width: 520px;
  margin: 12px auto 0;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}
</style>
