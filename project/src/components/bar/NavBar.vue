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

    <!-- 左侧边栏 -->
    <Transition name="slide-fade">
      <div class="sidebar main-sidebar-shell" v-if="isSidebarVisible">
        <div class="sidebar-empty main-sidebar-empty"></div>
        <div class="sidebar-content main-sidebar-content">
          <ul class="main-sidebar-list ui-scrollbar">
            <li
              v-for="(item, key) in filteredMenuConfig"
              :key="key"
              class="main-sidebar-item"
              @click="handleMainClick(item, key, $event)"
              @mouseenter="handleItemMouseEnter(item, key, $event)"
              @mouseleave="item.children && !isMobile ? scheduleCloseSubmenu() : null"
            >
              <span role="img" :aria-label="key">{{ item.icon }}</span>
              {{ item.label }}
            </li>
          </ul>

          <!-- 访问统计区域 -->
          <div class="visit-stats main-sidebar-stats">
            <div class="stats-summary main-sidebar-stats-summary">
              <div class="stat-item">
                <span class="stat-label">{{ t('navigation.stats.today') }}</span>
                <span class="stat-value">{{ todayVisits }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('navigation.stats.totalVisits') }}</span>
                <span class="stat-value">{{ totalVisits }}</span>
              </div>
              <button class="expand-btn main-sidebar-expand-btn" @click="toggleStatsPanel">
                📊
              </button>
            </div>
          </div>

          <div class="icp-number">粤ICP备2025466875号</div>
        </div>
      </div>
    </Transition>

    <!-- 遮罩层 -->
    <Transition name="fade">
      <div class="overlay main-sidebar-overlay" v-if="isSidebarVisible" @click="toggleSidebar"></div>
    </Transition>

    <!-- Submenu panel (liquid glass style) -->
    <Teleport to="body">
      <Transition name="submenu-fade">
        <div
          v-if="activeSubmenu"
          class="submenu-panel main-submenu-panel"
          :style="{
            top: submenuPosition.top + 'px',
            left: submenuPosition.left + 'px'
          }"
          @click.stop
          @mouseenter="!isMobile ? cancelCloseSubmenu() : null"
          @mouseleave="!isMobile ? scheduleCloseSubmenu() : null"
        >
          <div
            v-for="(child, index) in getFilteredChildren(menuConfigData[activeSubmenu]?.children)"
            :key="index"
            class="submenu-item main-sidebar-submenu-item"
            @click="handleSubmenuClick(child)"
          >
            <span class="submenu-icon">{{ child.icon }}</span>
            <span class="submenu-label">{{ child.label }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 访问历史弹窗 -->
    <AppModal
      :model-value="isStatsExpanded"
      size="sm"
      :title="t('navigation.stats.historyTitle')"
      :close-label="t('common.button.close')"
      @update:modelValue="closeStatsPanel"
    >
        <div v-if="loadingStats" class="loading-state">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>{{ t('navigation.stats.loading') }}</p>
        </div>

        <div v-else class="stats-content">
          <div class="stats-summary-large">
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <span class="stat-label-large">{{ t('navigation.stats.todayVisits') }}</span>
                <span class="stat-value-large">{{ todayVisits }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🌐</div>
              <div class="stat-info">
                <span class="stat-label-large">{{ t('navigation.stats.totalVisits') }}</span>
                <span class="stat-value-large">{{ totalVisits }}</span>
              </div>
            </div>
          </div>

          <div class="history-section">
            <h4 class="section-title">{{ t('navigation.stats.historyRecords') }}</h4>
            <div class="history-list">
              <div v-for="item in visitHistory" :key="item.date" class="history-item-modal">
                <span class="history-date">{{ item.date }}</span>
                <div class="history-bar-container">
                  <div
                    class="history-bar"
                    :style="{ width: (item.count / Math.max(...visitHistory.map(v => v.count)) * 100) + '%' }"
                  ></div>
                </div>
                <span class="history-count">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>
    </AppModal>

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
  </div>
</template>


<script setup>
import { ref , onMounted, onBeforeUnmount, computed, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
// import { clearToken, getToken, saveToken } from '../../api/auth/auth.js'
import { useVisitStats, ensureVisitHistory } from '@/composables/useVisitStats.js'
import { useSidebarConfig } from '@/main/config/index.js'
import {
  filterVisibleMenuBarTabs,
  getMenuBarActiveTab,
  isMenuBarRouteMatch,
  resolveMenuBarTarget,
  syncMenuBarMemoryFromRoute,
  useMenuBarConfig
} from '@/main/config/index.js'
import { WEB_BASE } from '@/env-config.js'
import { userStore, resultCache } from '@/main/store/store.js'
import NavAvatar from '@/components/bar/NavAvatar.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const isSidebarVisible = ref(false)  // 控制边栏显示
const menuConfigRef = useSidebarConfig()
const {
  todayVisits,
  totalVisits,
  visitHistory,
  loadingVisitHistory: loadingStats,
  ensureVisitStats
} = useVisitStats()

// Submenu state management
const activeSubmenu = ref(null)  // Currently open submenu key
const submenuPosition = ref({ top: 0, left: 0 })  // Position for submenu panel
const closeSubmenuTimeout = ref(null)  // Timeout for delayed closing

// ===== sessionStorage 管理：记住每个 tab 的最后访问的 sub =====
// 記憶邏輯已移動到MenuBarConfig.js
// 监听路由变化，记录当前的 tab 和 sub
watch(() => route.path, () => {
  syncMenuBarMemoryFromRoute(route)
}, { immediate: true })
// ===== sessionStorage 管理结束 =====

// Mobile detection
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  // console.log("ismobile")
}

// Filter menu items for NavBar (exclude items that should only show in SimpleSidebar)
const filteredMenuConfig = computed(() => {
  const filtered = {}
  for (const [key, item] of Object.entries(menuConfigRef.value)) {
    // If showIn is not specified, show in all components
    // If showIn is specified, only show if 'NavBar' is in the array
    if (!item.showIn || item.showIn.includes('NavBar')) {
      filtered[key] = item
    }
  }
  return filtered
})

const menuConfigData = computed(() => menuConfigRef.value)

const getFilteredChildren = (children) => {
  if (!children) return []
  return children.filter((child) => {
    if (typeof child.visibleWhen === 'function') {
      return child.visibleWhen()
    }
    return true
  })
}

// 访问统计相关
const isStatsExpanded = ref(false);

// 过滤可见的 tabs（label 已在 TabsConfig 中定义）
const allMenuTabs = useMenuBarConfig()
const tabs = computed(() => filterVisibleMenuBarTabs(allMenuTabs.value))

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
  // 如果用户已登录，跳转到个人资料页面；否则跳转到登录页面
  if (userStore.isAuthenticated) {
    router.push({ path: buildLocalePath(resolveRouteLocale(route), '/auth'), query: { view: 'profile' } })
  } else {
    router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
  }
}

// 获取访问统计数据
async function fetchVisitStats() {
  try {
    await ensureVisitStats()
  } catch (error) {
    console.error('获取访问统计失败:', error)
  }
}

// 切换统计面板展开/收起
async function toggleStatsPanel() {
  isStatsExpanded.value = !isStatsExpanded.value

  // 首次展开时加载历史数据
  if (isStatsExpanded.value && visitHistory.value.length === 0) {
    await fetchVisitHistory()
  }
}

// 关闭统计面板
function closeStatsPanel() {
  isStatsExpanded.value = false
}

// 获取访问历史
async function fetchVisitHistory() {
  try {
    await ensureVisitHistory()
  } catch (error) {
    console.error('获取访问历史失败:', error)
  }
}


// 切换左侧边栏的显示与隐藏
const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
  // Close submenu when sidebar closes
  if (!isSidebarVisible.value) {
    activeSubmenu.value = null
  }
}

