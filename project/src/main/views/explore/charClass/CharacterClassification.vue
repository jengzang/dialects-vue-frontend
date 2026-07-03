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
import { loadFullTree } from '@/api'
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
    const result = await loadFullTree(
      buildCharClassTreePayload(activeTab.value, state.tableKey, state.levels)
    )

    if (requestId !== loadRequestId) {
      return
    }

    if (result.mode === 'lazy_fallback') {
      const bootstrap = result.lazy_bootstrap
      const shifted = result.shifted_level_columns || []
      if (bootstrap && bootstrap.children && bootstrap.children.length > 0) {
        const filterCol = shifted[0]
        const nodes = bootstrap.children.map(name => ({
          id: name,
          name,
          _normalizedName: name.toLowerCase(),
          chars: [],
          annotations: [],
          children: [],
          isLeaf: false,
          _lazy: true,
          _lazyFilterCol: filterCol,
          _lazyLevelColumns: shifted
        }))
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
    } else {
      if (!result?.tree) {
        throw new Error(t('charClass.states.dataFormatError'))
      }

      treeCache.value = {
        ...treeCache.value,
        [cacheKey]: normalizeCharClassTree(result.tree, {
          leafLevelColumnName: tableConfig?.leafLevelColumnName,
          leafData: tableConfig?.leafData,
        })
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
      ...payload,
      level_columns: node._lazyLevelColumns,
      filters: { [String(node._lazyFilterCol)]: [node.name] }
    })

    if (result.mode === 'lazy_fallback') {
      const bootstrap = result.lazy_bootstrap
      const shifted = result.shifted_level_columns || []
      const filterCol = shifted[0]
      if (bootstrap && bootstrap.children && bootstrap.children.length > 0) {
        node.children = bootstrap.children.map(childName => ({
          id: childName,
          name: childName,
          _normalizedName: childName.toLowerCase(),
          chars: [],
          annotations: [],
          children: [],
          isLeaf: false,
          _lazy: true,
          _lazyFilterCol: filterCol,
          _lazyLevelColumns: shifted
        }))
      }
    } else {
      // mode === 'full' — charClass tree top-level entries are the direct children
      const tableConfig = currentTableConfig.value
      node.children = normalizeCharClassTree(result.tree || {}, {
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

<style scoped lang="scss">
.char-class-page {
  width: 100%;
  padding: 12px 0 24px;
}

.page-shell {
  width: min(94dvw, 1380px);
  margin: 0 auto;
  display: grid;
  gap: 18px;
  grid-template-columns: 1fr 2fr;
  align-items: start;
}

.config-panel,
.tree-panel {
  border-radius: 28px;
  padding: 22px;
  color: var(--text-dark);
  height: 80dvh !important;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel-header,
.tree-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tree-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
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
  color: #1d1d1f;
}

.page-title {
  font-size: 25px;
  font-weight: 700;
}

.tree-title {
  font-size: 20px;
  font-weight: 700;
}

.page-subtitle,
.tree-meta,
.section-hint,
.state-hint {
  font-size: 14px;
  margin: 0;
  color: #6e6e73;
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
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px 16px;
}

.control-heading {
  font-size: 14px;
  font-weight: 700;
  color: #3a3a3c;
}

.preset-section .control-heading {
  flex: 0 0 auto;
  white-space: nowrap;
}

.preset-list {
  flex: 1 1 320px;
  min-width: 0;
  justify-content: flex-start;
  gap: 6px 12px;
}

.preset-list :deep(.liquid-radio-label) {
  padding: 4px 6px;
}

.preset-list :deep(.liquid-radio-text) {
  font-size: 14px;
  white-space: nowrap;
}

.levels-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.add-level-button {
  white-space: nowrap;
  border-color: rgba(10, 132, 255, 0.34);
  background:  #007bffea;
  color: white;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(10, 132, 255, 0.12);
}

.add-level-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px rgba(10, 132, 255, 0.16);
}

.add-level-button:disabled {
  opacity: 0.55;
  box-shadow: none;
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
  align-items: center;
  gap: 8px 10px;
  width: 100%;
  min-width: 0;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--glass-border-weak);
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #3a3a3c;
}

.level-select {
  min-width: 0;
  width: 100%;
}

.level-actions {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  justify-self: end;
}

.level-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(10, 132, 255, 0.2);
  background: linear-gradient(180deg, rgba(10, 132, 255, 0.18), rgba(255, 255, 255, 0.94));
  color: #0057d9;
  cursor: pointer;
  font-size: 0;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(10, 132, 255, 0.12);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.level-action::before {
  font-size: 15px;
  line-height: 1;
}

.level-action-up::before {
  content: "\2191";
}

.level-action-down::before {
  content: "\2193";
}

.level-action-close::before {
  content: "\00D7";
}

.level-action:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  border-color: rgba(10, 132, 255, 0.38);
  background: linear-gradient(180deg, rgba(10, 132, 255, 0.28), rgba(255, 255, 255, 0.98));
  box-shadow: 0 10px 20px rgba(10, 132, 255, 0.16);
}

.level-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.level-action.danger {
  border-color: rgba(215, 0, 21, 0.2);
  background: linear-gradient(180deg, rgba(215, 0, 21, 0.16), rgba(255, 255, 255, 0.94));
  color: #c21b31;
  box-shadow: 0 8px 18px rgba(215, 0, 21, 0.12);
}

.level-action.danger:hover:not(:disabled) {
  border-color: rgba(215, 0, 21, 0.34);
  background: linear-gradient(180deg, rgba(215, 0, 21, 0.24), rgba(255, 255, 255, 0.98));
  box-shadow: 0 10px 20px rgba(215, 0, 21, 0.16);
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
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.6;
}

.glass-input {
  padding: 11px 14px 11px 40px;
  border-radius: 16px;
  border: 1px solid var(--glass-border-weak);
  background: var(--glass-light);
  color: #1d1d1f;
  outline: none;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.glass-input:focus {
  border-color: rgba(10, 132, 255, 0.35);
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.08);
}

.tree-body {
  margin-top: 18px;
  flex: 1;
  overflow: auto;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.state-block {
  min-height: 48dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
}

.state-icon {
  font-size: 34px;
}

.state-message {
  margin: 0;
  font-size: 16px;
  color: #1d1d1f;
}

.retry-button {
  margin-top: 4px;
}

@media (orientation: portrait) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .config-panel,
  .tree-panel {
    padding: 18px;
    border-radius: 24px;
  }

  .config-panel {
    max-height: 55dvh;
  }

  .panel-header,
  .tree-header {
    flex-direction: column;
    align-items: stretch;
  }

  .level-row-header {
    justify-content: flex-start;
  }

  .search-wrapper {
    min-width: 100%;
  }

  .level-actions {
    justify-content: flex-end;
    margin-left: 0;
  }

  .tree-body {
    min-height: 52dvh;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>