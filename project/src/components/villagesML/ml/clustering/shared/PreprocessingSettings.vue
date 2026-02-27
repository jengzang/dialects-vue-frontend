<template>
  <div class="preprocessing-settings">
    <h4 class="section-title">預處理參數</h4>

    <div class="setting-row">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="modelValue.standardize"
          @change="updateSetting('standardize', $event.target.checked)"
        />
        標準化
      </label>
      <span class="setting-hint">將特徵縮放到均值0、方差1</span>
    </div>

    <div class="setting-row">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="modelValue.use_pca"
          @change="updateSetting('use_pca', $event.target.checked)"
        />
        使用 PCA 降維
      </label>
      <span class="setting-hint">減少特徵維度，提高計算效率</span>
    </div>

    <div v-if="modelValue.use_pca" class="setting-row indented">
      <label class="setting-label">PCA 維度</label>
      <div class="setting-control">
        <input
          type="number"
          :value="modelValue.pca_n_components"
          @input="updateSetting('pca_n_components', parseInt($event.target.value))"
          min="2"
          max="200"
          class="setting-input"
        />
        <span class="setting-hint">保留的主成分數量（2-200）</span>
      </div>
    </div>
  </div>
</template>

<script setup>
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

<style scoped>
.preprocessing-settings {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

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

.setting-row.indented {
  margin-left: 1.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
}

.setting-label input[type="checkbox"] {
  cursor: pointer;
}

.setting-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-input {
  padding: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  width: 100px;
}

.setting-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.setting-hint {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}
</style>
