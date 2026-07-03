<template>
  <div class="tree-node">
    <div class="node-content" :class="{ 'is-match': isMatch }" @click="toggle">
      <div class="node-label">
        <span class="icon">{{ hasChildren ? '📁' : '📍' }}</span>
        <span class="text" v-if="isMatch" v-html="highlightName"></span>
        <span class="text" v-else>{{ displayName }}</span>
        <span v-if="node._loadingChildren" class="lazy-indicator">↻</span>
      </div>

      <div class="buttons-group">
        <button
            class="map-btn"
            :class="{ 'is-disabled': node._lazy && !node._childrenLoaded }"
            @click.stop="handleMapClick"
            :title="mapButtonTitle"
            :disabled="node._lazy && !node._childrenLoaded"
        >
          🌍
        </button>
        <button
            v-if="hasChildren"
            class="expand-btn"
            :class="{ 'is-open': isOpen }"
            @click.stop="toggle"
        >
          <span class="plus-icon">＋</span>
        </button>
      </div>
    </div>

    <!-- Lazy load error state -->
    <div v-if="node._loadError" class="lazy-error">
      <span class="error-text">{{ node._loadError }}</span>
      <button class="retry-btn-small" @click.stop="toggle">重試</button>
    </div>

    <transition
        name="expand"
        @enter="enter"
        @after-enter="afterEnter"
        @leave="leave"
    >
      <div v-if="isOpen && hasChildren" class="children-container">
        <VillagesTreeItem
            v-for="child in node.children"
            :key="child.id"
            :node="child"
            :search-query="searchQuery"
            :lazy-load-fn="lazyLoadFn"
            @open-map="emit('open-map', $event)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'VillagesTreeItem'
});

const props = defineProps({
  node: Object,
  searchQuery: String,
  lazyLoadFn: Function,
});

const emit = defineEmits(['open-map']);
const { t } = useI18n();

const isOpen = ref(false);

const hasChildren = computed(() => {
  if (props.node._lazy && !props.node._childrenLoaded && !props.node._loadError) {
    return true
  }
  return props.node.children && props.node.children.length > 0;
});

// Replace "(空)" with "請展開"
const displayName = computed(() => {
  return props.node.name === '(空)' ? t('tableTree.villagesTreeItem.expandPrompt') : props.node.name;
});

const mapButtonTitle = computed(() => {
  if (props.node._lazy && !props.node._childrenLoaded) {
    return t('tableTree.villagesTreeItem.expandFirstForMap')
  }
  return hasChildren.value
    ? t('tableTree.villagesTreeItem.drawAllChildrenMap')
    : t('tableTree.villagesTreeItem.drawCurrentVillageMap')
})

// Auto-expand based on _autoExpand flag
watch(() => props.node, (newNode) => {
  if (newNode && newNode._autoExpand) {
    isOpen.value = true;
  } else {
    isOpen.value = false;
  }
}, { immediate: true, deep: true });

const toggle = async () => {
  if (!isOpen.value && props.node._lazy && !props.node._childrenLoaded) {
    if (props.lazyLoadFn) {
      await props.lazyLoadFn(props.node)
      if (props.node._loadError) return
    }
  }
  isOpen.value = !isOpen.value;
};

// Highlight matching nodes
const isMatch = computed(() => {
  if (!props.searchQuery) return false;
  return displayName.value.toLowerCase().includes(props.searchQuery.toLowerCase());
});

// Highlight HTML processing
const highlightName = computed(() => {
  if (!props.searchQuery) return displayName.value;
  const re = new RegExp(props.searchQuery, 'gi');
  return displayName.value.replace(re, match => `<span class="highlight">${match}</span>`);
});

/**
 * Recursively collect all leaf nodes data
 */
