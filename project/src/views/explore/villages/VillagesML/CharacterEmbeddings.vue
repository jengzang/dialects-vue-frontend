<template>
<!--  <ExploreLayout>-->
    <div class="character-embeddings-page">
      <h1 class="page-title">🔤 字符嵌入與相似度</h1>

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
              :key="item.char"
              class="similarity-item"
              :class="{ 'top-3': index < 3 }"
            >
              <div class="rank">{{ index + 1 }}</div>
              <div class="char">{{ item.char }}</div>
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
          <h3>向量可視化</h3>
          <div class="viz-placeholder">
            <p>📊 t-SNE / UMAP 可視化</p>
            <p class="viz-note">顯示 {{ searchChar }} 及其相似字在向量空間中的分佈</p>
          </div>
        </div>
      </div>

      <!-- Embeddings List -->
      <div class="embeddings-list glass-panel">
        <div class="list-header">
          <h3>字符嵌入列表</h3>
          <div class="pagination-controls">
            <button
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              上一頁
            </button>
            <span>第 {{ currentPage }} 頁</span>
            <button
              :disabled="embeddings.length < pageSize"
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

        <div v-else class="embeddings-table">
          <div class="table-header">
            <div class="col-char">字符</div>
            <div class="col-dim">向量維度</div>
            <div class="col-action">操作</div>
          </div>
          <div class="table-body">
            <div
              v-for="embedding in embeddings"
              :key="embedding.char"
              class="table-row"
            >
              <div class="col-char">{{ embedding.char }}</div>
              <div class="col-dim">{{ embedding.vector_dim }}</div>
              <div class="col-action">
                <button
                  class="action-button"
                  @click="searchChar = embedding.char; searchSimilarities()"
                >
                  查找相似
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
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

// Methods
const handleCharInput = () => {
  // Ensure only one character
  if (searchChar.value.length > 1) {
    searchChar.value = searchChar.value.charAt(0)
  }
}

const searchSimilarities = async () => {
  if (!searchChar.value) return

  loading.value = true
  try {
    const result = await getCharSimilarities({
      char: searchChar.value,
      top_n: topN.value
    })
    similarities.value = result || []
  } catch (error) {
    showError('搜尋相似字失敗')
  } finally {
    loading.value = false
  }
}

const loadEmbeddingsList = async () => {
  loadingList.value = true
  try {
    const result = await getCharEmbeddingsList({
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize
    })
    embeddings.value = result.embeddings || []
  } catch (error) {
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
  padding: 20px;
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
  padding: 24px;
  margin-bottom: 30px;
}

.search-section h2 {
  font-size: 20px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.search-group {
  display: flex;
  gap: 12px;
}

.char-input {
  width: 80px;
  padding: 12px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
}

.number-input {
  width: 120px;
  padding: 12px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 16px;
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
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
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
  gap: 20px;
  margin-bottom: 30px;
}

.similarity-list,
.vector-viz {
  padding: 24px;
}

.similarity-list h3,
.vector-viz h3 {
  font-size: 18px;
  margin-bottom: 20px;
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
  background: linear-gradient(90deg, var(--color-primary), var(--secondary-color));
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
  padding: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  font-size: 18px;
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
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 150px;
  gap: 16px;
  padding: 12px 16px;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
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
}

.col-dim {
  color: var(--text-secondary);
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
  .page-title {
    font-size: 24px;
  }

  .search-group {
    flex-direction: column;
  }

  .char-input,
  .number-input {
    width: 100%;
  }
}
</style>
