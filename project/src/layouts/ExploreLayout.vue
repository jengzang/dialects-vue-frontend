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
    <PageTutorialGuide />
  </div>
</template>

<script setup>
import ExploreBar from '@/components/bar/ExploreBar.vue'
import PageTutorialGuide from '@/main/components/tutorial/PageTutorialGuide.vue'

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
  'YangChunSpoken',
  'YangChunVillages',
  'YuBaoPage'
]

</script>


<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$fade-duration: 0.14s;
$portrait-ratio: 1 / 1;

$system-font:
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  Helvetica,
  Arial,
  sans-serif;

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

  background:
    radial-gradient(
      1200px 800px at 10% -10%,
      var(--bg-blue-tint) 0%,
      rgba(var(--bg-blue-tint-rgb), 0) 60%
    ),
    radial-gradient(
      1000px 700px at 110% 10%,
      var(--bg-blue-light) 0%,
      rgba(var(--bg-blue-tint-rgb), 0) 60%
    ),
    linear-gradient(
      180deg,
      var(--bg-blue-tint),
      var(--bg-blue-light)
    );
}

/* 内容区域 */
.content-area {
  position: relative;
  height: 88dvh;
  display: flex;
  justify-content: center;
  padding: 10px 6px;
  padding-top: calc(7.5dvh - 15px);
  color: var(--text-deep);
  font-family: $system-font;
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
  .content-area {
    padding-top: calc(8dvh - 15px);
  }
}
</style>


