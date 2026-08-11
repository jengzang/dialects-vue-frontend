<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <template #header>
      <div class="scope-modal-header">
        <div class="scope-modal-header-main">
          <h3 class="scope-modal-title">{{ modalTitle }}</h3>
          <div class="scope-search-field">
            <input
              v-model="searchText"
              type="text"
              class="scope-search-input"
              :placeholder="t('map.customTab.scopeModal.searchPlaceholder')"
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
      <div class="feature-scope-modal">
        <div class="feature-scope-summary glass-subpanel">
          <div class="summary-item">
            <span class="summary-label">{{ t('map.customTab.scopeModal.summary.phonology') }}</span>
            <span class="summary-value">{{ featureMeta?.phonology || t('map.customTab.scopeModal.summary.empty') }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('map.customTab.scopeModal.summary.records') }}</span>
            <span class="summary-value summary-number">{{ featureMeta?.recordCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('map.customTab.scopeModal.summary.locations') }}</span>
            <span class="summary-value summary-number">{{ featureMeta?.locationCount || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('map.customTab.scopeModal.summary.regions') }}</span>
            <span class="summary-value summary-number">{{ featureMeta?.regionCount || 0 }}</span>
          </div>
        </div>

        <div v-if="loading" class="feature-scope-state main-list-state glass-subpanel">
          <div class="main-list-state-title">{{ t('map.customTab.scopeModal.loading') }}</div>
        </div>

        <div v-else-if="errorMessage" class="feature-scope-state main-list-state glass-subpanel" data-state="error">
          <div class="main-list-state-title">{{ t('map.customTab.scopeModal.loadFailed') }}</div>
          <p class="main-list-state-text">{{ errorMessage }}</p>
        </div>

        <template v-else>
          <div class="scope-toolbar glass-subpanel">
            <div class="scope-toolbar-main">
              <div class="scope-toolbar-info">
                {{ t('map.customTab.scopeModal.selectedCount', { count: selectedLocations.length }) }}
              </div>
              <CheckBox
                :model-value="recognizeHierarchy"
                :label="t('map.customTab.scopeModal.recognizeHierarchy')"
                class="scope-toggle-label"
                @update:modelValue="recognizeHierarchy = $event"
              />
            </div>
            <button class="scope-clear-btn" type="button" @click="clearSelection">
              {{ t('map.customTab.scopeModal.clearSelection') }}
            </button>
          </div>

          <div class="scope-grid">
            <section class="scope-panel glass-subpanel">
              <div class="scope-panel-title">{{ t('map.customTab.scopeModal.regionTitle') }}</div>
              <div v-if="filteredRegionsEmpty" class="feature-scope-state main-list-state">
                <div class="main-list-state-title">{{ t('map.customTab.scopeModal.emptyRegions') }}</div>
              </div>

              <template v-else-if="recognizeHierarchy">
                <div class="scope-tree-list ui-scrollbar">
                  <template v-for="node in filteredRegionTree" :key="node.fullPath">
                    <div class="scope-tree-node" :style="{ paddingLeft: `${node.depth * 18}px` }">
                      <button
                        class="scope-selection-item scope-tree-item"
                        :class="[`state-${node.state}`]"
                        type="button"
                        @click="toggleTreeNode(node)"
                      >
                        <div class="scope-tree-main">
                          <span v-if="node.children.length > 0" class="scope-tree-caret">▾</span>
                          <span v-else class="scope-tree-caret scope-tree-caret-empty"></span>
                          <span class="scope-selection-title">{{ node.label || t('map.customTab.scopeModal.summary.empty') }}</span>
                        </div>
                        <span class="scope-selection-meta">
                          {{ t('map.customTab.scopeModal.regionMeta', { locations: node.locationCount, records: node.recordCount }) }}
                        </span>
                        <span class="scope-selection-status">{{ t(`map.customTab.scopeModal.regionStates.${node.state}`) }}</span>
                      </button>
                    </div>
                  </template>
                </div>
              </template>

              <template v-else>
                <div class="scope-region-list ui-scrollbar">
                  <button
                    v-for="region in filteredRegionOptions"
                    :key="region.name"
                    class="scope-selection-item"
                    :class="[`state-${region.state}`]"
                    type="button"
                    @click="toggleRegion(region)"
                  >
                    <span class="scope-selection-title">{{ region.name || t('map.customTab.scopeModal.summary.empty') }}</span>
                    <span class="scope-selection-meta">
                      {{ t('map.customTab.scopeModal.regionMeta', { locations: region.locationCount, records: region.recordCount }) }}
                    </span>
                    <span class="scope-selection-status">{{ t(`map.customTab.scopeModal.regionStates.${region.state}`) }}</span>
                  </button>
                </div>
              </template>
            </section>

            <section class="scope-panel glass-subpanel">
              <div class="scope-panel-title">{{ t('map.customTab.scopeModal.locationTitle') }}</div>
              <div v-if="filteredLocations.length === 0" class="feature-scope-state main-list-state">
                <div class="main-list-state-title">{{ t('map.customTab.scopeModal.emptyLocations') }}</div>
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
                        {{ t('map.customTab.scopeModal.locationMeta', { records: item.data.recordCount, regions: formatRegionNames(item.data.regionNames) || t('map.customTab.scopeModal.summary.empty') }) }}
                      </span>
                    </span>
                  </CheckBox>
                </div>
              </div>
            </section>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="glass-button" type="button" @click="handleClose(false)">
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="glass-button scope-confirm-btn"
          data-variant="primary"
          type="button"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          {{ t('map.customTab.scopeModal.confirm') }}
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
  modelValue: {
    type: Boolean,
    default: false
  },
  featureMeta: {
    type: Object,
    default: () => ({})
  },
  regions: {
    type: Array,
    default: () => []
  },
  locations: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const { t, locale } = useI18n()