// 主按鈕點擊處理 - 有子菜單則展開，無子菜單則導覽
const handleMainClick = (item, key, event) => {
  event?.stopPropagation()  // 阻止事件冒泡
  cancelCloseSubmenu()  // 取消任何待處理的關閉

  if (item.children) {
    // 有子菜單，展開子菜單
    handleArrowClick(item, key, event)
  } else if (item.path) {
    // 無子菜單且有路徑，導覽
    if (item.external) {
      window.location.href = WEB_BASE + item.path
    } else {
      router.push(item.path)
      isSidebarVisible.value = false
    }
  } else {
    // 沒有路徑就console
    console.log('按鈕點擊 - 需要設置導航路徑？', key, item)
  }
}

// 處理項目鼠標進入
const handleItemMouseEnter = (item, key, event) => {
  cancelCloseSubmenu()  // 取消任何待處理的關閉
  if (!isMobile.value && item.children) {
    handleArrowClick(item, key, event)
  }
}

// 箭頭點擊處理 - 展開子菜單
const handleArrowClick = (item, key, event) => {
  event?.stopPropagation()  // 阻止事件冒泡
  cancelCloseSubmenu()  // 取消任何待處理的關閉

  if (item.children) {
    // 判斷事件來源：如果是箭頭點擊，需要取 parentElement；如果是 li hover，直接用 currentTarget
    const targetElement = event.currentTarget.classList?.contains('menu-arrow')
      ? event.currentTarget.parentElement
      : event.currentTarget

    const rect = targetElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const submenuWidth = 250 // 預估子菜單寬度

    // 計算是否有足夠空間在右側顯示
    const spaceOnRight = viewportWidth - rect.right
    const hasSpaceOnRight = spaceOnRight > submenuWidth + 20

    if (hasSpaceOnRight) {
      // 右側有空間，顯示在右側
      submenuPosition.value = {
        top: rect.top,
        left: rect.right + 10
      }
    } else {
      // 右側空間不足，顯示在按鈕下方
      submenuPosition.value = {
        top: rect.bottom + 5,
        left: Math.max(10, rect.left) // 確保不會超出左邊
      }
    }

    activeSubmenu.value = activeSubmenu.value === key ? null : key // Toggle
  }
}

