<template>
  <div class="custom-tab-container">
    <div 
      class="page-content-stack"
      style="width: 98dvw;"
    >
      <!-- Header Area -->
      <div class="page-footer">
        <h3 style="margin: 0">
          {{ t('map.customTab.title') }}
        </h3>

        <div class="header-actions">
          <button
            type="button"
            class="help-icon-head"
            :title="t('map.customTab.buttons.help')"
            :aria-label="t('map.customTab.buttons.help')"
            @click="openHelpModal"
          >
            {{ t('map.customTab.buttons.help') }}
          </button>
        </div>
      </div>

      <!-- Login Warning if not authenticated -->
      <div
        v-if="!userStore.isAuthenticated"
        class="auth-warning-container"
      >
        <div class="auth-warning-card">
          <div class="auth-warning-icon">
            🔒
          </div>

          <p class="auth-warning-text">
            {{ t('map.customTab.validation.loginFirst') || '请先登录以查看 and 管理您的个人语料特征数据' }}
          </p>

          <button
            class="enter-btn"
            @click="handleLogin"
          >
            {{ t('map.customTab.labels.login') }}
          </button>
        </div>
      </div>

      <!-- Main Tree and Search Interface if authenticated -->
      <div
        v-else
        class="interactive-search-layout"
      >
        <!-- Data status + add button -->
        <div class="custom-toolbar">
          <span
            class="data-summary-badge"
            :class="dataSummaryClass"
          >
            {{ dataSummaryText }}
          </span>

          <button
            class="action-btn add-entry-btn-sm toolbar-add-entry-btn"
            @click="openEntryModal"
          >
            {{ t('map.customTab.buttons.addData') }}
          </button>
        </div>
        <div
          class="floating-search"
          :class="{ active: showFloatingSearchInput }"
        >
          <button
            class="floating-search-toggle"
            type="button"
            :aria-label="t('map.customTab.labels.featureSearch') || '过滤特征'"
            @click="openSearch"
          >
            🔍
          </button>

          <input
            v-if="showFloatingSearchInput"
            id="featureSearch"
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="t('map.customTab.placeholders.featureSearch') || '输入特征或分类进行过滤...'"
            class="floating-search-input"
            @keydown.esc="closeSearch"
          >

          <button
            v-if="showFloatingSearchInput"
            class="floating-search-clear"
            type="button"
            :aria-label="t('common.button.close')"
            @click="closeSearch"
          >
            ×
          </button>
        </div>

        <!-- Tree panel with floating search -->
        <div
          class="tree-panel"
          :class="{ 'search-open': showFloatingSearchInput }"
        >
          <!-- Collapsible Tree Selector -->
          <div class="tree-selector-container">
            <div
              v-if="loadingFeatures"
              class="loading-state-base"
            >
              <div class="ui-loading--page" aria-hidden="true"></div>
              <p>{{ t('customEntry.featureDetail.loading') || '加载特征列表中...' }}</p>
            </div>

            <div
              v-else-if="userFeatures.length === 0"
              class="tree-empty-state"
            >
              <div class="empty-state-icon">
                📂
              </div>

              <p class="empty-state-title">
                {{ t('customEntry.featureList.emptyTitle') || '暂无个人特征数据' }}
              </p>

              <p class="empty-state-text">
                {{ t('customEntry.featureList.emptyText') || '点击右上角“录入数据”开始记录吧！' }}
              </p>

              <button
                class="action-btn primary-btn inline-btn"
                @click="openEntryModal"
              >
                {{ t('map.customTab.buttons.addData') }}
              </button>
            </div>

            <div
              v-else-if="groupedFeatures.length === 0"
              class="tree-empty-state"
            >
              <p class="empty-state-text">
                {{ t('map.customTab.messages.noMatch') || '没有找到匹配的特征' }}
              </p>
            </div>

            <div
              v-else
              class="tree-categories-list"
            >
              <div
                v-for="group in groupedFeatures"
                :key="group.category"
                class="tree-category-node"
                :class="{ collapsed: !expandedCategories[group.category] }"
              >
                <button
                  class="category-header-btn"
                  type="button"
                  @click="toggleCategory(group.category)"
                >
                  <span class="arrow-indicator">▶</span>
                  <span class="category-name">{{ group.category }}</span>
                  <span class="category-count-badge">{{ group.features.length }}</span>
                </button>

                <div
                  v-show="expandedCategories[group.category]"
                  class="category-children-container"
                >
                  <button
                    v-for="item in group.features"
                    :key="item.feature_key || `${item['特徵']}-${item['聲韻調']}`"
                    class="feature-leaf-node"
                    type="button"
                    @click="selectFeatureItem(item)"
                  >
                    <span class="feature-name">{{ item['特徵'] || item.feature }}</span>
                    <span class="feature-count-badge">
                      {{ t('customEntry.featureList.pointCount', { count: item.location_count || 0 }) }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Management Links -->
        <div class="management-footer">
          <button
            class="flat-link-btn"
            type="button"
            @click="goToDataManager"
          >
            ⚙️ {{ t('map.customTab.helpModal.sections.customCollection.items.manage.label') || '管理我的所有自定义数据' }}
          </button>
        </div>
      </div>
    </div>

    <CustomDataEntryModal v-model="isEntryModalOpen" />

    <FeatureScopeSelectionModal
      v-model="isFeatureScopeModalOpen"
      :feature-meta="selectedFeatureMeta"
      :regions="availableRegions"
      :locations="availableLocations"
      :loading="loadingFeatureRows"
      :error-message="featureRowsError"
      @confirm="confirmFeatureScopeSelection"
    />

    <CustomTabHelpModal v-model="isHelpModalOpen" />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthGuard } from '@/composables/router/useAuthGuard.js';
