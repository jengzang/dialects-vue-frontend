<template>
  <div class="explorebar">
    <div ref="desktopRef" class="explorebar-desktop">
      <div class="logo-and-title" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div class="logo-container">
          <img class="logo" :src="faviconSrc" alt="Logo" />
        </div>
        <div class="title">
          <img src="/brand/title.webp" alt="Title" class="title-logo" />
        </div>
      </div>

      <button
        v-if="(showScrollArrows && canScrollLeft) || isScrolling"
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
        class="explorebar-tabs ui-scrollbar--hidden"
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
            <BarIcon :icon="t.icon" class="nav-icon" :weight="isActiveComputed(t.tab) ? 'fill' : 'bold'" />
            <span
              class="label"
              v-if="!t.showLabelOnlyWhenActive || isActiveComputed(t.tab)"
            >{{ t.label }}</span>
            <svg v-if="getTabChildren(t.tab).length" class="tab-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            <svg v-else-if="!t.navigation?.matchPages?.length && !t.navigation?.activeMatchPaths?.length" class="tab-external" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </span>
        </a>
      </RouterLink>
      </nav>

      <button
        v-if="(showScrollArrows && canScrollRight) || isScrolling"
        class="scroll-arrow scroll-arrow--right"
        :style="{ right: arrowRightPx + 'px' }"
        @mousedown.prevent="startScroll('right')"
        @mouseup="stopScroll"
        @mouseleave="stopScroll"
        @touchstart.prevent="startScroll('right')"
        @touchend="stopScroll"
      >▶</button>

      <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
        <NavAvatar />
      </div>
      <div v-else class="login-container" @click="goToAuthPage">
        <span class="login-text">{{ t('navigation.login') }}</span>
      </div>
    </div>

    <div class="explorebar-mobile">
      <div class="logo-container" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <img class="logo" :src="faviconSrc" alt="Logo" />
      </div>

      <nav
        ref="mobileNavRef"
        class="explorebar-tabs ui-scrollbar--hidden"
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
            <span class="tab-icon-label" :class="{ 'tab-icon-label--stack': !isActiveComputed(t.tab) && (t.mobileShowLabelOnlyWhenActive ?? t.showLabelOnlyWhenActive) !== false }">
              <span class="tab-icon-row">
                <BarIcon :icon="t.icon" class="nav-icon" :weight="isActiveComputed(t.tab) ? 'fill' : 'bold'" />
                <svg v-if="getTabChildren(t.tab).length" class="tab-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                <svg v-else-if="!t.navigation?.matchPages?.length && !t.navigation?.activeMatchPaths?.length" class="tab-external" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
              </span>
              <span
                class="label"
                :class="{ 'label--tiny': !isActiveComputed(t.tab) && (t.mobileShowLabelOnlyWhenActive ?? t.showLabelOnlyWhenActive) !== false }"
                v-if="!t.hideLabelOnMobile"
              >{{ t.label }}</span>
            </span>
          </a>
        </RouterLink>
      </nav>

      <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
        <NavAvatar />
      </div>
      <div v-else class="login-container" @click="goToAuthPage">
        <span class="login-text">{{ t('navigation.login') }}</span>
      </div>
    </div>

    <SimpleSidebar
      :is-open="isSidebarVisible"
      :show-title="isMobile"
      @close="isSidebarVisible = false"
    />

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
          class="tab-tooltip tooltip-surface"
          :style="tooltipStyle"
        >{{ tooltip.label }}</div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { useI18n } from 'vue-i18n'
import { userStore } from '@/main/store/store.js'
import NavAvatar from '@/components/bar/NavAvatar.vue'
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import {
  useExploreBarConfig,
  getExploreBarTabs,
  filterVisibleExploreBarTabs,
  getExploreBarChildren,
  getExploreBarActiveTab,
  matchExploreBarChildRoute
} from '@/main/config/BarAndTabs/ExploreBarConfig.js'
import { useTabTooltip } from '@/composables/bar/useTabTooltip.js'
import { useTabPill } from '@/composables/bar/useTabPill.js'
import { useScrollSnap } from '@/composables/bar/useScrollSnap.js'
import { useScrollArrows } from '@/composables/bar/useScrollArrows.js'
import { useBarOverflow, getDefaultTabScroll, sortTabsByScroll } from '@/composables/bar/useBarOverflow.js'
import { currentColorTheme, COLOR_THEME_GREEN } from '@/composables/core/uiPreferences.js'

const props = defineProps({
  showScrollArrows: {
    type: Boolean,
    default: true,
  },
  scrollArrowAmount: {
    type: Number,
    default: 100,
  },
})

const faviconSrc = computed(() =>
  currentColorTheme.value === COLOR_THEME_GREEN
    ? '/brand/favicon_green.ico'
    : '/brand/favicon.ico'
)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const STORAGE_KEY_PREFIX = 'explore_last_child_'

const exploreBarConfig = useExploreBarConfig()
const tabs = computed(() => {
  return filterVisibleExploreBarTabs(getExploreBarTabs(exploreBarConfig.value))
})

const isSidebarVisible = ref(false)
const activeSubmenu = ref(null)
const desktopRef = ref(null)
const navRef = ref(null)
const mobileNavRef = ref(null)

