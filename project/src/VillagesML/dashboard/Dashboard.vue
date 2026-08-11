<template>
<!--  <ExploreLayout>-->
    <div class="dashboard-page">
      <div class="page-header">
        <h1 class="page-title"><BarIcon icon="📊" />{{ t('villages.dashboard.pageTitle') }}</h1>
        <SimpleSelectDropdown
          v-model="activeDataset"
          :options="datasetOptions"
          :width="'180px'"
        />
      </div>

      <!-- Introduction Section -->
      <div class="intro-section vml-glass-panel">
        <p class="intro-text">
          <strong>{{ t('villages.dashboard.introTitle') }}</strong>{{ t('villages.dashboard.introText') }}
        </p>
        <div class="github-row">
          <span class="github-invite">{{ t('villages.dashboard.githubInvite') }}</span>
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
<!--        <span class="notice-icon"><InlineIcon icon="🔧" /></span>-->
<!--        <div class="notice-content">-->
<!--          <strong>數據庫優化通知</strong>-->
<!--          <span>計劃於 2026-03-02 進行 N-gram 數據優化，將刪除統計不顯著的條目（391萬 → 230萬），查詢性能將大幅提升。</span>-->
<!--        </div>-->
<!--      </div>-->

      <!-- Section Header: Features -->
      <div class="section-header">
        <h2><InlineIcon icon="🧭" />{{ t('villages.dashboard.featuresHeader') }}</h2>
        <p class="section-description">{{ t('villages.dashboard.featuresDesc') }}</p>
      </div>


      <!-- Quick Search -->
<!--      <div class="quick-search vml-glass-panel">-->
<!--        <h2><InlineIcon icon="🔍" />快速搜尋</h2>-->
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
          class="feature-card vml-glass-panel"
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
        <h2><InlineIcon icon="📈" />{{ t('villages.dashboard.statsHeader') }}</h2>
        <p class="section-description">{{ t('villages.dashboard.statsDesc') }}</p>
      </div>
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div v-for="stat in statistics" :key="stat.key" class="stat-card vml-glass-panel">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <template v-if="stat.loadable && !ngramStats">
              <button class="load-ngram-button" :disabled="loadingNgram" @click="loadNgramStats">
                <span v-if="!loadingNgram">{{ t('villages.dashboard.loadButton') }}</span>
                <span v-else>{{ t('villages.dashboard.loadingButton') }}</span>
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
import BarIcon from '@/components/common/BarIcon.vue'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { getVillagesOverview, getVillagesNgrams, getCachedVillagesNgrams } from '@/composables/data/useVillagesCache.js'
import { showError } from '@/utils/ui/message.js'
import { userStore } from '@/main/store/store.js'
import { useAsyncData } from '@/composables/core/useAsyncData.js'
import { buildCurrentVillagesMLPath } from '@/VillagesML/utils/currentDataset.js'
import { VILLAGESML_DATASETS } from '@/VillagesML/config/datasets.js'
import { resolveVillagesMLDatasetFromRoute, buildVillagesMLPath } from '@/VillagesML/utils/routeDataset.js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const searchKeyword = ref('')
const metadata = ref(null)
const ngramStats = ref(null)
const metadataQuery = useAsyncData()
const ngramStatsQuery = useAsyncData()
const loading = metadataQuery.loading
const loadingNgram = ngramStatsQuery.loading

// Dataset selector
const activeDataset = computed({
  get: () => resolveVillagesMLDatasetFromRoute(route),
  set: (dataset) => {
    if (dataset === resolveVillagesMLDatasetFromRoute(route)) return
    router.push(buildVillagesMLPath({ dataset }))
  }
})
const datasetOptions = computed(() =>
  VILLAGESML_DATASETS.map(d => ({ label: d.label, value: d.id }))
)

// Maintenance notice: show until 2026-03-02
const showMaintenanceNotice = computed(() => new Date() < new Date('2026-03-02'))

// Statistics
const statistics = computed(() => {
  if (!metadata.value) return []
  return [
    {
      key: 'villages',
      icon: '🏘️',
      label: t('villages.dashboard.stats.villages.label'),
      value: metadata.value.total_villages || 0,
      tooltip: t('villages.dashboard.stats.villages.tooltip')
    },
    {
      key: 'cities',
      icon: '🏙️',
      label: t('villages.dashboard.stats.cities.label'),
      value: metadata.value.total_cities || 0
    },
    {
      key: 'counties',
      icon: '🏛️',
      label: t('villages.dashboard.stats.counties.label'),
      value: metadata.value.total_counties || 0
    },
    {
      key: 'townships',
      icon: '🏘️',
      label: t('villages.dashboard.stats.townships.label'),
      value: metadata.value.total_townships || 0
    },
    {
      key: 'characters',
      icon: '🔤',
      label: t('villages.dashboard.stats.characters.label'),
      value: metadata.value.unique_characters || 0,
      tooltip: t('villages.dashboard.stats.characters.tooltip')
    },
    {
      key: 'ngrams',
      icon: '📐',
      label: t('villages.dashboard.stats.ngrams.label'),
      value: ngramStats.value?.ngram_significance?.significant || 0,
      tooltip: t('villages.dashboard.stats.ngrams.tooltip'),
      loadable: true
    },
  ]
})

