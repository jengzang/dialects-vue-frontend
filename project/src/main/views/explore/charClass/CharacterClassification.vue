<template>
  <div class="char-class-page">
    <div class="page-shell">
      <section class="config-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h1 class="page-title"><BarIcon :icon="activePageIcon" />{{ t(currentPageConfig.titleKey) }}</h1>
            <!-- <p class="page-subtitle">{{ t('charClass.common.subtitle') }}</p> -->
          </div>
        </div>

        <div v-if="hasMultipleTables" class="control-section table-section">
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

        <div class="control-section levels-section glass-panel">
          <div class="levels-header">
            <div>
              <div class="control-heading">{{ t('charClass.common.levels') }}</div>
              <div class="section-hint">{{ t('charClass.common.levelsHint') }}</div>
            </div>

            <button
              type="button"
              class="action-btn add-level-button"
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
              class="level-row glass-subpanel"
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
                    class="glass-button level-action level-action-up"
                    :aria-label="t('charClass.actions.moveUp')"
                    :disabled="index === 0"
                    :title="t('charClass.actions.moveUp')"
                    @click="moveLevel(index, -1)"
                  >
                    <PhArrowUp :size="22" weight="bold" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="glass-button level-action level-action-down"
                    :aria-label="t('charClass.actions.moveDown')"
                    :disabled="index === levels.length - 1"
                    :title="t('charClass.actions.moveDown')"
                    @click="moveLevel(index, 1)"
                  >
                    <PhArrowDown :size="22" weight="bold" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="glass-button level-action danger level-action-close"
                    :aria-label="t('charClass.actions.removeLevel')"
                    :disabled="levels.length <= 1"
                    :title="t('charClass.actions.removeLevel')"
                    @click="removeLevel(index)"
                  >
                    <PhX :size="22" weight="bold" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!canAddLevel" class="section-hint limit-hint">
            {{ t('charClass.states.noMoreLevels') }}
          </div>
        </div>

        <div class="query-actions">
          <button
            type="button"
            class="action-btn query-button"
            :disabled="loading"
            @click="submitQuery"
          >
            {{ t(loading ? 'charClass.actions.querying' : 'charClass.actions.query') }}
          </button>
        </div>
      </section>

      <section
        v-if="submittedState"
        class="tree-panel glass-panel"
      >
        <div class="tree-header">
          <div class="tree-title-group">
            <h3 class="tree-title">{{ t('charClass.common.resultsTitle') }}</h3>
            <p class="tree-meta">
              {{ t(resultTableConfig.labelKey) }}
              <span class="tree-meta-separator">·</span>
              {{ resultPresetLabel || t('charClass.common.custom') }}
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
              <span class="search-icon"><InlineIcon icon="🔍" /></span>
              <input
                v-model="searchQuery"
                type="text"
                class="glass-field"
                data-shape="search"
                :placeholder="t('charClass.search.placeholder')"
                :disabled="loading"
              />
            </div>
          </div>
        </div>

        <div class="tree-body ui-scrollbar">
          <div v-if="loading" class="state-block">
            <div class="ui-loading--page" aria-hidden="true"></div>
            <p>{{ t('charClass.states.loading', { name: t(resultTableConfig.labelKey) }) }}</p>
            <p class="state-hint">{{ t('charClass.states.loadingHint') }}</p>
          </div>

          <div v-else-if="loadError" class="state-block">
            <div class="state-icon"><InlineIcon icon="⚠️" /></div>
            <p class="state-message">{{ loadError }}</p>
            <button type="button" class="glass-button retry-button" @click="retryCurrentState">
              {{ t('charClass.actions.retry') }}
            </button>
          </div>

          <div v-else-if="displayTree.length === 0" class="state-block">
            <div class="state-icon"><InlineIcon :icon="searchQuery.trim() ? '🔎' : '📚'" /></div>
            <p class="state-message">
              {{ searchQuery.trim() ? t('charClass.search.noResults') : t('charClass.states.emptyTree') }}
            </p>
            <p v-if="!searchQuery.trim()" class="state-hint">{{ t('charClass.states.emptyTreeHint') }}</p>
          </div>

          <div v-else class="tree-container">
            <CharTreeItem
              v-for="item in displayTree"
              :key="`${activeTreeCacheKey}-${item.id}`"
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
import BarIcon from '@/components/common/BarIcon.vue'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { PhArrowDown, PhArrowUp, PhX } from '@phosphor-icons/vue'
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
const submittedState = ref(null)

