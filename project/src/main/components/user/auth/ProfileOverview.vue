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
          <UserAvatarEditor
            class="profile-avatar-editor"
            :user="user"
          />

          <div class="profile-user-meta">
            <div class="profile-username">
              {{ user.username }}
            </div>
            <div v-if="user.email" class="profile-email">✉️ {{ user.email }}</div>
            <div class="user-info-badge" v-html="$t('auth.profile.userNumber', { id: user.id })" />
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-metrics-grid">
          <div class="metric-item">
            <div class="metric-icon">🗓️</div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.registerLabel') }}</span>
              <span class="metric-value">{{ fmt(user.created_at) }}</span>
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-icon">⏱️</div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.onlineLabel') }}</span>
              <span class="metric-value">{{ formatOnlineTime(user.total_online_seconds) }}</span>
            </div>
          </div>
        </div>

        <!-- Custom Row (Always side-by-side, clickable) -->
        <div class="info-custom-row">
          <div class="metric-item highlightable clickable" @click="$emit('goToUserRegions')">
            <div class="metric-icon">🗂️</div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.regionsLabel') }}</span>
              <span class="metric-value count-number">
                {{ $t('auth.profile.customRegionsVal', { count: customRegionCount }) }}
              </span>
            </div>
          </div>
          <div class="metric-item highlightable clickable" @click="$emit('goToUserData')">
            <div class="metric-icon">📊</div>
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
        <ActionButton variant="info" @click="$emit('goToUserData')">
          📊 {{ $t('auth.profile.buttons.userData') }}
        </ActionButton>
        <ActionButton variant="teal" @click="$emit('goToUserRegions')">
          🗂️ {{ $t('auth.profile.buttons.userRegions') }}
        </ActionButton>
        <ActionButton variant="blue" @click="$emit('goToModifyProfile')">
          🛠 {{ $t('auth.profile.buttons.modifyProfile') }}
        </ActionButton>
        <ActionButton variant="danger" @click="$emit('logout')">
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ActionButton from './ActionButton.vue'
import TabSwitcher from './TabSwitcher.vue'
import UserAvatarEditor from './UserAvatarEditor.vue'
import LeaderboardPanel from '@/main/components/user/LeaderboardPanel.vue'
import { formatOnlineTime, fmt } from '@/main/store/userStats.js'
import { getCustomCounts } from '@/api'

const { t } = useI18n()

const customRegionCount = ref(0)
const customDataCount = ref(0)

defineProps({
  user: {
    type: Object,
    required: true
  },
  queryStats: {
    type: Object,
    required: true
  },
  statsExpanded: {
    type: Boolean,
    default: false
  },
  currentTab: {
    type: String,
    default: 'overview'
  }
})

defineEmits([
  'goToUserData',
  'goToUserRegions',
  'goToModifyProfile',
  'logout',
  'goToAdminPanel',
  'goToTableManager',
  'toggleStats',
  'switchTab',
  'showBenefits'
])

const tabs = computed(() => [
  { label: '📊 ' + t('auth.profile.tabs.info'), value: 'overview' },
  { label: '🏆 ' + t('auth.profile.tabs.ranking'), value: 'leaderboard' }
])

onMounted(async () => {
  try {
    const res = await getCustomCounts()
    if (res && res.success) {
      customRegionCount.value = res.custom_region_total
      customDataCount.value = res.custom_data_total
    }
  } catch (err) {
    console.error('Failed to load custom counts:', err)
  }
})
</script>


$primary-blue: var(--color-primary);
$primary-blue-dark: var(--color-primary-hover);
$text-primary: var(--text-primary);
$text-secondary: var(--text-secondary);
$text-muted: var(--text-secondary);
$white: var(--text-white);

$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 24px;

$transition-fast: 0.2s;
$transition-base: 0.3s;
$transition-slow: 0.4s;
$standard-easing: cubic-bezier(0.25, 0.8, 0.25, 1);
$smooth-easing: cubic-bezier(0.4, 0, 0.2, 1);
$card-easing: cubic-bezier(0.16, 1, 0.3, 1);.profile-overview {
  text-align: center;
}

/*
 * 当前模板中的标题已注释。
 * 保留选择器，避免删除未来可能恢复使用的样式。
 */
