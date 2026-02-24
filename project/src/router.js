// src/router.js
import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router'
import LikeAuthor from './views/intro/LikeAuthor.vue'
import Suggestions from './views/intro/Suggestions.vue'
import Thanks from './views/intro/Thanks.vue'
import Auth from './views/Auth.vue'
import UserDataPage from './components/user/UserDataPage.vue'
import UserRegionPage from './components/user/UserRegionPage.vue'
import MenuEntry from "@/views/MenuEntry.vue";
import ExploreEntry from "@/views/ExploreEntry.vue";
import VillagesMLEntry from "@/views/VillagesMLEntry.vue";
import IntroLayout from "@/layouts/IntroLayout.vue";
import { h, computed } from 'vue'
import { useRoute } from 'vue-router'
import {userStore} from "@/utils/store.js";

// 内联定义 intro 动态组件
const IntroEntry = {
    setup() {
        const route = useRoute()
        const activeComponent = computed(() => {
            const tab = route.query.tab
            const tabMap = {
                like: LikeAuthor,
                suggestions: Suggestions,
                thanks: Thanks
            }
            return tabMap[tab] || LikeAuthor
        })
        return () => h(activeComponent.value)
    }
}

const routes = [
    // ✅ 根路由 → 直接導到 /menu?tab=query
    {
        path: '/',
        redirect: { path: '/menu', query: { tab: 'query' } }
    },

    // ✅ /menu 佔位（由 beforeEach 動態注入組件）
    {
        path: '/menu',
        component: MenuEntry
    },

    // ✅ /explore 探索页面（使用 SimpleLayout）
    {
        path: '/explore',
        component: ExploreEntry
    },

    // ✅ /villagesML 村落機器學習（使用 SimpleLayout）
    {
        path: '/villagesML',
        component: VillagesMLEntry
    },

    {
        path: '/intro',
        component: IntroLayout,
        children: [
            {
                path: '',
                component: IntroEntry
            }
        ]
    },

    // 其他頁面
    {
        path: '/auth',
        component: Auth,
        meta: { title: '方音圖鑑 - 登錄' }
    },

    {
        path: '/auth/data',
        component: UserDataPage,
        meta: { title: '方音圖鑑 - 個人數據管理' },

    },

    {
        path: '/auth/regions',
        component: UserRegionPage,
        meta: { title: '方音圖鑑 - 個人分區管理' }
    },

    // 可選：兜底導回首頁（避免 404）
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    base:'/',
    history: createWebHistory(),
    // ❗hash 模式不需要傳 base，傳 '/' 會被忽略
    // history: createWebHashHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    }
})
const MenuTitleMap = {
    query: '方音圖鑑 - 查詢',
    result: '方音圖鑑 - 結果',
    map: '方音圖鑑 - 地圖',
    about:'方音圖鑑 - 關於網站',
    tools:'方音圖鑑 - 工具',
    pho:'方音圖鑑 - 音系',
    words:'方音圖鑑 - 詞彙',
    villages:'方音圖鑑 - 自然村',
    source:'方音圖鑑 - 資料來源',
    privacy:'方音圖鑑 - 隱私',
};
const ExploreTitleMap = {
    ycVillages: '方音圖鑑 - 陽春自然村',
    check: '方音圖鑑 - 字表檢查',
    jyut2ipa: '方音圖鑑 - 粵拼轉ipa',
    merge:'方音圖鑑 - 字表合併',
    gdVillages:'方音圖鑑 - 廣東自然村樹狀圖',
    manage: '方音圖鑑 - 表格管理',
    // 从 menu 迁移过来的页面
    ZhongGu:'方音圖鑑 - 中古漢字地位',
    ycSpoken: '方音圖鑑 - 陽春口語詞',
    YuBao:'方音圖鑑 - 語保資料',
    gdVillagesTable: '方音圖鑑 - 廣東自然村表格',
    phonologyMatrix: '方音圖鑑 - 音系表',
    phonologyCustom: '方音圖鑑 - 自定義音素表',
    Countphos: '方音圖鑑 - 音節統計',
    praat: '方音圖鑑 - 實驗語音學',
    VillagesML: '方音圖鑑 - 自然村機器學習'

};

// 全局导航守卫
router.beforeEach((to, from, next) => {
    let title = '方音圖鑑'; // 默认标题

    if (to.meta.title) {
        title = to.meta.title;
    }

    // 如果是 /menu 页面，检查查询参数
    if (to.path === '/menu') {
        const tab = to.query.tab; // 获取 `tab` 参数
        title = MenuTitleMap[tab] || '方音圖鑑'; // 根据 `tab` 获取对应的标题，如果没有匹配到则使用默认标题
    }
    if (to.path === '/explore') {
        const tab = to.query.page; // 获取 `tab` 参数
        title = ExploreTitleMap[tab] || '方音圖鑑'; // 根据 `tab` 获取对应的标题，如果没有匹配到则使用默认标题
    }

    // 1. 登錄守衛邏輯
    if (to.path === '/auth/data' || to.path === '/auth/regions') {
        // 如果未登錄，直接攔截並跳轉到登錄頁
        if (!userStore.isAuthenticated) {
            showWarningToast('未授權訪問，跳回登錄頁');
            return next({ path: '/auth', replace: true });
        }
    }

    // 设置页面标题
    document.title = title;

    // 继续导航
    next();
});

// ✅ 根據 query.tab 動態切換組件（/intro 與 /menu 各自映射）
// router.beforeEach((to, from, next) => {
//     if (!to.matched.length) return next()
//
//     if (to.path === '/menu') {
//         const tab = to.query.tab
//         const tabMap = {
//             query: QueryPage,
//             map: MapPage,
//             about: AboutPage,
//             result: ResultPage,
//             source:SourcePage,
//             privacy: PrivacyPage,
//             setting:SettingPage,
//         }
//         to.matched[0].components = {
//             default: tabMap[tab] || QueryPage
//         }
//     }
//
//     next()
// })

export default router

