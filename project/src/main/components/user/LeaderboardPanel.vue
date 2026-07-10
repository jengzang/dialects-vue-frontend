<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLeaderboard } from '@/api'
import { useAsyncData } from '@/composables/core/useAsyncData.js'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { showError } from '@/utils/message.js'

const { t, locale } = useI18n()

const {
  data: rankingsData,
  loading,
  error,
  load,
} = useAsyncData()

onMounted(async () => {
  await fetchLeaderboard()
})

const categoryConfigs = computed(() => [
  // categoryKey / endpoint key 必须和后端 leaderboard 返回结构保持一致；这里主要负责映射展示文案。
  {
    id: 'phonology',
    icon: '🔍',
    label: t('user.leaderboard.categories.phonology.label'),
    categoryKey: 'category_音韻查詢',
    endpoints: [
      {
        key: 'endpoint__api_ZhongGu',
        label: t('user.leaderboard.categories.phonology.items.zhonggu')
      },
      {
        key: 'endpoint__api_YinWei',
        label: t('user.leaderboard.categories.phonology.items.yinwei')
      },
      {
        key: 'endpoint__api_phonology',
        label: t('user.leaderboard.categories.phonology.items.diwei'),
        tooltip: t('user.leaderboard.categories.phonology.tooltips.diwei')
      },
      {
        key: 'endpoint__api_charlist',
        label: t('user.leaderboard.categories.phonology.items.combination')
      },
      {
        key: 'endpoint__api_feature_stats',
        label: t('user.leaderboard.categories.phonology.items.syllable'),
        tooltip: t('user.leaderboard.categories.phonology.tooltips.syllable')
      },
      {
        key: 'endpoint__api_compare_ZhongGu',
        label: t('user.leaderboard.categories.phonology.items.compareZhonggu')
      }
    ]
  },
  {
    id: 'charsTones',
    icon: '📝',
    label: t('user.leaderboard.categories.charsTones.label'),
    categoryKey: 'category_字調查詢',
    endpoints: [
      {
        key: 'endpoint__api_search_chars_',
        label: t('user.leaderboard.categories.charsTones.items.chars')
      },
      {
        key: 'endpoint__api_search_tones_',
        label: t('user.leaderboard.categories.charsTones.items.tones')
      },
      {
        key: 'endpoint__api_compare_chars',
        label: t('user.leaderboard.categories.charsTones.items.compareChars')
      },
      {
        key: 'endpoint__api_compare_tones',
        label: t('user.leaderboard.categories.charsTones.items.compareTones')
      }
    ]
  },
  {
    id: 'analysis',
    icon: '📊',
    label: t('user.leaderboard.categories.analysis.label'),
    categoryKey: 'category_音系分析',
    endpoints: [
      {
        key: 'endpoint__api_phonology_matrix',
        label: t('user.leaderboard.categories.analysis.items.matrix')
      },
      {
        key: 'endpoint__api_phonology_classification_matrix',
        label: t('user.leaderboard.categories.analysis.items.classification')
      },
      {
        key: 'endpoint__api_feature_counts',
        label: t('user.leaderboard.categories.analysis.items.counts')
      },
      {
        key: 'endpoint_group_pho_pie',
        label: t('user.leaderboard.categories.analysis.items.pie')
      }
    ]
  },
  {
    id: 'tools',
    icon: '🛠️',
    label: t('user.leaderboard.categories.tools.label'),
    categoryKey: 'category_工具使用',
    endpoints: [
      {
        key: 'endpoint__api_tools_check_analyze',
        label: t('user.leaderboard.categories.tools.items.check')
      },
      {
        key: 'endpoint__api_tools_jyut2ipa_upload',
        label: t('user.leaderboard.categories.tools.items.jyut2ipa')
      },
      {
        key: 'endpoint__api_tools_merge_execute',
        label: t('user.leaderboard.categories.tools.items.merge')
      },
      {
        key: 'endpoint__api_tools_praat_jobs',
        label: t('user.leaderboard.categories.tools.items.praat')
      }
    ]
  },
  {
    id: 'other',
    icon: '🏷️',
    label: t('user.leaderboard.categories.other.label'),
    categoryKey: 'category_其他查询',
    endpoints: [
      {
        key: 'endpoint__api_get_coordinates',
        label: t('user.leaderboard.categories.other.items.coordinates'),
        tooltip: t('user.leaderboard.categories.other.tooltips.coordinates')
      },
      {
        key: 'endpoint_group_locations',
        label: t('user.leaderboard.categories.other.items.locations'),
        tooltip: t('user.leaderboard.categories.other.tooltips.locations')
      },
      {
        key: 'endpoint__sql_query',
        label: t('user.leaderboard.categories.other.items.table'),
        tooltip: t('user.leaderboard.categories.other.tooltips.table')
      },
      {
        key: 'endpoint_group_sql_tree',
        label: t('user.leaderboard.categories.other.items.tree'),
        tooltip: t('user.leaderboard.categories.other.tooltips.tree')
      },
      {
        key:'endpoint_group_villages_ml',
        label: t('user.leaderboard.categories.other.items.villages'),
        // tooltip: t()
      },
    ]
  }
])