// Submenu item click handler
const handleSubmenuClick = (child) => {
  cancelCloseSubmenu()
  if (child.external) {
    window.open(child.path, '_blank')
  } else {
    router.push(child.path)
  }
  activeSubmenu.value = null
  isSidebarVisible.value = false
}

// 延遲關閉子菜單
const scheduleCloseSubmenu = () => {
  closeSubmenuTimeout.value = setTimeout(() => {
    activeSubmenu.value = null
  }, 300)  // 300ms 延遲
}

// 取消延遲關閉
const cancelCloseSubmenu = () => {
  if (closeSubmenuTimeout.value) {
    clearTimeout(closeSubmenuTimeout.value)
    closeSubmenuTimeout.value = null
  }
}

// Close submenu when clicking outside
const closeSubmenu = () => {
  cancelCloseSubmenu()
  activeSubmenu.value = null
}

onMounted(async () => {
  checkMobile();
  await fetchVisitStats();
  document.addEventListener('click', closeSubmenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubmenu)
})
</script>


```scss

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$primary-light: var(--color-primary);

$text-dark: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-muted: var(--text-secondary);

$mobile-aspect-ratio: 1 / 1;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin glass-blur($blur: 15px, $saturation: 150%) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

@mixin soft-glass-background {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px;

  @include glass-blur;
  @include soft-glass-background;
  @include soft-glass-shadow;

  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  color: darkblue;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: $primary;
  white-space: nowrap;
  text-align: center;
  text-decoration: none;
  font-size: 1.3rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(0, 122, 255, 0.12);
    color: $primary;
  }

  &.active {
    @include soft-glass-background;
    @include soft-glass-shadow;

    border: 3px solid rgba(255, 255, 255, 0.4);
    border-radius: 0 0 25px 25px;
    color: darkblue;
    font-weight: 1000;
    transition: all 0.3s ease;

    &:hover {
      margin: 0;
      background: linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.5),
        rgba(255, 255, 255, 0.3)
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
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
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

/* 左侧栏统计 */
.icp-number {
  text-align: center;
  color: var(--text-gray);
  font-size: 14px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  white-space: nowrap;
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
}

.stat-value {
  color: $primary-dark;
  font-size: 18px;
  font-weight: 900;
}

/* 访问统计弹窗 */
.stats-content {
  padding-top: 5px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: $text-secondary;
}

.stats-summary-large {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
  overflow-x: auto;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.stat-icon {
  font-size: 32px;
  line-height: 1;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label-large {
  white-space: nowrap;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 600;
}

.stat-value-large {
  color: $primary-dark;
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
}

.history-section {
  margin-top: 10px;
}

.section-title {
  margin: 0 0 12px 4px;
  color: $text-muted;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item-modal {
  display: grid;
  grid-template-columns: 100px 1fr 60px;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
  }
}

.history-date {
  white-space: nowrap;
  color: $text-dark;
  font-size: 13px;
  font-weight: 600;
}

.history-bar-container {
  position: relative;
  height: 20px;
  overflow: hidden;
  background: rgba(0, 95, 211, 0.1);
  border-radius: 10px;
}

.history-bar {
  min-width: 2%;
  height: 100%;
  background: linear-gradient(
    90deg,
    $primary-dark,
    $primary-light
  );
  border-radius: 10px;
  transition: width 0.5s ease;
}

.history-count {
  text-align: right;
  color: $primary-dark;
  font-size: 15px;
  font-weight: 700;
}

/* 左侧栏进出动画 */
.slide-fade {
  &-enter-active {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  &-leave-active {
    transition: all 0.25s cubic-bezier(0.5, 0, 0.75, 0);
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

/* 遮罩动画 */
.fade {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.3s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}

/* 子菜单 */
.submenu-icon {
  flex-shrink: 0;
  font-size: 18px;
}

.submenu-label {
  flex: 1;
  white-space: nowrap;
}

.submenu-fade {
  &-enter-active,
  &-leave-active {
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateX(-10px) scale(0.95);
  }
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

/* 移动端子菜单边界 */
@media (max-width: 768px) {
  .submenu-panel {
    max-width: calc(100vw - 20px);
  }
}

```

