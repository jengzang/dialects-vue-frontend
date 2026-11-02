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
          <button
            type="button"
            class="footer-brand-name footer-brand-button"
            @click="goToHome"
          >
            <strong>{{ t('layoutFooter.pages.generic.title') }}</strong>
          </button>
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
            <BarIcon icon="🧭" class="footer-action-icon" aria-hidden="true" />
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
            <BarIcon icon="📖" class="footer-action-icon" aria-hidden="true" />
            {{ t('layoutFooter.actions.tutorial') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="shareCurrentPage"
          >
            <BarIcon icon="📤" class="footer-action-icon" aria-hidden="true" />
            {{ t('layoutFooter.actions.share') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="isFeedbackOpen = true"
          >
            <BarIcon icon="💬" class="footer-action-icon" aria-hidden="true" />
            {{ t('layoutFooter.actions.feedback') }}
          </button>
          <button
            type="button"
            class="text-action footer-action"
            @click="isSupportOpen = true"
          >
            <BarIcon icon="🎁" class="footer-action-icon" aria-hidden="true" />
            {{ t('layoutFooter.actions.support') }}
          </button>
          <!-- <button
            type="button"
            class="text-action footer-action"
            @click="goToSettings"
          >
            <BarIcon icon="⚙️" class="footer-action-icon" aria-hidden="true" />
            {{ t('layoutFooter.actions.settings') }}
          </button> -->
        </div>
      </div>

      <div class="footer-meta">
        <div class="page-footer footer-stats">
          <span class="info-text">
            <span class="footer-theme-controls">
              <button
                v-for="control in themeControls"
                :key="control.id"
                :ref="el => { themeTriggers[control.id] = el }"
                type="button"
                class="glass-button footer-theme-trigger"
                data-size="compact"
                :data-theme-menu="control.id"
                :aria-label="`${control.label}: ${control.selectedLabel}`"
                :aria-expanded="themeMenu === control.id"
                :title="`${control.label}: ${control.selectedLabel}`"
                @click="themeMenu = themeMenu === control.id ? null : control.id"
              >
                <component :is="control.icon" :size="18" aria-hidden="true" />
                <span class="footer-theme-label">{{ control.selectedLabel }}</span>
                <span class="footer-theme-short-label" aria-hidden="true">{{ control.shortLabel }}</span>
                <PhCaretDown :size="12" aria-hidden="true" />
              </button>
            </span>
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

    <SimpleDropdown
      v-if="activeThemeControl"
      :model-value="activeThemeControl.value"
      :options="activeThemeControl.options"
      :trigger-el="themeTriggers[themeMenu]"
      direction="up"
      align="right"
      @update:modelValue="changeFooterTheme"
      @close="closeThemeMenu"
    >
      <template #option="{ option }">
        <component
          :is="option.icon"
          :size="18"
          :weight="themeMenu === 'family' ? 'fill' : 'regular'"
          :class="themeMenu === 'family' ? ['theme-choice-swatch', `theme-choice-swatch--${option.value}`] : null"
          aria-hidden="true"
        />
        {{ option.label }}
      </template>
    </SimpleDropdown>

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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhCircle, PhPalette, PhSun, PhMoon, PhDesktop, PhCaretDown, PhTranslate } from '@phosphor-icons/vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n/index.js'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { requestCurrentTutorialGuideOpen } from '@/main/store/store.js'
import { resolveLayoutFooterContext } from '@/main/config/layoutFooter.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'
import { useVisitStats } from '@/composables/data/useVisitStats.js'
import { currentColorTheme, currentColorMode, getColorThemeParts, setColorFamily, setColorMode } from '@/composables/core/uiPreferences.js'
import { createShareCardDataUrl } from '@/utils/share/shareCard.js'
import { showError, showSuccess } from '@/utils/ui/message.js'
import BarIcon from '@/components/common/BarIcon.vue'
import AppModal from '@/components/common/AppModal.vue'
import LayoutFeedbackModal from '@/main/components/footer/LayoutFeedbackModal.vue'
import FeaturesSection from '@/main/components/FeaturesSection.vue'
import SimpleSidebar from '@/components/bar/SimpleSidebar.vue'
import SupportPopup from '@/main/components/user/popups/SupportPopup.vue'
import SimpleDropdown from '@/components/selector/SimpleDropdown.vue'

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
const themeMenu = ref(null)
const themeTriggers = {}
const languageOptions = [
  { value: 'zh-Hant', label: '繁體中文', shortLabel: '繁', icon: PhTranslate },
  { value: 'zh-CN', label: '简体中文', shortLabel: '简', icon: PhTranslate },
  { value: 'en', label: 'English', shortLabel: 'EN', icon: PhTranslate },
]
const colorOptions = computed(() => ['blue', 'red', 'green'].map(value => ({
  value, label: t(`navigation.settings.colorTheme.options.${value}`), shortLabel: t(`navigation.settings.colorTheme.shortOptions.${value}`), icon: PhCircle,
})))
const appearanceOptions = computed(() => [
  { value: 'light', label: t('navigation.settings.colorTheme.modes.light'), shortLabel: t('navigation.settings.colorTheme.shortModes.light'), icon: PhSun },
  { value: 'dark', label: t('navigation.settings.colorTheme.modes.dark'), shortLabel: t('navigation.settings.colorTheme.shortModes.dark'), icon: PhMoon },
  { value: 'system', label: t('navigation.settings.colorTheme.modes.system'), shortLabel: t('navigation.settings.colorTheme.shortModes.system'), icon: PhDesktop },
])
const themeControls = computed(() => {
  const family = getColorThemeParts(currentColorTheme.value).family
  const color = colorOptions.value.find(option => option.value === family)
  const appearance = appearanceOptions.value.find(option => option.value === currentColorMode.value)
  const language = languageOptions.find(option => option.value === locale.value)
  return [
    { id: 'language', value: locale.value, label: t('navigation.settings.language.title'), selectedLabel: language.label, shortLabel: language.shortLabel, icon: PhTranslate, options: languageOptions },
    { id: 'family', value: family, label: t('navigation.settings.colorTheme.title'), selectedLabel: color.label, shortLabel: color.shortLabel, icon: PhPalette, options: colorOptions.value },
    { id: 'mode', value: currentColorMode.value, label: t('navigation.settings.colorTheme.modeTitle'), selectedLabel: appearance.label, shortLabel: appearance.shortLabel, icon: appearance.icon, options: appearanceOptions.value },
  ]
})
const activeThemeControl = computed(() => themeControls.value.find(control => control.id === themeMenu.value))

function changeFooterTheme(value) {
  if (themeMenu.value === 'language') changeFooterLanguage(value)
  else if (themeMenu.value === 'family') setColorFamily(value)
  else setColorMode(value)
}

async function changeFooterLanguage(newLocale) {
  const unchanged = newLocale === locale.value
  try {
    if (!await setLocale(newLocale)) return
  } catch {
    showError(t('messages.error.loadFailed'))
    return
  }
  if (unchanged) return
  const path = buildLocalePath(newLocale, stripLocaleFromPath(route.path))
  await router.push({ path, query: route.query, hash: route.hash })
  showSuccess(t('messages.success.languageChanged'))
  setTimeout(() => window.location.reload(), 500)
}

function closeThemeMenu() {
  const trigger = themeTriggers[themeMenu.value]
  themeMenu.value = null
  nextTick(() => trigger?.focus())
}

watch(
  () => route.fullPath,
  () => {
    isFeaturesOpen.value = false
    themeMenu.value = null
  },
)

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

function goToHome() {
  router.push(buildLocalePath(resolveRouteLocale(route), '/'))
}

function handleHistoryFooterAction(event) {
  switch (event.detail?.action) {
    case 'feedback':
      isFeedbackOpen.value = true
      break
    case 'features':
      isFeaturesOpen.value = true
      break
    case 'share':
      shareCurrentPage()
      break
    default:
      break
  }
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
  } catch (error) {
    if (error?.name === 'AbortError') return
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

onMounted(() => {
  window.addEventListener('app-footer-action', handleHistoryFooterAction)
  fetchFooterStats()
})

onBeforeUnmount(() => {
  window.removeEventListener('app-footer-action', handleHistoryFooterAction)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.app-footer {
  width: 100%;
  margin-top: 2px;
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
  // max-width: 1040px;
  margin: 0 auto;
  padding-top: 18px;
}

.footer-primary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px 32px;
}

.footer-brand-name {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: pre-wrap;
  font-size: var(--font-size-16);
  color: var(--color-primary-hover);

  &:hover:not(:disabled) {
    color: var(--color-primary);
    text-decoration: underline;
  }

}

.footer-brand-copy {
  @include flex-col;
  align-items: flex-start;
  min-width: 0;
  gap: 4px;
}

.footer-brand-button {
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px 18px;
}

.footer-action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  color: var(--color-primary-hover);
  font-weight: 600;
  font-size: var(--font-size-14);

  &:hover:not(:disabled) {
    color: var(--color-primary);
  }

  &:disabled {
    color: var(--text-secondary);
  }
}

.footer-action-icon {
  flex-shrink: 0;
  line-height: 1;
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
  font-size: var(--font-size-13);
}

.footer-theme-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.footer-theme-trigger {
  --glass-button-compact-padding: 6px 10px;
  --glass-button-color: var(--text-primary);
  min-height: 38px;
}

.footer-theme-short-label {
  display: none;
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
  .footer-theme-label {
    display: none;
  }

  .footer-theme-short-label {
    display: inline;
  }

  .footer-theme-trigger {
    min-height: 44px;
    min-width: 44px;
  }

  .app-footer {
    margin-top: 18px;
    width:auto;
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
