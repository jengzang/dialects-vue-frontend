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

const keepAliveViewNames = [
  'ComparePage',
  'DialectClustering',
  'MapPage',
  'PhoPage',
  'QueryPage',
  'ResultPage',
]

// const shouldShowHeader = computed(() => {
//   // console.log(route)
//   return route.query.tab !== 'about' && !route.path.includes('auth')
// })
</script>

```scss
<style scoped lang="scss">
$layout-text: #0b2540;
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

  background:
    radial-gradient(
      1200px 800px at 10% -10%,
      #dff1ff 0%,
      rgba(223, 241, 255, 0) 60%
    ),
    radial-gradient(
      1000px 700px at 110% 10%,
      #cfe7ff 0%,
      rgba(207, 231, 255, 0) 60%
    ),
    linear-gradient(
      180deg,
      #eaf5ff,
      #d7ecff
    );
}

/* 内容区域 */
.glass-content {
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10dvh 12px 12px;
  overflow-x: hidden;
  color: $layout-text;
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
  .glass-content {
    padding: 17dvh 8px 8px;
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
```

