<template>
<!--  <ExploreLayout>-->
    <div class="dashboard-page">
      <h1 class="page-title">📊 自然村分析系統</h1>

      <!-- Introduction Section -->
      <div class="intro-section glass-panel">
        <p class="intro-text">
          <strong>自然村機器學習分析系統</strong>是一個基於廣東省285,860個自然村名稱的語言學分析平台。
          系統運用機器學習和自然語言處理技術，從多個維度分析村名的語義、結構、空間分佈等特徵，為地名學研究、文化地理學、語言學等領域提供數據支持。
        </p>
        <div class="feature-highlights">
          <div class="highlight-item">
            <span class="highlight-icon">🔍</span>
            <span class="highlight-text">搜尋與探索村名數據</span>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">📊</span>
            <span class="highlight-text">字頻與語義分析</span>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">🗺️</span>
            <span class="highlight-text">空間分佈可視化</span>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">🤖</span>
            <span class="highlight-text">機器學習聚類</span>
          </div>
        </div>
      </div>

      <!-- Section Header: Statistics -->
      <div class="section-header">
        <h2>📈 數據概覽</h2>
        <p class="section-description">系統收錄的村名與區域統計</p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div v-for="stat in statistics" :key="stat.key" class="stat-card glass-panel">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(stat.value) }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Section Header: Features -->
      <div class="section-header">
        <h2>🧭 功能模塊</h2>
        <p class="section-description">選擇下方模塊開始分析</p>
      </div>

      <!-- Quick Search -->
      <div class="quick-search glass-panel">
        <h2>🔍 快速搜尋</h2>
        <div class="search-input-group">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="輸入村名關鍵詞..."
            class="search-input"
            @keyup.enter="handleQuickSearch"
          />
          <button class="search-button" @click="handleQuickSearch">
            搜尋
          </button>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="features-grid">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="feature-card glass-panel"
          @click="navigateTo(feature.route)"
        >
          <div class="feature-header">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <div class="feature-badge" :class="feature.badgeClass">
              {{ feature.badge }}
            </div>
          </div>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import { getMetadataOverview } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { userStore } from '@/utils/store.js'

const router = useRouter()
const searchKeyword = ref('')
const metadata = ref(null)
const loading = ref(false)

// Statistics
const statistics = computed(() => {
  if (!metadata.value) return []
  return [
    { key: 'villages', icon: '🏘️', label: '自然村總數', value: metadata.value.total_villages || 0 },
    { key: 'cities', icon: '🏙️', label: '城市數量', value: metadata.value.total_cities || 0 },
    { key: 'counties', icon: '🏛️', label: '區縣數量', value: metadata.value.total_counties || 0 },
    { key: 'townships', icon: '🏘️', label: '鄉鎮數量', value: metadata.value.total_townships || 0 },
    { key: 'characters', icon: '🔤', label: '字符總數', value: metadata.value.unique_characters || 0 },
    // { key: 'ngrams', icon: '📐', label: 'N-gram模式', value: metadata.value.total_ngrams || 0 }
  ]
})