const fetchLeaderboard = async () => load(
  () => getLeaderboard(),
  {
    // 排行榜页只展示 toast，不在这里额外改写 error 文案，保持 useAsyncData 的原始错误状态可读。
    onError: (e) => {
      const message = e?.message || ''
      showError(t('user.leaderboard.loadFailedToast', { message }))
    }
  }
)

const formatNumber = (value) => Number(value || 0).toLocaleString(locale.value)

const formatCount = (value) => t('user.leaderboard.format.count', { value: formatNumber(value) })

const formatOnlineTime = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds || 0)))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return t('user.leaderboard.format.hoursMinutes', { hours, minutes })
  }

  return t('user.leaderboard.format.minutesSeconds', { minutes, seconds: secs })
}

const formatMetricValue = (metric) => (
  metric.isTime ? formatOnlineTime(metric.data.value) : formatCount(metric.data.value)
)

const formatMetricGap = (metric) => {
  if (!metric.data.gap_to_prev) {
    return null
  }

  return metric.isTime
    ? formatOnlineTime(metric.data.gap_to_prev)
    : formatCount(metric.data.gap_to_prev)
}

const formatMetricFirst = (metric) => (
  metric.isTime ? formatOnlineTime(metric.data.first_place_value) : formatCount(metric.data.first_place_value)
)

const getRankLabel = (rank) => {
  if (rank === 1) return '🥇 ' + t('user.leaderboard.rank.first')
  if (rank === 2) return '🥈 ' + t('user.leaderboard.rank.second')
  if (rank === 3) return '🥉 ' + t('user.leaderboard.rank.third')
  return t('user.leaderboard.rank.default', { rank })
}

const createRow = (label, data) => ({
  type: 'data',
  label,
  rank: data.rank,
  value: formatCount(data.value),
  gap: data.gap_to_prev ? formatCount(data.gap_to_prev) : t('user.leaderboard.format.noGap'),
  firstPlace: formatCount(data.first_place_value),
  isFirstPlace: data.rank === 1,
  isSecondPlace: data.rank === 2,
  isThirdPlace: data.rank === 3
})

const topMetrics = computed(() => {
  if (!rankingsData.value) return []

  // 顶部摘要卡单独挑出最常看的指标，下面的分类表格仍然展示完整明细。
  const rankings = rankingsData.value.rankings
  return [
    {
      icon: '⏱️',
      label: t('user.leaderboard.topMetrics.onlineTime.label'),
      data: rankings.online_time,
      isTime: true
    },
    {
      icon: '📊',
      label: t('user.leaderboard.topMetrics.totalQueries.label'),
      data: rankings.total_queries,
      isTime: false,
      tooltip: t('user.leaderboard.topMetrics.totalQueries.tooltip')
    }
  ]
})

