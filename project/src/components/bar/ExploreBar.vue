<template>
  <div class="explorebar">
    <!-- 桌面端：单行布局 -->
    <div class="explorebar-desktop">
      <div class="logo-and-title" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div class="logo-container">
          <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
        </div>
        <div class="title">
          <img src="../../assets/title.png" alt="Title" />
        </div>
      </div>

      <nav class="explorebar-tabs" @mouseleave="handleTabLeave">
        <RouterLink
          v-for="t in tabs"
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

      <div class="login-container" @click="goToAuthPage">
        <span class="login-text">{{ userStore.username || '登錄' }}</span>
      </div>
    </div>

    <!-- 移动端：单行布局（无 title.png） -->
    <div class="explorebar-mobile">
      <div class="logo-container" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
      </div>

      <nav class="explorebar-tabs">
        <RouterLink
          v-for="t in tabs"
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

      <div class="login-container" @click="goToAuthPage">
        <span class="login-text">{{ userStore.username || '登錄' }}</span>
      </div>
    </div>

    <!-- 侧边栏 (使用 SimpleSidebar 组件，桌面端不显示 title，移动端显示) -->
    <SimpleSidebar
      :is-open="isSidebarVisible"
      :show-title="isMobile"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ExploreTabsConfig } from '@/config/TabsConfig.js'
import { userStore } from '@/utils/store.js'
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue'
import { menuConfig } from '@/config/menuConfig.js'

const route = useRoute()
const router = useRouter()

// 过滤可见的 tabs (支持 visibleWhen 函数)
const visibleTabs = computed(() => {
  return ExploreTabsConfig.filter(tab => {
    // 如果有 visibleWhen 函数，执行它
    if (typeof tab.visibleWhen === 'function') {
      return tab.visibleWhen()
    }
    // 没有 visibleWhen 则默认可见
    return true
  })
})

const tabs = visibleTabs
const isSidebarVisible = ref(false)

// Submenu state management
const activeSubmenu = ref(null)  // Currently open submenu tab key
const submenuPosition = ref({ top: 0, left: 0 })  // Position for submenu panel
let closeSubmenuTimer = null  // Timer for delayed close

// Mobile detection
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Map ExploreBar tab keys to menuConfig keys
const tabToMenuConfigMap = {
  'data': 'data',
  'words': 'words',
  'villages': 'villages',
  'tools': 'tools',
  'query':'query',
  'about':'about_ontop'
}

// Helper function to get children from menuConfig
const getTabChildren = (tabKey) => {
  const menuKey = tabToMenuConfigMap[tabKey]
  return menuKey ? menuConfig[menuKey]?.children : null
}

// Lifecycle hooks
onMounted(() => {
  checkMobile()
  document.addEventListener('click', closeSubmenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubmenu)
  // Clear any pending timer
  if (closeSubmenuTimer) {
    clearTimeout(closeSubmenuTimer)
    closeSubmenuTimer = null
  }
})

const closeSubmenu = () => {
  activeSubmenu.value = null
}

// Page → Tab 映射表
const pageToTabMap = {
  // data category
  'phonologyMatrix': 'data',
  'phonologyCustom': 'data',
  'Countphos': 'data',
  'ZhongGu': 'data',

  // words category
  'YuBao': 'words',
  'ycSpoken': 'words',

  // villages category
  'gdVillages': 'villages',
  'gdVillagesTable': 'villages',
  'ycVillages': 'villages',
  'VillagesML':'villages',

  // tools category
  'check': 'tools',
  'jyut2ipa': 'tools',
  'merge': 'tools',
  'praat': 'tools'
}

// 获取当前页面对应的 tab
const getCurrentTab = () => {
  const page = route.query.page
  return pageToTabMap[page] || null
}

// 判断 tab 是否激活
const isActiveComputed = (tabName) => {
  return getCurrentTab() === tabName
}

