<template>
  <div class="semantic-composition-page">
    <h3 class="villagesml-subtab-title">
      語義分析 - 組合模式
      <HelpIcon
        content="分析村名語義類別的組合規律。使用PMI（互信息）量化類別間關聯強度，PMI>2表示強關聯。"
        size="md"
        fontSize="16px"
        trigger="both"
      />
    </h3>

    <!-- Detail Mode Toggle -->
    <SemanticDetailToolbar v-model="detailMode" />

    <!-- Composition Patterns -->
    <div class="patterns-section vml-glass-panel">
<!--      <h2>組合模式</h2>-->
      <p class="section-description">
        分析村名中語義類別的組合模式，例如「方位+聚落」、「水系+聚落」等。
      </p>
      <div class="controls vml-control-surface vml-control-row">
        <div class="input-group vml-control-field">
          <label class="input-label">最小出現次數</label>
          <input
            v-model.number="minCount"
            type="number"
            min="1"
            placeholder="例如：5"
            class="vml-number-input"
          />
          <span class="input-hint">過濾掉出現次數少於此值的模式</span>
        </div>
        <div class="input-group vml-control-field">
          <label class="input-label">返回數量</label>
          <input
            v-model.number="topN"
            type="number"
            min="10"
            max="1000"
            placeholder="例如：50"
            class="vml-number-input"
          />
          <span class="input-hint">返回前N個最常見的模式（最多1000）</span>
        </div>
        <div class="vml-control-actions">
          <button
            class="solid-button"
            :disabled="loadingPatterns"
            @click="loadPatterns"
          >
            查詢
          </button>
        </div>
      </div>

      <div v-if="loadingPatterns" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="patterns.length > 0" class="patterns-table">
        <div class="table-header">
          <div class="col-pattern">模式</div>
          <div class="col-type">類型</div>
          <div class="col-count">頻率</div>
          <div class="col-percentage">佔比</div>
          <div class="col-components">組成</div>
        </div>
        <div class="table-body">
          <div
            v-for="(pattern, index) in patterns"
            :key="index"
            class="table-row"
          >
            <div class="col-pattern">{{ translatePattern(pattern.pattern) }}</div>
            <div class="col-type">{{ getPatternTypeName(pattern.pattern_type) }}</div>
            <div class="col-count">{{ pattern.frequency }}</div>
            <div class="col-percentage">{{ pattern.percentage?.toFixed(2) || '0.00' }}%</div>
            <div class="col-components">
              <span v-if="pattern.modifier" class="component-tag modifier">{{ getCategoryDisplayName(pattern.modifier, detailMode) }}</span>
              <span v-if="pattern.head" class="component-tag head">{{ getCategoryDisplayName(pattern.head, detailMode) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SemanticDetailToolbar from '@/VillagesML/components/SemanticDetailToolbar.vue'
import { getSemanticCompositionPatterns } from '@/api/index.js'
import { showError } from '@/utils/ui/message.js'
import { getPatternTypeName, getCategoryDisplayName } from '@/VillagesML/config/villagesML.js'

// State
const patterns = ref([])
const loadingPatterns = ref(false)
const minCount = ref(5)
const topN = ref(50)
const route = useRoute()
const router = useRouter()
const detailMode = ref(route.query.detail === 'true')

// Methods
const loadPatterns = async () => {
  loadingPatterns.value = true
  try {
    patterns.value = await getSemanticCompositionPatterns({
      min_frequency: minCount.value,
      limit: topN.value,
      ...(detailMode.value && { detail: true })
    })
  } catch (error) {
    showError('加載組合模式失敗')
  } finally {
    loadingPatterns.value = false
  }
}

const translatePattern = (patternStr) => {
  if (!patternStr) return ''
  return patternStr
    .split('+')
    .map(cat => getCategoryDisplayName(cat.trim(), detailMode.value))
    .join('+')
}

watch(detailMode, (val) => {
  const query = { ...route.query }
  if (val) { query.detail = 'true' } else { delete query.detail }
  router.replace({ query })
  if (patterns.value.length > 0) loadPatterns()
})
</script>

<style scoped lang="scss">
.semantic-composition-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.patterns-section {
  padding: 16px;
  margin-bottom: 16px;
  @include flex-col;
  align-items: center;
}

.patterns-section h2 {
  margin-bottom: 10px;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.controls {
  margin-bottom: 16px;
}

.input-group {
  min-width: 0;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.input-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.vml-number-input {
  width: 150px;
}

.patterns-table {
  border-radius: var(--radius-md);
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2.5fr 2.5fr 1fr 1fr 2fr;
  gap: 10px;
  padding: 12px 16px;
  align-items: center;
  min-width: 500px;  /* 表格最小宽度，确保移动端可横向滚动 */
}

.table-header > div,
.table-row > div {
  min-width: 0;  /* 允许 grid 子元素缩小 */
}

.table-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.col-components {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;  /* 允许 flex 容器缩小 */
}

.component-tag {
  padding: 3px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.component-tag.modifier {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning-dark);
}

.component-tag.head {
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .semantic-composition-page {
    padding: 8px;
  }

  .patterns-section {
    padding: 12px;
  }

  .vml-number-input {
    width: 100%;
  }
}

</style>