const LOCATION_ITEM_HEIGHT = 76

const selectedLocations = ref([])
const searchText = ref('')
const recognizeHierarchy = ref(false)
const selectedLocationSet = computed(() => new Set(selectedLocations.value))
const normalizedSearchText = computed(() => searchText.value.trim().toLowerCase())

function matchesSearch(value) {
  if (!normalizedSearchText.value) {
    return true
  }

  return String(value || '').toLowerCase().includes(normalizedSearchText.value)
}

const modalTitle = computed(() => t('map.customTab.scopeModal.title', {
  feature: props.featureMeta?.feature || ''
}))

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
      state
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

    if (parts.length === 0) {
      return
    }

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

    const targetNode = parent
    if (targetNode) {
      region.locationNames.forEach((name) => targetNode.locationNames.add(name))
      targetNode.recordCount += region.recordCount
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
      recordCount: aggregatedRecords
    }
  }

  roots.forEach((node) => computeAggregates(node))

  const flattened = []
  const walk = (node) => {
    flattened.push({
      ...node,
      children: [...node.children],
      locationNames: [...node.aggregatedLocationNames],
      recordCount: node.aggregatedRecordCount
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

const filteredRegionOptions = computed(() => {
  if (!normalizedSearchText.value) {
    return regionOptions.value
  }

  return regionOptions.value.filter((region) => matchesSearch(region.name) || region.locationNames.some((name) => matchesSearch(name)))
})

const filteredRegionsEmpty = computed(() => {
  return recognizeHierarchy.value ? filteredRegionTree.value.length === 0 : filteredRegionOptions.value.length === 0
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

const confirmDisabled = computed(() => {
  return props.loading || Boolean(props.errorMessage) || selectedLocations.value.length === 0
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedLocations.value = []
    recognizeHierarchy.value = false
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

function toggleTreeNode(node) {
  toggleRegion(node)
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
  emit('confirm', {
    selectedLocations: [...selectedLocations.value]
  })
}

function formatRegionNames(regionNames) {
  const names = Array.isArray(regionNames) ? regionNames.filter(Boolean) : []
  return names.join(locale.value === 'en' ? ', ' : '、')
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.feature-scope-modal {
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
    font-size: 13px;
    color: $text-secondary;
    font-weight: 700;
  }
}

.scope-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $text-dark;

  input {
    accent-color: $primary;
  }
}

.scope-clear-btn {
  border: none;
  background: transparent;
  color: $text-muted;
  font-size: 13px;
  cursor: pointer;
}

.scope-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(0, 1.08fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.scope-panel {
  @include flex-col;
  gap: 12px;
  min-height: 360px;
  max-height: 440px;
  overflow: hidden;
  padding: 18px 20px;

  &-title {
    font-size: 14px;
    font-weight: 700;
    color: $text-strong;
  }
}

.scope-tree-list,
.scope-region-list {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.scope-virtual-list {
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.scope-virtual-wrapper {
  width: 100%;
}

.scope-tree-node {
  display: block;
}

.scope-selection-item,
.scope-checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid $muted-hover;
  background: $glass-heavy;
  text-align: left;
}

.scope-selection-item {
  width: 100%;
  color: $text-strong;

  &.state-full {
    border-color: $primary;
    box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb), 0.18);
  }

  &.state-partial {
    border-color: $primary-ring;
    box-shadow: 0 0 0 1px $primary-border;
  }
}

.scope-checkbox-item {
  &--virtual {
    min-height: 64px;
    box-sizing: border-box;
  }

  input {
    accent-color: $primary;
    margin-top: 2px;
  }
}

.scope-tree-item {
  gap: 8px;
  white-space: nowrap;

  .scope-selection-meta,
  .scope-selection-status {
    white-space: nowrap;
  }
}

.scope-selection-title,
.scope-tree-main {
  white-space: nowrap;
}

.scope-tree-caret {
  width: 12px;
  color: $text-muted;
  flex: 0 0 auto;

  &-empty {
    visibility: hidden;
  }
}

.scope-selection-copy {
  display: flex;
  gap: 10px;

  .scope-selection-title {
    font-weight: 700;
    color: $text-strong;
  }
}

.scope-selection-meta,
.scope-selection-status {
  font-size: 13px;
  color: $text-muted;
}

.scope-selection-status {
  color: $primary;
  font-weight: 600;
}

.scope-confirm-btn {
  color: var(--action-primary-text);
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.glass-subpanel {
  padding: 10px 20px;
}
</style>
