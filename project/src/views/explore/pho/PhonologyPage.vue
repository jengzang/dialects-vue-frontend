<template>
  <div class="phonology-matrix-page">
    <div class="page-header">
      <h2 class="page-title">🔍️ 音系查詢</h2>
    </div>

    <!-- 地点输入组件 -->
    <div class="input-section">
      <LocationMultiInput
        v-model="queryStrings"
        @update:matchedLocations="handleMatchedLocations"
        @update:isMatching="handleIsMatching"
      />
      <button
        class="load-btn"
        @click="loadData"
        :disabled="matchedLocations.length === 0 || loading || isMatching"
      >
        <span v-if="isMatching" class="btn-spinner"></span>
        <span v-else-if="loading">加載中...</span>
        <span v-else>查詢</span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">重試</button>
    </div>

    <div v-else-if="matrixData" class="matrix-container">
      <PhonologyMatrix
        v-for="location in displayLocations"
        :key="location"
        :location="location"
        :initials="matrixData[location].initials"
        :finals="matrixData[location].finals"
        :tones="matrixData[location].tones"
        :matrix="matrixData[location].matrix"
      />
    </div>

    <div v-else class="empty">
      <p>請輸入地點並點擊查詢</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPhonologyMatrix } from '@/api/query/phonology.js'
import PhonologyMatrix from '@/components/TableAndTree/PhonologyTable.vue'
import LocationMultiInput from '@/components/query/LocationMultiInput.vue'
import { parseLocationsFromUrl, updateUrlWithLocations } from '@/api/urlParams.js'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref(null)
const matrixData = ref(null)

// 从 URL 初始化地点
const initialLocations = parseLocationsFromUrl(route)
const queryStrings = ref(initialLocations)

const matchedLocations = ref([])
const isMatching = ref(false) // 添加匹配状态
const shouldSyncUrl = ref(false) // 控制是否同步 URL

const displayLocations = computed(() => {
  if (!matrixData.value) return []
  return Object.keys(matrixData.value)
})

// 处理匹配到的地点列表
const handleMatchedLocations = (locations) => {
  matchedLocations.value = locations
}

// 处理匹配状态
const handleIsMatching = (matching) => {
  isMatching.value = matching
}

const loadData = async () => {
  if (matchedLocations.value.length === 0) {
    error.value = '請至少輸入一個地點'
    return
  }

  loading.value = true
  error.value = null

  try {
    const requestBody = {
      locations: matchedLocations.value
    }

    const result = await getPhonologyMatrix(requestBody)

    matrixData.value = result.data

    // 首次查询成功后启用 URL 同步
    shouldSyncUrl.value = true

    // 更新 URL
    updateUrlWithLocations(router, matchedLocations.value)
  } catch (err) {
    console.error('加載音韻矩陣失敗:', err)
    error.value = err.message || '加載數據時發生錯誤'
  } finally {
    loading.value = false
  }
}

// 页面加载时自动查询
onMounted(() => {
  if (initialLocations.length > 0) {
    // 等待 LocationMultiInput 完成地点匹配
    const unwatch = watch(matchedLocations, (locations) => {
      if (locations.length > 0) {
        loadData()
        unwatch() // 只自动查询一次
      }
    })
  }
})

// 处理浏览器前进/后退
watch(() => route.query.loc, () => {
  const urlLocations = parseLocationsFromUrl(route)

  // 只有当 URL 的地点和当前匹配的地点不同时，才需要清空数据
  // 这样可以避免在查询成功更新 URL 后误清空数据
  if (JSON.stringify(urlLocations) !== JSON.stringify(matchedLocations.value)) {
    queryStrings.value = urlLocations
    matrixData.value = null
    error.value = null
  }
})
</script>

<style scoped>
.phonology-matrix-page {
  width: 90dvw;
}

.page-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-dark-light);
}

.input-section {
  max-width: 600px;
  margin: 0 auto 30px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

.load-btn {
  padding: 12px 24px;
  max-width: 100px;
  white-space: nowrap;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--color-primary-shadow), 0 2px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.load-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-hover) 0%, #004ba0 100%);
  box-shadow: 0 6px 16px var(--color-primary-shadow-light), 0 3px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.load-btn:active:not(:disabled) {
  transform: translateY(0);
}

.load-btn:disabled {
  background: var(--bg-hover-medium);
  color: var(--text-secondary);
  cursor: not-allowed;
  box-shadow: none;
}

/* 按钮内的小旋转器 */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 15px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--glass-light2);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: var(--text-secondary);
  font-size: 15px;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 15px;
}

.error p {
  color: var(--color-error);
  font-size: 16px;
  font-weight: 500;
}

.retry-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.retry-btn:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.matrix-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--text-secondary);
  font-size: 16px;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {

  .page-title {
    font-size: 24px;
  }

  .input-section {
    max-width: 100%;
  }

  .load-btn {
    font-size: 14px;
    padding: 10px 20px;
  }
}
</style>
