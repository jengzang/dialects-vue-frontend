import { stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { tutorialManifest } from '@/main/components/tutorial/tutorialManifest.js'

const PAGE_COPY_BY_PATH = {
  '/menu': {
    pageTitleKey: 'layoutFooter.pages.menuEntry.title',
    pageDescriptionKey: 'layoutFooter.pages.menuEntry.description',
  },
  '/menu/about/intro': {
    pageTitleKey: 'layoutFooter.pages.menuAboutIntro.title',
    pageDescriptionKey: 'layoutFooter.pages.menuAboutIntro.description',
  },
  '/menu/about/suggestion': {
    pageTitleKey: 'layoutFooter.pages.menuAboutSuggestion.title',
    pageDescriptionKey: 'layoutFooter.pages.menuAboutSuggestion.description',
  },
  '/menu/about/like': {
    pageTitleKey: 'layoutFooter.pages.menuAboutLike.title',
    pageDescriptionKey: 'layoutFooter.pages.menuAboutLike.description',
  },
  '/menu/query/zhonggu': {
    pageTitleKey: 'layoutFooter.pages.menuQueryZhonggu.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryZhonggu.description',
  },
  '/menu/query/char': {
    pageTitleKey: 'layoutFooter.pages.menuQueryChar.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryChar.description',
  },
  '/menu/query/yinwei': {
    pageTitleKey: 'layoutFooter.pages.menuQueryYinwei.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryYinwei.description',
  },
  '/menu/query/tone': {
    pageTitleKey: 'layoutFooter.pages.menuQueryTone.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryTone.description',
  },
  '/menu/map/view': {
    pageTitleKey: 'layoutFooter.pages.menuMapView.title',
    pageDescriptionKey: 'layoutFooter.pages.menuMapView.description',
  },
  '/menu/map/divide': {
    pageTitleKey: 'layoutFooter.pages.menuMapDivide.title',
    pageDescriptionKey: 'layoutFooter.pages.menuMapDivide.description',
  },
  '/menu/map/custom': {
    pageTitleKey: 'layoutFooter.pages.menuMapCustom.title',
    pageDescriptionKey: 'layoutFooter.pages.menuMapCustom.description',
  },
  '/menu/compare/char': {
    pageTitleKey: 'layoutFooter.pages.menuCompareChar.title',
    pageDescriptionKey: 'layoutFooter.pages.menuCompareChar.description',
  },
  '/menu/compare/zhonggu': {
    pageTitleKey: 'layoutFooter.pages.menuCompareZhonggu.title',
    pageDescriptionKey: 'layoutFooter.pages.menuCompareZhonggu.description',
  },
  '/menu/compare/tone': {
    pageTitleKey: 'layoutFooter.pages.menuCompareTone.title',
    pageDescriptionKey: 'layoutFooter.pages.menuCompareTone.description',
  },
  '/menu/compare/phonetic': {
    pageTitleKey: 'layoutFooter.pages.menuComparePhonetic.title',
    pageDescriptionKey: 'layoutFooter.pages.menuComparePhonetic.description',
  },
  '/menu/result': {
    pageTitleKey: 'layoutFooter.pages.menuResult.title',
    pageDescriptionKey: 'layoutFooter.pages.menuResult.description',
  },
  '/menu/pho/matrix': {
    pageTitleKey: 'layoutFooter.pages.menuPhoMatrix.title',
    pageDescriptionKey: 'layoutFooter.pages.menuPhoMatrix.description',
  },
  '/menu/pho/custom': {
    pageTitleKey: 'layoutFooter.pages.menuPhoCustom.title',
    pageDescriptionKey: 'layoutFooter.pages.menuPhoCustom.description',
  },
  '/menu/pho/count': {
    pageTitleKey: 'layoutFooter.pages.menuPhoCount.title',
    pageDescriptionKey: 'layoutFooter.pages.menuPhoCount.description',
  },
  '/menu/pho/evolution': {
    pageTitleKey: 'layoutFooter.pages.menuPhoEvolution.title',
    pageDescriptionKey: 'layoutFooter.pages.menuPhoEvolution.description',
  },
  '/menu/settings': {
    pageTitleKey: 'layoutFooter.pages.menuSettings.title',
    pageDescriptionKey: 'layoutFooter.pages.menuSettings.description',
  },
  '/menu/source': {
    pageTitleKey: 'layoutFooter.pages.menuSource.title',
    pageDescriptionKey: 'layoutFooter.pages.menuSource.description',
  },
  '/menu/privacy': {
    pageTitleKey: 'layoutFooter.pages.menuPrivacy.title',
    pageDescriptionKey: 'layoutFooter.pages.menuPrivacy.description',
  },
  '/menu/tools': {
    pageTitleKey: 'layoutFooter.pages.menuTools.title',
    pageDescriptionKey: 'layoutFooter.pages.menuTools.description',
  },
  '/menu/vocabulary/view': {
    pageTitleKey: 'layoutFooter.pages.menuVocabularyView.title',
    pageDescriptionKey: 'layoutFooter.pages.menuVocabularyView.description',
  },
  '/menu/vocabulary/import': {
    pageTitleKey: 'layoutFooter.pages.menuVocabularyImport.title',
    pageDescriptionKey: 'layoutFooter.pages.menuVocabularyImport.description',
  },
  '/menu/vocabulary/manage': {
    pageTitleKey: 'layoutFooter.pages.menuVocabularyManage.title',
    pageDescriptionKey: 'layoutFooter.pages.menuVocabularyManage.description',
  },
  '/menu/yubao': {
    pageTitleKey: 'layoutFooter.pages.menuYubao.title',
    pageDescriptionKey: 'layoutFooter.pages.menuYubao.description',
  },
  '/menu/villages': {
    pageTitleKey: 'layoutFooter.pages.menuVillages.title',
    pageDescriptionKey: 'layoutFooter.pages.menuVillages.description',
  },
  '/menu/cluster': {
    pageTitleKey: 'layoutFooter.pages.menuCluster.title',
    pageDescriptionKey: 'layoutFooter.pages.menuCluster.description',
  },
  '/explore': {
    pageTitleKey: 'layoutFooter.pages.exploreEntry.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreEntry.description',
  },
  '/explore/tools/check': {
    pageTitleKey: 'layoutFooter.pages.exploreCheck.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreCheck.description',
  },
  '/explore/tools/jyut2ipa': {
    pageTitleKey: 'layoutFooter.pages.exploreJyut2Ipa.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreJyut2Ipa.description',
  },
  '/explore/tools/merge': {
    pageTitleKey: 'layoutFooter.pages.exploreMerge.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreMerge.description',
  },
  '/explore/tools/derive': {
    pageTitleKey: 'layoutFooter.pages.exploreDerive.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreDerive.description',
  },
  '/explore/tools/praat': {
    pageTitleKey: 'layoutFooter.pages.explorePraat.title',
    pageDescriptionKey: 'layoutFooter.pages.explorePraat.description',
  },
  '/explore/gis': {
    pageTitleKey: 'layoutFooter.pages.exploreGis.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreGis.description',
  },
  '/explore/manage': {
    pageTitleKey: 'layoutFooter.pages.exploreManage.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreManage.description',
  },
  '/explore/char-class': {
    pageTitleKey: 'layoutFooter.pages.exploreCharClass.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreCharClass.description',
  },
  '/explore/yc/overview': {
    pageTitleKey: 'layoutFooter.pages.exploreYcOverview.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreYcOverview.description',
  },
  '/explore/yc/words': {
    pageTitleKey: 'layoutFooter.pages.exploreYcWords.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreYcWords.description',
  },
  '/explore/yc/expressions': {
    pageTitleKey: 'layoutFooter.pages.exploreYcExpressions.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreYcExpressions.description',
  },
  '/explore/yc/villages': {
    pageTitleKey: 'layoutFooter.pages.exploreYcVillages.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreYcVillages.description',
  },
  '/explore/villages/toponyms': {
    pageTitleKey: 'layoutFooter.pages.exploreVillagesToponyms.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreVillagesToponyms.description',
  },
  '/explore/villages/gd': {
    pageTitleKey: 'layoutFooter.pages.exploreVillagesGd.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreVillagesGd.description',
  },
  '/explore/villages/table': {
    pageTitleKey: 'layoutFooter.pages.exploreVillagesTable.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreVillagesTable.description',
  },
  '/explore/villages/ml': {
    pageTitleKey: 'layoutFooter.pages.exploreVillagesMl.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreVillagesMl.description',
  },
  '/explore/villages/all': {
    pageTitleKey: 'layoutFooter.pages.exploreVillagesAll.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreVillagesAll.description',
  },
  '/villagesML': {
    pageTitleKey: 'layoutFooter.pages.villagesML.title',
    pageDescriptionKey: 'layoutFooter.pages.villagesML.description',
  },
  '/auth': {
    pageTitleKey: 'layoutFooter.pages.auth.title',
    pageDescriptionKey: 'layoutFooter.pages.auth.description',
  },
  '/auth/data': {
    pageTitleKey: 'layoutFooter.pages.authData.title',
    pageDescriptionKey: 'layoutFooter.pages.authData.description',
  },
  '/auth/regions': {
    pageTitleKey: 'layoutFooter.pages.authRegions.title',
    pageDescriptionKey: 'layoutFooter.pages.authRegions.description',
  },
}

const PAGE_COPY_BY_PREFIX = [
  {
    pathPrefix: '/menu/yubao/',
    pageTitleKey: 'layoutFooter.pages.menuYubao.title',
    pageDescriptionKey: 'layoutFooter.pages.menuYubao.description',
  },
  {
    pathPrefix: '/explore/villages/ml/',
    pageTitleKey: 'layoutFooter.pages.exploreVillagesMl.title',
    pageDescriptionKey: 'layoutFooter.pages.exploreVillagesMl.description',
  },
  {
    pathPrefix: '/villagesML/',
    pageTitleKey: 'layoutFooter.pages.villagesML.title',
    pageDescriptionKey: 'layoutFooter.pages.villagesML.description',
  },
]

const LANGUAGE_LABEL_KEYS = {
  'zh-CN': 'layoutFooter.language.zhCN',
  'zh-Hant': 'layoutFooter.language.zhHant',
  en: 'layoutFooter.language.en',
}

const THEME_LABEL_KEYS = {
  blue: 'layoutFooter.theme.blue',
  light: 'layoutFooter.theme.light',
  dark: 'layoutFooter.theme.dark',
  green: 'layoutFooter.theme.green',
}

function hasTutorialEntry(route) {
  return tutorialManifest.some((entry) => entry.match(route))
}

function resolvePageCopy(path) {
  return PAGE_COPY_BY_PATH[path] ||
    PAGE_COPY_BY_PREFIX.find(entry => path.startsWith(entry.pathPrefix)) ||
    {
      pageTitleKey: 'layoutFooter.pages.generic.title',
      pageDescriptionKey: 'layoutFooter.pages.generic.description',
    }
}

export function resolveLayoutFooterContext({
  route,
  locale,
  colorTheme,
}) {
  const normalizedPath = stripLocaleFromPath(route?.path || '')
  const pageCopy = resolvePageCopy(normalizedPath)

  return {
    ...pageCopy,
    hasTutorial: hasTutorialEntry(route),
    languageLabelKey: LANGUAGE_LABEL_KEYS[locale] || LANGUAGE_LABEL_KEYS['zh-Hant'],
    themeLabelKey: THEME_LABEL_KEYS[colorTheme] || THEME_LABEL_KEYS.blue,
  }
}
