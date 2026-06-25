const PhoPage = () => import('@/main/views/menu/PhoPage.vue')
const AboutPage = () => import('@/main/views/menu/support/AboutPage.vue')
const QueryPage = () => import('@/main/views/menu/QueryPage.vue')
const ComparePage = () => import('@/main/views/menu/ComparePage.vue')
const MapPage = () => import('@/main/views/menu/MapPage.vue')
const ResultPage = () => import('@/main/views/menu/ResultPage.vue')
const SourcePage = () => import('@/main/views/menu/support/SourcePage.vue')
const PrivacyPage = () => import('@/main/views/menu/support/PrivacyPage.vue')
const ToolsPage = () => import('@/main/views/menu/portals/ToolsPage.vue')
const WordsPage = () => import('@/main/views/menu/portals/WordsPage.vue')
const VillagesPage = () => import('@/main/views/menu/portals/VillagesPage.vue')
const DialectClusteringPage = () => import('@/main/views/menu/DialectClustering.vue')

export const menuRoutes = [
  {
    path: '/menu/pho/:section(matrix|custom|count|evolution)',
    component: PhoPage
  },
  {
    path: '/menu/about/:section(intro|suggestion|like|settings)',
    component: AboutPage
  },
  {
    path: '/menu/query',
    redirect: '/menu/query/zhonggu'
  },
  {
    path: '/menu/query/:sub(char|zhonggu|yinwei|tone)',
    component: QueryPage
  },
  {
    path: '/menu/compare',
    redirect: '/menu/compare/zhonggu'
  },
  {
    path: '/menu/compare/:sub(char|zhonggu|tone|phonetic)',
    component: ComparePage
  },
  {
    path: '/menu/map',
    redirect: '/menu/map/view'
  },
  {
    path: '/menu/map/:sub(view|divide|custom|draw)',
    component: MapPage
  },
  {
    path: '/menu/result',
    component: ResultPage
  },
  {
    path: '/menu/source',
    component: SourcePage
  },
  {
    path: '/menu/privacy',
    component: PrivacyPage
  },
  {
    path: '/menu/tools',
    component: ToolsPage
  },
  {
    path: '/menu/words',
    component: WordsPage
  },
  {
    path: '/menu/villages',
    component: VillagesPage
  },
  {
    path: '/menu/cluster',
    component: DialectClusteringPage
  }
]
