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
    '/menu/yubao': {
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
    '/explore/yc/overview': {
      title: {
        'zh-Hant': '陽春方言概覽｜方音圖鑑',
        'zh-CN': '阳春方言概览｜方音图鉴',
        en: 'Yangchun Dialect Overview | Dialects Atlas',
      },
      description: {
        'zh-Hant': '了解陽春方言的分佈、接觸關係與音系特徵，從地理與材料來源角度瀏覽陽春方言概況。',
        'zh-CN': '了解阳春方言的分布、接触关系与音系特征，从地理与材料来源角度浏览阳春方言概况。',
        en: 'Explore the distribution, contact patterns, and phonological features of Yangchun dialects through geographic and source-based overview materials.',
      },
    },
    '/explore/yc/words': {
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
    '/explore/yc/expressions': {
      title: {
        'zh-Hant': '陽春熟語與疊式詞｜方音圖鑑',
        'zh-CN': '阳春熟语与叠式词｜方音图鉴',
        en: 'Yangchun Expressions and Reduplicatives | Dialects Atlas',
      },
      description: {
        'zh-Hant': '瀏覽陽春熟語、歇後語、農諺與疊式詞示例，按類型與詞形模式查看地方語言材料。',
        'zh-CN': '浏览阳春熟语、歇后语、农谚与叠式词示例，按类型与词形模式查看地方语言材料。',
        en: 'Browse Yangchun expressions, sayings, proverbs, and reduplicative forms by category and word pattern.',
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
    '/explore/villages/all': {
      title: {
        'zh-Hant': '全部自然村資料｜方音圖鑑',
        'zh-CN': '全部自然村资料｜方音图鉴',
        en: 'All Village Data | Dialects Atlas',
      },
      description: {
        'zh-Hant': '管理員使用的全部自然村資料入口，支持按城市載入與查看自然村資料。',
        'zh-CN': '管理员使用的全部自然村资料入口，支持按城市加载与查看自然村资料。',
        en: 'Admin-facing entry for browsing all village records by city and inspecting village data.',
      },
    },
    '/explore/villages/yc': {
      redirect: '/explore/yc/villages'
    },
    '/explore/yc/villages': {
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
      redirect: '/menu/vocabulary'
    },
    '/menu/vocabulary': {
      title: {
        'zh-Hant': '詞表｜方音圖鑑',
        'zh-CN': '词表｜方音图鉴',
        en: 'Vocabulary List | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查閱詞彙資料，支持卡片、地圖、表格三種視圖，以及詞彙上傳與管理。',
        'zh-CN': '查阅词汇资料，支持卡片、地图、表格三种视图，以及词汇上传与管理。',
        en: 'Browse vocabulary materials with card, map, and table views, plus upload and management features.',
      },
    },
    '/menu/vocabulary/view': {
      title: {
        'zh-Hant': '詞表瀏覽｜方音圖鑑',
        'zh-CN': '词表浏览｜方音图鉴',
        en: 'Vocabulary Browser | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以卡片、地圖或表格視圖瀏覽方言詞彙資料，支持分類篩選與搜索。',
        'zh-CN': '以卡片、地图或表格视图浏览方言词汇资料，支持分类筛选与搜索。',
        en: 'Browse dialect vocabulary in card, map, or table views with category filtering and search.',
      },
    },
    '/menu/vocabulary/import': {
      title: {
        'zh-Hant': '詞表匯入｜方音圖鑑',
        'zh-CN': '词表导入｜方音图鉴',
        en: 'Vocabulary Import | Dialects Atlas',
      },
      description: {
        'zh-Hant': '匯入方言詞彙資料，支持批量上傳與格式校驗。',
        'zh-CN': '导入方言词汇资料，支持批量上传与格式校验。',
        en: 'Import dialect vocabulary data with batch upload and format validation.',
      },
    },
    '/menu/vocabulary/manage': {
      title: {
        'zh-Hant': '詞表管理｜方音圖鑑',
        'zh-CN': '词表管理｜方音图鉴',
        en: 'Vocabulary Management | Dialects Atlas',
      },
      description: {
        'zh-Hant': '管理方言詞彙資料庫，支持編輯、刪除與批量操作。',
        'zh-CN': '管理方言词汇数据库，支持编辑、删除与批量操作。',
        en: 'Manage the dialect vocabulary database with editing, deletion, and batch operations.',
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
    '/menu/map/divide': {
      title: {
        'zh-Hant': '分區地圖｜方音圖鑑',
        'zh-CN': '分区地图｜方音图鉴',
        en: 'Dialect Division Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以地圖方式查看方言分區結果，從地理語言學視角探索方言分區與分佈。',
        'zh-CN': '以地图方式查看方言分区结果，从地理语言学视角探索方言分区与分布。',
        en: 'Explore dialect division results through an interactive geolinguistic map of dialect regions.',
      },
    },
    '/menu/map/custom': {
      title: {
        'zh-Hant': '自定義地圖｜方音圖鑑',
        'zh-CN': '自定义地图｜方音图鉴',
        en: 'Custom Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '在互動地圖上繪製與管理自定義區域、標記與圖層，建立個人化的方言地圖。',
        'zh-CN': '在交互地图上绘制与管理自定义区域、标记与图层，建立个人化的方言地图。',
        en: 'Draw and manage custom regions, markers, and layers on an interactive map for personalized dialect mapping.',
      },
    },
    '/menu/settings': {
      title: {
        'zh-Hant': '設定｜方音圖鑑',
        'zh-CN': '设置｜方音图鉴',
        en: 'Settings | Dialects Atlas',
      },
      description: {
        'zh-Hant': '管理方音圖鑑的帳號設定、語言偏好與個人化選項。',
        'zh-CN': '管理方音图鉴的账号设置、语言偏好与个性化选项。',
        en: 'Manage your Dialects Atlas account settings, language preferences, and personalization options.',
      },
    },
    '/menu/result': {
      title: {
        'zh-Hant': '查詢結果｜方音圖鑑',
        'zh-CN': '查询结果｜方音图鉴',
        en: 'Query Results | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看方言查詢結果，以表格形式瀏覽字音、音位、中古地位與聲調等資料。',
        'zh-CN': '查看方言查询结果，以表格形式浏览字音、音位、中古地位与声调等资料。',
        en: 'View dialect query results in table format, including character pronunciation, phoneme, Middle Chinese position, and tone data.',
      },
    },
    '/menu/about/intro': {
      title: {
        'zh-Hant': '項目介紹｜方音圖鑑',
        'zh-CN': '项目介绍｜方音图鉴',
        en: 'About | Dialects Atlas',
      },
      description: {
        'zh-Hant': '了解方音圖鑑項目的背景、目標與功能介紹。',
        'zh-CN': '了解方音图鉴项目的背景、目标与功能介绍。',
        en: 'Learn about the background, goals, and features of the Dialects Atlas project.',
      },
    },
    '/menu/about/suggestion': {
      title: {
        'zh-Hant': '意見反饋｜方音圖鑑',
        'zh-CN': '意见反馈｜方音图鉴',
        en: 'Feedback | Dialects Atlas',
      },
      description: {
        'zh-Hant': '向方音圖鑑提交意見反饋、功能建議或問題回報。',
        'zh-CN': '向方音图鉴提交意见反馈、功能建议或问题回报。',
        en: 'Submit feedback, feature suggestions, or bug reports to the Dialects Atlas team.',
      },
    },
    '/menu/about/like': {
      title: {
        'zh-Hant': '支持我們｜方音圖鑑',
        'zh-CN': '支持我们｜方音图鉴',
        en: 'Support Us | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以按讚、分享或贊助的方式支持方音圖鑑的持續開發與維護。',
        'zh-CN': '以点赞、分享或赞助的方式支持方音图鉴的持续开发与维护。',
        en: 'Support the ongoing development and maintenance of Dialects Atlas through likes, shares, or sponsorship.',
      },
    },
    '/explore': {
      title: {
        'zh-Hant': '探索｜方音圖鑑',
        'zh-CN': '探索｜方音图鉴',
        en: 'Explore | Dialects Atlas',
      },
      description: {
        'zh-Hant': '探索方音圖鑑的互動工具與資料集，包括地圖繪製、字表工具、自然村資料與語音分析等功能。',
        'zh-CN': '探索方音图鉴的交互工具与数据集，包括地图绘制、字表工具、自然村资料与语音分析等功能。',
        en: 'Explore interactive tools and datasets in Dialects Atlas, including map drawing, table tools, village data, and phonetic analysis.',
      },
    },
    '/explore/features': {
      title: {
        'zh-Hant': '功能索引｜方音圖鑑',
        'zh-CN': '功能索引｜方音图鉴',
        en: 'Feature Index | Dialects Atlas',
      },
      description: {
        'zh-Hant': '方音圖鑑的功能索引入口；此入口不作為搜尋結果收錄頁。',
        'zh-CN': '方音图鉴的功能索引入口；此入口不作为搜索结果收录页。',
        en: 'Feature index entry for Dialects Atlas; this entry is not intended for search result indexing.',
      },
    },
    '/explore/history': {
      title: {
        'zh-Hant': '歷史入口｜方音圖鑑',
        'zh-CN': '历史入口｜方音图鉴',
        en: 'History Entry | Dialects Atlas',
      },
      description: {
        'zh-Hant': '方音圖鑑的歷史入口頁；此入口不作為搜尋結果收錄頁。',
        'zh-CN': '方音图鉴的历史入口页；此入口不作为搜索结果收录页。',
        en: 'History entry for Dialects Atlas; this entry is not intended for search result indexing.',
      },
    },
    '/explore/gis': {
      title: {
        'zh-Hant': '地圖繪製｜方音圖鑑',
        'zh-CN': '地图绘制｜方音图鉴',
        en: 'Map Drawing | Dialects Atlas',
      },
      description: {
        'zh-Hant': '在互動地圖上繪製、編輯與管理多邊形、標記與圖層，進行地理語言學數據的可視化操作。',
        'zh-CN': '在交互地图上绘制、编辑与管理多边形、标记与图层，进行地理语言学数据的可视化操作。',
        en: 'Draw, edit, and manage polygons, markers, and layers on an interactive map for geolinguistic data visualization.',
      },
    },
    '/explore/manage': {
      title: {
        'zh-Hant': '字表管理｜方音圖鑑',
        'zh-CN': '字表管理｜方音图鉴',
        en: 'Table Management | Dialects Atlas',
      },
      description: {
        'zh-Hant': '管理方言字表資料，支持上傳、編輯與整理方言字音對照表。',
        'zh-CN': '管理方言字表资料，支持上传、编辑与整理方言字音对照表。',
        en: 'Manage dialect character tables with support for uploading, editing, and organizing dialect-character pronunciation mappings.',
      },
    },
    '/explore/tools/check': {
      title: {
        'zh-Hant': '字表檢查｜方音圖鑑',
        'zh-CN': '字表检查｜方音图鉴',
        en: 'Table Check | Dialects Atlas',
      },
      description: {
        'zh-Hant': '檢查方言字表的格式與內容正確性，驗證字音資料的完整性與一致性。',
        'zh-CN': '检查方言字表的格式与内容正确性，验证字音资料的完整性与一致性。',
        en: 'Check the format and content correctness of dialect character tables, verifying the completeness and consistency of pronunciation data.',
      },
    },
    '/explore/tools/jyut2ipa': {
      title: {
        'zh-Hant': '粵拼轉 IPA｜方音圖鑑',
        'zh-CN': '粤拼转 IPA｜方音图鉴',
        en: 'Jyutping to IPA | Dialects Atlas',
      },
      description: {
        'zh-Hant': '將粵拼轉換為國際音標（IPA），支持批量轉換與結果校對。',
        'zh-CN': '将粤拼转换为国际音标（IPA），支持批量转换与结果校对。',
        en: 'Convert Jyutping romanization to International Phonetic Alphabet (IPA) with support for batch conversion and result verification.',
      },
    },
    '/explore/tools/merge': {
      title: {
        'zh-Hant': '字表合併｜方音圖鑑',
        'zh-CN': '字表合并｜方音图鉴',
        en: 'Table Merge | Dialects Atlas',
      },
      description: {
        'zh-Hant': '合併多個方言字表，整合不同來源的字音資料，生成統一的對照表。',
        'zh-CN': '合并多个方言字表，整合不同来源的字音资料，生成统一的对照表。',
        en: 'Merge multiple dialect character tables from different sources into a unified comparison table.',
      },
    },
    '/explore/tools/derive': {
      title: {
        'zh-Hant': '字表推導｜方音圖鑑',
        'zh-CN': '字表推导｜方音图鉴',
        en: 'Table Derivation | Dialects Atlas',
      },
      description: {
        'zh-Hant': '根據音韻規則推導方言字表，從中古音推導各方言的預期讀音。',
        'zh-CN': '根据音韵规则推导方言字表，从中古音推导各方言的预期读音。',
        en: 'Derive dialect character tables based on phonological rules, predicting expected pronunciations from Middle Chinese.',
      },
    },
    '/explore/tools/praat': {
      title: {
        'zh-Hant': '聲學分析｜方音圖鑑',
        'zh-CN': '声学分析｜方音图鉴',
        en: 'Acoustic Analysis | Dialects Atlas',
      },
      description: {
        'zh-Hant': '上傳音頻文件進行聲學分析，使用 Praat 工具查看語音頻譜、共振峰與音高軌跡。',
        'zh-CN': '上传音频文件进行声学分析，使用 Praat 工具查看语音频谱、共振峰与音高轨迹。',
        en: 'Upload audio files for acoustic analysis with Praat, inspecting speech spectrograms, formants, and pitch contours.',
      },
    },
    '/explore/villages/toponyms': {
      title: {
        'zh-Hant': '地名分佈｜方音圖鑑',
        'zh-CN': '地名分布｜方音图鉴',
        en: 'Toponym Distribution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以地圖與圖表方式查看方言地名分佈資料，探索地名與方言的地理關聯。',
        'zh-CN': '以地图与图表方式查看方言地名分布资料，探索地名与方言的地理关联。',
        en: 'Explore toponym distribution data through maps and charts, examining the geographic relationship between place names and dialects.',
      },
    },
    '/explore/villages/search': {
      title: {
        'zh-Hant': '地名查詢｜方音圖鑑',
        'zh-CN': '地名查询｜方音图鉴',
        en: 'Toponym Search | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢具體自然村地名條目，點擊結果後查看本地地名庫詳情。',
        'zh-CN': '查询具体自然村地名条目，点击结果后查看本地地名库详情。',
        en: 'Search concrete natural-village toponym entries and open local database details from selected results.',
      },
    },
  },
}

export const SITEMAP_PATHS = [
  '/',
  '/menu/source',
  '/menu/privacy',
  '/menu/settings',
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
  '/explore/gis',
  '/menu/tools',
  '/menu/vocabulary/view',
  '/menu/yubao',
  '/explore/yc/overview',
  '/explore/yc/words',
  '/explore/yc/expressions',
  '/menu/villages',
  '/menu/cluster',
  '/explore',
  '/explore/tools/check',
  '/explore/tools/jyut2ipa',
  '/explore/tools/merge',
  '/explore/tools/derive',
  '/explore/tools/praat',
  '/explore/char-class',
  '/explore/yc/villages',
  '/explore/villages/gd',
  '/explore/villages/table',
  '/explore/villages/ml',
  '/explore/villages/toponyms',
  '/explore/villages/search',
]

export const NOINDEX_PATHS = new Set([
  '/intro',
  '/auth/data',
  '/auth/regions',
  '/menu/result',
  '/explore/manage',
  '/explore/villages/all',
  '/explore/features',
  '/explore/history',
])

export default SEO_CONFIG
