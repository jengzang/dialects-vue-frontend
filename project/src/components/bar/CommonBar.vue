<template>
  <div class="commonbar">
    <!-- 桌面端：单行布局 -->
    <div class="commonbar-desktop">
      <div class="logo-and-title" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div class="logo-container">
          <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
        </div>
        <div v-if="titleImage" class="title">
          <img :src="titleImage" alt="Title" />
        </div>
        <div v-else-if="title && !isMobile" class="title-text">
          {{ title }}
        </div>
      </div>

      <nav class="commonbar-tabs ui-scrollbar--hidden" @mouseleave="handleTabLeave">
        <RouterLink
          v-for="t in visibleTabs"
          :key="t.tab"
          :to="t.to"
          custom
          v-slot="{ href, navigate }"
        >
          <a
            :href="href"
            class="tab-item"
            :class="{ active: isActiveComputed(t.tab) }"
            :style="{
              flex: getFlexWeight(t, isActiveComputed(t.tab), false) + ' 1 0',
              fontSize: t.fontSize + 'rem'
            }"
            @click.prevent.stop="onClick(t, navigate, $event)"
            @mouseenter="handleTabHover(t, t.tab, $event)"
          >
            <span class="emoji">{{ t.icon }}</span>
            <span
              class="label"
              v-if="!t.showLabelOnlyWhenActive || isActiveComputed(t.tab)"
            >{{ t.label }}</span>
          </a>
        </RouterLink>
      </nav>

      <div v-if="showLoginButton">
        <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
          <NavAvatar />
        </div>
        <div v-else class="login-container" @click="goToAuthPage">
          <span class="login-text">{{ t('navigation.login') }}</span>
        </div>
      </div>
    </div>

    <!-- 移动端：单行布局（无 title.png） -->
    <div class="commonbar-mobile">
      <div class="logo-container" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
      </div>
      <div v-if="title && showTitleOnMobile" class="title-text-mobile">
        {{ title }}
      </div>

      <nav class="commonbar-tabs ui-scrollbar--hidden">
        <RouterLink
          v-for="t in visibleTabs"
          :key="t.tab"
          :to="t.to"
          custom
          v-slot="{ href, navigate }"
        >
          <a
            v-if="!t.hideOnMobile"
            :href="href"
            class="tab-item"
            :class="{ active: isActiveComputed(t.tab) }"
            :style="{
              flex: getFlexWeight(t, isActiveComputed(t.tab), true) + ' 1 0',
              fontSize: (t.mobileFontSize || t.fontSize) + 'rem'
            }"
            @click.prevent.stop="onClick(t, navigate, $event)"
          >
            <span class="emoji">{{ t.icon }}</span>
            <span
              class="label"
              v-if="!t.hideLabelOnMobile && (!(t.mobileShowLabelOnlyWhenActive ?? t.showLabelOnlyWhenActive) || isActiveComputed(t.tab))"
            >{{ t.label }}</span>
          </a>
        </RouterLink>
      </nav>

      <div v-if="showLoginButton">
        <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
          <NavAvatar />
        </div>
        <div v-else class="login-container" @click="goToAuthPage">
          <span class="login-text">{{ t('navigation.login') }}</span>
        </div>
      </div>
    </div>

    <!-- 侧边栏 (使用自定义组件或 SimpleSidebar) -->
    <component
      v-if="sidebarComponent"
      :is="sidebarComponent"
      :is-open="isSidebarVisible"
      :show-title="showSidebarTitle || isMobile"
      @close="isSidebarVisible = false"
    />

    <!-- Submenu panel (liquid glass style) - Teleported to body -->
    <Teleport to="body">
      <Transition name="submenu-fade">
        <div
          v-if="activeSubmenu"
          class="submenu-panel"
          :style="{
            top: submenuPosition.top + 'px',
            left: submenuPosition.left + 'px'
          }"
          @click.stop
          @mouseenter="handleSubmenuEnter"
          @mouseleave="handleSubmenuLeave"
        >
          <div
            v-for="(child, index) in getTabChildren(activeSubmenu)"
            :key="index"
            class="submenu-item"
            @click="handleSubmenuClick(child)"
          >
            <span class="submenu-icon">{{ child.icon }}</span>
            <span class="submenu-label">{{ child.label }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, useAttrs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { userStore } from '@/main/store/store.js'
import NavAvatar from '@/components/bar/NavAvatar.vue'
import {
  filterVisibleCommonBarTabs,
  getCommonBarActiveTab,
  getCommonBarChildren,
  getCommonBarTabs,
  normalizeCommonBarSchema,
  resolveCommonBarTabTarget,
  syncCommonBarMemoryFromRoute,
  writeCommonBarMemory
} from '@/components/bar/commonBarNavigation.js'

// Props definition
const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
    validator: (tabs) => {
      return tabs.every(t => t.tab && t.label && t.icon && t.weight)
    }
  },
  titleConfig: {
    type: Object,
    default: () => ({})
  },
  navigationConfig: {
    type: Object,
    default: () => ({})
  },
  sidebarConfig: {
    type: Object,
    default: () => ({})
  },
  authConfig: {
    type: Object,
    default: () => ({})
  },
  layoutConfig: {
    type: Object,
    default: () => ({})
  },
  navigationSchema: {
    type: Object,
    default: null
  }
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const attrs = useAttrs()

