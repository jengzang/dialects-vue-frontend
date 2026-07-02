<template>
  <div class="about-page-wrapper">
    <TabsContainer
      :tabs="tabs"
      :model-value="currentTab"
      :route-value="currentTab"
      :resolve-route="resolveTabRoute"
    >
      <template #default="{ currentTab }">
        <!-- 新的"簡介"页面 -->
        <div v-if="currentTab === 'intro'" class="thanks-container">
          <h2 class="tabs-title">{{ $t('about.intro.title') }}</h2>
          <p style=" text-align: left;">{{ $t('about.intro.description') }}</p>
          <ul class="customlist">
            <li>
              <span v-html="$t('about.intro.features.feature1.title')"></span>
              {{ $t('about.intro.features.feature1.description') }}
            </li>
            <li>
              <span v-html="$t('about.intro.features.feature2.title')"></span>
              {{ $t('about.intro.features.feature2.description') }}
            </li>
            <li>
              <span v-html="$t('about.intro.features.feature3.title')"></span>
              {{ $t('about.intro.features.feature3.description') }}
            </li>
            <li>
              <span v-html="$t('about.intro.features.feature4.title')"></span>
              {{ $t('about.intro.features.feature4.description') }}
            </li>
            <li v-html="$t('about.intro.features.feature5.title')"></li>
            <li>
              <span v-html="$t('about.intro.features.feature6.title')"></span>
              {{ $t('about.intro.features.feature6.description') }}
            </li>
            <li v-html="$t('about.intro.features.blueText')"></li>
            <li>{{ $t('about.intro.features.mapClick') }}</li>
          </ul>

          <ul v-if="false" class="customlist">
            <li>功能1：<strong>查中古</strong>（按中古地位整理讀音）。
              使用者可輸入各種組合進行分析，目前支持攝、韻、等、呼、調、系、組、母、清濁、發音部位、發聲方式等類別。
              網站會按輸入的組合分析聲母/韻母/聲調，並把結果呈現在表格和地圖中。</li>
            <li>功能2：<strong>查音位</strong>（分析音位的中古來源）。
              使用者可輸入上述類別，網站會分析輸入的音值（音位）對應字的中古來源，並把結果呈現在表格和地圖中。</li>
            <li>功能3：<strong>查調</strong>（查詢調值、調類）。
              網站會根據用戶選擇的分區、地點，整理調值、調類，不同的調類標上了不同的顏色。</li>
            <li>功能4：<strong>查字</strong>（查詢字音、地位）。
              根據用戶輸入漢字進行查詢，最終呈現各個地點的音值、注釋以及漢字中古地位</li>
            <li v-html="$t('about.intro.features.feature5.title')"></li>
            <li>功能6：<strong>自定義繪圖</strong>（用戶添加個人數據進行繪圖）。
              用戶可以自己在地圖上選點、標註，網站會根據特徵值自定分配顏色</li>
            <li v-html="$t('about.intro.features.blueText')"></li>
            <li>{{ $t('about.intro.features.mapClick') }}</li>
          </ul>

          <p style=" text-align: left;font-weight: bold;text-decoration: underline">{{ $t('about.intro.footer') }}</p>

          <!-- 感悟部分 -->
          <h2 class="tabs-title" style="margin-top: 20px">{{ $t('about.reflection.title') }}</h2>
          <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph1') }}</p>
          <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph2') }}</p>
          <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph3') }}</p>
          <p class="thoughts"><em v-html="$t('about.reflection.poem')"></em></p>

          <h2 class="tabs-title" style="margin-top: 20px">🙏 {{ $t('about.thanks.title') }}</h2>
          <ul class="thanks-list">
            <li>
              ✔ <a href="https://mcpdict.vear.vip/" target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.mcpdict') }}</a>
              - {{ $t('about.thanks.mcpdictDesc') }}<a href="https://github.com/osfans/MCPDict/tree/master/tools/tables/output"
                                                       target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.mcpdictData') }}</a>
            </li>
            <li>
              ✔ <a href="https://jyutjam.org/" target="_blank" rel="noopener noreferrer"
                   class="thanks-link">{{ $t('about.thanks.jyutjam') }}</a> - {{ $t('about.thanks.jyutjamDesc') }}<a href="https://jyutdict.org/"
                                                                                                                    target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.jyutdict') }}</a>
            </li>
            <li>
              ✔ <a href="https://zhongguoyuyan.cn/" target="_blank" rel="noopener noreferrer"
                   class="thanks-link">{{ $t('about.thanks.yuyan') }}</a> - {{ $t('about.thanks.yuyanDesc') }}
            </li>
            <li>
              ✔ <a href="https://xiaoxue.iis.sinica.edu.tw/ccrdata/" target="_blank" rel="noopener noreferrer"
                   class="thanks-link">{{ $t('about.thanks.xiaoxue') }}</a> - {{ $t('about.thanks.xiaoxueDesc') }}
            </li>
            <li>
              ✔ <a href="http://1.14.238.88:8099/dialect/main/about.html" target="_blank" rel="noopener noreferrer"
                   class="thanks-link">{{ $t('about.thanks.yuemin') }}</a> - {{ $t('about.thanks.yueminDesc') }}
            </li>
            <li>
              ✔ <a href="#" class="thanks-link">{{ $t('about.thanks.testers') }}</a> - {{ $t('about.thanks.testersDesc') }}
            </li>
            <li style="margin-bottom: 0">
              ✔ <a href="#" class="thanks-link">{{ $t('about.thanks.friends') }}</a> - {{ $t('about.thanks.friendsDesc') }}
            </li>
            <li>
              ✔ <a href="#" class="thanks-link">{{ $t('about.thanks.you') }}</a> - {{ $t('about.thanks.youDesc') }}
            </li>
          </ul>
          <p style="font-size:2rem;margin-top:0.5rem;margin-bottom: 3rem">💖🌟🥳</p>
        </div>

        <!-- 新的"建議"页面 -->
        <div v-if="currentTab === 'suggestion'" class="page2">
          <div class="suggestion-box">
            <h2 class="tabs-title">💬 {{ $t('about.suggestion.title') }}</h2>
            <p v-html="$t('about.suggestion.description')"></p>
            <p class="subtext">👇 {{ $t('about.suggestion.subtext') }}</p>
            <div class="card-links">
              <a
                href="https://github.com/jengzang/dialects-js-frontend/issues"
                target="_blank"
                rel="noopener"
                class="card"
              >
                <span v-html="$t('about.suggestion.frontend.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.frontend.link') }}</span>
              </a>
              <a
                href="https://github.com/jengzang/dialects-build/issues"
                target="_blank"
                rel="noopener"
                class="card"
              >
                <span v-html="$t('about.suggestion.backend.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.backend.link') }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 新的"喜歡"页面 -->
        <div v-if="currentTab === 'like'" class="cards-container">
          <h2 class="tabs-title like-author-title">
            {{ $t('about.like.title') }}
            <button class="follow-button" @click="followClicked">
              {{ $t('about.like.followButton') }}
            </button>
          </h2>
          <p style="display: block; width: 100%; clear: both; margin: 0;">
            {{ $t('about.like.starMessage') }}
          </p>

          <a
            class="project-card"
            v-for="project in localizedProjects"
            :key="project.name"
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="card-header">
              <img class="github-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
              <span class="thanks-link" style="font-weight: bold">{{ project.name }}</span>
            </div>
            <p>{{ project.description }}</p>
            <div class="glow-border"></div>
          </a>

          <p style="margin-top: 2rem">
            {{ $t('about.like.supportMessage') }}
            <br />
            <button class="support-button" @click="showQRCodes = true">
              🙌 {{ $t('about.like.supportButton') }}
            </button>
            <br />
            <span class="support-note">{{ $t('about.like.supportNote') }}</span>
          </p>
          <p></p>
          <p></p>
        </div>

        <!-- 设置页面 -->
        <div v-if="currentTab === 'setting'" class="settings-container">
        <!-- <h2 class="tabs-title">{{ $t('navigation.tabs.settings') }}</h2> -->

          <div class="setting-section">
            <h3 class="section-title">{{ $t('navigation.settings.language.title') }}</h3>