#login-title {
  margin: 12px;
  font-size: 30px;
  font-weight: 600;
  white-space: nowrap;
  transition: all $transition-base ease;

  &:hover {
    color: $primary-blue;
    text-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.6);
    transform: scale(1.05);
  }

  @media (max-aspect-ratio: 1/1) {
    font-size: 28px !important;
  }
}

.header-controls {
  @include flex-center;

  flex-wrap: wrap;
  gap: 12px;
}

.profile-user-info {
  max-width: 600px;
  margin: 10px auto;
  text-align: center;
}

.user-info-badge {
  margin-bottom: 8px;
  color: $text-primary;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;

  @media (max-aspect-ratio: 1/1) {
    font-size: 16px;
  }
}

.user-number {
  padding: 0 4px;
  color: $primary-blue;
  font-size: 20px;
  font-weight: 700;

  @media (max-aspect-ratio: 1/1) {
    font-size: 18px;
  }
}

.user-info-details {
  color: $text-secondary;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.01em;

  @media (max-aspect-ratio: 1/1) {
    font-size: 14px;
  }
}

/* Statistics Card - Apple Liquid Glass Style */
.stats-card {
  max-width: 1000px;
  margin: 20px auto;
  padding: 16px 28px;
  background: var(--glass-70);
  border: 0.5px solid var(--glass-80);
  border-radius: $radius-xl;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px var(--glass-90);

  @include glass-blur(40px, 180%);

  .stats-card-header {
    @include flex-center;

    gap: 12px;
    margin-bottom: 20px;
    color: $text-primary;
    font-size: 22px;
    font-weight: 700;
    text-align: center;
    letter-spacing: -0.02em;
  }

  .stats-toggle-btn {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    color: $primary-blue;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background: rgba(var(--color-primary-rgb), 0.1);
    border: 0.5px solid rgba(var(--color-primary-rgb), 0.3);
    border-radius: $radius-sm;
    transition: all $transition-base $smooth-easing;

    @include glass-blur(10px);

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.15);
      border-color: rgba(var(--color-primary-rgb), 0.5);
      transform: translateY(-1px);
    }

    .stats-toggle-icon {
      font-size: 10px;
      transition: transform $transition-base ease;
    }
  }

  .stats-total {
    margin-bottom: 8px;
    padding: 15px;
    color: $primary-blue;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
    letter-spacing: -0.01em;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1),
      rgba(var(--color-primary-rgb), 0.05)
    );
    border: 0.5px solid rgba(var(--color-primary-rgb), 0.3);
    border-radius: $radius-lg;
    box-shadow:
      0 2px 8px rgba(var(--color-primary-rgb), 0.12),
      inset 0 0 0 1px rgba(var(--color-primary-rgb), 0.2);

    @include glass-blur(20px);

    .stats-total-number {
      display: block;
      color: transparent;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, $primary-blue, $primary-blue-dark);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
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
    padding: 12px;
    background: rgba(247, 247, 247, 0.5);
    border: 0.5px solid var(--glass-50);
    border-radius: $radius-lg;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      inset 0 0 0 1px var(--glass-60);

    @include glass-blur(20px);

    .stat-category-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);

      .stat-category-icon {
        font-size: 20px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }

      .stat-category-name {
        flex: 1;
        color: $text-primary;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .stat-category-total {
        padding: 4px 12px;
        color: $primary-blue;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.02em;
        background: rgba(var(--color-primary-rgb), 0.08);
        border-radius: $radius-sm;
      }

      @media (max-aspect-ratio: 1/1) {
        font-size: 14px;

        .stat-category-name {
          font-size: 14px;
        }

        .stat-category-total {
          font-size: 16px;
        }
      }
    }

    .stat-category-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;

      @media (max-aspect-ratio: 1/1) {
        grid-template-columns: 1fr;
      }
    }

    .stat-item {
      flex: 0 0 80px;
      padding: 8px 12px;
      text-align: center;
      cursor: default;
      background: var(--glass-70);
      border: 0.5px solid var(--glass-60);
      border-radius: $radius-md;
      box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04),
        inset 0 0 0 1px var(--glass-80);
      transition: all $transition-base $smooth-easing;

      @include glass-blur(20px, 180%);

      &:hover {
        background: var(--glass-90);
        border-color: rgba(var(--color-primary-rgb), 0.5);
        box-shadow:
          0 4px 12px rgba(var(--color-primary-rgb), 0.15),
          inset 0 0 0 1.5px rgba(var(--color-primary-rgb), 0.4);
        transform: translateY(-2px) scale(1.03);
      }

      .stat-item-label {
        margin-bottom: 8px;
        color: $text-muted;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      .stat-item-count {
        color: $primary-blue;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      @media (max-aspect-ratio: 1/1) {
        flex: 0 0 90px;
        padding: 12px;
      }
    }
  }

  @media (max-aspect-ratio: 1/1) {
    padding: 12px 20px !important;
  }
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 500px;
  margin: 16px auto 0;

  /*
   * 原样式在移动端设置 flex-direction，
   * 但该容器仍为 grid。保留该声明以维持现有行为。
   */
  @media (max-aspect-ratio: 1/1) {
    flex-direction: column;
  }
}