const getLegacyAttr = (...keys) => {
  for (const key of keys) {
    if (attrs[key] !== undefined) {
      return attrs[key]
    }
  }
  return undefined
}

const title = computed(() => props.titleConfig?.title || getLegacyAttr('title') || '')
const titleImage = computed(() => props.titleConfig?.titleImage || getLegacyAttr('titleImage', 'title-image') || '')
const showTitleOnMobile = computed(() => {
  const legacy = getLegacyAttr('showTitleOnMobile', 'show-title-on-mobile')
  return props.titleConfig?.showTitleOnMobile ?? Boolean(legacy)
})
const activeTabGetter = computed(() => props.navigationConfig?.activeTabGetter || getLegacyAttr('activeTabGetter', 'active-tab-getter') || null)
const submenuConfig = computed(() => props.navigationConfig?.submenuConfig || getLegacyAttr('submenuConfig', 'submenu-config') || {})
const tabToSubmenuMap = computed(() => props.navigationConfig?.tabToSubmenuMap || getLegacyAttr('tabToSubmenuMap', 'tab-to-submenu-map') || {})
const sidebarComponent = computed(() => props.sidebarConfig?.component || getLegacyAttr('sidebarComponent', 'sidebar-component') || null)
const showSidebarTitle = computed(() => {
  const legacy = getLegacyAttr('showSidebarTitle', 'show-sidebar-title')
  return props.sidebarConfig?.showTitle ?? Boolean(legacy)
})
const showLoginButton = computed(() => {
  const legacy = getLegacyAttr('showLoginButton', 'show-login-button')
  if (props.authConfig?.showLoginButton !== undefined) return props.authConfig.showLoginButton
  return legacy !== false
})
const height = computed(() => props.layoutConfig?.height || getLegacyAttr('height') || '7.5dvh')
const mobileHeight = computed(() => props.layoutConfig?.mobileHeight || getLegacyAttr('mobileHeight', 'mobile-height') || '8dvh')
const normalizedNavigationSchema = computed(() => {
  if (!props.navigationSchema) return null
  return normalizeCommonBarSchema(props.navigationSchema)
})

const visibleTabs = computed(() => {
  if (normalizedNavigationSchema.value) {
    return filterVisibleCommonBarTabs(getCommonBarTabs(normalizedNavigationSchema.value))
  }

  return props.tabs.filter(tab => {
    if (typeof tab.visibleWhen === 'function') {
      return tab.visibleWhen()
    }
    return true
  })
})

const isSidebarVisible = ref(false)

// Submenu state management
const activeSubmenu = ref(null)
const submenuPosition = ref({ top: 0, left: 0 })
let closeSubmenuTimer = null

// Mobile detection
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Helper function to get children from submenuConfig
const getTabChildren = (tabKey) => {
  if (normalizedNavigationSchema.value) {
    return getCommonBarChildren(normalizedNavigationSchema.value, tabKey)
  }

  const menuKey = tabToSubmenuMap.value[tabKey] || tabKey
  return submenuConfig.value[menuKey]?.children || null
}

// Lifecycle hooks
onMounted(() => {
  checkMobile()
  document.addEventListener('click', closeSubmenu)
  if (normalizedNavigationSchema.value) {
    syncCommonBarMemoryFromRoute(normalizedNavigationSchema.value, route, router)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubmenu)
  if (closeSubmenuTimer) {
    clearTimeout(closeSubmenuTimer)
    closeSubmenuTimer = null
  }
})