<!--          <p class="section-description">{{ $t('navigation.settings.language.description') }}</p>-->

          <div class="language-options">
            <div
              v-for="lang in languages"
              :key="lang.code"
              class="language-card"
              :class="{ active: currentLocale === lang.code }"
              @click="changeLanguage(lang.code)"
            >
              <!-- <div class="language-flag">{{ lang.flag }}</div> -->
              <div class="language-info">
                <div class="language-name">{{ lang.name }}</div>
                <div class="language-code">{{ lang.code }}</div>
              </div>
              <div v-if="currentLocale === lang.code" class="language-check">&check;</div>
            </div>
          </div>
          </div>

          <div class="setting-section">
            <h3 class="section-title">{{ $t('navigation.settings.characterTable.title') }}</h3>
            <p class="section-description">{{ $t('navigation.settings.characterTable.description') }}</p>

            <SimpleSelectDropdown
              v-model="currentCharacterTable"
              :options="characterTableOptions"
              width="100%"
            />
          </div>

          <div class="setting-section">
            <h3 class="section-title">{{ $t('navigation.settings.interfaceMode.title') }}</h3>
            <p class="section-description">{{ $t('navigation.settings.interfaceMode.description') }}</p>

            <RadioGroup
              v-model="interfaceModeModel"
              :options="interfaceModeRadioOptions"
              name="about-interface-mode"
              class="settings-radio-group interface-mode-radio-group"
            />
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
              color="#007aff"
              variant="solid"
              show-label
              :active-text="$t('about.settings.tutorialToggle.enabled')"
              :inactive-text="$t('about.settings.tutorialToggle.disabled')"
              label-position="inside"
              :gap="20"
              :aria-label="$t('about.settings.tutorialToggle.title')"
              class="tutorial-switch-toggle"
              @update:modelValue="tutorialGuideEnabled = $event"
            />
          </div>

        </div>
      </template>
    </TabsContainer>

    <SupportPopup
      :visible="showQRCodes"
      @close="showQRCodes = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { setLocale } from '@/i18n/index.js'
