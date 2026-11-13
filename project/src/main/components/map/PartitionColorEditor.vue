<template>
  <details class="partition-color-editor glass-panel" @toggle="onToggle">
    <summary>{{ t('map.partitionColors.title') }}</summary>
    <div class="editor-content">
      <RadioGroup v-model="mode" name="partition-color-source" :options="modeOptions" />
      <input v-model="search" class="input" :placeholder="t('map.partitionColors.search')" :aria-label="t('map.partitionColors.search')">
      <small>{{ t('map.partitionColors.sessionHint') }}</small>
      <div v-if="loading" class="main-list-state">{{ t('common.label.loading') }}</div>
      <div v-else-if="error" class="main-list-state" data-state="error">
        {{ error }}
        <button type="button" class="pill-btn" @click="loadTree">{{ t('map.partitionColors.retry') }}</button>
      </div>
      <div v-else class="color-tree ui-scrollbar">
        <PartitionColorTreeItem v-for="node in filteredNodes" :key="node.path" :node="node" :colors="colors" :search-query="search" @color-change="changeColor" />
        <small v-if="!filteredNodes.length">{{ t('map.partitionColors.empty') }}</small>
      </div>
      <button type="button" class="pill-btn" :disabled="loading || !!error" @click="resetColors">{{ t('map.partitionColors.reset') }}</button>
    </div>
  </details>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { userStore } from '@/main/store/store.js'
import { getPartitions } from '@/api/main/geo/LocationAndRegion.js'
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'
import { usePartitionColors } from '@/composables/data/usePartitionColors.js'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import PartitionColorTreeItem from '@/main/components/TableAndTree/PartitionColorTreeItem.vue'

const { t } = useI18n()
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
  { value: 'map', label: t('map.divideTab.options.mapPartition') },
  { value: 'yindian', label: t('map.divideTab.options.yindianPartition') },
])
const filteredNodes = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  function filter(items) {
    return items.flatMap(node => {
      if (!query || node.path.toLocaleLowerCase().includes(query)) return [node]
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
.partition-color-editor { width: min(90%, 500px); margin: 12px auto; padding: 12px; box-sizing: border-box; }
summary { cursor: pointer; }
.editor-content { @include flex-col; gap: 8px; padding-top: 12px; }
.color-tree { max-height: 320px; overflow-y: auto; }
</style>
