<template>
  <div class="char-class-page">
    <div class="page-shell">
      <section class="config-panel glass-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h2 class="page-title">{{ t(currentPageConfig.titleKey) }}</h2>
            <!-- <p class="page-subtitle">{{ t('charClass.common.subtitle') }}</p> -->
          </div>
        </div>

        <div v-if="hasMultipleTables" class="control-section">
          <div class="control-heading">{{ t('charClass.common.table') }}</div>
          <SimpleSelectDropdown
            :modelValue="selectedTableKey"
            :options="tableOptions"
            width="100%"
            @update:modelValue="handleTableChange"
          />
        </div>

        <div class="control-section preset-section">
          <div class="control-heading">{{ t('charClass.common.recommended') }}</div>
          <RadioGroup
            v-model="activePresetModel"
            :options="presetOptions"
            name="char-class-preset"
            class="preset-list"
          />
        </div>

        <div class="control-section levels-section">
          <div class="levels-header">
            <div>
              <div class="control-heading">{{ t('charClass.common.levels') }}</div>
              <div class="section-hint">{{ t('charClass.common.levelsHint') }}</div>
            </div>

            <button
              type="button"
              class="glass-button add-level-button"
              :disabled="!canAddLevel"
              @click="addLevel"
            >
              {{ t('charClass.actions.addLevel') }}
            </button>
          </div>

          <div class="levels-list">
            <div
              v-for="(levelKey, index) in levels"
              :key="`${selectedTableKey}-${index}-${levelKey}`"
              class="level-row glass-panel-inner"
            >
              <div class="level-row-header">
                <span class="level-badge">{{ t('charClass.common.level', { index: index + 1 }) }}</span>

                <SimpleSelectDropdown
                  class="level-select"
                  ref="levelDropdownRefs"
                  :modelValue="levelKey"
                  :options="getLevelOptions(index)"
                  searchable
                  matchTriggerWidth
                  @update:modelValue="(value) => updateLevel(index, value)"
                />

                <div class="level-actions">
                  <button
                    type="button"
                    class="level-action level-action-up"
                    :aria-label="t('charClass.actions.moveUp')"
                    :disabled="index === 0"
                    :title="t('charClass.actions.moveUp')"
                    @click="moveLevel(index, -1)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="level-action level-action-down"
                    :aria-label="t('charClass.actions.moveDown')"
                    :disabled="index === levels.length - 1"
                    :title="t('charClass.actions.moveDown')"
                    @click="moveLevel(index, 1)"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="level-action danger level-action-close"
                    :aria-label="t('charClass.actions.removeLevel')"
                    :disabled="levels.length <= 1"
                    :title="t('charClass.actions.removeLevel')"
                    @click="removeLevel(index)"
                  >
                    −
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!canAddLevel" class="section-hint limit-hint">
            {{ t('charClass.states.noMoreLevels') }}
          </div>
        </div>
      </section>

      <section class="tree-panel glass-panel">
        <div class="tree-header">
          <div class="tree-title-group">
            <h3 class="tree-title">{{ t('charClass.common.resultsTitle') }}</h3>
            <p class="tree-meta">
              {{ t(currentTableConfig.labelKey) }}
              <span class="tree-meta-separator">·</span>
              {{ activePresetLabel || t('charClass.common.custom') }}
            </p>
          </div>

          <div class="tree-actions">
            <CheckBox
              v-model="showAnnotations"
              class="annotation-checkbox"
              :label="showAnnotations ? t('charClass.actions.showAnnotations') : t('charClass.actions.hideAnnotations') "
              :font-size="14"
            />

            <div class="search-wrapper">
              <span class="search-icon">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                class="glass-input"
                :placeholder="t('charClass.search.placeholder')"
                :disabled="loading"
              />
            </div>
          </div>
        </div>

        <div class="tree-body ui-scrollbar">
          <div v-if="loading" class="state-block">
            <div class="ui-loading--page" aria-hidden="true"></div>
            <p>{{ t('charClass.states.loading', { name: t(currentTableConfig.labelKey) }) }}</p>
            <p class="state-hint">{{ t('charClass.states.loadingHint') }}</p>
          </div>

          <div v-else-if="loadError" class="state-block">
            <div class="state-icon">⚠️</div>
            <p class="state-message">{{ loadError }}</p>
            <button type="button" class="glass-button retry-button" @click="retryCurrentState">
              {{ t('charClass.actions.retry') }}
            </button>
          </div>

          <div v-else-if="displayTree.length === 0" class="state-block">
            <div class="state-icon">{{ searchQuery.trim() ? '🔎' : '📚' }}</div>
            <p class="state-message">
              {{ searchQuery.trim() ? t('charClass.search.noResults') : t('charClass.states.emptyTree') }}
            </p>
            <p v-if="!searchQuery.trim()" class="state-hint">{{ t('charClass.states.emptyTreeHint') }}</p>
          </div>

          <div v-else class="tree-container">
            <CharTreeItem
              v-for="item in displayTree"
              :key="item.id"
              :node="item"
              :search-query="searchQuery"
              :show-annotations="showAnnotations"
              :lazy-load-fn="lazyLoadCharClassChildren"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import CharTreeItem from '@/main/components/TableAndTree/CharTreeItem.vue'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'