import { showSuccess } from '@/utils/message.js'
import SupportPopup from '@/main/components/popup/SupportPopup.vue'
import TabsContainer from '@/components/common/TabsContainer.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { TABLE_COLUMN_SCHEMAS } from '@/main/config/index.js'
import {
  UI_MODE_DEFAULT,
  UI_MODE_COMPACT,
  getStoredInterfaceMode,
  setInterfaceMode,
} from '@/composables/core/uiPreferences.js'
import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import {
  preferredCharacterTable,
  setPreferredCharacterTable,
  tutorialEnabled,
  setTutorialEnabled,
} from '@/main/store/store.js'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const showQRCodes = ref(false)

const pathSectionToTab = {
  intro: 'intro',
  suggestion: 'suggestion',
  like: 'like',
  settings: 'setting'
}

const tabToPathSection = {
  intro: 'intro',
  suggestion: 'suggestion',
  like: 'like',
  setting: 'settings'
}

const currentTab = computed(() => {
  const section = route.params.section
  if (typeof section === 'string' && pathSectionToTab[section]) {
    return pathSectionToTab[section]
  }

  return 'setting'
})

const tabs = computed(() => [
  { name: 'setting', label: t('about.tabs.setting') },
  { name: 'intro', label: t('about.tabs.intro') },
  { name: 'suggestion', label: t('about.tabs.suggestion') },
  { name: 'like', label: t('about.tabs.like') },
])

const localizedProjects = computed(() => [
  {
    name: 'dialects-vue-frontend',
    url: 'https://github.com/jengzang/dialects-vue-frontend',
    description: t('about.like.projects.frontend.description')
  },
  {
    name: 'dialects-backend',
    url: 'https://github.com/jengzang/dialects-backend',
    description: t('about.like.projects.backend.description')
  },
  {
    name: 'dialects-build',
    url: 'https://github.com/jengzang/dialects-build',
    description: t('about.like.projects.build.description')
  },
])

function followClicked() {
  window.open('https://www.zhihu.com/people/da-shu-18-11', '_blank')
}

// 语言设置相关
const currentLocale = computed(() => locale.value)

