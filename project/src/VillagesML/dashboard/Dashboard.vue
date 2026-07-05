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
        <div class="github-row">
          <span class="github-invite">歡迎 Star ⭐、Fork 🍴 或提 Issue 💬</span>
          <a
            href="https://github.com/jengzang/villages-ML"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
          >
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            villages-ML
          </a>
        </div>
      </div>

      <!-- Maintenance Notice -->
<!--      <div v-if="showMaintenanceNotice" class="maintenance-notice">-->
<!--        <span class="notice-icon">🔧</span>-->
<!--        <div class="notice-content">-->
<!--          <strong>數據庫優化通知</strong>-->
<!--          <span>計劃於 2026-03-02 進行 N-gram 數據優化，將刪除統計不顯著的條目（391萬 → 230萬），查詢性能將大幅提升。</span>-->
<!--        </div>-->
<!--      </div>-->

      <!-- Section Header: Features -->
      <div class="section-header">
        <h2>🧭 功能模塊</h2>
        <p class="section-description">點擊下方模塊開始分析</p>
      </div>


      <!-- Quick Search -->
<!--      <div class="quick-search glass-panel">-->
<!--        <h2>🔍 快速搜尋</h2>-->
<!--        <div class="search-input-group">-->
<!--          <input-->
<!--            v-model="searchKeyword"-->
<!--            type="text"-->
<!--            placeholder="輸入村名關鍵詞..."-->
<!--            class="search-input"-->
<!--            @keyup.enter="handleQuickSearch"-->
<!--          />-->
<!--          <button class="search-button" @click="handleQuickSearch">-->
<!--            搜尋-->
<!--          </button>-->
<!--        </div>-->
<!--      </div>-->

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
            <h3 class="feature-title">
              {{ feature.title }}
              <HelpIcon
                v-if="feature.tooltip"
                :content="feature.tooltip"
                size="sm"
                fontSize="14px"
                trigger="both"
              />
            </h3>
            <div class="feature-badge" :class="feature.badgeClass">
              {{ feature.badge }}
            </div>
          </div>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
      <div class="section-header">
        <h2>📈 數據概覽</h2>
        <p class="section-description">系統收錄的村名與區域統計</p>
      </div>
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div v-for="stat in statistics" :key="stat.key" class="stat-card glass-panel">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <template v-if="stat.loadable && !ngramStats">
              <button class="load-ngram-button" :disabled="loadingNgram" @click="loadNgramStats">
                <span v-if="!loadingNgram">加載</span>
                <span v-else>加載中...</span>
              </button>
            </template>
            <div v-else class="stat-value">{{ formatNumber(stat.value) }}</div>
            <div class="stat-label">
              {{ stat.label }}
              <HelpIcon
                v-if="stat.tooltip"
                :content="stat.tooltip"
                size="sm"
                fontSize="14px"
                trigger="both"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { getMetadataOverview, getNgramStatistics } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { userStore } from '@/main/store/store.js'
import { useAsyncData } from '@/composables/core/useAsyncData.js'

const router = useRouter()
const searchKeyword = ref('')
const metadata = ref(null)
const ngramStats = ref(null)
const metadataQuery = useAsyncData()
const ngramStatsQuery = useAsyncData()
const loading = metadataQuery.loading
const loadingNgram = ngramStatsQuery.loading

// Maintenance notice: show until 2026-03-02
const showMaintenanceNotice = computed(() => new Date() < new Date('2026-03-02'))

