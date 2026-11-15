<template>
  <main class="application-page">
    <header class="application-identity">
      <img
        class="application-icon"
        :src="appIcon"
        alt=""
      >
      <p class="application-eyebrow">
        {{ t('application.eyebrow') }}
      </p>
      <h1>{{ t('application.title') }}</h1>
      <p class="application-intro">
        {{ t('application.intro') }}
      </p>
    </header>

    <section
      class="platform-list glass-panel"
      :aria-label="t('application.downloadTitle')"
    >
      <!-- <h2 class="list-heading">
        {{ t('application.downloadTitle') }}
      </h2> -->
      <div class="platform-row">
        <div class="platform-details">
          <PhAppleLogo
            class="platform-icon"
            weight="fill"
            aria-hidden="true"
          />
          <h3>{{ t('application.platforms.ios.title') }}</h3>
          <span class="platform-version">v1.0.2</span>
        </div>
        <button
          class="action-btn channel-button"
          type="button"
          disabled
        >
          <span class="channel-label">
            <PhAppStoreLogo
              class="channel-icon channel-icon--appstore"
              weight="fill"
              aria-hidden="true"
            />
            <span>App Store</span>
          </span>
          <span>{{ t('application.comingSoon') }}</span>
        </button>
      </div>
      <div class="platform-row">
        <div class="platform-details">
          <PhAndroidLogo
            class="platform-icon"
            weight="fill"
            aria-hidden="true"
          />
          <h3>{{ t('application.platforms.android.title') }}</h3>
          <span class="platform-version">v5.2.7</span>
        </div>
        <div class="platform-channels">
          <div class="channel-group">
            <a
              class="action-btn channel-button"
              href="https://github.com/jengzang/dialects-vue-frontend/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="channel-label">
                <PhGithubLogo
                  class="channel-icon channel-icon--github"
                  weight="fill"
                  aria-hidden="true"
                />
                <span>GitHub</span>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
            <HelpIcon
              :content="t('application.platforms.android.githubHelp')"
              size="sm"
            />
          </div>
          <div class="channel-group">
            <button
              class="action-btn channel-button"
              type="button"
              disabled
            >
              <span class="channel-label">
                <svg
                  class="channel-icon channel-icon--gitee"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z" />
                </svg>
                <span>Gitee</span>
              </span>
              <span>{{ t('application.comingSoon') }}</span>
            </button>
            <HelpIcon
              :content="t('application.platforms.android.giteeHelp')"
              size="sm"
            />
          </div>
        </div>
      </div>
    </section>
    <p class="application-note">
      {{ t('application.note') }}
    </p>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhAndroidLogo, PhAppleLogo, PhAppStoreLogo, PhGithubLogo } from '@phosphor-icons/vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { currentColorTheme, getBrandAssets } from '@/composables/core/uiPreferences.js'

const { t } = useI18n()
const appIcon = computed(() => getBrandAssets(currentColorTheme.value).logo)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.application-page {
  @include flex-col;
  justify-content: safe center;
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

.application-identity {
  @include flex-col;
  align-items: center;
  text-align: center;
}

.application-icon {
  width: 92px;
  height: 92px;
  object-fit: contain;
}

.application-eyebrow {
  margin: 24px 0 10px;
  color: var(--color-primary);
  font-size: var(--font-size-13);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.application-identity h1 {
  margin: 0;
  font-size: clamp(var(--font-size-32), 3dvw, 48px);
  line-height: 1.2;
  @media (max-aspect-ratio: 1 / 1) {
    font-size: clamp(var(--font-size-28), 5dvw, 36px);
  }
}

.application-intro {
  max-width: 38em;
  margin: 16px 0 0;
  line-height: 1.7;
}

.platform-list {
  margin-top: 48px;
  padding: 28px 32px;
}

.list-heading {
  margin: 0 0 10px;
  font-size: var(--font-size-18);
}

.platform-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 0;
}

.platform-row + .platform-row {
  border-top: 1px solid var(--border-glass-subtle);
}

.platform-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platform-icon {
  color: var(--color-primary);
  flex: none;
  width: 32px;
  height: 32px;
}

.platform-details h3 {
  margin: 0;
  font-size: var(--font-size-20);
}

.platform-version {
  padding: 3px 8px;
  font-size: var(--font-size-14);
  font-weight: 500;
  color: var(--color-primary);
  white-space: nowrap;
}

.platform-channels {
  display: flex;
  gap: 10px;
}

.channel-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.channel-button {
  min-width: 150px;
  justify-content: space-between;
  gap: 16px;
}

.channel-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.channel-icon {
  flex: none;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  padding: 2px;
  color: #fff;
  border-radius: 4px;
}

.channel-icon--appstore {
  background: #0d96f6;
}

.channel-icon--github {
  background: #181717;
}

.channel-icon--gitee {
  background: #c71d23;
}

.application-note {
  margin: 20px 0 0;
  text-align: center;
  font-size: var(--font-size-14);
  line-height: 1.6;
}

@media (max-aspect-ratio: 1 / 1) {
  .application-page { padding: 0 8px; }
  .application-icon { width: 76px; height: 76px; }
  .platform-list { margin-top: 32px; padding: 20px; }
  .platform-row { align-items: stretch; flex-direction: column; gap: 14px; }
  .platform-channels { flex-wrap: wrap; }
  .channel-group { flex: 1; }
  .channel-button { flex: 1; }
}
</style>
