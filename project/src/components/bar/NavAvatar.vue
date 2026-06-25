<template>
  <div
    v-if="userStore.username"
    class="nav-avatar"
    :style="avatarStyle"
  >
    {{ avatarConfig.text }}
  </div>
  <span v-else class="login-text-content">
    {{ t('navigation.login') }}
  </span>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { userStore } from '@/main/store/store.js';

const { t } = useI18n();

const getDefaultConfig = () => {
  const username = userStore.username || '';
  const initialText = username ? username.slice(0, 2).toUpperCase() : 'US';
  return {
    text: initialText,
    shape: 'circle',
    bgType: 'solid',
    glass: true,
    bgColor: '#ffffff',
    gradientFrom: '#007aff',
    gradientTo: '#00c6ff',
    gradientAngle: 145,
    textColor: '#005fd3',
    glow: true,
  };
};

const getLocalStorageKey = () => `avatar_config_${userStore.id || 'default'}`;

const avatarConfig = ref(getDefaultConfig());

const loadAvatarConfig = () => {
  if (!userStore.username) return;
  const key = getLocalStorageKey();
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migration for old config structures:
      if (parsed.bgType === 'glass') {
        parsed.bgType = 'solid';
        parsed.glass = true;
      } else if (parsed.bgType === 'liquid_glass') {
        parsed.bgType = 'gradient';
        parsed.glass = true;
      }
      avatarConfig.value = { ...getDefaultConfig(), ...parsed };
      return;
    } catch (e) {
      console.error('Failed to parse avatar config:', e);
    }
  }
  avatarConfig.value = getDefaultConfig();
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const avatarStyle = computed(() => {
  const styles = {
    color: avatarConfig.value.textColor,
    borderRadius:
      avatarConfig.value.shape === 'circle'
        ? '50%'
        : avatarConfig.value.shape === 'blob'
          ? '60% 40% 30% 70% / 60% 30% 70% 40%'
          : '18px',
    fontWeight: '1000',
  };

  const isGlass = avatarConfig.value.glass;

  if (avatarConfig.value.bgType === 'solid') {
    if (isGlass) {
      const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 255, g: 255, b: 255 };
      styles.background = `linear-gradient(145deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1))`;
      if (avatarConfig.value.bgColor === '#ffffff') {
        styles.backdropFilter = 'blur(15px) saturate(150%)';
        styles.webkitBackdropFilter = 'blur(15px) saturate(150%)';
        styles.border = '3px solid rgba(255, 255, 255, 0.4)';
      } else {
        styles.backdropFilter = 'blur(16px) saturate(160%)';
        styles.webkitBackdropFilter = 'blur(16px) saturate(160%)';
        styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
      }
    } else {
      styles.background = avatarConfig.value.bgColor;
      styles.border = '1.5px solid rgba(255, 255, 255, 0.8)';
    }
  } else if (avatarConfig.value.bgType === 'gradient') {
    if (isGlass) {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.55), rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25))`;
      styles.backdropFilter = 'blur(20px) saturate(190%)';
      styles.webkitBackdropFilter = 'blur(20px) saturate(190%)';
      styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
    } else {
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, ${avatarConfig.value.gradientFrom}, ${avatarConfig.value.gradientTo})`;
      styles.border = '1.5px solid rgba(255, 255, 255, 0.8)';
    }
  }

  if (avatarConfig.value.glow) {
    if (avatarConfig.value.bgType === 'solid') {
      if (isGlass) {
        if (avatarConfig.value.bgColor === '#ffffff') {
          styles.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08)';
        } else {
          const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 0, g: 122, b: 255 };
          styles.boxShadow = `0 8px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2), inset 0 0 12px rgba(255, 255, 255, 0.3)`;
        }
      } else {
        const rgb = hexToRgb(avatarConfig.value.bgColor);
        if (rgb) {
          styles.boxShadow = `0 8px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
        } else {
          styles.boxShadow =
            '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
        }
      }
    } else if (avatarConfig.value.bgType === 'gradient') {
      if (isGlass) {
        const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
        const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
        styles.boxShadow = `0 10px 25px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 5px 15px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)`;
      } else {
        const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom);
        const rgbTo = hexToRgb(avatarConfig.value.gradientTo);
        if (rgbFrom && rgbTo) {
          styles.boxShadow = `0 8px 20px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 4px 12px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
        } else {
          styles.boxShadow =
            '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
        }
      }
    }
  } else {
    if (isGlass) {
      if (avatarConfig.value.bgType === 'solid') {
        styles.boxShadow =
          avatarConfig.value.bgColor === '#ffffff'
            ? 'none'
            : 'inset 0 0 12px rgba(255, 255, 255, 0.3)';
      } else if (avatarConfig.value.bgType === 'gradient') {
        styles.boxShadow =
          'inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)';
      }
    } else {
      styles.boxShadow = 'none';
    }
  }

  return styles;
});

// Watch user ID for changes to reload config
watch(() => userStore.id, () => {
  loadAvatarConfig();
}, { immediate: true });

// Listen to custom window events for real-time avatar customization updates
const handleAvatarChanged = (e) => {
  if (!e.detail || e.detail.userId === userStore.id) {
    loadAvatarConfig();
  }
};

onMounted(() => {
  window.addEventListener('avatar-changed', handleAvatarChanged);
  loadAvatarConfig();
});

onUnmounted(() => {
  window.removeEventListener('avatar-changed', handleAvatarChanged);
});
</script>

<style scoped>
.nav-avatar {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2.1dvh;
  font-weight: 1000;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-sizing: border-box;
  text-align: center;
  user-select: none;
  cursor: pointer;
}

.nav-avatar:hover {
  transform: scale(1.08) rotate(2deg);
}

.login-text-content {
  font-weight: 700;
}
</style>
