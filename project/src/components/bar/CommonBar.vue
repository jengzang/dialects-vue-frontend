<template>
  <div class="commonbar">
    <!-- 桌面端：单行布局 -->
    <div class="commonbar-desktop">
      <div class="logo-and-title" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div class="logo-container">
          <img class="logo" :src="faviconSrc" alt="Logo" />
        </div>
        <div v-if="titleImage" class="title">
          <img :src="titleImage" alt="Title" />
        </div>
        <div v-else-if="title && !isMobile" class="title-text">
          {{ title }}
        </div>
      </div>

      <nav
        ref="navRef"
        class="commonbar-tabs ui-scrollbar--hidden"
        :class="scrollClass"
        @mouseleave="handleTabLeave"
      >
        <RouterLink
          v-for="t in orderedTabs"
          :key="t.tab"
          :to="t.to"
          custom
          v-slot="{ href, navigate }"
        >
          <a
            :href="href"
            class="tab-item"
            :class="{
              active: isActiveComputed(t.tab),
              'tab-overflow-left': getTabScroll(t, false) === 'left',
              'tab-overflow-right': getTabScroll(t, false) === 'right'
            }"
            :style="{
              flex: getOverflowFlex(t, isActiveComputed(t.tab), false),
              fontSize: t.fontSize + 'rem'
            }"
            @click.prevent.stop="onClick(t, navigate, $event)"
            @mouseenter="(e) => { handleTabHover(t, t.tab, e); handleTabTooltipEnter(e, t.label) }"
            @mouseleave="handleTabTooltipLeave"
            @touchstart="(e) => handleTabTooltipTouch(e, t.label)"
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
        <img class="logo" :src="faviconSrc" alt="Logo" />
      </div>
      <div v-if="title && showTitleOnMobile" class="title-text-mobile">
        {{ title }}
      </div>

      <nav
        ref="mobileNavRef"
        class="commonbar-tabs ui-scrollbar--hidden"
        :class="scrollClassMobile"
      >
        <RouterLink
          v-for="t in orderedMobileTabs"
          :key="t.tab"
          :to="t.to"
          custom
          v-slot="{ href, navigate }"
        >
          <a
            v-if="!t.hideOnMobile"
            :href="href"
            class="tab-item"
            :class="{
              active: isActiveComputed(t.tab),
              'tab-overflow-left': getTabScroll(t, true) === 'left',
              'tab-overflow-right': getTabScroll(t, true) === 'right'
            }"
            :style="{
              flex: getOverflowFlex(t, isActiveComputed(t.tab), true),
              fontSize: (t.mobileFontSize || t.fontSize) + 'rem'
            }"
            @click.prevent.stop="onClick(t, navigate, $event)"
            @mouseenter="(e) => handleTabTooltipEnter(e, t.label)"
            @mouseleave="handleTabTooltipLeave"
            @touchstart="(e) => handleTabTooltipTouch(e, t.label)"
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
          class="main-submenu-panel"
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

    <!-- Tab label tooltip -->
    <Teleport to="body">
      <Transition name="tab-tooltip-fade">
        <div
          v-if="tooltip.visible"
          class="tab-tooltip global-tooltip-surface"
          :style="tooltipStyle"
        >{{ tooltip.label }}</div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, useAttrs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
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
} from '@/utils/bar/commonBarNavigation.js'
import { useTabTooltip } from '@/composables/bar/useTabTooltip.js'
import { useScrollSnap } from '@/composables/bar/useScrollSnap.js'
import { currentColorTheme, COLOR_THEME_GREEN } from '@/composables/core/uiPreferences.js'

const faviconSrc = computed(() =>
  currentColorTheme.value === COLOR_THEME_GREEN
    ? new URL('@/assets/favicon_green.ico', import.meta.url).href
    : new URL('@/assets/favicon.ico', import.meta.url).href
)

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
const navRef = ref(null)
const mobileNavRef = ref(null)

// Tab label tooltip
const { tooltip, tooltipStyle, handleMouseEnter: handleTabTooltipEnter, handleMouseLeave: handleTabTooltipLeave, handleTouchStart: handleTabTooltipTouch } = useTabTooltip()

const getTabScroll = (tab, isMobile) => {
  return isMobile ? (tab.mobileScroll ?? tab.scroll) : tab.scroll
}

// Overflow scroll: sort tabs：左溢出 → 主 → 右溢出
const sortTabsByScroll = (tabs, isMobile) => {
  const left = tabs.filter(t => getTabScroll(t, isMobile) === 'left')
  const main = tabs.filter(t => !getTabScroll(t, isMobile) || (getTabScroll(t, isMobile) !== 'left' && getTabScroll(t, isMobile) !== 'right'))
  const right = tabs.filter(t => getTabScroll(t, isMobile) === 'right')
  return [...left, ...main, ...right]
}

