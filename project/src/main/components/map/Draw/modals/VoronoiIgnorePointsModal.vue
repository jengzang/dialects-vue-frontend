<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    close-label="关闭"
    @update:modelValue="handleClose"
  >
    <template #header>
      <div class="scope-modal-header">
        <div class="scope-modal-header-main">
          <h3 class="scope-modal-title">{{ t('map.drawTab.voronoi.ignoreModalTitle') }}</h3>
          <div class="scope-search-field">
            <input
              v-model="searchText"
              type="text"
              class="scope-search-input"
              :placeholder="t('map.drawTab.voronoi.searchPlaceholder')"
            >
          </div>
        </div>
        <button
          type="button"
          class="close-btn close-btn-lg close-btn-inline"
          :aria-label="t('common.button.close')"
          @click="handleClose(false)"
        >
          ×
        </button>
      </div>
    </template>

    <template #default>
      <div class="voronoi-ignore-modal">
        <div class="feature-scope-summary glass-subpanel">
          <div class="summary-item">
            <span class="summary-label">{{ t('map.drawTab.voronoi.totalPoints') }}</span>
            <span class="summary-value summary-number">{{ locations.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('map.drawTab.voronoi.ignoredPoints') }}</span>
            <span class="summary-value summary-number">{{ selectedLocations.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('map.drawTab.voronoi.partitionGroups') }}</span>
            <span class="summary-value summary-number">{{ regions.length }}</span>
          </div>
        </div>

        <div class="scope-toolbar glass-subpanel">
          <div class="scope-toolbar-main">
            <div class="scope-toolbar-info">
              {{ t('map.drawTab.voronoi.ignoreSelectedCount', { count: selectedLocations.length }) }}
            </div>
          </div>
          <button class="scope-clear-btn" type="button" @click="clearSelection">
            {{ t('map.drawTab.voronoi.clearSelection') }}
          </button>
        </div>

        <div class="scope-grid">
          <section class="scope-panel glass-subpanel">
            <div class="scope-panel-title">{{ t('map.drawTab.voronoi.regionTitle') }}</div>
            <div v-if="filteredRegionTree.length === 0" class="feature-scope-state main-list-state">
              <div class="main-list-state-title">{{ t('map.drawTab.voronoi.emptyRegions') }}</div>
            </div>

            <div v-else class="scope-tree-list ui-scrollbar">
              <template v-for="node in filteredRegionTree" :key="node.fullPath">
                <div class="scope-tree-node" :style="{ paddingLeft: `${node.depth * 18}px` }">
                  <button
                    class="scope-selection-item scope-tree-item"
                    :class="[`state-${node.state}`]"
                    type="button"
                    @click="toggleRegion(node)"
                  >
                    <div class="scope-tree-main">
                      <span v-if="node.children.length > 0" class="scope-tree-caret">▾</span>
                      <span v-else class="scope-tree-caret scope-tree-caret-empty"></span>
                      <span class="scope-selection-title">{{ node.label }}</span>
                    </div>
                    <span class="scope-selection-meta">
                      {{ t('map.drawTab.voronoi.regionMeta', { locations: node.locationCount, records: node.recordCount }) }}
                    </span>
                    <span class="scope-selection-status">{{ t(`map.drawTab.voronoi.regionStates.${node.state}`) }}</span>
                  </button>
                </div>
              </template>
            </div>
          </section>

          <section class="scope-panel glass-subpanel">
            <div class="scope-panel-title">{{ t('map.drawTab.voronoi.locationTitle') }}</div>
            <div v-if="filteredLocations.length === 0" class="feature-scope-state main-list-state">
              <div class="main-list-state-title">{{ t('map.drawTab.voronoi.emptyLocations') }}</div>
            </div>
            <div v-else v-bind="locationContainerProps" class="scope-virtual-list ui-scrollbar">
              <div v-bind="locationWrapperProps" class="scope-virtual-wrapper">
                <CheckBox
                  v-for="item in virtualLocations"
                  :key="item.data.name"
                  :model-value="selectedLocationSet.has(item.data.name)"
                  class="scope-checkbox-item scope-checkbox-item--virtual"
                  @update:modelValue="toggleLocation(item.data.name)"
                >
                  <span class="scope-selection-copy">
                    <span class="scope-selection-title">{{ item.data.name }}</span>
                    <span class="scope-selection-meta">
                      {{ t('map.drawTab.voronoi.locationMeta', { records: item.data.recordCount, regions: formatRegionNames(item.data.regionNames) || t('map.drawTab.voronoi.emptySummary') }) }}
                    </span>
                  </span>
                </CheckBox>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="glass-button" type="button" @click="handleClose(false)">
          取消
        </button>
        <button
          class="glass-button scope-confirm-btn"
          data-variant="primary"
          type="button"
          @click="handleConfirm"
        >
          {{ t('map.drawTab.voronoi.confirmIgnore') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useVirtualList } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  regions: { type: Array, default: () => [] },
  locations: { type: Array, default: () => [] },
  ignoredLocations: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t, locale } = useI18n()

