<script setup>
import BarIcon from '@/components/common/BarIcon.vue'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { useI18n } from 'vue-i18n'
import UniversalTable from "@/main/components/TableAndTree/UniversalTable.vue";
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'

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

      <h1 class="tabs-title" style="font-size: 1.5rem;"><BarIcon icon="🔗" />{{ t('navigation.pageTitles.support.source') }}</h1>
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


<style scoped lang="scss">
$primary-blue: var(--color-primary);
$primary-blue-dark: var(--color-primary-hover);
$summary-color: var(--text-deep);

$transition-fast: 0.2s;

.privacy-link {
  padding: 4px 8px;
  color: $primary-blue;
  font-size: 14px;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all $transition-fast;

  &:hover {
    color: $primary-blue-dark;
    text-decoration: underline;
    background: rgba(0, 122, 255, 0.1);
  }

  @media (max-width: 768px) {
    font-size: 13px;
  }
}

.header-row {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 8px;
  }
}

.summary {
  margin-top: 12px;
  margin-bottom: 0;
  color: $summary-color;
  font-size: 14px;
}

</style>
