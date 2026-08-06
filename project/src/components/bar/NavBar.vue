<template>
  <div class="navbar">
    <!-- 桌面端的布局 -->
    <div ref="desktopRef" class="navbar-desktop">
      <div  class="navbar-item logo-and-title" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div @click="toggleSidebar" class="logo-container desktop-brand-logo">
          <img class="logo" :src="faviconSrc" alt="Logo" />
        </div>
        <div class="title">
          <img src="../../assets/picture/title.png" alt="Title" class="title-logo" />
        </div>
      </div>
      <button
        v-if="canScrollLeft"
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
          class="navbar-btn"
          :class="scrollClass"
      >
      <!-- <nav 
          ref="navRef" 
          class="navbar-btn" 
          :class="scrollClassMobile"
          @scroll="onScroll" 
          @scrollend="onScrollEnd"
      > -->
        <RouterLink
            v-for="t in orderedTabs"
            :key="t.tab"
            :to="resolveMenuBarTarget(t)"
            custom
            v-slot="{ href, navigate }"
        >
          <a
              :href="href"
              class="menu-item"
              :class="[
                { active: isMenuTabActive(t.tab) },
                t.cssClass,
                { 'tab-overflow-left': getTabScroll(t, false) === 'left', 'tab-overflow-right': getTabScroll(t, false) === 'right' }
              ]"
              :style="{
                flex: getOverflowFlex(t, isMenuTabActive(t.tab), false),
                fontSize: t.fontSize + 'rem'
              }"
              @click.prevent="onMenuBarClick(t, navigate)"
              @mouseenter="(e) => handleTabTooltipEnter(e, t.label)"
              @mouseleave="handleTabTooltipLeave"
              @touchstart="(e) => handleTabTooltipTouch(e, t.label)"
          >
          <span class="emoji">{{ t.icon }}</span>
          <span
            class="label"
            v-if="!t.showLabelOnlyWhenActive || isMenuTabActive(t.tab)"
          >{{ t.label }}</span>
          </a>
        </RouterLink>
      </nav>

      <button
        v-if="canScrollRight"
        class="scroll-arrow scroll-arrow--right"
        :style="{ right: arrowRightPx + 'px' }"
        @mousedown.prevent="startScroll('right')"
        @mouseup="stopScroll"
        @mouseleave="stopScroll"
        @touchstart.prevent="startScroll('right')"
        @touchend="stopScroll"
      >▶</button>

      <div class="settings-icon-container" @click="goToSettings" :title="t('navigation.submenu.about.setting')">
        ⚙️
      </div>
      <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
        <NavAvatar />
      </div>
      <div v-else class="logo-container desktop-login-button" @click="goToAuthPage">
        <!-- 显示用户名或"登录" -->
        <span class="login-text">
          {{ t('navigation.login') }}
        </span>
      </div>
    </div>

    <SimpleSidebar
      :is-open="isSidebarVisible"
      :show-title="false"
      @close="isSidebarVisible = false"
    />

    <div class="navbar-content">
      <!-- 第一部分：Logo、标题和登录按钮 -->
      <div class="navbar-top">
        <div class="navbar-item logo-and-title" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
          <div @click="toggleSidebar" class="logo-container mobile-brand-logo">
            <img class="logo" :src="faviconSrc" alt="Logo" />
          </div>
          <div class="title">
            <img src="../../assets/picture/title.png" alt="Title" class="title-logo" />
          </div>
        </div>
        <div class="navbar-top-actions">
          <div class="settings-icon-container" @click="goToSettings" :title="t('navigation.submenu.about.setting')">
            ⚙️
          </div>
          <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
            <NavAvatar />
          </div>
          <div v-else class="logo-container mobile-login-button" @click="goToAuthPage">
            <!-- 显示用户名或"登录" -->
            <span class="login-text">
              {{ t('navigation.login') }}
            </span>
          </div>
        </div>
      </div>

      <!-- 第二部分：导航按钮 -->
      <div ref="mobileNavRef" 
          class="navbar-bottom" 
          :class="scrollClass" 
      >
      <!-- <div ref="mobileNavRef" 
          class="navbar-bottom" 
          :class="scrollClass" 
          @scroll="onScroll" 
          @scrollend="onScrollEnd"
      > -->
        <RouterLink
            v-for="t in orderedMobileTabs"
            :key="t.tab"
            :to="resolveMenuBarTarget(t)"
            custom
            v-slot="{ href, navigate }"
        >
          <a
              v-if="!t.hideOnMobile"
              :href="href"
              class="menu-item"
              :class="[
                { active: isMenuTabActive(t.tab) },
                t.cssClass,
                { 'tab-overflow-left': getTabScroll(t, true) === 'left', 'tab-overflow-right': getTabScroll(t, true) === 'right' }
              ]"
              :style="{
                flex: getOverflowFlex(t, isMenuTabActive(t.tab), true),
                fontSize: (t.mobileFontSize || t.fontSize) + 'rem'
              }"
              @click.prevent="onMenuBarClick(t, navigate)"
              @mouseenter="(e) => handleTabTooltipEnter(e, t.label)"
              @mouseleave="handleTabTooltipLeave"
              @touchstart="(e) => handleTabTooltipTouch(e, t.label)"
          >
            <span class="emoji">{{ t.icon }}</span>
            <span
              class="label"
              v-if="!t.hideLabelOnMobile && (!(t.mobileShowLabelOnlyWhenActive ?? t.showLabelOnlyWhenActive) || isMenuTabActive(t.tab))"
            >{{ t.label }}</span>
          </a>
        </RouterLink>
      </div>
    </div>

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
import { ref, computed, watch } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  filterVisibleMenuBarTabs,
  getMenuBarActiveTab,
  isMenuBarRouteMatch,
  resolveMenuBarTarget,
  syncMenuBarMemoryFromRoute,
  useMenuBarConfig
} from '@/main/config/index.js'
import { userStore } from '@/main/store/store.js'
import NavAvatar from '@/components/bar/NavAvatar.vue'
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { useTabTooltip } from '@/composables/bar/useTabTooltip.js'
import { useScrollSnap } from '@/composables/bar/useScrollSnap.js'
import { useScrollArrows } from '@/composables/bar/useScrollArrows.js'
import { currentColorTheme, COLOR_THEME_GREEN } from '@/composables/core/uiPreferences.js'
import { showSuccess } from '@/utils/ui/message.js'

