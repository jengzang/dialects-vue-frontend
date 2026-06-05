<template>
  <div class="profile-overview">
    <!-- Welcome Header -->
    <!-- <h3 id="login-title">{{ $t('auth.profile.welcome', { username: user.username }) }}</h3> -->

    <!-- Tab Switcher + Benefits Button -->
    <div class="header-controls">
      <TabSwitcher
        :tabs="tabs"
        :model-value="currentTab"
        @update:model-value="$emit('switchTab', $event)"
      />

      <button
        class="benefit-circle-btn"
        :title="$t('auth.profile.viewBenefits')"
        @click="$emit('showBenefits')"
      >
        🎁
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="currentTab === 'overview'">
      <!-- User Info Card -->
      <div class="user-profile-card">
        <!-- Avatar Header -->
        <div class="profile-avatar-wrapper">
          <div
            class="profile-avatar clickable-avatar"
            :style="avatarStyle"
            @click="isModalOpen = true"
          >
            {{ avatarConfig.text }}
            <div class="avatar-edit-overlay">
              <span class="edit-overlay-text">{{ $t('auth.profile.avatar.editOverlay') }}</span>
            </div>
          </div>
          <div class="profile-user-meta">
            <div class="profile-username">
              {{ user.username }}
            </div>
            <div
              v-if="user.email"
              class="profile-email"
            >
              ✉️ {{ user.email }}
            </div>
            <div
              class="user-info-badge"
              v-html="$t('auth.profile.userNumber', { id: user.id })"
            />
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-metrics-grid">
          <div class="metric-item">
            <div class="metric-icon">
              🗓️
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.registerLabel') }}</span>
              <span class="metric-value">{{ fmt(user.created_at) }}</span>
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-icon">
              ⏱️
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.onlineLabel') }}</span>
              <span class="metric-value">{{ formatOnlineTime(user.total_online_seconds) }}</span>
            </div>
          </div>
        </div>

        <!-- Custom Row (Always side-by-side, clickable) -->
        <div class="info-custom-row">
          <div
            class="metric-item highlightable clickable"
            @click="$emit('goToUserRegions')"
          >
            <div class="metric-icon">
              🗂️
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.regionsLabel') }}</span>
              <span class="metric-value count-number">
                {{ $t('auth.profile.customRegionsVal', { count: customRegionCount }) }}
              </span>
            </div>
          </div>
          <div
            class="metric-item highlightable clickable"
            @click="$emit('goToUserData')"
          >
            <div class="metric-icon">
              📊
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.dataLabel') }}</span>
              <span class="metric-value count-number">
                {{ $t('auth.profile.customDataVal', { count: customDataCount }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <ActionButton
          variant="info"
          @click="$emit('goToUserData')"
        >
          📊 {{ $t('auth.profile.buttons.userData') }}
        </ActionButton>
        <ActionButton
          variant="teal"
          @click="$emit('goToUserRegions')"
        >
          🗂️ {{ $t('auth.profile.buttons.userRegions') }}
        </ActionButton>
        <ActionButton
          variant="blue"
          @click="$emit('goToModifyProfile')"
        >
          🛠 {{ $t('auth.profile.buttons.modifyProfile') }}
        </ActionButton>
        <ActionButton
          variant="danger"
          @click="$emit('logout')"
        >
          🚪 {{ $t('auth.profile.buttons.logout') }}
        </ActionButton>
        <ActionButton
          v-if="user?.role === 'admin'"
          variant="green"
          @click="$emit('goToAdminPanel')"
        >
          🧑‍💻 {{ $t('auth.profile.buttons.adminPanel') }}
        </ActionButton>
        <ActionButton
          v-if="user?.role === 'admin'"
          variant="yellow"
          @click="$emit('goToTableManager')"
        >
          📈 {{ $t('auth.profile.buttons.tableManager') }}
        </ActionButton>
      </div>
    </div>

    <!-- Leaderboard Tab -->
    <div v-if="currentTab === 'leaderboard'">
      <LeaderboardPanel />
    </div>

    <!-- Avatar Customization Modal -->
    <AvatarCustomizerModal
      v-model="isModalOpen"
      :user="user"
      @saved="loadAvatarConfig"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ActionButton from './ActionButton.vue';
import TabSwitcher from './TabSwitcher.vue';
import LeaderboardPanel from '@/main/components/user/LeaderboardPanel.vue';
import AvatarCustomizerModal from './AvatarCustomizerModal.vue';
import { formatOnlineTime, fmt } from '@/main/store/userStats.js';
import { getCustomCounts } from '@/api';

const { t } = useI18n();

const customRegionCount = ref(0);
const customDataCount = ref(0);

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  queryStats: {
    type: Object,
    required: true,
  },
  statsExpanded: {
    type: Boolean,
    default: false,
  },
  currentTab: {
    type: String,
    default: 'overview',
  },
});

defineEmits([
  'goToUserData',
  'goToUserRegions',
  'goToModifyProfile',
  'logout',
  'goToAdminPanel',
  'goToTableManager',
  'toggleStats',
  'switchTab',
  'showBenefits',
]);

const tabs = computed(() => [
  { label: '📊 ' + t('auth.profile.tabs.info'), value: 'overview' },
  { label: '🏆 ' + t('auth.profile.tabs.ranking'), value: 'leaderboard' },
]);

// --- Avatar Display Logic (parent) ---
const isModalOpen = ref(false);

const getDefaultConfig = () => {
  const username = props.user?.username || '';
  const initialText = username ? username.slice(0, 2).toUpperCase() : 'US';
  return {
    text: initialText,
    shape: 'circle',
    bgType: 'glass',
    bgColor: '#ffffff',
    gradientFrom: '#007aff',
    gradientTo: '#00c6ff',
    gradientAngle: 145,
    textColor: '#005fd3',
    glow: true,
  };
};

const getLocalStorageKey = () => `avatar_config_${props.user?.id || 'default'}`;

const avatarConfig = ref({
  text: '',
  shape: 'circle',
  bgType: 'glass',
  bgColor: '#ffffff',
  gradientFrom: '#007aff',
  gradientTo: '#00c6ff',
  gradientAngle: 145,
  textColor: '#005fd3',
  glow: true,
});

const loadAvatarConfig = () => {
  const key = getLocalStorageKey();
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
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
    borderRadius: avatarConfig.value.shape === 'circle' ? '50%' : '18px',
    fontWeight: '1000',
  };

  if (avatarConfig.value.bgType === 'solid') {
    styles.background = avatarConfig.value.bgColor;
  } else if (avatarConfig.value.bgType === 'gradient') {
    styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, ${avatarConfig.value.gradientFrom}, ${avatarConfig.value.gradientTo})`;
  } else if (avatarConfig.value.bgType === 'glass') {
    const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 255, g: 255, b: 255 };
    if (avatarConfig.value.bgColor === '#ffffff') {
      // Exact style match to top-right logo-container
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))`;
      styles.backdropFilter = 'blur(15px) saturate(150%)';
      styles.webkitBackdropFilter = 'blur(15px) saturate(150%)';
      styles.border = '3px solid rgba(255, 255, 255, 0.4)';
    } else {
      // Custom colored frosted glass tint
      styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15))`;
      styles.backdropFilter = 'blur(16px) saturate(160%)';
      styles.webkitBackdropFilter = 'blur(16px) saturate(160%)';
      styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
    }
  } else if (avatarConfig.value.bgType === 'liquid_glass') {
    const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
    const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
    styles.background = `linear-gradient(${avatarConfig.value.gradientAngle}deg, rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.55), rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25))`;
    styles.backdropFilter = 'blur(20px) saturate(190%)';
    styles.webkitBackdropFilter = 'blur(20px) saturate(190%)';
    styles.border = '2.5px solid rgba(255, 255, 255, 0.5)';
  }

  if (avatarConfig.value.glow) {
    if (avatarConfig.value.bgType === 'solid') {
      const rgb = hexToRgb(avatarConfig.value.bgColor);
      if (rgb) {
        styles.boxShadow = `0 8px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
      } else {
        styles.boxShadow =
          '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
      }
    } else if (avatarConfig.value.bgType === 'gradient') {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom);
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo);
      if (rgbFrom && rgbTo) {
        styles.boxShadow = `0 8px 20px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 4px 12px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 0 8px rgba(255, 255, 255, 0.2)`;
      } else {
        styles.boxShadow =
          '0 8px 20px rgba(0, 122, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.2)';
      }
    } else if (avatarConfig.value.bgType === 'glass') {
      if (avatarConfig.value.bgColor === '#ffffff') {
        styles.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08)';
      } else {
        const rgb = hexToRgb(avatarConfig.value.bgColor) || { r: 0, g: 122, b: 255 };
        styles.boxShadow = `0 8px 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25), inset 0 0 12px rgba(255, 255, 255, 0.3)`;
      }
    } else if (avatarConfig.value.bgType === 'liquid_glass') {
      const rgbFrom = hexToRgb(avatarConfig.value.gradientFrom) || { r: 0, g: 122, b: 255 };
      const rgbTo = hexToRgb(avatarConfig.value.gradientTo) || { r: 0, g: 198, b: 255 };
      styles.boxShadow = `0 10px 25px rgba(${rgbFrom.r}, ${rgbFrom.g}, ${rgbFrom.b}, 0.25), 0 5px 15px rgba(${rgbTo.r}, ${rgbTo.g}, ${rgbTo.b}, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)`;
    }
  } else {
    if (avatarConfig.value.bgType === 'glass') {
      styles.boxShadow = avatarConfig.value.bgColor === '#ffffff' ? 'none' : 'inset 0 0 12px rgba(255, 255, 255, 0.3)';
    } else if (avatarConfig.value.bgType === 'liquid_glass') {
      styles.boxShadow = 'inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.08)';
    } else {
      styles.boxShadow = 'none';
    }
  }

  return styles;
});

