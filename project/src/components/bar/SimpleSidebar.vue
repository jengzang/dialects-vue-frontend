<!-- SimpleSidebar.vue - 简化的侧边栏 -->
<template>
  <!-- 遮罩层 -->
  <Transition name="fade">
    <div v-if="isOpen" class="overlay main-sidebar-overlay" @click="$emit('close')" @wheel.prevent @touchmove.prevent></div>
  </Transition>

  <!-- 侧边栏 -->
  <Transition name="slide-fade">
    <div v-if="isOpen" class="sidebar main-sidebar-shell" @touchmove.stop>
      <!-- 标题图片 (可选) -->
      <div v-if="showTitle" class="sidebar-header">
        <img src="../../assets/picture/title.png" alt="Title" class="title-img title-logo" />
      </div>
      <div v-else class="sidebar-empty main-sidebar-empty"></div>

      <div class="sidebar-content main-sidebar-content">
        <ul class="main-sidebar-list ui-scrollbar">
          <!-- Dynamic menu items from config (includes 返回查詢 for SimpleSidebar) -->
          <li
            v-for="(item, key) in filteredMenuConfig"
            :key="key"
            class="main-sidebar-item"
            @pointerup="handleMainPointerUp(item, key, $event)"
            @click.stop
            @mouseenter="handleItemMouseEnter(item, key, $event)"
            @mouseleave="item.children && canHover ? scheduleCloseSubmenu() : null"
          >
            <span role="img" :aria-label="key">{{ item.icon }}</span>
            {{ item.label }}
          </li>
        </ul>

        <!-- 访问统计区域 -->
        <div class="visit-stats main-sidebar-stats">
          <div class="stats-summary main-sidebar-stats-summary">
            <div class="stat-item">
              <span class="stat-label">{{ t('common.label.today') }}</span>
              <span class="stat-value">{{ todayVisits }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('common.label.totalVisits') }}</span>
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
        @mouseenter="canHover ? cancelCloseSubmenu() : null"
        @mouseleave="canHover ? scheduleCloseSubmenu() : null"
      >
        <div
          v-for="(child, index) in getFilteredChildren(activeSubmenu)"
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue'
import { clearToken, getToken } from '@/api/auth/auth.js'
import { useVisitStats, ensureVisitHistory } from '@/composables/useVisitStats.js'
import {userStore} from "@/main/store/store.js";
import { useSidebarConfig } from '@/main/config/index.js';
import { WEB_BASE } from '@/env-config.js';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

// 侧边栏桌面端点击记忆：上次访问的子页面
const SIDEBAR_MEMORY_PREFIX = 'sidebar_last_child_'

const readSidebarMemory = (menuKey) => {
  try {
    return sessionStorage.getItem(SIDEBAR_MEMORY_PREFIX + menuKey)
  } catch {
    return null
  }
}

const writeSidebarMemory = (menuKey, path) => {
  try {
    if (path) sessionStorage.setItem(SIDEBAR_MEMORY_PREFIX + menuKey, path)
    else sessionStorage.removeItem(SIDEBAR_MEMORY_PREFIX + menuKey)
  } catch { /* ignore */ }
}
const {
  todayVisits,
  totalVisits,
  visitHistory,
  loadingVisitHistory: loadingStats,
  ensureVisitStats
} = useVisitStats();
const props = defineProps({
  isOpen: Boolean,
  showTitle: {
    type: Boolean,
    default: true  // 默认显示 title，保持向后兼容
  }
});
const user = ref({}) // 存储用户信息
const mode = ref('login') // 存储登录状态
const emit = defineEmits(['close']);

// Submenu state management
const activeSubmenu = ref(null)  // Currently open submenu key
const submenuPosition = ref({ top: 0, left: 0 })  // Position for submenu panel
const closeSubmenuTimeout = ref(null)  // Timeout for delayed closing

// Input capability detection
// Do not use hover capability alone to determine whether the device is mobile.
// Some Android devices, styluses, desktop mode, and hybrid devices may report hover support.
const hasTouchInput = ref(false)
const canHover = ref(false)

let hoverMediaQuery = null
let coarsePointerMediaQuery = null
let anyCoarsePointerMediaQuery = null

const updateInputCapabilities = () => {
  canHover.value = hoverMediaQuery?.matches ?? false
  hasTouchInput.value = Boolean(
    coarsePointerMediaQuery?.matches ||
    anyCoarsePointerMediaQuery?.matches ||
    navigator.maxTouchPoints > 0
  )
}

const checkInputCapabilities = () => {
  hoverMediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  coarsePointerMediaQuery = window.matchMedia('(pointer: coarse)')
  anyCoarsePointerMediaQuery = window.matchMedia('(any-pointer: coarse)')

  updateInputCapabilities()

  hoverMediaQuery.addEventListener('change', updateInputCapabilities)
  coarsePointerMediaQuery.addEventListener('change', updateInputCapabilities)
  anyCoarsePointerMediaQuery.addEventListener('change', updateInputCapabilities)
}