import CustomDataEntryModal from '@/main/components/map/custom/CustomDataEntryModal.vue';
import CustomTabHelpModal from '@/main/components/map/popups/CustomTabHelpModal.vue';
import { getUserFeatures, getDataByFeature } from '@/api';
import { ensureCustomDataPresence } from '@/composables/custom/useCustomDataPresence.js';
import {
  userStore,
  mapStore,
  resultCache,
} from '@/main/store/store.js';
import { showSuccess, showWarning, showError } from '@/utils/message.js';
import FeatureScopeSelectionModal from '@/main/components/map/custom/feature/FeatureScopeSelectionModal.vue';
import { addCustomFeatureDataWithoutApi } from '@/utils/map/MapData.js';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { requireAuth } = useAuthGuard();

const isHelpModalOpen = ref(false);
const isEntryModalOpen = ref(false);
const isSearchOpen = ref(false);
const searchInputRef = ref(null);
const isFeatureScopeModalOpen = ref(false);
const loadingFeatureRows = ref(false);
const featureRowsError = ref('');
const currentFeatureRows = ref([]);
const selectedFeatureMeta = ref(null);
const availableRegions = ref([]);
const availableLocations = ref([]);

const searchQuery = ref('');
const userFeatures = ref([]);
const loadingFeatures = ref(false);
const expandedCategories = ref({});

const uncategorizedLabel = computed(() => t('map.customTab.labels.uncategorized'));

const userFeatureCount = computed(() => userFeatures.value.length);

const userDataCount = computed(() => {
  return userFeatures.value.reduce((sum, item) => {
    return sum + Number(item.location_count || 0);
  }, 0);
});

const dataSummaryText = computed(() => {
  return t('map.customTab.badges.dataAndFeatureCount', {
    dataCount: userDataCount.value,
    featureCount: userFeatureCount.value,
  });
});

const dataSummaryClass = computed(() => {
  return userDataCount.value === 0 && userFeatureCount.value === 0
    ? 'hint'
    : 'success';
});

const showFloatingSearchInput = computed(() => {
  return isSearchOpen.value || searchQuery.value.trim().length > 0;
});

const filteredFeatures = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) {
    return userFeatures.value;
  }

  return userFeatures.value.filter((item) => {
    const fName = String(item['特徵'] || item.feature || '').toLowerCase();
    const cat = String(item['聲韻調'] || item.phonology || '').toLowerCase();

    return fName.includes(query) || cat.includes(query);
  });
});

