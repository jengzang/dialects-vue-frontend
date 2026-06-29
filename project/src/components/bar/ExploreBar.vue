<template>
  <div class="explorebar">
    <div class="explorebar-desktop">
      <div class="logo-and-title" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <div class="logo-container">
          <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
        </div>
        <div class="title">
          <img src="../../assets/picture/title.png" alt="Title" />
        </div>
      </div>

      <nav class="explorebar-tabs ui-scrollbar--hidden" @mouseleave="handleTabLeave">
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

      <div v-if="userStore.username" class="avatar-container" @click="goToAuthPage">
        <NavAvatar />
      </div>
      <div v-else class="login-container" @click="goToAuthPage">
        <span class="login-text">{{ t('navigation.login') }}</span>
      </div>
    </div>

    <div class="explorebar-mobile">
      <div class="logo-container" @click="toggleSidebar" :style="{ zIndex: isSidebarVisible ? '1100' : '999' }">
        <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
      </div>

      <nav class="explorebar-tabs ui-scrollbar--hidden">
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
            <span class="submenu-icon">{{ child.icon }}</span>
            <span class="submenu-label">{{ child.label }}</span>
          </div>
        </div>
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
import {
  useExploreBarConfig,
  getExploreBarTabs,
  filterVisibleExploreBarTabs,
  getExploreBarChildren,
  getExploreBarActiveTab,
  matchExploreBarChildRoute
} from '@/main/config/BarAndTabs/ExploreBarConfig.js'

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
const submenuPosition = ref({ top: 0, left: 0 })
let closeSubmenuTimer = null

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const getTabChildren = (tabKey) => {
  return getExploreBarChildren(exploreBarConfig.value, tabKey)
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

onMounted(() => {
  checkMobile()
  document.addEventListener('click', closeSubmenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSubmenu)
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

const getFlexWeight = (tab, isActive, isMobileLayout) => {
  let labelVisible

  if (isMobileLayout) {
    const showOnlyWhenActive = tab.mobileShowLabelOnlyWhenActive ?? tab.showLabelOnlyWhenActive
    labelVisible = !tab.hideLabelOnMobile && (!showOnlyWhenActive || isActive)
  } else {
    labelVisible = !tab.showLabelOnlyWhenActive || isActive
  }

  if (labelVisible) {
    return isMobileLayout ? (tab.mobileWeight || tab.weight) : tab.weight
  }

  if (isMobileLayout) {
    return tab.mobileWeightIconOnly || tab.mobileWeight || tab.weightIconOnly || tab.weight
  }

  return tab.weightIconOnly || tab.weight
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
  router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
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
  flex-shrink: 0;
}

.explorebar-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 auto;
  max-width: 1000px;
  min-width: 0;
  margin: 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
  height: 7.5dvh;
}

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
  min-width: 5dvh;
  flex-shrink: 0;
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
  flex-shrink: 0;
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
    height: max(8dvh, 44px);
    padding: 0 1%;
    gap: 3px;
  }

  .explorebar-mobile .explorebar-tabs {
    display: flex;
    gap: 4px;
    flex: 1 1 auto;
    min-width: 0;
    margin: 0 6px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .explorebar-mobile .tab-item {
    height: max(6dvh, 40px);
    border-radius: 30px;
    flex-shrink: 0;
  }

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

.main-submenu-panel {
  position: fixed;
  width: auto;
  max-width: min(300px, calc(100vw - 20px));
  z-index: 10001;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-shadow:
    inset 0 0 0.5px rgba(255, 255, 255, 0.3),
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

@media (max-aspect-ratio: 1/1) {
  .main-submenu-panel {
    max-width: calc(100vw - 20px);
  }

  .submenu-item {
    padding: 10px 14px;
    font-size: 14px;
  }
}

.avatar-container {
  width: 6dvh;
  min-width: 6dvh;
  max-width: 6dvh;
  height: 6dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  box-sizing: border-box;
}
</style>