const closeSubmenu = () => {
  activeSubmenu.value = null
}

// Active state logic
const isActiveComputed = (tabName) => {
  if (normalizedNavigationSchema.value) {
    return getCommonBarActiveTab(normalizedNavigationSchema.value, route, router) === tabName
  }

  if (activeTabGetter.value) {
    return activeTabGetter.value(tabName)
  }
  // Default: no active state
  return false
}

/**
 * Calculate dynamic flex weight based on label visibility
 * @param {Object} tab - Tab configuration object
 * @param {boolean} isActive - Whether the tab is currently active
 * @param {boolean} isMobile - Whether in mobile layout
 * @returns {number} - Flex weight value
 */
const getFlexWeight = (tab, isActive, isMobile) => {
  let labelVisible

  if (isMobile) {
    const showOnlyWhenActive = tab.mobileShowLabelOnlyWhenActive ?? tab.showLabelOnlyWhenActive
    labelVisible = !tab.hideLabelOnMobile && (!showOnlyWhenActive || isActive)
  } else {
    labelVisible = !tab.showLabelOnlyWhenActive || isActive
  }

  if (labelVisible) {
    return isMobile ? (tab.mobileWeight || tab.weight) : tab.weight
  } else {
    if (isMobile) {
      return tab.mobileWeightIconOnly || tab.mobileWeight || tab.weightIconOnly || tab.weight
    } else {
      return tab.weightIconOnly || tab.weight
    }
  }
}

// Tab click handler
const onClick = async (tabConfig, navigate, event) => {
  if (tabConfig.isPseudo) {
    toggleSidebar()
    return
  }

  const children = getTabChildren(tabConfig.tab)

  if (!isMobile.value) {
    const target = normalizedNavigationSchema.value
      ? resolveCommonBarTabTarget(normalizedNavigationSchema.value, tabConfig)
      : tabConfig.to

    if (target) {
      await router.replace(target)
    }
  } else {
    if (children && children.length > 0) {
      handleTabClick(tabConfig, tabConfig.tab, event)
    } else {
      if (tabConfig.to) {
        await router.replace(tabConfig.to)
      }
    }
  }
}

const handleTabClick = (tabConfig, tabKey, event) => {
  const children = getTabChildren(tabKey)
  if (!children || children.length === 0) return

  const targetElement = event.currentTarget
  const rect = targetElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const submenuWidth = 250
  const submenuHeight = children.length * 50 + 20

  let top = rect.bottom + 5
  let left = rect.left

  if (top + submenuHeight > viewportHeight) {
    top = rect.top - submenuHeight - 5
  }
  if (left + submenuWidth > viewportWidth) {
    left = viewportWidth - submenuWidth - 10
  }
  if (left < 10) {
    left = 10
  }

  submenuPosition.value = { top, left }
  activeSubmenu.value = activeSubmenu.value === tabKey ? null : tabKey
}

const handleTabHover = (tabConfig, tabKey, event) => {
  if (isMobile.value) return

  if (closeSubmenuTimer) {
    clearTimeout(closeSubmenuTimer)
    closeSubmenuTimer = null
  }

  const children = getTabChildren(tabKey)
  if (!children || children.length === 0) {
    activeSubmenu.value = null
    return
  }

  const targetElement = event.currentTarget
  const rect = targetElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const submenuWidth = 250
  const submenuHeight = children.length * 50 + 20

  let top = rect.bottom + 5
  let left = rect.left

  if (top + submenuHeight > viewportHeight) {
    top = rect.top - submenuHeight - 5
  }
  if (left + submenuWidth > viewportWidth) {
    left = viewportWidth - submenuWidth - 10
  }
  if (left < 10) {
    left = 10
  }

  submenuPosition.value = { top, left }
  activeSubmenu.value = tabKey
}

const handleTabLeave = () => {
  if (isMobile.value) return
  closeSubmenuTimer = setTimeout(() => {
    activeSubmenu.value = null
  }, 300)
}

const handleSubmenuEnter = () => {
  if (closeSubmenuTimer) {
    clearTimeout(closeSubmenuTimer)
    closeSubmenuTimer = null
  }
}

const handleSubmenuLeave = () => {
  closeSubmenuTimer = setTimeout(() => {
    activeSubmenu.value = null
  }, 200)
}