// Tab label tooltip
const { tooltip, tooltipStyle, handleMouseEnter: handleTabTooltipEnter, handleMouseLeave: handleTabTooltipLeave, handleTouchStart: handleTabTooltipTouch } = useTabTooltip()

const { pillStyle: desktopPillStyle } = useTabPill(navRef, '.tab-inner.active', route)
const { pillStyle: mobilePillStyle } = useTabPill(mobileNavRef, '.tab-item.active', route)

const getTabScroll = (tab, isMobile) => getDefaultTabScroll(tab, isMobile)

const orderedTabs = computed(() => sortTabsByScroll(tabs.value, false, getTabScroll))
const orderedMobileTabs = computed(() => sortTabsByScroll(tabs.value, true, getTabScroll))

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
  props.scrollArrowAmount,
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

const submenuPosition = ref({ top: 0, left: 0 })
let closeSubmenuTimer = null

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

const getTabChildren = (tabKey) => {
  const children = getExploreBarChildren(exploreBarConfig.value, tabKey)
  return children.filter((child) => {
    if (typeof child.visibleWhen === 'function') {
      return child.visibleWhen()
    }
    return true
  })
}

const getLastChildPath = (tabKey) => {
  try {
    return sessionStorage.getItem(STORAGE_KEY_PREFIX + tabKey)
  } catch (error) {
    console.warn('Failed to read ExploreBar memory:', error)
    return null
  }
}

const saveLastChildPath = (tabKey, childPath) => {
  try {
    if (childPath) {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + tabKey, childPath)
    } else {
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + tabKey)
    }
  } catch (error) {
    console.warn('Failed to write ExploreBar memory:', error)
  }
}

const doesChildMatchCurrentRoute = (childPath) => {
  return matchExploreBarChildRoute(childPath, route, router)
}

const resolveExploreBarTarget = (tabConfig, children) => {
  if (!tabConfig?.navigation?.rememberChild || children.length === 0) {
    return tabConfig.to
  }

  const rememberedChildPath = getLastChildPath(tabConfig.tab)
  const childPaths = children.map((child) => child.path)

  if (rememberedChildPath && childPaths.includes(rememberedChildPath)) {
    return rememberedChildPath
  }

  if (tabConfig.navigation?.defaultChild) {
    return tabConfig.navigation.defaultChild
  }

  return tabConfig.to
}

watch(
  () => [route.path, route.fullPath],
  () => {
    for (const tabKey of Object.keys(exploreBarConfig.value)) {
      const matchedChild = getTabChildren(tabKey).find((child) => {
        return !child.external && doesChildMatchCurrentRoute(child.path)
      })

      if (matchedChild) {
        saveLastChildPath(tabKey, matchedChild.path)
        break
      }
    }
  },
  { immediate: true }
)

onMounted(async () => {
  checkMobile()
  document.addEventListener('click', closeSubmenu)
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

const getCurrentTab = () => {
  return getExploreBarActiveTab(tabs.value, route, router)
}

const isActiveComputed = (tabName) => {
  return getCurrentTab() === tabName
}

const onClick = async (tabConfig, navigate, event) => {
  if (tabConfig.isPseudo) {
    toggleSidebar()
    return
  }

  const children = getTabChildren(tabConfig.tab)

  if (!isMobile.value) {
    const target = resolveExploreBarTarget(tabConfig, children)

    if (target) {
      await router.replace(target)
    }
  } else if (children.length > 0) {
    handleTabClick(tabConfig, tabConfig.tab, event)
  } else if (tabConfig.to) {
    await router.replace(tabConfig.to)
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
    router.push(child.path)
  }
  activeSubmenu.value = null
}

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

$desktop-bar-height: 6.5dvh;
$desktop-tab-height: 5.8dvh;

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

.explorebar {
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

.explorebar-desktop {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  height: $desktop-bar-height;
  padding: 0 1%;
}

.logo-and-title {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.explorebar-tabs {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 1200px;
  height: $desktop-bar-height;
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
  height: $desktop-tab-height;
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
  min-width: 0;
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
  width: 5.5dvh;
  min-width: 5dvh;
  height: 5.5dvh;
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

.explorebar-mobile {
  display: none;
}

@media (max-aspect-ratio: 1/1) {
  .explorebar-desktop {
    display: none;
  }

  .explorebar-mobile {
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: space-between;
    height: max(7dvh, 40px);
    padding: 0 1%;

    .explorebar-tabs {
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

      .tab-icon-label {
        display: flex;
        align-items: center;
        gap: 1px;
        min-width: 0;
      }

      .tab-icon-label--stack {
        flex-direction: column;
      }

      .tab-icon-row {
        display: flex;
        align-items: center;
      }

      .nav-icon, .label {
        font-size: 0.9em;
      }

      .tab-chevron,
      .tab-external {
        flex-shrink: 0;
        margin-left: 1px;
        opacity: 0.6;
      }

      .label--tiny {
        font-size: 0.45em !important;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1;
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
 * 必须保持为顶层选择器。
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

.explorebar-tabs.has-overflow-tabs {
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

@media (orientation: portrait) {
  .tab-overflow-left,
  .tab-overflow-right {
    padding-inline: 14px;
  }
}

</style>