/**
 * Calculate dynamic flex weight based on label visibility
 * @param {Object} tab - Tab configuration object
 * @param {boolean} isActive - Whether the tab is currently active
 * @param {boolean} isMobile - Whether in mobile layout
 * @returns {number} - Flex weight value
 */
const getFlexWeight = (tab, isActive, isMobile) => {
  // Determine if label is visible based on configuration
  let labelVisible

  if (isMobile) {
    // Mobile: Check hideLabelOnMobile and mobileShowLabelOnlyWhenActive
    const showOnlyWhenActive = tab.mobileShowLabelOnlyWhenActive ?? tab.showLabelOnlyWhenActive
    labelVisible = !tab.hideLabelOnMobile && (!showOnlyWhenActive || isActive)
  } else {
    // Desktop: Check showLabelOnlyWhenActive
    labelVisible = !tab.showLabelOnlyWhenActive || isActive
  }

  // Return appropriate weight based on label visibility
  if (labelVisible) {
    // Label is visible - use full weight
    return isMobile ? (tab.mobileWeight || tab.weight) : tab.weight
  } else {
    // Label is hidden - use icon-only weight with fallback chain
    if (isMobile) {
      return tab.mobileWeightIconOnly || tab.mobileWeight || tab.weightIconOnly || tab.weight
    } else {
      return tab.weightIconOnly || tab.weight
    }
  }
}

// Tab 点击处理
const onClick = async (tabConfig, navigate, event) => {
  // 伪 tab 处理：打开侧边栏而非导航
  if (tabConfig.isPseudo) {
    toggleSidebar()
    return
  }

  const children = getTabChildren(tabConfig.tab)  // Get children from menuConfig
  console.log('onClick triggered:', tabConfig.tab, 'children:', children, 'isMobile:', isMobile.value)

  // Desktop: always navigate (hover handles submenu)
  // Mobile: show submenu if has children, otherwise navigate
  if (!isMobile.value) {
    // Desktop: click to navigate
    console.log('Desktop: navigating to:', tabConfig.to)
    if (tabConfig.to) {
      await router.replace(tabConfig.to)
    }
  } else {
    // Mobile: click to show submenu if has children
    if (children && children.length > 0) {
      console.log('Mobile: has children, calling handleTabClick')
      handleTabClick(tabConfig, tabConfig.tab, event)
    } else {
      console.log('Mobile: no children, navigating to:', tabConfig.to)
      if (tabConfig.to) {
        await router.replace(tabConfig.to)
      }
    }
  }
}

const handleTabClick = (tabConfig, tabKey, event) => {
  const children = getTabChildren(tabKey)  // Get children from menuConfig
  console.log('handleTabClick:', tabKey, 'children:', children)
  if (!children || children.length === 0) return

  const targetElement = event.currentTarget

  const rect = targetElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const submenuWidth = 250
  const submenuHeight = children.length * 50 + 20  // Use actual children count

  // Position BELOW the tab
  let top = rect.bottom + 5
  let left = rect.left

  // Boundary checks
  if (top + submenuHeight > viewportHeight) {
    top = rect.top - submenuHeight - 5  // Show above if no space below
  }
  if (left + submenuWidth > viewportWidth) {
    left = viewportWidth - submenuWidth - 10
  }
  if (left < 10) {
    left = 10
  }

  submenuPosition.value = { top, left }
  activeSubmenu.value = activeSubmenu.value === tabKey ? null : tabKey  // Toggle
  console.log('activeSubmenu set to:', activeSubmenu.value, 'position:', submenuPosition.value)
}

const handleTabHover = (tabConfig, tabKey, event) => {
  if (isMobile.value) return  // No hover on mobile

  // Clear any pending close timer
  if (closeSubmenuTimer) {
    clearTimeout(closeSubmenuTimer)
    closeSubmenuTimer = null
  }

  const children = getTabChildren(tabKey)
  if (!children || children.length === 0) {
    // No children - close any open submenu
    activeSubmenu.value = null
    return
  }

  // For hover: always open (don't toggle)
  const targetElement = event.currentTarget
  const rect = targetElement.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const submenuWidth = 250
  const submenuHeight = children.length * 50 + 20

  // Position BELOW the tab
  let top = rect.bottom + 5
  let left = rect.left

  // Boundary checks
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
  activeSubmenu.value = tabKey  // Always open on hover (don't toggle)
}

