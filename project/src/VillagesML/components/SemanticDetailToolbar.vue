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
        <div class="lexicon-section">
          <h4>主類別 (v1.0.0)</h4>
          <div class="category-list">
            <div
              v-for="(chars, category) in SEMANTIC_LEXICON_V1.categories"
              :key="category"
              class="category-item"
            >
              <div class="category-header">
                <span class="category-name">{{ CATEGORY_NAMES_ZH[category] }}</span>
                <span class="category-count">{{ chars.length }} 字</span>
              </div>
              <div class="char-list">
                <span v-for="char in chars" :key="char" class="char-tag">{{ char }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="lexicon-section">
          <h4>子類別 (v4.0.0-hybrid)</h4>
          <div class="category-list">
            <div
              v-for="(chars, subcategory) in SEMANTIC_LEXICON_V4.subcategories"
              :key="subcategory"
              class="category-item"
            >
              <div class="category-header">
                <span class="category-name">{{ getSubcategoryName(subcategory) }}</span>
                <span class="category-count">{{ chars.length }} 字</span>
              </div>
              <div class="char-list">
                <span v-for="char in chars" :key="char" class="char-tag">{{ char }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { getSubcategoryName } from '@/VillagesML/config/villagesML.js'
import { SEMANTIC_LEXICON_V1, SEMANTIC_LEXICON_V4, CATEGORY_NAMES_ZH } from '@/VillagesML/config/semanticLexicon.js'

defineProps({
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const showLexiconModal = ref(false)
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
}

.lexicon-button:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--vml-blue-rgb), 0.3);
}

.lexicon-body {
  padding: 0;
  overflow: visible;
}

.lexicon-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--color-primary);
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  padding: 16px;
  background: var(--glass-50);
  border-radius: var(--radius-md);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.category-count {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-md);
}

.char-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  padding: 6px 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-primary);
    color: var(--action-primary-text);
    transform: translateY(-2px);
  }
}
</style>