// Features
const features = computed(() => {
  if (!route.path) return []

  return [
    {
      id: 'search',
      icon: '🔍',
      title: t('villages.dashboard.features.search.title'),
      description: t('villages.dashboard.features.search.description'),
      route: buildCurrentVillagesMLPath({ module: 'search' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public',
      tooltip: t('villages.dashboard.features.search.tooltip')
    },
    {
      id: 'character',
      icon: '🔤',
      title: t('villages.dashboard.features.character.title'),
      description: t('villages.dashboard.features.character.description'),
      route: buildCurrentVillagesMLPath({ module: 'character', subtab: 'frequency' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public',
      tooltip: t('villages.dashboard.features.character.tooltip')
    },
    {
      id: 'semantic',
      icon: '🏷️',
      title: t('villages.dashboard.features.semantic.title'),
      description: t('villages.dashboard.features.semantic.description'),
      route: buildCurrentVillagesMLPath({ module: 'semantic', subtab: 'categories' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public',
      tooltip: t('villages.dashboard.features.semantic.tooltip')
    },
    {
      id: 'spatial',
      icon: '🗺️',
      title: t('villages.dashboard.features.spatial.title'),
      description: t('villages.dashboard.features.spatial.description'),
      route: buildCurrentVillagesMLPath({ module: 'spatial', subtab: 'hotspots' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public',
      tooltip: t('villages.dashboard.features.spatial.tooltip')
    },
    {
      id: 'pattern',
      icon: '📐',
      title: t('villages.dashboard.features.pattern.title'),
      description: t('villages.dashboard.features.pattern.description'),
      route: buildCurrentVillagesMLPath({ module: 'pattern', subtab: 'frequency' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public',
      tooltip: t('villages.dashboard.features.pattern.tooltip')
    },
    {
      id: 'regional',
      icon: '🌍',
      title: t('villages.dashboard.features.regional.title'),
      description: t('villages.dashboard.features.regional.description'),
      route: buildCurrentVillagesMLPath({ module: 'regional', subtab: 'aggregates' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public',
      tooltip: t('villages.dashboard.features.regional.tooltip')
    },
    {
      id: 'compute',
      icon: '🤖',
      title: t('villages.dashboard.features.compute.title'),
      description: t('villages.dashboard.features.compute.description'),
      route: buildCurrentVillagesMLPath({ module: 'compute', subtab: 'clustering' }),
      badge: t('villages.dashboard.badge.loginRequired'),
      badgeClass: 'badge-auth',
      tooltip: t('villages.dashboard.features.compute.tooltip')
    },
    {
      id: 'system',
      icon: 'ℹ️',
      title: t('villages.dashboard.features.system.title'),
      description: t('villages.dashboard.features.system.description'),
      route: buildCurrentVillagesMLPath({ module: 'system' }),
      badge: t('villages.dashboard.badge.public'),
      badgeClass: 'badge-public'
    }
  ]
})

// Methods
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('zh-CN')
}

// const handleQuickSearch = () => {
//   if (!searchKeyword.value.trim()) return
//   window.location.href = buildCurrentVillagesMLPath({ module: 'search', query: { keyword: searchKeyword.value } })
// }

const navigateTo = (route) => {
  router.push(route)
}

const loadMetadata = async () => {
  await metadataQuery.load(() => getVillagesOverview(), {
    onSuccess: (result) => {
      metadata.value = result
    },
    onError: () => {
      showError(t('villages.dashboard.loadStatsError'))
    }
  })
}

const loadNgramStats = async () => {
  await ngramStatsQuery.load(() => getVillagesNgrams(), {
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
  const cachedNgrams = getCachedVillagesNgrams()
  if (cachedNgrams) {
    ngramStats.value = cachedNgrams
  }
})
</script>

<style scoped lang="scss">
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

.page-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
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
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-sm);
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
  background: rgba(var(--color-warning-rgb), 0.12);
  border: 1px solid rgba(var(--color-warning-rgb), 0.4);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
}

.notice-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notice-content {
  @include flex-col;
  gap: 4px;
}

.notice-content strong {
  color: var(--color-warning);
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
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-md);
  font-size: 16px;
  background: var(--glass-50);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--glass-80);
}

.search-button {
  padding: 12px 30px;
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 100px;
}

.search-button:hover {
  background: var(--color-map-draw);
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
  @include flex-col;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-card);
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
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0; /* Don't shrink badge */
  margin-left: auto; /* Push to right */
}

.badge-public {
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.badge-auth {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning-dark);
}

/* Introduction Section */
.intro-section {
  padding: 30px;
  margin-bottom: 30px;
  background: var(--glass-60);
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
  @include flex-col;
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
  border-radius: var(--radius-xl);
  background: rgba(var(--text-deep-rgb), 0.08);
  border: 1px solid rgba(var(--text-deep-rgb), 0.2);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.github-link:hover {
  background: rgba(var(--text-deep-rgb), 0.15);
  border-color: rgba(var(--text-deep-rgb), 0.4);
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

  .page-header {
    flex-direction: column;
    gap: 10px;
  }

  .page-title {
    font-size: 24px;
    margin-bottom: 0;
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