import { lazyLoadTree, loadFullTree } from '@/api'
import {
  parseCharClassParams,
  updateUrlWithCharClassConfig
} from '@/utils/urlParams.js'
import {
  buildCharClassTreePayload,
  findCharClassPresetKey,
  getDefaultCharClassLevelKeys,
  getCharClassPageConfig,
  sanitizeCharClassLevelKeys,
  sanitizeCharClassTableKey
} from '@/main/config/chars_positions/charClassPageConfigs.js'
import {
  filterCharClassTree,
  normalizeCharClassTree
} from '@/main/utils/charClassTreeAdapter.js'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const validSubs = ['zhonggu', 'shanggu', 'jingu', 'yueyun']
const { state: activeTab } = useRouteQueryState('tab', {
  defaultValue: 'zhonggu',
  parse: (value) => validSubs.includes(value) ? value : '',
  serialize: (value) => value,
})

const selectedTableKey = ref('')
const levels = ref([])
const showAnnotations = ref(true)
const searchQuery = ref('')
const loading = ref(false)
const loadError = ref('')
const levelDropdownRefs = ref([])
const treeCache = ref({})
const activeTreeCacheKey = ref('')
const loadingCacheKey = ref('')

let loadRequestId = 0

const currentPageConfig = computed(() => getCharClassPageConfig(activeTab.value))
const hasMultipleTables = computed(() => Object.keys(currentPageConfig.value.tables).length > 1)
const currentTableConfig = computed(() => {
  const normalizedTableKey = sanitizeCharClassTableKey(currentPageConfig.value, selectedTableKey.value)
  return currentPageConfig.value.tables[normalizedTableKey]
})
const activePresetKey = computed(() => findCharClassPresetKey(currentTableConfig.value, levels.value))
const activePresetLabel = computed(() => {
  const preset = currentTableConfig.value.presetMap[activePresetKey.value]
  return preset ? t(preset.labelKey) : ''
})
const currentTreeData = computed(() => treeCache.value[activeTreeCacheKey.value] || [])
const displayTree = computed(() => {
  const query = searchQuery.value.trim()
  return query ? filterCharClassTree(currentTreeData.value, query) : currentTreeData.value
})
const canAddLevel = computed(() => levels.value.length < currentTableConfig.value.levelColumns.length)
const tableOptions = computed(() =>
  Object.entries(currentPageConfig.value.tables).map(([tableKey, tableConfig]) => ({
    label: t(tableConfig.labelKey),
    value: tableKey
  }))
)

const presetOptions = computed(() =>
  currentTableConfig.value.presets.map(preset => ({
    label: t(preset.labelKey),
    value: preset.key
  }))
)

const activePresetModel = computed({
  get: () => activePresetKey.value,
  set: (presetKey) => applyPreset(presetKey)
})

const areArraysEqual = (left, right) =>
  left.length === right.length && left.every((item, index) => item === right[index])

const buildCacheKey = (tableKey, levelKeys) => `${activeTab.value}:${tableKey}:${levelKeys.join('|')}`