// Features
const features = [
  {
    id: 'search',
    icon: '🔍',
    title: '村名搜尋',
    description: '按關鍵詞、區域搜尋村名，查看詳細信息與深度分析報告',
    route: '/villagesML?module=search',
    badge: '公開',
    badgeClass: 'badge-public'
  },
  {
    id: 'character',
    icon: '🔤',
    title: '字頻分析',
    description: '分析村名中字符的使用頻率、區域傾向性、語義嵌入向量與統計顯著性',
    route: '/villagesML?module=character&subtab=frequency',
    badge: '公開',
    badgeClass: 'badge-public'
  },
  {
    id: 'semantic',
    icon: '🏷️',
    title: '語義分析',
    description: '探索村名的語義類別、標籤組合模式、語義網絡關係與語義組成結構',
    route: '/villagesML?module=semantic&subtab=categories',
    badge: '公開',
    badgeClass: 'badge-public'
  },
  {
    id: 'spatial',
    icon: '🗺️',
    title: '空間分析',
    description: '可視化村名的地理分佈、識別空間熱點聚類、分析空間整合模式',
    route: '/villagesML?module=spatial&subtab=hotspots',
    badge: '公開',
    badgeClass: 'badge-public'
  },
  {
    id: 'pattern',
    icon: '📐',
    title: '模式分析',
    description: '提取N-gram模式、分析結構規律、發現村名命名的語言學特徵',
    route: '/villagesML?module=pattern&subtab=ngrams',
    badge: '公開',
    badgeClass: 'badge-public'
  },
  {
    id: 'regional',
    icon: '🌍',
    title: '區域分析',
    description: '計算區域聚合統計、生成區域特徵向量、進行跨區域比較分析',
    route: '/villagesML?module=regional&subtab=aggregates',
    badge: '公開',
    badgeClass: 'badge-public'
  },
  {
    id: 'compute',
    icon: '🤖',
    title: 'ML計算',
    description: '執行機器學習聚類分析、提取高維特徵向量、進行子集深度分析',
    route: '/villagesML?module=compute&subtab=clustering',
    badge: '需登錄',
    badgeClass: 'badge-auth'
  },
  {
    id: 'system',
    icon: 'ℹ️',
    title: '系統信息',
    description: '查看數據庫概覽、表統計信息、系統運行狀態與緩存管理',
    route: '/villagesML?module=system',
    badge: '公開',
    badgeClass: 'badge-public'
  }
]

// Methods
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('zh-CN')
}

const handleQuickSearch = () => {
  if (!searchKeyword.value.trim()) return
  window.location.href = `/villagesML?module=search&keyword=${encodeURIComponent(searchKeyword.value)}`
}

const navigateTo = (route) => {
  router.push(route)
}

const loadMetadata = async () => {
  loading.value = true
  try {
    metadata.value = await getMetadataOverview()
  } catch (error) {
    showError('加載統計數據失敗')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMetadata()
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 5px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 48px;
  margin-right: 10px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.quick-search {
  padding: 10px 20px;
  margin-bottom: 30px;
}

.quick-search h2 {
  font-size: 20px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.search-input-group {
  display: flex;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.search-button {
  padding: 12px 30px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover {
  background: #3a7bc8;
  transform: translateY(-2px);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.feature-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
  flex: 1; /* Take remaining space */
}

.feature-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 0;
  flex: 1;
}

.feature-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0; /* Don't shrink badge */
  margin-left: auto; /* Push to right */
}

.badge-public {
  background: rgba(80, 200, 120, 0.2);
  color: #2d8659;
}

.badge-auth {
  background: rgba(243, 156, 18, 0.2);
  color: #c87f0a;
}

/* Introduction Section */
.intro-section {
  padding: 30px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.6);
}

.intro-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: justify;
}

.intro-text strong {
  color: var(--color-primary);
  font-weight: 600;
}

.feature-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.highlight-item:hover {
  background: rgba(74, 144, 226, 0.2);
  transform: translateX(5px);
}

.highlight-icon {
  font-size: 24px;
}

.highlight-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

/* Section Headers */
.section-header {
  margin-bottom: 20px;
  text-align: center;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    font-size: 36px;
  }

  .stat-value {
    font-size: 22px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 20px;
  }

  .feature-header {
    gap: 10px;
  }

  .feature-icon {
    font-size: 28px;
  }

  .feature-title {
    font-size: 16px;
  }

  .feature-description {
    font-size: 13px;
    line-height: 1.5;
  }

  .page-title {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .intro-section {
    padding: 16px;
    margin-bottom: 20px;
  }

  .intro-text {
    font-size: 14px;
    line-height: 1.6;
  }

  .feature-highlights {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .highlight-item {
    padding: 10px 14px;
  }

  .highlight-icon {
    font-size: 20px;
  }

  .highlight-text {
    font-size: 13px;
  }

  .section-header h2 {
    font-size: 20px;
  }

  .section-description {
    font-size: 13px;
  }

  .quick-search {
    padding: 20px;
    margin-bottom: 20px;
  }

  .quick-search h2 {
    font-size: 18px;
  }

  .search-input-group {
    flex-direction: column;
    gap: 12px;
  }

  .search-button {
    width: 100%;
    padding: 14px;
  }
}
</style>
