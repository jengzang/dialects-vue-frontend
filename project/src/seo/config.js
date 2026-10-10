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
      '方音圖鑑提供線上方言查詢比較：查漢字讀音、中古音與音位來源、各地調值，對比方言聲韻調，並查看音系表、方言地圖、詞彙和自然村資料。',
    'zh-CN':
      '方音图鉴提供在线方言查询比较：查汉字读音、中古音与音位来源、各地调值，对比方言声韵调，并查看音系表、方言地图、词汇和自然村资料。',
    en: 'Look up Chinese character pronunciations, Middle Chinese categories, phoneme origins, and tone values. Compare dialect sounds and explore phonology tables, maps, vocabulary, and village data.',
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
          '方音圖鑑提供線上方言查詢比較：查漢字讀音、中古音與音位來源、各地調值，對比方言聲韻調，並查看音系表、方言地圖、詞彙和自然村資料。',
        'zh-CN':
          '方音图鉴提供在线方言查询比较：查汉字读音、中古音与音位来源、各地调值，对比方言声韵调，并查看音系表、方言地图、词汇和自然村资料。',
        en: 'Look up Chinese character pronunciations, Middle Chinese categories, phoneme origins, and tone values. Compare dialect sounds and explore phonology tables, maps, vocabulary, and village data.',
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
        'zh-Hant': '輸入一個或多個漢字，查詢不同方言點的 IPA 讀音、多音字與文白讀；可按地點或分區選擇範圍，並在地圖上查看字音的地理分佈。',
        'zh-CN': '输入一个或多个汉字，查询不同方言点的 IPA 读音、多音字与文白读；可按地点或分区选择范围，并在地图上查看字音的地理分布。',
        en: 'Enter Chinese characters to look up IPA pronunciations across dialect locations, including multiple readings and literary versus colloquial forms. View their distribution on a map.',
      },
    },
    '/menu/query/zhonggu': {
      title: {
        'zh-Hant': '查中古｜方音圖鑑',
        'zh-CN': '查中古｜方音图鉴',
        en: 'Middle Chinese Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按中古音韻地位查各地方言讀音。可組合攝、韻、等、呼、聲母、清濁與調類等條件，查看符合條件的漢字、聲韻調分化及地圖分佈；也可切換字集查上古、近古材料。',
        'zh-CN': '按中古音韵地位查各地方言读音。可组合摄、韵、等、呼、声母、清浊与调类等条件，查看符合条件的汉字、声韵调分化及地图分布；也可切换字集查上古、近古材料。',
        en: 'Find modern dialect readings by Middle Chinese phonological category. Combine rime, division, openness, initial, voicing, and tone filters; inspect matching characters and map their pronunciation patterns.',
      },
    },
    '/menu/query/yinwei': {
      title: {
        'zh-Hant': '查音位｜方音圖鑑',
        'zh-CN': '查音位｜方音图鉴',
        en: 'Phoneme Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '輸入方言的實際音值或音節，反查其中古音來源。按聲母、韻母、聲調等維度查看各來源的字數、比例與具體字例，分析音類分合和地理分佈。',
        'zh-CN': '输入方言的实际音值或音节，反查其中古音来源。按声母、韵母、声调等维度查看各来源的字数、比例与具体字例，分析音类分合和地理分布。',
        en: 'Enter a dialect sound or syllable to trace its Middle Chinese origins. Compare source categories, character counts, proportions, examples, and geographic distribution.',
      },
    },
    '/menu/query/tone': {
      title: {
        'zh-Hant': '查調｜方音圖鑑',
        'zh-CN': '查调｜方音图鉴',
        en: 'Tone Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '選擇地點或分區，查詢陰平、陽平、上聲、去聲、入聲等調類的具體調值，對照各方言點的聲調系統與調類合併，並在地圖上查看調值分佈。',
        'zh-CN': '选择地点或分区，查询阴平、阳平、上声、去声、入声等调类的具体调值，对照各方言点的声调系统与调类合并，并在地图上查看调值分布。',
        en: 'Look up tone categories and pitch values by dialect location or region. Compare tonal systems and mergers, then map the distribution of tone values.',
      },
    },
    '/menu/compare/char': {
      title: {
        'zh-Hant': '漢字對比｜方音圖鑑',
        'zh-CN': '汉字对比｜方音图鉴',
        en: 'Character Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '輸入兩個漢字，比較它們在各方言點的聲母、韻母或聲調是否相同；地圖以顏色呈現完全相同、部分相同或不同的區域，並可查看具體讀音。',
        'zh-CN': '输入两个汉字，比较它们在各方言点的声母、韵母或声调是否相同；地图以颜色呈现完全相同、部分相同或不同的区域，并可查看具体读音。',
        en: 'Compare the initials, finals, or tones of two characters across dialect locations. A color-coded map shows where their pronunciations match, partly match, or differ.',
      },
    },
    '/menu/compare/zhonggu': {
      title: {
        'zh-Hant': '中古對比｜方音圖鑑',
        'zh-CN': '中古对比｜方音图鉴',
        en: 'Middle Chinese Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '設定兩組中古音韻條件，比較它們在各方言點的聲母、韻母或聲調讀音分佈；以地圖與相似度顏色觀察歷史音類的合流、分化和區域差異。',
        'zh-CN': '设置两组中古音韵条件，比较它们在各方言点的声母、韵母或声调读音分布；以地图与相似度颜色观察历史音类的合流、分化和区域差异。',
        en: 'Set up two groups of Middle Chinese categories and compare their modern initials, finals, or tones across dialect locations. Map sound mergers, splits, and distribution overlap.',
      },
    },
    '/menu/compare/tone': {
      title: {
        'zh-Hant': '調類對比｜方音圖鑑',
        'zh-CN': '调类对比｜方音图鉴',
        en: 'Tone Category Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '選擇兩個調類，例如陰上與陽上，比較各方言點的調值是否相同或接近；在地圖上辨識調類完全合併、可能合併與分立的地理範圍。',
        'zh-CN': '选择两个调类，例如阴上与阳上，比较各方言点的调值是否相同或接近；在地图上辨识调类完全合并、可能合并与分立的地理范围。',
        en: 'Select two tone categories and compare their pitch values across dialect locations. Map where they have merged, may be merging, or remain distinct.',
      },
    },
    '/menu/compare/phonetic': {
      title: {
        'zh-Hant': '音值對比｜方音圖鑑',
        'zh-CN': '音值对比｜方音图鉴',
        en: 'Phonetic Value Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '選擇 2 至 5 個方言點，以相同漢字對照各地聲母、韻母或聲調音值；用桑基圖查看跨地點的音值對應、合流與分化，並可點選節點或連線核對字例。',
        'zh-CN': '选择 2 至 5 个方言点，以相同汉字对照各地声母、韵母或声调音值；用桑基图查看跨地点的音值对应、合流与分化，并可点击节点或连线核对字例。',
        en: 'Compare initials, finals, or tones at two to five dialect locations using shared characters. A Sankey diagram shows sound correspondences, mergers, and splits with example characters.',
      },
    },
    '/menu/pho/matrix': {
      title: {
        'zh-Hant': '音系查詢｜方音圖鑑',
        'zh-CN': '音系查询｜方音图鉴',
        en: 'Phonology Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢一個或多個方言點的完整音系表，以聲母、韻母交叉矩陣查看音節與聲調拼合；點選格子可查具體漢字和文白讀，適合整理地方音系。',
        'zh-CN': '查询一个或多个方言点的完整音系表，以声母、韵母交叉矩阵查看音节与声调拼合；点击格子可查具体汉字和文白读，适合整理地方音系。',
        en: 'Look up complete phonology tables for dialect locations. Explore initials, finals, syllables, and tones in a matrix, then open cells for characters and literary or colloquial readings.',
      },
    },
    '/menu/pho/custom': {
      title: {
        'zh-Hant': '音素分類｜方音圖鑑',
        'zh-CN': '音素分类｜方音图鉴',
        en: 'Phoneme Classification | Dialects Atlas',
      },
      description: {
        'zh-Hant': '自選橫向、縱向與格內三個分類維度，按清濁、發音部位、開合口、韻攝等條件整理方言聲母、韻母或聲調；點選表格查看音素數量與字例。',
        'zh-CN': '自选横向、纵向与格内三个分类维度，按清浊、发音部位、开合口、韵摄等条件整理方言声母、韵母或声调；点击表格查看音素数量与字例。',
        en: 'Build a three-dimensional phoneme table using categories such as voicing, place of articulation, openness, and rime group. Analyze dialect initials, finals, and tones.',
      },
    },
    '/menu/pho/count': {
      title: {
        'zh-Hant': '音節統計｜方音圖鑑',
        'zh-CN': '音节统计｜方音图鉴',
        en: 'Syllable Statistics | Dialects Atlas',
      },
      description: {
        'zh-Hant': '統計方言資料中聲母、韻母與聲調的出現次數、音節數量和覆蓋地點；可看全量餅圖、柱狀圖、散點圖，也能選擇地點比較明細。',
        'zh-CN': '统计方言资料中声母、韵母与声调的出现次数、音节数量和覆盖地点；可看全量饼图、柱状图、散点图，也能选择地点比较明细。',
        en: 'Explore counts of initials, finals, tones, and syllables across dialect locations with pie, bar, and scatter charts, or compare statistics for selected locations.',
      },
    },
    '/menu/pho/evolution': {
      title: {
        'zh-Hant': '演變｜方音圖鑑',
        'zh-CN': '演变｜方音图鉴',
        en: 'Evolution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '選擇一個方言點，分析現代聲韻調與中古、上古等韻書地位的對應。以餅圖和桑基圖查看今音來源、歷史音類分化、各類字數與具體字例。',
        'zh-CN': '选择一个方言点，分析现代声韵调与中古、上古等韵书地位的对应。以饼图和桑基图查看今音来源、历史音类分化、各类字数与具体字例。',
        en: 'Analyze one dialect location to trace modern initials, finals, and tones back to historical sound categories. Pie and Sankey charts show mergers, splits, counts, and character examples.',
      },
    },
    '/menu/yubao': {
      title: {
        'zh-Hant': '語保詞句｜方音圖鑑',
        'zh-CN': '语保词句｜方音图鉴',
        en: 'Language Protection Words & Sentences | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢中國語言資源保護工程的方言詞彙與 50 句語法例句，查看不同方言點的發音、釋義及地理分佈；支援地圖、卡片和表格瀏覽。',
        'zh-CN': '查询中国语言资源保护工程的方言词汇与 50 句语法例句，查看不同方言点的发音、释义及地理分布；支持地图、卡片和表格浏览。',
        en: 'Search vocabulary and 50 grammar sentences from the Chinese Language Resources Protection Project. Compare pronunciations and meanings by location in map, card, or table views.',
      },
    },
    '/explore/char-class': {
      title: {
        'zh-Hant': '漢字地位｜方音圖鑑',
        'zh-CN': '汉字地位｜方音图鉴',
        en: 'Character Phonological Status | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按攝、韻、等、呼、聲母與清濁等層級瀏覽《廣韻》漢字字集，查各中古音韻地位包含哪些字及其註釋；也可切換上古、近古與粵韻字集。',
        'zh-CN': '按摄、韵、等、呼、声母与清浊等层级浏览《广韵》汉字字集，查各中古音韵地位包含哪些字及其注释；也可切换上古、近古与粤韵字集。',
        en: 'Browse Guangyun characters by rime group, division, openness, initial, and voicing. Inspect historical phonological categories and notes, with other rhyme-book datasets available.',
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
        'zh-Hant': '瀏覽陽春口語語料表，查看本字考、IPA、粵拼、聲韻調、詞性、釋義及例詞例句；可按欄位篩選，查找陽春方言詞語資料。',
        'zh-CN': '浏览阳春口语语料表，查看本字考、IPA、粤拼、声韵调、词性、释义及例词例句；可按字段筛选，查找阳春方言词语资料。',
        en: 'Browse Yangchun colloquial vocabulary with proposed characters, IPA, Jyutping, sound categories, definitions, and example sentences. Filter the corpus by available fields.',
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
        'zh-Hant': '按市、區縣、鄉鎮、行政村逐級展開廣東自然村，查看村名、方言分佈與經緯度；可搜尋已載入節點，並將村落或整個分支顯示在地圖上。',
        'zh-CN': '按市、区县、乡镇、行政村逐级展开广东自然村，查看村名、方言分布与经纬度；可搜索已加载节点，并将村落或整个分支显示在地图上。',
        en: 'Explore Guangdong natural villages through a city-to-village tree. Inspect village names, dialect distribution, and coordinates, then map a village or an entire branch.',
      },
    },
    '/explore/villages/table': {
      title: {
        'zh-Hant': '全粵村情表格｜方音圖鑑',
        'zh-CN': '全粤村情表格｜方音图鉴',
        en: 'Guangdong Villages Table | Dialects Atlas',
      },
      description: {
        'zh-Hant': '搜尋《全粵村情》廣東自然村資料，按市、區縣、鄉鎮、行政村、村名與方言分佈查看記錄；表格支援全欄位搜尋、排序、篩選和分頁。',
        'zh-CN': '搜索《全粤村情》广东自然村资料，按市、区县、乡镇、行政村、村名与方言分布查看记录；表格支持全字段搜索、排序、筛选和分页。',
        en: 'Search Guangdong natural villages from the Quanyue Village Survey. Filter and sort records by administrative area, village name, dialect distribution, and coordinates.',
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
        'zh-Hant': '搜尋廣東自然村名，分析村名字頻、語義類別、地理熱點、N-gram 命名模式與區域差異；提供村名資料探索、視覺化和機器學習聚類。',
        'zh-CN': '搜索广东自然村名，分析村名字频、语义类别、地理热点、N-gram 命名模式与区域差异；提供村名数据探索、可视化和机器学习聚类。',
        en: 'Search Guangdong village names and analyze character frequencies, semantics, geographic hotspots, naming patterns, and regional differences with visualizations and clustering tools.',
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
        'zh-Hant': '搜尋協作者提交的方言詞表，可按標準詞、方言詞、IPA 音標、釋義、地點或行政區劃篩選；以卡片、表格或地圖比較各地說法與讀音。',
        'zh-CN': '搜索协作者提交的方言词表，可按标准词、方言词、IPA 音标、释义、地点或行政区划筛选；以卡片、表格或地图比较各地说法与读音。',
        en: 'Search contributed dialect vocabulary by standard word, local expression, IPA, meaning, location, or region. Compare local terms and pronunciations in cards, tables, or on a map.',
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
        'zh-Hant': '選擇方言點與音韻特徵，配置距離計算及聚類任務，查看方言之間的相似程度、聚類結果與分組圖表。',
        'zh-CN': '选择方言点与音韵特征，配置距离计算及聚类任务，查看方言之间的相似程度、聚类结果与分组图表。',
        en: 'Select dialect locations and phonological features, configure distance calculations and clustering, then inspect similarity scores, groups, and result charts.',
      },
    },
    '/menu/map/view': {
      title: {
        'zh-Hant': '地圖｜方音圖鑑',
        'zh-CN': '地图｜方音图鉴',
        en: 'Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '在地圖上查看查字、查中古、查音位、查調及方言比較的結果，觀察讀音、調值或分區的地理分佈；點選方言點可查具體資料。',
        'zh-CN': '在地图上查看查字、查中古、查音位、查调及方言比较的结果，观察读音、调值或分区的地理分布；点击方言点可查具体资料。',
        en: 'Map results from character, historical sound, phoneme, tone, and dialect comparison queries. Explore pronunciation or regional patterns and open individual location details.',
      },
    },
    '/menu/map/divide': {
      title: {
        'zh-Hant': '分區地圖｜方音圖鑑',
        'zh-CN': '分区地图｜方音图鉴',
        en: 'Dialect Division Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '選擇方言點或地圖集、音典分區，按分區層級著色繪製地圖；可查看不同方言區的地理位置，也能繪製全部資料的分區分佈。',
        'zh-CN': '选择方言点或地图集、音典分区，按分区层级着色绘制地图；可查看不同方言区的地理位置，也能绘制全部数据的分区分布。',
        en: 'Select dialect locations or atlas regions and draw a color-coded map by classification level. Explore the geographic distribution of dialect regions.',
      },
    },
    '/menu/map/custom': {
      title: {
        'zh-Hant': '自定義地圖｜方音圖鑑',
        'zh-CN': '自定义地图｜方音图鉴',
        en: 'Custom Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '登入後新增和管理自己的方言點、音韻特徵與註釋，補充公開字表未收錄的資料；可按調查點或特徵整理，並在地圖上查看個人資料的分佈。',
        'zh-CN': '登录后新增和管理自己的方言点、音韵特征与注释，补充公开字表未收录的资料；可按调查点或特征整理，并在地图上查看个人数据的分布。',
        en: 'Sign in to add and manage private dialect locations, features, and notes missing from public datasets. Organize entries by location or feature and display them on a map.',
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
        'zh-Hant': '在線繪製方言調查點、線與區域，管理地圖圖層並生成泰森多邊形；支援匯出 GeoJSON 資料和 PNG 圖片，適合製作方言分佈圖。',
        'zh-CN': '在线绘制方言调查点、线与区域，管理地图图层并生成泰森多边形；支持导出 GeoJSON 数据和 PNG 图片，适合制作方言分布图。',
        en: 'Draw dialect survey points, lines, and regions online, manage map layers, and generate Voronoi polygons. Export your map as GeoJSON or PNG.',
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
        'zh-Hant': '登入後上傳方言字表，檢查非單字、異常 IPA 音標與缺聲調等問題；查看聲韻調統計，在線編輯、批次替換並下載修正後的字表。',
        'zh-CN': '登录后上传方言字表，检查非单字、异常 IPA 音标与缺声调等问题；查看声韵调统计，在线编辑、批量替换并下载修正后的字表。',
        en: 'Upload a dialect character table to find non-character entries, unusual IPA, and missing tones. Review sound statistics, edit entries online, and download corrections. Sign-in required.',
      },
    },
    '/explore/tools/jyut2ipa': {
      title: {
        'zh-Hant': '粵拼轉 IPA｜方音圖鑑',
        'zh-CN': '粤拼转 IPA｜方音图鉴',
        en: 'Jyutping to IPA | Dialects Atlas',
      },
      description: {
        'zh-Hant': '上傳含粵拼欄的 Excel 字表，批量將 Jyutping 轉成國際音標 IPA；可自定轉換規則、預覽字音與聲韻調欄位，並下載轉換結果。需登入。',
        'zh-CN': '上传含粤拼列的 Excel 字表，批量将 Jyutping 转成国际音标 IPA；可自定义转换规则、预览字音与声韵调字段，并下载转换结果。需登录。',
        en: 'Upload an Excel table with Jyutping to convert pronunciations to IPA in bulk. Customize conversion rules, preview initials, finals, and tones, then download results. Sign-in required.',
      },
    },
    '/explore/tools/merge': {
      title: {
        'zh-Hant': '字表合併｜方音圖鑑',
        'zh-CN': '字表合并｜方音图鉴',
        en: 'Table Merge | Dialects Atlas',
      },
      description: {
        'zh-Hant': '以上傳或預設參考表為基準，對齊最多 20 份方言字表中的漢字、IPA 音標與註釋；合併一字多音資料並下載 Excel 結果。需登入。',
        'zh-CN': '以上传或默认参考表为基准，对齐最多 20 份方言字表中的汉字、IPA 音标与注释；合并一字多音数据并下载 Excel 结果。需登录。',
        en: 'Align and merge up to 20 dialect character tables against a reference list, including IPA and notes. Export a combined Excel file with multiple pronunciations. Sign-in required.',
      },
    },
    '/explore/tools/derive': {
      title: {
        'zh-Hant': '字表推導｜方音圖鑑',
        'zh-CN': '字表推导｜方音图鉴',
        en: 'Table Derivation | Dialects Atlas',
      },
      description: {
        'zh-Hant': '字表推導頁面目前僅為佔位，功能尚未實現。',
        'zh-CN': '字表推导页面目前仅为占位，功能尚未实现。',
        en: 'The character table derivation page is currently a placeholder; the tool is not yet available.',
      },
    },
    '/explore/tools/praat': {
      title: {
        'zh-Hant': '聲學分析｜方音圖鑑',
        'zh-CN': '声学分析｜方音图鉴',
        en: 'Acoustic Analysis | Dialects Atlas',
      },
      description: {
        'zh-Hant': '在線Praat聲學分析：上傳音檔或錄音，查看基頻、強度、共振峰、頻譜圖與母音空間；可擷取音段，並用石鋒 T 值法做五度制標調。需登入。',
        'zh-CN': '在线Praat声学分析：上传音频或录音，查看基频、强度、共振峰、频谱图与元音空间；可截取音段，并用石锋 T 值法做五度制标调。需登录。',
        en: 'Use Praat-based tools online: upload or record speech, inspect pitch, intensity, formants, spectrograms, and vowel space, then estimate five-level tone values from selected segments. Sign-in required.',
      },
    },
    '/explore/villages/toponyms': {
      title: {
        'zh-Hant': '地名分佈｜方音圖鑑',
        'zh-CN': '地名分布｜方音图鉴',
        en: 'Toponym Distribution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '搜尋自然村地名並在散點地圖上查看分佈，結合行政區域圖層、村名樹和結果統計探索地名的空間集中情況；點選地圖點位可查看條目詳情。',
        'zh-CN': '搜索自然村地名并在散点地图上查看分布，结合行政区域图层、村名树和结果统计探索地名的空间集中情况；点击地图点位可查看条目详情。',
        en: 'Search natural village place names and map their distribution. Explore geographic layers, a place-name tree, and result counts, then open village record details.',
      },
    },
    '/explore/villages/search': {
      title: {
        'zh-Hant': '地名查詢｜方音圖鑑',
        'zh-CN': '地名查询｜方音图鉴',
        en: 'Toponym Search | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按村名關鍵詞、匹配方式、地名類型及行政區劃代碼查詢自然村地名；查看結果列表並點選條目閱讀本地地名庫的詳細資料。',
        'zh-CN': '按村名关键词、匹配方式、地名类型及行政区划代码查询自然村地名；查看结果列表并点击条目阅读本地地名库的详细资料。',
        en: 'Search natural village place names by keyword, match mode, place type, or administrative code. Browse results and open detailed records from the local toponym database.',
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
