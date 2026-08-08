<template>
  <div class="commonbar">
    <!-- 桌面端：单行布局 -->
    <div ref="desktopRef" class="commonbar-desktop">
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

      <button
        v-if="(scrollArrows && canScrollLeft) || isScrolling"
        class="scroll-arrow scroll-arrow--left"
        :style="{ left: arrowLeftPx + 'px' }"
        @mousedown.prevent="startScroll('left')"
        @mouseup="stopScroll"
        @mouseleave="stopScroll"
        @touchstart.prevent="startScroll('left')"
        @touchend="stopScroll"
      >◀</button>

      <nav
        ref="navRef"
        class="commonbar-tabs ui-scrollbar--hidden"
        :class="scrollClass"
        @mouseleave="handleTabLeave"
      >
        <div class="tab-pill" :style="desktopPillStyle" />
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
            'tab-overflow-left': getTabScroll(t, false) === 'left',
            'tab-overflow-right': getTabScroll(t, false) === 'right'
          }"
          :style="{
            flex: getOverflowFlex(t, isActiveComputed(t.tab), false),
            minWidth: getOverflowMinWidth(t, false),
            maxWidth: getOverflowMaxWidth(t, false),
            fontSize: t.fontSize + 'rem'
          }"
          @click.prevent.stop="onClick(t, navigate, $event)"
          @mouseenter="(e) => { handleTabHover(t, t.tab, e); handleTabTooltipEnter(e, t.label) }"
          @mouseleave="handleTabTooltipLeave"
          @touchstart="(e) => handleTabTooltipTouch(e, t.label)"
        >
          <span class="tab-inner" :class="{ active: isActiveComputed(t.tab) }">
            <BarIcon :icon="t.icon" class="nav-icon" :style="{ fontSize: ((t.mobileFontSize || t.fontSize) * 1) + 'rem' }" />
            <span
              class="label"
              v-if="!t.showLabelOnlyWhenActive || isActiveComputed(t.tab)"
            >{{ t.label }}</span>
            <svg v-if="getTabChildren(t.tab)?.length" class="tab-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            <svg v-else-if="t.to && !t.to.startsWith('/villagesML')" class="tab-external" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </span>
        </a>
      </RouterLink>
      </nav>

      <button
        v-if="(scrollArrows && canScrollRight) || isScrolling"
        class="scroll-arrow scroll-arrow--right"
        :style="{ right: arrowRightPx + 'px' }"
        @mousedown.prevent="startScroll('right')"
        @mouseup="stopScroll"
        @mouseleave="stopScroll"
        @touchstart.prevent="startScroll('right')"
        @touchend="stopScroll"
      >▶</button>

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
        <div class="tab-pill tab-pill--mobile" :style="mobilePillStyle" />
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
              minWidth: getOverflowMinWidth(t, true),
              maxWidth: getOverflowMaxWidth(t, true),
              fontSize: (t.mobileFontSize || t.fontSize) + 'rem'
            }"
            @click.prevent.stop="onClick(t, navigate, $event)"
            @mouseenter="(e) => handleTabTooltipEnter(e, t.label)"
            @mouseleave="handleTabTooltipLeave"
            @touchstart="(e) => handleTabTooltipTouch(e, t.label)"
          >
            <BarIcon :icon="t.icon" class="nav-icon" :style="{ fontSize: ((t.mobileFontSize || t.fontSize) * 1.2) + 'rem' }" />
            <span
              class="label"
              v-if="!t.hideLabelOnMobile && (!(t.mobileShowLabelOnlyWhenActive ?? t.showLabelOnlyWhenActive) || isActiveComputed(t.tab))"
            >{{ t.label }}</span>
            <svg v-if="getTabChildren(t.tab)?.length" class="tab-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            <svg v-else-if="t.to && !t.to.startsWith('/villagesML')" class="tab-external" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
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
            <BarIcon :icon="child.icon" class="submenu-icon" />
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
import BarIcon from '@/components/common/BarIcon.vue'
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
import { useTabPill } from '@/composables/bar/useTabPill.js'
import { useScrollSnap } from '@/composables/bar/useScrollSnap.js'
import { useScrollArrows } from '@/composables/bar/useScrollArrows.js'
import { useBarOverflow, getDefaultTabScroll, sortTabsByScroll } from '@/composables/bar/useBarOverflow.js'
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
const scrollArrows = computed(() => props.layoutConfig?.scrollArrows ?? true)
const scrollArrowAmount = computed(() => props.layoutConfig?.scrollArrowAmount ?? 100)
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
const desktopRef = ref(null)
const navRef = ref(null)
const mobileNavRef = ref(null)

// Tab label tooltip
const { tooltip, tooltipStyle, handleMouseEnter: handleTabTooltipEnter, handleMouseLeave: handleTabTooltipLeave, handleTouchStart: handleTabTooltipTouch } = useTabTooltip()

const { pillStyle: desktopPillStyle } = useTabPill(navRef, '.tab-inner.active', route)
const { pillStyle: mobilePillStyle } = useTabPill(mobileNavRef, '.tab-item.active', route)

const getTabScroll = (tab, isMobile) => getDefaultTabScroll(tab, isMobile)

