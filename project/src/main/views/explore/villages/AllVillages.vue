<template>
  <div class="glass-container glass-container-shell">
    <!-- Header Section -->
    <div class="header-section">
      <div class="title-row">
        <h2 style="margin: 0;">{{ t('villages.pages.allVillages.title') }}</h2>
        <div class="filter-controls">
          <SimpleSelectDropdown
            v-model="filterMode"
            :options="filterModeOptions"
            :placeholder="t('villages.pages.allVillages.filter.placeholder')"
          />
          <SimpleSelectDropdown
            v-if="filterMode && filterMode !== FILTER_MODE_NONE"
            v-model="filterValue"
            :options="filterValueOptions"
            :placeholder="t('villages.pages.allVillages.filter.placeholder')"
            searchable
          />
        </div>
      </div>
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
            type="text"
            v-model="searchQuery"
            :placeholder="t('villages.pages.allVillages.searchPlaceholder')"
            class="glass-input"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area ui-scrollbar">
      <!-- Initial Loading State -->
      <div v-if="isInitialLoading" class="initial-state">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>{{ t('villages.pages.allVillages.loadingCities') }}</p>
      </div>

      <!-- Initial Error State -->
      <div v-else-if="initialLoadError" class="initial-state error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ initialLoadError }}</p>
        <button @click="loadInitialCities" class="retry-btn">
          {{ t('villages.pages.allVillages.retry') }}
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
                {{ loadingStates[city] ? t('villages.pages.allVillages.loading') : t('villages.pages.allVillages.load') }}
              </button>
              <template v-else>
                <button
                    class="city-map-btn"
                    :class="{ 'is-disabled': !getCityLeafCount(city) }"
                    :disabled="!getCityLeafCount(city)"
                    @click.stop="handleCityMapClick(city)"
                    title="顯示全市地圖"
                >🌍</button>
                <button
                    class="reload-btn"
                    :disabled="loadingStates[city]"
                    @click="reloadCityData(city)"
                >{{ loadingStates[city] ? t('villages.pages.allVillages.loading') : t('villages.pages.allVillages.reload') }}</button>
              </template>
            </div>
          </div>

          <!-- City Loading State -->
          <div v-if="loadingStates[city]" class="city-loading">
            <div class="ui-loading--inline" aria-hidden="true">↻</div>
            <span>{{ t('villages.pages.allVillages.fetching') }}</span>
          </div>

          <!-- City Error State -->
          <div v-else-if="cityLoadErrors[city]" class="city-error">
            <p class="error-text">{{ cityLoadErrors[city] }}</p>
            <button @click="loadCityData(city)" class="retry-btn-small">
              {{ t('villages.pages.allVillages.retry') }}
            </button>
          </div>

          <!-- Tree Container -->
          <div v-else-if="loadedCitiesData[city]" class="tree-container">
            <div v-if="getFilteredCityData(city).length === 0" class="empty-state">
              {{ searchQuery ? t('villages.pages.allVillages.noResults') : t('villages.pages.allVillages.noData') }}
            </div>
            <VillagesTreeItem
                v-for="item in getFilteredCityData(city)"
                :key="item.id"
                :node="item"
                :search-query="searchQuery"
                :lazy-load-fn="lazyLoadChildren"
                :leaf-data-extractor="allVillagesLeafExtractor"
                @open-map="openMapPopup"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Map Popup -->
    <AllVillagesMapPopup
        :visible="mapPopupVisible"
        :villages="mapPopupVillages"
        @close="closeMapPopup"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { decompressSync, strFromU8 } from 'fflate'
import VillagesTreeItem from '@/main/components/TableAndTree/VillagesTreeItem.vue';
import AllVillagesMapPopup from '@/main/components/popup/map/AllVillagesMapPopup.vue';
import { lazyLoadTree, loadFullTree } from '@/api';
import { getPlaceTypeInfo, default as PLACE_TYPE_MAPPING } from '@/main/config/placeTypeMapping.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const { t } = useI18n();

