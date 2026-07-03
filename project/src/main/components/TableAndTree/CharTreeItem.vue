<template>
  <div class="tree-node">
    <div
      v-if="hasDisplayName"
      class="node-content"
      :class="{ 'is-match': isMatch }"
      @click="toggle"
    >
      <div class="node-label">
        <span class="icon">{{ hasChildren ? '📁' : '✍️' }}</span>
        <span class="text" v-if="isMatch" v-html="highlightName"></span>
        <span class="text" v-else>{{ displayName }}</span>
        <span v-if="node._loadingChildren" class="lazy-indicator">↻</span>
      </div>

      <button
        v-if="hasChildren"
        class="expand-btn"
        :class="{ 'is-open': isOpen }"
        @click.stop="toggle"
      >
        <span class="plus-icon">＋</span>
      </button>
    </div>

    <!-- Lazy load error state -->
    <div v-if="hasDisplayName && node._loadError" class="lazy-error">
      <span class="error-text">{{ node._loadError }}</span>
      <button class="retry-btn-small" @click.stop="toggle">重試</button>
    </div>

    <div
      v-if="!hasDisplayName && hasChildren"
      class="children-container promoted-content"
    >
      <div v-if="hasLeafContent" class="leaf-content">
        <div v-if="!showAnnotations" class="chars-row">
          {{ node.chars.join(' ') }}
        </div>

        <div v-else class="char-annotation-list">
          <div
            v-for="(char, index) in node.chars"
            :key="index"
            class="char-annotation-item"
          >
            <span class="char">{{ char }}</span>
            <span class="annotation">{{
              node.annotations[index] || t('tableTree.charTreeItem.noAnnotation')
            }}</span>
          </div>
        </div>
      </div>

      <CharTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :search-query="searchQuery"
        :show-annotations="showAnnotations"
        :lazy-load-fn="lazyLoadFn"
      />
    </div>

    <transition
      v-else-if="hasDisplayName"
      name="expand"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
    >
      <div v-if="isOpen && hasChildren" class="children-container">
        <div v-if="hasLeafContent" class="leaf-content">
          <div v-if="!showAnnotations" class="chars-row">
            {{ node.chars.join(' ') }}
          </div>

          <div v-else class="char-annotation-list">
            <div
              v-for="(char, index) in node.chars"
              :key="index"
              class="char-annotation-item"
            >
              <span class="char">{{ char }}</span>
              <span class="annotation">{{
                node.annotations[index] || t('tableTree.charTreeItem.noAnnotation')
              }}</span>
            </div>
          </div>
        </div>

        <CharTreeItem
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :search-query="searchQuery"
          :show-annotations="showAnnotations"
          :lazy-load-fn="lazyLoadFn"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'CharTreeItem'
})

const props = defineProps({
  node: Object,
  searchQuery: String,
  showAnnotations: {
    type: Boolean,
    default: true
  },
  lazyLoadFn: Function,
})

const { t } = useI18n()

const isOpen = ref(false)
const displayName = computed(() => (typeof props.node?.name === 'string' ? props.node.name : ''))
const hasDisplayName = computed(() => displayName.value.trim().length > 0)
const hasLeafContent = computed(() => Array.isArray(props.node?.chars) && props.node.chars.length > 0)
const hasChildNodes = computed(
  () => Array.isArray(props.node?.children) && props.node.children.length > 0
)
const hasChildren = computed(() => {
  if (props.node._lazy && !props.node._childrenLoaded && !props.node._loadError) {
    return true
  }
  return hasLeafContent.value || hasChildNodes.value
})

watch(
  () => props.node,
  (newNode) => {
    if (!hasDisplayName.value) {
      isOpen.value = true
      return
    }

    if (newNode && newNode._autoExpand) {
      isOpen.value = true
    } else {
      isOpen.value = false
    }
  },
  { immediate: true, deep: true }
)

const toggle = async () => {
  if (!hasDisplayName.value || !hasChildren.value) {
    return
  }

  if (!isOpen.value && props.node._lazy && !props.node._childrenLoaded) {
    if (props.lazyLoadFn) {
      await props.lazyLoadFn(props.node)
      if (props.node._loadError) return
    }
  }

  isOpen.value = !isOpen.value
}

const isMatch = computed(() => {
  if (!props.searchQuery) {
    return false
  }

  const nameMatch = displayName.value.toLowerCase().includes(props.searchQuery.toLowerCase())
  const charMatch = (props.node?.chars || []).some((char) => char.includes(props.searchQuery))

  return nameMatch || charMatch
})

const highlightName = computed(() => {
  if (!props.searchQuery) {
    return displayName.value
  }

  const re = new RegExp(props.searchQuery, 'gi')
  return displayName.value.replace(re, (match) => `<span class="highlight">${match}</span>`)
})

const enter = (el) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.overflow = 'hidden'
}

const afterEnter = (el) => {
  el.style.height = 'auto'
  el.style.overflow = 'visible'
}

const leave = (el) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.overflow = 'hidden'
  el.offsetHeight
  el.style.height = '0'
}
</script>

<style scoped>
.tree-node {
  margin-bottom: 8px;
}

.node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
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
}

.children-container {
  padding-left: 20px;
  border-left: 2px solid rgba(0, 122, 255, 0.1);
  margin-left: 20px;
  transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.children-container.promoted-content {
  padding-left: 0;
  border-left: none;
  margin-left: 0;
}

.children-container.promoted-content .leaf-content {
  margin-top: 0;
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

.leaf-content {
  margin-top: 8px;
}

.chars-row {
  padding: 12px 16px;
  background: rgba(0, 122, 255, 0.05);
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.8;
  word-spacing: 8px;
  color: #1d1d1f;
  font-weight: 500;
  letter-spacing: 2px;
}

.char-annotation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.char-annotation-item {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.2s;
}

.char-annotation-item:hover {
  background: rgba(255, 255, 255, 0.7);
}

.char-annotation-item .char {
  font-size: 18px;
  font-weight: 700;
  color: #007AFF;
  text-align: center;
  margin-top: 1px;
}

.char-annotation-item .annotation {
  font-size: 14px;
  line-height: 1.6;
  color: #3a3a3c;
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

:deep(.highlight) {
  background: rgba(255, 255, 0, 0.4);
  border-radius: 4px;
  padding: 0 2px;
  color: #000;
}

@media (max-aspect-ratio: 1/1) {
  .children-container {
    padding-left: 10px;
    margin-left: 5px;
  }

  .children-container.promoted-content {
    padding-left: 0;
    margin-left: 0;
  }

  .leaf-content {
    margin-left: -10px;
    margin-right: -10px;
  }

  .children-container.promoted-content .leaf-content {
    margin-left: 0;
    margin-right: 0;
  }

  .char-annotation-item {
    grid-template-columns: 32px 1fr;
    gap: 8px;
    padding: 8px 10px;
  }

  .char-annotation-item .char {
    font-size: 16px;
  }

  .char-annotation-item .annotation {
    font-size: 13px;
  }

  .chars-row {
    font-size: 15px;
    padding: 10px 12px;
  }
}
</style>
