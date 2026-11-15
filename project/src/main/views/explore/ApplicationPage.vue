<template>
  <main class="application-page">
    <header class="application-hero glass-panel">
      <p class="application-eyebrow">
        {{ t('application.eyebrow') }}
      </p>
      <h1>{{ t('application.title') }}</h1>
      <p class="application-intro">
        {{ t('application.intro') }}
      </p>
    </header>

    <div class="platform-grid">
      <article class="platform-card glass-card">
        <div class="platform-icon">
          <InlineIcon icon="🌐" />
        </div>
        <p class="platform-label">
          WEB
        </p>
        <h2>{{ t('application.platforms.web.title') }}</h2>
        <p class="platform-description">
          {{ t('application.platforms.web.description') }}
        </p>
        <RouterLink
          class="glass-button platform-action"
          data-variant="primary"
          :to="localeTo('/')"
        >
          {{ t('application.platforms.web.action') }}
        </RouterLink>
      </article>

      <article class="platform-card glass-card">
        <div class="platform-icon">
          <InlineIcon icon="📱" />
        </div>
        <p class="platform-label">
          iOS / iPadOS
        </p>
        <h2>{{ t('application.platforms.ios.title') }}</h2>
        <p class="platform-description">
          {{ t('application.platforms.ios.description') }}
        </p>
        <button
          class="glass-button platform-action"
          type="button"
          disabled
        >
          App Store · {{ t('application.comingSoon') }}
        </button>
      </article>

      <article class="platform-card glass-card">
        <div class="platform-icon">
          <InlineIcon icon="🤖" />
        </div>
        <p class="platform-label">
          ANDROID
        </p>
        <h2>{{ t('application.platforms.android.title') }}</h2>
        <p class="platform-description">
          {{ t('application.platforms.android.description') }}
        </p>
        <div class="platform-actions">
          <button
            class="glass-button platform-action"
            type="button"
            disabled
          >
            GitHub · {{ t('application.comingSoon') }}
          </button>
          <button
            class="glass-button platform-action"
            type="button"
            disabled
          >
            Gitee · {{ t('application.comingSoon') }}
          </button>
        </div>
      </article>
    </div>
    <p class="application-note">
      {{ t('application.note') }}
    </p>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const localeTo = (path) => buildLocalePath(resolveRouteLocale(route), path)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.application-page {
  width: min(100%, 1100px);
  margin: 0 auto;
  padding: 24px 12px 48px;
  box-sizing: border-box;
}

.application-hero {
  padding: 40px;
  text-align: center;
}

.application-eyebrow, .platform-label {
  color: var(--color-primary);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.application-hero h1 { margin: 12px 0; }
.application-intro { margin: 0 auto; max-width: 42em; line-height: 1.7; }
.platform-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }
.platform-card { @include flex-col; padding: 28px; min-width: 0; }
.platform-icon { font-size: var(--font-size-32); }
.platform-label { margin: 20px 0 6px; font-size: var(--font-size-12); }
.platform-card h2 { margin: 0; }
.platform-description { flex: 1; line-height: 1.7; margin: 14px 0 24px; }
.platform-actions { @include flex-col; gap: 10px; }
.platform-action { width: 100%; box-sizing: border-box; text-align: center; }
.application-note { margin: 24px 0 0; text-align: center; }

@media (max-aspect-ratio: 1 / 1) {
  .application-page { padding: 16px 4px 32px; }
  .application-hero { padding: 28px 20px; }
  .platform-grid { grid-template-columns: 1fr; gap: 14px; }
  .platform-card { padding: 24px; }
}
</style>
