<template>
  <div class="glass-container glass-container-shell">
    <!-- Header Section -->
    <div class="header-section">
      <div class="title-row">
        <h2 style="margin: 0;">{{ t('villages.pages.gdTree.title') }}</h2>
<!--        <button class="village-link-btn" @click="goToYCVillages">-->
<!--          <span role="img" aria-label="ycVillages">🏠</span> 陽春自然村-->
<!--        </button>-->
      </div>
      <p class="subtitle">{{ t('villages.pages.gdTree.subtitle') }}</p>
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
            type="text"
            v-model="searchQuery"
            :placeholder="t('villages.pages.gdTree.searchPlaceholder')"
            class="glass-input"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area ui-scrollbar">
      <!-- Initial Loading State -->
      <div v-if="isInitialLoading" class="initial-state">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>{{ t('villages.pages.gdTree.loadingCities') }}</p>
      </div>

      <!-- Initial Error State -->
      <div v-else-if="initialLoadError" class="initial-state error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ initialLoadError }}</p>
        <button @click="loadInitialCities" class="retry-btn">
          {{ t('villages.pages.gdTree.retry') }}
        </button>
      </div>

      <!-- Cities Grid -->
      <div v-else class="cities-grid">
        <div
            v-for="city in topLevelCities"
            :key="city"
            class="city-card"
            :class="{ 'is-loaded': loadedCitiesData[city] }"
        >
          <!-- City Header -->
          <div class="city-header">
            <h3 class="city-name">{{ city }}</h3>
            <div class="city-header-actions">
              <button
                  v-if="!loadedCitiesData[city]"
                  @click="loadCityData(city)"
                  :disabled="loadingStates[city]"
                  class="load-btn"
              >
                {{ loadingStates[city] ? t('villages.pages.gdTree.loading') : t('villages.pages.gdTree.load') }}
              </button>
              <template v-else>
                <button
                    class="city-map-btn"
                    :class="{ 'is-disabled': !getCityLeafCount(city) }"
                    :disabled="!getCityLeafCount(city)"
                    @click.stop="handleCityMapClick(city)"
                    title="顯示全市村落地圖"
                >🌍</button>
                <div class="loaded-badge">
                  ✓ {{ t('villages.pages.gdTree.loaded') }}
                </div>
              </template>
            </div>
          </div>

          <!-- City Loading State -->
          <div v-if="loadingStates[city]" class="city-loading">
            <div class="ui-loading--inline" aria-hidden="true">↻</div>
            <span>{{ t('villages.pages.gdTree.fetching') }}</span>
          </div>

          <!-- City Error State -->
          <div v-else-if="cityLoadErrors[city]" class="city-error">
            <p class="error-text">{{ cityLoadErrors[city] }}</p>
            <button @click="loadCityData(city)" class="retry-btn-small">
              {{ t('villages.pages.gdTree.retry') }}
            </button>
          </div>

          <!-- Tree Container -->
          <div v-else-if="loadedCitiesData[city]" class="tree-container">
            <div v-if="getFilteredCityData(city).length === 0" class="empty-state">
              {{ searchQuery ? t('villages.pages.gdTree.noResults') : t('villages.pages.gdTree.noData') }}
            </div>
            <VillagesTreeItem
                v-for="item in getFilteredCityData(city)"
                :key="item.id"
                :node="item"
                :search-query="searchQuery"
                :lazy-load-fn="lazyLoadChildren"
                @open-map="openMapPopup"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Village Map Popup -->
    <VillageMapPopup
        :visible="mapPopupVisible"
        :villages="mapPopupVillages"
        @close="closeMapPopup"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import VillagesTreeItem from '@/main/components/TableAndTree/VillagesTreeItem.vue';
import VillageMapPopup from '@/main/components/popup/map/VillageMapPopup.vue';
import { lazyLoadTree, loadFullTree } from '@/api';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
const { t } = useI18n();
const router = useRouter();

// API Configuration
const API_CONFIG = {
  db_key: "village",
  table_name: "广东省自然村",
  level_columns: [0, 1, 2, 3, 4],
  data_columns: [6, 7, 8]
};

