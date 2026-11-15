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
      <h2 class="list-heading">
        {{ t('application.downloadTitle') }}
      </h2>
      <div class="platform-row">
        <div class="platform-details">
          <p class="platform-label">
            iOS / iPadOS
          </p>
          <h3>{{ t('application.platforms.ios.title') }}</h3>
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
          <p class="platform-label">
            ANDROID
          </p>
          <h3>{{ t('application.platforms.android.title') }}</h3>
        </div>
        <div class="platform-channels">
          <button
            class="glass-button channel-button"
            type="button"
            disabled
          >
            <span>GitHub</span>
            <span>{{ t('application.comingSoon') }}</span>
          </button>
          <button
            class="glass-button channel-button"
            type="button"
            disabled
          >
            <span>Gitee</span>
            <span>{{ t('application.comingSoon') }}</span>
          </button>
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
import { currentColorTheme, getBrandAssets } from '@/composables/core/uiPreferences.js'

const { t } = useI18n()
const appIcon = computed(() => getBrandAssets(currentColorTheme.value).logo)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.application-page {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 48px 16px 64px;
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
  font-size: clamp(var(--font-size-32), 4vw, 48px);
  line-height: 1.2;
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

.platform-label {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: var(--font-size-12);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.platform-details h3 {
  margin: 0;
  font-size: var(--font-size-20);
}

.platform-channels {
  display: flex;
  gap: 10px;
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
  .application-page { padding: 32px 8px 48px; }
  .application-icon { width: 76px; height: 76px; }
  .platform-list { margin-top: 32px; padding: 20px; }
  .platform-row { align-items: stretch; flex-direction: column; gap: 14px; }
  .platform-channels { flex-wrap: wrap; }
  .channel-button { flex: 1; }
}
</style>