const orderedTabs = computed(() => sortTabsByScroll(visibleTabs.value, false, getTabScroll))
const orderedMobileTabs = computed(() => sortTabsByScroll(visibleTabs.value, true, getTabScroll))

const { hasOverflowDesktop, hasOverflowMobile, scrollClass, scrollClassMobile, onScroll, onScrollEnd, navContentWidth } = useScrollSnap(
  navRef,
  orderedTabs,
  { desktop: 30, portrait: 18 },
  mobileNavRef,
  orderedMobileTabs
)

const { canScrollLeft, canScrollRight, isScrolling, arrowLeftPx, arrowRightPx, startScroll, stopScroll } = useScrollArrows(
  navRef,
  hasOverflowDesktop,
  scrollArrowAmount.value,
  desktopRef
)

const { getOverflowFlex, getOverflowMinWidth, getOverflowMaxWidth } = useBarOverflow({
  orderedTabs,
  orderedMobileTabs,
  hasOverflowDesktop,
  hasOverflowMobile,
  navContentWidth,
  getTabScroll,
  resolveIsActive: (tabName) => isActiveComputed(tabName),
})

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
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/auth'),
    query: { redirect: route.fullPath },
  })
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use './bar-shared' as *;

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

  @include glass-blur(8px, 160%);
  will-change: backdrop-filter;
}

/* 桌面端：单行，7.5dvh 高度 */
.commonbar-desktop {
  position: relative;
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
  position: relative;
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
  border-radius: var(--radius-md);
}

.tab-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1px;
  --tab-pad: clamp(3px, 1.2vw, 14px);
  height: calc(100% - clamp(3px, 1dvh, 6px));
  margin: 0 calc(var(--tab-pad) * -1);
  padding: 0 var(--tab-pad);
  font-size: 0.9em;
  border: 3px solid transparent;
  border-radius: var(--radius-md);

  &:has(.tab-chevron),
  &:has(.tab-external) {
    padding-right: calc(var(--tab-pad) / 2);
  }

  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    border-radius 0.25s ease,
    box-shadow 0.25s ease,
    font-size 0.25s ease;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .tab-chevron,
  .tab-external {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .tab-item:hover &:not(.active) {
    background: rgba(var(--color-primary-rgb), 0.12);
  }

  &.active {
    position: relative;
    color: $active-blue;
    font-weight: 1000;
    font-size: 1.1em;
    background: linear-gradient(
      145deg,
      var(--glass-20),
      var(--glass-10)
    );
    border: 3px solid var(--glass-40);
    border-radius: 25px;
    box-shadow:
      0 6px 10px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.08);
    transition:
      background $transition-base ease 0.6s,
      color $transition-base ease 0.6s,
      border-color $transition-base ease 0.6s,
      border-radius $transition-base ease 0.6s,
      box-shadow $transition-base ease 0.6s,
      font-size $transition-base ease 0.6s;

    &::after {
      content: '';
      position: absolute;
      bottom: 3px;
      left: 50%;
      transform: translateX(-50%);
      width: 65%;
      height: 2px;
      background: var(--color-primary-hover);
      border-radius: 2px;
      opacity: 0.5;
    }

    &:hover {
      background: linear-gradient(
        145deg,
        var(--glass-50),
        var(--glass-30)
      );
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    }
  }
}

.tab-pill {
  position: absolute;
  z-index: 0;
  left: 0;
  top: 50%;
  pointer-events: none;
  background: linear-gradient(
    145deg,
    var(--glass-20),
    var(--glass-10)
  );
  border-radius: 25px;
  box-shadow:
    0 6px 10px rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.6s cubic-bezier(0.25, 0.1, 0.0, 1.0),
    width 0.6s cubic-bezier(0.25, 0.1, 0.0, 1.0),
    opacity 0.15s ease;

  &--mobile {
    border-radius: 30px;
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
  font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', '楷体', 'Songti SC', 'Noto Serif SC', 'STSong', 'SimSun', 'PingFang SC', 'Microsoft YaHei', serif;
  letter-spacing: 0.05em;
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
      border: 3px solid transparent;

      .nav-icon, .label {
        font-size: 0.9em;
      }

      .tab-chevron,
      .tab-external {
        flex-shrink: 0;
        margin-left: 1px;
        opacity: 0.6;
      }

      &.active {
        position: relative;
        z-index: 1;
        color: $active-blue;
        font-weight: 1000;
        background: linear-gradient(
          145deg,
          var(--glass-20),
          var(--glass-10)
        );
        border: 3px solid var(--glass-40);
        border-radius: 30px;
        box-shadow:
          0 6px 10px rgba(0, 0, 0, 0.1),
          0 1px 4px rgba(0, 0, 0, 0.08);
        transition: 0.3s ease 0.6s;

        .nav-icon, .label {
          font-size: 1.1em;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 65%;
          height: 2px;
          background: var(--color-primary-hover);
          border-radius: 2px;
          opacity: 0.5;
        }
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

@include bar-tab-tooltip;

.commonbar-tabs.has-overflow-tabs {
  @include bar-has-overflow-tabs;
}

.tab-overflow-left,
.tab-overflow-right {
  @include bar-overflow-tabs;
}

.scroll-arrow {
  @include bar-scroll-arrow;
}

@media (max-aspect-ratio: 1/1) {
  .scroll-arrow {
    display: none;
  }
}

</style>