// State Management
const topLevelCities = ref([]);
const loadedCitiesData = ref({});
const searchQuery = ref('');
const loadingStates = ref({});
const isInitialLoading = ref(false);
const initialLoadError = ref(null);
const cityLoadErrors = ref({});

// Map popup state
const mapPopupVisible = ref(false);
const mapPopupVillages = ref([]);

// ID Generator
let idCounter = 0;
const generateId = () => `node-${Date.now()}-${idCounter++}`;

/**
 * Load initial cities list
 */
const loadInitialCities = async () => {
  isInitialLoading.value = true;
  initialLoadError.value = null;

  const payload = {
    db_key: API_CONFIG.db_key,
    table_name: API_CONFIG.table_name,
    level_columns: API_CONFIG.level_columns,
    parent_path: []
  };

  try {
    const result = await lazyLoadTree(payload)

    // Extract city names from result.children
    if (result && result.children && Array.isArray(result.children) && result.children.length > 0) {
      topLevelCities.value = result.children;
    } else {
      throw new Error(t('villages.pages.gdTree.errors.invalidCityList'));
    }
  } catch (error) {
    console.error('❌ 加載城市列表失敗:', error);
    initialLoadError.value = error.message || t('villages.pages.gdTree.errors.loadCities');
  } finally {
    isInitialLoading.value = false;
  }
};

/**
 * Load complete tree for a specific city
 */
const loadCityData = async (cityName) => {
  // Prevent duplicate loading
  if (loadingStates.value[cityName] || loadedCitiesData.value[cityName]) {
    return;
  }

  loadingStates.value[cityName] = true;
  cityLoadErrors.value[cityName] = null;

  const payload = {
    db_key: API_CONFIG.db_key,
    table_name: API_CONFIG.table_name,
    level_columns: API_CONFIG.level_columns,
    data_columns: API_CONFIG.data_columns,
    filters: { "0": [cityName] }
  };

  try {
    const result = await loadFullTree(payload)

    if (result.mode === 'lazy_fallback') {
      // lazy_bootstrap is a two-level map: { "广州市": ["从化区", "南沙区", ...] }
      const bootstrap = result.lazy_bootstrap
      if (bootstrap && typeof bootstrap === 'object') {
        const districts = bootstrap[cityName] || Object.values(bootstrap)[0] || []
        // filters accumulate (AND), level_columns shift past consumed levels
        const shifted = API_CONFIG.level_columns.slice(1)
        const nodes = districts.map(districtName => ({
          id: generateId(),
          name: districtName,
          rawName: districtName,
          children: [],
          _lazy: true,
          _lazyFilters: { "0": [cityName], "1": [districtName] },
          _lazyLevelColumns: shifted
        }))
        loadedCitiesData.value[cityName] = nodes
      } else {
        loadedCitiesData.value[cityName] = []
      }
    } else if (result.tree && result.tree[cityName]) {
      // Normal full tree
      const normalizedData = normalizeTreeData(result.tree[cityName]);
      loadedCitiesData.value[cityName] = normalizedData;
    } else {
      throw new Error(t('villages.pages.gdTree.errors.invalidCityData'));
    }
  } catch (error) {
    console.error(`❌ 加載 ${cityName} 數據失敗:`, error);
    cityLoadErrors.value[cityName] = error.message || t('villages.pages.gdTree.errors.loadCity');
  } finally {
    loadingStates.value[cityName] = false;
  }
};

/**
 * Normalize tree data from API response (full tree mode)
 */
const normalizeTreeData = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const processNode = (data, name, level = 1) => {
    // Check if this is a leaf node (contains data fields)
    const isLeaf = data['方言分布'] !== undefined ||
                   data['longitude'] !== undefined ||
                   data['latitude'] !== undefined;

    if (isLeaf) {
      const formattedName = formatLeafNode(name, data);
      return {
        id: generateId(),
        name: formattedName,
        rawName: name,
        rawData: data,
        children: []
      };
    }

    // Process branch node
    const children = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const childNode = processNode(data[key], key, level + 1);
        if (childNode) {
          children.push(childNode);
        }
      }
    }

    // Filter empty branches
    if (children.length === 0 && level > 1) {
      return null;
    }

    return {
      id: generateId(),
      name: name,
      rawName: name,
      children: children
    };
  };

  // Process all districts under the city
  const cityChildren = [];
  for (const districtName in rawData) {
    if (Object.prototype.hasOwnProperty.call(rawData, districtName)) {
      const districtNode = processNode(rawData[districtName], districtName, 1);
      if (districtNode) {
        cityChildren.push(districtNode);
      }
    }
  }

  return cityChildren;
};