const API_CONFIG = {
  db_key: 'village_admin',
  table_name: 'toponyms',
  level_columns: [3, 4, 5, 6, 1],
  data_columns: [2, 7]
};

// State
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

// Filter state
const filterMode = ref('');
const filterValue = ref('');

const FILTER_MODE_NONE = '__none__'

const filterModeOptions = computed(() => [
  { label: t('villages.pages.allVillages.filter.modeNone'), value: FILTER_MODE_NONE },
  { label: t('villages.pages.allVillages.filter.modeLevel1'), value: 'level1' },
  { label: t('villages.pages.allVillages.filter.modeLevel2'), value: 'level2' },
  { label: t('villages.pages.allVillages.filter.modeLevel3'), value: 'level3' },
  { label: t('villages.pages.allVillages.filter.modeRaw'), value: 'raw' }
])

const filterValueOptions = computed(() => {
  if (!filterMode.value || filterMode.value === FILTER_MODE_NONE) return []
  const seen = new Map()
  for (const [code, info] of Object.entries(PLACE_TYPE_MAPPING)) {
    let label, value
    if (filterMode.value === 'raw') {
      label = info.place_type_name
      value = info.place_type_name
    } else {
      const level = info[filterMode.value]
      if (!level) continue
      label = `${level.code} - ${level.name}`
      value = level.code
    }
    if (!seen.has(value)) seen.set(value, { label, value })
  }
  const list = Array.from(seen.values())
  list.sort((a, b) => (a.value < b.value ? -1 : 1))
  return list
})

const matchedCodes = computed(() => {
  if (!filterMode.value || !filterValue.value) return []
  if (filterMode.value === 'raw') {
    const codes = []
    for (const [code, info] of Object.entries(PLACE_TYPE_MAPPING)) {
      if (info.place_type_name === filterValue.value) codes.push(code)
    }
    return codes
  }
  const levelKey = filterMode.value
  const codes = []
  for (const [code, info] of Object.entries(PLACE_TYPE_MAPPING)) {
    if (info[levelKey] && info[levelKey].code === filterValue.value) codes.push(code)
  }
  return codes
})

const clearFilter = () => {
  filterMode.value = FILTER_MODE_NONE
  filterValue.value = ''
}

watch(filterMode, () => {
  filterValue.value = ''
})

// ID Generator
let idCounter = 0;
const generateId = () => `node-${Date.now()}-${idCounter++}`;

/**
 * Decompress hex-encoded zlib-compressed coors data.
 * Hex string → Uint8Array → unzip → JSON string → parsed array.
 */
const decompressCoors = (compressed) => {
  if (!compressed) return []
  const hex = String(compressed).trim()
  if (hex.length % 2 !== 0) {
    console.warn('coors hex has odd length, padding:', hex.length, hex.slice(0, 20))
    return []
  }
  try {
    const bytes = hex.match(/.{1,2}/g).map(b => parseInt(b, 16))
    const binary = new Uint8Array(bytes)
    const decompressed = decompressSync(binary)
    const jsonStr = strFromU8(decompressed)
    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('coors decompressed to non-array or empty:', jsonStr.slice(0, 80))
      return []
    }
    return parsed
  } catch (e) {
    console.error('coors decompression failed:', e.message, 'hex preview:', hex.slice(0, 40))
    return []
  }
}

/**
 * Get the display value from place_type_code data for tree leaf formatting.
 */
const getPlaceTypeDisplay = (data) => {
  const code = Array.isArray(data['place_type_code']) ? data['place_type_code'][0] : data['place_type_code']
  if (!code) return ''
  const info = getPlaceTypeInfo(String(code))
  return info?.place_type_name || `[${code}]`
}

const tagColorPalette = [
  '#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5',
  '#e0f7fa', '#fbe9e7', '#e8eaf6', '#f1f8e9', '#fff8e1',
  '#ede7f6', '#e1f5fe', '#f9fbe7', '#efebe9', '#e0f2f1'
]

