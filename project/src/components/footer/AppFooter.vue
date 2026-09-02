<template>
  <footer
    class="app-footer"
    data-app-footer
    :data-layout-kind="layoutKind"
  >
    <div
      class="footer-brand-line"
      aria-hidden="true"
    />

    <div
      class="footer-content"
    >
      <div class="footer-primary">
        <div class="footer-brand-copy">
          <img
            src="/brand/title.webp"
            :alt="t('layoutFooter.pages.generic.title')"
            class="footer-brand-title title-logo"
          >
          <span class="hint footer-page-description">{{ t(context.pageDescriptionKey) }}</span>
        </div>

        <div
          class="footer-actions"
          aria-label="layout footer actions"
        >
          <button
            type="button"
            class="text-action footer-action"
            @click="isFeaturesOpen = true"
          >
            {{ t('layoutFooter.actions.features') }}
          </button>
          <!-- <button
            type="button"
            class="text-action footer-action"
            @click="isMenuOpen = true"
          >
            {{ t('layoutFooter.actions.menu') }}
          </button> -->
          <button
            type="button"
            class="text-action footer-action"
            :disabled="!context.hasTutorial"
            @click="openTutorial"
          >
            {{ t('layoutFooter.actions.tutorial') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="shareCurrentPage"
          >
            {{ t('layoutFooter.actions.share') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="isFeedbackOpen = true"
          >
            {{ t('layoutFooter.actions.feedback') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="isSupportOpen = true"
          >
            {{ t('layoutFooter.actions.support') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="goToSettings"
          >
            {{ t('layoutFooter.actions.settings') }}
          </button>
        </div>
      </div>

      <div class="footer-meta">
        <div class="page-footer footer-stats">
          <span class="info-text">
            <span>{{ t(context.languageLabelKey) }}</span>
            <span aria-hidden="true">·</span>
            <span class="footer-theme-label">{{ t(context.themeLabelKey) }}</span>
          </span>
          <span class="info-text">{{ t('layoutFooter.stats.visits', { today: todayVisits, total: totalVisits }) }}</span>
          <span class="info-text">{{ t('layoutFooter.stats.source', { locationCount: sourceLocationCount, dataCount: sourceDataCount }) }}</span>
          <span class="info-text">{{ t('layoutFooter.stats.databaseVersion', { version: sourceDbVersion }) }}</span>
        </div>

        <div class="page-footer footer-legal">
          <span class="info-text">{{ t('layoutFooter.legal.copyright') }}</span>
          <span class="info-text">{{ t('layoutFooter.legal.icp') }}</span>
        </div>
      </div>
    </div>

    <LayoutFeedbackModal
      v-model="isFeedbackOpen"
      :page-title="t(context.pageTitleKey)"
      :source-path="route.path"
      :context="feedbackContext"
    />

    <AppModal
      v-model="isFeaturesOpen"
      :title="t('layoutFooter.actions.features')"
      :close-label="t('common.button.close')"
      size="lg"
    >
      <div class="footer-features-modal">
        <FeaturesSection />
      </div>
    </AppModal>

    <SimpleSidebar
      v-if="isMenuOpen"
      :is-open="true"
      @close="isMenuOpen = false"
    />

    <SupportPopup
      v-if="isSupportOpen"
      :visible="true"
      @close="isSupportOpen = false"
    />
  </footer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { requestCurrentTutorialGuideOpen } from '@/main/store/store.js'
import { resolveLayoutFooterContext } from '@/main/config/layoutFooter.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'
import { useVisitStats } from '@/composables/data/useVisitStats.js'
import { currentColorTheme } from '@/composables/core/uiPreferences.js'
import { createShareCardDataUrl } from '@/utils/share/shareCard.js'
import { showError, showSuccess } from '@/utils/ui/message.js'
import AppModal from '@/components/common/AppModal.vue'
import LayoutFeedbackModal from '@/main/components/footer/LayoutFeedbackModal.vue'
import FeaturesSection from '@/main/components/FeaturesSection.vue'
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue'
import SupportPopup from '@/main/components/user/popups/SupportPopup.vue'

const props = defineProps({
  layoutKind: {
    type: String,
    required: true,
    validator: value => ['menu', 'explore', 'simple'].includes(value),
  },
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const homeUpdateNotice = getHomeUpdateNotice(t)
const sourceDbVersion = homeUpdateNotice.dbVersion
const cachedSourceStats = getCachedSourceStats()
const sourceLocationCount = ref(cachedSourceStats.locationCount)
const sourceDataCount = ref(cachedSourceStats.dataCount)
const isFeaturesOpen = ref(false)
const isFeedbackOpen = ref(false)
const isMenuOpen = ref(false)
const isSupportOpen = ref(false)

const {
  todayVisits,
  totalVisits,
  ensureVisitStats,
} = useVisitStats()

const context = computed(() => resolveLayoutFooterContext({
  route,
  locale: locale.value,
  colorTheme: currentColorTheme.value,
}))

const feedbackContext = computed(() => ({
  path: route.path,
  fullPath: route.fullPath,
  query: route.query,
  hash: route.hash,
  layout: props.layoutKind,
  locale: locale.value,
  colorTheme: currentColorTheme.value,
  client_version: `web-${homeUpdateNotice.version}`,
  database_version: sourceDbVersion,
  pageTitle: t(context.value.pageTitleKey),
  pageDescription: t(context.value.pageDescriptionKey),
  viewport: typeof window === 'undefined'
    ? null
    : {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
}))

function openTutorial() {
  if (!context.value.hasTutorial) return
  requestCurrentTutorialGuideOpen()
}

function goToSettings() {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/settings'))
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

function dataUrlToFile(dataUrl, filename) {
  const [header = '', payload = ''] = dataUrl.split(',')
  const mime = header.match(/^data:([^;]+)/)?.[1] || 'image/png'
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new File([bytes], filename, { type: mime })
}

async function shareImageFile({ dataUrl, filename }) {
  if (!navigator.share || !navigator.canShare) {
    return false
  }

  const imageFile = dataUrlToFile(dataUrl, filename)
  const shareData = {
    files: [imageFile],
  }

  if (!navigator.canShare(shareData)) {
    return false
  }

  await navigator.share(shareData)
  return true
}

async function copyShareUrl(url) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  }
}

async function shareCurrentPage() {
  const target = new URL(window.location.href)
  target.pathname = stripLocaleFromPath(target.pathname)
  const url = target.toString()
  const title = t(context.value.pageTitleKey)
  const text = t(context.value.pageDescriptionKey)
  const orientation = window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape'

  try {
    const filename = 'dialects-share.png'
    const dataUrl = await createShareCardDataUrl({
      title,
      description: text,
      url,
      statsLabel: t('layoutFooter.share.stats', {
        locationCount: sourceLocationCount.value,
        dataCount: sourceDataCount.value,
      }),
      colorTheme: currentColorTheme.value,
      orientation,
      brandName: t('layoutFooter.pages.generic.title'),
      qrHint: t('layoutFooter.share.qrHint'),
    })

    if (await shareImageFile({ dataUrl, filename })) {
      return
    }

    downloadDataUrl(dataUrl, filename)
    try {
      await copyShareUrl(url)
      showSuccess(t('layoutFooter.share.copied'))
    } catch {
      showSuccess(t('layoutFooter.share.imageReady'))
    }
  } catch {
    showError(t('layoutFooter.share.failed'))
  }
}

async function fetchFooterStats() {
  try {
    await ensureVisitStats()
  } catch (error) {
    console.error('獲取訪問統計失敗:', error)
  }

  try {
    const stats = await getSourceStats()
    sourceLocationCount.value = stats.locationCount
    sourceDataCount.value = stats.dataCount
  } catch (error) {
    console.error('獲取字表統計失敗:', error)
  }
}

onMounted(fetchFooterStats)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.app-footer {
  width: 100%;
  margin-top: 24px;
  padding: 0 max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  border-top: 1px solid var(--border-control);
  background: linear-gradient(
    180deg,
    var(--surface-panel-subtle) 0%,
    transparent 100%
  );
}

.footer-brand-line {
  width: min(520px, 100%);
  height: 2px;
  margin: -1px auto 0;
  border-radius: var(--radius-pill);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--color-primary-rgb), 0.08) 12%,
    var(--color-primary) 38%,
    var(--color-primary-hover) 62%,
    rgba(var(--color-primary-rgb), 0.08) 88%,
    transparent 100%
  );
  opacity: 0.72;
}

.footer-content {
  max-width: 1040px;
  margin: 0 auto;
  padding-top: 26px;
}

.footer-primary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px 32px;
}

.footer-brand-copy {
  @include flex-col;
  align-items: flex-start;
  min-width: 0;
  gap: 4px;
}

.footer-brand-title {
  display: block;
  width: auto;
  height: 22px;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px 18px;
}

.footer-action {
  min-width: 0;
  color: var(--color-primary-hover);
  font-weight: 600;
  font-size: 16px;

  &:hover:not(:disabled) {
    color: var(--color-primary);
  }

  &:disabled {
    color: var(--text-secondary);
  }
}

.footer-meta {
  @include flex-col;
  align-items: center;
  margin-top: 14px;
  gap: 8px;
  color: var(--text-secondary);
}

.footer-meta .info-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.footer-theme-label {
  color: var(--color-primary-hover);
}

.footer-features-modal {
  :deep(.features-section) {
    max-width: none;
    padding: 0;
  }

  :deep(.feature-tile) {
    flex: 1 1 100px;
  }
}

.footer-stats,
.footer-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 18px;
}

@media (max-aspect-ratio: 1 / 1) {
  .app-footer {
    margin-top: 18px;
  }

  .footer-content {
    padding-top: 22px;
  }

  .footer-primary {
    @include flex-col;
    align-items: stretch;
    gap: 14px;
  }

  .footer-brand-copy {
    align-items: center;
    text-align: center;
  }

  .footer-actions {
    justify-content: center;
    gap: 8px 16px;
  }
}
</style>