/**
 * Format leaf node with data fields
 */
const formatLeafNode = (name, data) => {
  const dialect = data['方言分布']?.[0] || '';
  const lng = data['longitude']?.[0] || '';
  const lat = data['latitude']?.[0] || '';

  if (lng && lat) {
    return `${name}  ${dialect} (${lng},${lat})`;
  }
  return `${name}  ${dialect}`;
};

/**
 * Filter tree based on search query
 */
const filterTree = (nodes, query) => {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  return nodes.reduce((acc, node) => {
    // Check if current node matches
    const selfMatch = node.name.toLowerCase().includes(query.toLowerCase());

    // Recursively filter children
    let filteredChildren = [];
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTree(node.children, query);
    }

    // Check if any child matches
    const hasChildMatch = filteredChildren.length > 0;

    if (hasChildMatch) {
      // Parent node: has matching descendants
      acc.push({
        ...node,
        children: filteredChildren,
        _autoExpand: true  // Auto-expand to show matching descendants
      });
    } else if (selfMatch) {
      // Self match: keep original children but don't auto-expand
      acc.push({
        ...node,
        children: node.children,
        _autoExpand: false
      });
    }

    return acc;
  }, []);
};

/**
 * Get filtered city data
 */
const getFilteredCityData = (cityName) => {
  const cityData = loadedCitiesData.value[cityName];
  if (!cityData) {
    return [];
  }

  const query = searchQuery.value.trim();
  if (!query) {
    return cityData;
  }

  return filterTree(cityData, query);
};

/**
 * Lazy load children via loadFullTree with accumulated AND filters + shifted level_columns
 */
const lazyLoadChildren = async (node) => {
  if (!node._lazy || node._childrenLoaded || node._loadingChildren) return

  node._loadingChildren = true
  try {
    const result = await loadFullTree({
      db_key: API_CONFIG.db_key,
      table_name: API_CONFIG.table_name,
      level_columns: node._lazyLevelColumns,
      data_columns: API_CONFIG.data_columns,
      filters: node._lazyFilters
    })

    if (result.mode === 'lazy_fallback') {
      // Still too many rows — accumulate filters + shift level_columns further
      const bootstrap = result.lazy_bootstrap
      const nodeKey = node.rawName || node.name
      const children = bootstrap?.[nodeKey] || Object.values(bootstrap || {})[0] || []
      const nextCol = node._lazyLevelColumns[0]
      const nextShifted = node._lazyLevelColumns.slice(1)
      node.children = children.map(childName => ({
        id: generateId(),
        name: childName,
        rawName: childName,
        children: [],
        _lazy: true,
        _lazyFilters: { ...node._lazyFilters, [String(nextCol)]: [childName] },
        _lazyLevelColumns: nextShifted
      }))
    } else {
      // mode === 'full' — tree rooted at filter level, extract by node key
      const nodeKey = node.rawName || node.name
      node.children = normalizeTreeData(result.tree?.[nodeKey] || {})
    }
    node._childrenLoaded = true
  } catch (error) {
    console.error('Lazy load children error:', error)
    node._loadError = error.message || '加載子節點失敗'
  } finally {
    node._loadingChildren = false
  }
};
const goToYCVillages = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/yc'));
};

/**
 * Open map popup with villages data
 */
const openMapPopup = (villages) => {
  mapPopupVillages.value = villages;
  mapPopupVisible.value = true;
};

/**
 * Close map popup
 */
const closeMapPopup = () => {
  mapPopupVisible.value = false;
  mapPopupVillages.value = [];
};

/**
 * Recursively collect all leaf nodes (with rawData) from an array of tree nodes.
 * Skips unloaded lazy nodes — they have no leaf data yet.
 */
