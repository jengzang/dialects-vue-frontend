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
          class="glass-button channel-button"
          type="button"
          disabled
        >
          <span>App Store</span>
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
            <button
              class="glass-button channel-button"
              type="button"
              disabled
            >
              <span>GitHub</span>
              <span>{{ t('application.comingSoon') }}</span>
            </button>
            <HelpIcon
              :content="t('application.platforms.android.githubHelp')"
              size="sm"
            />
          </div>
          <div class="channel-group">
            <button
              class="glass-button channel-button"
              type="button"
              disabled
            >
              <span>Gitee</span>
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
import { PhAndroidLogo, PhAppleLogo } from '@phosphor-icons/vue'
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
