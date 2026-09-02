<template>
  <section id="features-section" class="features-section reveal">
    <h2 class="section-title">{{ t('home.features.sectionTitle') }}</h2>

    <!-- Search -->
    <div class="features-toolbar">
      <label class="features-search">
        <InlineIcon icon="🔍" class="features-search__icon" />
        <input
          v-model="query"
          type="search"
          class="features-search__input"
          :placeholder="t('home.features.searchPlaceholder')"
          autocomplete="off"
        />
        <button
          v-if="query"
          type="button"
          class="features-search__clear"
          :aria-label="t('home.features.clearRecent')"
          @click="query = ''"
        >✕</button>
      </label>
    </div>

    <!-- Recently used -->
    <div v-if="!query && recentItems.length" class="features-recent">
      <span class="features-recent__label">{{ t('home.features.recent') }}</span>
      <div class="features-recent__list">
        <RouterLink
          v-for="item in recentItems"
          :key="item.route"
          :to="localeTo(item.route)"
          class="recent-pill"
          @click="recordRecent(item.route)"
        >
          <InlineIcon :icon="item.icon" class="recent-pill__icon" />
          <span class="recent-pill__title">{{ item.title }}</span>
        </RouterLink>
      </div>
      <button
        type="button"
        class="features-recent__clear"
        @click="clearRecents"
      >{{ t('home.features.clearRecent') }}</button>
    </div>

    <!-- Grouped feature grid -->
    <div v-for="group in visibleGroups" :key="group.id" class="feature-group">
      <div class="feature-group__header">
        <span class="feature-group__icon"><InlineIcon :icon="group.icon" /></span>
        <div class="feature-group__text">
          <h3 class="feature-group__title">{{ group.title }}</h3>
          <p v-if="group.desc" class="feature-group__desc">{{ group.desc }}</p>
        </div>
      </div>

      <div class="feature-group__grid">
        <RouterLink
          v-for="item in group.items"
          :key="item.route"
          :to="localeTo(item.route)"
          class="feature-tile"
          @click="recordRecent(item.route)"
        >
          <span class="feature-tile__icon"><InlineIcon :icon="item.icon" /></span>
          <span class="feature-tile__text">
            <span class="feature-tile__title">{{ item.title }}</span>
            <span class="feature-tile__desc">{{ item.desc }}</span>
          </span>
        </RouterLink>
      </div>
    </div>

    <p v-if="query && !visibleGroups.length" class="features-empty">
      {{ t('home.features.noResults') }}
    </p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const SEARCH_LOCALES = ['zh-CN', 'zh-Hant', 'en']