const collectAllLeafNodes = (nodes) => {
  const leaves = [];
  const traverse = (n) => {
    if (n.rawData) {
      const dialect = n.rawData['方言分布']?.[0] || '';
      leaves.push({
        name: n.rawName || n.name,
        dialect,
        longitude: parseFloat(n.rawData['longitude']?.[0]) || 0,
        latitude: parseFloat(n.rawData['latitude']?.[0]) || 0,
      });
    }
    if (n.children && n.children.length > 0) {
      n.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return leaves;
};

const getCityLeafCount = (city) => {
  const cityData = loadedCitiesData.value[city];
  return cityData ? collectAllLeafNodes(cityData).length : 0;
};

/**
 * Show all villages in a city on the map
 */
const handleCityMapClick = (city) => {
  const cityData = loadedCitiesData.value[city];
  if (!cityData) return;
  const leafNodes = collectAllLeafNodes(cityData);
  if (leafNodes.length > 0) {
    openMapPopup(leafNodes);
  }
};

// Initialize on mount
onMounted(() => {
  loadInitialCities();
});
</script>

<style scoped>
/* Glass Container */
.glass-container {
  width: 90dvw;
  max-width: 1400px;
  height: 90dvh;
  margin:10px auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #1d1d1f;
}

/* Header Section */
.header-section {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.3);
}

.title {
  margin: 0 0 8px 0;
  font-size: 26px;
  font-weight: 700;
  color: #1d1d1f;
}

.subtitle {
  margin: 3px;
  color: #6e6e73;
  font-size: 14px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 16px;
  opacity: 0.5;
}

.glass-input {
  width: 100%;
  padding: 12px 18px 12px 42px;
  border: none;
  border-radius: 15px;
  background: rgba(0, 0, 0, 0.05);
  outline: none;
  font-size: 15px;
  transition: all 0.3s;
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
}

/* Content Area */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Initial Loading/Error States */
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.initial-state p {
  font-size: 16px;
  color: #6e6e73;
}

.error-state {
  color: #d32f2f;
}

.error-icon {
  font-size: 48px;
}

.error-message {
  color: #d32f2f !important;
  margin: 0;
}

/* Loading Spinner */



/* Cities Grid */
.cities-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* City Card */
.city-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.city-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.city-card.is-loaded {
  border-color: rgba(0, 122, 255, 0.4);
  background: rgba(255, 255, 255, 0.7);
}

/* City Header */
.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.city-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

/* Load Button */
.load-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.load-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
}

.load-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loaded Badge */
.loaded-badge {
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.city-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.city-map-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.city-map-btn:hover:not(:disabled) {
  background: rgba(52, 199, 89, 0.15);
  transform: scale(1.15);
}

.city-map-btn.is-disabled,
.city-map-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* City Loading State */
.city-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 122, 255, 0.05);
  border-radius: 12px;
  color: #007AFF;
  font-size: 14px;
}

/* City Error State */
.city-error {
  padding: 16px;
  background: rgba(211, 47, 47, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(211, 47, 47, 0.2);
}

.error-text {
  margin: 0 0 12px 0;
  color: #d32f2f;
  font-size: 14px;
}

/* Retry Buttons */
.retry-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  background: rgba(142, 142, 147, 0.2);
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: rgba(142, 142, 147, 0.3);
}

.retry-btn-small {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: rgba(142, 142, 147, 0.2);
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn-small:hover {
  background: rgba(142, 142, 147, 0.3);
}

/* Tree Container */
.tree-container {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 24px 0;
  color: #8e8e93;
  font-size: 14px;
}

/* Responsive Design */
@media (max-aspect-ratio: 1/1) {
  .glass-container {
    width: 92dvw;
    height: 88dvh;
    border-radius: 20px;
  }

  .cities-grid {
    grid-template-columns: 1fr;
  }

  .header-section {
    padding: 16px;
  }

  .title-row {
    font-size: 14px;
    white-space: nowrap;
    gap:5px!important;
  }

  .content-area {
    padding: 16px;
  }
}
.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}
.village-link-btn {
  padding: 8px 16px;
  border-radius: 25px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: #005fd3;
  font-weight: 1000;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.village-link-btn:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}
</style>