const groupedFeatures = computed(() => {
  const groupMap = new Map();

  filteredFeatures.value.forEach((item) => {
    const rawCategory = item['聲韻調'] || item.phonology || '';
    const category = rawCategory || uncategorizedLabel.value;

    if (!groupMap.has(category)) {
      groupMap.set(category, {
        category,
        rawCategory,
        features: [],
      });
    }

    groupMap.get(category).features.push(item);
  });

  const getSortPriority = (value) => {
    const text = String(value || '').trim();

    // 空值，即“未分类”
    if (!text) return 5;

    if (text.includes('聲母')) return 1;
    if (text.includes('韻母')) return 2;
    if (text.includes('聲調') || text.includes('調值')) return 3;

    // 普通汉字
    if (/^[\u3400-\u9fff]/.test(text)) return 4;

    // 字母
    if (/^[A-Za-z]/.test(text)) return 6;

    // 数字
    if (/^\d/.test(text)) return 7;

    return 8;
  };

  const compareByCustomOrder = (a, b) => {
    const textA = String(a || '').trim();
    const textB = String(b || '').trim();

    const priorityA = getSortPriority(textA);
    const priorityB = getSortPriority(textB);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return textA.localeCompare(textB, 'zh-CN-u-co-pinyin', {
      numeric: true,
      sensitivity: 'base',
    });
  };

  return Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      features: [...group.features].sort((a, b) => {
        const nameA = a['特徵'] || a.feature || '';
        const nameB = b['特徵'] || b.feature || '';

        return compareByCustomOrder(nameA, nameB);
      }),
    }))
    .sort((a, b) => compareByCustomOrder(a.rawCategory, b.rawCategory));
});

const openSearch = async () => {
  isSearchOpen.value = true;

  await nextTick();

  searchInputRef.value?.focus();
};

const closeSearch = () => {
  searchQuery.value = '';
  isSearchOpen.value = false;
};

const toggleCategory = (category) => {
  expandedCategories.value[category] = !expandedCategories.value[category];
};

const buildFeatureSelectionOptions = (rows) => {
  const regionMap = new Map();
  const locationMap = new Map();

  rows.forEach((row) => {
    const locationName = String(row['簡稱'] || '').trim();
    const regionName = String(row['音典分區'] || '').trim();

    if (locationName) {
      if (!locationMap.has(locationName)) {
        locationMap.set(locationName, {
          name: locationName,
          recordCount: 0,
          regionNames: new Set(),
        });
      }

      const locationEntry = locationMap.get(locationName);
      locationEntry.recordCount += 1;
      if (regionName) {
        locationEntry.regionNames.add(regionName);
      }
    }

    if (regionName) {
      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, {
          name: regionName,
          rows: [],
          locations: new Set(),
          recordCount: 0,
        });
      }

      const regionEntry = regionMap.get(regionName);
      regionEntry.rows.push(row);
      regionEntry.recordCount += 1;
      if (locationName) {
        regionEntry.locations.add(locationName);
      }
    }
  });

  availableRegions.value = Array.from(regionMap.values()).map((item) => ({
    name: item.name,
    rows: item.rows,
    locationCount: item.locations.size,
    recordCount: item.recordCount,
  }));

  availableLocations.value = Array.from(locationMap.values()).map((item) => ({
    name: item.name,
    recordCount: item.recordCount,
    regionNames: Array.from(item.regionNames),
  }));
};

const resetFeatureScopeState = () => {
  currentFeatureRows.value = [];
  availableRegions.value = [];
  availableLocations.value = [];
  selectedFeatureMeta.value = null;
  featureRowsError.value = '';
  loadingFeatureRows.value = false;
  isFeatureScopeModalOpen.value = false;
};

