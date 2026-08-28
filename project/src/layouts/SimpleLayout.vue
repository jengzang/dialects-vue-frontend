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

    <AppFooter
      v-if="showAppFooter"
      layout-kind="simple"
    />

    <!-- 悬浮按钮组 -->
    <FloatingButtons
      :auth-button-position="authButtonPosition"
      :float-buttons-position="floatButtonsPosition"
      :show-home-button="false"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
    />

    <!-- 侧边栏 -->
    <SimpleSidebar
      :is-open="isSidebarOpen"
      @close="isSidebarOpen = false"
    />

    <ScrollToTop />
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
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import AppFooter from '@/components/footer/AppFooter.vue'
import { stripLocaleFromPath } from '@/i18n/localeRouting.js'

const route = useRoute();
const isSidebarOpen = ref(false);
const authButtonPosition = ref('top-right');
const floatButtonsPosition = ref('bottom-right');
const showTutorialGuide = computed(() => route.path.endsWith('/explore/tools/praat'))
const showAppFooter = computed(() => stripLocaleFromPath(route.path) !== '/')

// 根据路由自动设置浮动按钮位置
watch(() => route.path, (newPath) => {
  if (newPath === '/villagesML' || newPath.startsWith('/villagesML/')) {
    authButtonPosition.value = 'bottom-left';
    floatButtonsPosition.value = 'bottom-right';
  } else {
    authButtonPosition.value = 'top-right';
    floatButtonsPosition.value = 'top-left';
  }
}, { immediate: true });
</script>


<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$portrait-ratio: 1;

/* 页面背景 */
.simple-layout {
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

  @media (max-aspect-ratio: $portrait-ratio) {
    padding:
      max(16px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
  }
}

/* 内容区域 */
.content-area {
  width: 98%;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 10px 6px;
  color: var(--text-deep);
  font-family: var(--font-sans);
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
