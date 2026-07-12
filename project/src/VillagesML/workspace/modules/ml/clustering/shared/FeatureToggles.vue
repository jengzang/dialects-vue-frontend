<template>
  <div class="feature-toggles vm-subpanel-shell vm-subpanel-shell-spaced">
    <h4 class="section-title">特徵選擇</h4>

    <div class="setting-row">
      <CheckBox
        :model-value="modelValue.use_semantic"
        @update:modelValue="updateFeature('use_semantic', $event)"
      >
        語義特徵
      </CheckBox>
      <span class="setting-hint">語義類別分佈</span>
    </div>

    <div class="setting-row">
      <CheckBox
        :model-value="modelValue.use_morphology"
        @update:modelValue="updateFeature('use_morphology', $event)"
      >
        形態特徵
      </CheckBox>
      <span class="setting-hint">後綴 N-gram 特徵</span>
    </div>

    <div v-if="modelValue.use_morphology" class="morphology-params">
      <div class="setting-row indented vm-setting-indent">
        <label class="setting-label">Top N (2-gram)</label>
        <input
          type="number"
          :value="modelValue.top_n_suffix2"
          @input="updateFeature('top_n_suffix2', parseInt($event.target.value))"
          min="10"
          max="500"
          class="setting-input vm-setting-input-compact"
        />
      </div>

      <div class="setting-row indented vm-setting-indent">
        <label class="setting-label">Top N (3-gram)</label>
        <input
          type="number"
          :value="modelValue.top_n_suffix3"
          @input="updateFeature('top_n_suffix3', parseInt($event.target.value))"
          min="10"
          max="500"
          class="setting-input vm-setting-input-compact"
        />
      </div>
    </div>

    <div class="setting-row">
      <CheckBox
        :model-value="modelValue.use_diversity"
        @update:modelValue="updateFeature('use_diversity', $event)"
      >
        多樣性特徵
      </CheckBox>
      <span class="setting-hint">字符多樣性指標</span>
    </div>
  </div>
</template>

<script setup>
import CheckBox from '@/components/selector/CheckBox.vue'
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

function updateFeature(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<style scoped lang="scss">
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 120px;
}

.setting-hint {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.morphology-params {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}
</style>
