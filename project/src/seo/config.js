const SEO_CONFIG = {
  siteOrigin: 'https://dialects.yzup.top',
  siteName: '方音圖鑑',
  siteNameLocales: {
    'zh-Hant': '方音圖鑑',
    'zh-CN': '方音图鉴',
    en: 'Dialects Atlas',
  },
  defaultLocale: 'zh-Hant',
  defaultTitle: {
    'zh-Hant': '方音圖鑑｜方言比較 · 地理語言學',
    'zh-CN': '方音图鉴｜方言比较 · 地理语言学',
    en: 'Dialects Atlas | Dialect Comparison · Geolinguistics',
  },
  defaultDescription: {
    'zh-Hant':
      '方音圖鑑是一個專注於方言比較與地理語言學的線上平台，提供查字、查中古、查音位、查調、音系分析、方言比較、地圖可視化與自然村資料等功能。',
    'zh-CN':
      '方音图鉴是一个专注于方言比较与地理语言学的在线平台，提供查字、查中古、查音位、查调、音系分析、方言比较、地图可视化与自然村资料等功能。',
    en: 'Dialects Atlas is an online platform focused on dialect comparison and geolinguistics, offering character lookup, Middle Chinese query, phoneme analysis, tone query, phonology analysis, dialect comparison, map visualization, and village datasets.',
  },
  routes: {
    '/': {
      title: {
        'zh-Hant': '方音圖鑑｜方言比較 · 地理語言學',
        'zh-CN': '方音图鉴｜方言比较 · 地理语言学',
        en: 'Dialects Atlas | Dialect Comparison · Geolinguistics',
      },
      description: {
        'zh-Hant':
          '方音圖鑑是一個專注於方言比較與地理語言學的線上平台，提供查字、查中古、查音位、查調、音系分析、方言比較、地圖可視化與自然村資料等功能。',
        'zh-CN':
          '方音图鉴是一个专注于方言比较与地理语言学的在线平台，提供查字、查中古、查音位、查调、音系分析、方言比较、地图可视化与自然村资料等功能。',
        en: 'Dialects Atlas is an online platform focused on dialect comparison and geolinguistics, offering character lookup, Middle Chinese query, phoneme analysis, tone query, phonology analysis, dialect comparison, map visualization, and village datasets.',
      },
    },
    '/auth': {
      title: {
        'zh-Hant': '登錄與註冊｜方音圖鑑',
        'zh-CN': '登录与注册｜方音图鉴',
        en: 'Login & Sign Up | Dialects Atlas',
      },
      description: {
        'zh-Hant': '登錄方音圖鑑帳號，使用郵箱或用戶名訪問自定義地圖、個人資料與更多進階功能。',
        'zh-CN': '登录方音图鉴账号，使用邮箱或用户名访问自定义地图、个人资料与更多进阶功能。',
        en: 'Sign in to Dialects Atlas with your email or username to access custom maps, personal data, and more advanced features.',
      },
    },
    '/auth/data': {
      title: {
        'zh-Hant': '個人資料中心｜方音圖鑑',
        'zh-CN': '个人资料中心｜方音图鉴',
        en: 'Profile Center | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看與管理方音圖鑑帳號的個人資料、頭像與帳號信息。',
        'zh-CN': '查看与管理方音图鉴账号的个人资料、头像与账号信息。',
        en: 'View and manage your Dialects Atlas profile, avatar, and account information.',
      },
    },
    '/auth/regions': {
      title: {
        'zh-Hant': '我的分區資料｜方音圖鑑',
        'zh-CN': '我的分区资料｜方音图鉴',
        en: 'My Region Data | Dialects Atlas',
      },
      description: {
        'zh-Hant': '管理方音圖鑑帳號下保存的自定義分區資料與相關內容。',
        'zh-CN': '管理方音图鉴账号下保存的自定义分区资料与相关内容。',
        en: 'Manage the custom region data and related saved content in your Dialects Atlas account.',
      },
    },
    '/menu/source': {
      title: {
        'zh-Hant': '資料來源｜方音圖鑑',
        'zh-CN': '资料来源｜方音图鉴',
        en: 'Data Sources | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱方音圖鑑所使用的方言字表來源、分區資訊與相關資料，了解網站收錄的方言點與資料構成。',
        'zh-CN': '查阅方音图鉴所使用的方言字表来源、分区信息与相关资料，了解网站收录的方言点与资料构成。',
        en: 'Browse the dialect tables, regional classifications, and related source materials used by Dialects Atlas, and understand how the site data is organized.',
      },
    },
    '/menu/privacy': {
      title: {
        'zh-Hant': '隱私政策與引用說明｜方音圖鑑',
        'zh-CN': '隐私政策与引用说明｜方音图鉴',
        en: 'Privacy Policy & Citation | Dialects Atlas',
      },
      description: {
        'zh-Hant': '了解方音圖鑑的隱私政策、資料使用方式與引用建議，查閱網站資料使用與學術引用的相關說明。',
        'zh-CN': '了解方音图鉴的隐私政策、资料使用方式与引用建议，查阅网站资料使用与学术引用的相关说明。',
        en: 'Learn about the privacy policy, data usage terms, and citation guidance for Dialects Atlas.',
      },
    },
    '/menu/query/char': {
      title: {
        'zh-Hant': '查字｜方音圖鑑',
        'zh-CN': '查字｜方音图鉴',
        en: 'Character Lookup | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢漢字的讀音、地位及注釋，結合地點與分區查看不同方言點的字音對應情況。',
        'zh-CN': '查询汉字的读音、地位及注释，结合地点与分区查看不同方言点的字音对应情况。',
        en: 'Look up the pronunciation, historical position, and notes of Chinese characters across different dialect locations and regions.',
      },
    },
    '/menu/query/zhonggu': {
      title: {
        'zh-Hant': '查中古｜方音圖鑑',
        'zh-CN': '查中古｜方音图鉴',
        en: 'Middle Chinese Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按中古地位整理各地讀音，支持攝、韻、等、呼、調、系、組、母、清濁、發音部位與發聲方式等多維條件查詢。',
        'zh-CN': '按中古地位整理各地读音，支持摄、韵、等、呼、调、系、组、母、清浊、发音部位与发声方式等多维条件查询。',
        en: 'Organize modern dialect readings by Middle Chinese position, with multi-dimensional filters such as rime groups, divisions, openness, tones, initials, voicing, place, and manner of articulation.',
      },
    },
    '/menu/query/yinwei': {
      title: {
        'zh-Hant': '查音位｜方音圖鑑',
        'zh-CN': '查音位｜方音图鉴',
        en: 'Phoneme Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '分析音位的中古來源，支持按聲母、韻母、聲調等條件檢索，結合地點與分區查看不同方言點的對應關係。',
        'zh-CN': '分析音位的中古来源，支持按声母、韵母、声调等条件检索，结合地点与分区查看不同方言点的对应关系。',
        en: 'Analyze the Middle Chinese origins of phonemes across dialect locations using filters such as initials, finals, and tones.',
      },
    },
    '/menu/query/tone': {
      title: {
        'zh-Hant': '查調｜方音圖鑑',
        'zh-CN': '查调｜方音图鉴',
        en: 'Tone Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢各地方言的調類與調值，結合地點與分區查看不同方言點的聲調系統。',
        'zh-CN': '查询各地方言的调类与调值，结合地点与分区查看不同方言点的声调系统。',
        en: 'Query tone categories and pitch values across dialect locations and compare their tonal systems.',
      },
    },
    '/menu/compare/char': {
      title: {
        'zh-Hant': '漢字對比｜方音圖鑑',
        'zh-CN': '汉字对比｜方音图鉴',
        en: 'Character Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較同一漢字在不同地點的讀音差異，觀察方言間字音對應與變化情況。',
        'zh-CN': '比较同一汉字在不同地点的读音差异，观察方言间字音对应与变化情况。',
        en: 'Compare how the same Chinese character is pronounced across different dialect locations.',
      },
    },
    '/menu/compare/zhonggu': {
      title: {
        'zh-Hant': '中古對比｜方音圖鑑',
        'zh-CN': '中古对比｜方音图鉴',
        en: 'Middle Chinese Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較同一中古地位在不同地點的演變情況，觀察方言間的音韻對應與分化。',
        'zh-CN': '比较同一中古地位在不同地点的演变情况，观察方言间的音韵对应与分化。',
        en: 'Compare how the same Middle Chinese category evolves across dialect locations.',
      },
    },
    '/menu/compare/tone': {
      title: {
        'zh-Hant': '調類對比｜方音圖鑑',
        'zh-CN': '调类对比｜方音图鉴',
        en: 'Tone Category Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較兩個調類在不同地點是合流還是分立，觀察各地方言聲調系統的差異。',
        'zh-CN': '比较两个调类在不同地点是合流还是分立，观察各地方言声调系统的差异。',
        en: 'Compare whether two tone categories merge or remain distinct across dialect locations.',
      },
    },
    '/menu/compare/phonetic': {
      title: {
        'zh-Hant': '音值對比｜方音圖鑑',
        'zh-CN': '音值对比｜方音图鉴',
        en: 'Phonetic Value Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較不同地點的音值對應關係，觀察所選方言點之間的音系相似與差異。',
        'zh-CN': '比较不同地点的音值对应关系，观察所选方言点之间的音系相似与差异。',
        en: 'Compare phonetic value correspondences across selected dialect locations and examine their phonological similarities and differences.',
      },
    },
    '/menu/pho/matrix': {
      title: {
        'zh-Hant': '音系查詢｜方音圖鑑',
        'zh-CN': '音系查询｜方音图鉴',
        en: 'Phonology Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢方言音系表，按聲母、韻母、聲調及多種中古分類維度查看音系結構。',
        'zh-CN': '查询方言音系表，按声母、韵母、声调及多种中古分类维度查看音系结构。',
        en: 'Query dialect phonology tables by initials, finals, tones, and multiple Middle Chinese classification dimensions.',
      },
    },
    '/menu/pho/custom': {
      title: {
        'zh-Hant': '音素分類｜方音圖鑑',
        'zh-CN': '音素分类｜方音图鉴',
        en: 'Phoneme Classification | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以自定義分類方式查看方言音素結構，支持按多種維度組織與觀察音系資料。',
        'zh-CN': '以自定义分类方式查看方言音素结构，支持按多种维度组织与观察音系资料。',
        en: 'Inspect dialect phoneme structures with customizable classification dimensions and organization rules.',
      },
    },
    '/menu/pho/count': {
      title: {
        'zh-Hant': '音節統計｜方音圖鑑',
        'zh-CN': '音节统计｜方音图鉴',
        en: 'Syllable Statistics | Dialects Atlas',
      },
      description: {
        'zh-Hant': '統計不同地點的音節數據，查看方言音節結構與分佈情況。',
        'zh-CN': '统计不同地点的音节数据，查看方言音节结构与分布情况。',
        en: 'Count and inspect syllable statistics across dialect locations to understand their phonological distribution.',
      },
    },
    '/menu/pho/evolution': {
      title: {
        'zh-Hant': '演變｜方音圖鑑',
        'zh-CN': '演变｜方音图鉴',
        en: 'Evolution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以圖表方式展示方言演變情況，觀察不同特徵在地點之間的對應與分化。',
        'zh-CN': '以图表方式展示方言演变情况，观察不同特征在地点之间的对应与分化。',
        en: 'Visualize dialect evolution with charts to examine correspondences and differentiation across locations.',
      },
    },
    '/explore/yubao': {
      title: {
        'zh-Hant': '詞彙與語法｜方音圖鑑',
        'zh-CN': '词汇与语法｜方音图鉴',
        en: 'Vocabulary & Grammar | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱語保詞彙與語保語法資料，支持詞彙、語法句式的查詢、篩選與地圖展示。',
        'zh-CN': '查阅语保词汇与语保语法资料，支持词汇、语法句式的查询、筛选与地图展示。',
        en: 'Browse language preservation vocabulary and grammar materials with search, filtering, and map-based views.',
      },
    },
    '/explore/char-class': {
      title: {
        'zh-Hant': '漢字地位｜方音圖鑑',
        'zh-CN': '汉字地位｜方音图鉴',
        en: 'Character Phonological Status | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱中古漢語、上古漢語、近古漢語與粵語韻書等歷代漢字音韻地位資料。',
        'zh-CN': '查阅中古汉语、上古汉语、近古汉语与粤语韵书等历代汉字音韵地位资料。',
        en: 'Explore phonological status data of Chinese characters across Middle Chinese, Old Chinese, Early Modern Chinese, and Cantonese rhyme books.',
      },
    },
    '/explore/yc-spoken': {
      title: {
        'zh-Hant': '陽春口語詞｜方音圖鑑',
        'zh-CN': '阳春口语词｜方音图鉴',
        en: 'Yangchun Colloquial Words | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱廣東陽春口語詞資料，了解字音、詞性、釋義與例詞例句等內容。',
        'zh-CN': '查阅广东阳春口语词资料，了解字音、词性、释义与例词例句等内容。',
        en: 'Browse Yangchun colloquial word materials, including pronunciation, part of speech, definitions, and usage examples.',
      },
    },
    '/explore/villages/gd': {
      title: {
        'zh-Hant': '廣東自然村｜方音圖鑑',
        'zh-CN': '广东自然村｜方音图鉴',
        en: 'Guangdong Villages | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看廣東自然村樹狀圖與村落資料，探索廣東省自然村的層級與分佈。',
        'zh-CN': '查看广东自然村树状图与村落资料，探索广东省自然村的层级与分布。',
        en: 'Explore Guangdong natural villages through hierarchical views and village-level data.',
      },
    },
    '/explore/villages/table': {
      title: {
        'zh-Hant': '全粵村情表格｜方音圖鑑',
        'zh-CN': '全粤村情表格｜方音图鉴',
        en: 'Guangdong Villages Table | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱廣東省自然村表格資料，查看地級、縣級、鎮級、自然村與方言等信息。',
        'zh-CN': '查阅广东省自然村表格资料，查看地级、县级、镇级、自然村与方言等信息。',
        en: 'Browse tabular data of Guangdong natural villages, including prefecture, county, town, village, and dialect information.',
      },
    },
    '/explore/villages/yc': {
      title: {
        'zh-Hant': '陽春自然村｜方音圖鑑',
        'zh-CN': '阳春自然村｜方音图鉴',
        en: 'Yangchun Villages | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱陽春自然村資料與行政規劃，探索村委、社區與自然村的層級關係。',
        'zh-CN': '查阅阳春自然村资料与行政规划，探索村委、社区与自然村的层级关系。',
        en: 'Browse Yangchun village data and administrative structure, including communities and natural villages.',
      },
    },
    '/explore/villages/ml': {
      title: {
        'zh-Hant': '自然村機器學習｜方音圖鑑',
        'zh-CN': '自然村机器学习｜方音图鉴',
        en: 'Natural Villages Machine Learning | Dialects Atlas',
      },
      description: {
        'zh-Hant': '基於自然村資料進行機器學習與語言學分析，涵蓋村名搜尋、字頻分析、語義分析、空間分析、模式分析、區域分析與 ML 計算。',
        'zh-CN': '基于自然村资料进行机器学习与语言学分析，涵盖村名搜索、字频分析、语义分析、空间分析、模式分析、区域分析与 ML 计算。',
        en: 'Analyze natural village data with machine learning and linguistics workflows, including village search, character frequency, semantics, spatial analysis, patterns, regional analysis, and ML computation.',
      },
    },
    '/menu/tools': {
      title: {
        'zh-Hant': '工具箱｜方音圖鑑',
        'zh-CN': '工具箱｜方音图鉴',
        en: 'Tools | Dialects Atlas',
      },
      description: {
        'zh-Hant': '集中查看字表檢查、粵拼轉 IPA、字表合併與聲學分析等工具入口。',
        'zh-CN': '集中查看字表检查、粤拼转 IPA、字表合并与声学分析等工具入口。',
        en: 'Browse entry points to character table checking, Jyutping-to-IPA conversion, table merging, and acoustic analysis tools.',
      },
    },
    '/menu/words': {
      title: {
        'zh-Hant': '詞彙與語法｜方音圖鑑',
        'zh-CN': '词汇与语法｜方音图鉴',
        en: 'Vocabulary & Grammar | Dialects Atlas',
      },
      description: {
        'zh-Hant': '集中查看語保詞彙、語保語法與陽春口語詞等詞句資料入口。',
        'zh-CN': '集中查看语保词汇、语保语法与阳春口语词等词句资料入口。',
        en: 'Browse entry points to language preservation vocabulary, grammar materials, and Yangchun colloquial word resources.',
      },
    },
    '/menu/villages': {
      title: {
        'zh-Hant': '自然村｜方音圖鑑',
        'zh-CN': '自然村｜方音图鉴',
        en: 'Villages | Dialects Atlas',
      },
      description: {
        'zh-Hant': '集中查看廣東自然村、全粵村情表格、陽春自然村與廣東自然村分析等資料入口。',
        'zh-CN': '集中查看广东自然村、全粤村情表格、阳春自然村与广东自然村分析等资料入口。',
        en: 'Browse entry points to Guangdong villages, village tables, Yangchun villages, and Guangdong village analysis resources.',
      },
    },
    '/menu/cluster': {
      title: {
        'zh-Hant': '聚類｜方音圖鑑',
        'zh-CN': '聚类｜方音图鉴',
        en: 'Clustering | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看方言聚類流程、任務配置與結果分析，探索多步驟聚類工作流。',
        'zh-CN': '查看方言聚类流程、任务配置与结果分析，探索多步骤聚类工作流。',
        en: 'Explore the dialect clustering workflow, including task setup, step-by-step processing, and result analysis.',
      },
    },
    '/menu/map/view': {
      title: {
        'zh-Hant': '地圖｜方音圖鑑',
        'zh-CN': '地图｜方音图鉴',
        en: 'Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以地圖方式查看方言資料、分區結果與自定義繪圖內容，從地理語言學視角探索方言分佈。',
        'zh-CN': '以地图方式查看方言资料、分区结果与自定义绘图内容，从地理语言学视角探索方言分布。',
        en: 'View dialect data, regional mapping, and custom map layers through an interactive geolinguistic map interface.',
      },
    },
  },
}