const faviconSrc = computed(() =>
  currentColorTheme.value === COLOR_THEME_GREEN
    ? new URL('@/assets/favicon_green.ico', import.meta.url).href
    : new URL('@/assets/favicon.ico', import.meta.url).href
)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const isSidebarVisible = ref(false)
const desktopRef = ref(null)
const navRef = ref(null)
const mobileNavRef = ref(null)

// Tab label tooltip
const { tooltip, tooltipStyle, handleMouseEnter: handleTabTooltipEnter, handleMouseLeave: handleTabTooltipLeave, handleTouchStart: handleTabTooltipTouch } = useTabTooltip()

// ===== sessionStorage 管理：记住每个 tab 的最后访问的 sub =====
watch(() => route.path, () => {
  syncMenuBarMemoryFromRoute(route)
}, { immediate: true })
// ===== sessionStorage 管理结束 =====

// 过滤可见的 tabs（label 已在 TabsConfig 中定义）
const allMenuTabs = useMenuBarConfig()
const tabs = computed(() => filterVisibleMenuBarTabs(allMenuTabs.value))

const getTabScroll = (tab, isMobile) => {
  return isMobile ? (tab.mobileScroll ?? tab.scroll) : tab.scroll
}

// Overflow scroll: sort tabs：左溢出 → 主 → 右溢出
const sortTabsByScroll = (tabs, isMobile) => {
  const all = tabs
  const left = all.filter(t => getTabScroll(t, isMobile) === 'left')
  const main = all.filter(t => !getTabScroll(t, isMobile) || (getTabScroll(t, isMobile) !== 'left' && getTabScroll(t, isMobile) !== 'right'))
  const right = all.filter(t => getTabScroll(t, isMobile) === 'right')
  return [...left, ...main, ...right]
}

const orderedTabs = computed(() => sortTabsByScroll(tabs.value, false))
const orderedMobileTabs = computed(() => sortTabsByScroll(tabs.value, true))

const { hasOverflowDesktop, hasOverflowMobile, scrollClass, scrollClassMobile, onScroll, onScrollEnd, navContentWidth } = useScrollSnap(
  navRef,
  orderedTabs,
  { desktop: 30, portrait: 18 },
  mobileNavRef,
  orderedMobileTabs
)

