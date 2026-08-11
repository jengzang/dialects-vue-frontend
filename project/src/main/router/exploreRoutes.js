import { userStore } from '@/main/store/store.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const CheckTool = () => import('@/main/views/explore/tools/CheckTool.vue')
const Jyut2IpaTool = () => import('@/main/views/explore/tools/Jyut2IpaTool.vue')
const MergeTool = () => import('@/main/views/explore/tools/MergeTool.vue')
const DeriveTool = () => import('@/main/views/explore/tools/DeriveTool.vue')
const PraatPage = () => import('@/main/views/explore/Praat.vue')
const GisPage = () => import('@/main/views/explore/GisPage.vue')
const TableManagePage = () => import('@/main/views/explore/tools/TableManage.vue')
const CharacterClassificationPage = () => import('@/main/views/explore/charClass/CharacterClassification.vue')
const GdVillagesTreePage = () => import('@/main/views/explore/villages/gdVillagesTree.vue')
const GdVillagesTablePage = () => import('@/main/views/explore/villages/gdVillagesTable.vue')
const YangChunVillagesPage = () => import('@/main/views/explore/villages/YangChunVillages.vue')
const YangChunSpokenPage = () => import('@/main/views/explore/word/YangChunSpoken.vue')
const YangChunOverviewPage = () => import('@/main/views/explore/yangchun/YangChunOverviewPage.vue')
const YangChunExpressionsPage = () => import('@/main/views/explore/yangchun/YangChunExpressionsPage.vue')
const AllVillagesPage = () => import('@/main/views/explore/villages/AllVillages.vue')
const VillagesMLPage = () => import('@/main/views/explore/villages/VillagesML.vue')
const ToponymsPage = () => import('@/main/views/explore/villages/toponyms/ToponymsPage.vue')

export const exploreRoutes = [
  {
    path: 'explore/tools/check',
    component: CheckTool
  },
  {
    path: 'explore/tools/jyut2ipa',
    component: Jyut2IpaTool
  },
  {
    path: 'explore/tools/merge',
    component: MergeTool
  },
  {
    path: 'explore/tools/derive',
    component: DeriveTool
  },
  {
    path: 'explore/tools/praat',
    component: PraatPage,
    meta: { queryAllowlist: ['tab'] }
  },
  {
    path: 'explore/gis',
    component: GisPage,
    meta: { queryAllowlist: ['scrollTo'] }
  },
  {
    path: 'explore/manage',
    component: TableManagePage
  },
  {
    path: 'explore/yubao',
    redirect: (to) => ({
      path: buildLocalePath(resolveRouteLocale(to), '/menu/yubao'),
      query: to.query,
      hash: to.hash,
    })
  },
  {
    path: 'explore/vocabulary/:child?',
    redirect: (to) => ({
      path: buildLocalePath(resolveRouteLocale(to), '/menu/vocabulary'),
      query: to.query,
      hash: to.hash,
    })
  },
  {
    path: 'explore/char-class',
    component: CharacterClassificationPage,
    meta: { queryAllowlist: ['tab', 'table', 'levels'] }
  },
  {
    path: 'explore/yc-spoken',
    redirect: (to) => ({
      path: buildLocalePath(resolveRouteLocale(to), '/explore/yc/words'),
      query: to.query,
      hash: to.hash,
    })
  },
  {
    path: 'explore/yc',
    redirect: (to) => ({
      path: buildLocalePath(resolveRouteLocale(to), '/explore/yc/overview'),
      query: to.query,
      hash: to.hash,
    })
  },
  {
    path: 'explore/yc/overview',
    component: YangChunOverviewPage
  },
  {
    path: 'explore/yc/words',
    component: YangChunSpokenPage
  },
  {
    path: 'explore/yc/expressions',
    component: YangChunExpressionsPage
  },
  {
    path: 'explore/yc/villages',
    component: YangChunVillagesPage
  },
  {
    path: 'explore/villages/toponyms',
    component: ToponymsPage
  },
  {
    path: 'explore/villages/gd',
    component: GdVillagesTreePage
  },
  {
    path: 'explore/villages/table',
    component: GdVillagesTablePage
  },
  {
    path: 'explore/villages/yc',
    redirect: (to) => ({
      path: buildLocalePath(resolveRouteLocale(to), '/explore/yc/villages'),
      query: to.query,
      hash: to.hash,
    })
  },
  {
    path: 'explore/villages/ml',
    component: VillagesMLPage
  },
  {
    path: 'explore/villages/all',
    component: AllVillagesPage,
    beforeEnter: (to, from, next) => {
      if (userStore.role !== 'admin') {
        next({ path: from.path || '/', replace: true })
        return
      }
      next()
    }
  }
]
