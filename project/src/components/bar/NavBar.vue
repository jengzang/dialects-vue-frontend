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
      <div v-else class="logo-container" style="color: #005fd3;border-radius: 30px" @click="goToAuthPage">
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
            v-for="(child, index) in menuConfigData[activeSubmenu]?.children"
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
        <div v-else class="logo-container" style="color: #005fd3; border-radius: 30px;height: 5dvh" @click="goToAuthPage">
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


<style scoped>
/* 父容器，標題欄背景 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;

  box-shadow: var(--shadow-glass-inset);
  background: var(--glass-gradient-nav);
  border: 1px solid var(--glass-border-weak);
  backdrop-filter: blur(6px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}


/* 桌面端布局 */
.navbar-desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 0.5%;
  height: 10dvh;
}

.navbar-btn {
  margin: 0 30px;
  width: 100%;
  max-width: 900px;
  justify-content: center;
  align-items: center;
  display: flex;
  height: 10dvh; /* 使其撑满父容器的高度 */
}

.navbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  font-size: 1rem;
  padding: 0.5%;
  transition: transform 0.3s;
}

.navbar-item:hover {
  transform: scale(1.05);
}

.logo-and-title {
  margin-top: 5px;
  margin-left: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.ico img {
  padding: 0;
}

/* 圆形logo背景 */
.logo-container {
  width: 9dvh; /* 宽度可以调整 */
  max-width: 15dvh;
  min-width: 9dvh;
  height: 6dvh; /* 高度可以调整 */
  border-radius: 50%;
  backdrop-filter: blur(15px) saturate(150%); /* 玻璃效果 */
  -webkit-backdrop-filter: blur(15px) saturate(150%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px; /* 使图片不贴边 */
  flex: 1 1 0;
  text-align: center;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)); /* 柔和透明的漸層 */
  color: darkblue;
  font-weight: 1000;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08); /* 輕微陰影，玻璃感 */
  border: 3px solid rgba(255, 255, 255, 0.4); /* 半透明邊框 */
  transition: all 0.3s ease;
}

.logo {
  width: 90%; /* 控制 logo 图片的大小 */
  height: auto;
}

.title img {
  padding: 0;
  height: 10dvh;
  object-fit: contain;
}

.menu-item {
  height: 10dvh;
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
  color: #007aff; /* 預設文字用蘋果藍半透明 */
}

.menu-item:hover {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
}

.menu-item.active {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)); /* 柔和透明的漸層 */
  color: darkblue;
  font-weight: 1000;
  border-radius: 0 0 25px 25px; /* 圓角邊框 */
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08); /* 輕微陰影，玻璃感 */
  border: 3px solid rgba(255, 255, 255, 0.4); /* 半透明邊框 */
  transition: all 0.3s ease;
}

.menu-item.active:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3)); /* 柔和透明的漸層 */
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2); /* 鼠標懸停時增強陰影 */
  margin:0;
}

.login-text {
  display: block;
  max-width: 100px;  /* ?????????? */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}



/* 移动端布局 */
.navbar-content {
  display: none;
  flex-direction: column;
  width: 100%;
  top:0;
  height:16.5dvh;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5%;
  position: relative; /* ?????????? */
  gap:0.5dvh;
}

/* ?????Logo???????? */
.navbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  height: 10dvh;
  width: 100%;
  position: relative; /* ? .navbar-top ?????? */
}

.navbar-top .logo-container {
  width: 6dvh;
  height: 6dvh;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: #005fd3;
  cursor: pointer;
  user-select: none;
}

.navbar-top .login-text {
  display: block;
  max-width: 100px; /* ?????????? */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ????????? */
.navbar-bottom {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 10px;
  width:100%;
  height: 6dvh;
}



@media (max-aspect-ratio: 1/1) {
  /* 隐藏桌面端布局 */
  .navbar-desktop {
    display: none;
  }

  /* 显示移动端布局 */
  .navbar-content {
    display: flex;
  }
  .menu-item{
    height: 6dvh!important;
    border-radius: 30px!important;
  }
  .title img{
    height: 9dvh!important;
  }
}


.icp-number {
  text-align: center;
  font-size: 14px;
  color: #575757;
}


.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  white-space: nowrap;
  color: #666;
  font-weight: 600;
}

.stat-value {
  font-size: 18px;
  color: #005fd3;
  font-weight: 900;
}


/* 弹窗样式 */
.stats-content {
  padding-top: 5px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}



.stats-summary-large {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
  overflow-x:auto;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.stat-value-large {
  font-size: 26px;
  color: #005fd3;
  font-weight: 900;
  line-height: 1;
}

.history-section {
  margin-top: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #8e8e93;
  margin: 0 0 12px 4px;
  text-transform: uppercase;
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
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.history-item-modal:hover {
  background: rgba(255, 255, 255, 0.6);
}

.history-date {
  font-size: 13px;
  color: #444;
  font-weight: 600;
  white-space: nowrap;
}

.history-bar-container {
  height: 20px;
  background: rgba(0, 95, 211, 0.1);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.history-bar {
  height: 100%;
  background: linear-gradient(90deg, #005fd3, #0080ff);
  border-radius: 10px;
  transition: width 0.5s ease;
  min-width: 2%;
}

.history-count {
  font-size: 15px;
  color: #005fd3;
  font-weight: 700;
  text-align: right;
}

/* Sidebar 滑动动画 */
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.5, 0, 0.75, 0);
}

.slide-fade-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Overlay 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


/* ??????????????? */
@media (max-aspect-ratio: 1/1)  {
  .navbar-desktop {
    display: none;
  }
  .navbar-content {
    display: flex;
  }
}

/* Arrow indicator for expandable items */
.menu-arrow {
  font-size: 18px;
  font-weight: bold;
  color: #007aff;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(0, 122, 255, 0.15);
  border-radius: 50%;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
}

.menu-arrow:hover {
  transform: scale(1.15);
  background: rgba(0, 122, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.menu-arrow:active {
  transform: scale(1.05);
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
  transform: translateX(-10px) scale(0.95);
}

.submenu-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.95);
}

/* Mobile responsive submenu */
@media (max-width: 768px) {
  .submenu-panel {
    /* 在移動設備上確保不會超出螢幕 */
    max-width: calc(100vw - 20px);
  }
}

.avatar-container {
  margin-right: 10px;
  width: calc(6dvh + 16px);
  min-width: calc(6dvh + 16px);
  max-width: calc(6dvh + 16px);
  height: calc(6dvh + 16px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  flex: 0 0 calc(6dvh + 16px);
  box-sizing: border-box;
}
</style>
