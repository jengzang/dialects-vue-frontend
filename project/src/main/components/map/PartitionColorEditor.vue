<template>
  <details class="partition-color-editor" :class="{ 'glass-panel': !opened }" @toggle="onToggle">
    <summary>
      <span>{{ t('map.partitionColors.title') }}</span>
      <span class="editor-toggle-hint">
        <span>{{ t(opened ? 'map.partitionColors.collapse' : 'map.partitionColors.expand') }}</span>
        <svg class="editor-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </span>
    </summary>
    <div class="editor-content">
      <div class="editor-toolbar">
        <RadioGroup v-model="mode" name="partition-color-source" :options="modeOptions" />
        <input v-model="search" class="glass-field editor-search" data-shape="search" :placeholder="t('map.partitionColors.search')" :aria-label="t('map.partitionColors.search')">
        <button type="button" class="pill-btn reset-colors" :disabled="loading || !!error" @click="resetColors">{{ t('map.partitionColors.reset') }}</button>
      </div>
      <small class="editor-hint">{{ t('map.partitionColors.sessionHint') }}</small>
      <div v-if="loading" class="main-list-state">{{ t('common.label.loading') }}</div>
      <div v-else-if="error" class="main-list-state" data-state="error">
        {{ error }}
        <button type="button" class="pill-btn" @click="loadTree">{{ t('map.partitionColors.retry') }}</button>
      </div>
      <div v-else class="color-tree glass-panel ui-scrollbar">
        <PartitionColorTreeItem v-for="node in filteredNodes" :key="node.path" :node="node" :colors="colors" :search-query="search" @color-change="changeColor" />
        <small v-if="!filteredNodes.length">{{ t('map.partitionColors.empty') }}</small>
      </div>
    </div>
  </details>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as OpenCCCN2T from 'opencc-js/cn2t'
import { userStore } from '@/main/store/store.js'
import { getPartitions } from '@/api/main/geo/LocationAndRegion.js'
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'
import { usePartitionColors } from '@/composables/data/usePartitionColors.js'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import PartitionColorTreeItem from '@/main/components/TableAndTree/PartitionColorTreeItem.vue'

const { t } = useI18n()
const toTraditional = OpenCCCN2T.Converter({ from: 'cn', to: 'tw' })
const { getDefaultTree } = usePartitionCache()
const { loadPartitionColors, getPartitionColor, setPartitionColor, resetPartitionColor, colorVersion } = usePartitionColors()
const mode = ref('map')
const opened = ref(false)
const search = ref('')
const nodes = ref([])
const colors = computed(() => {
  void colorVersion.value
  const result = new Map()
  function collect(items) {
    for (const node of items) {
      const color = getPartitionColor(mode.value, identity.value, node.path)
      if (color) result.set(node.path, color)
      collect(node.children || [])
    }
  }
  collect(nodes.value)
  return result
})
const loading = ref(false)
const error = ref('')
const identity = computed(() => JSON.stringify([userStore.role, userStore.id]))
let sequence = 0
const modeOptions = computed(() => [
  { value: 'map', label: t('map.partitionColors.mapSource') },
  { value: 'yindian', label: t('map.partitionColors.yindianSource') },
])
const filteredNodes = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  const traditionalQuery = toTraditional(query)
  function filter(items) {
    return items.flatMap(node => {
      const path = node.path.toLocaleLowerCase()
      if (!query || path.includes(query) || path.includes(traditionalQuery)) return [node]
      const children = filter(node.children || [])
      return children.length ? [{ ...node, children }] : []
    })
  }
  return filter(nodes.value)
})
async function loadTree() {
  if (!opened.value) return
  const request = ++sequence
  const currentMode = mode.value
  const currentIdentity = identity.value
  loading.value = true
  error.value = ''
  try {
    const tree = await getDefaultTree(currentMode, () => getPartitions(currentMode), { identity: currentIdentity })
    await loadPartitionColors(currentMode, currentIdentity)
    if (request !== sequence) return
    nodes.value = tree.nodes
  } catch {
    if (request === sequence) error.value = t('map.partitionColors.loadFailed')
  } finally {
    if (request === sequence) loading.value = false
  }
}
function onToggle(event) {
  opened.value = event.target.open
  if (opened.value) loadTree()
}
function changeColor(path, color) {
  setPartitionColor(mode.value, identity.value, path, color)
}
function resetColors() {
  resetPartitionColor(mode.value, identity.value)
}
watch([mode, identity], loadTree)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
.partition-color-editor {
  width: min(90%, 500px);
  margin: 12px auto;
  padding: 14px 16px;
  box-sizing: border-box;
  color: var(--text-primary);
}
summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-primary-hover);
  font-size: var(--font-size-15);
  font-weight: 700;
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker { display: none; }
}
.editor-toggle-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: var(--font-size-12);
  font-weight: 400;
}
.editor-chevron { flex-shrink: 0; transition: transform 0.2s ease; }
.partition-color-editor[open] .editor-chevron { transform: rotate(90deg); }
.editor-content { @include flex-col; gap: 12px; padding-top: 14px; }
.editor-toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'source search reset';
  align-items: center;
  gap: 8px;

  :deep(.liquid-radio-group) { grid-area: source; gap: 4px 8px; flex-wrap: nowrap; }
}
.editor-search { grid-area: search; min-width: 0; }
.reset-colors { grid-area: reset; justify-self: end; }
@media (max-aspect-ratio: 1 / 1) {
  .editor-toolbar {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'source reset' 'search search';
  }
  .editor-toolbar :deep(.liquid-radio-group) { justify-content: flex-start; }
}
.editor-hint { color: var(--text-secondary); font-size: var(--font-size-12); line-height: 1.6; }
.color-tree { padding: 6px 8px; }
</style>