const handleTabLeave = () => {
  if (isMobile.value) return
  // Delay closing to allow mouse to move to submenu
  closeSubmenuTimer = setTimeout(() => {
    activeSubmenu.value = null
  }, 300)  // 300ms delay
}

const handleSubmenuEnter = () => {
  // Clear close timer when entering submenu
  if (closeSubmenuTimer) {
    clearTimeout(closeSubmenuTimer)
    closeSubmenuTimer = null
  }
}

const handleSubmenuLeave = () => {
  // Close submenu when leaving
  closeSubmenuTimer = setTimeout(() => {
    activeSubmenu.value = null
  }, 200)  // Shorter delay when leaving submenu
}

const handleSubmenuClick = (child) => {
  if (child.external) {
    window.open(child.path, '_blank')
  } else {
    router.push(child.path)
  }
  activeSubmenu.value = null
}

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
}

// 登录按钮点击
const goToAuthPage = () => {
  router.push('/auth')
}
</script>

<style scoped>
.explorebar {
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

/* 桌面端：单行，7dvh 高度 */
.explorebar-desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 7.5dvh;
  padding: 0 1%;
  gap: 10px;
}

.logo-and-title {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;  /* 防止被压缩 */
}

.explorebar-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 auto;
  max-width: 600px;
  min-width: 0;  /* 允许收缩 */
  margin: 0 10px;
  overflow-x: auto;  /* 宽度不够时允许滚动 */
  overflow-y: hidden;
  scrollbar-width: none;  /* Firefox */
  -ms-overflow-style: none;  /* IE/Edge */
  height: 7.5dvh;  /* 与 NavBar 的 .navbar-btn 一致，使 hover 时的 90% 能正确计算为 9dvh */
}

/* 隐藏滚动条 */
.explorebar-tabs::-webkit-scrollbar {
  display: none;  /* Chrome/Safari */
}

/* 完全复刻 NavBar 的 .menu-item 样式 */
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
  background: rgba(255, 255, 255, 0.10);
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
  margin:0;
}

.logo-container {
  width: 6dvh;
  height: 6dvh;
  min-width: 5dvh;  /* 防止被压缩 */
  flex-shrink: 0;  /* 防止被压缩 */
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
  flex-shrink: 0;  /* 防止被压缩 */
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
.explorebar-mobile {
  display: none;
}

@media (max-aspect-ratio: 1/1) {
  .explorebar-desktop {
    display: none;
  }

  .explorebar-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: max(8dvh, 44px);  /* 确保最小触摸目标 */
    padding: 0 1%;
    gap: 3px;
  }

  .explorebar-mobile .explorebar-tabs {
    display: flex;
    gap: 4px;
    flex: 1 1 auto;
    min-width: 0;  /* 允许收缩 */
    margin: 0 6px;
    overflow-x: auto;  /* 宽度不够时允许滚动 */
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .explorebar-mobile .explorebar-tabs::-webkit-scrollbar {
    display: none;
  }

  .explorebar-mobile .tab-item {
    height: max(6dvh, 40px);
    border-radius: 30px;
    flex-shrink: 0;  /* 防止 tab 被压缩 */
  }

  /* 移动端 active 状态保持圆角，覆盖桌面端的下圆角 */
  .explorebar-mobile .tab-item.active {
    border-radius: 30px;
  }

  .explorebar-mobile .logo-container {
    width: 5dvh;
    height: 5dvh;
    min-width: 5dvh;
    flex-shrink: 0;
  }

  .explorebar-mobile .login-container {
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
  box-shadow: inset 0 0 0.5px rgba(255, 255, 255, 0.3),
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
</style>