watch(
  () => props.user?.id,
  () => {
    loadAvatarConfig();
  }
);

onMounted(async () => {
  loadAvatarConfig();
  try {
    const res = await getCustomCounts();
    if (res && res.success) {
      customRegionCount.value = res.custom_region_total;
      customDataCount.value = res.custom_data_total;
    }
  } catch (err) {
    console.error('Failed to load custom counts:', err);
  }
});
</script>

<style scoped lang="scss">
.profile-overview {
  text-align: center;
}

#login-title {
  font-size: 30px;
  font-weight: 600;
  margin: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    color: #007aff;
    text-shadow: 0 0 8px rgba(0, 122, 255, 0.6);
    transform: scale(1.05);
  }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.profile-user-info {
  margin: 10px auto;
  max-width: 600px;
  text-align: center;
}

.user-info-badge {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.user-number {
  color: #007aff;
  font-weight: 700;
  font-size: 20px;
  padding: 0 4px;
}

.user-info-details {
  font-size: 15px;
  color: #707077;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

/* Statistics Card - Apple Liquid Glass Style */
.stats-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 24px;
  padding: 16px 28px;
  margin: 20px auto;
  max-width: 1000px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  border: 0.5px solid rgba(255, 255, 255, 0.8);

  .stats-card-header {
    font-size: 22px;
    font-weight: 700;
    color: #1d1d1f;
    margin-bottom: 20px;
    text-align: center;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .stats-toggle-btn {
    background: rgba(0, 122, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(0, 122, 255, 0.3);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #007aff;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
      background: rgba(0, 122, 255, 0.15);
      border-color: rgba(0, 122, 255, 0.5);
      transform: translateY(-1px);
    }

    .stats-toggle-icon {
      font-size: 10px;
      transition: transform 0.3s ease;
    }
  }

  .stats-total {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: #007aff;
    padding: 15px;
    margin-bottom: 8px;
    border-radius: 16px;
    text-align: center;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    box-shadow:
      0 2px 8px rgba(0, 122, 255, 0.12),
      inset 0 0 0 1px rgba(0, 122, 255, 0.2);
    border: 0.5px solid rgba(0, 122, 255, 0.3);

    .stats-total-number {
      font-size: 42px;
      font-weight: 700;
      display: block;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #007aff, #0051d5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .stats-categories {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 20px;

    @media (orientation: portrait), (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .stat-category {
    background: rgba(247, 247, 247, 0.5);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 12px;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    border: 0.5px solid rgba(255, 255, 255, 0.5);

    .stat-category-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);

      .stat-category-icon {
        font-size: 20px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }

      .stat-category-name {
        font-size: 16px;
        font-weight: 600;
        color: #1d1d1f;
        letter-spacing: -0.01em;
        flex: 1;
      }

      .stat-category-total {
        font-size: 18px;
        font-weight: 700;
        color: #007aff;
        letter-spacing: -0.02em;
        background: rgba(0, 122, 255, 0.08);
        padding: 4px 12px;
        border-radius: 8px;
      }
    }

    .stat-category-items {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 12px;
      padding: 8px 12px;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
      box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04),
        inset 0 0 0 1px rgba(255, 255, 255, 0.8);
      border: 0.5px solid rgba(255, 255, 255, 0.6);
      flex: 0 0 80px;

      @media (max-aspect-ratio: 1/1) {
        flex: 0 0 90px;
      }

      &:hover {
        transform: translateY(-2px) scale(1.03);
        background: rgba(255, 255, 255, 0.9);
        box-shadow:
          0 4px 12px rgba(0, 122, 255, 0.15),
          inset 0 0 0 1.5px rgba(0, 122, 255, 0.4);
        border-color: rgba(0, 122, 255, 0.5);
      }

      .stat-item-label {
        font-size: 12px;
        color: #86868b;
        margin-bottom: 8px;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      .stat-item-count {
        font-size: 22px;
        font-weight: 700;
        color: #007aff;
        letter-spacing: -0.02em;
      }
    }
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.benefit-circle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  padding: 0;
  border-radius: 50%;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 149, 0, 0.15);
    border-color: rgba(255, 149, 0, 0.3);
  }

  &:active {
    transform: translateY(0) scale(0.96);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }
}

/* User Profile Card - Premium Glassmorphism */
.user-profile-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  padding: 20px 24px;
  margin: 16px auto;
  max-width: 600px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  border: 0.5px solid rgba(255, 255, 255, 0.5);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 20px 48px rgba(0, 122, 255, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 122, 255, 0.15);
  }

  @media (min-aspect-ratio: 1/1) {
    padding: 24px 30px;
    margin: 24px auto;
    max-width: 650px;
  }
}