const collectLeafNodes = (node) => {
  const leaves = [];

  const traverse = (n) => {
    // If it's a leaf node (has rawData)
    if (n.rawData) {
      const dialect = n.rawData['方言分布']?.[0] || '';
      const lng = n.rawData['longitude']?.[0] || '';
      const lat = n.rawData['latitude']?.[0] || '';

      leaves.push({
        name: n.rawName || n.name,
        dialect: dialect,
        longitude: parseFloat(lng) || 0,
        latitude: parseFloat(lat) || 0
      });
    }

    // Recursively process children
    if (n.children && n.children.length > 0) {
      n.children.forEach(child => traverse(child));
    }
  };

  traverse(node);
  return leaves;
};

/**
 * Handle map button click
 */
const handleMapClick = () => {
  if (hasChildren.value) {
    // Branch node: collect all leaf nodes
    const leafNodes = collectLeafNodes(props.node);
    // console.log(`=== ${props.node.name} - 所有下級村落 ===`);
    // console.log(`總數: ${leafNodes.length}`);
    // console.table(leafNodes);

    // Emit to parent component
    emit('open-map', leafNodes);
  } else {
    // Leaf node: show single node data
    const dialect = props.node.rawData?.['方言分布']?.[0] || '';
    const lng = props.node.rawData?.['longitude']?.[0] || '';
    const lat = props.node.rawData?.['latitude']?.[0] || '';

    // console.log(`=== ${props.node.rawName || props.node.name} ===`);
    // console.log({
    //   name: props.node.rawName || props.node.name,
    //   dialect: dialect,
    //   longitude: lng,
    //   latitude: lat
    // });

    // Emit to parent component
    emit('open-map', [{
      name: props.node.rawName || props.node.name,
      dialect: dialect,
      longitude: parseFloat(lng) || 0,
      latitude: parseFloat(lat) || 0
    }]);
  }
};

// Animation hooks
const enter = (el) => {
  el.style.height = el.scrollHeight + 'px';
  el.style.overflow = 'hidden';
};

const afterEnter = (el) => {
  el.style.height = 'auto';
  el.style.overflow = 'visible';
};

const leave = (el) => {
  el.style.height = el.scrollHeight + 'px';
  el.style.overflow = 'hidden';
  el.offsetHeight;
  el.style.height = '0';
};
</script>

<style scoped>
.tree-node {
  margin-bottom: 8px;
}

.node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.node-content:hover {
  background: rgba(255, 255, 255, 0.4);
}

.node-content.is-match {
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.node-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.buttons-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.map-btn:hover {
  background: rgba(52, 199, 89, 0.15);
  transform: scale(1.1);
}

.map-btn.is-disabled,
.map-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.map-btn.is-disabled:hover,
.map-btn:disabled:hover {
  background: transparent;
  transform: none;
}

.lazy-indicator {
  display: inline-block;
  margin-left: 6px;
  font-size: 14px;
  color: #007AFF;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.lazy-error {
  padding: 8px 12px;
  margin: 4px 0 4px 20px;
  background: rgba(211, 47, 47, 0.06);
  border: 1px solid rgba(211, 47, 47, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #d32f2f;
}

.lazy-error .retry-btn-small {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(211, 47, 47, 0.12);
  color: #d32f2f;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.children-container {
  padding-left: 20px;
  border-left: 2px solid rgba(0, 122, 255, 0.1);
  margin-left: 14px;
  transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  /* Grid layout for children */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.expand-btn {
  background: transparent;
  border: none;
  color: #007AFF;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.expand-btn:hover {
  background: rgba(0, 122, 255, 0.1);
}

.expand-btn.is-open {
  transform: rotate(45deg);
}

/* Highlight style for search */
:deep(.highlight) {
  background: rgba(255, 255, 0, 0.4);
  border-radius: 4px;
  padding: 0 2px;
  color: #000;
}

/* Responsive Design */
@media (max-width: 768px) {
  .children-container {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .children-container {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (min-width: 1201px) {
  .children-container {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
</style>
