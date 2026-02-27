<template>
  <div class="feature-toggles">
    <h4 class="section-title">特徵選擇</h4>

    <div class="setting-row">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="modelValue.use_semantic"
          @change="updateFeature('use_semantic', $event.target.checked)"
        />
        語義特徵
      </label>
      <span class="setting-hint">語義類別分佈</span>
    </div>

    <div class="setting-row">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="modelValue.use_morphology"
          @change="updateFeature('use_morphology', $event.target.checked)"
        />
        形態特徵
      </label>
      <span class="setting-hint">後綴 N-gram 特徵</span>
    </div>

    <div v-if="modelValue.use_morphology" class="morphology-params">
      <div class="setting-row indented">
        <label class="setting-label">Top N (2-gram)</label>
        <input
          type="number"
          :value="modelValue.top_n_suffix2"
          @input="updateFeature('top_n_suffix2', parseInt($event.target.value))"
          min="10"
          max="500"
          class="setting-input"
        />
      </div>

      <div class="setting-row indented">
        <label class="setting-label">Top N (3-gram)</label>
        <input
          type="number"
          :value="modelValue.top_n_suffix3"
          @input="updateFeature('top_n_suffix3', parseInt($event.target.value))"
          min="10"
          max="500"
          class="setting-input"
        />
      </div>
    </div>

    <div class="setting-row">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="modelValue.use_diversity"
          @change="updateFeature('use_diversity', $event.target.checked)"
        />
        多樣性特徵
      </label>
      <span class="setting-hint">字符多樣性指標</span>
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

function updateFeature(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<style scoped>
.feature-toggles {
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
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
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
  min-width: 120px;
}

.setting-label input[type="checkbox"] {
  cursor: pointer;
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

.morphology-params {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 2px solid rgba(74, 144, 226, 0.2);
}
</style>
