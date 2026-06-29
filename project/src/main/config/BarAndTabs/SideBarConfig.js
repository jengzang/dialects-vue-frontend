import { buildLocalePath } from '@/i18n/localeRouting.js'
// Menu configuration for navigation system (i18n version)
// Supports two-level navigation: direct links and expandable submenus

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useSidebarConfig() {
    const { t } = useI18n()

    return computed(() => ({
        home: {
            label: t('navigation.menu.home'),
            icon: '🏠',
            path: buildLocalePath('zh-Hant', '/'),
            external: true,
            children: null
        },
        query: {
            label: t('navigation.menu.query'),
            icon: '🔍',
            path: buildLocalePath('zh-Hant', '/menu/query/zhonggu'),
            children: [
                { label: t('navigation.submenu.query.tab1'), icon: '🔣', path: buildLocalePath('zh-Hant', '/menu/query/char') },
                { label: t('navigation.submenu.query.tab2'), icon: '📜', path: buildLocalePath('zh-Hant', '/menu/query/zhonggu') },
                { label: t('navigation.submenu.query.tab3'), icon: '🗣️', path: buildLocalePath('zh-Hant', '/menu/query/yinwei') },
                { label: t('navigation.submenu.query.tab4'), icon: '🎼', path: buildLocalePath('zh-Hant', '/menu/query/tone') }
            ]
        },
        compare: {
            label: t('navigation.menu.compare'),
            icon: '↔️',
            path: buildLocalePath('zh-Hant', '/menu/compare/zhonggu'),
            children: [
                { label: t('navigation.submenu.compare.tab1'), icon: '↔️', path: buildLocalePath('zh-Hant', '/menu/compare/char') },
                { label: t('navigation.submenu.compare.tab2'), icon: '📜', path: buildLocalePath('zh-Hant', '/menu/compare/zhonggu') },
                { label: t('navigation.submenu.compare.tab4'), icon: '📈', path: buildLocalePath('zh-Hant', '/menu/compare/tone') },
                { label: t('navigation.submenu.compare.tab5'), icon: '🎵', path: buildLocalePath('zh-Hant', '/menu/compare/phonetic') }
            ]
        },
        pho: {
            label: t('navigation.menu.pho'),
            icon: '🧬',
            path: buildLocalePath('zh-Hant', '/menu/pho/matrix'),
            children: [
                { label: t('navigation.submenu.pho.phonologyMatrix'), icon: '⚛️', path: buildLocalePath('zh-Hant', '/menu/pho/matrix') },
                { label: t('navigation.submenu.pho.phonologyCustom'), icon: '📐', path: buildLocalePath('zh-Hant', '/menu/pho/custom') },
                { label: t('navigation.submenu.pho.Countphos'), icon: '🧮', path: buildLocalePath('zh-Hant', '/menu/pho/count') },
                { label: t('navigation.submenu.pho.evolution'), icon: '🥧', path: buildLocalePath('zh-Hant', '/menu/pho/evolution') }
            ]
        },
        // cluster intentionally remains disabled in the i18n sidebar config.
        charClass: {
            label: t('navigation.menu.charClass'),
            icon: '📚',
            path: buildLocalePath('zh-Hant', '/explore/char-class?tab=zhonggu'),
            children: [
                { label: t('navigation.submenu.charClass.zhonggu'), icon: '📜', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=zhonggu') },
                { label: t('navigation.submenu.charClass.shanggu'), icon: '🏛️', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=shanggu') },
                { label: t('navigation.submenu.charClass.jingu'), icon: '📖', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=jingu') },
                { label: t('navigation.submenu.charClass.yueyun'), icon: '🎵', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=yueyun') }
            ]
        },
        words: {
            label: t('navigation.menu.words'),
            icon: '📖',
            path: buildLocalePath('zh-Hant', '/menu/words'),
            children: [
                { label: t('navigation.submenu.words.vocabulary'), icon: '📖', path: buildLocalePath('zh-Hant', '/explore/yubao?tab=vocabulary') },
                { label: t('navigation.submenu.words.grammar'), icon: '🗣️', path: buildLocalePath('zh-Hant', '/explore/yubao?tab=grammar') },
                { label: t('navigation.submenu.words.ycSpoken'), icon: '💬', path: buildLocalePath('zh-Hant', '/explore/yc-spoken') }
            ]
        },
        villages: {
            label: t('navigation.menu.villages'),
            icon: '🏘️',
            path: buildLocalePath('zh-Hant', '/menu/villages'),
            children: [
                { label: t('navigation.submenu.villages.gdVillages'), icon: '🏘️', path: buildLocalePath('zh-Hant', '/explore/villages/gd') },
                { label: t('navigation.submenu.villages.VillagesML'), icon: '🤖', path: buildLocalePath('zh-Hant', '/explore/villages/ml') },
                { label: t('navigation.submenu.villages.gdVillagesTable'), icon: '📊', path: buildLocalePath('zh-Hant', '/explore/villages/table') },
                { label: t('navigation.submenu.villages.ycVillages'), icon: '🏕️', path: buildLocalePath('zh-Hant', '/explore/villages/yc') }
            ]
        },
        source: {
            label: t('navigation.menu.source'),
            icon: '📚',
            path: buildLocalePath('zh-Hant', '/menu/source'),
            children: [
                { label: t('navigation.submenu.source.source'), icon: '📋', path: buildLocalePath('zh-Hant', '/menu/source') },
                { label: t('navigation.submenu.source.privacy'), icon: '🔒', path: buildLocalePath('zh-Hant', '/menu/privacy') },
                { label: t('navigation.submenu.source.suggestion'), icon: '💬', path: buildLocalePath('zh-Hant', '/menu/about/suggestion') },
                { label: t('navigation.submenu.source.like'), icon: '❤️', path: buildLocalePath('zh-Hant', '/menu/about/like') }
            ]
        },
        tools: {
            label: t('navigation.menu.tools'),
            icon: '🧰',
            path: buildLocalePath('zh-Hant', '/menu/tools'),
            children: [
                { label: t('navigation.submenu.tools.check'), icon: '📝', path: buildLocalePath('zh-Hant', '/explore/tools/check') },
                { label: t('navigation.submenu.tools.jyut2ipa'), icon: '🔤', path: buildLocalePath('zh-Hant', '/explore/tools/jyut2ipa') },
                { label: t('navigation.submenu.tools.merge'), icon: '🔗', path: buildLocalePath('zh-Hant', '/explore/tools/merge') },
                { label: t('navigation.submenu.tools.derive'), icon: '🧪', path: buildLocalePath('zh-Hant', '/explore/tools/derive') },
                // { label: t('navigation.submenu.tools.praat'), icon: '👂️', path: buildLocalePath('zh-Hant', '/explore/tools/praat') }
            ]
        },
        praat: {
            label: t('navigation.submenu.tools.praatname'), 
            icon: '🎙️', 
            path: buildLocalePath('zh-Hant', '/explore/tools/praat'),
            external: true,
            children: null
        },
        about_ontop: {
            label: t('navigation.menu.about_ontop'),
            icon: '🌐',
            path: buildLocalePath('zh-Hant', '/menu/about/settings'),
            children: [
                { label: t('navigation.submenu.about.intro'), icon: 'ℹ️', path: buildLocalePath('zh-Hant', '/menu/about/intro') },
                { label: t('navigation.submenu.about.suggestion'), icon: '💬', path: buildLocalePath('zh-Hant', '/menu/about/suggestion') },
                { label: t('navigation.submenu.about.like'), icon: '❤️', path: buildLocalePath('zh-Hant', '/menu/about/like') },
                { label: t('navigation.submenu.about.setting'), icon: '⚙️', path: buildLocalePath('zh-Hant', '/menu/about/settings') }
            ],
            showIn: ['none']
        }
    }))
}

export const SideConfig = {
    home: {
        label: '首頁',
        icon: '🏠',
        path: buildLocalePath('zh-Hant', '/'),
        external: true,
        children: null
    },
    query: {
        label: '查詢',
        icon: '🔍',
        path: buildLocalePath('zh-Hant', '/menu/query/zhonggu'),
        children: [
            { label: '查字', icon: '🔤', path: buildLocalePath('zh-Hant', '/menu/query/char') },
            { label: '查中古', icon: '📜', path: buildLocalePath('zh-Hant', '/menu/query/zhonggu') },
            { label: '查音系', icon: '🗂️', path: buildLocalePath('zh-Hant', '/menu/query/yinwei') },
            { label: '查調', icon: '🎙️', path: buildLocalePath('zh-Hant', '/menu/query/tone') }
        ]
    },
    compare: {
        label: '比較',
        icon: '↔️',
        path: buildLocalePath('zh-Hant', '/menu/compare/zhonggu'),
        children: [
            { label: '漢字對比', icon: '🆚', path: buildLocalePath('zh-Hant', '/menu/compare/char') },
            { label: '中古對比', icon: '📜', path: buildLocalePath('zh-Hant', '/menu/compare/zhonggu') },
            { label: '調類對比', icon: '📊', path: buildLocalePath('zh-Hant', '/menu/compare/tone') },
            { label: '音值對比', icon: '🎵', path: buildLocalePath('zh-Hant', '/menu/compare/phonetic') }
        ]
    },
    pho: {
        label: '音系',
        icon: '🗣️',
        path: buildLocalePath('zh-Hant', '/menu/pho/matrix'),
        children: [
            { label: '音系查詢', icon: '⚙️', path: buildLocalePath('zh-Hant', '/menu/pho/matrix') },
            { label: '音素分類', icon: '🧩', path: buildLocalePath('zh-Hant', '/menu/pho/custom') },
            { label: '音節統計', icon: '🧮', path: buildLocalePath('zh-Hant', '/menu/pho/count') },
            { label: '演變', icon: '🧬', path: buildLocalePath('zh-Hant', '/menu/pho/evolution') }
        ]
    },
    cluster: {
        label: '聚類',
        icon: '🧩',
        path: buildLocalePath('zh-Hant', '/menu/cluster'),
        children: null
    },
    charClass: {
        label: '漢字',
        icon: '📚',
        path: buildLocalePath('zh-Hant', '/explore/char-class?tab=zhonggu'),
        children: [
            { label: '中古漢語', icon: '📜', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=zhonggu') },
            { label: '上古漢語', icon: '🏺', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=shanggu') },
            { label: '近代漢語', icon: '📖', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=jingu') },
            { label: '粵語韻書', icon: '📗', path: buildLocalePath('zh-Hant', '/explore/char-class?tab=yueyun') }
        ]
    },
    words: {
        label: '詞句',
        icon: '💬',
        path: buildLocalePath('zh-Hant', '/menu/words'),
        children: [
            { label: '語保詞彙', icon: '📝', path: buildLocalePath('zh-Hant', '/explore/yubao?tab=vocabulary') },
            { label: '語保語法', icon: '🗂️', path: buildLocalePath('zh-Hant', '/explore/yubao?tab=grammar') },
            { label: '陽春口語詞', icon: '🗣️', path: buildLocalePath('zh-Hant', '/explore/yc-spoken') }
        ]
    },
    villages: {
        label: '自然村',
        icon: '🏕️',
        path: buildLocalePath('zh-Hant', '/menu/villages'),
        children: [
            { label: '廣東自然村', icon: '🏕️', path: buildLocalePath('zh-Hant', '/explore/villages/gd') },
            { label: '機器學習', icon: '🤖', path: buildLocalePath('zh-Hant', '/explore/villages/ml') },
            { label: '全粵村情表格', icon: '📊', path: buildLocalePath('zh-Hant', '/explore/villages/table') },
            { label: '陽春自然村', icon: '🏠', path: buildLocalePath('zh-Hant', '/explore/villages/yc') }
        ]
    },
    tools: {
        label: '工具',
        icon: '🛠️',
        path: buildLocalePath('zh-Hant', '/menu/tools'),
        children: [
            { label: '字表工具', icon: '📋', path: buildLocalePath('zh-Hant', '/explore/tools/check') },
            { label: '粵拼轉IPA', icon: '🔄', path: buildLocalePath('zh-Hant', '/explore/tools/jyut2ipa') },
            { label: '字表合併', icon: '🔗', path: buildLocalePath('zh-Hant', '/explore/tools/merge') },
            { label: '字表推導', icon: '🧪', path: buildLocalePath('zh-Hant', '/explore/tools/derive') },
            { label: '聲學分析', icon: '🌊', path: buildLocalePath('zh-Hant', '/explore/tools/praat') }
        ]
    },
    source: {
        label: '資料源',
        icon: '📂',
        path: buildLocalePath('zh-Hant', '/menu/source'),
        children: [
            { label: '字表來源', icon: '📋', path: buildLocalePath('zh-Hant', '/menu/source') },
            { label: '隱私政策', icon: '🛡️', path: buildLocalePath('zh-Hant', '/menu/privacy') },
            { label: '提出建議', icon: '💡', path: buildLocalePath('zh-Hant', '/menu/about/suggestion') },
            { label: '喜歡作者', icon: '❤️', path: buildLocalePath('zh-Hant', '/menu/about/like') }
        ]
    },
    about_ontop: {
        label: '關於網站',
        icon: '🌐',
        path: buildLocalePath('zh-Hant', '/menu/about/intro'),
        children: [
            { label: '簡介', icon: 'ℹ️', path: buildLocalePath('zh-Hant', '/menu/about/intro') },
            { label: '提出建議', icon: '💡', path: buildLocalePath('zh-Hant', '/menu/about/suggestion') },
            { label: '喜歡作者', icon: '❤️', path: buildLocalePath('zh-Hant', '/menu/about/like') },
            { label: '設置', icon: '⚙️', path: buildLocalePath('zh-Hant', '/menu/about/settings') }
        ],
        showIn: ['none']
    }
}