// Filter menu items for SimpleSidebar (exclude items that should only show in NavBar)
const menuConfigData = useSidebarConfig();
const filteredMenuConfig = computed(() => {
  const config = menuConfigData.value;
  const filtered = {}
  for (const [key, item] of Object.entries(config)) {
    // If showIn is not specified, show in all components
    // If showIn is specified, only show if 'SimpleSidebar' is in the array
    if (!item.showIn || item.showIn.includes('SimpleSidebar')) {
      filtered[key] = item
    }
  }
  return filtered
})

const getFilteredChildren = (menuKey) => {
  const children = menuConfigData.value[menuKey]?.children
  if (!children) return []
  return children.filter((child) => {
    if (typeof child.visibleWhen === 'function') {
      return child.visibleWhen()
    }
    return true
  })
}

// 监听路由变化，记录当前路径到对应菜单项的 sessionStorage
watch(() => route.fullPath, () => {
  for (const [key, item] of Object.entries(menuConfigData.value)) {
    if (!item.children) continue
    for (const child of item.children) {
      const childPathOnly = child.path?.split('?')[0]
      if (route.path === childPathOnly || route.fullPath === child.path) {
        writeSidebarMemory(key, child.path)
        return
      }
    }
  }
})

// 访问统计相关
const isStatsExpanded = ref(false);

// 导航方法
const closeSidebar = () => {
  emit('close');
  activeSubmenu.value = null;
};

// Main menu interaction handler
// Mouse: items with children navigate directly to the remembered/default child page.
// Touch or pen: items with children open the submenu instead of navigating.
const handleMainPointerUp = (item, key, event) => {
  const pointerType = event?.pointerType
  const isTouchInteraction =
    pointerType === 'touch' ||
    pointerType === 'pen' ||
    (!pointerType && hasTouchInput.value)

  handleMainClick(item, key, event, isTouchInteraction)
}

const handleMainClick = (item, key, event, isTouchInteraction) => {
  event?.stopPropagation()
  cancelCloseSubmenu()

  if (item.children) {
    if (isTouchInteraction) {
      // Touch/pen: open the submenu.
      handleArrowClick(item, key, event)
    } else {
      // Mouse: navigate to the remembered child, or the first visible child.
      const remembered = readSidebarMemory(key)
      const defaultChild = getFilteredChildren(key)[0]?.path
      const target = remembered || defaultChild || item.path

      if (target) {
        router.push(target)
        closeSidebar()
      }
    }

    return
  }

  if (!item.path) return

  if (item.external) {
    window.location.href = WEB_BASE + item.path
  } else {
    router.push(item.path)
    closeSidebar()
  }
}

// Handle mouse hover only when the current primary pointer truly supports hover.
const handleItemMouseEnter = (item, key, event) => {
  cancelCloseSubmenu()
  if (canHover.value && item.children) {
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
        left: Math.max(10, rect.left) // 確保不會超出左邊界
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
  closeSidebar()
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
  activeSubmenu.value = null;
}

// 获取访问统计数据
async function fetchVisitStats() {
  try {
    await ensureVisitStats();
  } catch (error) {
    console.error('获取访问统计失败:', error);
  }
}

// 切换统计面板展开/收起
async function toggleStatsPanel() {
  isStatsExpanded.value = !isStatsExpanded.value;

  if (isStatsExpanded.value && visitHistory.value.length === 0) {
    await fetchVisitHistory();
  }
}

// 关闭统计面板
function closeStatsPanel() {
  isStatsExpanded.value = false;
}

// 获取访问历史
async function fetchVisitHistory() {
  try {
    await ensureVisitHistory();
  } catch (error) {
    console.error('获取访问历史失败:', error);
  }
}

onMounted(async () => {
  checkInputCapabilities();
  await fetchVisitStats();
  document.addEventListener('click', closeSubmenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubmenu);
  if (hoverMediaQuery) {
    hoverMediaQuery.removeEventListener('change', updateInputCapabilities);
    hoverMediaQuery = null;
  }
  if (coarsePointerMediaQuery) {
    coarsePointerMediaQuery.removeEventListener('change', updateInputCapabilities);
    coarsePointerMediaQuery = null;
  }
  if (anyCoarsePointerMediaQuery) {
    anyCoarsePointerMediaQuery.removeEventListener('change', updateInputCapabilities);
    anyCoarsePointerMediaQuery = null;
  }
});
</script>



<style scoped lang="scss">

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$primary-light: var(--color-primary);

$text-primary: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-dark: var(--text-dark);
$text-muted: var(--text-secondary);

$portrait-ratio: 1;

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


/* 遮罩层 */
.overlay {
  position: fixed;
  top: 0;
  left: min(40dvw + 40px, 340px);
  z-index: 1000;
  width: calc(100dvw - min(40dvw + 40px, 340px));
  height: 100dvh;

  background: rgba(0, 0, 0, 0.5);
}


/* sidebar 顶部占位 */
.sidebar-empty {
  height: 8dvh;
}


/* 标题图片 */
.title-img {
  height: 8dvh;
  max-height: 60px;
  object-fit: contain;
}


/* 访问统计 */
.visit-stats {
  width: 100%;
  margin-top: 10px;
  margin-bottom: 15px;
  overflow-x: auto;
}


.stats-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
  padding: 2px 10px;
  flex-wrap: nowrap;

  @include soft-glass-background;

  border: 2px solid var(--glass-40);
  border-radius: var(--radius-md);

  @include soft-glass-shadow;
}