const tableData = computed(() => {
  if (!rankingsData.value) return []

  const rows = []
  const rankings = rankingsData.value.rankings

  for (const category of categoryConfigs.value) {
    const categoryData = rankings[category.categoryKey]
    if (!categoryData) continue

    const categorySummary = {
      rank: categoryData.rank,
      value: formatCount(categoryData.value),
      gap: categoryData.gap_to_prev
        ? formatCount(categoryData.gap_to_prev)
        : t('user.leaderboard.format.noGap'),
      firstPlace: formatCount(categoryData.first_place_value),
      isFirstPlace: categoryData.rank === 1,
      isSecondPlace: categoryData.rank === 2,
      isThirdPlace: categoryData.rank === 3
    }

    const endpointRows = []
    for (const endpoint of category.endpoints) {
      const data = rankings[endpoint.key]
      if (!data || data.value < 0) continue

      endpointRows.push({
        ...createRow(endpoint.label, data),
        categoryName: category.label,
        categoryIcon: category.icon,
        categorySummary,
        tooltip: endpoint.tooltip
      })
    }

    if (endpointRows.length === 0) continue

    endpointRows[0].isFirstEndpointInCategory = true
    endpointRows[0].categoryEndpointCount = endpointRows.length

    rows.push({
      ...createRow(
        t('user.leaderboard.categories.summary', { label: category.label }),
        categoryData
      ),
      isCategorySummary: true,
      categoryName: category.label,
      categoryIcon: category.icon
    })

    rows.push(...endpointRows)
  }

  return rows
})
</script>