.profile-avatar-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: center;

  &:hover {
    .profile-avatar {
      transform: scale(1.06) rotate(3deg);
      box-shadow: 0 8px 18px rgba(0, 122, 255, 0.3);
    }
  }

  @media (min-aspect-ratio: 1/1) {
    margin-bottom: 24px;
  }
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #007aff, #00c6ff);
  box-shadow:
    0 6px 16px rgba(0, 122, 255, 0.2),
    inset 0 0 8px rgba(255, 255, 255, 0.2);
  border: 1.5px solid white;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-aspect-ratio: 1/1) {
    width: 72px;
    height: 72px;
    font-size: 24px;
  }
}

.profile-user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;

  .user-info-badge {
    font-size: 13px;
    font-weight: 600;
    color: #86868b;
    margin-bottom: 0px;
    letter-spacing: -0.01em;

    :deep(.user-number) {
      font-size: 14px;

      @media (min-aspect-ratio: 1/1) {
        font-size: 15.5px;
      }
    }

    @media (min-aspect-ratio: 1/1) {
      font-size: 14px;
    }
  }
}

.profile-username {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 2px;
  letter-spacing: -0.02em;

  @media (min-aspect-ratio: 1/1) {
    font-size: 22px;
    margin-bottom: 4px;
  }
}