const tagColorMap = {}
const getTagColor = (text) => {
  if (tagColorMap[text]) return tagColorMap[text]
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  tagColorMap[text] = tagColorPalette[Math.abs(hash) % tagColorPalette.length]
  return tagColorMap[text]
}

/**
 * Build tag info for a leaf node: { text, color }
 */
const getTagInfo = (data) => {
  const text = getPlaceTypeDisplay(data)
  if (!text) return null
  return { text, color: getTagColor(text) }
}

/**
 * Format leaf node display name (plain, tag is rendered separately)
 */
const formatLeafNode = (name, data) => {
  return name
}

/**
 * Load initial cities list (top-level nodes)
 */
const loadInitialCities = async () => {
  isInitialLoading.value = true;
  initialLoadError.value = null;

  try {
    const result = await lazyLoadTree({
      db_key: API_CONFIG.db_key,
      table_name: API_CONFIG.table_name,
      level_columns: API_CONFIG.level_columns,
      parent_path: []
    })

    if (result && result.children && Array.isArray(result.children) && result.children.length > 0) {
      topLevelCities.value = result.children;
    } else {
      throw new Error(t('villages.pages.allVillages.errors.invalidCityList'));
    }
  } catch (error) {
    console.error('Failed to load city list:', error);
    initialLoadError.value = error.message || t('villages.pages.allVillages.errors.loadCities');
  } finally {
    isInitialLoading.value = false;
  }
};

/**
 * Load complete tree for a specific city
 */
const loadCityData = async (cityName) => {
  if (loadingStates.value[cityName] || loadedCitiesData.value[cityName]) return;

  loadingStates.value[cityName] = true;
  cityLoadErrors.value[cityName] = null;

  try {
    const filters = { "3": [cityName] }
    if (filterValue.value && matchedCodes.value.length > 0) filters["2"] = matchedCodes.value
    const result = await loadFullTree({
      db_key: API_CONFIG.db_key,
      table_name: API_CONFIG.table_name,
      level_columns: API_CONFIG.level_columns,
      data_columns: API_CONFIG.data_columns,
      filters
    })

    if (result.mode === 'lazy_fallback') {
      const bootstrap = result.lazy_bootstrap
      if (bootstrap && typeof bootstrap === 'object') {
        const districts = bootstrap[cityName] || Object.values(bootstrap)[0] || []
        const shifted = API_CONFIG.level_columns.slice(1)
        const baseFilters = { "3": [cityName] }
        if (filters["2"]) baseFilters["2"] = filters["2"]
        const nodes = districts.map(districtName => ({
          id: generateId(),
          name: districtName,
          rawName: districtName,
          children: [],
          _lazy: true,
          _lazyFilters: { ...baseFilters, "4": [districtName] },
          _lazyLevelColumns: shifted,
          _path: [cityName, districtName]
        }))
        loadedCitiesData.value[cityName] = nodes
      } else {
        loadedCitiesData.value[cityName] = []
      }
    } else if (result.tree && result.tree[cityName]) {
      const normalizedData = normalizeTreeData(result.tree[cityName], [cityName]);
      loadedCitiesData.value[cityName] = normalizedData;
    } else {
      throw new Error(t('villages.pages.allVillages.errors.invalidCityData'));
    }
  } catch (error) {
    console.error(`Failed to load ${cityName} data:`, error);
    cityLoadErrors.value[cityName] = error.message || t('villages.pages.allVillages.errors.loadCity');
  } finally {
    loadingStates.value[cityName] = false;
  }
};

const reloadCityData = (cityName) => {
  loadedCitiesData.value[cityName] = null
  loadCityData(cityName)
}

/**
 * Normalize tree data from API response (full tree mode)
 */
