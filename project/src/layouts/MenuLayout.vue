<!-- src/layouts/MenuLayout.vue -->
<template>
  <div class="menu-bg">
    <NavBar />
    <!--    <FloatingHeader v-if="shouldShowHeader" />-->
    <!-- 內容區：注意底部留白避免被 tab 擋住 -->
    <div class="glass-content">
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
    </div>
    <PageTutorialGuide />
    <PanelManager />

    <ScrollToTop />
  </div>
</template>

<script setup>
// import MenuTabs from '@/components/MenuTabs.vue'
// import TabControls from "@/components/TabControls.vue";
// import FloatingHeader from '@/components/FloatingHeader.vue'
// import { computed } from 'vue'
import NavBar from "@/components/bar/NavBar.vue";
import PageTutorialGuide from '@/main/components/tutorial/PageTutorialGuide.vue'
import PanelManager from '@/main/components/result/PanelManager.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'

const keepAliveViewNames = [
  'ComparePage',
  'DialectClustering',
  'MapPage',
  'PhoPage',
  'QueryPage',
  'ResultPage',
  'VocabularyPage',
  'YuBaoMenuPage',
]

// const shouldShowHeader = computed(() => {
//   // console.log(route)
//   return route.query.tab !== 'about' && !route.path.includes('auth')
// })
</script>


<style scoped lang="scss">
$fade-duration: 0.14s;
$portrait-ratio: 1;

/* 页面背景 */
.menu-bg {
  min-height: 100dvh;
  display: grid;
  align-items: flex-start;
  justify-items: center;
  box-sizing: border-box;

  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));

  background: var(--bg-page-gradient);
}

/* 内容区域 */
.glass-content {
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 6dvh 12px 12px;
  overflow-x: hidden;
  color: var(--text-deep);
  font-family: var(--font-sans);
}

/* 页面切换动画 */
.fade {
  &-enter-active,
  &-leave-active {
    transition: opacity $fade-duration ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}

/* 竖屏布局 */
@media (max-aspect-ratio: $portrait-ratio) {
  .menu-bg {
    padding:
      max(16px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
  }

  .glass-content {
    padding: 15dvh 8px 8px;
    font-size: 1.1rem;
    line-height: 1.6;
  }
}

/* 中等宽度 */
@media (min-width: 481px) and (max-width: 768px) {
  .glass-content {
    font-size: 1rem;
    line-height: 1.5;
  }
}

/* 桌面端 */
@media (min-width: 769px) {
  .glass-content {
    font-size: 0.95rem;
    line-height: 1.4;
  }
}
</style>