const groups = [
  {
    id: 'query',
    icon: '🔍',
    titleKey: 'home.features.query.title',
    descKey: 'home.features.query.desc',
    items: [
      {
        icon: '📝',
        labelKey: 'home.features.query.searchChar',
        route: '/menu/query/char',
        search: {
          keywords: ['汉字', '字典', '查音', '读音', 'character'],
          i18nKeys: [
            'layoutFooter.pages.menuQueryChar.description',
            'navigation.pageTitles.query.tab1',
          ],
        },
      },
      {
        icon: '📜',
        labelKey: 'home.features.query.searchMiddle',
        route: '/menu/query/zhonggu',
        search: {
          keywords: ['中古音', '广韵', '韵书', '声韵调', 'Middle Chinese'],
          i18nKeys: [
            'layoutFooter.pages.menuQueryZhonggu.description',
            'navigation.pageTitles.query.tab2',
          ],
        },
      },
      {
        icon: '🗣️',
        labelKey: 'home.features.query.searchPhoneme',
        route: '/menu/query/yinwei',
        search: {
          keywords: ['音位', '韵书来源', 'phoneme'],
          i18nKeys: [
            'layoutFooter.pages.menuQueryYinwei.description',
            'navigation.pageTitles.query.tab3',
          ],
        },
      },
      {
        icon: '🎶',
        labelKey: 'home.features.query.searchTone',
        route: '/menu/query/tone',
        search: {
          keywords: ['声调', '调值', '调类', '四声', 'tone'],
          i18nKeys: [
            'layoutFooter.pages.menuQueryTone.description',
            'navigation.pageTitles.query.tab4',
          ],
        },
      },
    ],
  },
  {
    id: 'compare',
    icon: '🔀',
    titleKey: 'home.features.compare.title',
    descKey: 'home.features.compare.desc',
    items: [
      {
        icon: '📊',
        labelKey: 'home.features.compare.compareChar',
        route: '/menu/compare/char',
        search: {
          keywords: ['字音', '异读', '读音差异', 'compare'],
          i18nKeys: [
            'layoutFooter.pages.menuCompareChar.description',
            'navigation.pageTitles.compare.tab1',
          ],
        },
      },
      {
        icon: '🎯',
        labelKey: 'home.features.compare.compareMiddle',
        route: '/menu/compare/zhonggu',
        search: {
          keywords: ['中古', '韵书', '演变', '音变', 'comparison'],
          i18nKeys: [
            'layoutFooter.pages.menuCompareZhonggu.description',
            'navigation.pageTitles.compare.tab2',
          ],
        },
      },
      {
        icon: '🎹',
        labelKey: 'home.features.compare.compareTone',
        route: '/menu/compare/tone',
        search: {
          keywords: ['调类', '合流', '分立', '声调', 'tone'],
          i18nKeys: [
            'layoutFooter.pages.menuCompareTone.description',
            'navigation.pageTitles.compare.tab4',
          ],
        },
      },
      {
        icon: '⚖️',
        labelKey: 'home.features.compare.comparePhonetic',
        route: '/menu/compare/phonetic',
        search: {
          keywords: ['音值', '对应关系', '音系', '桑基图', 'phonetic'],
          i18nKeys: [
            'layoutFooter.pages.menuComparePhonetic.description',
            'navigation.pageTitles.compare.tab5',
          ],
        },
      },
    ],
  },
  {
    id: 'map',
    icon: '🗺️',
    titleKey: 'home.features.map.title',
    descKey: 'home.features.map.desc',
    items: [
      {
        icon: '📍',
        labelKey: 'home.features.map.dialectMap',
        route: '/menu/map/view',
        search: {
          keywords: ['地图', '方言地图', 'map'],
          i18nKeys: [
            'layoutFooter.pages.menuMapView.description',
            'navigation.pageTitles.map.view',
          ],
        },
      },
      {
        icon: '🧭',
        labelKey: 'home.features.map.regionMap',
        route: '/menu/map/divide',
        search: {
          keywords: ['分区', '方言区', '分区着色', 'region', '等值线'],
          i18nKeys: [
            'layoutFooter.pages.menuMapDivide.description',
            'navigation.pageTitles.map.divide',
          ],
        },
      },
      {
        icon: '📁',
        labelKey: 'home.features.map.customMap',
        route: '/menu/map/custom',
        search: {
          keywords: ['自定义', '个人数据', '上传', 'custom'],
          i18nKeys: [
            'layoutFooter.pages.menuMapCustom.description',
            'navigation.pageTitles.map.custom',
          ],
        },
      },
      {
        icon: '✏️',
        labelKey: 'home.features.map.drawMap',
        route: '/explore/gis',
        search: {
          keywords: ['GIS', '泰森多边形', '绘制', '地理要素', 'draw', 'voronoi'],
          i18nKeys: [
            'layoutFooter.pages.exploreGis.description',
            'navigation.pageTitles.gis.main',
          ],
        },
      },
    ],
  },
  {
    id: 'phonology',
    icon: '🧬',
    titleKey: 'home.features.phonology.title',
    descKey: 'home.features.phonology.desc',
    items: [
      {
        icon: '⚗️',
        labelKey: 'home.features.phonology.phonologyQuery',
        route: '/menu/pho/matrix',
        search: {
          keywords: ['音系', '同音字汇', '声韵调拼合', '音节表', 'phonology'],
          i18nKeys: [
            'layoutFooter.pages.menuPhoMatrix.description',
            'navigation.pageTitles.pho.matrix',
          ],
        },
      },
      {
        icon: '🔬',
        labelKey: 'home.features.phonology.phonemeClassify',
        route: '/menu/pho/custom',
        search: {
          keywords: ['音素', '分类', '地位分类', '声韵调', 'classify'],
          i18nKeys: [
            'layoutFooter.pages.menuPhoCustom.description',
            'navigation.pageTitles.pho.custom',
          ],
        },
      },
      {
        icon: '🥧',
        labelKey: 'home.features.phonology.evolution',
        route: '/menu/pho/evolution',
        search: {
          keywords: ['演化', '历史音变', '饼图', '桑基图', 'evolution'],
          i18nKeys: [
            'layoutFooter.pages.menuPhoEvolution.description',
            'navigation.pageTitles.pho.evolution',
          ],
        },
      },
      {
        icon: '📊',
        labelKey: 'home.features.phonology.syllableCount',
        route: '/menu/pho/count',
        search: {
          keywords: ['音节', '统计', '音节数', '等值线', 'syllable'],
          i18nKeys: [
            'layoutFooter.pages.menuPhoCount.description',
            'navigation.pageTitles.pho.count',
          ],
        },
      },
    ],
  },
  {
    id: 'charClass',
    icon: '📜',
    titleKey: 'home.features.charClass.title',
    descKey: 'home.features.charClass.desc',
    items: [
      {
        icon: '🏛️',
        labelKey: 'home.features.charClass.zhonggu',
        route: '/explore/char-class?tab=zhonggu',
        search: {
          keywords: ['中古', '广韵', '切韵', 'Middle Chinese'],
          i18nKeys: [
            'layoutFooter.pages.exploreCharClass.description',
            'navigation.pageTitles.charClass.zhonggu',
          ],
        },
      },
      {
        icon: '📿',
        labelKey: 'home.features.charClass.shanggu',
        route: '/explore/char-class?tab=shanggu',
        search: {
          keywords: ['上古', '诗经', '谐声', '上古音', 'Old Chinese'],
          i18nKeys: [
            'layoutFooter.pages.exploreCharClass.description',
            'navigation.pageTitles.charClass.shanggu',
          ],
        },
      },
      {
        icon: '📖',
        labelKey: 'home.features.charClass.jingu',
        route: '/explore/char-class?tab=jingu',
        search: {
          keywords: ['近古', '中原音韵', '洪武正韵', '近代音', 'Early Mandarin'],
          i18nKeys: [
            'layoutFooter.pages.exploreCharClass.description',
            'navigation.pageTitles.charClass.jingu',
          ],
        },
      },
      {
        icon: '🎵',
        labelKey: 'home.features.charClass.yueyun',
        route: '/explore/char-class?tab=yueyun',
        search: {
          keywords: ['粤语', '分韵撮要', '韵书', '粤音', 'Cantonese'],
          i18nKeys: [
            'layoutFooter.pages.exploreCharClass.description',
            'navigation.pageTitles.charClass.yueyun',
          ],
        },
      },
    ],
  },
  {
    id: 'words',
    icon: '📖',
    titleKey: 'home.features.words.title',
    descKey: 'home.features.words.desc',
    items: [
      {
        icon: '📋',
        labelKey: 'home.features.words.wordList',
        route: '/menu/vocabulary',
        search: {
          keywords: ['词表', '词汇', '方言词', '词语', 'vocabulary'],
          i18nKeys: [
            'layoutFooter.pages.menuVocabularyView.description',
            'navigation.pageTitles.vocabulary.view',
          ],
        },
      },
      {
        icon: '📖',
        labelKey: 'home.features.words.yubaoVocab',
        route: '/menu/yubao?tab=vocabulary',
        search: {
          keywords: ['语保', '1000','一千', '词汇', '方言词', 'vocabulary'],
          i18nKeys: [
            'layoutFooter.pages.menuYubao.description',
            'navigation.pageTitles.yubao.vocabulary',
          ],
        },
      },
      {
        icon: '🗣️',
        labelKey: 'home.features.words.yubaoGrammar',
        route: '/menu/yubao?tab=grammar',
        search: {
          keywords: ['语保', '语法', '例句', '50','五十', 'grammar'],
          i18nKeys: [
            'layoutFooter.pages.menuYubao.description',
            'navigation.pageTitles.yubao.grammar',
          ],
        },
      },
      {
        icon: '💬',
        labelKey: 'home.features.words.ycSpoken',
        route: '/explore/yc/words',
        search: {
          keywords: ['阳春', '口语', '词汇', '方言词', 'Yangchun'],
          i18nKeys: [
            'layoutFooter.pages.exploreYcWords.description',
            'navigation.pageTitles.words.yangChunSpoken',
          ],
        },
      },
    ],
  },
  {
    id: 'villages',
    icon: '🏘️',
    titleKey: 'home.features.villages.title',
    descKey: 'home.features.villages.desc',
    items: [
      {
        icon: '📍',
        labelKey: 'home.features.villages.toponyms',
        route: '/explore/villages/toponyms',
        search: {
          keywords: ['地名', '自然村', '分布', '地名检索', 'toponym'],
          i18nKeys: [
            'layoutFooter.pages.exploreVillagesToponyms.description',
            'navigation.pageTitles.villages.toponyms',
          ],
        },
      },
      {
        icon: '🤖',
        labelKey: 'home.features.villages.villagesML',
        route: '/explore/villages/ml',
        search: {
          keywords: ['机器学习', '村名', '聚类', '分析', 'machine learning'],
          i18nKeys: [
            'layoutFooter.pages.exploreVillagesMl.description',
            'layoutFooter.pages.exploreVillagesMl.title',
          ],
        },
      },
      {
        icon: '🏘️',
        labelKey: 'home.features.villages.gdVillages',
        route: '/explore/villages/gd',
        search: {
          keywords: ['广东', '自然村', '树状图', '行政区划', 'Guangdong'],
          i18nKeys: [
            'layoutFooter.pages.exploreVillagesGd.description',
            'navigation.pageTitles.villages.gdTree',
          ],
        },
      },
      {
        icon: '🌾',
        labelKey: 'home.features.villages.ycVillages',
        route: '/explore/yc/villages',
        search: {
          keywords: ['阳春', '自然村', '村落', '分布', 'Yangchun'],
          i18nKeys: [
            'layoutFooter.pages.exploreYcVillages.description',
            'navigation.pageTitles.villages.yangChun',
          ],
        },
      },
    ],
  },
  {
    id: 'tools',
    icon: '🧰',
    titleKey: 'home.features.tools.title',
    descKey: 'home.features.tools.desc',
    items: [
      {
        icon: '📋',
        labelKey: 'home.features.tools.tableProcess',
        route: '/explore/tools/check',
        search: {
          keywords: ['字表', '检查', '格式', '校验', 'check'],
          i18nKeys: [
            'layoutFooter.pages.exploreCheck.description',
            'navigation.pageTitles.tools.check',
          ],
        },
      },
      {
        icon: '🔤',
        labelKey: 'home.features.tools.jyut2ipa',
        route: '/explore/tools/jyut2ipa',
        search: {
          keywords: ['粤拼', 'IPA', '国际音标', '拼音', 'Jyutping'],
          i18nKeys: [
            'layoutFooter.pages.exploreJyut2Ipa.description',
            'navigation.pageTitles.tools.jyut2ipa',
          ],
        },
      },
      {
        icon: '🔗',
        labelKey: 'home.features.tools.tableMerge',
        route: '/explore/tools/merge',
        search: {
          keywords: ['字表', '合并', '对齐', '参考表', 'merge'],
          i18nKeys: [
            'layoutFooter.pages.exploreMerge.description',
            'navigation.pageTitles.tools.merge',
          ],
        },
      },
    ],
  },
  {
    id: 'praat',
    icon: '🎙️',
    titleKey: 'home.features.praat.title',
    descKey: null,
    items: [
      {
        icon: '🎙️',
        titleKey: 'home.features.praat.title',
        descKey: 'home.features.praat.desc',
        route: '/explore/tools/praat',
        search: {
          keywords: ['Praat', '声学', '基频', '共振峰', '声调图'],
          i18nKeys: [
            'layoutFooter.pages.explorePraat.description',
            'navigation.pageTitles.praat.main',
          ],
        },
      },
    ],
  },
  {
    id: 'about',
    icon: '🌐',
    titleKey: 'home.features.about.title',
    descKey: 'home.features.about.desc',
    items: [
      {
        icon: 'ℹ️',
        labelKey: 'home.features.about.intro',
        route: '/menu/about/intro',
        search: {
          keywords: ['关于', '介绍', '简介', '网站', 'about'],
          i18nKeys: [
            'layoutFooter.pages.menuAboutIntro.description',
            'navigation.pageTitles.support.aboutIntro',
          ],
        },
      },
      {
        icon: '💬',
        labelKey: 'home.features.about.suggestion',
        route: '/menu/about/suggestion',
        search: {
          keywords: ['建议', '反馈', 'issue', '知乎', 'feedback'],
          i18nKeys: [
            'layoutFooter.pages.menuAboutSuggestion.description',
            'navigation.pageTitles.support.aboutSuggestion',
          ],
        },
      },
      {
        icon: '❤️',
        labelKey: 'home.features.about.likeAuthor',
        route: '/menu/about/like',
        search: {
          keywords: ['支持', '作者', '打赏', '关注', 'support'],
          i18nKeys: [
            'layoutFooter.pages.menuAboutLike.description',
            'navigation.pageTitles.support.aboutLike',
          ],
        },
      },
      {
        icon: '⚙️',
        labelKey: 'home.features.about.setting',
        route: '/menu/settings',
        search: {
          keywords: ['设置', '语言', '主题', '教程', 'settings'],
          i18nKeys: [
            'layoutFooter.pages.menuSettings.description',
            'navigation.pageTitles.support.settings',
          ],
        },
      },
      {
        icon: '🔗',
        labelKey: 'home.features.about.source',
        route: '/menu/source',
        search: {
          keywords: ['资料', '来源', '参考文献', '字表来源', 'source'],
          i18nKeys: [
            'layoutFooter.pages.menuSource.description',
            'navigation.pageTitles.support.source',
          ],
        },
      },
    ],
  },
]