const LOCATION_ITEM_HEIGHT = 76

const selectedLocations = ref([])
const searchText = ref('')
const selectedLocationSet = computed(() => new Set(selectedLocations.value))
const normalizedSearchText = computed(() => searchText.value.trim().toLowerCase())

function matchesSearch(value) {
  if (!normalizedSearchText.value) {
    return true
  }

  return String(value || '').toLowerCase().includes(normalizedSearchText.value)
}

const regionOptions = computed(() => {
  return props.regions.map((region) => {
    const names = new Set(region.rows.map((row) => String(row['簡稱'] || '').trim()).filter(Boolean))
    const matchedCount = Array.from(names).filter((name) => selectedLocationSet.value.has(name)).length
    let state = 'none'
    if (matchedCount > 0 && matchedCount < names.size) {
      state = 'partial'
    } else if (names.size > 0 && matchedCount === names.size) {
      state = 'full'
    }
    return {
      ...region,
      locationNames: Array.from(names),
      state,
    }
  })
})

const regionTree = computed(() => {
  const roots = []
  const nodeMap = new Map()

  const ensureNode = (label, fullPath, depth) => {
    if (!nodeMap.has(fullPath)) {
      nodeMap.set(fullPath, {
        label,
        fullPath,
        depth,
        children: [],
        locationNames: new Set(),
        recordCount: 0,
      })
    }
    return nodeMap.get(fullPath)
  }

  regionOptions.value.forEach((region) => {
    const parts = String(region.name || '')
      .split('-')
      .map((item) => item.trim())
      .filter(Boolean)

    if (parts.length === 0) return

    let parent = null
    const fullParts = []

    parts.forEach((part, index) => {
      fullParts.push(part)
      const fullPath = fullParts.join('-')
      const node = ensureNode(part, fullPath, index)

      if (parent && !parent.children.includes(node)) {
        parent.children.push(node)
      } else if (!parent && !roots.includes(node)) {
        roots.push(node)
      }

      parent = node
    })

    if (parent) {
      region.locationNames.forEach((name) => parent.locationNames.add(name))
      parent.recordCount += region.recordCount
    }
  })

  const computeAggregates = (node) => {
    const aggregatedLocations = new Set(node.locationNames)
    let aggregatedRecords = node.recordCount

    node.children.forEach((child) => {
      const childResult = computeAggregates(child)
      childResult.locationNames.forEach((name) => aggregatedLocations.add(name))
      aggregatedRecords += childResult.recordCount
    })

    const matchedCount = Array.from(aggregatedLocations).filter((name) => selectedLocationSet.value.has(name)).length
    let state = 'none'
    if (matchedCount > 0 && matchedCount < aggregatedLocations.size) {
      state = 'partial'
    } else if (aggregatedLocations.size > 0 && matchedCount === aggregatedLocations.size) {
      state = 'full'
    }

    node.aggregatedLocationNames = Array.from(aggregatedLocations)
    node.locationCount = aggregatedLocations.size
    node.aggregatedRecordCount = aggregatedRecords
    node.state = state

    return {
      locationNames: aggregatedLocations,
      recordCount: aggregatedRecords,
    }
  }

  roots.forEach((node) => computeAggregates(node))

  const flattened = []
  const walk = (node) => {
    flattened.push({
      ...node,
      children: [...node.children],
      locationNames: [...node.aggregatedLocationNames],
      recordCount: node.aggregatedRecordCount,
    })
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return flattened
})

const filteredRegionTree = computed(() => {
  if (!normalizedSearchText.value) {
    return regionTree.value
  }

  const matchesNode = (node) => {
    if (matchesSearch(node.label)) {
      return true
    }

    return node.locationNames.some((name) => matchesSearch(name))
  }

  return regionTree.value.filter((node) => {
    if (matchesNode(node)) {
      return true
    }

    const nodePrefix = `${node.fullPath}-`
    return regionTree.value.some((candidate) => candidate.fullPath.startsWith(nodePrefix) && matchesNode(candidate))
  })
})

const filteredLocations = computed(() => {
  if (!normalizedSearchText.value) {
    return props.locations
  }

  return props.locations.filter((location) => matchesSearch(location.name))
})

const { list: virtualLocations, containerProps: locationContainerProps, wrapperProps: locationWrapperProps } = useVirtualList(
  filteredLocations,
  {
    itemHeight: LOCATION_ITEM_HEIGHT,
    overscan: 10,
  }
)

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedLocations.value = [...props.ignoredLocations]
    searchText.value = ''
  }
})

