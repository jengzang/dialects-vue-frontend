<template>
  <div class="result-page-container">
    <div class="header-row">
      <h1 class="tabs-title">{{ pageTitle }}</h1>
      <div v-if="currentTabRef === 'tab1'" class="dropdown-wrapper" style="flex:none;">
        <SimpleSelectDropdown
          v-model="selectedTab1Type"
          :options="toneTypeOptions"
          width="auto"
        />
      </div>
    </div>

    <div v-if="isLoading" class="glass-loader-container">
      <div class="glass-card">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <div class="timer-text">{{ timer }}s</div>
        <div class="loading-text">{{ $t('result.loading') }}</div>
        <div v-if="showLongWaitWarning" class="warning-msg" v-html="$t('result.longWaitWarning')"></div>
      </div>
    </div>

    <ResultList
        v-else-if="latestResults.length > 0 && ['tab2', 'tab3'].includes(currentTabRef)"
        :data="latestResults"
        :reading-source="currentTabRef === 'tab3' ? 'yinwei' : 'zhonggu'"
    />

    <template v-else-if="latestResults.length > 0 && ['tab1', 'tab4'].includes(currentTabRef)">
      <CharsAndTones
          :data="latestResults"
          :mode="currentTabRef"
          :tone_for_chars="tone_for_chars"
          :selected-tone-type="selectedTab1Type"
          :show-char-nav="isResultPageActive && currentTabRef === 'tab1' && !isLoading && latestResults.length > 0"
      />
    </template>

    <div v-else-if="!isLoading && latestResults.length === 0" class="empty-state">
      <p>{{ $t('result.noData') }}</p>
      <button class="go-query-btn" @click="goToQuery">
        {{ $t('result.goToQuery') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, watch} from 'vue';
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router';
import { useI18n } from 'vue-i18n'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js';
import { getCoordinates, searchChars, searchZhongGu, searchYinWei, searchTones } from '@/api'
import {globalPayload, mapStore, resultCache, userStore} from '@/main/store/store.js';
import { showInfo, hideMessage } from '@/utils/ui/message.js';
import ResultList from "@/main/components/result/ResultList.vue";
import CharsAndTones from "@/main/components/result/CharsAndTones.vue";
import SimpleSelectDropdown from "@/components/selector/SimpleSelectDropdown.vue";
import {generateTonesMergedData,generateCharsMergedData,func_mergeData,requestMapFitView} from "@/utils/map/MapData.js";
import { DEFAULT_CHARACTER_TABLE } from '@/main/config/index.js'

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const isResultPageActive = ref(true);

onActivated(() => {
  isResultPageActive.value = true;
});

onDeactivated(() => {
  isResultPageActive.value = false;
});

onBeforeRouteLeave((to, from, next) => {
  isResultPageActive.value = false;
  next();
});

const results = ref([]);
const latestResults = ref([]);
const tone_for_chars = ref([]);
const currentTabRef = ref('tab2');
const payload = ref(null);
let mergedData = [];
// ✅ 修复2：防止并发竞态（旧请求覆盖新请求）
let requestSeq = 0;

const isLoading = ref(false);
const timer = ref('0.0');
const showLongWaitWarning = ref(false);
let timerInterval = null;

const tabMap = computed(() => ({
  'tab1': t('result.tabs.tab1'),
  'tab2': t('result.tabs.tab2'),
  'tab3': t('result.tabs.tab3'),
  'tab4': t('result.tabs.tab4')
}));

const pageTitle = computed(() => {
  const p = globalPayload.value;
  if (!p) return t('result.pleaseQuery');
  const sourceTab = p._sourceTab || 'tab2';
  const tabName = tabMap.value[sourceTab] || sourceTab;
  let featureText = '';
  if (p.features && Array.isArray(p.features) && p.features.length > 0) {
    featureText = p.features.join(' ');
  }
  return featureText ? `${tabName}·${featureText}` : tabName;
});

const startTimer = () => {
  isLoading.value = true;
  showLongWaitWarning.value = false;
  let startTime = Date.now();
  timer.value = '0.0';
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timer.value = elapsed.toFixed(1);
    if (elapsed > 30 && !showLongWaitWarning.value) {
      showLongWaitWarning.value = true;
    }
  }, 100);
};

const stopTimer = () => {
  isLoading.value = false;
  if (timerInterval) clearInterval(timerInterval);
};

onUnmounted(() => {
  // ✅ 卸载时让当前请求失效，防止卸载后仍写入 store
  requestSeq++;
  if (timerInterval) clearInterval(timerInterval);
});

