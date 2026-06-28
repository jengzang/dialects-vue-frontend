<template>
  <div class="page-root">
    <div class="settings-container">
      <div class="setting-grid">
        <div class="setting-section">
          <h3 class="section-title">🌐 {{ $t('navigation.settings.language.title') }}</h3>
          <p class="section-description">{{ $t('navigation.settings.language.description') }}</p>

          <div class="language-options">
            <div
              v-for="lang in languages"
              :key="lang.code"
              class="language-card"
              :class="{ active: currentLocale === lang.code }"
              @click="changeLanguage(lang.code)"
            >
              <div class="language-flag">{{ lang.flag }}</div>
              <div class="language-info">
                <div class="language-name">{{ lang.name }}</div>
                <div class="language-code">{{ lang.code }}</div>
              </div>
              <div v-if="currentLocale === lang.code" class="language-check">
                ✓
              </div>
            </div>
          </div>
        </div>

        <div class="setting-section">
          <h3 class="section-title">⚡ {{ $t('navigation.settings.interfaceMode.title') }}</h3>
          <p class="section-description">{{ $t('navigation.settings.interfaceMode.description') }}</p>

          <div class="mode-group" role="radiogroup" :aria-label="$t('navigation.settings.interfaceMode.label')">
            <button
              v-for="option in interfaceModeOptions"
              :key="option.value"
              type="button"
              class="mode-option"
              :class="{ active: interfaceMode === option.value }"
              :aria-pressed="interfaceMode === option.value"
              @click="changeInterfaceMode(option.value)"
            >
              <div class="mode-option-header">
                <span class="mode-option-label">{{ option.label }}</span>
                <span v-if="interfaceMode === option.value" class="mode-option-check">✓</span>
              </div>
              <div class="mode-option-description">{{ option.description }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { SUPPORTED_LOCALES } from '@/i18n/localeDetector.js'
import { buildLocalePath } from '@/i18n/localeRouting.js'
import {
  UI_MODE_DEFAULT,
  UI_MODE_COMPACT,
  getStoredInterfaceMode,
  setInterfaceMode,
} from '@/composables/core/uiPreferences.js'
import { showSuccess } from '@/utils/message.js'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const currentLocale = computed(() => locale.value)

const languages = ref([
  SUPPORTED_LOCALES['zh-Hant'],
  SUPPORTED_LOCALES['zh-CN'],
  SUPPORTED_LOCALES['en'],
])

const interfaceMode = ref(getStoredInterfaceMode())

const interfaceModeOptions = computed(() => [
  {
    value: UI_MODE_DEFAULT,
    label: t('navigation.settings.interfaceMode.options.default'),
    description: t('navigation.settings.interfaceMode.help.default'),
  },
  {
    value: UI_MODE_COMPACT,
    label: t('navigation.settings.interfaceMode.options.compact'),
    description: t('navigation.settings.interfaceMode.help.compact'),
  },
])

function changeLanguage(newLocale) {
  if (newLocale === currentLocale.value) {
    return
  }

  router.push({
    path: buildLocalePath(newLocale, route.path),
    query: route.query,
    hash: route.hash,
  })
  showSuccess(t('messages.success.languageChanged'))
}

function changeInterfaceMode(mode) {
  if (mode === interfaceMode.value) {
    return
  }

  interfaceMode.value = setInterfaceMode(mode)
  showSuccess(t('messages.success.interfaceModeChanged'))
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 880px;
  margin: 0 auto;
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.setting-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.section-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
}

.language-options,
.mode-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.language-card,
.mode-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.mode-option {
  flex-direction: column;
  align-items: stretch;
}

.language-card:hover,
.mode-option:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #007aff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.language-card.active,
.mode-option.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
  border-color: #007aff;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.language-flag {
  font-size: 32px;
  margin-right: 16px;
}

.language-info {
  flex: 1;
}

.language-name,
.mode-option-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.language-name {
  margin-bottom: 4px;
}

.language-code,
.mode-option-description {
  font-size: 12px;
  color: #999;
}

.language-check,
.mode-option-check {
  font-size: 24px;
  color: #007aff;
  font-weight: bold;
}

.mode-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.mode-option-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .settings-container {
    padding: 12px;
  }

  .setting-section {
    padding: 16px;
  }

  .language-flag {
    font-size: 28px;
    margin-right: 12px;
  }

  .language-name,
  .mode-option-label {
    font-size: 14px;
  }

  .language-code,
  .mode-option-description {
    font-size: 11px;
  }
}
</style>
