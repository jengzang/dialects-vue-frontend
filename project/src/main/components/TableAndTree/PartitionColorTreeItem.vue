<template>
  <div class="tree-node">
    <div class="node-content" :title="node.path">
      <button v-if="hasChildren" type="button" class="node-toggle glass-dropdown-item" :aria-expanded="isOpen" @click="expanded = !isOpen">
        <svg class="node-chevron" :class="{ 'is-open': isOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        {{ node.label }}
      </button>
      <template v-else>
        <span class="leaf-name">{{ node.label }}</span>
        <ColorPicker :model-value="color" :label="node.path" :size="24" @update:model-value="$emit('color-change', node.path, $event)" />
      </template>
    </div>
    <div v-if="isOpen && hasChildren" class="children-container">
      <PartitionColorTreeItem
        v-for="child in node.children" :key="child.path"
        :node="child" :colors="colors" :search-query="searchQuery"
        @color-change="(path, color) => $emit('color-change', path, color)"
      />
    </div>
  </div>
</template>

<script setup>
// Independent partition variant of TreeItem.vue; the original tree remains unchanged.
import { computed, ref } from 'vue'
import ColorPicker from '@/components/selector/ColorPicker.vue'

defineOptions({ name: 'PartitionColorTreeItem' })
const props = defineProps({
  node: { type: Object, required: true },
  colors: { type: Map, required: true },
  searchQuery: { type: String, default: '' },
})
defineEmits(['color-change'])
const expanded = ref(false)
const hasChildren = computed(() => !!props.node.children?.length)
const isOpen = computed(() => !!props.searchQuery || expanded.value)
const color = computed(() => props.colors.get(props.node.path) || '#ffffff')
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  color: var(--text-primary);
}
.node-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  width: 100%;
  border-radius: var(--radius-sm);
  border: 0;
  background: transparent;
  color: var(--color-primary-hover);
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.node-chevron { flex-shrink: 0; transition: transform 0.2s ease; }
.node-chevron.is-open { transform: rotate(90deg); }
.leaf-name { margin-inline-start: 28px; color: var(--text-secondary); }
.children-container { padding-inline-start: 16px; }
</style>