watch(
    () => globalPayload.value,
    async (newPayload) => {
      // ✅ 每次触发生成一个序号，只有最新序号允许落库
      const seq = ++requestSeq;

      // console.log("🚀 ResultPage 檢測到數據變化:", newPayload);
      if (!newPayload) return;

      results.value = [];
      latestResults.value = [];
      payload.value = newPayload;
      // console.log("payload:",payload.value)
      const sourceTab = newPayload._sourceTab || 'tab2';
      const tableName = newPayload.table_name || DEFAULT_CHARACTER_TABLE
      currentTabRef.value = sourceTab;
      resultCache.tableName = tableName

      startTimer();

      try {
        mapStore.mode = 'feature';
        // ================= 获取 MapData（放入 try 内，避免失败不 stopTimer）=================
        const MapData = await getCoordinates({
          locations: newPayload.locations || "",
          regions: newPayload.regions || "",
          region_mode: newPayload.region_mode || 'yindian',
          iscustom: userStore.isAuthenticated && userStore.role !== 'anonymous' ? "true" : undefined,
          flag: "False"
        })
        // console.log(MapData)

        // ✅ 竞态保护：MapData 回来时如果不是最新请求，直接退出
        if (seq !== requestSeq) return;

        // ✅ MapData 基本校验，避免后续工具函数/渲染链路崩
        if (!MapData || !MapData.coordinates_locations) {
          console.warn("⚠️ MapData invalid:", MapData);
          return;
        }

        // ================= TAB 1: 查字 =================
        if (sourceTab === 'tab1') {
          resultCache.mode = '';
          resultCache.features = ['漢字'];

          const queryParams = {
            chars: [],
            locations: newPayload.locations || "",
            regions: Array.isArray(newPayload.regions) ? newPayload.regions : (newPayload.regions || ""),
            region_mode: newPayload.region_mode || 'yindian',
            response_mode: 'compact',
            include_custom: userStore.isAuthenticated && userStore.role !== 'anonymous'
          }

          let rawChars = newPayload.chars;
          if (rawChars) {
            if (typeof rawChars === 'string') rawChars = rawChars.split('');
            if (Array.isArray(rawChars)) queryParams.chars = rawChars;
          }

          const response = await searchChars(queryParams)

          if (seq !== requestSeq) return;

          if (response && response.result) {
            latestResults.value = response.result;

            mergedData = generateCharsMergedData(latestResults.value, MapData, response.custom_data || []);
            if (seq !== requestSeq) return;

            mapStore.mapData = MapData;
            mapStore.mergedData = mergedData;
            if (response && response.tones_result) {
              tone_for_chars.value = response.tones_result;
            }
          } else {
            console.warn("Tab1 Error:", response);
          }
        }

        // ================= TAB 2: 查中古 =================
        else if (sourceTab === 'tab2') {
          const featuresList = Array.isArray(newPayload.features) ? newPayload.features : [];
          resultCache.mode = '查中古';
          resultCache.features = featuresList;

          const response = await searchZhongGu({
            ...payload.value,
            exclude_columns: payload.value.exclude_columns || [],
            table_name: tableName,
            include_custom: userStore.isAuthenticated && userStore.role !== 'anonymous'
          })

          if (seq !== requestSeq) return;

          if (response.success || response.status === 'success') {
            results.value = response.results || response.data;
            latestResults.value = Array.isArray(results.value) ? results.value.flat() : [];
            resultCache.latestResults = latestResults.value

            // ✅ 修复：func_mergeData 是 async，必须 await
            mergedData = await func_mergeData(latestResults.value, MapData, response.custom_data || []);
            // console.log(mergedData)
            if (seq !== requestSeq) return;

            mapStore.mapData = MapData;
            mapStore.mergedData = mergedData;
            mapStore.mode = 'feature';
            requestMapFitView();
          } else {
            console.warn("⚠️ API 返回错误:", response.message);
          }
        }

        // ================= TAB 3: 查音位 =================
        else if (sourceTab === 'tab3') {
          const featuresList = Array.isArray(newPayload.features) ? newPayload.features : [];
          resultCache.mode = '查音位';
          resultCache.features = featuresList;

          const response = await searchYinWei({
            ...payload.value,
            exclude_columns: payload.value.exclude_columns || [],
            table_name: tableName,
            include_custom: userStore.isAuthenticated && userStore.role !== 'anonymous'
          })

          if (seq !== requestSeq) return;

          if (response.success) {
            results.value = response.results || response.data;
            latestResults.value = Array.isArray(results.value) ? results.value.flat() : [];
            resultCache.latestResults = latestResults.value

            // ✅ 修复：func_mergeData 是 async，必须 await
            mergedData = await func_mergeData(latestResults.value, MapData, response.custom_data || []);
            if (seq !== requestSeq) return;

            mapStore.mapData = MapData;
            mapStore.mergedData = mergedData;
            requestMapFitView();
          } else {
            console.warn("⚠️ API returned empty or error:", response.error);
          }
        }

        // ================= TAB 4: 查調 =================
        else if (sourceTab === 'tab4') {
          resultCache.mode = '';
          resultCache.features = ['調值'];
          const response = await searchTones({
            locations: newPayload.locations || "",
            regions: Array.isArray(newPayload.regions) ? newPayload.regions : (newPayload.regions || ""),
            region_mode: newPayload.region_mode || 'yindian',
            include_custom: userStore.isAuthenticated && userStore.role !== 'anonymous'
          })

          if (seq !== requestSeq) return;

          if (response && response.tones_result) {
            latestResults.value = response.tones_result;

            mergedData = generateTonesMergedData(response.tones_result, MapData, response.custom_data || []);
            if (seq !== requestSeq) return;

            mapStore.mapData = MapData;
            mapStore.mergedData = mergedData;
            requestMapFitView();
          } else {
            console.warn("Tab4 Error:", response);
          }
        }

      } catch (error) {
        console.error("❌ 請求失敗:", error);
      } finally {
        stopTimer();

        // ✅ finally 里拷贝加保护，避免这里再抛错
        try {
          resultCache.latestResults = (typeof structuredClone === 'function')
              ? structuredClone(latestResults.value)
              : JSON.parse(JSON.stringify(latestResults.value));
        } catch (e) {
          resultCache.latestResults = latestResults.value;
        }

        if (mapStore.mergedData && mapStore.mergedData.length > 0) {
          showInfo(t('result.mapDataReady'), 5000, {
            actionText: t('result.viewMap'),
            onAction: () => {
              router.push(buildLocalePath(resolveRouteLocale(route), '/menu/map/view'))
            }
          })
        }
      }
    },
    { immediate: true }
);

