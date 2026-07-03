<template>
  <div class="explore-layout">
    <!-- ExploreBar 导航栏 -->
    <ExploreBar />

    <!-- 内容区域 (与 SimpleLayout 保持一致) -->
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          mode="out-in"
        >
          <KeepAlive :include="keepAliveViewNames">
            <component :is="Component" />
          </KeepAlive>
        </transition>
      </router-view>

      <transition name="layout-loading-fade">
        <div v-if="isRouteTransitionLoading" class="layout-loading-overlay" aria-live="polite">
          <div class="layout-loading-shell">
            <div class="ui-loading--page" aria-hidden="true"></div>
            <p class="layout-loading-text">頁面切換中...</p>
          </div>
        </div>
      </transition>
    </div>
    <PageTutorialGuide />
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ExploreBar from '@/components/bar/ExploreBar.vue'
import PageTutorialGuide from '@/main/components/tutorial/PageTutorialGuide.vue'

const keepAliveViewNames = [
  'CharacterClassification',
  'CheckTool',
  'gdVillagesTable',
  'gdVillagesTree',
  'Jyut2IpaTool',
  'MergeTool',
  'TableManage',
  'VillagesML',
  'YangChunSpoken',
  'YangChunVillages',
  'YuBaoPage'
]

const route = useRoute()
const isRouteTransitionLoading = ref(false)
let pendingHideToken = 0

const finishRouteTransition = async () => {
  const token = ++pendingHideToken
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (token === pendingHideToken) {
        isRouteTransitionLoading.value = false
      }
    })
  })
}

watch(
  () => route.fullPath,
  async (nextPath, previousPath) => {
    if (!previousPath || nextPath === previousPath) {
      return
    }

    isRouteTransitionLoading.value = true
    await finishRouteTransition()
  }
)
</script>

<style scoped>
/* 背景：与 SimpleLayout 保持一致 */
.explore-layout {
  min-height: 100dvh;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background:
    radial-gradient(1200px 800px at 10% -10%, #dff1ff 0%, rgba(223,241,255,0) 60%),
    radial-gradient(1000px 700px at 110% 10%, #cfe7ff 0%, rgba(207,231,255,0) 60%),
    linear-gradient(180deg, #eaf5ff, #d7ecff);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
}

/* 内容区域：与 SimpleLayout 完全一致 */
.content-area {
  position: relative;
  height: 88dvh;
  display: flex;
  justify-content: center;
  padding: 10px 6px;
  color: #0b2540;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  /* 桌面端：为 ExploreBar 留出空间 (7.5dvh + 一点间距) */
  padding-top: calc(7.5dvh - 15px);
}

.layout-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(234, 245, 255, 0.42);
  border-radius: 28px;
  z-index: 20;
  pointer-events: none;
}

.layout-loading-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.layout-loading-text {
  margin: 0;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

/* 移动端：调整 padding-top */
@media (max-aspect-ratio: 1/1) {
  .content-area {
    /* 移动端：为 ExploreBar 留出空间 (max(8dvh, 44px) + 一点间距) */
    padding-top: calc(8dvh - 15px);
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.14s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.layout-loading-fade-enter-active,
.layout-loading-fade-leave-active {
  transition: opacity 0.12s ease;
}

.layout-loading-fade-enter-from,
.layout-loading-fade-leave-to {
  opacity: 0;
}
</style>
