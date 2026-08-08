<template>
<!--  <ExploreLayout>-->
    <div class="character-embeddings-page">
      <h3 class="villagesml-subtab-title">
        字符分析 - 嵌入相似
        <HelpIcon
          content="基於Word2Vec Skipgram模型（向量維度100，窗口5，最小頻率5）訓練的字符嵌入向量。使用餘弦相似度計算字符間的語義相似性，公式：cosine_sim = dot(v1, v2) / (||v1|| × ||v2||)。值域[0,1]，越接近1表示語義越相似。"
          size="md"
          fontSize="16px"
          trigger="both"
        />
      </h3>

      <!-- Search Section -->
      <div class="search-section vml-glass-panel">
        <h2><InlineIcon icon="🔍" />相似字搜尋
          <HelpIcon
            content="輸入單個字符，系統將返回Top-K相似字符及其相似度分數。可調整返回數量（5-50）。"
            size="sm"
            fontSize="14px"
            trigger="both"
          />
        </h2>
        <div class="search-group vml-control-surface vml-control-row">
          <div class="vml-control-field">
            <input
              v-model="searchChar"
              type="text"
              placeholder="輸入單個字符..."
              maxlength="1"
              class="vml-char-input"
              @input="handleCharInput"
            />
          </div>
          <div class="vml-control-field">
            <input
              v-model.number="topN"
              type="number"
              min="5"
              max="50"
              placeholder="返回數量"
              class="vml-number-input"
            />
          </div>
          <div class="vml-control-actions">
            <button
              class="search-button"
              :disabled="!searchChar || loading"
              @click="searchSimilarities"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="similarities.length > 0" ref="resultsSectionRef" class="results-section">
        <!-- Similarity List -->
        <div class="similarity-list vml-glass-panel">
          <h3>相似字列表</h3>
          <div class="similarity-items">
            <div
              v-for="(item, index) in similarities"
              :key="item.character"
              class="similarity-item"
              :class="{ 'top-3': index < 3 }"
            >
              <div class="rank">{{ index + 1 }}</div>
              <div class="char">{{ item.character }}</div>
              <div class="similarity-bar">
                <div
                  class="bar-fill"
                  :style="{ width: `${item.similarity * 100}%` }"
                ></div>
              </div>
              <div class="similarity-value">{{ (item.similarity * 100).toFixed(2) }}%</div>
            </div>
          </div>
        </div>

        <!-- Vector Visualization -->
        <div class="vector-viz vml-glass-panel">
          <h3>相似度網絡圖</h3>
          <div v-if="similarities.length > 0" ref="vizChartRef" class="viz-chart"></div>
          <div v-else class="viz-placeholder">
            <p><InlineIcon icon="📊" />相似度可視化</p>
            <p class="viz-note">搜尋字符後將顯示 {{ searchChar || '該字' }} 及其相似字的關係網絡</p>
          </div>
        </div>
      </div>

      <!-- Embeddings List -->
      <div class="embeddings-list vml-glass-panel">
        <div class="list-header">
          <h3>字符嵌入列表 (共 {{ totalEmbeddings }} 個字符)</h3>
        </div>

        <div v-if="loadingList" class="vml-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>加載中...</p>
        </div>

        <div v-else class="table-scroll-wrapper">
          <div class="embeddings-table">
            <div class="table-header">
              <div class="col-char">字符</div>
              <div class="col-freq">出現頻率</div>
              <div class="col-dim">向量維度</div>
              <div class="col-action">操作</div>
            </div>
            <div class="table-body">
              <div
                v-for="embedding in embeddings"
                :key="embedding.character"
                class="table-row"
              >
                <div class="col-char">{{ embedding.character }}</div>
                <div class="col-freq">{{ embedding.frequency || 'N/A' }}</div>
                <div class="col-dim">{{ embedding.vector_dim || 'N/A' }}</div>
                <div class="col-action">
                  <button
                    class="action-button"
                    @click="searchChar = embedding.character; searchSimilarities()"
                  >
                    查找相似
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-controls vml-control-surface vml-control-row vml-control-row--center">
          <button
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            上一頁
          </button>
          <span>第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, onBeforeUnmount, onMounted, nextTick } from 'vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import * as echarts from 'echarts'
