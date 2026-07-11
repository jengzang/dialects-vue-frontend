<template>
  <div class="vml-glass-panel">
    <h3 class="panel-title">🏷️ 語義結構</h3>

    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="semantic-content">
      <!-- Semantic Sequence -->
      <div v-if="data.semantic_sequence" class="section">
        <h4>語義序列</h4>
        <div class="category-tags">
          <span
            v-for="(category, index) in parseSequence(data.semantic_sequence)"
            :key="index"
            class="category-tag"
          >
            {{ category }}
          </span>
        </div>
      </div>

      <!-- Structure Info -->
      <div class="section">
        <h4>結構信息</h4>
        <div class="info-grid">
          <div v-if="data.sequence_length !== undefined" class="info-item">
            <span class="info-label">序列長度:</span>
            <span class="info-value">{{ data.sequence_length }}</span>
          </div>
          <div v-if="data.has_modifier !== undefined" class="info-item">
            <span class="info-label">有修飾語:</span>
            <span class="info-value">{{ data.has_modifier ? '是' : '否' }}</span>
          </div>
          <div v-if="data.has_head !== undefined" class="info-item">
            <span class="info-label">有中心詞:</span>
            <span class="info-value">{{ data.has_head ? '是' : '否' }}</span>
          </div>
          <div v-if="data.has_settlement !== undefined" class="info-item">
            <span class="info-label">有聚落詞:</span>
            <span class="info-value">{{ data.has_settlement ? '是' : '否' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暫無數據</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getSubcategoryName } from '@/VillagesML/config/villagesML.js'

defineProps({
  villageId: {
    type: Number,
    required: true
  },
  data: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const parseSequence = (sequence) => {
  try {
    const parsed = JSON.parse(sequence)
    // 将英文子类别名称映射为中文
    return parsed.map(category => getSubcategoryName(category))
  } catch {
    return []
  }
}
</script>

<style scoped lang="scss">
.semantic-content {
  animation: fadeIn 0.3s ease;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: var(--glass-30);
  border-radius: var(--radius-sm);
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.section {
  margin-bottom: 6px;
  padding: 16px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
}

.section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 6px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  padding: 6px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 500;
}

.label-list {
  @include flex-col;
  gap: 8px;
}

.label-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--glass-50);
  border-radius: var(--radius-sm2);
}

.label-name {
  font-weight: 600;
  color: var(--text-primary);
}

.label-category {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 2px 10px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-md);
}

.composition-list {
  @include flex-col;
  gap: 10px;
}

.composition-item {
  @include flex-col;
  padding: 12px;
  background: var(--glass-50);
  border-radius: var(--radius-sm2);
}

.comp-pattern {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.comp-description {
  font-size: 14px;
  color: var(--text-secondary);
}

</style>
