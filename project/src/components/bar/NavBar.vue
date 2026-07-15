<template>
  <div class="navbar">
    <!-- 桌面端的布局 -->
    <div class="navbar-desktop">
      <div  class="navbar-item logo-and-title" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div @click="toggleSidebar" class="logo-container" style="min-width: 6dvh;width: 6dvh;">
          <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
        </div>
        <div class="title">
          <img src="../../assets/picture/title.png" alt="Title" />
        </div>
      </div>
      <nav class="navbar-btn">
        <RouterLink
            v-for="t in tabs"
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
                t.cssClass
              ]"
              :style="{
                flex: getFlexWeight(t, isMenuTabActive(t.tab), false) + ' 1 0',
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
      <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
        <NavAvatar />
      </div>
      <div v-else class="logo-container" style="color: var(--color-primary-hover);border-radius: 30px" @click="goToAuthPage">
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
          <div @click="toggleSidebar" class="logo-container" style="width: 6dvh;min-width: 6dvh" >
            <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
          </div>
          <div class="title">
            <img src="../../assets/picture/title.png" alt="Title" />
          </div>
        </div>
        <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
          <NavAvatar />
        </div>
        <div v-else class="logo-container" style="color: var(--color-primary-hover); border-radius: 30px;height: 5dvh" @click="goToAuthPage">
          <!-- 显示用户名或"登录" -->
          <span class="login-text">
            {{ t('navigation.login') }}
          </span>
        </div>
      </div>

      <!-- 第二部分：导航按钮 -->
      <div class="navbar-bottom">
        <RouterLink
            v-for="t in tabs"
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
                t.cssClass
              ]"
              :style="{
                flex: getFlexWeight(t, isMenuTabActive(t.tab), true) + ' 1 0',
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
import { ref, computed, watch} from 'vue'
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
import { useTabTooltip } from '@/components/bar/useTabTooltip.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const isSidebarVisible = ref(false)

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

const isMenuTabActive = (tabName) => {
  return getMenuBarActiveTab(tabs.value, route) === tabName
}

const onMenuBarClick = async (tabConfig, navigate) => {
  if (tabConfig.isPseudo) {
    toggleSidebar()
    return
  }

  const targetRoute = resolveMenuBarTarget(tabConfig)
  if (isMenuBarRouteMatch(targetRoute, route)) return

  await router.replace(targetRoute)
}

const goToAuthPage = () => {
  if (userStore.isAuthenticated) {
    router.push({ path: buildLocalePath(resolveRouteLocale(route), '/auth'), query: { view: 'profile' } })
  } else {
    router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
  }
}

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}
</script>




<style scoped lang="scss">

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);

$mobile-aspect-ratio: 1;

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
  width: 100%;
  height: 10dvh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5%;
}

.navbar-btn {
  width: 100%;
  max-width: 900px;
  height: 10dvh;
  @include flex-center;
  margin: 0 30px;
}

.navbar-item {
  padding: 0.5%;
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
  margin-top: 5px;
  margin-left: 5px;
  cursor: pointer;
}

.logo-container {
  flex: 1 1 0;
  width: 9dvh;
  min-width: 9dvh;
  max-width: 15dvh;
  height: 6dvh;
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px;

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

.logo {
  width: 90%;
  height: auto;
}

.title {
  img {
    height: 10dvh;
    padding: 0;
    object-fit: contain;
  }
}

.menu-item {
  flex: 1 1 0;
  min-width: 0;
  height: 10dvh;
  @include flex-center;
  gap: 1px;

  // background: var(--glass-10);
  border-radius: var(--radius-md);
  color: $primary;
  white-space: nowrap;
  text-align: center;
  text-decoration: none;
  font-size: 1.3rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.25s ease;

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
    transition: all 0.3s ease;

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
  flex: 0 0 calc(6dvh + 16px);
  width: calc(6dvh + 16px);
  min-width: calc(6dvh + 16px);
  max-width: calc(6dvh + 16px);
  height: calc(6dvh + 16px);
  margin-right: 10px;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;

  @include flex-center;
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
  padding: 0 0.5%;
}

.navbar-top {
  position: relative;
  width: 100%;
  height: 10dvh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;

  .logo-container {
    width: 6dvh;
    height: 6dvh;
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

.navbar-bottom {
  width: 100%;
  height: 6dvh;
  display: flex;
  align-items: center;
  justify-content: space-around;
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
      height: 9dvh !important;
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
</style>
