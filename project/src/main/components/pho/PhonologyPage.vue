<template>
  <div class="phonology-matrix-page">
    <!-- <div class="page-header">
      <h2 class="page-title">🔍️ 音系查詢</h2>
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
        class="load-btn"
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
      <PhonologyMatrix
        v-for="location in displayLocations"
        :key="location"
        :location="location"
        :initials="matrixData[location].initials"
        :finals="matrixData[location].finals"
        :tones="matrixData[location].tones"
        :matrix="matrixData[location].matrix"
        :cell-detail-enabled="true"
        :cell-details="matrixData[location].cellDetails"
      />
    </div>

    <div v-else class="empty">
      <p>{{ $t('phonology.phonology.matrix.states.emptyInput') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPhonologyMatrix } from '@/api'
import PhonologyMatrix from '@/main/components/TableAndTree/PhonologyTable.vue'
import LocationMultiInput from '@/main/components/geo/LocationMultiInput.vue'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'

const { t } = useI18n()

const loadMatrixTask = useAsyncTask()
const loading = loadMatrixTask.loading
const error = ref(null)
const matrixData = ref(null)

// 从 URL 初始化地点
function parseLocationQuery(value) {
  const locations = Array.isArray(value) ? value : [value]
  return locations.filter(Boolean).map((location) => {
    try {
      return decodeURIComponent(location)
    } catch {
      return location
    }
  })
}

const { state: locationQuery, set: setLocationQuery } = useRouteQueryState('loc', {
  defaultValue: [],
  parse: parseLocationQuery,
  serialize: (locations) => locations.map((location) => encodeURIComponent(location)),
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

const transformMatrixReadStats = (matrixReadStats = {}) => {
  const transformedCellDetails = {}

  Object.entries(matrixReadStats || {}).forEach(([initial, finalMap]) => {
    transformedCellDetails[initial] = {}

    Object.entries(finalMap || {}).forEach(([final, toneMap]) => {
      transformedCellDetails[initial][final] = {}

      Object.entries(toneMap || {}).forEach(([tone, readStats]) => {
        const polyphonicDetails = readStats?.polyphonic?.details || {}

        const items = [
          ['polyphonic', '多音字'],
          ['wendu', '文讀'],
          ['baidu', '白讀'],
          ['wenbai', '文白讀']
        ]
          .map(([key, label]) => {
            const bucket = readStats?.[key]
            const item = {
              label,
              count: Number(bucket?.count || 0),
              chars: Array.isArray(bucket?.chars) ? bucket.chars : []
            }

            if (key === 'polyphonic') {
              const detailEntries = Object.entries(polyphonicDetails).map(([char, values]) => ({
                char,
                values: Array.isArray(values) ? values : []
              }))

              if (detailEntries.length > 0) {
                item.details = detailEntries
              }
            }

            return item
          })
          .filter((item) => item.count > 0 || item.chars.length > 0 || item.details?.length > 0)

        if (items.length > 0) {
          transformedCellDetails[initial][final][tone] = items
        }
      })
    })
  })

  return transformedCellDetails
}

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
    error.value = t('phonology.phonology.matrix.states.minLocationError')
    return
  }

  error.value = null

  await loadMatrixTask.run(async () => {
    const requestBody = {
      locations: matchedLocations.value
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
    await setLocationQuery(matchedLocations.value)
  }, {
    onError: (err) => {
      console.error('加載音韻矩陣失敗:', err)
      error.value = err.message || t('phonology.phonology.matrix.states.loadError')
    }
  })
}

// 页面加载时自动查询
onMounted(() => {
  if (locationQuery.value.length > 0) {
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
watch(locationQuery, (urlLocations) => {

  // 只有当 URL 的地点和当前匹配的地点不同时，才需要清空数据
  // 这样可以避免在查询成功更新 URL 后误清空数据
  if (JSON.stringify(urlLocations) !== JSON.stringify(matchedLocations.value)) {
    queryStrings.value = [...urlLocations]
    matrixData.value = null
    error.value = null
  }
})
</script>

<style lang="scss" scoped>
.phonology-matrix-page {
  margin-top: 20px;
  width: 90dvw;

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

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-hover) 0%, #004ba0 100%);
      box-shadow: 0 6px 16px var(--color-primary-shadow-light), 0 3px 6px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: var(--bg-hover-medium);
      color: var(--text-secondary);
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  /* 按钮内的小旋转器 */

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
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
    color: var(--text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-md);

    &:hover {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
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
    min-height: 30dvh;
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
}
</style>
