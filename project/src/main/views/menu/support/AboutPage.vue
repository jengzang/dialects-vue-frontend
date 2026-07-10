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
            <li v-for="(feature, idx) in featureList" :key="idx" class="feature-item">
              <h3 class="feature-heading">{{ feature.heading }}</h3>
              <p class="feature-subtitle">{{ feature.subtitle }}</p>
              <p class="feature-intro">{{ feature.intro }}</p>
              <ul v-if="feature.items.length" class="subfeature-list">
                <li
                  v-for="(item, i) in feature.items"
                  :key="i"
                  class="subfeature-item"
                >
                  <h4 class="subfeature-title">{{ item.title }}</h4>
                  <p class="subfeature-body">{{ item.body }}</p>
                </li>
              </ul>
              <a v-if="feature.zhihuLink" :href="feature.zhihuLink" target="_blank" rel="noopener" class="zhihu-article-link">{{ $t('about.intro.readZhihuArticle') }}</a>
            </li>
            <p style="text-align: left;">
              <a href="https://zhuanlan.zhihu.com/p/1934345780199682731" target="_blank" rel="noopener" class="zhihu-article-link">{{ $t('about.intro.oldSiteZhihuArticle') }}</a>
            </p>
            <!-- <li v-html="$t('about.intro.features.blueText')"></li>
            <li v-html="$t('about.intro.features.mapClick')"></li> -->
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
                <img class="card-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
                <span v-html="$t('about.suggestion.frontend.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.frontend.link') }}</span>
              </a>
              <a
                href="https://github.com/jengzang/dialects-build/issues"
                target="_blank"
                rel="noopener"
                class="card"
              >
                <img class="card-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
                <span v-html="$t('about.suggestion.backend.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.backend.link') }}</span>
              </a>
              <a
                href="https://www.zhihu.com/project/detail/60225"
                target="_blank"
                rel="noopener"
                class="card"
              >
                <img class="card-icon" src="https://static.zhihu.com/heifetz/favicon.ico" alt="Zhihu" />
                <span v-html="$t('about.suggestion.zhihu.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.zhihu.link') }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 新的"喜歡"页面 -->
        <div v-if="currentTab === 'like'" class="cards-container">
          <h2 class="tabs-title like-author-title">
            {{ $t('about.like.title') }}
            <span class="follow-buttons">
              <button class="follow-button zhihu-follow" @click="followClicked">
                <img
                  class="follow-logo"
                  src="https://static.zhihu.com/heifetz/favicon.ico"
                  alt="Zhihu"
                  @error="e => e.target.src = zhihuFallback"
                />
                {{ $t('about.like.followButton') }}
              </button>
              <a class="follow-button github-follow" href="https://github.com/jengzang" target="_blank" rel="noopener noreferrer">
                <img
                  class="follow-logo"
                  src="https://github.githubassets.com/favicons/favicon-dark.svg"
                  alt="GitHub"
                  @error="e => e.target.src = githubFallback"
                />
                GitHub
              </a>
            </span>
          </h2>
          <p style="display: block; width: 100%; clear: both; margin: 0 0 0.8rem;">
            {{ $t('about.like.starMessage') }}
          </p>
          <a
            class="project-card"
            v-for="project in githubProjects"
            :key="project.name"
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="card-header">
              <img class="github-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
              <span class="thanks-link" style="font-weight: bold">{{ project.name }}</span>
            </div>
            <p :title="project.description">{{ splitDesc(project.description)[0] }}<span class="desc-sub">{{ splitDesc(project.description)[1] }}</span></p>
            <div class="glow-border"></div>
          </a>

          <p style="display: block; width: 100%; clear: both; margin: 1.2rem 0 0.8rem;">
            {{ $t('about.like.zhihuLike') }}
          </p>
          <a
            class="project-card"
            v-for="project in zhihuProjects"
            :key="project.name"
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="card-header">
              <img class="github-icon" src="https://static.zhihu.com/heifetz/favicon.ico" alt="Zhihu" />
              <span class="thanks-link" style="font-weight: bold">{{ project.name }}</span>
            </div>
            <p :title="project.description">{{ splitDesc(project.description)[0] }}<span class="desc-sub">{{ splitDesc(project.description)[1] }}</span></p>
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

          <!-- 感悟部分 -->
          <div class="thoughts-container">
            <h2 class="tabs-title" style="margin-top: 20px">{{ $t('about.reflection.title') }}</h2>
            <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph1') }}</p>
            <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph2') }}</p>
            <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph3') }}</p>
            <p class="thoughts"><em v-html="$t('about.reflection.poem')"></em></p>
          </div>
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
              <!-- <p class="section-description">{{ $t('about.settings.zhongguInputMode.description') }}</p> -->
              <RadioGroup
                v-model="zhongguInputModeModel"
                :options="zhongguInputModeOptions"
                name="about-zhonggu-input-mode"
                class="settings-radio-group"
              />
            </div>
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
              color="var(--color-primary)"
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
import i18n, { setLocale } from '@/i18n/index.js'
import { showSuccess } from '@/utils/message.js'
import SupportPopup from '@/main/components/popup/SupportPopup.vue'
import TabsContainer from '@/components/common/TabsContainer.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
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
  zhongguInputMode,
  setZhongguInputMode,
} from '@/main/store/store.js'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const showQRCodes = ref(false)

const zhihuFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0066FF"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">知</text></svg>')
const githubFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#24292f"/><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.78.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" fill="white"/></svg>')

const featureList = computed(() => {
  const messages = i18n.global.messages.value[locale.value]
  return Array.from({ length: 9 }, (_, i) => {
    const n = i + 1
    const f = messages.about.intro.features[`feature${n}`]
    return {
      heading: f.heading,
      subtitle: f.subtitle,
      intro: f.intro,
      items: f.items || [],
      zhihuLink: f.zhihuLink || '',
    }
  })
})

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
    description: t('about.like.projects.frontend.description'),
    icon: 'github'
  },
  {
    name: 'dialects-backend',
    url: 'https://github.com/jengzang/dialects-backend',
    description: t('about.like.projects.backend.description'),
    icon: 'github'
  },
  {
    name: 'dialects-build',
    url: 'https://github.com/jengzang/dialects-build',
    description: t('about.like.projects.build.description'),
    icon: 'github'
  },
  {
    name: t('about.like.projects.zhihuProject.name'),
    url: 'https://www.zhihu.com/project/detail/60225',
    description: t('about.like.projects.zhihuProject.description'),
    icon: 'zhihu'
  },
  {
    name: t('about.like.projects.zhihuColumn.name'),
    url: 'https://www.zhihu.com/column/c_1899090664681080236',
    description: t('about.like.projects.zhihuColumn.description'),
    icon: 'zhihu'
  },
])

const githubProjects = computed(() => localizedProjects.value.filter(p => p.icon !== 'zhihu'))
const zhihuProjects = computed(() => localizedProjects.value.filter(p => p.icon === 'zhihu'))

function followClicked() {
  window.open('https://www.zhihu.com/people/da-shu-18-11', '_blank')
}

