<template>
  <footer
    class="app-footer"
    data-app-footer
    :data-layout-kind="layoutKind"
  >
    <div
      class="footer-actions"
      aria-label="layout footer actions"
    >
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
        @click="isFeedbackOpen = true"
      >
        {{ t('layoutFooter.actions.feedback') }}
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
        @click="goToSettings"
      >
        {{ t('layoutFooter.actions.settings') }}
      </button>
    </div>

    <div class="page-footer footer-stats">
      <span class="info-text">
        {{ t(context.languageLabelKey) }} · {{ t(context.themeLabelKey) }}
      </span>
      <span class="info-text">{{ t('layoutFooter.stats.visits', { today: todayVisits, total: totalVisits }) }}</span>
      <span class="info-text">{{ t('layoutFooter.stats.source', { locationCount: sourceLocationCount, dataCount: sourceDataCount }) }}</span>
      <span class="info-text">{{ t('layoutFooter.stats.databaseVersion', { version: sourceDbVersion }) }}</span>
    </div>

    <div class="page-footer footer-legal">
      <span class="info-text">{{ t('layoutFooter.legal.copyright') }}</span>
      <span class="info-text">{{ t('layoutFooter.legal.icp') }}</span>
    </div>

    <LayoutFeedbackModal
      v-model="isFeedbackOpen"
      :page-title="t(context.pageTitleKey)"
      :source-path="route.path"
      :context="feedbackContext"
    />
  </footer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { requestCurrentTutorialGuideOpen } from '@/main/store/store.js'
import { resolveLayoutFooterContext } from '@/main/config/layoutFooter.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'
import { useVisitStats } from '@/composables/data/useVisitStats.js'
import { currentColorTheme } from '@/composables/core/uiPreferences.js'
import { createShareCardDataUrl } from '@/utils/share/shareCard.js'
import { showError, showSuccess } from '@/utils/ui/message.js'
import LayoutFeedbackModal from '@/main/components/footer/LayoutFeedbackModal.vue'

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
const isFeedbackOpen = ref(false)

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

async function copyShareUrl(url) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  }
}

async function shareCurrentPage() {
  const url = window.location.href
  const title = t(context.value.pageTitleKey)
  const text = t(context.value.pageDescriptionKey)

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return
    }

    const dataUrl = createShareCardDataUrl({
      title,
      description: text,
      url,
      languageLabel: t(context.value.languageLabelKey),
      themeLabel: t(context.value.themeLabelKey),
      colorTheme: currentColorTheme.value,
    })

    downloadDataUrl(dataUrl, 'dialects-share.png')
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
  padding: 28px max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  border-top: 1px solid var(--border-glass);
}

.footer-actions,
.footer-stats,
.footer-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 18px;
}

.footer-action {
  min-width: 0;
}

.footer-stats {
  margin-top: 14px;
}

.footer-legal {
  margin-top: 8px;
}

@media (max-aspect-ratio: 1 / 1) {
  .app-footer {
    margin-top: 18px;
    padding-top: 22px;
  }

  .footer-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }
}
</style>