const languages = ref([
  { code: 'zh-Hant', name: '繁體中文', flag: '🇭🇰' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
])

const interfaceMode = ref(getStoredInterfaceMode())

const interfaceModeOptions = computed(() => [
  {
    value: UI_MODE_DEFAULT,
    label: t('navigation.settings.interfaceMode.options.default'),
    description: t('navigation.settings.interfaceMode.help.default')
  },
  {
    value: UI_MODE_COMPACT,
    label: t('navigation.settings.interfaceMode.options.compact'),
    description: t('navigation.settings.interfaceMode.help.compact')
  }
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

function changeLanguage(newLocale) {
  if (newLocale === currentLocale.value) {
    return
  }

  setLocale(newLocale)

  const targetPath = buildLocalePath(newLocale, stripLocaleFromPath(route.path))
  router.push({
    path: targetPath,
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

function resolveTabRoute(tabName) {
  const section = tabToPathSection[tabName] || 'setting'
  return {
    path: buildLocalePath(resolveRouteLocale(route), `/menu/about/${section}`),
    query: route.query
  }
}
</script>

<style lang="scss" scoped>
.about-page-wrapper {
  width: 100%;
  height: 100%;
}

/* === 內容區塊 === */
.tutorial-toggle-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.tutorial-toggle-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tutorial-switch-toggle {
  width: 100%;
  justify-content: flex-end;

  :deep(.switch-toggle__button) {
    font-weight: 700;

    &.is-on {
      background: #007aff;
      color: #fff;
    }
  }

  :deep(.switch-toggle__label--inside) {
    color: inherit;
    font-weight: 700;
    white-space: nowrap;
  }

  :deep(.switch-toggle__thumb) {
    box-shadow: 0 6px 14px rgba(38, 88, 137, 0.18);
  }
}

.page2 {
  display: flex;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 1dvw 8dvw;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  font-size: 18px;
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes breathing {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

p {
  margin-bottom: 20px;
  color: #333;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  line-height: 1.6;

  a {
    color: #007aff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  strong {
    padding: 2px 6px;
    border-radius: 4px;
    background-color: rgba(0, 122, 255, 0.1);
  }

  em.emoji {
    margin-left: 5px;
    font-size: 1.2em;
  }

  + p {
    margin-top: 8px;
  }
}

strong {
  color: #007aff;
  font-weight: bold;
}

em {
  font-style: italic;
}

.thanks-list {
  li {
    margin-bottom: 0.5rem;
  }
}

.customlist {
  margin-left: 20px;
  padding-left: 20px;
  color: #333;
  font-size: 16px;
  list-style-type: disc;

  ol {
    list-style-type: decimal;
  }

  ul {
    list-style-type: square;
  }

  li {
    margin-bottom: 6px;
    line-height: 1.5;
    text-align: left;

    a {
      color: #007aff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.thoughts {
  p {
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
    border-radius: 8px;
    color: #333;
    font-family: 'Georgia', serif;
    font-size: 18px;
    line-height: 1.8;
    text-align: left;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  em {
    color: #000;
    font-weight: bold;
    text-decoration: underline;
  }
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 800px;
  gap: 1rem;
  text-align: center;
}

.project-card {
  position: relative;
  z-index: 0;
  display: block;
  flex: 1 1 280px;
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  padding: 1.1rem;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 12px;
  background-color: #fff;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 2px 10px rgba(0, 122, 255, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 0 12px rgba(63, 142, 255, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    border-radius: 14px;
    background: linear-gradient(45deg, #7ec8ff, #d0eaff, #7ec8ff);
    background-size: 400% 400%;
    filter: blur(4px);
    opacity: 0.5;
    animation: breathing 6s ease infinite;
  }

  p {
    margin: 0.5rem 0.5rem 0.2rem;
    color: #444;
    font-size: 1rem;
    line-height: 1.6;
    white-space: nowrap;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: #3f8eff;
  font-size: 1.2rem;
  font-weight: bold;
}

.github-icon {
  width: 22px;
  height: 22px;
  margin-right: 0.5rem;
}

.like-author-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.follow-button,
.support-button {
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.follow-button {
  padding: 0.4rem 0.9rem;
  background-color: #3f8eff;
  font-size: 1.2rem;
  box-shadow: 0 2px 5px rgba(63, 142, 255, 0.3);
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;

  &:hover {
    background-color: #5fa4ff;
    transform: scale(1.05);
  }
}

.support-button {
  margin-top: 1rem;
  padding: 0.5rem 1.1rem;
  background-color: #c52f27;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.35);
  transition: all 0.2s ease;

  &:hover {
    background-color: #ff615c;
    transform: scale(1.05);
  }
}

.support-note {
  display: inline-block;
  max-width: 500px;
  margin-top: 0.5rem;
  color: #555;
  font-size: 0.88rem;
  line-height: 1.5;
}

.suggestion-box {
  max-width: 700px;
  margin: 0 auto;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  text-align: center;
  justify-content: center;

  p {
    margin: 8px 0;
    color: #6b7280;
    font-size: 18px;
  }
}

.subtext {
  color: #9ca3af;
  font-size: 15px;
}

.card-links {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 16px;
  background: linear-gradient(to bottom right, #b7cffa, #fff);
  backdrop-filter: blur(4px);
  color: #000;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(0, 122, 255, 0.1);
  transform: scale(1);
  transition: all 0.3s ease;

  &:hover {
    border-color: #007aff;
    background: linear-gradient(to bottom right, #a5c1f6, #fff);
    box-shadow: 0 10px 20px rgba(0, 122, 255, 0.2);
    transform: scale(1.02) translateY(-2px);
  }

  span {
    margin-top: 10px;
    color: #003cff;
    font-size: 15px;
    text-decoration: underline;
    transition: color 0.3s ease;
  }
}

/* === 设置页面样式 === */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.setting-section {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 8px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.section-description {
  margin: 0 0 20px;
  color: #666;
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

.language-radio-group {
  :deep(.liquid-radio-text) {
    font-size: 15px;
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
}

.language-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #007aff;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #007aff;
    background: linear-gradient(
      135deg,
      rgba(0, 122, 255, 0.1),
      rgba(0, 122, 255, 0.05)
    );
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  }
}

.language-flag {
  margin-right: 12px;
  font-size: 32px;
}

.language-info {
  display: flex;
  gap: 12px;
}

.language-name {
  margin-bottom: 4px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.language-code {
  color: #999;
  font-size: 12px;
}

.language-check {
  margin-left: 20px;
  color: #007aff;
  font-size: 24px;
  font-weight: bold;
}

/* === 竖屏 / 移动端：按宽高比判断 === */
@media (max-aspect-ratio: 1/1) {
  .tutorial-toggle-section {
    align-items: flex-start;
    gap: 12px;
  }

  .tutorial-toggle-copy {
    gap: 4px;
  }

  .tutorial-switch-toggle {
    width: 100%;
    justify-content: flex-end;
  }

  .page2 {
    max-width: none;
    padding: 10px 14px;
    font-size: 16px;
  }

  p {
    margin-bottom: 14px;
    font-size: 15px;
    line-height: 1.55;
  }

  .customlist {
    margin-left: 14px;
    padding-left: 16px;
    font-size: 15px;

    li {
      margin-bottom: 4px;
      line-height: 1.45;
    }
  }

  .thoughts {
    p {
      margin: 24px auto;
      padding: 14px;
      font-size: 16px;
      line-height: 1.65;
    }
  }

  .cards-container {
    gap: 12px;
  }

  .project-card {
    flex-basis: 100%;
    max-width: 100%;
    padding: 14px;

    p {
      margin: 6px 4px 2px;
      font-size: 15px;
      line-height: 1.45;
      white-space: normal;
    }
  }

  .card-header {
    margin-bottom: 6px;
    font-size: 18px;
  }

  .github-icon {
    width: 22px;
    height: 22px;
    margin-right: 6px;
  }

  .like-author-title {
    gap: 8px;
  }

  .follow-button {
    padding: 6px 12px;
    font-size: 16px;
  }

  .support-button {
    margin-top: 12px;
    padding: 7px 14px;
    font-size: 15px;
  }

  .support-note {
    font-size: 13px;
  }

  .suggestion-box {
    max-width: 100%;

    p {
      margin: 6px 0;
      font-size: 16px;
    }
  }

  .subtext {
    font-size: 13px;
  }

  .card-links {
    gap: 12px;
    margin-top: 16px;
  }

  .card {
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 16px;

    span {
      margin-top: 6px;
      font-size: 13px;
    }
  }

  .settings-container {
    padding: 12px;
  }

  .setting-section {
    margin-bottom: 14px;
    padding: 16px;
    border-radius: 14px;
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

  .language-radio-group {
    :deep(.liquid-radio-text) {
      font-size: 14px;
    }
  }

  .interface-mode-radio-group {
    :deep(.liquid-radio-text) {
      font-size: 13px;
    }
  }

  .language-options {
    flex-wrap: wrap;
    gap: 8px;
  }

  .language-card {
    padding: 10px 12px;
    border-width: 1.5px;
  }

  .language-flag {
    margin-right: 8px;
    font-size: 26px;
  }

  .language-info {
    gap: 2px;
    align-items: center;
    flex-direction: column;
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
}
</style>