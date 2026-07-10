<template>
  <div class="tree-node">
    <div class="node-content" :class="{ 'is-match': isMatch }" @click="toggle">
      <div class="node-label">
        <span class="icon">{{ leafIcon }}</span>
        <span class="text" v-if="isMatch" v-html="highlightName"></span>
        <span class="text" v-else>{{ displayName }}</span>
        <span v-if="node._tag" class="node-tag" :style="{ backgroundColor: node._tag.color }">{{ node._tag.text }}</span>
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
            :leaf-data-extractor="leafDataExtractor"
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
  leafDataExtractor: {
    type: Function,
    default: null
  }
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

const leafIcon = computed(() => {
  if (hasChildren.value) return '📁'
  if (props.node._coordCount > 1) return '📐'
  return '📍'
})

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

// Auto-expand only when _autoExpand flag is explicitly set (e.g. search results)
watch(() => props.node._autoExpand, (autoExpand) => {
  if (autoExpand) {
    isOpen.value = true;
  }
});

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
      if (props.leafDataExtractor) {
        const extracted = props.leafDataExtractor(n.rawData, n.rawName || n.name)
        if (Array.isArray(extracted)) {
          if (n._path) extracted.forEach(e => e._path = n._path)
          leaves.push(...extracted)
        } else if (extracted) {
          if (n._path) extracted._path = n._path
          leaves.push(extracted)
        }
      } else {
        const dialect = (n.rawData['dialect'] || n.rawData['方言分布'])?.[0] || '';
        const lng = n.rawData['longitude']?.[0] || '';
        const lat = n.rawData['latitude']?.[0] || '';

        leaves.push({
          name: n.rawName || n.name,
          dialect: dialect,
          longitude: parseFloat(lng) || 0,
          latitude: parseFloat(lat) || 0,
          _path: n._path || []
        });
      }
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
    if (props.leafDataExtractor) {
      const extracted = props.leafDataExtractor(props.node.rawData, props.node.rawName || props.node.name)
      const result = Array.isArray(extracted) ? extracted : [extracted]
      if (props.node._path) result.forEach(e => e._path = props.node._path)
      emit('open-map', result)
    } else {
      const dialect = (props.node.rawData?.['dialect'] || props.node.rawData?.['方言分布'])?.[0] || '';
      const lng = props.node.rawData?.['longitude']?.[0] || '';
      const lat = props.node.rawData?.['latitude']?.[0] || '';

      emit('open-map', [{
        name: props.node.rawName || props.node.name,
        dialect: dialect,
        longitude: parseFloat(lng) || 0,
        latitude: parseFloat(lat) || 0,
        _path: props.node._path || []
      }]);
    }
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


$primary-blue: var(--color-primary);
$text-dark: var(--text-dark);
$text-muted: var(--text-medium);
$error-color: var(--color-error);
$transition-fast: 0.2s;
$transition-expand: 0.3s;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-node {
  margin-bottom: 8px;
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 12px;
  transition: background $transition-fast;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  &.is-match {
    background: rgba(255, 215, 0, 0.15);
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
}

.node-label {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  color: $text-dark;
  font-size: 15px;
  font-weight: 500;
}

.buttons-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.map-btn {
  @include flex-center;

  width: 28px;
  height: 28px;
  font-size: 18px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all $transition-fast ease;

  &:hover {
    background: rgba(var(--color-success-rgb), 0.15);
    transform: scale(1.1);
  }

  &.is-disabled,
  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;

    &:hover {
      background: transparent;
      transform: none;
    }
  }
}

.node-tag {
  display: inline-block;
  flex-shrink: 0;
  margin-left: 6px;
  padding: 1px 6px;
  color: $text-muted;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 8px;
}

.lazy-indicator {
  display: inline-block;
  margin-left: 6px;
  color: $primary-blue;
  font-size: 14px;
  animation: spin 1s linear infinite;
}

.lazy-error {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 4px 0 4px 20px;
  padding: 8px 12px;
  color: $error-color;
  font-size: 13px;
  background: rgba(211, 47, 47, 0.06);
  border: 1px solid rgba(211, 47, 47, 0.2);
  border-radius: 10px;

  .retry-btn-small {
    padding: 3px 10px;
    color: $error-color;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    background: rgba(211, 47, 47, 0.12);
    border: none;
    border-radius: 6px;
  }
}

.children-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
  margin-left: 14px;
  padding-left: 20px;
  border-left: 2px solid rgba(0, 122, 255, 0.1);
  transition: height $transition-expand cubic-bezier(0.25, 0.8, 0.25, 1);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 769px) and (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  @media (min-width: 1201px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.expand-btn {
  @include flex-center;

  width: 24px;
  height: 24px;
  color: $primary-blue;
  font-size: 16px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all $transition-expand ease;

  &:hover {
    background: rgba(0, 122, 255, 0.1);
  }

  &.is-open {
    transform: rotate(45deg);
  }
}

/*
 * highlight 元素由 v-html 动态插入，
 * scoped 样式必须使用 :deep() 才能生效。
 */
:deep(.highlight) {
  padding: 0 2px;
  color: #000;
  background: rgba(255, 255, 0, 0.4);
  border-radius: 4px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

