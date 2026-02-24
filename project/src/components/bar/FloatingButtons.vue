<!-- FloatingButtons.vue - 悬浮按钮组 -->
<template>
  <!-- 认证按钮 -->
  <div
    class="auth-button"
    :class="authButtonPositionClass"
    @click="goToAuth"
  >
    <span class="auth-text">
      {{ userStore.username || '登錄' }}
    </span>
  </div>

  <!-- 右下角功能按钮组 -->
  <div class="floating-buttons">
    <!-- 返回首页按钮 -->
    <button
      class="float-btn menu-btn"
      @click="$emit('toggle-sidebar')"
      title="打開菜單"

    >
      <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
    </button>

    <!-- 打开侧边栏按钮 -->
    <button
      class="float-btn home-btn"
      @click="goToHome"
      title="返回首頁"
    >
      🏠
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { userStore } from '@/utils/store.js';

const props = defineProps({
  // 认证按钮位置: 'top-right' | 'bottom-left'
  authButtonPosition: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'bottom-left'].includes(value)
  }
});

const router = useRouter();

defineEmits(['toggle-sidebar']);

const authButtonPositionClass = computed(() => {
  return props.authButtonPosition === 'bottom-left' ? 'position-bottom-left' : 'position-top-right';
});

const goToHome = () => {
  router.push({ path: '/menu', query: { tab: 'query' } });
};

const goToAuth = () => {
  router.push('/auth');
};
</script>

<style scoped>
/* 认证按钮基础样式 */
.auth-button {
  position: fixed;
  z-index: 998; /* 与 floating-buttons 同级 */

  /* 尺寸和形状 */
  min-width: 60px;
  height: 45px;
  padding: 0 10px;
  border-radius: 25px; /* Pill shape */

  /* 玻璃态效果 */
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
  backdrop-filter: blur(15px) saturate(150%);
  -webkit-backdrop-filter: blur(15px) saturate(150%);

  /* 边框和阴影 */
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);

  /* 布局 */
  display: flex;
  align-items: center;
  justify-content: center;

  /* 交互 */
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

/* 位置变体 - 右上角（默认） */
.auth-button.position-top-right {
  top: 20px;
  right: 20px;
}

/* 位置变体 - 左下角 */
.auth-button.position-bottom-left {
  bottom: 20px;
  left: 20px;
}

.auth-button:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  transform: scale(1.05) translateY(-2px);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.auth-button:active {
  transform: scale(1.02);
}

.auth-text {
  color: #005fd3; /* Apple 蓝色 */
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

/* 右下角功能按钮组 */
.floating-buttons {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 998;
}

.float-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.5);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
  backdrop-filter: blur(15px) saturate(150%);
  -webkit-backdrop-filter: blur(15px) saturate(150%);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  user-select: none;
  padding: 8px;
}

.float-btn:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
}

.float-btn:active {
  transform: scale(1.05);
}

/* Logo 样式 - 与 navbar 保持一致 */
.logo {
  width: 85%;
  height: auto;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  /* 认证按钮移动端 - 统一到左下角 */
  .auth-button {
    min-width: 50px;
    height: 35px;
    padding: 0 10px;
    border-radius: 22px;
  }

  .auth-button.position-top-right,
  .auth-button.position-bottom-left {
    top: auto;
    left: 15px;
    bottom: 15px;
    right: auto;
  }

  .auth-text {
    font-size: 14px;
    max-width: 100px;
  }

  /* 功能按钮移动端 */
  .floating-buttons {
    bottom: 20px;
    right: 20px;
    gap: 10px;
  }

  .float-btn {
    width: 50px;
    height: 50px;
    font-size: 22px;
  }
}
</style>
