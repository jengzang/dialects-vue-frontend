<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { useI18n } from 'vue-i18n'
import UniversalTable from "@/main/components/TableAndTree/UniversalTable.vue";
import { getHomeUpdateNotice } from '@/main/config/updateNoticeConfig.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/useSourceStats.js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const sourceDbVersion = getHomeUpdateNotice(t).dbVersion

const cachedStats = getCachedSourceStats()
const locationCount = ref(cachedStats.locationCount)
const dataCount = ref(cachedStats.dataCount)

onMounted(async () => {
  try {
    const stats = await getSourceStats()
    locationCount.value = stats.locationCount
    dataCount.value = stats.dataCount
  } catch (error) {
    console.error('獲取字表統計失敗:', error)
  }
})

const dataColumns = [
  {key: '簡稱', label: t('source.columns.location'), filterable: false, width: 1},
  {key: '地圖集二分區', label: t('source.columns.atlasRegion'), filterable: true, width: 1.5},
  {key: '音典分區', label: t('source.columns.dictRegion'), filterable: true, width: 1.5},
  {key: '字表來源（母本）', label: t('source.columns.source'), filterable: false, width: 3},
  {key: '省', label: t('source.columns.province'), filterable: true, width: 0.8},
  {key: '市', label: t('source.columns.city'), filterable: true, width: 0.8},
  {key: '縣', label: t('source.columns.county'), filterable: true, width: 0.8},
  {key: '鎮', label: t('source.columns.town'), filterable: true, width: 0.8},
  // {key: '經緯度', label: '經緯度', filterable: false, width: 2},
];

// 默认筛选配置（可选）
// 示例1：筛选"存儲標記"为1的数据（该列不在显示列中）
const defaultFilter = { '存儲標記': 1 }

// 示例2：筛选显示列中的数据，例如只显示"省"为"廣東"的数据
// const defaultFilter = { '省': '廣東' }

// 示例3：多列筛选
// const defaultFilter = { '省': '廣東', '市': '陽江' }

// 示例4：筛选多个值（数组形式）
// const defaultFilter = { '省': ['廣東', '廣西'] }

const goToPrivacy = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/privacy'))
}
</script>

<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="header-row">

      <h2 class="tabs-title" style="font-size: 1.5rem;">📚 {{ t('source.title') }}</h2>
      <a class="privacy-link" @click="goToPrivacy">
        {{ t('source.privacyLink') }}
      </a>

    </div>
<!--    <UniversalTable-->
<!--        db-key="query"-->
<!--        table-name="dialects"-->
<!--        :columns="dataColumns"-->
<!--    />-->
    <!-- 如果需要默认筛选，取消下面的注释并定义 defaultFilter 变量 -->
    <UniversalTable
        db-key="query"
        table-name="dialects"
        :columns="dataColumns"
        :default-filter="defaultFilter"
    />
    <p class="summary">{{ t('source.totalRecords', { locationCount, dataCount }) }}</p>
    <p class="summary">{{ t('source.databaseVersion', { version: sourceDbVersion }) }}</p>
  </div>
</template>

```vue

$primary-blue: var(--color-primary);
$text-primary: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-muted: var(--text-lightest);
$border-color: var(--border-light-gray);
$white: var(--text-white);

$transition-duration: 0.3s;

.settings-container {
  max-width: 880px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 480px) {
    padding: 12px;
  }
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.setting-section {
  padding: 24px;
  background: var(--glass-90);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @media (max-width: 480px) {
    padding: 16px;
  }
}

.section-title {
  margin: 0 0 8px;
  color: $text-primary;
  font-size: 20px;
  font-weight: 600;
}

.section-description {
  margin: 0 0 20px;
  color: $text-secondary;
  font-size: 14px;
}

.language-options,
.mode-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.language-card,
.mode-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  background: var(--glass-80);
  border: 2px solid $border-color;
  border-radius: 12px;
  transition: all $transition-duration ease;

  &:hover {
    background: $white;
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1),
      rgba(var(--color-primary-rgb), 0.05)
    );
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }
}

.mode-option {
  flex-direction: column;
  align-items: stretch;
}

.language-flag {
  margin-right: 16px;
  font-size: 32px;

  @media (max-width: 480px) {
    margin-right: 12px;
    font-size: 28px;
  }
}

.language-info {
  flex: 1;
}

.language-name,
.mode-option-label {
  color: $text-primary;
  font-size: 16px;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 14px;
  }
}

.language-name {
  margin-bottom: 4px;
}

.language-code,
.mode-option-description {
  color: $text-muted;
  font-size: 12px;

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

.language-check,
.mode-option-check {
  color: $primary-blue;
  font-size: 24px;
  font-weight: bold;
}

.mode-option-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mode-option-description {
  color: $text-secondary;
  font-size: 13px;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

```

