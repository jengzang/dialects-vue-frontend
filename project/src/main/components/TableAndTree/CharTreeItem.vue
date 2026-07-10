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

// Auto-expand when _autoExpand is set (e.g. search results) or for promoted leaf content
watch(
  () => props.node._autoExpand,
  (autoExpand) => {
    if (!hasDisplayName.value) {
      isOpen.value = true
      return
    }
    if (autoExpand) {
      isOpen.value = true
    }
  }
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


$primary-blue: var(--color-primary);
$text-dark: var(--text-dark);
$error-color: var(--color-error);
$transition-fast: 0.2s;
$mobile-aspect-ratio: 1 / 1;

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
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 12px;
  transition: background $transition-fast;

  &:hover {
    background: var(--glass-40);
  }

  &.is-match {
    background: rgba(var(--color-gold-rgb), 0.15);
    border: 1px solid rgba(var(--color-gold-rgb), 0.3);
  }
}

.node-label {
  display: flex;
  gap: 8px;
  align-items: center;
  color: $text-dark;
  font-size: 15px;
  font-weight: 500;
}

.children-container {
  margin-left: 20px;
  padding-left: 20px;
  border-left: 2px solid rgba(var(--color-primary-rgb), 0.1);
  transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.promoted-content {
    margin-left: 0;
    padding-left: 0;
    border-left: none;

    .leaf-content {
      margin-top: 0;
    }
  }

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    margin-left: 5px;
    padding-left: 10px;

    &.promoted-content {
      margin-left: 0;
      padding-left: 0;

      .leaf-content {
        margin-right: 0;
        margin-left: 0;
      }
    }
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
  transition: all 0.3s ease;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.1);
  }

  &.is-open {
    transform: rotate(45deg);
  }
}

.leaf-content {
  margin-top: 8px;

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    margin-right: -10px;
    margin-left: -10px;
  }
}

.chars-row {
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.8;
  letter-spacing: 2px;
  word-spacing: 8px;
  background: rgba(var(--color-primary-rgb), 0.05);
  border-radius: 12px;

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    padding: 10px 12px;
    font-size: 15px;
  }
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
  background: var(--glass-50);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  transition: background $transition-fast;

  &:hover {
    background: var(--glass-70);
  }

  .char {
    margin-top: 1px;
    color: $primary-blue;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
  }

  .annotation {
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.6;
  }

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    grid-template-columns: 32px 1fr;
    gap: 8px;
    padding: 8px 10px;

    .char {
      font-size: 16px;
    }

    .annotation {
      font-size: 13px;
    }
  }
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

/*
 * highlight 元素由 v-html 动态插入，
 * 必须使用 :deep() 才能在 scoped 样式中生效。
 */
:deep(.highlight) {
  padding: 0 2px;
  color: var(--text-primary);
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