const selectFeatureItem = async (item) => {
  const featureName = item['特徵'] || item.feature || '';
  const phonology = item['聲韻調'] || item.phonology || '';

  if (!featureName) {
    return;
  }

  const hasCustomData = await ensureCustomDataPresence();
  if (!hasCustomData) {
    userFeatures.value = [];
    resetFeatureScopeState();
    return;
  }

  loadingFeatureRows.value = true;
  featureRowsError.value = '';
  currentFeatureRows.value = [];
  availableRegions.value = [];
  availableLocations.value = [];
  selectedFeatureMeta.value = {
    feature: featureName,
    phonology,
    recordCount: 0,
    locationCount: 0,
    regionCount: 0,
  };
  isFeatureScopeModalOpen.value = true;

  try {
    const response = await getDataByFeature(featureName, phonology);

    if (!response || response.success !== true) {
      throw new Error(response?.message || t('map.customTab.scopeModal.loadFailed'));
    }

    const rows = Array.isArray(response.data) ? response.data : [];

    if (rows.length === 0) {
      throw new Error(t('map.customTab.scopeModal.emptyRows'));
    }

    currentFeatureRows.value = rows;
    buildFeatureSelectionOptions(rows);

    selectedFeatureMeta.value = {
      feature: featureName,
      phonology,
      recordCount: rows.length,
      locationCount: availableLocations.value.length,
      regionCount: availableRegions.value.length,
    };

    if (availableLocations.value.length === 1) {
      mapStore.mapData = null;
      mapStore.mergedData = [];
      resultCache.mode = '查中古';
      // resultCache.latestResults = [];
      addCustomFeatureDataWithoutApi(rows, featureName, phonology);
      currentFeatureRows.value = [];
      availableRegions.value = [];
      availableLocations.value = [];
      selectedFeatureMeta.value = null;
      isFeatureScopeModalOpen.value = false;
      loadingFeatureRows.value = false;
      await router.push({
        path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view'),
        query: {}
      });
      showSuccess(t('map.customTab.scopeModal.singleLocationSuccess'));
      return;
    }
  } catch (error) {
    featureRowsError.value = error.message || String(error);
  } finally {
    loadingFeatureRows.value = false;
  }
};

const confirmFeatureScopeSelection = async ({ selectedLocations }) => {
  try {
    const featureMeta = selectedFeatureMeta.value;

    if (!featureMeta?.feature) {
      return;
    }

    const selectedLocationSet = new Set(selectedLocations);
    const filteredRows = currentFeatureRows.value.filter((row) => selectedLocationSet.has(String(row['簡稱'] || '').trim()));

    if (!filteredRows.length) {
      throw new Error(t('map.customTab.scopeModal.emptySelection'));
    }

    mapStore.mapData = null;
    mapStore.mergedData = [];
    resultCache.mode = '查中古';
    // resultCache.latestResults = [];
    addCustomFeatureDataWithoutApi(filteredRows, featureMeta.feature, featureMeta.phonology || '');
    currentFeatureRows.value = [];
    availableRegions.value = [];
    availableLocations.value = [];
    selectedFeatureMeta.value = null;
    featureRowsError.value = '';
    isFeatureScopeModalOpen.value = false;
    await router.push({
      path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view'),
      query: {}
    });
    showSuccess(t('map.customTab.scopeModal.confirmSuccess'));
  } catch (error) {
    showError(t('map.customTab.messages.searchFailed', { error: error.message || error }));
  }
};

const goToDataManager = () => {
  if (!userStore.isAuthenticated) {
    showWarning(t('map.customTab.validation.loginFirst'));
    requireAuth();
    return;
  }

  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/auth/data'),
    query: { username: userStore.username },
  });
};

const fetchUserFeatures = async () => {
  if (!userStore.isAuthenticated) {
    userFeatures.value = [];
    return;
  }

  const hasCustomData = await ensureCustomDataPresence();
  if (!hasCustomData) {
    userFeatures.value = [];
    resetFeatureScopeState();
    return;
  }

  loadingFeatures.value = true;

  try {
    const response = await getUserFeatures();
    userFeatures.value = Array.isArray(response?.data) ? response.data : [];

    userFeatures.value.forEach((item) => {
      const category = item['聲韻調'] || item.phonology || uncategorizedLabel.value;

      if (expandedCategories.value[category] === undefined) {
        expandedCategories.value[category] = true;
      }
    });
  } catch (error) {
    console.error('获取特征列表失败:', error);
  } finally {
    loadingFeatures.value = false;
  }
};

