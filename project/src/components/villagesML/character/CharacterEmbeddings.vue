<template>
<!--  <ExploreLayout>-->
    <div class="character-embeddings-page">
      <h3 class="villagesml-subtab-title">字符分析 - 嵌入相似</h3>

      <!-- Search Section -->
      <div class="search-section glass-panel">
        <h2>🔍 相似字搜尋</h2>
        <div class="search-group">
          <input
            v-model="searchChar"
            type="text"
            placeholder="輸入單個字符..."
            maxlength="1"
            class="char-input"
            @input="handleCharInput"
          />
          <input
            v-model.number="topN"
            type="number"
            min="5"
            max="50"
            placeholder="返回數量"
            class="number-input"
          />
          <button
            class="search-button"
            :disabled="!searchChar || loading"
            @click="searchSimilarities"
          >
            搜尋相似字
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="similarities.length > 0" class="results-section">
        <!-- Similarity List -->
        <div class="similarity-list glass-panel">
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
        <div class="vector-viz glass-panel">
          <h3>相似度網絡圖</h3>
          <div v-if="similarities.length > 0" ref="vizChartRef" class="viz-chart"></div>
          <div v-else class="viz-placeholder">
            <p>📊 相似度可視化</p>
            <p class="viz-note">搜尋字符後將顯示 {{ searchChar || '該字' }} 及其相似字的關係網絡</p>
          </div>
        </div>
      </div>

      <!-- Embeddings List -->
      <div class="embeddings-list glass-panel">
        <div class="list-header">
          <h3>字符嵌入列表 (共 {{ totalEmbeddings }} 個字符)</h3>
          <div class="pagination-controls">
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

        <div v-if="loadingList" class="loading-state">
          <div class="spinner"></div>
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
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import * as echarts from 'echarts'
import {
  getCharEmbeddingsList,
  getCharSimilarities
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

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
    nextTick(() => renderVizChart())
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
  console.log('loadEmbeddingsList called')
  loadingList.value = true
  try {
    const result = await getCharEmbeddingsList({
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize
    })
    console.log('Embeddings API result:', result)
    // 新格式：{ embeddings: [...], total, limit, offset, page, page_size }
    embeddings.value = result.embeddings || []
    totalEmbeddings.value = result.total || 0
    console.log('Embeddings value:', embeddings.value)
    console.log('Total embeddings:', totalEmbeddings.value)
  } catch (error) {
    console.error('Embeddings API error:', error)
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
</script>

<style scoped>
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
  padding: 16px;
  margin-bottom: 20px;
}

.search-section h2 {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.search-group {
  display: flex;
  gap: 12px;
}

.char-input {
  padding: 10px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
}

.number-input {
  width: 120px;
  padding: 10px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.char-input:focus,
.number-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.search-button {
  flex: 1;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.similarity-item {
  display: grid;
  grid-template-columns: 40px 50px 1fr 80px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.similarity-item:hover {
  transform: translateX(5px);
}

.similarity-item.top-3 {
  background: rgba(243, 156, 18, 0.2);
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
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
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
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  font-size: 16px;
  color: var(--text-primary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-controls button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-controls button:hover:not(:disabled) {
  background: #3a7bc8;
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.embeddings-table {
  border-radius: 12px;
  overflow: hidden;
  display: inline-block; /* 让表格根据内容自适应宽度 */
  min-width: 100%;
}

/* 移动端横向滚动容器 */
.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap; /* 防止表头换行 */
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
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
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #3a7bc8;
}

@media (max-width: 1024px) {
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

  .search-group {
    flex-direction: column;
    align-items: center;
  }

  .char-input {
    width: 80px;
  }

  .number-input {
    width: 100px;
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
@media (max-aspect-ratio: 1/1) {
  .table-scroll-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-scroll-wrapper::-webkit-scrollbar {
    height: 8px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-thumb {
    background: rgba(74, 144, 226, 0.5);
    border-radius: 4px;
  }

  .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.7);
  }
}
</style>