// 离开 ResultPage 时自动关闭 toast
watch(
  () => route.path,
  (newPath) => {
    if (!newPath.includes('/menu/result')) {
      hideMessage()
    }
  }
);

const goToQuery = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/query/zhonggu'));
};

// ================= ✨ Tab1 Dropdown 邏輯 (使用 SimpleSelectDropdown) =================
const selectedTab1Type = ref('默認'); // Keep internal value as Chinese for API compatibility

const toneTypeOptions = computed(() => [
  { label: t('result.toneType.default'), value: '默認' },
  { label: t('result.toneType.value'), value: '調值' },
  { label: t('result.toneType.category'), value: '調類' }
]);

</script>

<script>
export default {
  name: 'ResultPage'
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-blue: var(--color-primary);
$primary-blue-hover: var(--color-primary-hover);
$apple-red: var(--color-error-light);

$text-primary: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-muted: var(--text-lightest);
$white: var(--text-white);

$transition-fast: 0.2s;
.result-page-container {
  position: relative;
  @include flex-col;
  width: 100%;
  min-height: 200px;
}

.header-row {
  @include flex-center;

  flex-flow: row wrap;
  gap: 10px;
}

/* 液态玻璃加载器 */
.glass-loader-container {
  @include flex-center;

  padding: 40px 0;
}

.glass-card {
  @include flex-col;
  align-items: center;
  width: 280px;
  padding: 30px;
  text-align: center;
  background: var(--glass-30);
  border: 1px solid var(--glass-20);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: float 3s ease-in-out infinite;
}

.timer-text {
  margin-bottom: 5px;
  color: $text-primary;
  font-family: var(--font-sans);
  font-size: 2em;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
}

.loading-text {
  color: $text-secondary;
  font-size: 0.9em;
  font-weight: 500;
}

.warning-msg {
  padding: 10px;
  margin-top: 15px;
  color: $apple-red;
  font-size: 0.85em;
  line-height: 1.4;
  background: rgba(var(--color-error-light-rgb), 0.1);
  border-radius: var(--radius-md);
  animation: fadeIn 0.5s ease-out;
}

.empty-state {
  @include flex-col;
  gap: 15px;
  align-items: center;
  padding: 40px;
  color: $text-muted;
  font-size: 16px;
  text-align: center;
}

.go-query-btn {
  padding: 10px 24px;
  color: $white;
  font-size: 15px;
  cursor: pointer;
  background-color: $primary-blue;
  border: none;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 6px rgba(var(--color-primary-rgb), 0.2);
  transition: all $transition-fast ease;

  &:hover {
    background-color: $primary-blue-hover;
    box-shadow: 0 6px 8px rgba(var(--color-primary-rgb), 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }
}

/* SimpleSelectDropdown 外层 */
.dropdown-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

/*
 * 当前模板中未直接使用。
 * 保留原有通用下拉触发器样式。
 */
.dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 80px;
  padding: 6px 12px;
  margin: auto;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  background: var(--glass-30);
  border: 1px solid rgba(var(--color-silver-rgb), 0.5);
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all $transition-fast;

  &:hover {
    background: var(--glass-60);
    border-color: var(--color-primary);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