function translateForLocale(key, targetLocale) {
  return t(key, undefined, { locale: targetLocale })
}

function normalizeSearchText(value) {
  return value.trim().toLowerCase()
}

function resolveItem(item, targetLocale) {
  const translate = targetLocale
    ? (key) => translateForLocale(key, targetLocale)
    : t
  if (item.labelKey) {
    const raw = translate(item.labelKey)
    const idx = raw.indexOf(' - ')
    return idx >= 0
      ? { title: raw.slice(0, idx), desc: raw.slice(idx + 3) }
      : { title: raw, desc: '' }
  }
  return { title: translate(item.titleKey), desc: item.descKey ? translate(item.descKey) : '' }
}

function resolveItemSearchText(item) {

  // 1. 原本的多语言标题和描述
  const translatedTexts =
    SEARCH_LOCALES.flatMap((targetLocale) => {
      const resolved = resolveItem(
        item,
        targetLocale
      )

      return [
        resolved.title,
        resolved.desc
      ]
    })


  // 2. 手写关键词
  const customKeywords =
    item.search?.keywords || []


  // 3. i18n关键词
  const translatedKeywords =
    SEARCH_LOCALES.flatMap((targetLocale) => {
      return (
        item.search?.i18nKeys || []
      ).map((key) =>
        translateForLocale(
          key,
          targetLocale
        )
      )
    })


  return [
    ...translatedTexts,
    ...customKeywords,
    ...translatedKeywords
  ]
    .join(' ')
    .toLowerCase()
}