import {
  getCharEmbeddingsList,
  getCharSimilarities
} from '@/api/index.js'
import { showError } from '@/utils/ui/message.js'

// State
const searchChar = ref('')
const topN = ref(10)
const similarities = ref([])
const loading = ref(false)

const embeddings = ref([])
const loadingList = ref(false)
const currentPage = ref(1)
const pageSize = 100
const totalEmbeddings = ref(0)
const totalPages = computed(() => Math.ceil(totalEmbeddings.value / pageSize))

const vizChartRef = ref(null)
const resultsSectionRef = ref(null)
let vizChartInstance = null

// Methods
const handleCharInput = () => {
  // Ensure only one character
  if (searchChar.value.length > 1) {
    searchChar.value = searchChar.value.charAt(0)
  }
}

const searchSimilarities = async () => {
  if (!searchChar.value) return

  console.log('searchSimilarities called with:', searchChar.value, topN.value)
  loading.value = true
  try {
    const result = await getCharSimilarities({
      char: searchChar.value,
      top_k: topN.value
    })
    console.log('Similarities API result:', result)
    // 新格式：{ query_character, top_k, similarities: [...] }
    similarities.value = result.similarities || result || []
    // 渲染可視化圖表
    nextTick(() => {
      renderVizChart()
      resultsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  } catch (error) {
    console.error('Similarities API error:', error)
    showError('搜尋相似字失敗')
  } finally {
    loading.value = false
  }
}

const renderVizChart = () => {
  if (!vizChartRef.value || similarities.value.length === 0) return

  if (vizChartInstance) vizChartInstance.dispose()
  vizChartInstance = echarts.init(vizChartRef.value)

  // 過濾掉搜索字符本身，並去除重複字符
  const seenCharacters = new Set([searchChar.value])
  const filteredSimilarities = similarities.value.filter(item => {
    if (!item.character || seenCharacters.has(item.character)) {
      return false
    }
    seenCharacters.add(item.character)
    return true
  })

  // 如果過濾後沒有數據，不渲染圖表
  if (filteredSimilarities.length === 0) {
    console.warn('No valid similarities to display after filtering')
    return
  }

  // 構建節點和邊
  const nodes = [
    {
      id: searchChar.value,
      name: searchChar.value,
      value: 1,
      symbolSize: 60,
      itemStyle: { color: '#4a90e2' },
      label: { fontSize: 20, fontWeight: 'bold' }
    },
    ...filteredSimilarities.map((item, index) => ({
      id: item.character,
      name: item.character,
      value: item.similarity,
      symbolSize: 30 + item.similarity * 30,
      itemStyle: {
        color: `rgba(80, 200, 120, ${0.5 + item.similarity * 0.5})`
      }
    }))
  ]

  const links = filteredSimilarities.map(item => ({
    source: searchChar.value,
    target: item.character,
    value: item.similarity,
    lineStyle: {
      width: 1 + item.similarity * 3,
      opacity: 0.3 + item.similarity * 0.5
    }
  }))

  const option = {
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}<br/>相似度: ${(params.data.value * 100).toFixed(2)}%`
        }
        return `${params.data.name}<br/>相似度: ${(params.data.value * 100).toFixed(2)}%`
      }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: links,
      roam: true,
      label: { show: true, fontSize: 14 },
      force: {
        repulsion: 200,
        edgeLength: 100
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { width: 5 }
      }
    }]
  }

  vizChartInstance.setOption(option)
}

const loadEmbeddingsList = async () => {
  // console.log('loadEmbeddingsList called')
  loadingList.value = true
  try {
    const result = await getCharEmbeddingsList({
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize
    })
    // console.log('Embeddings API result:', result)
    // 新格式：{ embeddings: [...], total, limit, offset, page, page_size }
    embeddings.value = result.embeddings || []
    totalEmbeddings.value = result.total || 0
    // console.log('Embeddings value:', embeddings.value)
    // console.log('Total embeddings:', totalEmbeddings.value)
  } catch (error) {
    // console.error('Embeddings API error:', error)
    showError('加載嵌入列表失敗')
  } finally {
    loadingList.value = false
  }
}

const changePage = (page) => {
  currentPage.value = page
  loadEmbeddingsList()
}

onMounted(() => {
  loadEmbeddingsList()
})

onBeforeUnmount(() => {
  if (vizChartInstance) {
    vizChartInstance.dispose()
    vizChartInstance = null
  }
})
</script>

<style scoped lang="scss">
.character-embeddings-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.search-section {
  @include flex-col;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.search-section h2 {
  white-space: nowrap;
  flex-shrink: 0;
}

.search-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.vml-number-input {
  // width: 120px;
  padding: 10px;
  border-radius: var(--radius-md);
}

.search-button {
  flex: 1;
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 100px;
}

.search-button:hover:not(:disabled) {
  background: var(--vml-blue-dark);
}

.search-button:disabled {
  @include disabled-state;
}

.results-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.similarity-list,
.vector-viz {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.similarity-list h3,
.vector-viz h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.similarity-items {
  @include flex-col;
  gap: 8px;
}

.similarity-item {
  display: grid;
  grid-template-columns: 40px 50px 1fr 80px;
  align-items: center;
  gap: 12px;
  padding: 6px;
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
  transition: transform 0.3s ease;
}

.similarity-item:hover {
  transform: translateX(5px);
}

.similarity-item.top-3 {
  background: rgba(var(--color-warning-rgb), 0.2);
}

.rank {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-secondary);
  text-align: center;
}

.char {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.similarity-bar {
  height: 24px;
  background: var(--glass-50);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.similarity-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.viz-placeholder {
  padding: 80px 20px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
  text-align: center;
}

.viz-chart {
  width: 100%;
  height: 400px;
}

.viz-placeholder p {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.viz-note {
  font-size: 14px !important;
  color: var(--text-secondary);
}

.embeddings-list {
  padding: 16px;
}

.list-header {
  margin-bottom: 16px;
}

.list-header h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
}

.pagination-controls button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-sm2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-controls button:hover:not(:disabled) {
  background: var(--vml-blue-dark);
}

.pagination-controls button:disabled {
  @include disabled-state;
}


.embeddings-table {
  border-radius: var(--radius-md);
  overflow: hidden;
  display: inline-block; /* 让表格根据内容自适应宽度 */
  min-width: 100%;
}

/* 移动端横向滚动容器 */
.table-scroll-wrapper {
  width: 100%;
  max-height: 500px;
  overflow: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: auto auto auto auto; /* 自适应列宽 */
  gap: 20px;
  padding: 12px 16px;
  align-items: center;
}

.table-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap; /* 防止表头换行 */
}

.table-row {
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.col-char {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  min-width: 60px;
}

.col-freq,
.col-dim {
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
}

.col-action {
  text-align: center;
  white-space: nowrap;
}

.action-button {
  padding: 6px 16px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: var(--vml-blue-dark);
}

@media (max-width: 600px) {
  .results-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .character-embeddings-page {
    padding: 8px;
  }

  .search-section {
    padding: 12px;
  }

  .page-title {
    font-size: 24px;
  }


  .vml-char-input {
    width: 80px;
  }

  .vml-number-input {
    // width: 60px;
  }

  .embeddings-list {
    padding: 12px;
  }

  .similarity-list,
  .vector-viz {
    padding: 12px;
  }
}

/* 移动端横向滚动样式 */
@media (min-aspect-ratio: 1/1) {
  .search-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
  }
}

@media (max-aspect-ratio: 1/1) {
  .table-scroll-wrapper {
    max-height: 400px;
    overflow: auto;
  }

}
</style>