function clearSelection() {
  selectedLocations.value = []
}

function toggleRegion(region) {
  const next = new Set(selectedLocations.value)
  const allSelected = region.state === 'full'

  region.locationNames.forEach((locationName) => {
    if (allSelected) {
      next.delete(locationName)
    } else {
      next.add(locationName)
    }
  })

  selectedLocations.value = Array.from(next)
}

function toggleLocation(locationName) {
  const next = new Set(selectedLocations.value)
  if (next.has(locationName)) {
    next.delete(locationName)
  } else {
    next.add(locationName)
  }
  selectedLocations.value = Array.from(next)
}

function handleClose(value = false) {
  emit('update:modelValue', value)
}

function handleConfirm() {
  emit('confirm', [...selectedLocations.value])
  handleClose(false)
}

function formatRegionNames(regionNames) {
  const names = Array.isArray(regionNames) ? regionNames.filter(Boolean) : []
  return names.join(locale.value === 'en' ? ', ' : '、')
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.voronoi-ignore-modal,
.feature-scope-summary,
.scope-toolbar,
.scope-grid,
.scope-panel,
.scope-tree-list {
  min-width: 0;
}

.voronoi-ignore-modal {
  @include flex-col;
  gap: 18px;
}

.scope-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;

  &-main {
    display: flex;
    flex: 1;
    min-width: 0;
    gap: 12px;
  }
}

.scope-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: $text-strong;
  min-width: 100px;
}

.scope-search-field {
  width: 100%;

  .scope-search-input {
    width: 80%;
    height: 38px;
    border: 1px solid $muted-active;
    border-radius: var(--radius-md);
    padding: 0 14px;
    font-size: 13px;
    color: $text-strong;
    background: $glass-strong;

    &:focus {
      outline: none;
      border-color: rgba(var(--color-primary-rgb), 0.48);
      box-shadow: 0 0 0 3px $primary-border;
    }
  }
}

.feature-scope-summary {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 12px;
  padding: 18px 20px;
  overflow-x: auto;

  .summary-item {
    flex: 1 1 0;
    @include flex-col;
    gap: 2px;
  }

  .summary-label {
    font-size: 12px;
    color: $text-muted;
  }

  .summary-value {
    font-size: 15px;
    font-weight: 700;
    color: $text-strong;
  }

  .summary-number {
    color: $primary;
  }
}

.scope-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;

  &-main {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
  }

  &-info {
    font-weight: 700;
    color: $text-strong;
  }
}

.scope-clear-btn {
  border: none;
  background: transparent;
  color: $primary;
  font-weight: 700;
  cursor: pointer;
}

.scope-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}

.scope-panel {
  @include flex-col;
  gap: 10px;
  max-height: min(45dvh, 34rem);
  overflow: hidden;
  padding: 16px;

  &-title {
    font-size: 14px;
    font-weight: 800;
    color: $text-strong;
  }
}

.scope-tree-list {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.scope-checkbox-item {
  @include flex-col;
  gap: 8px;

  &--virtual {
    min-height: 64px;
    box-sizing: border-box;
  }
}

.scope-virtual-list {
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.scope-virtual-wrapper {
  width: 100%;
}

.scope-selection-item,
.scope-checkbox-item {
  border: 1px solid $muted-active;
  border-radius: 14px;
  background: var(--glass-60);
  padding: 12px;
}

.scope-selection-item {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 6px;
  cursor: pointer;
  text-align: left;
  color: $text-strong;

  &.state-full {
    border-color: $primary-ring;
    background: $primary-border;
  }

  &.state-partial {
    border-color: rgba(var(--color-warning-rgb), 0.5);
    background: rgba(var(--color-warning-rgb), 0.12);
  }
}

.scope-tree-main,
.scope-checkbox-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  color: var(--color-primary-hover);
  gap: 10px;
}

.scope-tree-caret {
  width: 1rem;
  flex: 0 0 1rem;
  color: $text-muted;

  &-empty {
    width: 1rem;
    flex: 0 0 1rem;
    visibility: hidden;
  }
}

.scope-selection-copy {
  display: flex;
  gap: 8px;

  .scope-selection-title {
    font-weight: 800;
    color: $text-strong;
    color: var(--color-primary-hover);

  }

  .scope-selection-meta {
    font-size: 12px;
    color: $text-muted;
    color: var(--color-primary-hover);

  }
}

.scope-selection-status {
  font-size: 12px;
  color: $text-muted;
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.glass-subpanel {
  padding: 10px 20px;
}
</style>
