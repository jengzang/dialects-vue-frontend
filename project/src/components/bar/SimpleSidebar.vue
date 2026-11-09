<!-- SimpleSidebar.vue - 简化的侧边栏 -->
<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="fade">
      <div v-if="isOpen" class="overlay main-sidebar-overlay" @click="$emit('close')" @wheel.prevent @touchmove.prevent></div>
    </Transition>

    <!-- 侧边栏 -->
    <Transition name="slide-fade">
      <div v-if="isOpen" class="sidebar main-sidebar-shell" @touchmove.stop>
      <!-- 标题图片 (可选) -->
      <div v-if="showTitle" class="sidebar-header">
        <img :src="brandTitleSrc" alt="方音圖鑑" class="title-img title-logo" />
      </div>
      <div v-else class="sidebar-empty main-sidebar-empty"></div>

      <div class="sidebar-content main-sidebar-content">
        <ul class="main-sidebar-list ui-scrollbar">
          <!-- Dynamic menu items from config (includes 返回查詢 for SimpleSidebar) -->
          <li
            v-for="(item, key) in filteredMenuConfig"
            :key="key"
            class="main-sidebar-item"
            :class="{ 'is-active': isMenuItemActive(item) }"
            @pointerup="handleMainPointerUp(item, key, $event)"
            @click.stop
            @mouseenter="handleItemMouseEnter(item, key, $event)"
            @mouseleave="item.children && canHover ? scheduleCloseSubmenu() : null"
          >
            <BarIcon :icon="item.icon" />
            {{ item.label }}
            <svg v-if="item.children && canHover" class="sidebar-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>
            <svg v-else-if="item.children" class="sidebar-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            <svg v-else-if="item.external" class="sidebar-external" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
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
              <InlineIcon icon="📊" />
            </button>
          </div>
        </div>

        <div class="icp-number">粤ICP备2025466875号</div>
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
            <div class="stat-icon"><InlineIcon icon="📅" /></div>
            <div class="stat-info">
              <span class="stat-label-large">{{ t('navigation.stats.todayVisits') }}</span>
              <span class="stat-value-large">{{ todayVisits }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><InlineIcon icon="🌐" /></div>
            <div class="stat-info">
              <span class="stat-label-large">{{ t('navigation.stats.totalVisits') }}</span>
              <span class="stat-value-large">{{ totalVisits }}</span>
            </div>
          </div>
        </div>

        <div
          ref="visitHistoryChartEl"
          class="visit-history-chart"
          role="img"
          :aria-label="`${t('navigation.stats.pageVisits')} / ${t('navigation.stats.featureUsage')} / ${t('navigation.stats.staticRequests')}`"
        ></div>
        <p v-if="usageHistoryError" class="usage-history-error">{{ t('navigation.stats.usageLoadError') }}</p>
        <p v-if="totalHistoryError" class="usage-history-error">{{ t('navigation.stats.staticLoadError') }}</p>

        <div class="history-section">
          <button
            class="section-title"
            type="button"
            :aria-expanded="isVisitHistoryExpanded"
            @click="isVisitHistoryExpanded = !isVisitHistoryExpanded"
          >
            <span>{{ t('navigation.stats.historyRecords') }}</span>
            <svg
              class="history-toggle-arrow"
              :class="{ 'is-expanded': isVisitHistoryExpanded }"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <template v-if="isVisitHistoryExpanded">
            <div class="history-filters">
              <CheckBox
                :model-value="showUsageHistory"
                :label="t('navigation.stats.featureUsage')"
                class="usage-checkbox"
                @update:model-value="setHistoryFilter('usage', $event)"
              />
              <CheckBox
                :model-value="showVisitHistory"
                :label="t('navigation.stats.pageVisits')"
                @update:model-value="setHistoryFilter('visits', $event)"
              />
              <CheckBox
                :model-value="showStaticHistory"
                :label="t('navigation.stats.staticRequests')"
                class="static-checkbox"
                @update:model-value="setHistoryFilter('static', $event)"
              />
            </div>
            <div class="history-list">
              <div v-for="item in combinedHistory" :key="item.date" class="history-item-modal">
                <span class="history-date">{{ item.date }}</span>
                <div class="history-bar-container">
                  <div
                    v-if="showVisitHistory && item.visits > 0"
                    class="history-bar"
                    :style="{ width: (item.visits / maxHistoryCount * 100) + '%' }"
                  ></div>
                  <div
                    v-if="showUsageHistory && item.usage > 0"
                    class="history-bar history-bar--usage"
                    :style="{ width: (item.usage / maxHistoryCount * 100) + '%' }"
                  ></div>
                  <div
                    v-if="showStaticHistory && item.static > 0"
                    class="history-bar history-bar--static"
                    :style="{ width: (item.static / maxHistoryCount * 100) + '%' }"
                  ></div>
                </div>
                <span class="history-count" :style="historyCountStyle">{{ item.total }}</span>
              </div>
            </div>
          </template>
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
          :class="{ 'is-active': isPathActive(child.path) }"
          @click="handleSubmenuClick(child)"
        >
          <BarIcon :icon="child.icon" class="submenu-icon" />
          <span class="submenu-label">{{ child.label }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue'
import { clearToken, getToken } from '@/api/auth/auth.js'
import BarIcon from '@/components/common/BarIcon.vue'
import InlineIcon from '@/components/common/InlineIcon.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { useVisitStats, ensureVisitHistory } from '@/composables/data/useVisitStats.js'
import {userStore} from "@/main/store/store.js";
import { useSidebarConfig } from '@/main/config/index.js';
import { navigatePlatformLink } from '@/platform/index.js'
import { WEB_BASE } from '@/env-config.js'
import { currentColorTheme, getBrandAssets } from '@/composables/core/uiPreferences.js'
import { getOrInitChart, onChartThemeChange } from '@/utils/chart/chartTheme.js'

const brandTitleSrc = computed(() => getBrandAssets(currentColorTheme.value).title)

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

const isPathActive = (path) => {
  if (!path) return false
  const target = router.resolve(path)
  if (route.path !== target.path) return false

  return Object.entries(target.query).every(([key, value]) => {
    return JSON.stringify(route.query[key]) === JSON.stringify(value)
  })
}

const isMenuItemActive = (item) => {
  const paths = item.children?.map((child) => child.path) ?? [item.path]
  return paths.some(isPathActive)
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

// 侧边栏打开时锁定页面滚动，避免滚轮/触摸滚动穿透到背后页面
let savedBodyOverflow = ''

watch(
  () => props.isOpen,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = savedBodyOverflow
    }
  },
  { immediate: true }
)

// 访问统计相关
const isStatsExpanded = ref(false);
const isVisitHistoryExpanded = ref(true)
const showVisitHistory = ref(true)
const showUsageHistory = ref(true)
const showStaticHistory = ref(false)
const usageHistory = ref([])
const usageHistoryError = ref(false)
const totalHistory = ref([])
const totalHistoryError = ref(false)
let usageHistoryLoaded = false
let usageHistoryRequest = null
let totalHistoryLoaded = false
let totalHistoryRequest = null
const visitHistoryChartEl = ref(null)
let visitHistoryChart = null

const staticHistory = computed(() => {
  const visits = new Map(visitHistory.value.map((item) => [item.date, item.count]))
  const usage = new Map(usageHistory.value.map((item) => [item.date, item.count]))
  return totalHistory.value
    .filter((item) => visits.has(item.date) && usage.has(item.date))
    .map((item) => ({ date: item.date, count: item.count - usage.get(item.date) - visits.get(item.date) }))
})

const combinedHistory = computed(() => {
  const days = new Map()
  for (const item of visitHistory.value) {
    days.set(item.date, { date: item.date, visits: item.count, usage: 0, hasVisits: true, hasUsage: false })
  }
  for (const item of usageHistory.value) {
    const day = days.get(item.date) || { date: item.date, visits: 0, usage: 0, hasVisits: false, hasUsage: false }
    day.usage = item.count
    day.hasUsage = true
    days.set(item.date, day)
  }
  for (const item of staticHistory.value) {
    const day = days.get(item.date) || { date: item.date, visits: 0, usage: 0, hasVisits: false, hasUsage: false }
    day.static = item.count
    day.hasStatic = true
    days.set(item.date, day)
  }
  return [...days.values()]
    .filter((day) => (showVisitHistory.value && day.hasVisits) || (showUsageHistory.value && day.hasUsage) || (showStaticHistory.value && day.hasStatic))
    .map((day) => ({ ...day, total: (showVisitHistory.value ? day.visits : 0) + (showUsageHistory.value ? day.usage : 0) + (showStaticHistory.value ? (day.static ?? 0) : 0) }))
    .sort((a, b) => b.date.localeCompare(a.date))
})
const maxHistoryCount = computed(() => Math.max(1, ...combinedHistory.value.map((day) => day.total)))
const historyCountStyle = computed(() => {
  const colors = []
  if (showVisitHistory.value) colors.push('var(--color-primary-hover)')
  if (showUsageHistory.value) colors.push('var(--color-secondary)')
  if (showStaticHistory.value) colors.push('var(--color-tertiary)')
  if (colors.length === 1) return { color: colors[0] }
  return {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
})

function setHistoryFilter(kind, checked) {
  if (kind === 'usage' && (checked || showVisitHistory.value || showStaticHistory.value)) showUsageHistory.value = checked
  if (kind === 'visits' && (checked || showUsageHistory.value || showStaticHistory.value)) showVisitHistory.value = checked
  if (kind === 'static' && (checked || showVisitHistory.value || showUsageHistory.value)) showStaticHistory.value = checked
}

async function fetchTotalHistory() {
  if (totalHistoryLoaded || totalHistoryRequest) return totalHistoryRequest
  totalHistoryError.value = false
  totalHistoryRequest = (async () => {
    try {
      const response = await fetch(`${WEB_BASE}/logs/stats/daily?days=60`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      if (!Array.isArray(result.data)) throw new Error('Invalid daily statistics response')
      totalHistory.value = result.data.map((item) => ({ date: item.date, count: Number(item.total_calls) || 0 }))
      totalHistoryLoaded = true
    } catch (error) {
      totalHistoryError.value = true
      console.error('获取静态资源统计失败:', error)
    } finally {
      totalHistoryRequest = null
    }
  })()
  return totalHistoryRequest
}

async function fetchUsageHistory() {
  if (usageHistoryLoaded || usageHistoryRequest) return usageHistoryRequest
  usageHistoryError.value = false
  usageHistoryRequest = (async () => {
    try {
      const response = await fetch(`${WEB_BASE}/logs/stats/daily?days=60&exclude_static=true`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      if (!Array.isArray(result.data)) throw new Error('Invalid daily statistics response')
      usageHistory.value = result.data.map((item) => ({ date: item.date, count: Number(item.total_calls) || 0 }))
      usageHistoryLoaded = true
    } catch (error) {
      usageHistoryError.value = true
      console.error('获取功能使用统计失败:', error)
    } finally {
      usageHistoryRequest = null
    }
  })()
  return usageHistoryRequest
}

function updateVisitHistoryChart() {
  if (!visitHistoryChartEl.value) return

  const visits = new Map(visitHistory.value.map((item) => [item.date, item.count]))
  const usage = new Map(usageHistory.value.map((item) => [item.date, item.count]))
  const staticRequests = new Map(staticHistory.value.map((item) => [item.date, item.count]))
  const dates = [...new Set([...visits.keys(), ...usage.keys(), ...staticRequests.keys()])].sort()
  const style = getComputedStyle(document.documentElement)
  const primary = style.getPropertyValue('--color-primary').trim()
  const secondary = style.getPropertyValue('--color-secondary').trim()
  const staticColor = style.getPropertyValue('--color-tertiary').trim()
  visitHistoryChart = getOrInitChart(visitHistoryChartEl.value)
  const staticLabel = t('navigation.stats.staticRequestsRightAxis')
  const staticSelected = visitHistoryChart.getOption()?.legend?.[0]?.selected?.[staticLabel] ?? false
  visitHistoryChart.setOption({
    color: [primary, secondary, staticColor],
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 0, inactiveColor: style.getPropertyValue('--text-tertiary').trim(), selected: { [staticLabel]: staticSelected } },
    grid: { top: 40, right: 55, bottom: 28, left: 48 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: { hideOverlap: true }
    },
    yAxis: [
      { type: 'value', minInterval: 1, axisLabel: { color: primary }, splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', minInterval: 1, axisLabel: { color: secondary }, splitLine: { show: false } }
    ],
    series: [
      { name: t('navigation.stats.pageVisitsLeftAxis'), type: 'line', smooth: true, showSymbol: false, data: dates.map((date) => visits.get(date) ?? null) },
      { name: t('navigation.stats.featureUsageRightAxis'), type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, data: dates.map((date) => usage.get(date) ?? null) },
      { name: staticLabel, type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, data: dates.map((date) => staticRequests.get(date) ?? null) }
    ]
  }, true)
}

watch([isStatsExpanded, loadingStats, visitHistory, usageHistory, totalHistory], async ([expanded, loading]) => {
  if (!expanded) {
    visitHistoryChart?.dispose()
    visitHistoryChart = null
    return
  }
  if (loading) return
  await nextTick()
  if (!isStatsExpanded.value || loadingStats.value) return
  updateVisitHistoryChart()
})

onChartThemeChange(updateVisitHistoryChart)

function resizeVisitHistoryChart() {
  visitHistoryChart?.resize()
}

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

const handleMainClick = async (item, key, event, isTouchInteraction) => {
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

  await navigatePlatformLink(router, item.path, {
    external: item.external,
    reload: item.external,
    webOrigin: WEB_BASE,
  })
  closeSidebar()
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
  closeSidebar()
  return navigatePlatformLink(router, child.path, { external: child.external })
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

  if (isStatsExpanded.value) {
    const requests = [fetchUsageHistory(), fetchTotalHistory()]
    if (visitHistory.value.length === 0) requests.push(fetchVisitHistory())
    await Promise.all(requests)
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
  window.addEventListener('resize', resizeVisitHistoryChart)
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeVisitHistoryChart)
  visitHistoryChart?.dispose()
  visitHistoryChart = null
  if (props.isOpen) document.body.style.overflow = savedBodyOverflow;
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
@use '@/styles/global/mixins' as *;

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
  // left: calc(min(40dvw + 40px, 330px) + 12px);
  left: 0;
  z-index: 1000;
  // width: calc(100dvw - min(40dvw + 40px, 340px) - 12px);
  width: 100dvw;
  height: 100dvh;

  background: rgba(0, 0, 0, 0.2);
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
  flex-shrink: 0;
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
  font-size: var(--font-size-12);
  font-weight: 600;
}


.stat-value {
  color: var(--color-secondary-hover);
  font-size: var(--font-size-18);
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

  color: var(--color-secondary-hover);
  font-size: var(--font-size-18);

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
  font-size: var(--font-size-14);
  flex-shrink: 0;
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


.visit-history-chart {
  width: 100%;
  height: 260px;
  margin-bottom: 25px;
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
  font-size: var(--font-size-32);
  line-height: 1;
}


.stat-info {
  @include flex-col;

  gap: 4px;
}


.stat-label-large {
  white-space: nowrap;

  color: $text-secondary;

  font-size: var(--font-size-13);
  font-weight: 600;
}


.stat-value-large {
  color: var(--color-secondary-hover);

  font-size: var(--font-size-24);
  font-weight: 900;

  line-height: 1;
}


.history-section {
  margin-top: 10px;
}

.usage-history-error {
  color: var(--color-error-dark);
}

.history-filters {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.usage-checkbox.checkbox-wrapper {
  --checkbox-color: var(--color-secondary);
  --checkbox-border: var(--color-secondary);
  --checkbox-shadow: rgba(var(--color-secondary-rgb), 0.3);
}

.static-checkbox.checkbox-wrapper {
  --checkbox-color: var(--color-tertiary);
  --checkbox-border: var(--color-tertiary);
  --checkbox-shadow: rgba(var(--color-tertiary-rgb), 0.3);
}


.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0 0 12px 4px;
  padding: 0 4px;
  border: 0;
  background: transparent;

  color: $text-muted;

  text-transform: uppercase;

  font-size: var(--font-size-14);
  font-weight: 700;

  letter-spacing: 0.5px;
  text-align: left;
  cursor: pointer;
}


.history-toggle-arrow {
  flex: 0 0 auto;
  transition: transform 0.2s ease;

  &.is-expanded {
    transform: rotate(180deg);
  }
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

  font-size: var(--font-size-13);
  font-weight: 600;
}


.history-bar-container {
  position: relative;
  display: flex;

  height: 20px;

  overflow: hidden;

  background: rgba(var(--color-primary-hover-rgb),0.1);

  border-radius: var(--radius-md);
}


.history-bar {
  height: 100%;

  background: linear-gradient(
    90deg,
    $primary-dark,
    $primary-light
  );

  transition: width 0.5s ease;
}

.history-bar--usage {
  background: var(--color-secondary);
}

.history-bar--static {
  background: var(--color-tertiary);
}


.history-count {
  justify-self: end;
  text-align: right;

  color: $primary-dark;

  font-size: var(--font-size-16);

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
  position: relative;

  align-items: center;

  gap: 12px;

  padding: 12px 16px;

  border-radius: var(--radius-md);

  color: $text-primary;

  font-size: var(--font-size-16);

  font-weight: 500;

  cursor: pointer;

  transition:
    all 0.2s cubic-bezier(0.25,0.8,0.25,1);


  &:hover {
    background: var(--submenu-hover-background);

    transform: translateX(4px);
  }

  &.is-active {
    background: var(--submenu-hover-background);
    color: var(--color-secondary-text);
    font-weight: 700;

    &:hover {
      color: var(--color-secondary-hover);
    }

    &::before {
      position: absolute;
      left: 16px;
      bottom: 5px;
      width: 22px;
      height: 3px;
      border-radius: var(--radius-full);
      background: var(--color-secondary);
      content: '';
    }
  }
}


.sidebar-chevron,
.sidebar-external {
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0.6;
}

.submenu-icon {
  flex-shrink: 0;

  font-size: var(--font-size-18);
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

    transform: translateX(calc(-100% - 12px));
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

@media (max-aspect-ratio: $portrait-ratio) {

  // .overlay {
  //   left: min(40dvw + 40px, 340px);
  //   width: calc(100dvw - min(40dvw + 40px, 340px));
  // }

  .slide-fade {
    &-enter-from,
    &-leave-to {
      transform: translateX(-100%);
    }
  }
}

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
      padding: 3px 8px 3px 15px;
      font-size: var(--font-size-18);
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