const normalizeState = (tableKey, levelKeys) => {
  const normalizedTableKey = sanitizeCharClassTableKey(currentPageConfig.value, tableKey)
  const tableConfig = currentPageConfig.value.tables[normalizedTableKey]

  return {
    tableKey: normalizedTableKey,
    levels: sanitizeCharClassLevelKeys(tableConfig, levelKeys)
  }
}

const syncUrlToState = (state) => {
  if (!route.path.endsWith('/explore/char-class')) {
    return
  }

  const parsedParams = parseCharClassParams(route)
  const hasExtraTableParam = !hasMultipleTables.value && Boolean(route.query.table)
  const subMatches = route.query.tab === activeTab.value
  const tableMatches = hasMultipleTables.value
    ? parsedParams.table === state.tableKey
    : !hasExtraTableParam
  const levelsMatch = areArraysEqual(parsedParams.levels, state.levels)

  if (subMatches && tableMatches && levelsMatch) {
    return
  }

  updateUrlWithCharClassConfig(router, route, {
    pageKey: activeTab.value,
    tableKey: state.tableKey,
    levels: state.levels,
    includeTable: hasMultipleTables.value
  })
}

const loadTreeForState = async (state) => {
  const cacheKey = buildCacheKey(state.tableKey, state.levels)
  const tableConfig = currentPageConfig.value.tables[state.tableKey]
  activeTreeCacheKey.value = cacheKey
  loadError.value = ''

  if (treeCache.value[cacheKey]) {
    loading.value = false
    loadingCacheKey.value = ''
    return
  }

  if (loadingCacheKey.value === cacheKey) {
    return
  }

  const requestId = ++loadRequestId
  loading.value = true
  loadingCacheKey.value = cacheKey

  try {
    const payload = buildCharClassTreePayload(activeTab.value, state.tableKey, state.levels)
    // Load only the first level lazily (same pattern as gdVillages)
    const result = await lazyLoadTree({
      db_key: payload.db_key,
      table_name: payload.table_name,
      level_columns: payload.level_columns,
      parent_path: []
    })

    if (requestId !== loadRequestId) {
      return
    }

    if (result && result.children && Array.isArray(result.children)) {
      const nodes = result.children.map(child => {
        const name = typeof child === 'string' ? child : (child.name || '')
        return {
          id: name,
          name,
          _normalizedName: name.toLowerCase(),
          chars: [],
          annotations: [],
          children: [],
          isLeaf: false,
          _lazy: true,
          _lazyFilters: { [String(payload.level_columns[0])]: [name] },
          _lazyLevelColumns: payload.level_columns
        }
      })
      treeCache.value = {
        ...treeCache.value,
        [cacheKey]: nodes
      }
    } else {
      treeCache.value = {
        ...treeCache.value,
        [cacheKey]: []
      }
    }
  } catch (error) {
    if (requestId !== loadRequestId) {
      return
    }

    loadError.value = error.message || t('charClass.states.loadFailed')
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false
      loadingCacheKey.value = ''
    }
  }
}

const commitState = (nextTableKey, nextLevels, options = { syncUrl: true, resetSearch: false }) => {
  const normalizedState = normalizeState(nextTableKey, nextLevels)
  const cacheKey = buildCacheKey(normalizedState.tableKey, normalizedState.levels)
  const stateChanged =
    selectedTableKey.value !== normalizedState.tableKey ||
    !areArraysEqual(levels.value, normalizedState.levels)

  selectedTableKey.value = normalizedState.tableKey
  levels.value = [...normalizedState.levels]
  activeTreeCacheKey.value = cacheKey

  if (options.resetSearch) {
    searchQuery.value = ''
  }

  if (options.syncUrl) {
    syncUrlToState(normalizedState)
  }

  if (stateChanged || (!treeCache.value[cacheKey] && loadingCacheKey.value !== cacheKey)) {
    loadTreeForState(normalizedState)
  }
}