let loadRequestId = 0

const pageTitleIcons = {
  zhonggu: '📜',
  shanggu: '🏛️',
  jingu: '📖',
  yueyun: '🎵'
}

const currentPageConfig = computed(() => getCharClassPageConfig(activeTab.value))
const activePageIcon = computed(() => pageTitleIcons[activeTab.value] || pageTitleIcons.zhonggu)
const hasMultipleTables = computed(() => Object.keys(currentPageConfig.value.tables).length > 1)
const currentTableConfig = computed(() => {
  const normalizedTableKey = sanitizeCharClassTableKey(currentPageConfig.value, selectedTableKey.value)
  return currentPageConfig.value.tables[normalizedTableKey]
})
const activePresetKey = computed(() => findCharClassPresetKey(currentTableConfig.value, levels.value))
const resultTableConfig = computed(() => submittedState.value
  ? getCharClassPageConfig(submittedState.value.pageKey).tables[submittedState.value.tableKey]
  : null)
const resultPresetLabel = computed(() => {
  if (!submittedState.value) return ''
  const presetKey = findCharClassPresetKey(resultTableConfig.value, submittedState.value.levels)
  const preset = resultTableConfig.value.presetMap[presetKey]
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

const buildCacheKey = (state) => `${state.pageKey}:${state.tableKey}:${state.levels.join('|')}`

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
  const cacheKey = buildCacheKey(state)
  if (loadingCacheKey.value === cacheKey) return
  const requestId = ++loadRequestId
  activeTreeCacheKey.value = cacheKey
  loadError.value = ''

  if (treeCache.value[cacheKey]) {
    loading.value = false
    loadingCacheKey.value = ''
    return
  }

  loading.value = true
  loadingCacheKey.value = cacheKey

  try {
    const payload = buildCharClassTreePayload(state.pageKey, state.tableKey, state.levels)
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

const commitState = (nextTableKey, nextLevels) => {
  const normalizedState = normalizeState(nextTableKey, nextLevels)
  selectedTableKey.value = normalizedState.tableKey
  levels.value = [...normalizedState.levels]
}

const submitQuery = () => {
  const state = {
    pageKey: activeTab.value,
    ...normalizeState(selectedTableKey.value, levels.value)
  }
  const queryChanged = !submittedState.value || buildCacheKey(submittedState.value) !== buildCacheKey(state)
  submittedState.value = state
  if (queryChanged) searchQuery.value = ''
  loadTreeForState(state)
  syncUrlToState(state)
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
  if (submittedState.value) loadTreeForState(submittedState.value)
}

const lazyLoadCharClassChildren = async (node) => {
  if (!node._lazy || node._childrenLoaded || node._loadingChildren) return

  node._loadingChildren = true
  const state = submittedState.value
  const tableConfig = getCharClassPageConfig(state.pageKey).tables[state.tableKey]
  try {
    const payload = buildCharClassTreePayload(state.pageKey, state.tableKey, state.levels)
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
      const subtree = result.tree?.[node.name]
      node.children = normalizeCharClassTree(subtree || {}, {
        leafLevelColumnName: tableConfig?.leafLevelColumnName,
        leafData: tableConfig?.leafData,
        collapseLeafLevel: state.levels.length === 1,
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
  submittedState.value = null
  loadRequestId += 1
}

const applyRouteState = () => {
  if (!route.path.endsWith('/explore/char-class')) {
    return
  }

  const parsedParams = parseCharClassParams(route)

  if (!parsedParams.table && !parsedParams.levels?.length) {
    resetPageState()
    commitState('', [])
    return
  }

  const normalizedState = normalizeState(parsedParams.table, parsedParams.levels)
  // Our own URL update must not replace edits made while navigation completes.
  const routeState = { pageKey: activeTab.value, ...normalizedState }
  if (submittedState.value && buildCacheKey(submittedState.value) === buildCacheKey(routeState)) return
  commitState(normalizedState.tableKey, normalizedState.levels)
  submitQuery()
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

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-blue: var(--color-primary);
$system-blue: var(--color-primary);
$dark-blue: var(--color-primary-hover);
$danger-red: var(--color-error-light);
$danger-text: var(--color-error-dark);

$text-primary: var(--text-primary);
$text-secondary: var(--text-primary);
$text-muted: var(--text-secondary);
$white: var(--text-white);

$transition-fast: 0.2s;
$panel-radius: 28px;
$panel-radius-portrait: 24px;

.char-class-page {
  @include flex-center;
  width: 100%;
  min-height: 80dvh;
  padding: 12px 0 24px;
}

.page-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  align-items: start;
  width: min(94dvw, 1380px);
  margin: 0 auto;
}

.config-panel {
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-width: 0;
}

.levels-section,
.tree-panel {
  padding: 22px;
  color: var(--text-dark);
  border-radius: $panel-radius;

  @media (max-aspect-ratio: 1 / 1) {
    padding: 18px;
    border-radius: $panel-radius-portrait;
  }
}

.query-actions {
  @include flex-center;
}

.panel-header {
  @include flex-center;
  text-align: center;
}

.tree-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-aspect-ratio: 1 / 1) {
    flex-direction: column;
    align-items: stretch;
  }
}

.tree-actions {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.panel-title-group,
.tree-title-group {
  @include flex-col;
  gap: 6px;
}

.tree-title {
  margin: 0;
  color: $text-primary;
  font-weight: 700;
}

.page-title {
  margin: 0;
  color: $text-primary;
  font-size: 25px;

  @media (max-aspect-ratio: 1 / 1) {
    font-size: 20px;
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
  @include flex-col;
  gap: 12px;
}

.table-section {
  width: min(100%, 420px);
  align-items: center;
}

.levels-section {
  width: 100%;
  box-sizing: border-box;
}

.preset-section {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
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
  flex: 0 1 auto;
  min-width: 0;
  justify-content: center;
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
  align-items: center;
  justify-content: space-between;
}

.add-level-button {
  flex-shrink: 0;
  color: var(--action-primary-text);
  padding: 4px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  background: var(--color-primary);
  border-color: rgba(var(--color-primary-rgb), 0.34);
  box-shadow: 0 12px 28px rgba(var(--color-primary-rgb), 0.12);

  &:hover:not(:disabled) {
    box-shadow: 0 16px 32px rgba(var(--color-primary-rgb), 0.16);
    transform: translateY(-1px);
  }

  &:disabled {
    box-shadow: none;
    opacity: 0.55;
  }
}

.levels-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
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

  @media (max-aspect-ratio: 1 / 1) {
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
  background: var(--glass-70);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-pill);
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

  @media (max-aspect-ratio: 1 / 1) {
    justify-content: flex-end;
    margin-left: 0;
  }
}

.level-action {
  --glass-button-padding: 0;
  --glass-button-border-radius: var(--radius-md);
  --glass-button-color: var(--color-primary-hover);
  --glass-button-hover-shadow: none;

  width: 36px;
  height: 36px;
  flex-shrink: 0;

  &:focus-visible {
    outline: 2px solid var(--border-control-focus);
    outline-offset: 2px;
  }

  &.danger {
    --glass-button-color: var(--color-error);
  }
}

.limit-hint {
  font-size: 13px;
}

.tree-panel {
  @include flex-col;
  min-width: 0;
}

.search-wrapper {
  position: relative;
  min-width: 240px;

  @media (max-aspect-ratio: 1 / 1) {
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

.search-wrapper .glass-field {
  --glass-field-width: auto;
  --glass-field-padding: 11px 14px 11px 40px;
}

.tree-body {
  flex: 1;
  margin-top: 18px;
  overflow-x: auto;

  @media (max-aspect-ratio: 1 / 1) {
    min-height: 52dvh;
  }
}

.tree-container {
  @include flex-col;
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
</style>