const { canScrollLeft, canScrollRight, arrowLeftPx, arrowRightPx, startScroll, stopScroll } = useScrollArrows(
  navRef,
  hasOverflowDesktop,
  100,
  desktopRef
)

const hasOverflowForLayout = (isMobile) => isMobile ? hasOverflowMobile.value : hasOverflowDesktop.value

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

const getRenderedPrimaryTabs = (isMobile) =>
  (isMobile ? orderedMobileTabs.value : orderedTabs.value)
    .filter(t => !getTabScroll(t, isMobile) || (getTabScroll(t, isMobile) !== 'left' && getTabScroll(t, isMobile) !== 'right'))
    .filter(t => !isMobile || !t.hideOnMobile)

const getPrimaryTotalWeight = (isMobile) =>
  getRenderedPrimaryTabs(isMobile)
    .reduce((s, t) => s + getFlexWeight(t, isMenuTabActive(t.tab), isMobile), 0) || 1

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

const isMenuTabActive = (tabName) => {
  return getMenuBarActiveTab(tabs.value, route) === tabName
}

const onMenuBarClick = async (tabConfig, navigate) => {
  if (tabConfig.isPseudo) {
    toggleSidebar()
    return
  }

  const targetRoute = resolveMenuBarTarget(tabConfig, route)
  if (isMenuBarRouteMatch(targetRoute, route)) return

  await router.replace(targetRoute)
}

const goToAuthPage = () => {
  if (userStore.isAuthenticated) {
    router.push({ path: buildLocalePath(resolveRouteLocale(route), '/auth'), query: { view: 'profile' } })
  } else {
    router.push({
      path: buildLocalePath(resolveRouteLocale(route), '/auth'),
      query: { redirect: route.fullPath },
    })
  }
}

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}

const goToSettings = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/settings'))
  showSuccess(t('navigation.submenu.about.setting'))
}
</script>




<style scoped lang="scss">

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);

$mobile-aspect-ratio: 1;

// 桌面端不再直接使用 10dvh，避免高分辨率屏幕上导航栏过高。
$desktop-navbar-height: clamp(64px, 7dvh, 82px);
$desktop-control-size: clamp(44px, 4.8dvh, 56px);
$desktop-title-height: clamp(50px, 6.2dvh, 70px);

@mixin soft-glass-background {
  background: linear-gradient(
    145deg,
    var(--glass-20),
    var(--glass-10)
  );
}

@mixin soft-glass-shadow {
  box-shadow:
    0 6px 10px rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.08);
}

/* 导航栏根容器 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  box-sizing: border-box;

  @include flex-center;

  background: linear-gradient(135deg, var(--glass-20), var(--glass-10));
  border: 1px solid var(--glass-30);
  box-shadow: var(--shadow-glass-inset);
  backdrop-filter: blur(6px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

/* 桌面端 */
.navbar-desktop {
  position: relative;
  width: 100%;
  height: $desktop-navbar-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 0 0.5%;
}

.navbar-btn {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 1200px;
  height: 100%;
  margin: 0 clamp(10px, 1vw, 20px);

  @include flex-center;
}

.navbar-item {
  padding: 4px;
  color: var(--text-white);
  font-size: 1rem;
  transition: transform 0.3s;

  @include flex-center;

  &:hover {
    transform: scale(1.05);
  }
}

.logo-and-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 5px;
  cursor: pointer;
}

