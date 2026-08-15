<template>
  <div class="phonology-matrix-page">
    <!-- <div class="page-header">
      <h2 class="page-title"><InlineIcon icon="🔍️" />音系查詢</h2>
    </div> -->

    <!-- 地点输入组件 -->
    <div class="input-section">
      <LocationMultiInput
        v-model="queryStrings"
        :max-locations="PHONOLOGY_LOCATION_LIMITS.matrix"
        @update:matchedLocations="handleMatchedLocations"
        @update:isMatching="handleIsMatching"
      />
      <button
        class="action-btn"
        @click="loadData"
        :disabled="matchedLocations.length === 0 || loading || isMatching"
      >
        <span v-if="isMatching" class="ui-loading--inline" aria-hidden="true">↻</span>
        <span v-else-if="loading">{{ $t('phonology.phonology.matrix.actions.loading') }}</span>
        <span v-else>{{ $t('phonology.phonology.matrix.actions.query') }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ $t('phonology.phonology.matrix.actions.loading') }}</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">{{ $t('phonology.phonology.matrix.actions.retry') }}</button>
    </div>

    <div v-else-if="matrixData" class="matrix-container">
      <template v-for="location in displayLocations" :key="location">
        <PhonologyMatrix
          :location="location"
          :initials="matrixData[location].initials"
          :finals="matrixData[location].finals"
          :tones="matrixData[location].tones"
          :matrix="matrixData[location].matrix"
          :cell-detail-enabled="true"
          :cell-details="matrixData[location].cellDetails"
        />
        <HomophoneLexicon
          :location="location"
          :data="matrixData[location]"
          show-copy
        />
      </template>
    </div>

    <div v-else class="empty">
      <p>{{ $t('phonology.phonology.matrix.states.emptyInput') }}</p>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPhonologyMatrix } from '@/api'
import PhonologyMatrix from '@/main/components/TableAndTree/PhonologyTable.vue'
import HomophoneLexicon from '@/main/components/pho/HomophoneLexicon.vue'
import LocationMultiInput from '@/main/components/geo/LocationMultiInput.vue'
import { transformMatrixReadStats } from '@/main/utils/phonology/readingStats.js'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'
import {
  encodeQueryValueBase64Url,
  parseLocationsFromUrl
} from '@/utils/urlParams.js'

const { t } = useI18n()

const loadMatrixTask = useAsyncTask()
const loading = loadMatrixTask.loading
const error = ref(null)
const matrixData = ref(null)

// 从 URL 初始化地点
const parseMatrixLocationQuery = (value) => {
  return parseLocationsFromUrl(
    {
      query: {
        loc: value
      }
    },
    {
      limit: PHONOLOGY_LOCATION_LIMITS.matrix
    }
  )
}

const serializeMatrixLocationQuery = (locations) => {
  if (!Array.isArray(locations)) return []

  return locations
    .filter(Boolean)
    .slice(0, PHONOLOGY_LOCATION_LIMITS.matrix)
    .map((location) => encodeQueryValueBase64Url(location))
}

const { state: locationQuery, set: setLocationQuery } = useRouteQueryState('loc', {
  defaultValue: [],
  parse: parseMatrixLocationQuery,
  serialize: serializeMatrixLocationQuery,
  replace: true,
  removeIf: (locations) => !Array.isArray(locations) || locations.length === 0,
})

const queryStrings = ref([...locationQuery.value])

const matchedLocations = ref([])
const isMatching = ref(false) // 添加匹配状态

const displayLocations = computed(() => {
  if (!matrixData.value) return []
  return Object.keys(matrixData.value)
})

// 处理匹配到的地点列表
const handleMatchedLocations = (locations) => {
  matchedLocations.value = Array.isArray(locations)
    ? locations.slice(0, PHONOLOGY_LOCATION_LIMITS.matrix)
    : []
}

// 处理匹配状态
const handleIsMatching = (matching) => {
  isMatching.value = matching
}

const loadData = async () => {
  if (matchedLocations.value.length === 0) {
    error.value = t('phonology.phonology.matrix.states.minLocationError')
    return
  }

  error.value = null

  await loadMatrixTask.run(async () => {
    const requestBody = {
      locations: matchedLocations.value.slice(0, PHONOLOGY_LOCATION_LIMITS.matrix)
    }

    const result = await getPhonologyMatrix(requestBody)

    matrixData.value = Object.fromEntries(
      Object.entries(result.data || {}).map(([location, payload]) => [
        location,
        {
          ...payload,
          cellDetails: transformMatrixReadStats(payload.matrix_read_stats)
        }
      ])
    )

    // 更新 URL
    await setLocationQuery(matchedLocations.value.slice(0, PHONOLOGY_LOCATION_LIMITS.matrix))
  }, {
    onError: (err) => {
      console.error('加載音韻矩陣失敗:', err)
      error.value = err.message || t('phonology.phonology.matrix.states.loadError')
    }
  })
}

// URL 中的 loc 已是规范地点名（loadData 写入的是 matchedLocations），
// 直接用它初始化 matchedLocations 并自动查询，不再依赖 LocationMultiInput 的异步匹配
const runUrlAutoQuery = () => {
  const urlLocations = Array.isArray(locationQuery.value)
    ? locationQuery.value.slice(0, PHONOLOGY_LOCATION_LIMITS.matrix)
    : []

  if (urlLocations.length === 0) return

  matchedLocations.value = [...urlLocations]
  loadData()
}

// 页面加载时自动查询
onMounted(() => {
  runUrlAutoQuery()
})

// 处理浏览器前进/后退 + 跨页跳转（含 KeepAlive 重新激活时 URL 变化）
watch(locationQuery, (urlLocations) => {
  const limitedUrlLocations = Array.isArray(urlLocations)
    ? urlLocations.slice(0, PHONOLOGY_LOCATION_LIMITS.matrix)
    : []

  // 只有当 URL 的地点和当前匹配的地点不同时，才需要清空数据并重新查询
  // 这样可以避免在查询成功更新 URL 后误清空数据
  if (JSON.stringify(limitedUrlLocations) === JSON.stringify(matchedLocations.value)) {
    return
  }

  queryStrings.value = [...limitedUrlLocations]
  matrixData.value = null
  error.value = null

  if (limitedUrlLocations.length > 0) {
    matchedLocations.value = [...limitedUrlLocations]
    loadData()
  }
})
</script>

<style lang="scss" scoped>
.phonology-matrix-page {
  width: 90dvw;
  margin-top: 20px;

  /* 输入区域 */
  .input-section {
    max-width: 600px;
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin: 0 auto 30px;
  }

  /* 加载与错误状态 */
  .loading,
  .error {
    min-height: 50vh;
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 15px;
  }

  .loading {
    p {
      color: var(--text-secondary);
      font-size: 15px;
    }
  }

  .error {
    p {
      color: var(--color-error);
      font-size: 16px;
      font-weight: 500;
    }
  }

  .retry-btn {
    padding: 10px 20px;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    color: var(--text-white);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }

  /* 矩阵结果 */
  .matrix-container {
    @include flex-col;
    gap: 30px;
    padding: 32px;

    @media (max-aspect-ratio: 1/1) {
      padding: 16px;
    }

  }

  /* 空状态 */
  .empty {
    min-height: 30dvh;
    @include flex-center;
    color: var(--text-secondary);
    font-size: 16px;
  }

  /* 竖屏 */
  @media (max-aspect-ratio: 1/1) {
    .input-section {
      max-width: 100%;
    }

    .action-btn {
      --action-btn-padding: 10px 20px;
      --action-btn-font-size: 14px;
    }
  }
}
</style>