.profile-email {
  font-size: 13.5px;
  color: #707077;
  font-weight: 500;
  margin-bottom: 3px;
  letter-spacing: -0.01em;

  @media (min-aspect-ratio: 1/1) {
    font-size: 14.5px;
    margin-bottom: 4px;
  }
}

/* Info Metrics Grid */
.info-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  @media (min-aspect-ratio: 1/1) {
    gap: 16px;
  }
}

.info-custom-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;

  @media (max-width: 576px) {
    gap: 8px;
    margin-top: 8px;
  }

  @media (min-aspect-ratio: 1/1) {
    gap: 16px;
    margin-top: 16px;
  }
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 18px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);

  &:hover {
    transform: translateY(-2px);
    background: white;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.05),
      inset 0 0 0 1.5px rgba(0, 122, 255, 0.2);
    border-color: rgba(0, 122, 255, 0.3);
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      background: rgba(0, 122, 255, 0.04);
      border-color: rgba(0, 122, 255, 0.4);
      box-shadow:
        0 8px 24px rgba(0, 122, 255, 0.08),
        inset 0 0 0 1.5px rgba(0, 122, 255, 0.25);
    }

    &:active {
      transform: translateY(0) scale(0.97);
    }
  }

  @media (max-width: 576px) {
    padding: 8px 12px;
    gap: 8px;
    border-radius: 12px;
  }

  @media (min-aspect-ratio: 1/1) {
    padding: 14px 20px;
    gap: 14px;
  }
}

