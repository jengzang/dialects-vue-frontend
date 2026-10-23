<template>
  <!-- 新的"簡介"页面 -->
  <div ref="introContainer" class="thanks-container">
    <button
      type="button"
      class="intro-directory-toggle glass-button"
      data-intro-directory-toggle
      :aria-expanded="directoryOpen"
      aria-controls="intro-directory"
      @click="directoryOpen = !directoryOpen"
    >{{ $t('about.intro.directory') }}</button>
    <nav
      id="intro-directory"
      class="intro-directory glass-panel"
      :class="{ 'is-open': directoryOpen }"
      :aria-label="$t('about.intro.directory')"
    >
      <button
        v-for="section in directorySections"
        :key="section.id"
        type="button"
        class="intro-directory-item"
        :data-intro-directory-item="section.id"
        :aria-label="section.label"
        :aria-current="activeSection === section.id ? 'location' : undefined"
        :title="section.label"
        @click="jumpToSection(section.id)"
      >
        <span class="intro-directory-label">{{ section.label }}</span>
        <span class="intro-directory-dot" aria-hidden="true"></span>
      </button>
    </nav>
    <h1 class="tabs-title">{{ $t('navigation.pageTitles.support.aboutIntro') }}</h1>
    <p style=" text-align: left;">{{ $t('about.intro.description') }}</p>
    <ul class="customlist">
      <li
        v-for="feature in featureList"
        :id="`intro-${feature.key.replace('feature', 'feature-')}`"
        :key="feature.key"
        class="feature-item"
        data-intro-directory-target
      >
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

    <h2 id="intro-thanks" class="tabs-title" style="margin-top: 20px" data-intro-directory-target>🙏 {{ $t('about.thanks.title') }}</h2>
    <ul class="thanks-list">
      <li>
        ✔ <a href="https://mcpdict.vear.vip/" target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.mcpdict') }}</a>
        - {{ $t('about.thanks.mcpdictDesc') }}<a href="https://github.com/osfans/MCPDict/tree/master/tools/tables/output"
                                                 target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.mcpdictData') }}</a>
      </li>
      <li>
        ✔ <RouterLink :to="localeTo('/menu/vocabulary')" class="thanks-link">{{ $t('about.thanks.contributors') }}</RouterLink>
        - {{ $t('about.thanks.contributorsDesc') }}
      </li>
      <li>
        ✔ <a href="https://zhongguoyuyan.cn/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.yuyan') }}</a> - {{ $t('about.thanks.yuyanDesc') }}
      </li>
      <li>
        ✔ <a href="https://zhuanlan.zhihu.com/p/1890022649830290824" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.quanyue') }}</a> - {{ $t('about.thanks.quanyueDesc') }}
      </li>
      <li>
        ✔ <a href="https://dmfw.mca.gov.cn/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.diming') }}</a> - {{ $t('about.thanks.dimingDesc') }}
      </li>
      <li>
        ✔ <a href="https://jyutjam.org/" target="_blank" rel="noopener noreferrer"
             class="thanks-link">{{ $t('about.thanks.jyutjam') }}</a> - {{ $t('about.thanks.jyutjamDesc') }}<a href="https://jyutdict.org/"
                                                                                                              target="_blank" rel="noopener noreferrer" class="thanks-link">{{ $t('about.thanks.jyutdict') }}</a>
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
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import i18n from '@/i18n/index.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { locale, t } = useI18n()
const route = useRoute()
const introContainer = ref(null)
const directoryOpen = ref(false)
const activeSection = ref('intro-feature-1')

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
      key,
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

const directorySections = computed(() => [
  ...featureList.value.map(feature => ({
    id: `intro-${feature.key.replace('feature', 'feature-')}`,
    label: feature.heading,
  })),
  { id: 'intro-thanks', label: t('about.thanks.title') },
])

function jumpToSection(id) {
  introContainer.value?.querySelector(`#${id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  activeSection.value = id
  directoryOpen.value = false
}

function updateActiveSection() {
  const threshold = window.innerHeight * 0.35
  for (const section of directorySections.value) {
    const target = introContainer.value?.querySelector(`#${section.id}`)
    if (target && target.getBoundingClientRect().top <= threshold) {
      activeSection.value = section.id
    } else {
      break
    }
  }
}

onMounted(() => window.addEventListener('scroll', updateActiveSection, { passive: true, capture: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', updateActiveSection, true))

function localeTo(path) {
  return buildLocalePath(resolveRouteLocale(route), path)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use './aboutShared' as *;

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

.intro-directory {
  position: fixed;
  top: 50%;
  right: 1rem;
  z-index: 1600;
  width: 2.5rem;
  max-height: 80dvh;
  padding: 0.35rem;
  transform: translateY(-50%);
}

.intro-directory-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2rem;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--text-medium);
  font: inherit;
  text-align: right;
  cursor: pointer;

  &:hover,
  &:focus-visible,
  &[aria-current='location'] {
    color: var(--color-primary);
  }
}

.intro-directory-label {
  @include text-truncate;
  position: absolute;
  right: 2.35rem;
  max-width: 0;
  padding: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-glass-floating);
  font-size: 0.8rem;
  opacity: 0;
  pointer-events: none;
}

.intro-directory-item:hover .intro-directory-label,
.intro-directory-item:focus-visible .intro-directory-label,
.intro-directory-item[aria-current='location'] .intro-directory-label {
  max-width: 11rem;
  padding: 0.3rem 0.5rem;
  opacity: 1;
}

.intro-directory-dot {
  flex: 0 0 auto;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: var(--radius-pill);
  background: var(--color-primary-border);
}

.intro-directory-item[aria-current='location'] .intro-directory-dot {
  background: var(--color-primary);
}

.intro-directory-toggle {
  display: none;
}

[data-intro-directory-target] {
  scroll-margin-top: 7rem;
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

@media (max-aspect-ratio: #{1 / 1}) {
  .intro-directory-toggle {
    display: block;
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 1601;
  }

  .intro-directory {
    display: none;
    top: auto;
    right: auto;
    left: 1rem;
    bottom: 4.5rem;
    width: min(15rem, calc(100vw - 2rem));
    max-height: 65dvh;
    overflow-y: auto;
    transform: none;

    &.is-open {
      display: block;
    }
  }

  .intro-directory-label {
    position: static;
    flex: 1;
    max-width: none;
    padding: 0;
    background: transparent;
    opacity: 1;
  }

  .intro-directory-item {
    justify-content: space-between;
    gap: 0.6rem;
    text-align: left;
  }

  .intro-directory-item[aria-current='location'] .intro-directory-label {
    max-width: none;
    padding: 0;
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
}
</style>