const handleSubmenuClick = (child) => {
  if (child.external) {
    window.open(child.path, '_blank')
  } else {
    if (normalizedNavigationSchema.value && activeSubmenu.value) {
      writeCommonBarMemory(normalizedNavigationSchema.value, activeSubmenu.value, child.path)
    }
    router.push(child.path)
  }
  activeSubmenu.value = null
}

watch(
  () => route.fullPath,
  () => {
    if (!normalizedNavigationSchema.value) return
    syncCommonBarMemoryFromRoute(normalizedNavigationSchema.value, route, router)
  }
)

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}

const goToAuthPage = () => {
  router.push('/auth')
}
</script>

<style scoped>
.commonbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 999;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 桌面端：单行，7.5dvh 高度 */
.commonbar-desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: v-bind(height);
  padding: 0 1%;
  gap: 10px;
}

.logo-and-title {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.commonbar-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
  height: v-bind(height);
}

.tab-item {
  height: 6.5dvh;
  display: flex;
  align-items: center;
  white-space: nowrap;
  justify-content: center;
  font-size: 1.3rem;
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.25s ease;
  gap: 1px;
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.1);
  color: #007aff;
}

.tab-item:hover {
  background: rgba(0, 122, 255, 0.12);
  height: 90%;
  color: #007aff;
}

.tab-item.active {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: darkblue;
  font-weight: 1000;
  border-radius: 0 0 25px 25px;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08);
  border: 3px solid rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.tab-item.active:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  margin: 0;
}

.logo-container {
  width: 6dvh;
  height: 6dvh;
  min-width: 5dvh;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border: 3px solid rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo-container:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logo {
  width: 80%;
  height: auto;
}

.title {
  display: flex;
  align-items: center;
}

.title img {
  height: 7dvh;
  object-fit: contain;
}

.title-text {
  height: 7dvh;
  display: flex;
  align-items: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
  white-space: nowrap;
}

.login-container {
  min-width: 6dvh;
  max-width: 10dvh;
  height: 6dvh;
  padding: 0 12px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border: 3px solid rgba(255, 255, 255, 0.4);
  color: #005fd3;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.login-container:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-text {
  font-size: 1.15rem;
  font-weight: 600;
  max-width: 80px;
  overflow: hidden;
  white-space: nowrap;
}

/* 移动端：单行，8dvh 高度 */
.commonbar-mobile {
  display: none;
}

.title-text-mobile {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-aspect-ratio: 1/1) {
  .commonbar-desktop {
    display: none;
  }

  .commonbar-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: max(v-bind(mobileHeight), 44px);
    padding: 0 1%;
    gap: 3px;
  }

  .commonbar-mobile .commonbar-tabs {
    display: flex;
    gap: 4px;
    flex: 1 1 auto;
    min-width: 0;
    margin: 0 6px;
    overflow-x: auto;
    overflow-y: hidden;
  }

.commonbar-mobile .tab-item {
    height: max(6dvh, 40px);
    border-radius: 30px;
    flex-shrink: 0;
  }

  .commonbar-mobile .tab-item.active {
    border-radius: 30px;
  }

  .commonbar-mobile .logo-container {
    width: 5dvh;
    height: 5dvh;
    min-width: 5dvh;
    flex-shrink: 0;
  }

  .commonbar-mobile .login-container {
    min-width: 6dvh;
    height: 6dvh;
    flex-shrink: 0;
  }
}

/* Submenu panel - liquid glass style */
.submenu-panel {
  position: fixed;
  width: auto;
  max-width: min(300px, calc(100vw - 20px));
  z-index: 10001;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 12px 40px rgba(0, 0, 0, 0.2),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);
  padding: 8px;
  overflow: hidden;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.submenu-item:hover {
  background: linear-gradient(145deg, rgba(0, 122, 255, 0.15), rgba(0, 122, 255, 0.08));
  transform: translateX(4px);
}

.submenu-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.submenu-label {
  flex: 1;
  white-space: nowrap;
}

/* Submenu fade transition */
.submenu-fade-enter-active,
.submenu-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.submenu-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.submenu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Mobile responsive */
@media (max-aspect-ratio: 1/1) {
  .submenu-panel {
    max-width: calc(100vw - 20px);
  }

  .submenu-item {
    padding: 10px 14px;
    font-size: 14px;
  }
}

.avatar-container {
  width: 6dvh;
  min-width: 6dvh;
  max-width: 6dvh;
  height: 6dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  box-sizing: border-box;
}
</style>
