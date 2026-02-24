<!-- TableManage.vue - 简化布局，无 navbar，只有悬浮按钮 -->
<template>
  <div class="simple-layout">
    <!-- 内容区域 -->
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
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
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import FloatingButtons from '@/components/bar/FloatingButtons.vue';
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue';

const route = useRoute();
const isSidebarOpen = ref(false);
const authButtonPosition = ref('top-right');

// 根据路由自动设置 auth-button 位置
watch(() => route.path, (newPath) => {
  if (newPath === '/villagesML') {
    authButtonPosition.value = 'bottom-left';
  } else {
    authButtonPosition.value = 'top-right';
  }
}, { immediate: true });
</script>

<style scoped>
/* 背景：柔和藍色漸層 */
.simple-layout {
  min-height: 100dvh;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background:
    radial-gradient(1200px 800px at 10% -10%, #dff1ff 0%, rgba(223,241,255,0) 60%),
    radial-gradient(1000px 700px at 110% 10%, #cfe7ff 0%, rgba(207,231,255,0) 60%),
    linear-gradient(180deg, #eaf5ff, #d7ecff);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
}

@media (max-aspect-ratio: 1/1) {
  .simple-layout{
    padding:8px;
  }
}

.content-area {
  width: 98%;
  display: flex;
  justify-content: center;
  padding: 10px 6px;
  color: #0b2540;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
