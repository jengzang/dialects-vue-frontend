<template>
  <div class="preprocessing-settings vm-subpanel-shell vm-subpanel-shell-spaced">
    <h4 class="section-title">預處理參數</h4>

    <div class="setting-row">
      <CheckBox
        :model-value="modelValue.standardize"
        label="標準化"
        class="setting-label"
        @update:modelValue="updateSetting('standardize', $event)"
      />
      <span class="setting-hint">將特徵縮放到均值0、方差1</span>
    </div>

    <div class="setting-row">
      <CheckBox
        :model-value="modelValue.use_pca"
        label="使用 PCA 降維"
        class="setting-label"
        @update:modelValue="updateSetting('use_pca', $event)"
      />
      <span class="setting-hint">減少特徵維度，提高計算效率</span>
    </div>

    <div v-if="modelValue.use_pca" class="setting-row indented vm-setting-indent">
      <label class="setting-label">PCA 維度</label>
      <div class="setting-control">
        <input
          type="number"
          :value="modelValue.pca_n_components"
          @input="updateSetting('pca_n_components', parseInt($event.target.value))"
          min="2"
          max="200"
          class="setting-input vm-setting-input-compact"
        />
        <span class="setting-hint">保留的主成分數量（2-200）</span>
      </div>
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

function updateSetting(key, value) {
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
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
}


.setting-control {
  flex: 1;
  @include flex-col;
  gap: 0.5rem;
}

.setting-hint {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  font-style: italic;
}
</style>