.metric-icon {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));

  @media (max-width: 576px) {
    font-size: 20px;
  }

  @media (min-aspect-ratio: 1/1) {
    font-size: 24px;
  }
}

.metric-content {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.metric-label {
  font-size: 11px;
  color: #86868b;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-transform: uppercase;

  @media (max-width: 576px) {
    font-size: 10px;
  }

  @media (min-aspect-ratio: 1/1) {
    font-size: 12px;
  }
}

.metric-value {
  font-size: 14px;
  color: #1d1d1f;
  font-weight: 700;
  margin-top: 3px;
  letter-spacing: -0.01em;

  &.count-number {
    color: #007aff;
  }

  @media (max-width: 576px) {
    font-size: 13px;
    margin-top: 1px;
  }

  @media (min-aspect-ratio: 1/1) {
    font-size: 15px;
  }
}

/* --- Avatar Customizer Styles --- */
.clickable-avatar {
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;

  &:hover {
    transform: scale(1.08) rotate(2deg) !important;

    .avatar-edit-overlay {
      opacity: 1;

      .edit-overlay-text {
        transform: translateY(0);
      }
    }
  }

  &:active {
    transform: scale(0.96) !important;
  }

  .avatar-edit-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    .edit-overlay-text {
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      transform: translateY(4px);
      transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
  }
}

/* Mobile responsive */
@media (max-aspect-ratio: 1/1) {
  #login-title {
    font-size: 28px !important;
  }

  .user-info-badge {
    font-size: 16px;
  }

  .user-number {
    font-size: 18px;
  }

  .user-info-details {
    font-size: 14px;
  }

  .stats-card {
    padding: 12px 20px !important;
  }

  .stat-category-items {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-category-header {
    font-size: 14px;

    .stat-category-name {
      font-size: 14px;
    }

    .stat-category-total {
      font-size: 16px;
    }
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
