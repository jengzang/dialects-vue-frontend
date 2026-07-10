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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { setLocale } from '@/i18n/index.js'
import { buildLocalePath, stripLocaleFromPath } from '@/i18n/localeRouting.js'
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

const currentLocale = computed(() => route.params.locale || locale.value)

watch(
  () => route.params.locale,
  (routeLocale) => {
    if (routeLocale && locale.value !== routeLocale) {
      locale.value = routeLocale
    }
  },
  { immediate: true }
)

const languages = ref([
  { code: 'zh-Hant', name: '繁體中文', flag: '🇭🇰' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
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

  setLocale(newLocale)
  router.push({
    path: buildLocalePath(newLocale, stripLocaleFromPath(route.path)),
    query: route.query,
    hash: route.hash,
  })
  showSuccess(t('messages.success.languageChanged'))
  setTimeout(() => window.location.reload(), 500)
}

function changeInterfaceMode(mode) {
  if (mode === interfaceMode.value) {
    return
  }

  interfaceMode.value = setInterfaceMode(mode)
  showSuccess(t('messages.success.interfaceModeChanged'))
}
</script>

```vue

$primary-blue: var(--color-primary);
$text-primary: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-muted: var(--text-lightest);
$border-color: var(--border-light-gray);
$white: var(--text-white);

$transition-duration: 0.3s;

.settings-container {
  max-width: 880px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 480px) {
    padding: 12px;
  }
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.setting-section {
  padding: 24px;
  background: var(--glass-90);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @media (max-width: 480px) {
    padding: 16px;
  }
}

.section-title {
  margin: 0 0 8px;
  color: $text-primary;
  font-size: 20px;
  font-weight: 600;
}

.section-description {
  margin: 0 0 20px;
  color: $text-secondary;
  font-size: 14px;
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
  text-align: left;
  cursor: pointer;
  background: var(--glass-80);
  border: 2px solid $border-color;
  border-radius: 12px;
  transition: all $transition-duration ease;

  &:hover {
    background: $white;
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(
      135deg,
      rgba(0, 122, 255, 0.1),
      rgba(0, 122, 255, 0.05)
    );
    border-color: $primary-blue;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  }
}

.mode-option {
  flex-direction: column;
  align-items: stretch;
}

.language-flag {
  margin-right: 16px;
  font-size: 32px;

  @media (max-width: 480px) {
    margin-right: 12px;
    font-size: 28px;
  }
}

.language-info {
  flex: 1;
}

.language-name,
.mode-option-label {
  color: $text-primary;
  font-size: 16px;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 14px;
  }
}

.language-name {
  margin-bottom: 4px;
}

.language-code,
.mode-option-description {
  color: $text-muted;
  font-size: 12px;

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

.language-check,
.mode-option-check {
  color: $primary-blue;
  font-size: 24px;
  font-weight: bold;
}

.mode-option-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mode-option-description {
  color: $text-secondary;
  font-size: 13px;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 11px;
  }
}

```

