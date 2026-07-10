<template>
  <div class="tabs-wrapper">
    <div class="tabs ui-scrollbar--hidden">
      <!-- 额外的 tab 左侧内容插槽 -->
      <slot name="tab-extra"></slot>
      <div
        v-for="tab in tabs"
        :key="tab.name"
        :class="['tab', { active: currentTab === tab.name }]"
        @click="handleTabClick(tab.name)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="tab-content">
      <!-- 使用具名插槽渲染每个 tab 的内容 -->
      <slot :current-tab="currentTab"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter as useVueRouter } from 'vue-router'

const { t } = useI18n()

const props = defineProps({
  // Tab 配置数组: [{ name: 'tab1', label: '标签1' }, ...]
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every(tab => tab.name && tab.label)
    }
  },

  // 当前选中的 tab (支持 v-model)
  modelValue: {
    type: String,
    default: ''
  },

  // 是否使用路由模式 (true: 同步到 route, false: 仅 emit)
  useRouter: {
    type: Boolean,
    default: true
  },

  // 路由模式下当前对应的 tab 值，由外层根据 params/query 映射后传入
  routeValue: {
    type: String,
    default: ''
  },

  // 路由模式下点击 tab 后的跳转解析函数，返回 router.replace 的 location
  resolveRoute: {
    type: Function,
    default: null
  },

  // 默认选中的 tab
  defaultTab: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'tab-change'])

const route = useRoute()
const router = useVueRouter()

// 计算当前选中的 tab
const currentTab = computed(() => {
  if (props.useRouter) {
    return props.routeValue || props.modelValue || props.defaultTab || (props.tabs[0]?.name || '')
  } else {
    return props.modelValue || props.defaultTab || (props.tabs[0]?.name || '')
  }
})

// 处理 tab 点击
const handleTabClick = (tabName) => {
  if (props.useRouter) {
    const location = typeof props.resolveRoute === 'function'
      ? props.resolveRoute(tabName, route)
      : { query: { ...route.query, sub: tabName } }

    router.replace(location)
  }

  emit('update:modelValue', tabName)
  emit('tab-change', tabName)
}
</script>


$primary-blue: var(--color-primary);
$text-default: var(--text-dark);
$white: var(--text-white);
$transition-duration: 0.5s;

.tabs-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 80dvh;
  padding: 0;
}

.tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  justify-content: flex-start;
  max-width: 100%;
  padding: 8px 12px;
  overflow-x: auto;

  @media (max-width: 600px) {
    gap: 6px;
    padding: 8px;
  }
}

.tab {
  flex-shrink: 0;
  padding: 12px 24px;
  color: $text-default;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  background: var(--glass-05);
  border: 1px solid $primary-blue;
  border-radius: 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: all $transition-duration ease;

  &:hover {
    color: $primary-blue;
    background: var(--glass-10);
  }

  &.active {
    color: $white;
    background: rgba(var(--color-primary-rgb), 0.7);
    box-shadow: 0 4px 20px rgba(var(--color-primary-rgb), 0.3);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  @media (max-width: 600px) {
    padding: 12px 14px;
    font-size: 14px;
    border-radius: 12px;
  }
}

.tab-content {
  width: 100%;
  animation: fade 0.6s ease;
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