<template>
  <div class="leaderboard-container">
    <div v-if="loading" class="loading-container">
      <!-- <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ t('user.leaderboard.loading') }}</p> -->
    </div>

    <div v-else-if="error" class="error-container">
      <p class="err">{{ t('user.leaderboard.errorDetail', { message: error }) }}</p>
      <button class="retry-btn" @click="fetchLeaderboard">{{ t('user.leaderboard.retry') }}</button>
    </div>

    <div v-else-if="rankingsData" class="leaderboard-content">
      <h3 class="page-title">🏆 {{ t('user.leaderboard.title') }}</h3>

      <div class="top-metrics-cards">
        <div
          v-for="metric in topMetrics"
          :key="metric.label"
          class="metric-card"
          :class="{
            'first-place': metric.data.rank === 1,
            'second-place': metric.data.rank === 2,
            'third-place': metric.data.rank === 3
          }"
        >
          <div class="metric-header">
            <span class="metric-icon">{{ metric.icon }}</span>
            <span class="metric-label">
              {{ metric.label }}
              <!-- <HelpIcon
                v-if="metric.tooltip"
                :content="metric.tooltip"
                size="md"
                fontSize="16px"
                iconColor="#c7254e"
                trigger="both"
              /> -->
            </span>
          </div>

          <div
            class="metric-rank"
            :class="{
              gold: metric.data.rank === 1,
              silver: metric.data.rank === 2,
              bronze: metric.data.rank === 3
            }"
          >
            {{ getRankLabel(metric.data.rank) }}
          </div>

          <div class="metric-value">
            {{ formatMetricValue(metric) }}
          </div>

          <div class="metric-details">
            <div v-if="formatMetricGap(metric)" class="metric-gap">
              {{ t('user.leaderboard.gapLabel') }}: {{ formatMetricGap(metric) }}
            </div>
            <div class="metric-first">
              {{ t('user.leaderboard.firstPlaceLabel') }}: {{ formatMetricFirst(metric) }}
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <div class="table-container">
          <table class="rankings-table desktop-table">
            <thead>
              <tr>
                <th class="category-column">{{ t('user.leaderboard.columns.category') }}</th>
                <th>{{ t('user.leaderboard.columns.rank') }}</th>
                <th>{{ t('user.leaderboard.columns.count') }}</th>
                <th class="col-gap">{{ t('user.leaderboard.columns.gap') }}</th>
                <th class="col-first-place">{{ t('user.leaderboard.columns.firstPlace') }}</th>
                <th>{{ t('user.leaderboard.columns.metric') }}</th>
                <th>{{ t('user.leaderboard.columns.rank') }}</th>
                <th>{{ t('user.leaderboard.columns.count') }}</th>
                <th class="col-gap">{{ t('user.leaderboard.columns.gap') }}</th>
                <th class="col-first-place">{{ t('user.leaderboard.columns.firstPlace') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, index) in tableData" :key="'desktop-' + index">
                <tr
                  v-if="!row.isCategorySummary"
                  class="data-row"
                >
                  <template v-if="row.isFirstEndpointInCategory">
                    <td
                      :rowspan="row.categoryEndpointCount"
                      class="category-cell"
                      :class="{
                        gold: row.categorySummary.isFirstPlace,
                        silver: row.categorySummary.isSecondPlace,
                        bronze: row.categorySummary.isThirdPlace
                      }"
                    >
                      {{ row.categoryIcon }} {{ row.categoryName }}
                    </td>
                    <td
                      :rowspan="row.categoryEndpointCount"
                      class="rank category-data"
                      :class="{
                        'category-gold': row.categorySummary.isFirstPlace,
                        'category-silver': row.categorySummary.isSecondPlace,
                        'category-bronze': row.categorySummary.isThirdPlace
                      }"
                    >
                      <span
                        class="rank-badge"
                        :class="{
                          gold: row.categorySummary.isFirstPlace,
                          silver: row.categorySummary.isSecondPlace,
                          bronze: row.categorySummary.isThirdPlace
                        }"
                      >
                        {{ getRankLabel(row.categorySummary.rank) }}
                      </span>
                    </td>
                    <td
                      :rowspan="row.categoryEndpointCount"
                      class="value category-data"
                      :class="{
                        'category-gold': row.categorySummary.isFirstPlace,
                        'category-silver': row.categorySummary.isSecondPlace,
                        'category-bronze': row.categorySummary.isThirdPlace
                      }"
                    >
                      {{ row.categorySummary.value }}
                    </td>
                    <td
                      :rowspan="row.categoryEndpointCount"
                      class="gap category-data"
                      :class="{
                        'category-gold': row.categorySummary.isFirstPlace,
                        'category-silver': row.categorySummary.isSecondPlace,
                        'category-bronze': row.categorySummary.isThirdPlace
                      }"
                    >
                      {{ row.categorySummary.gap }}
                    </td>
                    <td
                      :rowspan="row.categoryEndpointCount"
                      class="first-place-value category-data"
                      :class="{
                        'category-gold': row.categorySummary.isFirstPlace,
                        'category-silver': row.categorySummary.isSecondPlace,
                        'category-bronze': row.categorySummary.isThirdPlace
                      }"
                    >
                      {{ row.categorySummary.firstPlace }}
                    </td>
                  </template>

                  <td
                    class="metric-name"
                    :class="{
                      'first-place': row.isFirstPlace,
                      'second-place': row.isSecondPlace,
                      'third-place': row.isThirdPlace
                    }"
                  >
                    {{ row.label }}
                    <HelpIcon
                      v-if="row.tooltip"
                      :content="row.tooltip"
                      size="sm"
                      fontSize="14px"
                      trigger="both"
                    />
                  </td>
                  <td
                    class="rank"
                    :class="{
                      'first-place': row.isFirstPlace,
                      'second-place': row.isSecondPlace,
                      'third-place': row.isThirdPlace
                    }"
                  >
                    <span
                      class="rank-badge"
                      :class="{
                        gold: row.isFirstPlace,
                        silver: row.isSecondPlace,
                        bronze: row.isThirdPlace
                      }"
                    >
                      {{ getRankLabel(row.rank) }}
                    </span>
                  </td>
                  <td
                    class="value"
                    :class="{
                      'first-place': row.isFirstPlace,
                      'second-place': row.isSecondPlace,
                      'third-place': row.isThirdPlace
                    }"
                  >{{ row.value }}</td>
                  <td
                    class="gap"
                    :class="{
                      'first-place': row.isFirstPlace,
                      'second-place': row.isSecondPlace,
                      'third-place': row.isThirdPlace
                    }"
                  >{{ row.gap }}</td>
                  <td
                    class="first-place-value"
                    :class="{
                      'first-place': row.isFirstPlace,
                      'second-place': row.isSecondPlace,
                      'third-place': row.isThirdPlace
                    }"
                  >{{ row.firstPlace }}</td>
                </tr>
              </template>
            </tbody>
          </table>

          <table class="rankings-table mobile-table">
            <thead>
              <tr>
                <th>{{ t('user.leaderboard.columns.metric') }}</th>
                <th>{{ t('user.leaderboard.columns.rank') }}</th>
                <th>{{ t('user.leaderboard.columns.count') }}</th>
                <th class="col-gap">{{ t('user.leaderboard.columns.gap') }}</th>
                <th class="col-first-place">{{ t('user.leaderboard.columns.firstPlace') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, index) in tableData" :key="'mobile-cat-' + index">
                <tr
                  v-if="row.isCategorySummary"
                  class="data-row category-summary"
                  :class="{
                    'first-place': row.isFirstPlace,
                    'second-place': row.isSecondPlace,
                    'third-place': row.isThirdPlace
                  }"
                >
                  <td class="metric-name">{{ row.categoryIcon }} {{ row.categoryName }}</td>
                  <td class="rank">
                    <span
                      class="rank-badge"
                      :class="{
                        gold: row.isFirstPlace,
                        silver: row.isSecondPlace,
                        bronze: row.isThirdPlace
                      }"
                    >
                      {{ getRankLabel(row.rank) }}
                    </span>
                  </td>
                  <td class="value">{{ row.value }}</td>
                  <td class="gap">{{ row.gap }}</td>
                  <td class="first-place-value">{{ row.firstPlace }}</td>
                </tr>
              </template>

              <template v-for="(row, index) in tableData" :key="'mobile-end-' + index">
                <tr
                  v-if="!row.isCategorySummary"
                  class="data-row"
                  :class="{
                    'first-place': row.isFirstPlace,
                    'second-place': row.isSecondPlace,
                    'third-place': row.isThirdPlace
                  }"
                >
                  <td class="metric-name">
                    {{ row.label }}
                    <HelpIcon
                      v-if="row.tooltip"
                      :content="row.tooltip"
                      size="sm"
                      fontSize="14px"
                      trigger="both"
                    />
                  </td>
                  <td class="rank">
                    <span
                      class="rank-badge"
                      :class="{
                        gold: row.isFirstPlace,
                        silver: row.isSecondPlace,
                        bronze: row.isThirdPlace
                      }"
                    >
                      {{ getRankLabel(row.rank) }}
                    </span>
                  </td>
                  <td class="value">{{ row.value }}</td>
                  <td class="gap">{{ row.gap }}</td>
                  <td class="first-place-value">{{ row.firstPlace }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div class="total-users">
        {{ t('user.leaderboard.totalUsers', { value: formatNumber(rankingsData.total_users) }) }}
      </div>
    </div>
  </div>
</template>

```scss

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$text-primary: var(--text-primary);
$text-secondary: var(--text-secondary);
$danger: var(--color-error-light);

$gold: var(--color-gold);
$gold-text: #d4af37;
$silver: var(--color-silver);
$bronze: var(--color-bronze);

@mixin glass($blur: 40px, $saturate: 180%) {
  backdrop-filter: blur($blur) saturate($saturate);
  -webkit-backdrop-filter: blur($blur) saturate($saturate);
}

@mixin gradient-text($from, $to) {
  color: $from;
  background: linear-gradient(135deg, $from, $to);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

@mixin rank-row-background($from, $to) {
  background: linear-gradient(
    90deg,
    rgba($from, 0.15),
    rgba($to, 0.08)
  );
}

.leaderboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.error-container {
  padding: 40px 20px;
  text-align: center;
}

.error-container {
  .err {
    margin-bottom: 20px;
    color: $danger;
  }
}

.retry-btn {
  padding: 10px 24px;
  background: $primary;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: $primary-dark;
    transform: translateY(-2px);
  }
}

.leaderboard-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  margin: 12px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.02em;

  @include gradient-text($primary, $primary-dark);
}

.top-metrics-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.metric {
  &-card {
    padding: 24px;
    background: var(--glass-70);
    @include glass;
    border: 0.5px solid var(--glass-80);
    border-radius: var(--radius-xl);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 8px 32px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px var(--glass-90);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-4px);
      box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.06),
        0 12px 40px rgba(0, 0, 0, 0.12);
    }

    &.first-place {
      background: linear-gradient(
        135deg,
        rgba(var(--color-gold-rgb), 0.15),
        rgba(var(--color-gold-rgb), 0.08)
      );
      border-left: 4px solid $gold;
    }

    &.second-place {
      background: linear-gradient(
        135deg,
        rgba(var(--color-silver-rgb), 0.15),
        rgba(224, 224, 224, 0.08)
      );
      border-left: 4px solid $silver;
    }

    &.third-place {
      background: linear-gradient(
        135deg,
        rgba(var(--color-bronze-rgb), 0.15),
        rgba(255, 160, 122, 0.08)
      );
      border-left: 4px solid $bronze;
    }
  }

  &-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  &-icon {
    font-size: 24px;
  }

  &-label {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    letter-spacing: -0.01em;
  }

  &-rank {
    font-size: 36px;
    font-weight: 700;

    @include gradient-text($primary, $primary-dark);

    &.gold {
      @include gradient-text($gold, #ffed4e);
    }

    &.silver {
      @include gradient-text($silver, var(--border-light-gray));

      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
    }

    &.bronze {
      @include gradient-text($bronze, #ffab73);
    }
  }

  &-value {
    font-size: 28px;
    font-weight: 600;
    color: $text-primary;
  }

  &-details {
    font-size: 14px;
    line-height: 1.6;
    color: $text-secondary;
  }

  &-gap {
    font-weight: 500;
    color: var(--color-warning);
  }

  &-first {
    color: $text-secondary;
  }

  &-name {
    font-weight: 500;
    letter-spacing: -0.01em;
  }
}

.table-wrapper {
  padding: 20px;
  background: var(--glass-70);
  @include glass;
  border: 0.5px solid var(--glass-80);
  border-radius: var(--radius-xl);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px var(--glass-90);
}

.table-container {
  overflow: hidden;
  background: var(--glass-50);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1px var(--glass-60);
}

.rankings-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(247, 247, 247, 0.95);
    @include glass(20px);
  }

  th {
    padding: 14px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    white-space: nowrap;
    text-align: left;
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: $text-secondary;
  }
}

.col-gap,
.col-first-place {
  padding: 6px 8px !important;
  font-size: 12px !important;
}

.category {
  &-column {
    width: 100px;
  }

  &-cell {
    padding: 12px 8px;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.12),
      rgba(var(--color-primary-rgb), 0.06)
    );
    border-right: 2px solid rgba(var(--color-primary-rgb), 0.3);
    vertical-align: middle;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: $primary;

    &.gold {
      background: linear-gradient(
        135deg,
        rgba(var(--color-gold-rgb), 0.18),
        rgba(var(--color-gold-rgb), 0.08)
      );
      border-right-color: rgba(var(--color-gold-rgb), 0.4);
      color: #b8860b;
    }

    &.silver {
      background: linear-gradient(
        135deg,
        rgba(var(--color-silver-rgb), 0.18),
        rgba(var(--color-silver-rgb), 0.08)
      );
      border-right-color: rgba(var(--color-silver-rgb), 0.4);
      color: #5a6c6e;
    }

    &.bronze {
      background: linear-gradient(
        135deg,
        rgba(var(--color-bronze-rgb), 0.18),
        rgba(var(--color-bronze-rgb), 0.08)
      );
      border-right-color: rgba(var(--color-bronze-rgb), 0.4);
      color: #8b5a2b;
    }
  }

  &-data {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.06),
      rgba(var(--color-primary-rgb), 0.03)
    );
    border-right: 1px solid rgba(var(--color-primary-rgb), 0.15);
    font-weight: 600;

    &.category-gold {
      background: linear-gradient(
        90deg,
        rgba(var(--color-gold-rgb), 0.12),
        rgba(var(--color-gold-rgb), 0.05)
      );
      border-right-color: rgba(var(--color-gold-rgb), 0.3);
    }

    &.category-silver {
      background: linear-gradient(
        90deg,
        rgba(var(--color-silver-rgb), 0.12),
        rgba(var(--color-silver-rgb), 0.05)
      );
      border-right-color: rgba(var(--color-silver-rgb), 0.3);
    }

    &.category-bronze {
      background: linear-gradient(
        90deg,
        rgba(var(--color-bronze-rgb), 0.12),
        rgba(var(--color-bronze-rgb), 0.05)
      );
      border-right-color: rgba(var(--color-bronze-rgb), 0.3);
    }
  }
}

.desktop-table {
  display: table;
}

.mobile-table {
  display: none;
}

.data-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: transparent;
  }

  td {
    padding: 12px;
    font-size: 15px;
    color: $text-primary;

    &.first-place {
      background: linear-gradient(
        90deg,
        rgba(var(--color-gold-rgb), 0.15),
        rgba(var(--color-gold-rgb), 0.08)
      );
    }

    &.second-place {
      background: linear-gradient(
        90deg,
        rgba(var(--color-silver-rgb), 0.15),
        rgba(224, 224, 224, 0.08)
      );
    }

    &.third-place {
      background: linear-gradient(
        90deg,
        rgba(var(--color-bronze-rgb), 0.15),
        rgba(255, 160, 122, 0.08)
      );
    }

    &.metric-name {
      &.first-place {
        border-left: 3px solid $gold;
      }

      &.second-place {
        border-left: 3px solid $silver;
      }

      &.third-place {
        border-left: 3px solid $bronze;
      }
    }
  }

  &.first-place {
    td {
      background: linear-gradient(
        90deg,
        rgba(var(--color-gold-rgb), 0.15),
        rgba(var(--color-gold-rgb), 0.08)
      );
    }

    .metric-name {
      border-left: 3px solid $gold;
    }
  }

  &.second-place {
    td {
      background: linear-gradient(
        90deg,
        rgba(var(--color-silver-rgb), 0.15),
        rgba(224, 224, 224, 0.08)
      );
    }

    .metric-name {
      border-left: 3px solid $silver;
    }
  }

  &.third-place {
    td {
      background: linear-gradient(
        90deg,
        rgba(var(--color-bronze-rgb), 0.15),
        rgba(255, 160, 122, 0.08)
      );
    }

    .metric-name {
      border-left: 3px solid $bronze;
    }
  }

  &.category-summary {
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.08),
      rgba(var(--color-primary-rgb), 0.04)
    );
    font-weight: 600;

    .metric-name {
      font-weight: 600;
      color: $primary;
    }

    &:hover {
      background: linear-gradient(
        90deg,
        rgba(var(--color-primary-rgb), 0.12),
        rgba(var(--color-primary-rgb), 0.06)
      );
    }

    &.first-place {
      background: linear-gradient(
        90deg,
        rgba(var(--color-gold-rgb), 0.18),
        rgba(var(--color-gold-rgb), 0.08)
      );

      .metric-name {
        color: #b8860b;
      }
    }

    &.second-place {
      background: linear-gradient(
        90deg,
        rgba(var(--color-silver-rgb), 0.18),
        rgba(var(--color-silver-rgb), 0.08)
      );

      .metric-name {
        color: #5a6c6e;
      }
    }

    &.third-place {
      background: linear-gradient(
        90deg,
        rgba(var(--color-bronze-rgb), 0.18),
        rgba(var(--color-bronze-rgb), 0.08)
      );

      .metric-name {
        color: #8b5a2b;
      }
    }
  }
}

.rank-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: $primary;

  &.gold {
    background: linear-gradient(
      135deg,
      rgba(var(--color-gold-rgb), 0.2),
      rgba(var(--color-gold-rgb), 0.15)
    );
    color: $gold-text;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(var(--color-gold-rgb), 0.3);
  }

  &.silver {
    background: linear-gradient(
      135deg,
      rgba(var(--color-silver-rgb), 0.2),
      rgba(220, 220, 220, 0.15)
    );
    color: #7f8c8d;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(var(--color-silver-rgb), 0.3);
  }

  &.bronze {
    background: linear-gradient(
      135deg,
      rgba(var(--color-bronze-rgb), 0.2),
      rgba(255, 160, 122, 0.15)
    );
    color: #a0522d;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(var(--color-bronze-rgb), 0.3);
  }
}

.value {
  font-weight: 600;
  color: $primary;
}

.gap,
.first-place-value {
  padding: 6px 8px !important;
  font-size: 13px !important;
  font-weight: 400;
  color: #aaa;
}

.total-users {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  font-size: 14px;
  color: $text-secondary;
}

@media (orientation: portrait) {
  .leaderboard-container {
    width: 100%;
    padding: 16px 12px;
    box-sizing: border-box;
    overflow-x: clip;
  }

  .leaderboard-content {
    width: 100%;
    @include flex-col;
    align-items: center;
  }

  .desktop-table {
    display: none;
  }

  .mobile-table {
    display: table;
  }

  .page-title {
    font-size: 20px;
  }

  .top-metrics-cards {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 24px;
    overflow-x: auto;
  }

  .metric {
    &-card {
      min-width: 100px;
      max-width: 48dvw;
      flex-shrink: 0;
      padding: 16px;
    }

    &-header {
      margin-bottom: 12px;
    }

    &-icon {
      font-size: 20px;
    }

    &-label {
      font-size: 15px;
    }

    &-rank {
      font-size: 28px;
    }

    &-value {
      font-size: 20px;
    }

    &-details {
      font-size: 12px;
    }

    &-name {
      font-size: 13px;
    }
  }

  .table-wrapper {
    width: 98dvw;
    min-width: 0;
    align-self: stretch;
    padding: 12px 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .table-container {
    width: 100%;
    padding: 0 12px;
    box-sizing: border-box;
    overflow-x: auto;
    border-radius: 0;
    box-shadow: none;
  }

  .rankings-table {
    min-width: 100px;

    th {
      padding: 10px 6px;
      font-size: 11px;
    }
  }

  .col-gap,
  .col-first-place {
    padding: 4px !important;
    font-size: 10px !important;
  }

  .data-row {
    td {
      padding: 10px 6px;
      white-space: nowrap;
      font-size: 14px;

      &.gap,
      &.first-place-value {
        padding: 4px !important;
        font-size: 12px !important;
      }
    }
  }

  .rank-badge {
    padding: 3px 8px;
    font-size: 12px;
  }

  .total-users {
    margin-top: 16px;
    padding-top: 12px;
    font-size: 12px;
  }
}

```
