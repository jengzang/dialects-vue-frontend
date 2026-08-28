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
    </div>
    <AppFooter layout-kind="explore" />
    <ScrollToTop />
    <PageTutorialGuide />
  </div>
</template>

<script setup>
import ExploreBar from '@/components/bar/ExploreBar.vue'
import PageTutorialGuide from '@/main/components/tutorial/PageTutorialGuide.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import AppFooter from '@/components/footer/AppFooter.vue'

const keepAliveViewNames = [
  'AllVillages',
  'CharacterClassification',
  'CheckTool',
  'gdVillagesTable',
  'gdVillagesTree',
  'Jyut2IpaTool',
  'MergeTool',
  'TableManage',
  'VillagesML',
  'YangChunVillages'
]

</script>


<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$fade-duration: 0.14s;
$portrait-ratio: 1;

/* 页面背景 */
.explore-layout {
  min-height: 100dvh;
  @include flex-col;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;

  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));

  background: var(--bg-page-gradient);
}

/* 内容区域 */
.content-area {
  position: relative;
  display: flex;
  justify-content: center;
  flex: 1;
  width: 100%;
  min-height: 100dvh;
  padding: 10px 6px;
  padding-top: calc(7dvh - 15px);
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
  .explore-layout {
    padding:
      max(16px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
  }

  .content-area {
    padding-top: calc(8dvh - 15px);
  }
}
</style>

