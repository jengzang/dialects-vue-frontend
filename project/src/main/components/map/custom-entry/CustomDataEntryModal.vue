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
        <div>
          <h3 class="entry-modal-title">{{ t('customEntry.modal.title') }}</h3>
          <div class="entry-modal-subtitle">{{ t('customEntry.modal.subtitle') }}</div>
        </div>
        <div class="entry-modal-mode-switcher" role="group" :aria-label="t('customEntry.modal.modeGroupLabel')">
          <button
            class="entry-mode-button"
            :class="{ active: activeMode === 'point' }"
            type="button"
            @click="activeMode = 'point'"
          >
            {{ t('customEntry.modal.modes.point') }}
          </button>
          <button
            class="entry-mode-button"
            :class="{ active: activeMode === 'feature' }"
            type="button"
            @click="activeMode = 'feature'"
          >
            {{ t('customEntry.modal.modes.feature') }}
          </button>
        </div>
        <button
          class="close-btn close-btn-lg close-btn-inline"
          type="button"
          :aria-label="t('customEntry.modal.close')"
          @click="closeModal"
        >
          ×
        </button>
      </div>
    </template>

    <KeepAlive>
      <PointCentricMode v-if="activeMode === 'point'" :key="`point-${modalSessionKey}`" />
      <FeatureCentricMode v-else :key="`feature-${modalSessionKey}`" />
    </KeepAlive>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import PointCentricMode from './PointCentricMode.vue'
import FeatureCentricMode from './FeatureCentricMode.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const activeMode = ref('point')
const modalSessionKey = ref(0)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleVisibleChange = (value) => {
  emit('update:modelValue', value)
}

watch(() => props.modelValue, (visible, prev) => {
  if (prev && !visible) {
    activeMode.value = 'point'
    modalSessionKey.value += 1
  }
})
</script>

<style scoped lang="scss">
.entry-modal-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px 16px;
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

.entry-modal-mode-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.96);
}

.entry-mode-button {
  min-width: 128px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.entry-mode-button.active {
  background: #ffffff;
  color: #007aff;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
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