const getLevelOptions = (index) => {
  const usedByOthers = new Set(levels.value.filter((_, currentIndex) => currentIndex !== index))

  return currentTableConfig.value.levelColumns
    .filter((column) => column.key === levels.value[index] || !usedByOthers.has(column.key))
    .map((column) => ({
      label: column.label,
      value: column.key
    }))
}

const getFirstPresetLevelKeys = (tableConfig) =>
  tableConfig.presets[0]?.levelKeys || getDefaultCharClassLevelKeys(tableConfig)

const handleTableChange = (nextTableKey) => {
  if (activeTab.value === 'jingu') {
    const normalizedTableKey = sanitizeCharClassTableKey(currentPageConfig.value, nextTableKey)
    const nextTableConfig = currentPageConfig.value.tables[normalizedTableKey]
    commitState(normalizedTableKey, getFirstPresetLevelKeys(nextTableConfig))
    return
  }

  commitState(nextTableKey, levels.value)
}

const applyPreset = (presetKey) => {
  const preset = currentTableConfig.value.presetMap[presetKey]
  if (!preset) return

  commitState(selectedTableKey.value, preset.levelKeys)
}

const updateLevel = (index, nextLevelKey) => {
  if (!nextLevelKey || levels.value[index] === nextLevelKey) {
    return
  }

  const nextLevels = [...levels.value]
  nextLevels[index] = nextLevelKey
  commitState(selectedTableKey.value, nextLevels)
}

const moveLevel = (index, direction) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= levels.value.length) {
    return
  }

  const nextLevels = [...levels.value]
  ;[nextLevels[index], nextLevels[targetIndex]] = [nextLevels[targetIndex], nextLevels[index]]
  commitState(selectedTableKey.value, nextLevels)
}

const removeLevel = (index) => {
  if (levels.value.length <= 1) {
    return
  }

  const nextLevels = levels.value.filter((_, currentIndex) => currentIndex !== index)
  commitState(selectedTableKey.value, nextLevels)
}

const addLevel = async () => {
  const nextColumn = currentTableConfig.value.levelColumns.find(
    (column) => !levels.value.includes(column.key)
  )

  if (!nextColumn) {
    return
  }

  commitState(selectedTableKey.value, [...levels.value, nextColumn.key])
  await nextTick()
  levelDropdownRefs.value.at(-1)?.openDropdown?.()
}

const retryCurrentState = () => {
  loadTreeForState({
    tableKey: selectedTableKey.value,
    levels: [...levels.value]
  })
}

const lazyLoadCharClassChildren = async (node) => {
  if (!node._lazy || node._childrenLoaded || node._loadingChildren) return

  node._loadingChildren = true
  try {
    const payload = buildCharClassTreePayload(activeTab.value, selectedTableKey.value, levels.value)
    const result = await loadFullTree({
      db_key: payload.db_key,
      table_name: payload.table_name,
      level_columns: node._lazyLevelColumns,
      data_columns: payload.data_columns,
      filters: node._lazyFilters
    })

    if (result.mode === 'lazy_fallback') {
      // Still too many rows — accumulate filters + shift level_columns further
      const bootstrap = result.lazy_bootstrap
      const children = bootstrap?.[node.name] || Object.values(bootstrap || {})[0] || []
      // level_columns[1] is the column consumed by this lazy_fallback response;
      // level_columns.slice(1) is the shifted list for the next call (matches API doc pattern)
      const nextCol = node._lazyLevelColumns[1]
      if (nextCol == null) {
        node.children = []
        node._childrenLoaded = true
        node._loadingChildren = false
        return
      }
      const nextShifted = node._lazyLevelColumns.slice(1)
      node.children = children.map(childName => ({
        id: childName,
        name: childName,
        _normalizedName: childName.toLowerCase(),
        chars: [],
        annotations: [],
        children: [],
        isLeaf: false,
        _lazy: true,
        _lazyFilters: { ...node._lazyFilters, [String(nextCol)]: [childName] },
        _lazyLevelColumns: nextShifted
      }))
    } else {
      // mode === 'full' — tree rooted at filter level, extract by node key
      const tableConfig = currentTableConfig.value
      const subtree = result.tree?.[node.name]
      node.children = normalizeCharClassTree(subtree || {}, {
        leafLevelColumnName: tableConfig?.leafLevelColumnName,
        leafData: tableConfig?.leafData,
      })
    }
    node._childrenLoaded = true
  } catch (error) {
    console.error('Lazy load char class children error:', error)
    node._loadError = error.message || '加載子節點失敗'
  } finally {
    node._loadingChildren = false
  }
}