.stat-item {
  flex: 1;

  @include flex-col;

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


.expand-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;

  @include flex-center;
  @include soft-glass-background;

  border: 2px solid var(--glass-50);
  border-radius: var(--radius-full);

  color: $primary-dark;
  font-size: 18px;

  cursor: pointer;
  transition: all 0.3s ease;


  &:hover {
    background: linear-gradient(
      145deg,
      var(--glass-60),
      var(--glass-40)
    );

    box-shadow: 0 4px 12px rgba(0,0,0,0.15);

    transform: scale(1.15);
  }
}


.icp-number {
  text-align: center;
  color: var(--text-gray);
  font-size: 14px;
}



/* 访问统计弹窗 */

.stats-content {
  padding-top: 5px;
}


.loading-state {
  @include flex-col;

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

  background: var(--glass-40);

  border: 1px solid var(--glass-60);
  border-radius: var(--radius-lg);

  transition: all 0.3s ease;


  &:hover {
    background: var(--glass-60);

    box-shadow:
      0 4px 12px rgba(0,0,0,0.1);

    transform: translateY(-2px);
  }
}


.stat-icon {
  font-size: 32px;
  line-height: 1;
}


.stat-info {
  @include flex-col;

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
  @include flex-col;

  gap: 8px;
}


.history-item-modal {
  display: grid;

  grid-template-columns: 100px 1fr 60px;

  align-items: center;

  gap: 12px;

  padding: 12px 14px;

  background: var(--glass-40);

  border: 1px solid var(--glass-50);

  border-radius: var(--radius-md);

  transition: all 0.2s ease;


  &:hover {
    background: var(--glass-60);
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

  background: rgba(var(--color-primary-hover-rgb),0.1);

  border-radius: var(--radius-md);
}


.history-bar {
  min-width: 2%;

  height: 100%;

  background: linear-gradient(
    90deg,
    $primary-dark,
    $primary-light
  );

  border-radius: var(--radius-md);

  transition: width 0.5s ease;
}


.history-count {
  text-align: right;

  color: $primary-dark;

  font-size: 15px;

  font-weight: 700;
}

/* 子菜单 */

.submenu-panel {
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

  @include glass-blur(20px, 180%);

  border: 1px solid var(--glass-50);

  border-radius: var(--radius-lg);

  box-shadow:
    inset 0 0 0.5px var(--glass-30),
    0 12px 40px rgba(0,0,0,0.2),
    0 0 0 0.5px var(--glass-10);
}


.submenu-item {
  display: flex;

  align-items: center;

  gap: 12px;

  padding: 12px 16px;

  border-radius: var(--radius-md);

  color: $text-primary;

  font-size: 15px;

  font-weight: 500;

  cursor: pointer;

  transition:
    all 0.2s cubic-bezier(0.25,0.8,0.25,1);


  &:hover {
    background: linear-gradient(
      145deg,
      rgba(var(--color-primary-rgb),0.15),
      rgba(var(--color-primary-rgb),0.08)
    );

    transform: translateX(4px);
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


/* 动画 */

.slide-fade {
  &-enter-active {
    transition:
      all 0.3s cubic-bezier(0.25,0.8,0.25,1);
  }

  &-leave-active {
    transition:
      all 0.25s cubic-bezier(0.5,0,0.75,0);
  }


  &-enter-from,
  &-leave-to {
    opacity: 0;

    transform: translateX(-100%);
  }
}


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


.submenu-fade {

  &-enter-active,
  &-leave-active {
    transition:
      all 0.2s cubic-bezier(0.25,0.8,0.25,1);
  }


  &-enter-from,
  &-leave-to {
    opacity: 0;

    transform:
      translateX(-10px)
      scale(0.95);
  }
}


/* 移动端保持 SimpleSidebar 原逻辑 */

@media (max-aspect-ratio: $portrait-ratio) and (any-pointer: coarse) {

  .title-img {
    height: 6dvh;
    max-height: 50px;
  }


  .sidebar-content {
    gap: 15px;

    ul {
      gap: 8px;
    }


    li {
      padding: 3px 15px;
      font-size: 1.1rem;
    }
  }


  .submenu-item {
    padding: 8px 12px;
  }
}


/* 窄屏子菜单边界 */

@media (max-width:768px) {

  .submenu-panel {
    max-width:
      calc(100vw - 20px);
  }
}

</style>

