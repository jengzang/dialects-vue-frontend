<template>
  <div class="profile-overview">
    <!-- Welcome Header -->
    <h3 id="login-title">{{ $t('auth.profile.welcome', { username: user.username }) }}</h3>

    <!-- Tab Switcher + Benefits Button -->
    <div class="header-controls">
      <TabSwitcher
        :tabs="tabs"
        :modelValue="currentTab"
        @update:modelValue="$emit('switchTab', $event)"
      />

      <button
        class="benefit-circle-btn"
        @click="$emit('showBenefits')"
        :title="$t('auth.profile.viewBenefits')"
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
          <div class="profile-avatar">
            {{ user.username ? user.username.substring(0, 2).toUpperCase() : '👤' }}
          </div>
          <div class="profile-username">{{ user.username }}</div>
          <div
            class="user-info-badge"
            v-html="$t('auth.profile.userNumber', { id: user.id })"
          ></div>
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
          <div class="metric-item highlightable">
            <div class="metric-icon">🗂️</div>
            <div class="metric-content">
              <span class="metric-label">{{ $t('auth.profile.regionsLabel') }}</span>
              <span class="metric-value count-number">
                {{ $t('auth.profile.customRegionsVal', { count: customRegionCount }) }}
              </span>
            </div>
          </div>
          <div class="metric-item highlightable">
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

      <!-- Statistics Card -->
      <!-- <div class="stats-card">
        <div class="stats-card-header">
          <help-icon
            :content="$t('auth.profile.queryStatsNote')"
            size="md"
            fontSize="16px"
            iconColor="#c7254e"
            trigger="both"
          />
          📊 {{ $t('auth.profile.queryStats') }}
          <button class="stats-toggle-btn" @click="$emit('toggleStats')">
            {{ statsExpanded ? $t('auth.profile.collapse') : $t('auth.profile.expand') }}
            <span class="stats-toggle-icon">{{ statsExpanded ? '▲' : '▼' }}</span>
          </button>
        </div>

        <div class="stats-total">
          {{ $t('auth.profile.totalQueries') }}
          <span class="stats-total-number">{{ queryStats.total }}</span>
        </div>

        <div v-show="statsExpanded" class="stats-categories">
          <div
            v-for="category in queryStats.categories"
            :key="category.name"
            class="stat-category"
          >
            <div class="stat-category-header">
              <span class="stat-category-icon">{{ category.icon }}</span>
              <span class="stat-category-name">{{ category.name }}</span>
              <span class="stat-category-total">{{ category.total }}</span>
            </div>
            <div class="stat-category-items">
              <div
                v-for="item in category.items"
                :key="item.label"
                class="stat-item"
              >
                <div class="stat-item-label">{{ item.label }}</div>
                <div class="stat-item-count">{{ item.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div> -->

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
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ActionButton from './ActionButton.vue';
import TabSwitcher from './TabSwitcher.vue';
import LeaderboardPanel from '@/main/components/user/LeaderboardPanel.vue';
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue';
import { formatOnlineTime, fmt } from '@/main/store/userStats.js';
import { getCustomCounts } from '@/api';

const { t } = useI18n();

const customRegionCount = ref(0);
const customDataCount = ref(0);

onMounted(async () => {
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

defineProps({
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
</script>

<style scoped>
.profile-overview {
  text-align: center;
}

#login-title {
  font-size: 30px;
  font-weight: 600;
  margin: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

#login-title:hover {
  color: #007aff;
  text-shadow: 0 0 8px rgba(0, 122, 255, 0.6);
  transform: scale(1.05);
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
}

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
}

.stats-toggle-btn:hover {
  background: rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.5);
  transform: translateY(-1px);
}

.stats-toggle-icon {
  font-size: 10px;
  transition: transform 0.3s ease;
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
}

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

.stats-categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

@media (orientation: portrait), (max-width: 768px) {
  .stats-categories {
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
}

.stat-category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

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
}

@media (max-aspect-ratio: 1/1) {
  .stat-item {
    flex: 0 0 90px;
  }
}

.stat-item:hover {
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
}

.benefit-circle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.15);
  border-color: rgba(255, 149, 0, 0.3);
}

.benefit-circle-btn:active {
  transform: translateY(0) scale(0.96);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
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
  }

  .stat-category-name {
    font-size: 14px;
  }

  .stat-category-total {
    font-size: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }
}

/* User Profile Card - Premium Glassmorphism */
.user-profile-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  padding: 30px 24px;
  margin: 20px auto;
  max-width: 600px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  border: 0.5px solid rgba(255, 255, 255, 0.5);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.user-profile-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 20px 48px rgba(0, 122, 255, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 122, 255, 0.15);
}

.profile-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #007aff, #00c6ff);
  box-shadow:
    0 8px 20px rgba(0, 122, 255, 0.25),
    inset 0 0 12px rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.profile-avatar-wrapper:hover .profile-avatar {
  transform: scale(1.08) rotate(5deg);
  box-shadow: 0 12px 24px rgba(0, 122, 255, 0.35);
}

.profile-username {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

/* Info Metrics Grid */
.info-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 576px) {
  .info-metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.85);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 18px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.metric-item:hover {
  transform: translateY(-2px);
  background: white;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1.5px rgba(0, 122, 255, 0.2);
  border-color: rgba(0, 122, 255, 0.3);
}

.metric-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
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
}

.metric-value {
  font-size: 15px;
  color: #1d1d1f;
  font-weight: 700;
  margin-top: 3px;
  letter-spacing: -0.01em;
}

.metric-value.count-number {
  color: #007aff;
}
</style>