const orderedTabs = computed(() => sortTabsByScroll(visibleTabs.value, false))
const orderedMobileTabs = computed(() => sortTabsByScroll(visibleTabs.value, true))

const { hasOverflowDesktop, hasOverflowMobile, scrollClass, scrollClassMobile, onScroll, onScrollEnd, navContentWidth } = useScrollSnap(
  navRef,
  orderedTabs,
  { desktop: 30, portrait: 18 },
  mobileNavRef,
  orderedMobileTabs
)

const hasOverflowForLayout = (isMobile) => isMobile ? hasOverflowMobile.value : hasOverflowDesktop.value

const getRenderedPrimaryTabs = (isMobile) =>
  (isMobile ? orderedMobileTabs.value : orderedTabs.value)
    .filter(t => !getTabScroll(t, isMobile) || (getTabScroll(t, isMobile) !== 'left' && getTabScroll(t, isMobile) !== 'right'))
    .filter(t => !isMobile || !t.hideOnMobile)

const getPrimaryTotalWeight = (isMobile) =>
  getRenderedPrimaryTabs(isMobile)
    .reduce((s, t) => s + getFlexWeight(t, isActiveComputed(t.tab), isMobile), 0) || 1

const getOverflowFlex = (t, isActive, isMobile) => {
  if (getTabScroll(t, isMobile)) return '0 0 auto'
  if (hasOverflowForLayout(isMobile)) {
    const w = getFlexWeight(t, isActive, isMobile)
    const totalWeight = getPrimaryTotalWeight(isMobile)
    if (navContentWidth.value > 0) {
      return `0 0 ${(w / totalWeight) * navContentWidth.value}px`
    }
    return `0 0 ${(w / totalWeight) * 100}%`
  }
  return getFlexWeight(t, isActive, isMobile) + ' 1 0'
}

// Submenu state management
const activeSubmenu = ref(null)
const submenuPosition = ref({ top: 0, left: 0 })
let closeSubmenuTimer = null

// Portrait layout detection
const isMobile = ref(false)
let portraitMediaQuery = null

const onPortraitChange = (e) => {
  isMobile.value = e.matches
}

const checkMobile = () => {
  portraitMediaQuery = window.matchMedia('(max-aspect-ratio: 1/1)')
  isMobile.value = portraitMediaQuery.matches
  portraitMediaQuery.addEventListener('change', onPortraitChange)
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
onMounted(async () => {
  checkMobile()
  document.addEventListener('click', closeSubmenu)
  if (normalizedNavigationSchema.value) {
    syncCommonBarMemoryFromRoute(normalizedNavigationSchema.value, route, router)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubmenu)
  if (portraitMediaQuery) {
    portraitMediaQuery.removeEventListener('change', onPortraitChange)
    portraitMediaQuery = null
  }
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
  router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-blue: var(--color-primary);
$primary-blue-dark: var(--color-primary-hover);
$active-blue: var(--color-primary-hover);
$text-primary: var(--text-dark);

$transition-fast: 0.2s;
$transition-base: 0.3s;
$submenu-easing: cubic-bezier(0.25, 0.8, 0.25, 1);

@mixin glass-control {
  background: linear-gradient(
    145deg,
    var(--glass-20),
    var(--glass-10)
  );
  border: 3px solid var(--glass-40);
}

.commonbar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  background: linear-gradient(
    145deg,
    var(--glass-30),
    var(--glass-20)
  );
  border-bottom: 1px solid var(--glass-50);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  @include glass-blur(12px, 160%);
}

/* 桌面端：单行，7.5dvh 高度 */
.commonbar-desktop {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  height: v-bind(height);
  padding: 0 1%;
}

.logo-and-title {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.commonbar-tabs {
  display: flex;
  flex: 1 1 auto;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: v-bind(height);
  margin: 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
}

.tab-item {
  display: flex;
  flex: 1 1 0;
  gap: 1px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 6.5dvh;
  color: $primary-blue;
  font-size: 1.3rem;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  // background: var(--glass-10);
  border-radius: var(--radius-md);
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    border-radius 0.25s ease,
    box-shadow 0.25s ease,
    height 0.25s ease;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &:hover {
    height: 90%;
    color: $primary-blue;
    background: rgba(var(--color-primary-rgb), 0.12);
  }

  &.active {
    color: $active-blue;
    font-weight: 1000;
    background: linear-gradient(
      145deg,
      var(--glass-20),
      var(--glass-10)
    );
    border: 3px solid var(--glass-40);
    border-radius: 0 0 25px 25px;
    box-shadow:
      0 6px 10px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.08);
    transition:
      background $transition-base ease,
      color $transition-base ease,
      border-color $transition-base ease,
      border-radius $transition-base ease,
      box-shadow $transition-base ease,
      height $transition-base ease;

    &:hover {
      margin: 0;
      background: linear-gradient(
        145deg,
        var(--glass-50),
        var(--glass-30)
      );
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    }
  }
}

.logo-container {
  flex-shrink: 0;
  width: 6dvh;
  min-width: 5dvh;
  height: 6dvh;
  cursor: pointer;
  border-radius: var(--radius-full);
  transition: all $transition-base ease;

  @include flex-center;
  @include glass-control;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.1);
  }
}

