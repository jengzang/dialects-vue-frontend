<!-- TableManage.vue - 简化布局，无 navbar，只有悬浮按钮 -->
<template>
  <div class="simple-layout">
    <!-- 内容区域 -->
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 悬浮按钮组 -->
    <FloatingButtons
      :auth-button-position="authButtonPosition"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
    />

    <!-- 侧边栏 -->
    <SimpleSidebar
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
    />

    <PageTutorialGuide
      v-if="showTutorialGuide"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import FloatingButtons from '@/components/bar/FloatingButtons.vue';
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue';
import PageTutorialGuide from '@/main/components/tutorial/PageTutorialGuide.vue'

const route = useRoute();
const isSidebarOpen = ref(false);
const authButtonPosition = ref('top-right');
const showTutorialGuide = computed(() => route.path.endsWith('/explore/tools/praat'))

// 根据路由自动设置 auth-button 位置
watch(() => route.path, (newPath) => {
  if (newPath === '/villagesML' || newPath.startsWith('/villagesML/')) {
    authButtonPosition.value = 'bottom-left';
  } else {
    authButtonPosition.value = 'top-right';
  }
}, { immediate: true });
</script>


<style scoped lang="scss">
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
.simple-layout {
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
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

  @media (max-aspect-ratio: $portrait-ratio) {
    padding: 8px;
  }
}

/* 内容区域 */
.content-area {
  width: 98%;
  display: flex;
  justify-content: center;
  padding: 10px 6px;
  color: var(--text-deep);
  font-family: $system-font;
}

/* 页面切换动画 */
.fade {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>