watch(
  () => route.params.sub,
  (newSub) => {
    if (newSub === 'custom') {
      fetchUserFeatures();
    }
  },
  { immediate: true }
);

watch(
  () => userStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      fetchUserFeatures();
    } else {
      userFeatures.value = [];
      searchQuery.value = '';
      isSearchOpen.value = false;
    }
  }
);

watch(isEntryModalOpen, (isOpen) => {
  if (!isOpen) {
    fetchUserFeatures();
  }
});

const openHelpModal = () => {
  isHelpModalOpen.value = true;
};

const handleLogin = () => {
  requireAuth();
};

const openEntryModal = () => {
  isEntryModalOpen.value = true;
};
</script>

<style scoped lang="scss">
@use '../_map-variables' as *;

.custom-tab-container {
  display: flex;
  justify-content: center;
  width: 100%;
  min-width: 0;
}

.page-content-stack {
  width: min(100%, 920px);
  min-width: 0;
  align-items: stretch;
}

.page-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.primary-btn {
  background: linear-gradient(135deg, $primary, $primary-dark);
  color: #fff;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, $primary-dark, var(--color-primary-hover));
  }
}

.add-entry-btn-sm {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb), 0.9),
    rgba(0, 81, 213, 0.9)
  );
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb), 0.2);
  transition: $motion-fast;

  &:hover {
    transform: translateY(-1.5px);
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 1),
      rgba(0, 81, 213, 1)
    );
    box-shadow: 0 6px 14px rgba(var(--color-primary-rgb), 0.35);
  }

  &:active {
    transform: translateY(0);
  }
}

.help-icon-head {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 24px;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--glass-50);
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    var(--glass-90),
    var(--glass-70)
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: $primary;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  box-shadow:
    inset 0 0 0.5px var(--glass-30),
    0 4px 12px rgba(var(--color-primary-rgb), 0.15),
    0 0 0 0.5px var(--glass-10);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.1);
    background: linear-gradient(
      145deg,
      var(--text-white),
      var(--glass-90)
    );
    box-shadow:
      inset 0 0 0.5px var(--glass-50),
      0 6px 16px rgba(var(--color-primary-rgb), 0.25),
      0 0 0 0.5px var(--glass-20);
  }
}

.auth-warning-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 40px 20px;
  box-sizing: border-box;
}

.auth-warning-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 360px;
  padding: 30px;
  border: 1px solid var(--glass-60);
  border-radius: 20px;
  background: var(--glass-40);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.auth-warning-icon {
  margin-bottom: 16px;
  font-size: 44px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  animation: floatIcon 3s ease-in-out infinite;
}

.auth-warning-text {
  margin-bottom: 20px;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.6;
}

@keyframes floatIcon {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

.interactive-search-layout {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 12px;
  width: 100%;
  min-width: 0;
  margin-top: 15px;
}

.custom-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 4px 2px;
  box-sizing: border-box;
}

.data-summary-badge {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 5px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  white-space: nowrap;
  transition: all 0.3s ease;

  &.hint {
    border-color: rgba(142, 142, 147, 0.2);
    background: rgba(142, 142, 147, 0.1);
    color: var(--text-secondary);
  }

  &.success {
    border-color: rgba(var(--color-primary-rgb), 0.2);
    background: rgba(var(--color-primary-rgb), 0.1);
    color: $primary;
  }
}

.toolbar-add-entry-btn {
  flex: 0 0 auto;
}

.tree-panel {
  position: relative;
  width: 100%;
  min-width: 0;
  align-self: stretch;
}

