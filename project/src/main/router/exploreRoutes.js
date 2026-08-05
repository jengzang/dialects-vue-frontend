import { userStore } from '@/main/store/store.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const CheckTool = () => import('@/main/views/explore/tools/CheckTool.vue')
const Jyut2IpaTool = () => import('@/main/views/explore/tools/Jyut2IpaTool.vue')
const MergeTool = () => import('@/main/views/explore/tools/MergeTool.vue')
const DeriveTool = () => import('@/main/views/explore/tools/DeriveTool.vue')
const PraatPage = () => import('@/main/views/Praat.vue')
const GisPage = () => import('@/main/views/explore/GisPage.vue')
const TableManagePage = () => import('@/main/views/explore/tools/TableManage.vue')
const YuBaoPage = () => import('@/main/views/explore/word/YuBaoPage.vue')
const VocabularyPage = () => import('@/main/views/explore/word/VocabularyPage.vue')
const VocabularyViewPage = () => import('@/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
const VocabularyImportPage = () => import('@/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
const VocabularyManagePage = () => import('@/main/views/explore/word/vocabulary/VocabularyManagePage.vue')
const CharacterClassificationPage = () => import('@/main/views/explore/charClass/CharacterClassification.vue')
const YangChunSpokenPage = () => import('@/main/views/explore/word/YangChunSpoken.vue')
const GdVillagesTreePage = () => import('@/main/views/explore/villages/gdVillagesTree.vue')
const GdVillagesTablePage = () => import('@/main/views/explore/villages/gdVillagesTable.vue')
const YangChunVillagesPage = () => import('@/main/views/explore/villages/YangChunVillages.vue')
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
    component: PraatPage
  },
  {
    path: 'explore/gis',
    component: GisPage
  },
  {
    path: 'explore/manage',
    component: TableManagePage
  },
  {
    path: 'explore/yubao',
    component: YuBaoPage
  },
  {
    path: 'explore/vocabulary',
    component: VocabularyPage,
    redirect: (to) => ({
      path: buildLocalePath(resolveRouteLocale(to), '/explore/vocabulary/view'),
      query: to.query,
      hash: to.hash,
    }),
    children: [
      {
        path: 'view',
        component: VocabularyViewPage
      },
      {
        path: 'import',
        component: VocabularyImportPage
      },
      {
        path: 'manage',
        component: VocabularyManagePage
      }
    ]
  },
  {
    path: 'explore/char-class',
    component: CharacterClassificationPage
  },
  {
    path: 'explore/yc-spoken',
    component: YangChunSpokenPage
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
    component: YangChunVillagesPage
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
