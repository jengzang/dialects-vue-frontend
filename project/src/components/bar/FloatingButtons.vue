<!-- FloatingButtons.vue - 悬浮按钮组 -->
<template>
  <!-- 认证按钮 -->
  <div
    v-if="userStore.username"
    class="avatar-container"
    :class="authButtonPositionClass"
    @click="goToAuth"
  >
    <NavAvatar />
  </div>
  <div
    v-else
    class="auth-button"
    :class="authButtonPositionClass"
    @click="goToAuth"
  >
    <span class="auth-text">
      {{ t('navigation.login') }}
    </span>
  </div>

  <!-- 右下角功能按钮组 -->
  <div class="floating-buttons">
    <!-- 返回首页按钮 -->
    <button
      class="float-btn menu-btn"
      @click="$emit('toggle-sidebar')"
      :title="t('navigation.actions.openMenu')"

    >
      <img class="logo" src="../../assets/favicon.ico" alt="Logo" />
    </button>

    <!-- 打开侧边栏按钮 - 只在非首页时显示 -->
    <button
      v-if="!isHomePage"
      class="float-btn home-btn"
      @click="goToHome"
      :title="t('navigation.actions.backHome')"
    >
      🏠
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { userStore } from '@/main/store/store.js';
import NavAvatar from '@/components/bar/NavAvatar.vue';

const props = defineProps({
  // 认证按钮位置: 'top-right' | 'bottom-left'
  authButtonPosition: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'bottom-left'].includes(value)
  }
});

const router = useRouter()
const route = useRoute();
const { t } = useI18n();

defineEmits(['toggle-sidebar']);

const authButtonPositionClass = computed(() => {
  return props.authButtonPosition === 'bottom-left' ? 'position-bottom-left' : 'position-top-right';
});

// 判断是否在首页
const isHomePage = computed(() => {
  return route.path === `/${resolveRouteLocale(route)}`;
});

const goToHome = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/'));
};

const goToAuth = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/auth'));
};
</script>


$apple-blue: var(--color-primary-hover);

$desktop-auth-size: 60px;
$desktop-float-size: 60px;
$mobile-auth-size: 50px;
$mobile-float-size: 50px;

$desktop-offset: 20px;
$mobile-offset: 15px;

$transition-base: 0.3s ease;
@mixin floating-glass {
  background: linear-gradient(
    145deg,
    var(--glass-30),
    var(--glass-20)
  );
  border: 3px solid var(--glass-50);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(15px) saturate(150%);
  -webkit-backdrop-filter: blur(15px) saturate(150%);
}

@mixin floating-hover {
  background: linear-gradient(
    145deg,
    var(--glass-50),
    var(--glass-30)
  );
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 认证按钮 */
.auth-button {
  position: fixed;
  z-index: 998;
  min-width: $desktop-auth-size;
  height: 45px;
  padding: 0 10px;
  cursor: pointer;
  user-select: none;
  border-radius: 25px;
  transition: all $transition-base;

  @include flex-center;
  @include floating-glass;

  &.position-top-right {
    top: $desktop-offset;
    right: $desktop-offset;
  }

  &.position-bottom-left {
    bottom: $desktop-offset;
    left: $desktop-offset;
  }

  &:hover {
    transform: scale(1.05) translateY(-2px);

    @include floating-hover;
  }

  &:active {
    transform: scale(1.02);
  }

  @media (max-aspect-ratio: 1/1) {
    min-width: $mobile-auth-size;
    height: 35px;
    padding: 0 10px;
    border-radius: 22px;

    &.position-top-right,
    &.position-bottom-left {
      top: auto;
      right: auto;
      bottom: $mobile-offset;
      left: $mobile-offset;
    }
  }
}

.auth-text {
  max-width: 120px;
  overflow: hidden;
  color: $apple-blue;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-aspect-ratio: 1/1) {
    max-width: 100px;
    font-size: 14px;
  }
}

/* 右下角功能按钮组 */
.floating-buttons {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 998;
  @include flex-col;
  gap: 12px;

  @media (max-aspect-ratio: 1/1) {
    right: 20px;
    bottom: 20px;
    gap: 10px;
  }
}

.float-btn {
  width: $desktop-float-size;
  height: $desktop-float-size;
  padding: 8px;
  font-size: 24px;
  cursor: pointer;
  user-select: none;
  border-radius: var(--radius-full);
  transition: all $transition-base;

  @include flex-center;
  @include floating-glass;

  &:hover {
    transform: scale(1.1) translateY(-2px);

    @include floating-hover;
  }

  &:active {
    transform: scale(1.05);
  }

  @media (max-aspect-ratio: 1/1) {
    width: $mobile-float-size;
    height: $mobile-float-size;
    font-size: 22px;
  }
}

/* Logo 样式 */
.logo {
  width: 85%;
  height: auto;
}

/* 已登录头像按钮 */
.avatar-container {
  position: fixed;
  z-index: 998;
  width: $desktop-auth-size;
  height: $desktop-auth-size;
  cursor: pointer;
  user-select: none;

  @include flex-center;

  &.position-top-right {
    top: $desktop-offset;
    right: $desktop-offset;
  }

  &.position-bottom-left {
    bottom: $desktop-offset;
    left: $desktop-offset;
  }

  @media (max-aspect-ratio: 1/1) {
    width: $mobile-auth-size;
    height: $mobile-auth-size;

    &.position-top-right,
    &.position-bottom-left {
      top: auto;
      right: auto;
      bottom: $mobile-offset;
      left: $mobile-offset;
    }
  }
}