.floating-search {
  position:fixed;
  top: 12dvh;
  left: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border: 1px solid var(--glass-70);
  border-radius: 999px;
  background: var(--glass-70);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  box-shadow:
    0 8px 22px rgba(var(--color-primary-rgb), 0.12),
    inset 0 0 0.5px var(--glass-60);
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s ease,
    box-shadow 0.2s ease;

  &.active {
    width: min(320px, calc(100% - 24px));
    background: var(--glass-90);
    box-shadow:
      0 10px 26px rgba(var(--color-primary-rgb), 0.16),
      inset 0 0 0.5px var(--glass-70);
  }
}

.floating-search-toggle {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  color: $primary;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.floating-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 8px 0 0;
  border: none;
  background: transparent;
  color: var(--text-deep);
  font-size: 13px;
  outline: none;

  &::placeholder {
    color: rgba(100, 116, 139, 0.72);
  }
}

.floating-search-clear {
  flex: 0 0 36px;
  width: 36px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  color: $text-light;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: $text-secondary;
  }
}

.tree-selector-container {
  width: 100%;
  min-width: 0;
  min-height: 220px;
  padding: 12px;
  overflow-y: auto;
  border: 1px solid var(--glass-40);
  border-radius: 16px;
  background: $glass-white;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
}

.tree-loading-state,
.tree-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 30px 10px;
  color: $text-muted;
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
}

.tree-loading-state {
  gap: 12px;
}

.spinner-icon {
  display: inline-block;
  font-size: 24px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.empty-state-icon {
  margin-bottom: 12px;
  font-size: 36px;
}

.empty-state-title {
  margin: 0 0 6px;
  color: $text-main;
  font-weight: 600;
}

.empty-state-text {
  max-width: 260px;
  margin: 0 0 16px;
  color: $text-muted;
  font-size: 12px;
  line-height: 1.5;
}

.inline-btn {
  padding: 6px 16px !important;
  border-radius: 16px !important;
  font-size: 13px !important;
}

.tree-categories-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tree-category-node {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--glass-40);
  border-radius: 12px;
  background: var(--glass-40);
  transition: $motion-fast;

  &:hover {
    background: var(--glass-60);
  }

  &.collapsed {
    .arrow-indicator {
      transform: rotate(0deg);
    }
  }
}

.category-header-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.arrow-indicator {
  margin-right: 10px;
  color: $text-light;
  font-size: 8px;
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

.category-name {
  flex: 1;
  color: var(--text-dark);
  font-size: 14px;
  font-weight: 700;
}

.category-count-badge {
  padding: 1.5px 6px;
  border-radius: 10px;
  background: rgba(var(--color-primary-rgb), 0.08);
  color: $primary;
  font-size: 10px;
  font-weight: 700;
}

.category-children-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  padding: 4px 10px 10px 14px;
  border-top: 1px solid var(--glass-30);
  background: var(--glass-20);
}

.feature-leaf-node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid var(--glass-60);
  border-radius: 10px;
  background: var(--glass-80);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: $motion-fast;

  &:hover {
    transform: translateY(-1.5px);
    border-color: $primary;
    background: #fff;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.08);
  }

  &:active {
    transform: translateY(0);
    background: rgba(240, 247, 255, 0.85);
  }

  .feature-name {
    margin-bottom: 4px;
    color: $text-main;
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1.35;
    word-break: break-all;
  }

  .feature-count-badge {
    color: $text-muted;
    font-size: 9.5px;
    font-weight: 500;
  }
}

.management-footer {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}

.flat-link-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: none;
  color: $primary;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.06);
    text-decoration: underline;
  }
}

@media (max-aspect-ratio: 1/1) {
  .page-content-stack {
    width: 100%;
  }

  .page-footer {
    align-items: flex-start;
  }

  .custom-toolbar {
    gap: 8px;
  }

  .data-summary-badge {
    white-space: normal;
  }

  .toolbar-add-entry-btn {
    flex: 0 0 auto;
    padding-inline: 12px;
  }

  .tree-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .floating-search {
    top: 36dvh;
    left: auto;

    &.active {
      width: 80%;
    }
  }

  .tree-selector-container {
    padding: 12px;
  }

  .category-children-container {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }

  .action-btn {
    max-width: 100%;
  }
}


</style>