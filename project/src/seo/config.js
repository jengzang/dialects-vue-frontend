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
        'zh-Hant': '想知道一個漢字在各地方言怎麼讀？輸入漢字即可查詢不同方言點的 IPA 讀音、多音字與文白讀，並查看字音分佈地圖。',
        'zh-CN': '想知道一个汉字在各地方言怎么读？输入汉字即可查询不同方言点的 IPA 读音、多音字与文白读，并查看字音分布地图。',
        en: 'How is a Chinese character pronounced in different dialects? Look up IPA readings, multiple pronunciations, and literary or colloquial forms across locations and on a map.',
      },
    },
    '/menu/query/zhonggu': {
      title: {
        'zh-Hant': '查中古｜方音圖鑑',
        'zh-CN': '查中古｜方音图鉴',
        en: 'Middle Chinese Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查中古音類在現代方言中怎麼讀：按《廣韻》攝、韻、等、呼、聲母或調類查詢對應漢字與各地今讀，觀察音韻分化及地理分佈。',
        'zh-CN': '查中古音类在现代方言中怎么读：按《广韵》摄、韵、等、呼、声母或调类查询对应汉字与各地今读，观察音韵分化及地理分布。',
        en: 'Find how Middle Chinese sound categories are pronounced in modern dialects. Search Guangyun rimes, initials, divisions, and tones to compare characters and regional readings.',
      },
    },
    '/menu/query/yinwei': {
      title: {
        'zh-Hant': '查音位｜方音圖鑑',
        'zh-CN': '查音位｜方音图鉴',
        en: 'Phoneme Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '方言中的某個聲母、韻母或音節來自哪些中古音類？輸入實際音值，反查其中古音來源，查看各來源的字數、比例與字例。',
        'zh-CN': '方言中的某个声母、韵母或音节来自哪些中古音类？输入实际音值，反查其中古音来源，查看各来源的字数、比例与字例。',
        en: 'Trace a dialect sound, initial, final, or syllable back to its Middle Chinese sources. See the source categories, character counts, proportions, and examples.',
      },
    },
    '/menu/query/tone': {
      title: {
        'zh-Hant': '查調｜方音圖鑑',
        'zh-CN': '查调｜方音图鉴',
        en: 'Tone Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢各地方言的聲調和調值：選擇方言點，查看陰平、陽平、上聲、去聲、入聲等調類的調值，對比調類合併及地圖分佈。',
        'zh-CN': '查询各地方言的声调和调值：选择方言点，查看阴平、阳平、上声、去声、入声等调类的调值，对比调类合并及地图分布。',
        en: 'Look up Chinese dialect tone values by location. Compare yinping, yangping, rising, departing, and entering tone categories, their mergers, and their map distribution.',
      },
    },
    '/menu/compare/char': {
      title: {
        'zh-Hant': '漢字對比｜方音圖鑑',
        'zh-CN': '汉字对比｜方音图鉴',
        en: 'Character Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較兩個漢字在各地方言的讀音是否相同。按聲母、韻母或聲調對比兩字，查看哪些方言點在所選維度相同、部分相同或不同。',
        'zh-CN': '比较两个汉字在各地方言的读音是否相同。按声母、韵母或声调对比两字，查看哪些方言点在所选维度相同、部分相同或不同。',
        en: 'Compare how two Chinese characters are pronounced across dialects. See where their initials, finals, or tones match, partly match, or differ.',
      },
    },
    '/menu/compare/zhonggu': {
      title: {
        'zh-Hant': '中古對比｜方音圖鑑',
        'zh-CN': '中古对比｜方音图鉴',
        en: 'Middle Chinese Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較兩組中古音類在現代方言中的讀音，查看聲母、韻母或聲調在哪些地區合流或分化，並用地圖對照各地差異。',
        'zh-CN': '比较两组中古音类在现代方言中的读音，查看声母、韵母或声调在哪些地区合流或分化，并用地图对照各地差异。',
        en: 'Compare how two Middle Chinese sound categories developed across modern dialects. Map where their initials, finals, or tones merged or remained distinct.',
      },
    },
    '/menu/compare/tone': {
      title: {
        'zh-Hant': '調類對比｜方音圖鑑',
        'zh-CN': '调类对比｜方音图鉴',
        en: 'Tone Category Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查方言調類是否合併：比較陰上、陽上等兩個調類在各地的調值，查看合流、可能合流與分立的分佈地圖。',
        'zh-CN': '查方言调类是否合并：比较阴上、阳上等两个调类在各地的调值，查看合流、可能合流与分立的分布地图。',
        en: 'Where have two dialect tone categories merged? Compare their pitch values across locations and map mergers, possible mergers, and distinctions.',
      },
    },
    '/menu/compare/phonetic': {
      title: {
        'zh-Hant': '音值對比｜方音圖鑑',
        'zh-CN': '音值对比｜方音图鉴',
        en: 'Phonetic Value Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較不同方言點的音值對應關係：選擇 2 至 5 個地點，對照相同漢字的聲母、韻母或聲調，用桑基圖分析音類合流與分化。',
        'zh-CN': '比较不同方言点的音值对应关系：选择 2 至 5 个地点，对照相同汉字的声母、韵母或声调，用桑基图分析音类合流与分化。',
        en: 'Compare sound correspondences across Chinese dialects. Match initials, finals, or tones through shared characters and view mergers in a Sankey diagram.',
      },
    },
    '/menu/pho/matrix': {
      title: {
        'zh-Hant': '音系查詢｜方音圖鑑',
        'zh-CN': '音系查询｜方音图鉴',
        en: 'Phonology Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢某地的方言音系表：查看聲母、韻母、聲調及音節拼合，對照多個方言點的音系，並查每個音節對應的漢字。',
        'zh-CN': '查询某地的方言音系表：查看声母、韵母、声调及音节拼合，对照多个方言点的音系，并查每个音节对应的汉字。',
        en: 'Look up a Chinese dialect phonology table by location. Explore initials, finals, tones, and their syllable combinations, with characters for each syllable.',
      },
    },
    '/menu/pho/custom': {
      title: {
        'zh-Hant': '音素分類｜方音圖鑑',
        'zh-CN': '音素分类｜方音图鉴',
        en: 'Phoneme Classification | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按清濁、發音部位、開合口或韻攝查詢方言音素分類。自選三個維度整理聲母、韻母或聲調，查看分類數量與字例。',
        'zh-CN': '按清浊、发音部位、开合口或韵摄查询方言音素分类。自选三个维度整理声母、韵母或声调，查看分类数量与字例。',
        en: 'Classify Chinese dialect phonemes by voicing, articulation, openness, or rime group. Build a custom table of initials, finals, or tones with counts and example characters.',
      },
    },
    '/menu/pho/count': {
      title: {
        'zh-Hant': '音節統計｜方音圖鑑',
        'zh-CN': '音节统计｜方音图鉴',
        en: 'Syllable Statistics | Dialects Atlas',
      },
      description: {
        'zh-Hant': '統計各地方言的音節、聲母、韻母與聲調出現頻率。選擇方言點，比較音系數據與分佈，查看餅圖、柱狀圖和散點圖。',
        'zh-CN': '统计各地方言的音节、声母、韵母与声调出现频率。选择方言点，比较音系数据与分布，查看饼图、柱状图和散点图。',
        en: 'Compare syllable, initial, final, and tone frequencies across Chinese dialect locations. Explore phonological statistics with pie, bar, and scatter charts.',
      },
    },
    '/menu/pho/evolution': {
      title: {
        'zh-Hant': '演變｜方音圖鑑',
        'zh-CN': '演变｜方音图鉴',
        en: 'Evolution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '研究中古音到現代方言如何演變：選擇一個方言點，查看今音的歷史來源及中古音類的分化，以餅圖和桑基圖分析聲韻調對應。',
        'zh-CN': '研究中古音到现代方言如何演变：选择一个方言点，查看今音的历史来源及中古音类的分化，以饼图和桑基图分析声韵调对应。',
        en: 'Explore how Middle Chinese sounds developed in a modern dialect. Trace present-day initials, finals, and tones to historical categories in charts.',
      },
    },
    '/menu/yubao': {
      title: {
        'zh-Hant': '語保詞句｜方音圖鑑',
        'zh-CN': '语保词句｜方音图鉴',
        en: 'Language Protection Words & Sentences | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢中國語言資源保護工程的方言詞彙與語法例句，比較同一詞句在各方言點的說法、發音和釋義，並在地圖上看分佈。',
        'zh-CN': '查询中国语言资源保护工程的方言词汇与语法例句，比较同一词句在各方言点的说法、发音和释义，并在地图上看分布。',
        en: 'Search dialect words and grammar sentences from the Chinese Language Resources Protection Project. Compare local expressions, pronunciations, and meanings across locations.',
      },
    },
    '/explore/char-class': {
      title: {
        'zh-Hant': '漢字地位｜方音圖鑑',
        'zh-CN': '汉字地位｜方音图鉴',
        en: 'Character Phonological Status | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查漢字的中古音韻地位與《廣韻》分類：按攝、韻、等、呼和聲母瀏覽字集，查看各音類收錄的漢字與註釋，並可切換其他韻書。',
        'zh-CN': '查汉字的中古音韵地位与《广韵》分类：按摄、韵、等、呼和声母浏览字集，查看各音类收录的汉字与注释，并可切换其他韵书。',
        en: 'Look up Chinese characters by their Middle Chinese phonological categories in Guangyun. Browse rimes, divisions, openness, and initials to find characters and annotations.',
      },
    },
    '/explore/yc/overview': {
      title: {
        'zh-Hant': '陽春方言概覽｜方音圖鑑',
        'zh-CN': '阳春方言概览｜方音图鉴',
        en: 'Yangchun Dialect Overview | Dialects Atlas',
      },
      description: {
        'zh-Hant': '陽春有哪些方言？瀏覽陽春白話、涯話等方言的分佈、接觸與音系資料。頁面仍在開發，內容需結合所列來源核對。',
        'zh-CN': '阳春有哪些方言？浏览阳春白话、涯话等方言的分布、接触与音系资料。页面仍在开发，内容需结合所列来源核对。',
        en: 'Which dialects are spoken in Yangchun? Explore draft materials on Yue and Hakka distribution and phonology. Under development; verify sources.',
      },
    },
    '/explore/yc/words': {
      title: {
        'zh-Hant': '陽春口語詞｜方音圖鑑',
        'zh-CN': '阳春口语词｜方音图鉴',
        en: 'Yangchun Colloquial Words | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查陽春話詞語與口語說法：瀏覽陽春口語詞表，查看本字考、IPA 讀音、粵拼、釋義和例詞例句，按欄位篩選語料。',
        'zh-CN': '查阳春话词语与口语说法：浏览阳春口语词表，查看本字考、IPA 读音、粤拼、释义和例词例句，按字段筛选语料。',
        en: 'Search Yangchun dialect words and colloquial expressions. Browse proposed characters, IPA pronunciations, Jyutping, meanings, and usage examples in a filterable word list.',
      },
    },
    '/explore/yc/expressions': {
      title: {
        'zh-Hant': '陽春熟語與疊式詞｜方音圖鑑',
        'zh-CN': '阳春熟语与叠式词｜方音图鉴',
        en: 'Yangchun Expressions and Reduplicatives | Dialects Atlas',
      },
      description: {
        'zh-Hant': '瀏覽陽春方言熟語、歇後語、農諺與疊式詞示例，按詞語類型和詞形模式查找。頁面仍在開發，內容需核對。',
        'zh-CN': '浏览阳春方言熟语、歇后语、农谚与叠式词示例，按词语类型和词形模式查找。页面仍在开发，内容需核对。',
        en: 'Browse draft examples of Yangchun dialect idioms, proverbs, and reduplicated words by type and pattern. The page is under development; verify its content.',
      },
    },
    '/explore/villages/gd': {
      title: {
        'zh-Hant': '廣東自然村｜方音圖鑑',
        'zh-CN': '广东自然村｜方音图鉴',
        en: 'Guangdong Villages | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢廣東自然村名稱、所屬市縣鄉鎮及方言分佈。沿行政層級展開村落資料，查看位置與經緯度，並在地圖上定位村莊。',
        'zh-CN': '查询广东自然村名称、所属市县乡镇及方言分布。沿行政层级展开村落数据，查看位置与经纬度，并在地图上定位村庄。',
        en: 'Look up Guangdong natural villages by administrative area. Explore village names, dialect distribution, and coordinates in a tree and locate villages on a map.',
      },
    },
    '/explore/villages/table': {
      title: {
        'zh-Hant': '全粵村情表格｜方音圖鑑',
        'zh-CN': '全粤村情表格｜方音图鉴',
        en: 'Guangdong Villages Table | Dialects Atlas',
      },
      description: {
        'zh-Hant': '搜尋《全粵村情》廣東自然村名錄，按村名、行政區劃或方言分佈篩選資料，查看村莊所屬市縣鄉鎮及經緯度。',
        'zh-CN': '搜索《全粤村情》广东自然村名录，按村名、行政区划或方言分布筛选数据，查看村庄所属市县乡镇及经纬度。',
        en: 'Search the Quanyue Village Survey directory of Guangdong natural villages. Filter by village name, administrative area, or dialect and inspect coordinates.',
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
        'zh-Hant': '查詢陽春自然村與村委會資料，查看各村莊所屬鄉鎮、社區及行政層級。',
        'zh-CN': '查询阳春自然村与村委会数据，查看各村庄所属乡镇、社区及行政层级。',
        en: 'Look up natural villages in Yangchun and their administrative hierarchy, including towns, village committees, and communities.',
      },
    },
    '/explore/villages/ml': {
      title: {
        'zh-Hant': '自然村機器學習｜方音圖鑑',
        'zh-CN': '自然村机器学习｜方音图鉴',
        en: 'Natural Villages Machine Learning | Dialects Atlas',
      },
      description: {
        'zh-Hant': '分析廣東自然村名的命名規律：查村名字頻、語義類別、地理熱點與區域差異，探索村名資料和機器學習聚類結果。',
        'zh-CN': '分析广东自然村名的命名规律：查村名字频、语义类别、地理热点与区域差异，探索村名数据和机器学习聚类结果。',
        en: 'Analyze naming patterns of Guangdong natural villages. Explore character frequencies, meanings, geographic hotspots, regional differences, and clustering results.',
      },
    },
    '/menu/tools': {
      title: {
        'zh-Hant': '工具箱｜方音圖鑑',
        'zh-CN': '工具箱｜方音图鉴',
        en: 'Tools | Dialects Atlas',
      },
      description: {
        'zh-Hant': '尋找方言研究線上工具？在方音圖鑑工具箱進入方言字表檢查、粵拼轉 IPA、字表合併及在線Praat聲學分析。',
        'zh-CN': '寻找方言研究在线工具？在方音图鉴工具箱进入方言字表检查、粤拼转 IPA、字表合并及在线Praat声学分析。',
        en: 'Find online tools for Chinese dialect research: check pronunciation tables, convert Jyutping to IPA, merge tables, or use Praat-based acoustic analysis.',
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
        'zh-Hant': '一個詞在各地方言怎麼說？搜尋方言詞表，查標準詞對應的地方說法、IPA 讀音與釋義，並在地圖上比較不同地區的用詞。',
        'zh-CN': '一个词在各地方言怎么说？搜索方言词表，查标准词对应的地方说法、IPA 读音与释义，并在地图上比较不同地区的用词。',
        en: 'How do different Chinese dialects say the same word? Search dialect vocabulary for local expressions, IPA pronunciations, meanings, and regional distribution.',
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
        'zh-Hant': '查廣東自然村資料與村名：從自然村入口瀏覽《全粵村情》、陽春村落、村莊方言分佈及村名分析工具。',
        'zh-CN': '查广东自然村数据与村名：从自然村入口浏览《全粤村情》、阳春村落、村庄方言分布及村名分析工具。',
        en: 'Explore Guangdong natural village records, names, and dialect distribution. Find Quanyue Village Survey data, Yangchun villages, and village-name analysis tools.',
      },
    },
    '/menu/cluster': {
      title: {
        'zh-Hant': '聚類｜方音圖鑑',
        'zh-CN': '聚类｜方音图鉴',
        en: 'Clustering | Dialects Atlas',
      },
      description: {
        'zh-Hant': '計算方言之間有多相似：選擇方言點與音韻特徵，進行方言距離計算和聚類分析，查看相似度、分組結果與圖表。',
        'zh-CN': '计算方言之间有多相似：选择方言点与音韵特征，进行方言距离计算和聚类分析，查看相似度、分组结果与图表。',
        en: 'Measure similarity between Chinese dialects. Select locations and phonological features to calculate dialect distance, run clustering, and inspect groups and charts.',
      },
    },
    '/menu/map/view': {
      title: {
        'zh-Hant': '地圖｜方音圖鑑',
        'zh-CN': '地图｜方音图鉴',
        en: 'Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '在方言地圖上看讀音與聲調的地理分佈。本頁呈現查字、查中古、查調和方言比較的地圖結果，可點選方言點查看詳情。',
        'zh-CN': '在方言地图上看读音与声调的地理分布。本页呈现查字、查中古、查调和方言比较的地图结果，可点击方言点查看详情。',
        en: 'View Chinese dialect pronunciation and tone patterns on a map. This page displays results from character, historical sound, tone, and dialect comparison queries.',
      },
    },
    '/menu/map/divide': {
      title: {
        'zh-Hant': '分區地圖｜方音圖鑑',
        'zh-CN': '分区地图｜方音图鉴',
        en: 'Dialect Division Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看方言分區地圖：按地圖集或音典分區選擇方言點，依分區層級著色，對照不同方言區的地理位置與範圍。',
        'zh-CN': '查看方言分区地图：按地图集或音典分区选择方言点，依分区层级着色，对照不同方言区的地理位置与范围。',
        en: 'Explore a map of Chinese dialect regions. Select dialect locations or atlas classifications and color the map by division level to compare regional distribution.',
      },
    },
    '/menu/map/custom': {
      title: {
        'zh-Hant': '自定義地圖｜方音圖鑑',
        'zh-CN': '自定义地图｜方音图鉴',
        en: 'Custom Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '建立自己的方言調查點地圖：新增方言點、音韻特徵和註釋，補充未收錄資料，按地點或特徵查看個人方言分佈。需登入。',
        'zh-CN': '建立自己的方言调查点地图：新增方言点、音韵特征和注释，补充未收录数据，按地点或特征查看个人方言分布。需登录。',
        en: 'Create a personal dialect survey map. Add your own locations, phonological features, and notes, then explore their distribution by location or feature. Sign-in required.',
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
        'zh-Hant': '探索方音圖鑑的方言研究資料與線上工具：查自然村與方言詞表、繪製方言地圖、整理字表，並進行在線Praat語音分析。',
        'zh-CN': '探索方音图鉴的方言研究数据与在线工具：查自然村与方言词表、绘制方言地图、整理字表，并进行在线Praat语音分析。',
        en: 'Explore Chinese dialect datasets and online tools: village records, regional vocabulary, dialect mapping, pronunciation tables, and Praat-based speech analysis.',
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
        'zh-Hant': '在線製作方言分佈地圖：繪製調查點、線和區域，生成泰森多邊形，並將地圖匯出為 GeoJSON 資料或 PNG 圖片。',
        'zh-CN': '在线制作方言分布地图：绘制调查点、线和区域，生成泰森多边形，并将地图导出为 GeoJSON 数据或 PNG 图片。',
        en: 'Create a Chinese dialect distribution map online. Draw survey points, lines, and regions, generate Voronoi polygons, and export GeoJSON or PNG.',
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
        'zh-Hant': '線上檢查方言字表格式與 IPA 音標：上傳字表，找出非單字、異常音標和缺聲調資料，修正後下載結果。需登入。',
        'zh-CN': '在线检查方言字表格式与 IPA 音标：上传字表，找出非单字、异常音标和缺声调数据，修正后下载结果。需登录。',
        en: 'Check a Chinese dialect pronunciation table online for invalid characters, unusual IPA, and missing tones. Edit and download the corrected table. Sign-in required.',
      },
    },
    '/explore/tools/jyut2ipa': {
      title: {
        'zh-Hant': '粵拼轉 IPA｜方音圖鑑',
        'zh-CN': '粤拼转 IPA｜方音图鉴',
        en: 'Jyutping to IPA | Dialects Atlas',
      },
      description: {
        'zh-Hant': '線上將粵拼 Jyutping 批量轉成 IPA 國際音標：上傳含粵拼欄的 Excel 字表，自訂轉換規則、預覽結果並下載。需登入。',
        'zh-CN': '在线将粤拼 Jyutping 批量转成 IPA 国际音标：上传含粤拼列的 Excel 字表，自定义转换规则、预览结果并下载。需登录。',
        en: 'Convert Jyutping to IPA online in bulk. Upload an Excel table with Cantonese romanization, adjust conversion rules, preview results, and download the file. Sign-in required.',
      },
    },
    '/explore/tools/merge': {
      title: {
        'zh-Hant': '字表合併｜方音圖鑑',
        'zh-CN': '字表合并｜方音图鉴',
        en: 'Table Merge | Dialects Atlas',
      },
      description: {
        'zh-Hant': '線上合併多份方言字表 Excel：按參考表對齊漢字，整合各表的 IPA 讀音與註釋，保留一字多音並下載合併結果。需登入。',
        'zh-CN': '在线合并多份方言字表 Excel：按参考表对齐汉字，整合各表的 IPA 读音与注释，保留一字多音并下载合并结果。需登录。',
        en: 'Merge Chinese dialect pronunciation tables online. Align characters, combine IPA readings and notes, and download an Excel file. Sign-in required.',
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
        'zh-Hant': '在線Praat語音聲學分析：網頁上傳音檔或錄音，查看音高曲線、共振峰與頻譜圖，分析母音空間並計算五度制調值。需登入。',
        'zh-CN': '在线Praat语音声学分析：网页上传音频或录音，查看音高曲线、共振峰与频谱图，分析元音空间并计算五度制调值。需登录。',
        en: 'Use Praat online for speech analysis. Upload or record audio to view pitch, formants, spectrograms, vowel space, and tone values. Sign-in required.',
      },
    },
    '/explore/villages/toponyms': {
      title: {
        'zh-Hant': '地名分佈｜方音圖鑑',
        'zh-CN': '地名分布｜方音图鉴',
        en: 'Toponym Distribution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '自然村地名分佈地圖開發中。規劃支援搜尋村名、查看村落點位與行政區域分佈；目前地名資料功能暫不可用。',
        'zh-CN': '自然村地名分布地图开发中。规划支持搜索村名、查看村落点位与行政区域分布；目前地名数据功能暂不可用。',
        en: 'The natural village place-name distribution map is under development. Village search and geographic data are currently unavailable.',
      },
    },
    '/explore/villages/search': {
      title: {
        'zh-Hant': '地名查詢｜方音圖鑑',
        'zh-CN': '地名查询｜方音图鉴',
        en: 'Toponym Search | Dialects Atlas',
      },
      description: {
        'zh-Hant': '自然村地名查詢功能開發中。規劃支援按村名、地名類型與行政區劃搜尋條目；目前地名資料功能暫不可用。',
        'zh-CN': '自然村地名查询功能开发中。规划支持按村名、地名类型与行政区划搜索条目；目前地名数据功能暂不可用。',
        en: 'Natural village place-name search is under development. Search by village name, place type, or administrative area is currently unavailable.',
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