function resolveGroupSearchText(group) {
  return SEARCH_LOCALES
    .flatMap((targetLocale) => [
      translateForLocale(group.titleKey, targetLocale),
      group.descKey ? translateForLocale(group.descKey, targetLocale) : '',
    ])
    .join(' ')
    .toLowerCase()
}

const resolvedGroups = computed(() =>
  groups.map((g) => ({
    id: g.id,
    icon: g.icon,
    title: t(g.titleKey),
    desc: g.descKey ? t(g.descKey) : '',
    searchText: resolveGroupSearchText(g),
    items: g.items.map((item) => ({
      ...item,
      ...resolveItem(item),
      searchText: resolveItemSearchText(item),
    })),
  }))
)

const query = ref('')

const visibleGroups = computed(() => {
  const q = normalizeSearchText(query.value)
  if (!q) return resolvedGroups.value
  return resolvedGroups.value
    .map((g) => ({
      ...g,
      items: g.searchText.includes(q)
        ? g.items
        : g.items.filter((it) => it.searchText.includes(q)),
    }))
    .filter((g) => g.items.length)
})

const RECENT_KEY = 'dialects.features.recent'
const RECENT_MAX = 8

function loadRecentRoutes() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((r) => typeof r === 'string') : []
  } catch {
    return []
  }
}

