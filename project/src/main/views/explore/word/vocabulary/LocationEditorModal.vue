<template>
  <AppModal
    v-model="isOpen"
    size="lg"
    :width="width"
    :max-height="maxHeight"
    :title="title"
    :close-label="closeLabel"
    @close="emit('close')"
  >
    <div v-if="draft" class="location-editor-modal">
      <p v-if="description" class="location-editor-desc">
        {{ description }}
      </p>

      <YindianLocationMatch
        :draft="draft"
        @apply="applyDraft"
      />

      <div class="location-editor-layout" :class="{ 'has-map': hasMap }">
        <div class="location-editor-grid">
          <label v-for="field in fields" :key="field.key" class="upload-field">
            <span>{{ field.label }}</span>
            <input
              v-model="draft[field.key]"
              type="text"
              :required="field.required"
              :placeholder="field.placeholder"
            />
          </label>
        </div>

        <div v-if="hasMap" class="location-editor-map">
          <strong>{{ mapLabel }}</strong>
          <slot name="map" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="location-editor-actions">
        <button class="glass-button" data-variant="secondary" type="button" @click="emit('cancel')">
          {{ cancelText }}
        </button>
        <button class="glass-button" data-variant="primary" type="button" @click="emit('confirm')">
          {{ confirmText }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import YindianLocationMatch from './YindianLocationMatch.vue'

const isOpen = defineModel({ type: Boolean, default: false })
const draft = defineModel('draft', { type: Object, default: null })

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
  width: { type: String, default: '' },
  maxHeight: { type: String, default: '' },
  closeLabel: { type: String, default: '' },
  cancelText: { type: String, default: '' },
  confirmText: { type: String, default: '' },
  mapLabel: { type: String, default: '' },
})

const emit = defineEmits(['close', 'cancel', 'confirm'])

const slots = useSlots()
const hasMap = computed(() => Boolean(slots.map))

function applyDraft(next) {
  draft.value = next
}
</script>

<style scoped lang="scss">
.location-editor-modal {
  display: grid;
  gap: 14px;
}

.location-editor-desc {
  margin: 0;
  color: var(--text-secondary);
}

.location-editor-layout {
  display: grid;
  gap: 12px;

  &.has-map {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
    gap: 16px;
    align-items: start;
  }
}

.location-editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

// 只有带地图的版本需要给字段列单独滚动，纯表单版交给弹窗自身滚动
.location-editor-layout.has-map .location-editor-grid {
  max-height: 50dvh;
  overflow-y: auto;
}

.location-editor-map {
  display: grid;
  gap: 10px;
  color: var(--text-primary);

  :deep(.mini-map-wrapper) {
    height: 320px;
    border-radius: var(--radius-md, 8px);
  }
}

.location-editor-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

// 与 vocabulary.scss 的 .upload-field 同款；scoped 样式到不了子组件内部，只能各自持有一份
.upload-field {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;

  input,
  select {
    min-height: 38px;
    padding: 8px 10px;
    color: var(--text-primary);
    background: var(--glass-10);
    border: 1px solid var(--glass-30);
    border-radius: var(--radius-md, 8px);
  }
}

// 竖屏时地图列折到字段下方
@media (max-aspect-ratio: 1/1) {
  .location-editor-layout.has-map {
    grid-template-columns: 1fr;
    align-items: center;
  }
}
</style>
