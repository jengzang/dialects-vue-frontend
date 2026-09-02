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
        class="glass-button auth-benefit-button"
        data-size="compact"
        :title="$t('auth.profile.viewBenefits')"
        @click="$emit('showBenefits')"
      ><InlineIcon icon="🎁" /></button>
    </div>

    <!-- Overview Tab -->
    <div v-if="currentTab === 'overview'">
      <div class="settings-link" @click="$emit('goToSettings')">
        {{ $t('auth.profile.goToSettings') }} →
      </div>
      <!-- User Info Card -->
      <div class="glass-card profile-summary-card">
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
            <div v-if="user.email" class="profile-email"><InlineIcon icon="✉️" />{{ user.email }}</div>
            <div class="user-info-badge" v-html="$t('auth.profile.userNumber', { id: user.id })" />
          </div>
        </div>

        <!-- Info Grid -->
        <div class="info-metrics-grid">
          <div class="metric-item glass-card">
            <div class="metric-icon"><InlineIcon icon="🗓️" /></div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.registerLabel') }}</span>
              <span class="metric-value">{{ fmt(user.created_at) }}</span>
            </div>
          </div>
          <div class="metric-item glass-card">
            <div class="metric-icon"><InlineIcon icon="⏱️" /></div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.onlineLabel') }}</span>
              <span class="metric-value">{{ formatOnlineTime(user.total_online_seconds) }}</span>
            </div>
          </div>
        </div>

        <!-- Custom Row (Always side-by-side, clickable) -->
        <div class="info-custom-row">
          <div class="metric-item glass-card highlightable clickable" data-interactive="true" @click="$emit('goToUserRegions')">
            <div class="metric-icon"><InlineIcon icon="🗂️" /></div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.regionsLabel') }}</span>
              <span class="metric-value count-number">
                {{ $t('auth.profile.customRegionsVal', { count: customRegionCount }) }}
              </span>
            </div>
          </div>
          <div class="metric-item glass-card highlightable clickable" data-interactive="true" @click="$emit('goToUserData')">
            <div class="metric-icon"><InlineIcon icon="📊" /></div>
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
        <ActionButton variant="info" @click="$emit('goToUserData')"><InlineIcon icon="📊" />{{ $t('auth.profile.buttons.userData') }}
        </ActionButton>
        <ActionButton variant="teal" @click="$emit('goToUserRegions')"><InlineIcon icon="🗂️" />{{ $t('auth.profile.buttons.userRegions') }}
        </ActionButton>
        <ActionButton variant="blue" @click="$emit('goToModifyProfile')"><InlineIcon icon="🛠" />{{ $t('auth.profile.buttons.modifyProfile') }}
        </ActionButton>
        <ActionButton variant="danger" @click="$emit('logout')"><InlineIcon icon="🚪" />{{ $t('auth.profile.buttons.logout') }}
        </ActionButton>
        <ActionButton
          v-if="user?.role === 'admin'"
          variant="green"
          @click="$emit('goToAdminPanel')"
        ><InlineIcon icon="🧑‍💻" />{{ $t('auth.profile.buttons.adminPanel') }}
        </ActionButton>
        <ActionButton
          v-if="user?.role === 'admin'"
          variant="yellow"
          @click="$emit('goToTableManager')"
        ><InlineIcon icon="📈" />{{ $t('auth.profile.buttons.tableManager') }}
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
import InlineIcon from '@/components/common/InlineIcon.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ActionButton from './ActionButton.vue'
import TabSwitcher from './TabSwitcher.vue'
import UserAvatarEditor from './UserAvatarEditor.vue'
import LeaderboardPanel from '@/main/components/user/LeaderboardPanel.vue'
import { formatOnlineTime, fmt } from '@/main/utils/userStats.js'
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
  'goToSettings',
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

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

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

.settings-link {
  max-width: 600px;
  margin: 12px auto 6px;
  padding-right: 4px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }

  @media (min-aspect-ratio: 1/1) {
    max-width: 650px;
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

.auth-benefit-button {
  width: 35px;
  height: 35px;
  min-height: 35px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  --glass-button-border-radius: var(--radius-full);
}

.profile-summary-card {
  max-width: 600px;
  margin: 16px auto;
  padding: 20px 24px;
  transition: all $transition-slow $card-easing;
  --glass-card-radius: #{$radius-xl};

  &:hover {
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
  @include flex-col;
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
  transition: all $transition-base $standard-easing;
  --glass-card-radius: 18px;

  &:hover {
    transform: translateY(-2px);
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      --glass-card-background: rgba(var(--color-primary-rgb), 0.04);
    }

    &:active {
      transform: translateY(0) scale(0.97);
    }
  }

  @media (max-width: 576px) {
    gap: 8px;
    padding: 8px 12px;
    --glass-card-radius: #{$radius-md};
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
  @include flex-col;
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
</style>
