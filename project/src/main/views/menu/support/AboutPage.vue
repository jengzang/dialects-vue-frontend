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
          <h1 class="tabs-title">{{ $t('navigation.pageTitles.support.aboutIntro') }}</h1>
          <p style=" text-align: left;">{{ $t('about.intro.description') }}</p>
          <ul class="customlist">
            <li v-for="(feature, idx) in featureList" :key="idx" class="feature-item">
              <h3 class="feature-heading">
                <RouterLink v-if="feature.route" :to="localeTo(feature.route)" class="feature-link feature-heading-link">
                  {{ feature.heading }}
                </RouterLink>
                <span v-else>{{ feature.heading }}</span>
              </h3>
              <p class="feature-subtitle">
                <RouterLink v-if="feature.route" :to="localeTo(feature.route)" class="feature-link feature-subtitle-link">
                  {{ feature.subtitle }}
                </RouterLink>
                <span v-else>{{ feature.subtitle }}</span>
              </p>
              <p class="feature-intro">{{ feature.intro }}</p>
              <ul v-if="feature.items.length" class="subfeature-list">
                <li
                  v-for="(item, i) in feature.items"
                  :key="i"
                  class="subfeature-item"
                >
                  <h4 class="subfeature-title">
                    <RouterLink v-if="item.route" :to="localeTo(item.route)" class="feature-link subfeature-title-link">
                      {{ item.title }}
                    </RouterLink>
                    <span v-else>{{ item.title }}</span>
                  </h4>
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
            <h1 class="tabs-title">💬 {{ $t('navigation.pageTitles.support.aboutSuggestion') }}</h1>
            <p v-html="$t('about.suggestion.description')"></p>
            <p class="subtext">👇 {{ $t('about.suggestion.subtext') }}</p>
            <div class="card-links">
              <a
                href="https://github.com/jengzang/dialects-js-frontend/issues"
                target="_blank"
                rel="noopener"
                class="card glass-card"
                data-interactive="true"
              >
                <img class="card-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
                <span v-html="$t('about.suggestion.frontend.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.frontend.link') }}</span>
              </a>
              <a
                href="https://github.com/jengzang/dialects-build/issues"
                target="_blank"
                rel="noopener"
                class="card glass-card"
                data-interactive="true"
              >
                <img class="card-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
                <span v-html="$t('about.suggestion.backend.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.backend.link') }}</span>
              </a>
              <a
                href="https://www.zhihu.com/project/detail/60225"
                target="_blank"
                rel="noopener"
                class="card glass-card"
                data-interactive="true"
              >
                <img class="card-icon" src="https://static.zhihu.com/heifetz/favicon.ico" alt="Zhihu" />
                <span v-html="$t('about.suggestion.zhihu.title')"></span>
                <span class="thanks-link">👉 {{ $t('about.suggestion.zhihu.link') }}</span>
              </a>
            </div>
          </div>

          <div
            class="surface-panel suggestion-form-section"
            data-about-suggestion-form
          >
            <h2 class="tabs-title">{{ $t('layoutFooter.feedback.title') }}</h2>
            <form
              class="suggestion-page-form"
              @submit.prevent="submitSuggestionForm"
            >
              <div class="field feedback-category">
                <span>{{ $t('layoutFooter.feedback.category') }}</span>
                <SimpleSelectDropdown
                  v-model="suggestionCategory"
                  :options="suggestionCategoryOptions"
                  :disabled="isSubmittingSuggestion || isCapturingSuggestionScreenshot"
                  width="100%"
                />
              </div>

              <label class="field">
                <span>{{ $t('layoutFooter.feedback.titleLabel') }}</span>
                <input
                  v-model.trim="suggestionTitle"
                  class="glass-field"
                  name="title"
                  maxlength="200"
                  :placeholder="$t('layoutFooter.feedback.titlePlaceholder')"
                >
              </label>

              <label class="field">
                <span>{{ $t('layoutFooter.feedback.contentLabel') }}</span>
                <textarea
                  v-model.trim="suggestionContent"
                  class="glass-field"
                  name="content"
                  maxlength="5000"
                  rows="5"
                  :placeholder="$t('layoutFooter.feedback.contentPlaceholder')"
                />
              </label>

              <label class="field">
                <span>{{ $t('layoutFooter.feedback.contactLabel') }}</span>
                <input
                  v-model.trim="suggestionContact"
                  class="glass-field"
                  name="contact"
                  maxlength="200"
                  :placeholder="$t('layoutFooter.feedback.contactPlaceholder')"
                >
              </label>

              <CheckBox
                v-model="includeSuggestionScreenshot"
                class="screenshot-field"
                data-include-screenshot
              >
                {{ $t('layoutFooter.feedback.screenshot.label') }}
              </CheckBox>
              <p class="hint screenshot-hint">
                {{ $t('layoutFooter.feedback.screenshot.hint') }}
              </p>
              <div
                v-if="includeSuggestionScreenshot"
                class="surface-subpanel screenshot-preview"
              >
                <img
                  v-if="suggestionScreenshotDataUrl"
                  :src="suggestionScreenshotDataUrl"
                  :alt="$t('layoutFooter.feedback.screenshot.previewAlt')"
                >
                <span v-else>{{ $t('layoutFooter.feedback.screenshot.capturing') }}</span>
                <button
                  type="button"
                  class="glass-button screenshot-retake"
                  data-size="compact"
                  :disabled="isCapturingSuggestionScreenshot"
                  @click="captureSuggestionScreenshotPreview"
                >
                  {{ $t('layoutFooter.feedback.screenshot.retake') }}
                </button>
              </div>

              <div class="suggestion-form-actions">
                <button
                  type="submit"
                  class="glass-button suggestion-submit-button"
                  data-variant="primary"
                  data-size="small"
                  data-submit-feedback
                  :disabled="isSubmittingSuggestion || isCapturingSuggestionScreenshot || !canSubmitSuggestion"
                >
                  {{ $t('layoutFooter.feedback.submit') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 新的"喜歡"页面 -->
        <div v-if="currentTab === 'like'" class="cards-container">
          <h1 class="tabs-title like-author-title">
            {{ $t('navigation.pageTitles.support.aboutLike') }}
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
          </h1>
          <p style="display: block; width: 100%; clear: both; margin: 0 0 0.8rem;">
            {{ $t('about.like.starMessage') }}
          </p>
          <a
            class="project-card glass-card"
            data-interactive="true"
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
            class="project-card glass-card"
            data-interactive="true"
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
            <h2 class="tabs-title" style="margin-top: 3rem">{{ $t('about.reflection.title') }}</h2>
            <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph1') }}</p>
            <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph2') }}</p>
            <p class="thoughts" style="text-align: left">{{ $t('about.reflection.paragraph3') }}</p>
            <p class="thoughts" style="text-align: center;"><em v-html="$t('about.reflection.poem')"></em></p>
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
import { useRoute } from 'vue-router'
import i18n from '@/i18n/index.js'
// import BarIcon from '@/components/common/BarIcon.vue'
import SupportPopup from '@/main/components/user/popups/SupportPopup.vue'
import TabsContainer from '@/components/common/TabsContainer.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { useSuggestionForm } from '@/composables/suggestions/useSuggestionForm.js'

const { t, locale } = useI18n()
const route = useRoute()
const showQRCodes = ref(false)

const suggestionPageContext = computed(() => ({
  path: route.path,
  fullPath: route.fullPath,
  query: route.query,
  hash: route.hash,
  locale: locale.value,
}))

const {
  category: suggestionCategory,
  title: suggestionTitle,
  content: suggestionContent,
  contact: suggestionContact,
  includeScreenshot: includeSuggestionScreenshot,
  screenshotDataUrl: suggestionScreenshotDataUrl,
  isSubmitting: isSubmittingSuggestion,
  isCapturingScreenshot: isCapturingSuggestionScreenshot,
  categoryOptions: suggestionCategoryOptions,
  canSubmit: canSubmitSuggestion,
  captureScreenshotPreview: captureSuggestionScreenshotPreview,
  submit: submitSuggestionForm,
} = useSuggestionForm({
  t,
  pageTitle: () => t('navigation.pageTitles.support.aboutSuggestion'),
  sourcePath: () => route.path,
  context: () => suggestionPageContext.value,
})

const zhihuFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0066FF"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">知</text></svg>')
const githubFallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#24292f"/><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.78.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" fill="white"/></svg>')

const featureRouteMap = {
  feature1: '/menu/query/zhonggu',
  feature2: '/menu/map/view',
  feature3: '/menu/compare/zhonggu',
  feature4: '/menu/pho/matrix',
  feature5: '/explore/char-class?tab=zhonggu',
  feature6: '/explore/tools/check',
  feature7: '/menu/yubao?tab=vocabulary',
  feature8: '/menu/villages',
  feature9: '/explore/tools/praat',
  feature10: '/menu/cluster'
}

const subfeatureRouteMap = {
  feature1: ['/menu/query/zhonggu', '/menu/query/yinwei', '/menu/query/char', '/menu/query/tone'],
  feature2: ['/menu/map/view', '/menu/map/divide', '/menu/map/custom', '/explore/gis'],
  feature3: ['/menu/compare/char', '/menu/compare/zhonggu', '/menu/compare/tone', '/menu/compare/phonetic'],
  feature4: ['/menu/pho/matrix', '/menu/pho/custom', '/menu/pho/count', '/menu/pho/evolution'],
  feature5: [
    '/explore/char-class?tab=zhonggu',
    '/explore/char-class?tab=shanggu',
    '/explore/char-class?tab=jingu',
    '/explore/char-class?tab=yueyun'
  ],
  feature6: ['/explore/tools/check', '/explore/tools/jyut2ipa', '/explore/tools/merge', '/explore/tools/derive'],
  feature7: ['/menu/yubao?tab=vocabulary', '/menu/yubao?tab=grammar', '/explore/yc/words'],
  feature8: [
    '/explore/villages/gd',
    '/explore/villages/toponyms',
    '/explore/villages/table',
    '/explore/yc/villages',
    '/explore/villages/ml'
  ],
  feature9: [
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat',
    '/explore/tools/praat'
  ],
  feature10: ['/menu/cluster']
}

const featureList = computed(() => {
  const messages = i18n.global.messages.value[locale.value]
  const featureKeys = Object.keys(messages.about.intro.features)
  return featureKeys.map((key) => {
    const f = messages.about.intro.features[key]
    return {
      heading: f.heading,
      subtitle: f.subtitle,
      intro: f.intro,
      route: featureRouteMap[key] || '',
      items: (f.items || []).map((item, index) => ({
        ...item,
        route: subfeatureRouteMap[key]?.[index] || ''
      })),
      zhihuLink: f.zhihuLink || '',
    }
  })
})

function localeTo(path) {
  return buildLocalePath(resolveRouteLocale(route), path)
}

const pathSectionToTab = {
  intro: 'intro',
  suggestion: 'suggestion',
  like: 'like'
}

const tabToPathSection = {
  intro: 'intro',
  suggestion: 'suggestion',
  like: 'like'
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

function resolveTabRoute(tabName) {
  const section = tabToPathSection[tabName] || 'intro'
  return {
    path: buildLocalePath(resolveRouteLocale(route), `/menu/about/${section}`),
    query: route.query
  }
}
</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$zhihu-blue: var(--color-primary);
$github-dark: #24292f;
$danger: var(--color-error);

$text-primary: var(--text-dark);
$text-heading: var(--text-primary);
$text-secondary: var(--text-medium);
$text-light: var(--text-lightest);

$ease-standard: 0.3s ease;@mixin glass-card(
  $background: var(--glass-40),
  $border: var(--glass-40)
) {
  background: $background;
  border: 1px solid $border;

  @include glass-blur(6px);
}

.tabs-title {
  width: 100%;
  margin-top: 1rem !important;
  margin-bottom: 0.5rem !important;
  font-size: 1.8rem;
  font-weight: bold;
}

.about-page-wrapper {
  width: 100%;
  height: 100%;
}

/* 建议页面 */
.page2 {
  @include flex-col;

  max-width: 500px;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  padding: 1dvw 8dvw;
  background: var(--glass-05);
  border: 1px solid var(--glass-10);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  font-size: 18px;

  @include glass-blur(8px);
}

/* 通用正文 */
p {
  margin-bottom: 20px;
  color: $text-primary;
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
    background-color: rgba(var(--color-primary-rgb), 0.1);
    border-radius: var(--radius-xs);
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
  font-family: var(--font-serif);
  font-weight: 500;
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

.feature-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
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
  border-radius: var(--radius-sm2);
  color: $text-primary;
  font-family: var(--font-serif);
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
  margin: 0 auto;
  padding: 2rem 1rem;
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
  background: var(--glass-70);

  // @include glass-card;

  // border-radius: var(--radius-md);
  box-shadow: 0 2px 10px rgba(var(--color-primary-rgb), 0.08);
  color: inherit;
  text-decoration: none;

  // &:hover {
    // background: var(--glass-80);
    // box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.15);
    // transform: translateY(-6px) scale(1.01);
  // }

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
  @include flex-center;
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
  border-radius: var(--radius-sm2);
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

  @include glass-blur(6px);

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
  box-shadow: 0 2px 6px rgba(var(--color-error-light-rgb), 0.35);
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
  font-family: var(--font-sans);
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
  @include flex-col;
  align-items: center;
  padding: 20px;
  overflow: hidden;
  // background: var(--glass-50);

  // @include glass-card;

  // border-radius: var(--radius-lg);
  // box-shadow: 0 6px 12px rgba(var(--color-primary-rgb), 0.1);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  // transform: scale(1);
  // transition: all $ease-standard;

  // &:hover {
  //   background: var(--glass-80);
  //   border-color: rgba(var(--color-primary-rgb), 0.35);
  //   box-shadow: 0 10px 20px rgba(var(--color-primary-rgb), 0.2);
  //   transform: scale(1.02) translateY(-2px);
  // }

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

.suggestion-form-section {
  @include flex-col;
  gap: 14px;
  max-width: 640px;
  margin: 28px auto 0;
  padding: 20px;
  text-align: left;

  .tabs-title {
    margin-bottom: 0;
  }
}

.suggestion-page-form {
  @include flex-col;
  gap: 12px;

  textarea {
    resize: vertical;
  }
}

.suggestion-page-form .field {
  @include flex-col;
  gap: 6px;
}

.suggestion-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.suggestion-submit-button {
  min-width: 96px;
}

.screenshot-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.screenshot-hint {
  margin: -6px 0 0;
}

.screenshot-preview {
  @include flex-col;
  gap: 8px;
  padding: 8px;
}

.screenshot-preview img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.screenshot-retake {
  align-self: flex-start;
}

/* 竖屏 */
@media (max-aspect-ratio: #{1 / 1}) {
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
    flex-direction: column;
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

  .suggestion-form-section {
    margin-top: 22px;
    padding: 16px;
  }

  .suggestion-form-actions {
    justify-content: stretch;
  }

  .suggestion-submit-button {
    width: 100%;
  }
}
</style>
