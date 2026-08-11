<template>
  <div class="settings-page-wrapper">
    <div class="settings-container">
      <h1 class="page-title"><BarIcon icon="⚙️" />{{ $t('navigation.pageTitles.support.settings') }}</h1>
      <div class="setting-section">
        <h3 class="section-title">{{ $t('navigation.settings.language.title') }}</h3>
        <div class="language-options">
          <div
            v-for="lang in languages"
            :key="lang.code"
            class="language-card"
            :class="{ active: currentLocale === lang.code }"
            @click="changeLanguage(lang.code)"
          >
            <div class="language-info">
              <div class="language-name">{{ lang.name }}</div>
              <div class="language-code">{{ lang.code }}</div>
            </div>
            <div v-if="currentLocale === lang.code" class="language-check">&check;</div>
          </div>
        </div>
      </div>

      <div class="setting-section setting-split">
        <div class="setting-split-item">
          <h3 class="section-title">{{ $t('navigation.settings.characterTable.title') }}</h3>
          <p class="section-description">{{ $t('navigation.settings.characterTable.description') }}</p>
          <SimpleSelectDropdown
            v-model="currentCharacterTable"
            :options="characterTableOptions"
            width="100%"
          />
        </div>
        <hr class="setting-split-divider">
        <div class="setting-split-item">
          <h3 class="section-title">{{ $t('about.settings.zhongguInputMode.title') }}
            <HelpIcon
              :content="$t('about.settings.zhongguInputMode.description')"
              size="sm"
              placement="right"
              icon="?"
              icon-color="var(--color-primary)"
              style="margin-right: 2px; vertical-align: bottom;"
            />
          </h3>
          <RadioGroup
            v-model="zhongguInputModeModel"
            :options="zhongguInputModeOptions"
            name="settings-zhonggu-input-mode"
            class="settings-radio-group"
          />
        </div>
      </div>

      <div class="setting-section setting-split">
        <div class="setting-split-item">
          <h3 class="section-title">
            {{ $t('navigation.settings.colorTheme.title') }}
            <HelpIcon
              :content="$t('navigation.settings.colorTheme.description')"
              size="sm"
              placement="right"
              icon="?"
              icon-color="var(--color-primary)"
            />
          </h3>
          <RadioGroup
            v-model="colorThemeModel"
            :options="colorThemeRadioOptions"
            name="settings-color-theme"
            class="settings-radio-group color-theme-radio-group"
          />
        </div>
        <hr class="setting-split-divider">
        <div class="setting-split-item">
          <h3 class="section-title">
            {{ $t('navigation.settings.interfaceMode.title') }}
            <HelpIcon
              :content="$t('navigation.settings.interfaceMode.description')"
              size="sm"
              placement="right"
              icon="?"
              icon-color="var(--color-primary)"
            />
          </h3>
          <RadioGroup
            v-model="interfaceModeModel"
            :options="interfaceModeRadioOptions"
            name="settings-interface-mode"
            class="settings-radio-group interface-mode-radio-group"
          />
          <h3 class="section-title" style="margin-top: 18px">
            {{ $t('about.settings.iconMode.title') }}
            <HelpIcon
              :content="$t('about.settings.iconMode.description')"
              size="sm"
              placement="right"
              icon="?"
              icon-color="var(--color-primary)"
            />
          </h3>
          <RadioGroup
            v-model="iconModeModel"
            :options="iconModeRadioOptions"
            name="settings-icon-mode"
            class="settings-radio-group"
          />
        </div>
      </div>

      <div class="setting-section tutorial-toggle-section">
        <div class="tutorial-toggle-copy">
          <h3 class="section-title">{{ $t('about.settings.tutorialToggle.title') }}</h3>
          <p class="section-description">{{ $t('about.settings.tutorialToggle.description') }}</p>
        </div>
        <SwitchToggle
          :model-value="tutorialGuideEnabled"
          :width="100"
          :height="40"
          :thumb-size="32"
          color="var(--color-primary)"
          variant="solid"
          show-label
          :active-text="$t('about.settings.tutorialToggle.enabled')"
          :inactive-text="$t('about.settings.tutorialToggle.disabled')"
          label-position="inside"
          :gap="20"
          :aria-label="$t('about.settings.tutorialToggle.title')"
          class="tutorial-switch-toggle"
          @update:modelValue="handleTutorialToggle"
        />
      </div>

      <div class="setting-section update-notice-section">
        <div class="update-notice-copy">
          <h3 class="section-title">
            {{ $t('about.settings.updateNotice.title') }}
            <HelpIcon
              :content="$t('about.settings.updateNotice.description')"
              size="sm"
              placement="right"
              icon="?"
              icon-color="var(--color-primary)"
            />
          </h3>
        </div>
        <div class="update-notice-controls">
          <RadioGroup
            v-model="updateNoticeModeModel"
            :options="updateNoticeModeOptions"
            name="settings-update-notice-mode"
            class="settings-radio-group"
          />
          <button
            class="glass-button"
            data-variant="secondary"
            @click="showUpdateNotice = true"
            style="white-space: nowrap;"
          ><InlineIcon icon="📋" />{{ $t('about.settings.viewUpdateLog') }}
          </button>
        </div>
      </div>
    </div>

    <SupportPopup
      :visible="showQRCodes"
      @close="showQRCodes = false"
    />

    <UpdateNoticeModal
      v-model:visible="showUpdateNotice"
      :version="updateNoticeData.version"
      :last-update-date="updateNoticeData.lastUpdateDate"
      :title="updateNoticeData.title"
      :items="updateNoticeData.items"
      :mode="updateNoticeMode"
    />
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { ref, computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { setLocale } from '@/i18n/index.js'
import { showSuccess } from '@/utils/ui/message.js'
import SupportPopup from '@/main/components/user/popups/SupportPopup.vue'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { TABLE_COLUMN_SCHEMAS } from '@/main/config/index.js'
import {
  COLOR_THEME_BLUE,
  COLOR_THEME_DARK,
  COLOR_THEME_LIGHT,
  COLOR_THEME_GREEN,
  UI_MODE_DEFAULT,
  UI_MODE_COMPACT,
  ICON_MODE_ALL_EMOJI,
  ICON_MODE_ALL_SVG,
  ICON_MODE_BAR_SVG,
  getStoredColorTheme,
  getStoredInterfaceMode,
  getStoredIconMode,
  setColorTheme,
  setInterfaceMode,
  setIconMode,
} from '@/composables/core/uiPreferences.js'
import { buildLocalePath, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import {
  preferredCharacterTable,
  setPreferredCharacterTable,
  tutorialEnabled,
  setTutorialEnabled,
  zhongguInputMode,
  setZhongguInputMode,
} from '@/main/store/store.js'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const UpdateNoticeModal = defineAsyncComponent(() => import('@/main/components/user/popups/UpdateNoticeModal.vue'))
const showQRCodes = ref(false)
const UPDATE_NOTICE_MODE_KEY = 'update-notice-mode'
const showUpdateNotice = ref(false)
const updateNoticeData = computed(() => getHomeUpdateNotice(t))
const updateNoticeMode = ref(localStorage.getItem(UPDATE_NOTICE_MODE_KEY) || 'modal')

const updateNoticeModeModel = computed({
  get: () => updateNoticeMode.value,
  set: (val) => {
    updateNoticeMode.value = val
    localStorage.setItem(UPDATE_NOTICE_MODE_KEY, val)
  }
})

const updateNoticeModeOptions = computed(() => [
  { value: 'modal', label: t('about.settings.updateNotice.modeModal') },
  { value: 'showinfo', label: t('about.settings.updateNotice.modeShowinfo') },
])

const currentLocale = computed(() => locale.value)

const languages = ref([
  { code: 'zh-Hant', name: '繁體中文', flag: '🇭🇰' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
])

const interfaceMode = ref(getStoredInterfaceMode())
const colorTheme = ref(getStoredColorTheme())
const iconMode = ref(getStoredIconMode())

const colorThemeOptions = computed(() => [
  { value: COLOR_THEME_BLUE, label: t('navigation.settings.colorTheme.options.blue') },
  { value: COLOR_THEME_GREEN, label: t('navigation.settings.colorTheme.options.green') },
  { value: COLOR_THEME_LIGHT, label: t('navigation.settings.colorTheme.options.light') },
  { value: COLOR_THEME_DARK, label: t('navigation.settings.colorTheme.options.dark') },
])

const colorThemeRadioOptions = computed(() =>
  colorThemeOptions.value.map(option => ({
    value: option.value,
    label: option.label
  }))
)

const colorThemeModel = computed({
  get: () => colorTheme.value,
  set: (theme) => changeColorTheme(theme)
})

const interfaceModeOptions = computed(() => [
  { value: UI_MODE_DEFAULT, label: t('navigation.settings.interfaceMode.options.default'), description: t('navigation.settings.interfaceMode.help.default') },
  { value: UI_MODE_COMPACT, label: t('navigation.settings.interfaceMode.options.compact'), description: t('navigation.settings.interfaceMode.help.compact') }
])

const interfaceModeRadioOptions = computed(() =>
  interfaceModeOptions.value.map(option => ({
    value: option.value,
    label: `${option.label}`
  }))
)

const interfaceModeModel = computed({
  get: () => interfaceMode.value,
  set: (mode) => changeInterfaceMode(mode)
})

const iconModeOptions = computed(() => [
  { value: ICON_MODE_BAR_SVG, label: t('about.settings.iconMode.options.barSvg') },
  { value: ICON_MODE_ALL_EMOJI, label: t('about.settings.iconMode.options.allEmoji') },
  { value: ICON_MODE_ALL_SVG, label: t('about.settings.iconMode.options.allSvg') },
])

const iconModeRadioOptions = computed(() =>
  iconModeOptions.value.map(option => ({
    value: option.value,
    label: option.label
  }))
)

const iconModeModel = computed({
  get: () => iconMode.value,
  set: (mode) => {
    if (mode === iconMode.value) return
    iconMode.value = setIconMode(mode)
  }
})

const characterTableOptions = computed(() =>
  Object.entries(TABLE_COLUMN_SCHEMAS).map(([tableName, schema]) => ({
    value: tableName,
    label: schema.meta?.label || tableName
  }))
)

const currentCharacterTable = computed({
  get: () => preferredCharacterTable.value,
  set: (tableName) => setPreferredCharacterTable(tableName)
})

const tutorialGuideEnabled = computed({
  get: () => tutorialEnabled.value,
  set: (value) => setTutorialEnabled(value)
})

function handleTutorialToggle(value) {
  tutorialGuideEnabled.value = value
  showSuccess(value
    ? t('about.settings.tutorialToggle.enabledSuccess')
    : t('about.settings.tutorialToggle.disabledSuccess'))
}

const zhongguInputModeModel = computed({
  get: () => zhongguInputMode.value,
  set: (mode) => setZhongguInputMode(mode)
})

const zhongguInputModeOptions = computed(() => [
  { value: 'selector', label: t('about.settings.zhongguInputMode.options.selector') },
  { value: 'direct', label: t('about.settings.zhongguInputMode.options.direct') }
])

function changeLanguage(newLocale) {
  if (newLocale === currentLocale.value) return
  setLocale(newLocale)
  const targetPath = buildLocalePath(newLocale, stripLocaleFromPath(route.path))
  router.push({ path: targetPath, query: route.query, hash: route.hash })
  showSuccess(t('messages.success.languageChanged'))
  setTimeout(() => window.location.reload(), 500)
}

function changeInterfaceMode(mode) {
  if (mode === interfaceMode.value) return
  interfaceMode.value = setInterfaceMode(mode)
  showSuccess(t('messages.success.interfaceModeChanged'))
}

function changeColorTheme(theme) {
  if (theme === colorTheme.value) return
  colorTheme.value = setColorTheme(theme)
  showSuccess(t('messages.success.colorThemeChanged'))
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$text-primary: var(--text-dark);
$text-muted: var(--text-tertiary);

.settings-page-wrapper {
  width: 100%;
  height: 100%;
}

.page-title {
  width: 100%;
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  color: $text-primary;
}

.settings-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.setting-section {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @include glass-blur(10px);
}

.setting-split {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.setting-split-item {
  flex: 1;
  min-width: 0;
}

.setting-split-divider {
  align-self: stretch;
  width: 1px;
  margin: 0;
  background: rgba(0, 0, 0, 0.12);
  border: none;
}

.section-title {
  margin: 0 0 8px;
  color: $text-primary;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.section-description {
  margin: 0 0 20px;
  color: $text-muted;
  font-size: 14px;
}

.settings-radio-group {
  justify-content: center;
  gap: 18px 24px;

  :deep(.liquid-radio-label) {
    padding: 6px 8px;
  }

  :deep(.liquid-radio-text) {
    line-height: 1.5;
  }
}

.color-theme-radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  gap: 4px 16px;

  :deep(.liquid-radio-text) {
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      width: 18px;
      height: 18px;
      content: '';
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 5px;
      flex-shrink: 0;
    }
  }

  :deep(.liquid-radio-label:nth-child(1) .liquid-radio-text::before) {
    background: #007aff;
  }
  :deep(.liquid-radio-label:nth-child(2) .liquid-radio-text::before) {
    background: #388e3c;
  }
  :deep(.liquid-radio-label:nth-child(3) .liquid-radio-text::before) {
    background: linear-gradient(135deg, #fff 50%, #e8e8e8 50%);
    border-color: rgba(0, 0, 0, 0.18);
  }
  :deep(.liquid-radio-label:nth-child(4) .liquid-radio-text::before) {
    background: linear-gradient(135deg, #0d1117 50%, #21262d 50%);
  }
}

.interface-mode-radio-group {
  :deep(.liquid-radio-text) {
    font-size: 14px;
  }
}

.language-options {
  display: flex;
  justify-content: center;
  gap: 12px;
  overflow-x: auto;
}

.language-card {
  @include flex-center;
  padding: 16px;
  background: var(--glass-80);
  border: 2px solid var(--border-light-gray);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--bg-white);
    border-color: $primary;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1),
      rgba(var(--color-primary-rgb), 0.05)
    );
    border-color: $primary;
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }
}

.language-info {
  display: flex;
  gap: 12px;
}

.language-name {
  margin-bottom: 4px;
  color: $text-primary;
  font-size: 16px;
  font-weight: 600;
}

.language-code {
  color: var(--text-lightest);
  font-size: 12px;
}

.language-check {
  margin-left: 20px;
  color: $primary;
  font-size: 24px;
  font-weight: bold;
}

.tutorial-toggle-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.tutorial-toggle-copy {
  flex: 1;
  @include flex-col;
  gap: 6px;
}

.tutorial-switch-toggle {
  flex-shrink: 0;
  justify-content: flex-end;

  :deep(.switch-toggle__button) {
    font-weight: 700;

    &.is-on {
      background: $primary;
      color: var(--text-white);
    }
  }

  :deep(.switch-toggle__label--inside) {
    white-space: nowrap;
    color: inherit;
    font-weight: 700;
  }

  :deep(.switch-toggle__thumb) {
    box-shadow: 0 6px 14px rgba(38, 88, 137, 0.18);
  }
}

.update-notice-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}

@media (max-aspect-ratio: #{1 / 1}) {
  .settings-container {
    padding: 12px;
  }

  .setting-section {
    margin-bottom: 14px;
    padding: 16px;
    border-radius: 14px;
  }

  .setting-split {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .setting-split-divider {
    width: 100%;
    height: 1px;
    margin: 16px 0;
  }

  .section-title {
    margin-bottom: 6px;
    font-size: 18px;
  }

  .section-description {
    margin-bottom: 14px;
    font-size: 13px;
    line-height: 1.45;
  }

  .settings-radio-group {
    gap: 10px 12px;

    :deep(.liquid-radio-label) {
      padding: 4px 6px;
    }

    :deep(.liquid-radio-text) {
      line-height: 1.4;
    }
  }

  .interface-mode-radio-group {
    :deep(.liquid-radio-text) {
      font-size: 13px;
    }
  }

  .language-options {
    flex-wrap: nowrap;
    justify-content: center;
    gap: 8px;
    overflow-x: auto;
  }

  .language-card {
    flex-shrink: 0;
    padding: 10px 12px;
    border-width: 1.5px;
  }

  .language-info {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .language-name {
    margin-bottom: 0;
    font-size: 14px;
  }

  .language-code {
    font-size: 11px;
  }

  .language-check {
    margin-left: 8px;
    font-size: 18px;
  }

  .tutorial-toggle-section {
    align-items: flex-start;
    gap: 12px;
  }

  .tutorial-toggle-copy {
    gap: 4px;
  }

  .tutorial-switch-toggle {
    flex-shrink: 0;
    justify-content: flex-end;
  }
}
</style>