.logo {
  width: 80%;
  height: auto;
}

.title {
  display: flex;
  align-items: center;

  img {
    height: 7dvh;
    object-fit: contain;
  }
}

.title-text {
  display: flex;
  align-items: center;
  height: 7dvh;
  color: var(--text-primary);
  font-size: 1.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.login-container {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 6dvh;
  max-width: 10dvh;
  height: 6dvh;
  padding: 0 12px;
  color: $primary-blue-dark;
  cursor: pointer;
  border-radius: 30px;
  transition: all $transition-base ease;

  @include glass-control;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.05);
  }
}

.login-text {
  max-width: 80px;
  overflow: hidden;
  font-size: 1.15rem;
  font-weight: 600;
  white-space: nowrap;
}

/* 移动端：单行，8dvh 高度 */
.commonbar-mobile {
  display: none;
}

.title-text-mobile {
  flex-shrink: 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
  white-space: nowrap;
}

.avatar-container {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 6dvh;
  min-width: 6dvh;
  max-width: 6dvh;
  height: 6dvh;
  cursor: pointer;
  user-select: none;
}

@media (max-aspect-ratio: 1/1) {
  .commonbar-desktop {
    display: none;
  }

  .commonbar-mobile {
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: space-between;
    height: max(v-bind(mobileHeight), 44px);
    padding: 0 1%;

    .commonbar-tabs {
      display: flex;
      flex: 1 1 auto;
      gap: 4px;
      min-width: 0;
      margin: 0 6px;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .tab-item {
      flex-shrink: 0;
      height: max(6dvh, 40px);
      border-radius: 30px;

      &.active {
        border-radius: 30px;
      }
    }

    .logo-container {
      flex-shrink: 0;
      width: 5dvh;
      min-width: 5dvh;
      height: 5dvh;
    }

    .login-container {
      flex-shrink: 0;
      min-width: 6dvh;
      height: 6dvh;
    }
  }
}

/*
 * 子菜单通过 Teleport 渲染到 body，
 * 必须保留为顶层选择器。
 */
.main-submenu-panel {
  position: fixed;
  z-index: 10001;
  width: auto;
  max-width: min(300px, calc(100vw - 20px));
  padding: 8px;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    var(--glass-90),
    var(--glass-90)
  );
  border: 1px solid var(--glass-50);
  border-radius: var(--radius-lg);
  box-shadow:
    inset 0 0 0.5px var(--glass-30),
    0 12px 40px rgba(0, 0, 0, 0.2),
    0 0 0 0.5px var(--glass-10);

  @include glass-blur(20px, 180%);

  @media (max-aspect-ratio: 1/1) {
    max-width: calc(100vw - 20px);
  }
}

.submenu-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  color: $text-primary;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all $transition-fast $submenu-easing;

  &:hover {
    background: linear-gradient(
      145deg,
      rgba(var(--color-primary-rgb), 0.15),
      rgba(var(--color-primary-rgb), 0.08)
    );
    transform: translateX(4px);
  }

  @media (max-aspect-ratio: 1/1) {
    padding: 10px 14px;
    font-size: 14px;
  }
}

.submenu-icon {
  flex-shrink: 0;
  font-size: 18px;
}

.submenu-label {
  flex: 1;
  white-space: nowrap;
}

/* 子菜单过渡 */
.submenu-fade-enter-active,
.submenu-fade-leave-active {
  transition: all $transition-fast $submenu-easing;
}

.submenu-fade-enter-from,
.submenu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.tab-tooltip {
  padding: 6px 12px;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}

.tab-tooltip-fade-enter-active,
.tab-tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}

.tab-tooltip-fade-enter-from,
.tab-tooltip-fade-leave-to {
  opacity: 0;
}

.commonbar-tabs.has-overflow-tabs {
  justify-content: flex-start;
  overflow-x: scroll;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; width: 0; height: 0; }
}

.tab-overflow-left,
.tab-overflow-right {
  flex-shrink: 0;
}

@media (orientation: landscape) {
  .tab-overflow-left,
  .tab-overflow-right {
    padding-inline: 10px;
  }
}

@media (orientation: portrait) {
  .tab-overflow-left,
  .tab-overflow-right {
    padding-inline: 14px;
  }
}

</style>