const recentRoutes = ref(loadRecentRoutes())

const itemByRoute = computed(() => {
  const map = new Map()
  for (const g of resolvedGroups.value) {
    for (const it of g.items) map.set(it.route, it)
  }
  return map
})

const recentItems = computed(() =>
  recentRoutes.value.map((r) => itemByRoute.value.get(r)).filter(Boolean)
)

function recordRecent(routePath) {
  const next = [routePath, ...recentRoutes.value.filter((r) => r !== routePath)].slice(0, RECENT_MAX)
  recentRoutes.value = next
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* ignore write failures */
  }
}

function clearRecents() {
  recentRoutes.value = []
  try {
    window.localStorage.removeItem(RECENT_KEY)
  } catch {
    /* ignore */
  }
}

function localeTo(path) {
  return buildLocalePath(resolveRouteLocale(route), path)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$text-primary: var(--text-primary);

.features-section {
  position: relative;
  z-index: 1;
  max-width: 1300px;
  margin: 0 auto;
  padding: clamp(3rem, 6dvw, 6rem) clamp(1.5rem, 4dvw, 2.5rem);
}

.section-title {
  margin: 0.5rem;
  text-align: center;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: $primary;
}

/* Toolbar / search */
.features-toolbar {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0 0.25rem;
}

.features-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(480px, 100%);
  padding: 0.65rem 1rem;
  background: var(--glass-70);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-full);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: rgba(var(--color-primary-rgb), 0.5);
    box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.15);
  }

  &__icon {
    flex-shrink: 0;
    color: $primary;
    font-size: 1.1rem;
  }

  &__input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: $text-primary;
    font-size: 0.9375rem;

    &::placeholder {
      color: var(--text-dark-lighter);
    }

    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__clear {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    padding: 0;
    background: rgba(var(--color-primary-rgb), 0.12);
    border: none;
    border-radius: var(--radius-full);
    color: $primary;
    font-size: 0.75rem;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.22);
    }
  }
}