export const SITEMAP_PATHS = [
  '/',
  '/menu/source',
  '/menu/privacy',
  '/menu/about/settings',
  '/menu/about/intro',
  '/menu/about/suggestion',
  '/menu/about/like',
  '/menu/query/char',
  '/menu/query/zhonggu',
  '/menu/query/yinwei',
  '/menu/query/tone',
  '/menu/compare/char',
  '/menu/compare/zhonggu',
  '/menu/compare/tone',
  '/menu/compare/phonetic',
  '/menu/pho/matrix',
  '/menu/pho/custom',
  '/menu/pho/count',
  '/menu/pho/evolution',
  '/menu/map/view',
  '/menu/map/divide',
  '/menu/map/custom',
  '/menu/map/draw',
  '/menu/result',
  '/menu/tools',
  '/menu/words',
  '/menu/villages',
  '/menu/cluster',
  '/explore',
  '/explore/tools/check',
  '/explore/tools/jyut2ipa',
  '/explore/tools/merge',
  '/explore/tools/derive',
  '/explore/tools/praat',
  '/explore/manage',
  '/explore/yubao',
  '/explore/char-class',
  '/explore/yc-spoken',
  '/explore/villages/gd',
  '/explore/villages/table',
  '/explore/villages/yc',
  '/explore/villages/ml',
]

export const NOINDEX_PATHS = new Set([
  '/intro',
  '/auth/data',
  '/auth/regions',
])

export default SEO_CONFIG