const resetPageState = () => {
  selectedTableKey.value = ''
  levels.value = []
  showAnnotations.value = true
  searchQuery.value = ''
  loading.value = false
  loadError.value = ''
  levelDropdownRefs.value = []
  treeCache.value = {}
  activeTreeCacheKey.value = ''
  loadingCacheKey.value = ''
  loadRequestId += 1
}

const applyRouteState = () => {
  if (!route.path.endsWith('/explore/char-class')) {
    return
  }

  const parsedParams = parseCharClassParams(route)

  if (!parsedParams.table && !parsedParams.levels?.length) {
    return
  }

  const normalizedState = normalizeState(parsedParams.table, parsedParams.levels)
  commitState(normalizedState.tableKey, normalizedState.levels, {
    syncUrl: true,
    resetSearch: false
  })
}

watch(
  activeTab,
  (nextTab, previousTab) => {
    if (nextTab !== previousTab) {
      resetPageState()
    }
  }
)

watch(
  () => [activeTab.value, route.query.tab, route.query.table, route.query.levels],
  () => {
    applyRouteState()
  },
  { immediate: true }
)
</script>


$primary-blue: var(--color-primary);
$system-blue: #0a84ff;
$dark-blue: #0057d9;
$danger-red: #d70015;
$danger-text: #c21b31;

$text-primary: #1d1d1f;
$text-secondary: #3a3a3c;
$text-muted: #6e6e73;
$white: #fff;

$transition-fast: 0.2s;
$panel-radius: 28px;
$panel-radius-portrait: 24px;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin glass-blur($blur: 16px, $saturation: 180%) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

.char-class-page {
  width: 100%;
  padding: 12px 0 24px;
}

.page-shell {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 18px;
  align-items: start;
  width: min(94dvw, 1380px);
  margin: 0 auto;

  @media (orientation: portrait) {
    grid-template-columns: 1fr;
  }
}

.config-panel,
.tree-panel {
  height: 80dvh !important;
  padding: 22px;
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--text-dark);
  border-radius: $panel-radius;

  @media (orientation: portrait) {
    padding: 18px;
    border-radius: $panel-radius-portrait;
  }
}

.config-panel {
  @media (orientation: portrait) {
    max-height: 55dvh;
  }
}

.panel-header,
.tree-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;

  @media (orientation: portrait) {
    flex-direction: column;
    align-items: stretch;
  }
}

.tree-actions {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.panel-title-group,
.tree-title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title,
.tree-title {
  margin: 0;
  color: $text-primary;
  font-weight: 700;
}

.page-title {
  font-size: 25px;

  @media (orientation: portrait) {
    font-size: 24px;
  }
}

.tree-title {
  font-size: 20px;
}

.page-subtitle,
.tree-meta,
.section-hint,
.state-hint {
  margin: 0;
  color: $text-muted;
  font-size: 14px;
}

.tree-meta {
  font-size: 14px;
}

.tree-meta-separator {
  margin: 0 6px;
  opacity: 0.65;
}

.annotation-checkbox {
  white-space: nowrap;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.preset-section {
  flex-direction: row;
  align-items: center;
  gap: 12px 16px;

  .control-heading {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.control-heading {
  color: $text-secondary;
  font-size: 14px;
  font-weight: 700;
}

.preset-list {
  flex: 1 1 320px;
  min-width: 0;
  justify-content: flex-start;
  gap: 6px 12px;

  :deep(.liquid-radio-label) {
    padding: 4px 6px;
  }

  :deep(.liquid-radio-text) {
    font-size: 14px;
    white-space: nowrap;
  }
}

.levels-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
}

.add-level-button {
  color: $white;
  font-weight: 700;
  white-space: nowrap;
  background: var(--color-primary);
  border-color: rgba(10, 132, 255, 0.34);
  box-shadow: 0 12px 28px rgba(10, 132, 255, 0.12);

  &:hover:not(:disabled) {
    box-shadow: 0 16px 32px rgba(10, 132, 255, 0.16);
    transform: translateY(-1px);
  }

  &:disabled {
    box-shadow: none;
    opacity: 0.55;
  }
}

.levels-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 10px;
  align-items: stretch;
}

.level-row {
  min-width: 0;
  padding: 12px 6px;
  border-radius: 18px;
  container-type: inline-size;
}

.level-row-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px 10px;
  align-items: center;
  width: 100%;
  min-width: 0;

  @media (orientation: portrait) {
    justify-content: flex-start;
  }
}

.level-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 6px;
  color: $text-secondary;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--glass-border-weak);
  border-radius: 999px;
}

