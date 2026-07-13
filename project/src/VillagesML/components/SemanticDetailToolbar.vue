<template>
  <div class="detail-toolbar">
    <div class="detail-toggle vml-glass-panel">
      <div class="toggle-left">
        <label class="toggle-container">
          <SwitchToggle
            :model-value="modelValue"
            :width="48"
            :height="24"
            :thumb-size="20"
            color="blue"
            variant="solid"
            show-label
            active-text="詳細模式"
            inactive-text="詳細模式"
            label-position="right"
            aria-label="詳細模式"
            @update:modelValue="$emit('update:modelValue', $event)"
          />
        </label>
        <span class="toggle-hint">（語義分類更細緻）</span>
      </div>
      <button class="lexicon-button" @click="showLexiconModal = true">
        📖 查看詞典
      </button>
    </div>

    <AppModal
      :model-value="showLexiconModal"
      size="lg"
      title="📖 語義詞典"
      @update:modelValue="showLexiconModal = false"
    >
      <div class="lexicon-body">
        <div class="lexicon-meta">
          v{{ lexicon.version }} · {{ totalSubcats }} 子類別 · {{ lexicon.description }}
        </div>

        <div
          v-for="(subcats, parentKey) in lexicon.categories"
          :key="parentKey"
          class="parent-section"
        >
          <div class="parent-header">
            <span class="parent-icon">{{ getCategoryIcon(parentKey) }}</span>
            <span class="parent-name">{{ getCategoryName(parentKey) }}</span>
            <span class="parent-count">{{ countParentChars(subcats) }} 字</span>
          </div>
          <div class="subcategory-list">
            <div
              v-for="(chars, subKey) in subcats"
              :key="subKey"
              class="subcategory-item"
            >
              <span class="subcategory-name">{{ getSubcategoryName(subKey) }}</span>
              <span class="subcategory-chars">{{ chars.join(' ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { getSubcategoryName, getCategoryIcon, SEMANTIC_CATEGORY_NAMES } from '@/VillagesML/config/villagesML.js'
import lexicon from '@/VillagesML/config/semantic_lexicon_v4.json'

defineProps({
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const showLexiconModal = ref(false)

const getCategoryName = (key) => SEMANTIC_CATEGORY_NAMES[key] || key

const totalSubcats = computed(() => {
  let count = 0
  Object.values(lexicon.categories).forEach(subcats => { count += Object.keys(subcats).length })
  return count
})

const countParentChars = (subcats) => {
  const set = new Set()
  Object.values(subcats).forEach(chars => chars.forEach(c => set.add(c)))
  return set.size
}
</script>

<style scoped lang="scss">
.detail-toolbar {
  margin-bottom: 16px;
}

.detail-toggle {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-hint {
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.lexicon-button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-sm2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--vml-blue-rgb), 0.3);
  }
}

.lexicon-body {
  padding: 0;
  overflow: visible;
}

.lexicon-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bg-hover);
}

.parent-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.parent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}

.parent-icon {
  font-size: 18px;
}

.parent-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.parent-count {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: auto;
  padding: 2px 10px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-md);
}

.subcategory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 4px;
}

.subcategory-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 10px;
  background: var(--glass-30);
  border-radius: var(--radius-sm);
}

.subcategory-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  min-width: 56px;
  flex-shrink: 0;
}

.subcategory-chars {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  word-break: keep-all;
}
</style>