.benefit-circle-btn {
  @include flex-center;

  width: 35px;
  height: 35px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  background-color: $white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all $transition-fast $standard-easing;

  &:hover {
    border-color: rgba(var(--color-warning-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--color-warning-rgb), 0.15);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    transform: translateY(0) scale(0.96);
  }
}

/* User Profile Card - Premium Glassmorphism */
.user-profile-card {
  max-width: 600px;
  margin: 16px auto;
  padding: 20px 24px;
  background: var(--glass-70);
  border: 0.5px solid var(--glass-50);
  border-radius: $radius-xl;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px var(--glass-70);
  transition: all $transition-slow $card-easing;

  @include glass-blur(20px, 180%);

  &:hover {
    border-color: rgba(var(--color-primary-rgb), 0.15);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 20px 48px rgba(var(--color-primary-rgb), 0.08),
      inset 0 0 0 1px var(--glass-90);
    transform: translateY(-2px);
  }

  @media (min-aspect-ratio: 1/1) {
    max-width: 650px;
    margin: 24px auto;
    padding: 24px 30px;
  }
}

.profile-avatar-wrapper {
  @include flex-center;

  flex-direction: row;
  gap: 20px;
  margin-bottom: 20px;

  &:hover {
    :deep(.profile-avatar) {
      box-shadow: 0 8px 18px rgba(var(--color-primary-rgb), 0.3);
      transform: scale(1.06) rotate(3deg);
    }
  }

  @media (min-aspect-ratio: 1/1) {
    margin-bottom: 24px;
  }
}

.profile-avatar-editor {
  flex-shrink: 0;
}

.profile-user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  white-space: nowrap;

  .user-info-badge {
    margin-bottom: 0;
    color: $text-muted;
    font-size: 13px;
    font-weight: 600;
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
  margin-bottom: 2px;
  color: $text-primary;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;

  @media (min-aspect-ratio: 1/1) {
    margin-bottom: 4px;
    font-size: 22px;
  }
}

.profile-email {
  margin-bottom: 3px;
  color: $text-secondary;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.01em;

  @media (min-aspect-ratio: 1/1) {
    margin-bottom: 4px;
    font-size: 14.5px;
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
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: var(--glass-90);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 18px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px var(--glass-90);
  transition: all $transition-base $standard-easing;

  &:hover {
    background: $white;
    border-color: rgba(var(--color-primary-rgb), 0.3);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.05),
      inset 0 0 0 1.5px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-2px);
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.04);
      border-color: rgba(var(--color-primary-rgb), 0.4);
      box-shadow:
        0 8px 24px rgba(var(--color-primary-rgb), 0.08),
        inset 0 0 0 1.5px rgba(var(--color-primary-rgb), 0.25);
    }

    &:active {
      transform: translateY(0) scale(0.97);
    }
  }

  @media (max-width: 576px) {
    gap: 8px;
    padding: 8px 12px;
    border-radius: $radius-md;
  }

  @media (min-aspect-ratio: 1/1) {
    gap: 14px;
    padding: 14px 20px;
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
  color: $text-muted;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: -0.01em;

  @media (max-width: 576px) {
    font-size: 10px;
  }

  @media (min-aspect-ratio: 1/1) {
    font-size: 12px;
  }
}

.metric-value {
  margin-top: 3px;
  color: $text-primary;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;

  &.count-number {
    color: $primary-blue;
  }

  @media (max-width: 576px) {
    margin-top: 1px;
    font-size: 13px;
  }

  @media (min-aspect-ratio: 1/1) {
    font-size: 15px;
  }
}