.level-select {
  width: 100%;
  min-width: 0;
}

.level-actions {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-self: end;

  @media (orientation: portrait) {
    justify-content: flex-end;
    margin-left: 0;
  }
}

.level-action {
  @include flex-center;

  width: 34px;
  height: 34px;
  color: $dark-blue;
  font-size: 0;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  background: linear-gradient(
    180deg,
    rgba(10, 132, 255, 0.18),
    rgba(255, 255, 255, 0.94)
  );
  border: 1px solid rgba(10, 132, 255, 0.2);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(10, 132, 255, 0.12);
  transition:
    transform $transition-fast ease,
    opacity $transition-fast ease,
    background $transition-fast ease,
    border-color $transition-fast ease,
    box-shadow $transition-fast ease;

  &::before {
    font-size: 15px;
    line-height: 1;
  }

  &-up::before {
    content: "\2191";
  }

  &-down::before {
    content: "\2193";
  }

  &-close::before {
    content: "\00D7";
  }

  &:hover:not(:disabled) {
    background: linear-gradient(
      180deg,
      rgba(10, 132, 255, 0.28),
      rgba(255, 255, 255, 0.98)
    );
    border-color: rgba(10, 132, 255, 0.38);
    box-shadow: 0 10px 20px rgba(10, 132, 255, 0.16);
    transform: translateY(-1px) scale(1.02);
  }

  &:disabled {
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.4;
  }

  &.danger {
    color: $danger-text;
    background: linear-gradient(
      180deg,
      rgba(215, 0, 21, 0.16),
      rgba(255, 255, 255, 0.94)
    );
    border-color: rgba(215, 0, 21, 0.2);
    box-shadow: 0 8px 18px rgba(215, 0, 21, 0.12);

    &:hover:not(:disabled) {
      background: linear-gradient(
        180deg,
        rgba(215, 0, 21, 0.24),
        rgba(255, 255, 255, 0.98)
      );
      border-color: rgba(215, 0, 21, 0.34);
      box-shadow: 0 10px 20px rgba(215, 0, 21, 0.16);
    }
  }
}

.limit-hint {
  font-size: 13px;
}

.tree-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.search-wrapper {
  position: relative;
  min-width: 240px;

  @media (orientation: portrait) {
    min-width: 100%;
  }
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  opacity: 0.6;
  transform: translateY(-50%);
}

.glass-input {
  padding: 11px 14px 11px 40px;
  color: $text-primary;
  background: var(--glass-light);
  border: 1px solid var(--glass-border-weak);
  border-radius: 16px;
  outline: none;
  transition:
    border-color $transition-fast ease,
    box-shadow $transition-fast ease,
    background $transition-fast ease;

  @include glass-blur;

  &:focus {
    border-color: rgba(10, 132, 255, 0.35);
    box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.08);
  }
}

.tree-body {
  flex: 1;
  margin-top: 18px;
  overflow: auto;

  @media (orientation: portrait) {
    min-height: 52dvh;
  }
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.state-block {
  @include flex-center;

  flex-direction: column;
  gap: 12px;
  min-height: 48dvh;
  padding: 24px;
  text-align: center;
}

.state-icon {
  font-size: 34px;
}

.state-message {
  margin: 0;
  color: $text-primary;
  font-size: 16px;
}

.retry-button {
  margin-top: 4px;
}