// Statistics
const statistics = computed(() => {
  if (!metadata.value) return []
  return [
    {
      key: 'villages',
      icon: '🏘️',
      label: '自然村總數',
      value: metadata.value.total_villages || 0,
      tooltip: '廣東省285,860個自然村名稱，數據來源於2020年全國地名普查。覆蓋21個地級市、123個區縣、1500+個鄉鎮'
    },
    {
      key: 'cities',
      icon: '🏙️',
      label: '城市數量',
      value: metadata.value.total_cities || 0
    },
    {
      key: 'counties',
      icon: '🏛️',
      label: '區縣數量',
      value: metadata.value.total_counties || 0
    },
    {
      key: 'townships',
      icon: '🏘️',
      label: '鄉鎮數量',
      value: metadata.value.total_townships || 0
    },
    {
      key: 'characters',
      icon: '🔤',
      label: '字符總數',
      value: metadata.value.unique_characters || 0,
      tooltip: '地名中使用的不同漢字總數為3,067個。已為每個字符訓練Word2Vec嵌入向量（維度100，窗口5，最小頻率5）'
    },
    {
      key: 'ngrams',
      icon: '📐',
      label: '顯著 N-gram',
      value: ngramStats.value?.ngram_significance?.significant || 0,
      tooltip: '經PMI（互信息）和卡方檢驗篩選的統計顯著N-gram模式。',
      loadable: true
    },
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
    badgeClass: 'badge-public',
    tooltip: '支持關鍵詞模糊匹配和三級行政區（市→縣→鎮）聯動篩選。點擊村莊可查看深度分析報告，包含語義結構、N-gram分解、空間特徵等多維度信息'
  },
  {
    id: 'character',
    icon: '🔤',
    title: '字頻分析',
    description: '分析村名中字符的使用頻率、區域傾向性、語義嵌入向量與統計顯著性',
    route: '/villagesML?module=character&subtab=frequency',
    badge: '公開',
    badgeClass: 'badge-public',
    tooltip: '基於285,860條村名的字符統計分析。包含：①頻率傾向（Z-score/Lift/Log-odds三種指標衡量地區偏好）②嵌入相似（Word2Vec Skipgram模型，100維向量，餘弦相似度）③字符網絡（Louvain社群識別算法）④顯著性（卡方檢驗，Cramér\'s V效應量）'
  },
  {
    id: 'semantic',
    icon: '🏷️',
    title: '語義分析',
    description: '探索村名的語義類別、標籤組合模式、語義網絡關係與語義組成結構',
    route: '/villagesML?module=semantic&subtab=categories',
    badge: '公開',
    badgeClass: 'badge-public',
    tooltip: '基於混合詞典v4.0（LLM標注+人工校驗），9大類別+76子類別。包含：①VTF（Virtual Term Frequency，置信度加權）②Bigram/Trigram組合模式（PMI互信息量化關聯強度）③語義網絡（NetworkX圖分析）④語義指數（Shannon熵、多樣性指標）'
  },
  {
    id: 'spatial',
    icon: '🗺️',
    title: '空間分析',
    description: '可視化村名的地理分佈、識別空間熱點聚類、分析空間整合模式',
    route: '/villagesML?module=spatial&subtab=hotspots',
    badge: '公開',
    badgeClass: 'badge-public',
    tooltip: '使用DBSCAN密度聚類算法（eps半徑+min_samples最小樣本數）識別地理熱點。支持空間自相關分析、聚類質心計算、MapLibre GPU加速渲染。可調整eps參數（0.5-20km）探索不同尺度的空間模式'
  },
  {
    id: 'pattern',
    icon: '📐',
    title: '模式分析',
    description: '提取N-gram模式、分析結構規律、發現村名命名的語言學特徵',
    route: '/villagesML?module=pattern&subtab=frequency',
    badge: '公開',
    badgeClass: 'badge-public',
    tooltip: '提取2-4gram字符序列模式。統計指標：①PMI（Pointwise Mutual Information，log₂[P(A,B)/(P(A)·P(B))]）②卡方顯著性檢驗③Lift傾向性（區域頻率/全局頻率比值）。支持通配符搜索（*表示任意字符，X表示單個字符）'
  },
  {
    id: 'regional',
    icon: '🌍',
    title: '區域分析',
    description: '計算區域聚合統計、生成區域特徵向量、進行跨區域比較分析',
    route: '/villagesML?module=regional&subtab=aggregates',
    badge: '公開',
    badgeClass: 'badge-public',
    tooltip: '按市/縣/鎮三級聚合統計。生成TF-IDF特徵向量（TF=區域頻率，IDF=log(總區域數/含該特徵的區域數)）。計算區域間餘弦相似度/Jaccard相似度，識別地名文化圈。支持Z-score傾向性熱圖可視化'
  },
  {
    id: 'compute',
    icon: '🤖',
    title: 'ML計算',
    description: '執行機器學習聚類分析、提取高維特徵向量、進行子集深度分析',
    route: '/villagesML?module=compute&subtab=clustering',
    badge: '需登錄',
    badgeClass: 'badge-auth',
    tooltip: '需登錄。支持三種聚類算法：①K-Means（質心聚類，需指定k值）②DBSCAN（密度聚類，自動識別噪聲點）③GMM（高斯混合模型，概率分配）。特徵工程：語義（9維）+形態（N-gram TF）+多樣性（Shannon熵）+空間（坐標+密度）。預處理：StandardScaler標準化+PCA降維（默認50維）。評估指標：Silhouette Score（輪廓係數，[-1,1]）、Davies-Bouldin Index（越低越好）、Calinski-Harabasz Score（越高越好）'
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
  await metadataQuery.load(() => getMetadataOverview(), {
    onSuccess: (result) => {
      metadata.value = result
    },
    onError: () => {
      showError('加載統計數據失敗')
    }
  })
}

const loadNgramStats = async () => {
  await ngramStatsQuery.load(() => getNgramStatistics(), {
    onSuccess: (result) => {
      ngramStats.value = result
    },
    onError: () => {
      // Non-critical, silently ignore
    }
  })
}

onMounted(() => {
  loadMetadata()
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  max-width: 1400px;
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

.load-ngram-button {
  padding: 6px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 4px;
}

.load-ngram-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.maintenance-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  background: rgba(243, 156, 18, 0.12);
  border: 1px solid rgba(243, 156, 18, 0.4);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
}

.notice-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notice-content strong {
  color: #d68910;
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

.github-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.github-invite {
  font-size: 14px;
  color: var(--text-secondary);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  border-radius: 20px;
  background: rgba(36, 41, 47, 0.08);
  border: 1px solid rgba(36, 41, 47, 0.2);
  color: #24292f;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.github-link:hover {
  background: rgba(36, 41, 47, 0.15);
  border-color: rgba(36, 41, 47, 0.4);
}

.github-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
    gap: 10px;
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
