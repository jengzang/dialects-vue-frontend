<template>
  <div class="pattern-structural-page">
    <h3 class="villagesml-subtab-title">
      模式分析 - 結構分析
      <HelpIcon content="分析村名的結構模式。前綴模式：以特定字符開頭（如「新X」）。後綴模式：以特定字符結尾（如「X村」）。複合模式：包含特定字符組合的模式" />
    </h3>

    <div class="vml-glass-panel">
      <h2>🏗️ 模式結構分析</h2>

      <!-- Controls -->
      <div class="controls">
        <SimpleSelectDropdown :match-trigger-width="true"
          v-model="patternType"
          :options="patternTypeOptions"
        />
        <button
          class="query-button"
          :disabled="loading"
          @click="loadStructuralAnalysis"
        >
          查詢
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <!-- Results -->
      <div v-else-if="structuralData.length > 0" class="structural-results">
        <div class="structural-list">
          <div
            v-for="(item, index) in structuralData"
            :key="index"
            class="structural-item"
          >
            <div class="item-header">
              <span class="item-pattern">{{ item.pattern }}</span>
              <div class="header-actions">
                <span class="item-count">{{ item.frequency }} 次</span>
                <button class="action-button-small" @click="goToTendency(item.pattern)">
                  查看傾向性
                </button>
              </div>
            </div>
            <div class="item-details">
              <div class="item-structure">
                <span class="structure-label">類型:</span>
                <span class="structure-value">{{ item.pattern_type }}</span>
              </div>
              <div class="item-examples">
                <span class="examples-label">示例:</span>
                <span class="example-tag" @click="goToTendency(item.pattern)">
                  {{ item.example }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { getPatternStructural } from '@/api/index.js'
import { showError } from '@/utils/message.js'

const router = useRouter()
const route = useRoute()

// State
const structuralData = ref([])
const loading = ref(false)
const patternType = ref('')

// Options for SimpleSelectDropdown
const patternTypeOptions = [
  { label: '全部類型', value: '' },
  { label: '前綴模式', value: 'prefix' },
  { label: '後綴模式', value: 'suffix' },
  { label: '複合模式', value: 'compound' }
]

// Methods
const loadStructuralAnalysis = async () => {
  loading.value = true
  try {
    const params = {}
    if (patternType.value) {
      params.pattern_type = patternType.value
    }
    structuralData.value = await getPatternStructural(params)
  } catch (error) {
    showError('加載結構分析失敗')
  } finally {
    loading.value = false
  }
}

const goToTendency = (pattern) => {
  // 去掉模式中的 X（通配符）
  const cleanPattern = pattern.replace(/X/g, '')
  router.push({
    query: {
      ...route.query,
      subtab: 'tendency',
      pattern: cleanPattern
    }
  })
}
</script>

<style scoped>
.pattern-structural-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.vml-glass-panel h2 {
  margin-bottom: 16px;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.structural-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.structural-item {
  /* 1. 基础背景：极高透明度的白色 */
  background: var(--glass-20);


  /* 3. 液态玻璃边框：使用半透明实线 */
  /* 关键点：边框颜色要比背景稍微亮一点，模拟玻璃边缘的折射 */
  border: 1px solid var(--glass-40);

  /* 4. 增强液态感：内阴影（Inset Shadow）模拟厚度和光泽 */
  box-shadow:
      inset 0 0 12px var(--glass-20), /* 内发光 */
      0 8px 32px 0 rgba(var(--color-shadow-rgb), 0.1);    /* 外层淡淡的投影，增加悬浮感 */

  padding: 12px;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

/* 悬停效果：增加亮度，模拟光线照射在液面上的感觉 */
.structural-item:hover {
  background: var(--glass-30);
  border: 1px solid var(--glass-60);
  box-shadow:
      inset 0 0 20px var(--glass-40),
      0 12px 40px 0 rgba(var(--color-shadow-rgb), 0.15);
  transform: translateY(-2px); /* 轻微浮动 */
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-pattern {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-count {
  padding: 4px 12px;
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.item-details {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.item-structure {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.structure-label {
  color: var(--text-secondary);
}

.structure-value {
  color: var(--text-primary);
  font-weight: 500;
}

.item-examples {
  display: flex;
  align-items: center;
  gap: 8px;
}

.examples-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.examples-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  padding: 4px 12px;
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-tag:hover {
  background: rgba(var(--color-success-rgb), 0.3);
  transform: translateY(-2px);
}

.action-button-small {
  padding: 6px 12px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.action-button-small:hover {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: var(--color-primary);
}

</style>
