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
              <div class="language-flag">{{ lang.flag }}</div>
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
import { SUPPORTED_LOCALES } from '@/i18n/localeDetector.js'
import { showSuccess } from '@/utils/message.js'
import SupportPopup from '@/main/components/popup/SupportPopup.vue'
import TabsContainer from '@/components/common/TabsContainer.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { TABLE_COLUMN_SCHEMAS } from '@/main/config/index.js'
import { preferredCharacterTable, setPreferredCharacterTable } from '@/main/store/store.js'

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

  return 'intro'
})

const tabs = computed(() => [
  { name: 'intro', label: t('about.tabs.intro') },
  { name: 'suggestion', label: t('about.tabs.suggestion') },
  { name: 'like', label: t('about.tabs.like') },
  { name: 'setting', label: t('about.tabs.setting') },
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
  window.open('https://www.zhihu.com/people/da-shu-18-11', '_blank');
}

// 语言设置相关
const currentLocale = computed(() => locale.value)

const languages = ref([
  SUPPORTED_LOCALES['zh-Hant'],
  SUPPORTED_LOCALES['zh-CN'],
  SUPPORTED_LOCALES['en']
])

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

function changeLanguage(newLocale) {
  if (newLocale === currentLocale.value) {
    return
  }
  setLocale(newLocale)
  showSuccess(t('messages.success.languageChanged'))
  setTimeout(() => window.location.reload(), 500)
}

function resolveTabRoute(tabName) {
  const section = tabToPathSection[tabName] || 'intro'
  return {
    path: `/menu/about/${section}`,
    query: route.query
  }
}
</script>

<style scoped>
.about-page-wrapper {
  width: 100%;
  height: 100%;
}

/* === 內容區塊 === */
.page2 {
  padding: 1dvw 8dvw;
  font-size: 18px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  justify-content: center;
  display: flex;
  margin: 0 auto;
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
.thanks-list li {
  margin-bottom: 0.5rem;
}
p {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}

strong {
  font-weight: bold;
  color: #007aff;
}

em {
  font-style: italic;
}

p a {
  color: #007aff;
  text-decoration: none;
}

p a:hover {
  text-decoration: underline;
}

p + p {
  margin-top: 8px;
}

p strong {
  background-color: rgba(0, 122, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

p em.emoji {
  font-size: 1.2em;
  margin-left: 5px;
}

.customlist {
  list-style-type: disc;
  margin-left: 20px;
  padding-left: 20px;
  font-size: 16px;
  color: #333;
}

.customlist ol {
  list-style-type: decimal;
}

.customlist ul {
  list-style-type: square;
}

.customlist li {
  margin-bottom: 6px;
  line-height: 1.5;
  text-align: left;
}

.customlist li a {
  color: #007aff;
  text-decoration: none;
}

.customlist li a:hover {
  text-decoration: underline;
}

.thoughts p {
  font-family: 'Georgia', serif;
  line-height: 1.8;
  font-size: 18px;
  color: #333;
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align:left;
}

.thoughts em {
  font-weight: bold;
  text-decoration: underline;
  color: #000000;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  text-align: center;
  max-width: 800px;
}

.project-card {
  position: relative;
  display: block;
  flex: 1 1 280px;
  max-width: 320px;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1.1rem;
  box-shadow: 0 2px 10px rgba(0, 122, 255, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  z-index: 0;
  border: 2px solid transparent;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

.project-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 0 12px rgba(63, 142, 255, 0.2);
}

.project-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 14px;
  background: linear-gradient(45deg, #7ec8ff, #d0eaff, #7ec8ff);
  background-size: 400% 400%;
  animation: breathing 6s ease infinite;
  z-index: -1;
  filter: blur(4px);
  opacity: 0.5;
}

@keyframes breathing {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #3f8eff;
}

.github-icon {
  width: 22px;
  height: 22px;
  margin-right: 0.5rem;
}

.project-card p {
  color: #444;
  line-height: 1.6;
  margin: 0.5rem 0.5rem 0.2rem;
  font-size: 1rem;
  white-space: nowrap;
}

.like-author-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.follow-button {
  background-color: #3f8eff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(63, 142, 255, 0.3);
}

.follow-button:hover {
  background-color: #5fa4ff;
  transform: scale(1.05);
}

.support-button {
  margin-top: 1rem;
  background-color: #c52f27;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.1rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.35);
  transition: all 0.2s ease;
}

.support-button:hover {
  background-color: #ff615c;
  transform: scale(1.05);
}

.support-note {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.5;
  max-width: 500px;
}

@media (max-width: 600px) {
  .project-card {
    padding: 1.2rem;
  }

  .card-header {
    font-size: 1.4rem;
  }

  .project-card p {
    font-size: 1.1rem;
  }

  .github-icon {
    width: 24px;
    height: 24px;
  }
}

.suggestion-box {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  color: #1f2937;
  justify-content: center;
}

.suggestion-box p {
  font-size: 18px;
  color: #6b7280;
  margin: 8px 0;
}

.subtext {
  font-size: 15px;
  color: #9ca3af;
}

.card-links {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom right, #b7cffa, #ffffff);
  padding: 20px;
  border-radius: 16px;
  text-decoration: none;
  color: black;
  font-weight: 600;
  font-size: 18px;
  box-shadow: 0 6px 12px rgba(0, 122, 255, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transform: scale(1);
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 122, 255, 0.2);
  border-color: #007aff;
  background: linear-gradient(to bottom right, #a5c1f6, #ffffff);
}

.card span {
  font-size: 15px;
  color: #003cff;
  margin-top: 10px;
  text-decoration: underline;
  transition: color 0.3s ease;
}

@media (max-width: 600px) {
  .card-links {
    gap: 16px;
  }

  .card {
    font-size: 18px;
    padding: 20px;
  }

  .suggestion-box p {
    font-size: 18px;
  }
}

/* 设置页面样式 */
.settings-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.setting-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
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

.language-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.language-card {
  justify-content: center;
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-card:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #007aff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.language-card.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05));
  border-color: #007aff;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.language-flag {
  font-size: 32px;
  margin-right: 16px;
}

.language-info {
  display: flex;
  gap:12px;
  flex-direction: row;
}

.language-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.language-code {
  font-size: 12px;
  color: #999;
}

.language-check {
  font-size: 24px;
  color: #007aff;
  font-weight: bold;
  margin-left: 20px;
}

/* 响应式设计 */
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

  .language-name {
    font-size: 14px;
  }

  .language-code {
    font-size: 11px;
  }
}

</style>
