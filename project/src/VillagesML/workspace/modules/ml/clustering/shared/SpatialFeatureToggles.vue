<template>
  <div class="feature-toggles vm-subpanel-shell">
    <h4 class="section-title">特徵選擇</h4>

    <div class="setting-row vml-setting-row">
      <CheckBox
        :model-value="modelValue.use_semantic_profile"
        @update:modelValue="update('use_semantic_profile', $event)"
      >
        語義特徵
      </CheckBox>
      <span class="setting-hint vml-setting-hint">9個語義類別占比</span>
    </div>

    <div class="setting-row vml-setting-row">
      <CheckBox
        :model-value="modelValue.use_naming_patterns"
        @update:modelValue="update('use_naming_patterns', $event)"
      >
        命名模式
      </CheckBox>
      <span class="setting-hint vml-setting-hint">高頻後綴出現頻率</span>
    </div>

    <div class="setting-row vml-setting-row">
      <CheckBox
        :model-value="modelValue.use_geographic"
        @update:modelValue="update('use_geographic', $event)"
      >
        地理特徵
      </CheckBox>
      <span class="setting-hint vml-setting-hint">聚類質心經緯度</span>
    </div>

    <div class="setting-row vml-setting-row">
      <CheckBox
        :model-value="modelValue.use_cluster_size"
        @update:modelValue="update('use_cluster_size', $event)"
      >
        聚類規模
      </CheckBox>
      <span class="setting-hint vml-setting-hint">聚類包含的村莊數</span>
    </div>
  </div>
</template>

<script setup>
import CheckBox from '@/components/selector/CheckBox.vue'
const props = defineProps({
  modelValue: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue'])

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 100px;
}

.setting-hint {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
