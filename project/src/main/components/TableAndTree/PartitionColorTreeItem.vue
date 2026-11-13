<template>
  <div class="tree-node">
    <div class="node-content" :title="node.path">
      <button v-if="hasChildren" type="button" class="node-toggle" :aria-expanded="isOpen" @click="expanded = !isOpen">
        <span aria-hidden="true">{{ isOpen ? '▾' : '▸' }}</span>
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
  min-height: 32px;
}
.node-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.leaf-name { margin-inline-start: 18px; }
.children-container { padding-inline-start: 16px; }
</style>