function splitDesc(text) {
  const idx = text.indexOf(' - ')
  return idx === -1 ? [text, ''] : [text.slice(0, idx), text.slice(idx)]
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

const zhongguInputModeModel = computed({
  get: () => zhongguInputMode.value,
  set: (mode) => setZhongguInputMode(mode)
})

const zhongguInputModeOptions = computed(() => [
  {
    value: 'selector',
    label: t('about.settings.zhongguInputMode.options.selector')
  },
  {
    value: 'direct',
    label: t('about.settings.zhongguInputMode.options.direct')
  }
])

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

```scss

$primary: var(--color-primary);
$zhihu-blue: #0066ff;
$github-dark: #24292f;
$danger: var(--color-error);

$text-primary: var(--text-dark);
$text-heading: var(--text-primary);
$text-secondary: var(--text-medium);
$text-muted: var(--text-tertiary);
$text-light: var(--text-lightest);

$ease-standard: 0.3s ease;

@mixin glass-blur($amount: 6px) {
  backdrop-filter: blur($amount);
  -webkit-backdrop-filter: blur($amount);
}

@mixin glass-card(
  $background: var(--glass-40),
  $border: var(--glass-40)
) {
  background: $background;
  border: 1px solid $border;

  @include glass-blur;
}

.tabs-title {
  width: 100%;
  margin-top: 3rem !important;
  margin-bottom: 0.5rem !important;
  font-size: 1.8rem;
  font-weight: bold;
}

.about-page-wrapper {
  width: 100%;
  height: 100%;
}

/* 教程开关 */
.tutorial-toggle-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.tutorial-toggle-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
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

/* 建议页面 */
.page2 {
  max-width: 500px;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  padding: 1dvw 8dvw;
  background: var(--glass-05);
  border: 1px solid var(--glass-10);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  font-size: 18px;

  @include glass-blur(8px);
}

/* 通用正文 */
p {
  margin-bottom: 20px;
  color: $text-primary;
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;

  a {
    color: $primary;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  strong {
    padding: 2px 6px;
    background-color: rgba(0, 122, 255, 0.1);
    border-radius: 4px;
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
  color: $primary;
  font-weight: bold;
}

em {
  font-style: italic;
}

/* 简介与鸣谢 */
.thanks-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--text-primary);
}

.thanks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.8;

  li {
    margin-bottom: 0.5rem;
  }
}

.thanks-link {
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  position: relative;
  transition: all 0.3s ease;

  &::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0%;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-cyan));
    transition: width 0.3s ease, left 0.3s ease;
  }

  &:hover {
    color: var(--color-primary-hover);
    transform: scale(1.05);

    &::after {
      width: 100%;
      left: 0;
    }
  }
}

@media (max-width: 768px) {
  .thanks-list {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .thanks-list {
    font-size: 1.35rem;
  }
}

.customlist {
  margin-left: 20px;
  padding-left: 20px;
  color: $text-primary;
  font-size: 16px;
  list-style-type: none;

  ol {
    list-style-type: decimal;
  }

  ul {
    list-style-type: none;
  }

  li {
    margin-bottom: 6px;
    line-height: 1.5;
    text-align: left;

    a {
      color: $primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.feature-item {
  margin-bottom: 24px !important;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.feature-heading {
  margin: 0 0 4px;
  color: $text-heading;
  font-size: 18px;
  font-weight: 700;
}

.feature-subtitle {
  margin: 0 0 6px;
  color: $primary;
  font-size: 14px;
  font-weight: 500;
}

.feature-intro {
  margin: 0 0 12px;
  color: $text-secondary;
  font-size: 15px;
  line-height: 1.6;
}

.zhihu-article-link {
  display: inline-block;
  margin-top: 8px;
  color: $zhihu-blue;
  font-size: 14px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.subfeature-list {
  margin: 8px 0 0 16px;
  padding: 0;
}

.subfeature-item {
  margin-bottom: 10px !important;
}

.subfeature-title {
  margin: 0 0 2px;
  color: var(--text-deep);
  font-size: 15px;
  font-weight: 600;
}

.subfeature-body {
  margin: 0;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.65;
}

/* 感悟 */
.thoughts {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: transparent;
  border-radius: 8px;
  color: $text-primary;
  font-family: Georgia, serif;
  font-size: 18px;
  line-height: 1.8;
  text-align: left;
  text-indent: 2em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  em {
    color: var(--text-primary);
    font-weight: bold;
    text-decoration: underline;
  }
}

.thoughts-container {
  width: 100%;
  max-width: 800px;
}

/* 项目卡片 */
.cards-container {
  max-width: 1000px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

.project-card {
  position: relative;
  flex: 1 1 280px;
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 1.1rem;
  box-sizing: border-box;

  @include glass-card;

  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 122, 255, 0.08);
  color: inherit;
  text-decoration: none;
  transition:
    transform $ease-standard,
    box-shadow $ease-standard;

  &:hover {
    background: var(--glass-80);
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
    transform: translateY(-6px) scale(1.01);
  }

  p {
    margin: 0.5rem 0.5rem 0.2rem;
    overflow: hidden;
    color: var(--text-dark);
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 1rem;
    line-height: 1.6;
  }

  .desc-sub {
    color: $text-light;
    font-size: 0.85em;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
  font-size: 1.2rem;
  font-weight: bold;
}

.github-icon {
  width: 22px;
  height: 22px;
  margin-right: 0.5rem;
}

/* 关注与支持按钮 */
.like-author-title {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.follow-buttons {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.follow-button,
.support-button {
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.follow-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  font-size: 1.2rem;
  text-decoration: none;
  transition:
    background-color $ease-standard,
    transform 0.2s ease;
}

.follow-logo {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.zhihu-follow {
  background: rgba(0, 102, 255, 0.12);
  border: 1px solid rgba(0, 102, 255, 0.25);
  box-shadow: none;
  color: $zhihu-blue;

  @include glass-blur;

  &:hover {
    background: rgba(0, 102, 255, 0.22);
    transform: scale(1.05);
  }
}

.github-follow {
  background-color: $github-dark;
  box-shadow: 0 2px 5px rgba(36, 41, 47, 0.3);
  color: var(--text-white);

  &:hover {
    background-color: var(--text-dark);
    transform: scale(1.05);
  }
}

.support-button {
  margin-top: 1rem;
  padding: 0.5rem 1.1rem;
  background-color: $danger;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.35);
  color: var(--text-white);
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-error-light);
    transform: scale(1.05);
  }
}

.support-note {
  display: inline-block;
  max-width: 500px;
  margin-top: 0.5rem;
  color: $text-secondary;
  font-size: 0.88rem;
  line-height: 1.5;
}

/* 建议入口 */
.suggestion-box {
  max-width: 700px;
  margin: 0 auto;
  justify-content: center;
  color: var(--text-deep);
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
  text-align: center;

  p {
    margin: 10px 0;
    color: var(--text-secondary);
    font-size: 18px;
  }
}

.subtext {
  color: var(--text-tertiary);
  font-size: 16px;
}

.card-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}

.card {
  position: relative;
  flex: 1 1 200px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow: hidden;

  @include glass-card;

  border-radius: 16px;
  box-shadow: 0 6px 12px rgba(0, 122, 255, 0.1);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transform: scale(1);
  transition: all $ease-standard;

  &:hover {
    background: var(--glass-80);
    border-color: rgba(0, 122, 255, 0.35);
    box-shadow: 0 10px 20px rgba(0, 122, 255, 0.2);
    transform: scale(1.02) translateY(-2px);
  }

  span {
    margin-top: 10px;
    font-size: 15px;
    transition: color $ease-standard;
  }
}

.card-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-bottom: 4px;
}

/* 设置页面 */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.setting-section {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 16px;
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

.interface-mode-radio-group {
  :deep(.liquid-radio-text) {
    font-size: 14px;
  }
}

/* 语言设置 */
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
  background: var(--glass-80);
  border: 2px solid var(--border-light-gray);
  border-radius: 12px;
  cursor: pointer;
  transition: all $ease-standard;

  &:hover {
    background: var(--bg-white);
    border-color: $primary;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(
      135deg,
      rgba(0, 122, 255, 0.1),
      rgba(0, 122, 255, 0.05)
    );
    border-color: $primary;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
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
  color: $text-light;
  font-size: 12px;
}

.language-check {
  margin-left: 20px;
  color: $primary;
  font-size: 24px;
  font-weight: bold;
}

/* 竖屏 */
@media (max-aspect-ratio: 1 / 1) {
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

  .feature-heading {
    font-size: 17px;
  }

  .feature-subtitle {
    font-size: 13px;
  }

  .feature-intro {
    font-size: 14px;
  }

  .zhihu-article-link {
    font-size: 13px;
  }

  .subfeature-list {
    margin-left: 12px;
  }

  .subfeature-title {
    font-size: 14px;
  }

  .subfeature-body {
    font-size: 13px;
    line-height: 1.55;
  }

  .thoughts {
    margin: 24px auto;
    padding: 14px;
    font-size: 16px;
    line-height: 1.65;
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
      white-space: normal;
      font-size: 15px;
      line-height: 1.45;
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

  .follow-logo {
    width: 16px;
    height: 16px;
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
      margin: 8px 0;
      font-size: 16px;
    }
  }

  .subtext {
    font-size: 14px;
  }

  .card-links {
    gap: 12px;
    margin-top: 16px;
  }

  .card {
    flex: 1 1 100%;
    min-width: 0;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 16px;

    span {
      margin-top: 6px;
      font-size: 13px;
    }
  }

  .card-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 2px;
  }

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
    flex-wrap: wrap;
    gap: 8px;
  }

  .language-card {
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
}

```