/* Recents */
.features-recent {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 1100px;
  margin: 0.5rem auto 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--glass-50);
  border: 1px solid rgba(var(--color-primary-rgb), 0.12);
  border-radius: var(--radius-lg);

  &__label {
    flex-shrink: 0;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-dark-lighter);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__clear {
    flex-shrink: 0;
    margin-left: auto;
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: none;
    color: var(--text-dark-lighter);
    font-size: 0.8125rem;
    cursor: pointer;
    border-radius: var(--radius-sm);

    &:hover {
      color: $primary;
      background: rgba(var(--color-primary-rgb), 0.08);
    }
  }
}

.recent-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: var(--glass-80);
  border: 1px solid rgba(var(--color-primary-rgb), 0.15);
  border-radius: var(--radius-full);
  color: $text-primary;
  font-size: 0.8125rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(var(--color-primary-rgb), 0.4);
    background: var(--glass-90);
    transform: translateY(-1px);
  }

  &__icon {
    color: $primary;
  }

  &__title {
    font-weight: 500;
  }
}

/* Groups */
.feature-group {
  margin-top: 2rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    margin-bottom: 0.75rem;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1) 0%,
      rgba(var(--color-primary-hover-rgb), 0.15) 100%
    );
    border-radius: var(--radius-md);
    color: $primary;
    font-size: 1.25rem;
  }

  &__text {
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: $text-primary;
  }

  &__desc {
    margin: 0.1rem 0 0;
    font-size: 0.8125rem;
    color: var(--text-dark-lighter);
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
}

.feature-tile {
  display: flex;
  align-items: center;
  flex: 1 1 200px;
  max-width: 360px;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  text-align: left;
  background: var(--glass-70);
  border: 1px solid rgba(var(--color-primary-rgb), 0.15);
  border-radius: var(--radius-md);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-90);
    border-color: rgba(var(--color-primary-rgb), 0.35);
    box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.14);
    transform: translateY(-2px);

    .feature-tile__icon {
      transform: scale(1.1);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.1) 0%,
      rgba(var(--color-primary-hover-rgb), 0.15) 100%
    );
    border-radius: var(--radius-md);
    color: $primary;
    font-size: 1.5rem;
    transition: transform 0.2s ease;
  }

  &__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $text-primary;
  }

  &__desc {
    margin-top: 0.15rem;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--text-dark-lighter);
  }
}

.features-empty {
  margin: 2rem 0;
  text-align: center;
  color: var(--text-dark-lighter);
}

/* Portrait: tighter tiles */
@media (max-aspect-ratio: 1/1) {
  .feature-tile {
    flex-basis: 160px;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem;

    &__icon {
      width: 34px;
      height: 34px;
      font-size: 1.25rem;
    }

    &__desc {
      font-size: 0.75rem;
    }
  }

  .features-recent {
    padding: 0.5rem 0.75rem;
  }
}
</style>