const normalizeTreeData = (rawData, pathPrefix = []) => {
  if (!rawData || typeof rawData !== 'object') return [];

  const pushChild = (children, result) => {
    if (!result) return
    if (Array.isArray(result)) {
      children.push(...result)
    } else {
      children.push(result)
    }
  }

  const processNode = (data, name, level = 1, path = []) => {
    // Leaf detection: check for place_type_code or coors fields
    const isLeaf = data['place_type_code'] !== undefined ||
                   data['coords'] !== undefined;

    if (isLeaf) {
      const codes = Array.isArray(data['place_type_code']) ? data['place_type_code'] : []
      const coorsArr = Array.isArray(data['coords']) ? data['coords'] : []
      const count = Math.max(codes.length, coorsArr.length, 1)

      const makeLeafNode = (singleData) => {
        const compressed = Array.isArray(singleData['coords']) ? singleData['coords'][0] : singleData['coords']
        const coors = decompressCoors(compressed)
        const tag = getTagInfo(singleData)
        return {
          id: generateId(),
          name: formatLeafNode(name, singleData),
          rawName: name,
          rawData: singleData,
          _coordCount: Array.isArray(coors) ? coors.length : 0,
          _tag: tag,
          _path: [...path, name],
          children: []
        }
      }

      if (count <= 1) {
        return makeLeafNode(data)
      }

      // Multi-record leaf — split into individual nodes
      return Array.from({ length: count }, (_, i) => {
        const single = {}
        if (codes[i] !== undefined) single['place_type_code'] = [codes[i]]
        if (coorsArr[i] !== undefined) single['coords'] = [coorsArr[i]]
        return makeLeafNode(single)
      })
    }

    // Process branch node
    const children = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        pushChild(children, processNode(data[key], key, level + 1, [...path, name]))
      }
    }

    if (children.length === 0 && level > 1) return null;

    return {
      id: generateId(),
      name: name,
      rawName: name,
      _path: [...path, name],
      children: children
    };
  };

  const cityChildren = [];
  for (const districtName in rawData) {
    if (Object.prototype.hasOwnProperty.call(rawData, districtName)) {
      pushChild(cityChildren, processNode(rawData[districtName], districtName, 1, pathPrefix))
    }
  }

  return cityChildren;
};

/**
 * Leaf data extractor for VillagesTreeItem — returns map-popup-compatible data
 */
const allVillagesLeafExtractor = (rawData, rawName) => {
  const codes = Array.isArray(rawData['place_type_code']) ? rawData['place_type_code'] : [rawData['place_type_code']].filter(Boolean)
  const coorsArr = Array.isArray(rawData['coords']) ? rawData['coords'] : [rawData['coords']].filter(Boolean)
  const count = Math.max(codes.length, coorsArr.length, 1)

  if (coorsArr.length === 0) {
    console.warn('allVillagesLeafExtractor: no coords in rawData for', rawName, 'rawData keys:', Object.keys(rawData))
  }

  const results = []
  for (let i = 0; i < count; i++) {
    const code = String(codes[i] || codes[0] || '')
    const info = getPlaceTypeInfo(code)
    const compressed = coorsArr[i] || coorsArr[0] || ''
    const coors = decompressCoors(compressed)

    results.push({
      name: rawName,
      place_type_code: code,
      level2_name: info?.level2?.name || '',
      level3_name: info?.level3?.name || '',
      place_type_name: info?.place_type_name || '',
      coors: coors
    })
  }
  return results
}

/**
 * Filter tree based on search query
 */