.logo-container {
  flex: 0 0 auto;
  // box-sizing: border-box;
  padding: 5px;

  @include flex-col;

  align-items: center;
  justify-content: center;
  gap: 4px;

  @include glass-blur(15px, 150%);
  @include soft-glass-background;
  @include soft-glass-shadow;

  border: 3px solid var(--glass-40);
  border-radius: var(--radius-full);
  color: var(--color-primary-hover);
  text-align: center;
  font-weight: 1000;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.desktop-brand-logo {
  width: $desktop-control-size;
  min-width: $desktop-control-size;
  height: $desktop-control-size;
}

.desktop-login-button {
  width: auto;
  min-width: $desktop-control-size;
  height: $desktop-control-size;
  margin-right: 10px;
  padding-inline: 12px;
  border-radius: 30px;
}

.desktop-brand-logo,
.desktop-login-button {
  box-sizing: border-box;
}

.logo {
  display: block;
  width: 90%;
  height: auto;
}

.title {
  min-width: 0;
  display: flex;
  align-items: center;

  img {
    display: block;
    width: auto;
    height: $desktop-title-height;
    max-width: clamp(110px, 14vw, 190px);
    padding: 0;
    object-fit: contain;
  }
}

.menu-item {
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;

  @include flex-center;

  gap: 1px;
  border-radius: var(--radius-md);
  color: $primary;
  white-space: nowrap;
  text-align: center;
  text-decoration: none;
  font-size: 1.3rem;
  cursor: pointer;
  user-select: none;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    border-radius 0.25s ease,
    box-shadow 0.25s ease,
    height 0.25s ease;

  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.12);
    color: $primary;
  }

  &.active {
    @include soft-glass-background;
    @include soft-glass-shadow;

    border: 3px solid var(--glass-40);
    border-radius: 0 0 25px 25px;
    color: var(--color-primary-hover);
    font-weight: 1000;
    transition:
      background 0.3s ease,
      color 0.3s ease,
      border-color 0.3s ease,
      border-radius 0.3s ease,
      box-shadow 0.3s ease,
      height 0.3s ease;

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

.login-text {
  display: block;
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.avatar-container {
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;

  @include flex-center;
}

.navbar-desktop .avatar-container {
  flex: 0 0 calc(#{$desktop-control-size} + 10px);
  width: calc(#{$desktop-control-size} + 10px);
  min-width: calc(#{$desktop-control-size} + 10px);
  max-width: calc(#{$desktop-control-size} + 10px);
  height: calc(#{$desktop-control-size} + 10px);
  margin-right: 10px;
}

.settings-icon-container {
  @include flex-center;

  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  margin-right: 2px;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  border-radius: var(--radius-full);
  transition: all 0.3s ease;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    background: rgba(var(--color-primary-rgb), 0.1);
    transform: rotate(30deg);
  }
}

/* 移动端导航布局 */
.navbar-content {
  position: relative;
  top: 0;
  width: 100%;
  height: 16.5dvh;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0.5dvh;
  box-sizing: border-box;
  padding: 0 0.5%;
}

.navbar-top {
  position: relative;
  width: 100%;
  height: 10dvh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 0 10px;

  .logo-container {
    @include flex-center;

    background: var(--glass-20);
    border-radius: var(--radius-full);
    color: $primary-dark;
    cursor: pointer;
    user-select: none;
  }

  .login-text {
    display: block;
    max-width: 100px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.mobile-brand-logo {
  width: 6dvh;
  min-width: 6dvh;
  height: 6dvh;
}

.mobile-login-button {
  width: auto;
  min-width: 6dvh;
  height: 5dvh;
  padding-inline: 12px;
  border-radius: 30px;
}

.navbar-top-actions {
  display: flex;
  align-items: center;
}

.navbar-top .avatar-container {
  flex: 0 0 calc(6dvh + 16px);
  width: calc(6dvh + 16px);
  min-width: calc(6dvh + 16px);
  max-width: calc(6dvh + 16px);
  height: calc(6dvh + 16px);
}

.navbar-bottom {
  width: 100%;
  height: 6dvh;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
  padding: 0 10px;
}

/* 横竖屏切换 */
@media (max-aspect-ratio: $mobile-aspect-ratio) {
  .navbar-desktop {
    display: none;
  }

  .navbar-content {
    display: flex;
  }

  .menu-item {
    height: 6dvh !important;
    border-radius: 30px !important;
  }

  .title {
    img {
      height: 9dvh;
      max-width: none;
    }
  }
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

.navbar-btn.has-overflow-tabs,
.navbar-bottom.has-overflow-tabs {
  justify-content: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
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

.scroll-arrow {
  position: absolute;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--text-dark);
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  background: var(--glass-40);
  border: 1px solid var(--glass-50);
  border-radius: var(--radius-full);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background 0.2s ease, opacity 0.2s ease;

  &:hover {
    background: var(--glass-70);
  }

  &:active {
    background: var(--glass-90);
  }
}

@media (max-aspect-ratio: 1/1) {
  .scroll-arrow {
    display: none;
  }
}

</style>