const filterTree = (nodes, query) => {
  if (!nodes || nodes.length === 0) return [];

  return nodes.reduce((acc, node) => {
    const selfMatch = node.name.toLowerCase().includes(query.toLowerCase());

    let filteredChildren = [];
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTree(node.children, query);
    }

    const hasChildMatch = filteredChildren.length > 0;

    if (hasChildMatch) {
      acc.push({
        ...node,
        children: filteredChildren,
        _autoExpand: true
      });
    } else if (selfMatch) {
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
 * Client-side filter: prune tree to only show nodes matching place_type_codes
 */
const filterByPlaceTypeCode = (nodes, codes) => {
  if (!nodes || nodes.length === 0) return []
  return nodes.reduce((acc, node) => {
    if (node.rawData) {
      const nodeCodes = Array.isArray(node.rawData['place_type_code'])
        ? node.rawData['place_type_code']
        : [node.rawData['place_type_code']]
      if (nodeCodes.some(c => codes.includes(String(c)))) acc.push(node)
    } else if (node.children && node.children.length > 0) {
      const filtered = filterByPlaceTypeCode(node.children, codes)
      if (filtered.length > 0) acc.push({ ...node, children: filtered })
    }
    return acc
  }, [])
}

const getFilteredCityData = (cityName) => {
  let cityData = loadedCitiesData.value[cityName];
  if (!cityData) return [];

  if (filterValue.value && matchedCodes.value.length > 0) {
    cityData = filterByPlaceTypeCode(cityData, matchedCodes.value)
  }

  const query = searchQuery.value.trim();
  if (!query) return cityData;

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
      const bootstrap = result.lazy_bootstrap
      const nodeKey = node.rawName || node.name
      const children = bootstrap?.[nodeKey] || Object.values(bootstrap || {})[0] || []
      const nextCol = node._lazyLevelColumns[1]
      if (nextCol == null) {
        node.children = []
        node._childrenLoaded = true
        node._loadingChildren = false
        return
      }
      const nextShifted = node._lazyLevelColumns.slice(1)
      node.children = children.map(childName => ({
        id: generateId(),
        name: childName,
        rawName: childName,
        children: [],
        _lazy: true,
        _lazyFilters: { ...node._lazyFilters, [String(nextCol)]: [childName] },
        _lazyLevelColumns: nextShifted,
        _path: [...(node._path || []), childName]
      }))
    } else {
      const nodeKey = node.rawName || node.name
      node.children = normalizeTreeData(result.tree?.[nodeKey] || {}, node._path || [])
    }
    node._childrenLoaded = true
  } catch (error) {
    console.error('Lazy load children error:', error)
    node._loadError = error.message || '加載子節點失敗'
  } finally {
    node._loadingChildren = false
  }
};

/**
 * Open map popup with villages data
 */
const openMapPopup = (villages) => {
  mapPopupVillages.value = villages;
  mapPopupVisible.value = true;
};

const closeMapPopup = () => {
  mapPopupVisible.value = false;
  mapPopupVillages.value = [];
};

/**
 * Recursively collect all leaf nodes with decompressed coors for map display
 */
const collectAllLeafNodes = (nodes) => {
  const leaves = [];
  const traverse = (n) => {
    if (n.rawData) {
      const extracted = allVillagesLeafExtractor(n.rawData, n.rawName || n.name)
      if (n._path) extracted.forEach(e => e._path = n._path)
      leaves.push(...extracted)
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

const handleCityMapClick = (city) => {
  const cityData = loadedCitiesData.value[city];
  if (!cityData) return;
  const leafNodes = collectAllLeafNodes(cityData);
  if (leafNodes.length > 0) {
    openMapPopup(leafNodes);
  }
};

onMounted(() => {
  loadInitialCities();
});
</script>

<style scoped>
.glass-container {
  width: 90dvw;
  max-width: 1400px;
  height: 90dvh;
  margin: 10px auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #1d1d1f;
}

.header-section {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.3);
}

.filter-controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.filter-controls :deep(.select-trigger) {
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.3);
  &:hover {
    background: rgba(0, 122, 255, 0.2);
    border-color: #007AFF;
  }
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

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

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

.cities-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

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

.reload-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 10px;
  background: rgba(142, 142, 147, 0.2);
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reload-btn:hover:not(:disabled) {
  background: rgba(142, 142, 147, 0.35);
}

.reload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.tree-container {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.empty-state {
  text-align: center;
  padding: 24px 0;
  color: #8e8e93;
  font-size: 14px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  flex-wrap: wrap;
}

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

  .content-area {
    padding: 16px;
  }
}
</style>
