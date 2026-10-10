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
        'zh-Hant': '按照各韻書的地位，如《廣韻》中古音的攝、韻、等、呼、母等，查詢整理對應漢字在各地方言中的今讀及地理分佈。支援多個地點查詢、繪製地圖，並進行歷史音韻、地理語言學分析。',
        'zh-CN': '按照各韵书的地位，如《广韵》中古音的摄、韵、等、呼、母等，查询整理对应汉字在各地方言中的今读及地理分布。支持多个地点查询、绘制地图，并进行历史音韵、地理语言学分析。',
        en: 'Search historical phonological categories in rhyme books, such as Guangyun rime groups, rimes, divisions, openness, and initials, to organize modern character readings across dialects and their geographic distribution. Query multiple locations and draw maps for historical phonology and geolinguistic analysis.',
      },
    },
    '/menu/query/yinwei': {
      title: {
        'zh-Hant': '查音位｜方音圖鑑',
        'zh-CN': '查音位｜方音图鉴',
        en: 'Phoneme Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '輸入方言聲母、韻母或聲調的實際音值，反查其韻書地位來源，如反查今音的中古來源，具體來源於《廣韻》的哪些攝、韻、母、呼等。支援查看各來源的字數、比例和字例。',
        'zh-CN': '输入方言声母、韵母或声调的实际音值，反查其韵书地位来源，如反查今音的中古来源，具体来源于《广韵》的哪些摄、韵、母、呼等。支持查看各来源的字数、比例和字例。',
        en: 'Enter the actual sound values of dialect initials, finals, or tones to trace their rhyme-book sources, including Middle Chinese rime groups, rimes, initials, and openness categories in Guangyun. View character counts, proportions, and examples for each source.',
      },
    },
    '/menu/query/tone': {
      title: {
        'zh-Hant': '查調｜方音圖鑑',
        'zh-CN': '查调｜方音图鉴',
        en: 'Tone Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢各地方言的聲調情況，如查看各調類的合併情況及具體調值的地理分佈。',
        'zh-CN': '查询各地方言的声调情况，如查看各调类的合并情况及具体调值的地理分布。',
        en: 'Look up tones across dialects, including tone-category mergers and the geographic distribution of specific pitch values.',
      },
    },
    '/menu/compare/char': {
      title: {
        'zh-Hant': '漢字對比｜方音圖鑑',
        'zh-CN': '汉字对比｜方音图鉴',
        en: 'Character Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較兩個漢字在各地方言中的聲母、韻母或聲調情況，查看相同、部分相同或不同的地點及分佈地圖。',
        'zh-CN': '比较两个汉字在各地方言中的声母、韵母或声调情况，查看相同、部分相同或不同的地点及分布地图。',
        en: 'Compare the initials, finals, or tones of two Chinese characters across dialects, and map locations where they match, partly match, or differ.',
      },
    },
    '/menu/compare/zhonggu': {
      title: {
        'zh-Hant': '中古對比｜方音圖鑑',
        'zh-CN': '中古对比｜方音图鉴',
        en: 'Middle Chinese Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較兩組歷史韻書音類條件（如中古廣韻）在現代方言中的聲母、韻母或聲調，查看各地音類合流、分化及地圖分佈。',
        'zh-CN': '比较两组历史韵书音类条件（如中古广韵）在现代方言中的声母、韵母或声调，查看各地音类合流、分化及地图分布。',
        en: 'Compare two sets of historical rhyme-book category conditions, such as Middle Chinese categories in Guangyun, in modern dialect initials, finals, or tones. Explore mergers, splits, and their geographic distribution.',
      },
    },
    '/menu/compare/tone': {
      title: {
        'zh-Hant': '調類對比｜方音圖鑑',
        'zh-CN': '调类对比｜方音图鉴',
        en: 'Tone Category Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '比較兩個調類在各地方言中的合併情況，查看合流、可能合流或分立的地點及分佈地圖。',
        'zh-CN': '比较两个调类在各地方言中的合并情况，查看合流、可能合流或分立的地点及分布地图。',
        en: 'Compare mergers between two tone categories across dialects, and map locations with mergers, possible mergers, or distinctions.',
      },
    },
    '/menu/compare/phonetic': {
      title: {
        'zh-Hant': '音值對比｜方音圖鑑',
        'zh-CN': '音值对比｜方音图鉴',
        en: 'Phonetic Value Comparison | Dialects Atlas',
      },
      description: {
        'zh-Hant': '選擇 2 至 5 個方言點，對照聲母、韻母或聲調的音值對應關係，透過桑基圖呈現音類合流與分化。',
        'zh-CN': '选择 2 至 5 个方言点，对照声母、韵母或声调的音值对应关系，通过桑基图呈现音类合流与分化。',
        en: 'Select 2 to 5 dialect locations and compare initial, final, or tone correspondences, using Sankey diagrams to show sound-category mergers and splits.',
      },
    },
    '/menu/pho/matrix': {
      title: {
        'zh-Hant': '音系查詢｜方音圖鑑',
        'zh-CN': '音系查询｜方音图鉴',
        en: 'Phonology Query | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看方言點的完整音系表、聲韻調配合關係以及方言同音字彙，以表格的形式呈現聲韻調拼合關係。',
        'zh-CN': '查看方言点的完整音系表、声韵调配合关系以及方言同音字汇，以表格的形式呈现声韵调拼合关系。',
        en: 'View a dialect location\'s complete phonology table, initial-final-tone combinations, and homophone lexicon, with tables showing how initials, finals, and tones combine.',
      },
    },
    '/menu/pho/custom': {
      title: {
        'zh-Hant': '音素分類｜方音圖鑑',
        'zh-CN': '音素分类｜方音图鉴',
        en: 'Phoneme Classification | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按清濁、發音部位、開合口、韻攝等韻書地位特徵，自選三個分類維度整理方言聲韻調，進行聲母、韻母、聲調分類以及方言音類統計，支援查看各分類數量與字例。',
        'zh-CN': '按清浊、发音部位、开合口、韵摄等韵书地位特征，自选三个分类维度整理方言声韵调，进行声母、韵母、声调分类以及方言音类统计，支持查看各分类数量与字例。',
        en: 'Choose three rhyme-book classification dimensions, such as voicing, articulation, openness, or rime group, to organize dialect initials, finals, and tones. Classify sound categories and view their counts and example characters.',
      },
    },
    '/menu/pho/count': {
      title: {
        'zh-Hant': '音節統計｜方音圖鑑',
        'zh-CN': '音节统计｜方音图鉴',
        en: 'Syllable Statistics | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查方言有多少音節：統計聲母、韻母、聲調以及不帶調、帶調音節的數量與頻率，比較各地音系，查看圖表和音節等值線地圖。',
        'zh-CN': '查方言有多少音节：统计声母、韵母、声调以及不带调、带调音节的数量与频率，比较各地音系，查看图表和音节等值线地图。',
        en: 'How many syllables does a dialect have? Count initials, finals, tones, and syllables with or without tones, compare frequencies, and view charts and contour maps.',
      },
    },
    '/menu/pho/evolution': {
      title: {
        'zh-Hant': '演變｜方音圖鑑',
        'zh-CN': '演变｜方音图鉴',
        en: 'Evolution | Dialects Atlas',
      },
      description: {
        'zh-Hant': '透過查看單個方言點的聲母、韻母、聲調與中古音及韻書地位的對應關係，用餅圖和桑基圖分析今音來源與音類分化，乃至方言語音演變。',
        'zh-CN': '通过查看单个方言点的声母、韵母、声调与中古音及韵书地位的对应关系，用饼图和桑基图分析今音来源与音类分化，乃至方言语音演变。',
        en: 'Examine how a dialect location\'s initials, finals, and tones correspond to Middle Chinese and rhyme-book categories. Use pie and Sankey charts to analyze modern sound origins, category splits, and dialect sound change.',
      },
    },
    '/menu/yubao': {
      title: {
        'zh-Hant': '語保詞句｜方音圖鑑',
        'zh-CN': '语保词句｜方音图鉴',
        en: 'Language Protection Words & Sentences | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢中國語言資源保護工程（語保）的 1000 條方言詞彙與 50 個語法例句，比較各地說法、發音及註釋，並在地圖上看分佈。需登入。',
        'zh-CN': '查询中国语言资源保护工程（语保）的 1000 条方言词汇与 50 个语法例句，比较各地说法、发音及注释，并在地图上看分布。需登录。',
        en: 'Search 1,000 dialect vocabulary items and 50 grammar sentences from the Chinese Language Resources Protection Project. Compare expressions, pronunciations, and notes on a map. Sign-in required.',
      },
    },
    '/explore/char-class': {
      title: {
        'zh-Hant': '漢字地位｜方音圖鑑',
        'zh-CN': '汉字地位｜方音图鉴',
        en: 'Character Phonological Status | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按韻書的音韻地位逐級瀏覽漢字字集，查看各音類的漢字及註釋，並自訂分類層級和順序。具體支援《廣韻》、上古音、《洪武正韻》、《中原音韻》、《蒙古字韻》、《分韻撮要》。',
        'zh-CN': '按韵书的音韵地位逐级浏览汉字字集，查看各音类的汉字及注释，并自定义分类层级和顺序。具体支持《广韵》、上古音、《洪武正韵》、《中原音韵》、《蒙古字韵》、《分韵撮要》。',
        en: 'Browse Chinese character sets by rhyme-book phonological categories, view characters and annotations, and customize the classification hierarchy and order. Supports Guangyun, Old Chinese, Hongwu Zhengyun, Zhongyuan Yinyun, Menggu Ziyun, and Fenyun Cuoyao.',
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
        'zh-Hant': '查詢陽春話口語詞，包含本字、IPA 讀音、粵拼、釋義和例詞例句等資訊，支援按欄位篩選詞表。',
        'zh-CN': '查询阳春话口语词，包含本字、IPA 读音、粤拼、释义和例词例句等信息，支持按字段筛选词表。',
        en: 'Look up Yangchun colloquial words with written characters, IPA readings, Jyutping, meanings, and example words and sentences. Filter the vocabulary table by field.',
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
        'zh-Hant': '按市、縣、鄉鎮等行政層級樹狀瀏覽廣東自然村名錄，查詢村名、方言分佈及經緯度，並在地圖上查看村莊。支援跳轉地圖繪製頁面，根據泰森多邊形繪製方言分佈圖。',
        'zh-CN': '按市、县、乡镇等行政层级树状浏览广东自然村名录，查询村名、方言分布及经纬度，并在地图上查看村庄。支持跳转地图绘制页面，根据泰森多边形绘制方言分布图。',
        en: 'Browse Guangdong natural villages in a tree by city, county, and town. Look up village names, dialect distribution, and coordinates, view villages on a map, and open the map editor to create dialect distribution maps with Voronoi polygons.',
      },
    },
    '/explore/villages/table': {
      title: {
        'zh-Hant': '全粵村情表格｜方音圖鑑',
        'zh-CN': '全粤村情表格｜方音图鉴',
        en: 'Guangdong Villages Table | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按照表格查看廣東自然村名錄，可按村名、行政區劃或方言篩選，查看經緯度，支援表格排序與分頁。',
        'zh-CN': '按照表格查看广东自然村名录，可按村名、行政区划或方言筛选，查看经纬度，支持表格排序与分页。',
        en: 'Browse Guangdong natural villages in a table, filter by village name, administrative area, or dialect, and view coordinates, with sorting and pagination.',
      },
    },
    '/explore/villages/all': {
      title: {
        'zh-Hant': '全部自然村資料｜方音圖鑑',
        'zh-CN': '全部自然村资料｜方音图鉴',
        en: 'All Village Data | Dialects Atlas',
      },
      description: {
        'zh-Hant': '按樹狀圖查看全國自然村名錄、村落總資料庫。（僅管理員）',
        'zh-CN': '按树状图查看全国自然村名录、村落总数据库。（仅管理员）',
        en: 'Browse the nationwide natural village directory and complete village database in a tree. Administrators only.',
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
        'zh-Hant': '線上查詢全國各地方言詞彙，比較同一詞語在不同地區的方言說法、IPA和詞義解釋等。支援按書面語標準詞、方言詞、音標或釋義搜尋，並透過卡片、地圖和表格三種模式瀏覽方言詞表。',
        'zh-CN': '在线查询全国各地方言词汇，比较同一词语在不同地区的方言说法、IPA和词义解释等。支持按书面语标准词、方言词、音标或释义搜索，并通过卡片、地图和表格三种模式浏览方言词表。',
        en: 'Look up dialect vocabulary across China online and compare local expressions, IPA pronunciations, and meanings for the same word across regions. Search standard written words, dialect words, transcriptions, or meanings, and browse vocabulary in card, map, and table views.',
      },
    },
    '/menu/vocabulary/import': {
      title: {
        'zh-Hant': '詞表匯入｜方音圖鑑',
        'zh-CN': '词表导入｜方音图鉴',
        en: 'Vocabulary Import | Dialects Atlas',
      },
      description: {
        'zh-Hant': '線上匯入方言詞表：申請編輯權限後填寫方言點資訊，按標準格式批量上傳詞彙、IPA 讀音與釋義，並校驗資料格式。',
        'zh-CN': '在线导入方言词表：申请编辑权限后填写方言点信息，按标准格式批量上传词汇、IPA 读音与释义，并校验数据格式。',
        en: 'Import dialect vocabulary online. Request editing permission, enter location details, and batch-upload words, IPA readings, and meanings with format validation.',
      },
    },
    '/menu/vocabulary/manage': {
      title: {
        'zh-Hant': '詞表管理｜方音圖鑑',
        'zh-CN': '词表管理｜方音图鉴',
        en: 'Vocabulary Management | Dialects Atlas',
      },
      description: {
        'zh-Hant': '線上管理自己提交的方言詞表：編輯詞彙、讀音、釋義及地點資料，批量替換內容或增刪詞條。需詞表編輯權限。',
        'zh-CN': '在线管理自己提交的方言词表：编辑词汇、读音、释义及地点资料，批量替换内容或增删词条。需词表编辑权限。',
        en: 'Manage your own dialect vocabulary submissions online: edit words, readings, meanings, and locations, replace text in bulk, and add or delete entries. Editing permission required.',
      },
    },
    '/menu/villages': {
      title: {
        'zh-Hant': '自然村｜方音圖鑑',
        'zh-CN': '自然村｜方音图鉴',
        en: 'Villages | Dialects Atlas',
      },
      description: {
        'zh-Hant': '自然村查詢、村落資料庫、村名查詢、村落方言分佈等入口。',
        'zh-CN': '自然村查询、村落数据库、村名查询、村落方言分布等入口。',
        en: 'Access natural village lookup, village databases, village-name searches, and village dialect distribution.',
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
        'zh-Hant': '在地圖上查看查詢（查字、查中古、查音位、查調），比較（比較漢字、比較中古、比較調類），方言分區等的結果，點選地點查看詳情，同時支援繪製音節等值線圖、熱力圖。',
        'zh-CN': '在地图上查看查询（查字、查中古、查音位、查调），比较（比较汉字、比较中古、比较调类），方言分区等的结果，点击地点查看详情，同时支持绘制音节等值线图、热力图。',
        en: 'Map results from character, Middle Chinese, phoneme, and tone queries; character, historical-category, and tone-category comparisons; and dialect divisions. Click locations for details and draw syllable contour maps and heatmaps.',
      },
    },
    '/menu/map/divide': {
      title: {
        'zh-Hant': '分區地圖｜方音圖鑑',
        'zh-CN': '分区地图｜方音图鉴',
        en: 'Dialect Division Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查詢方言點所屬的地圖集或音典分區，按分區層級繪製方言分區地圖，查看各方言分區的地理分佈。',
        'zh-CN': '查询方言点所属的地图集或音典分区，按分区层级绘制方言分区地图，查看各方言分区的地理分布。',
        en: 'Look up atlas or Yindian classifications for dialect locations, draw dialect division maps by classification level, and explore their geographic distribution.',
      },
    },
    '/menu/map/custom': {
      title: {
        'zh-Hant': '自定義地圖｜方音圖鑑',
        'zh-CN': '自定义地图｜方音图鉴',
        en: 'Custom Map | Dialects Atlas',
      },
      description: {
        'zh-Hant': '登入後新增和管理個人方言調查資料，如音韻特徵、漢字發音、調值資訊等，支援繪製自訂方言地圖；資料與帳號綁定，支援多裝置同步。',
        'zh-CN': '登录后新增和管理个人方言调查数据，如音韵特征、汉字发音、调值信息等，支持绘制自定义方言地图；数据与账号绑定，支持多设备同步。',
        en: 'Sign in to add and manage personal dialect survey data, including phonological features, character pronunciations, and tone values, and create custom dialect maps. Data is linked to your account and synchronized across devices.',
      },
    },
    '/menu/settings': {
      title: {
        'zh-Hant': '設定｜方音圖鑑',
        'zh-CN': '设置｜方音图鉴',
        en: 'Settings | Dialects Atlas',
      },
      description: {
        'zh-Hant': '配置語言、主題、中古查詢輸入方式、教程開關等。',
        'zh-CN': '配置语言、主题、中古查询输入方式、教程开关等。',
        en: 'Configure language, theme, Middle Chinese query input methods, tutorial visibility, and more.',
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
        'zh-Hant': '查看網站功能介紹、發展歷史、特別鳴謝等',
        'zh-CN': '查看网站功能介绍、发展历史、特别鸣谢等',
        en: 'View the site\'s features, development history, acknowledgments, and more.',
      },
    },
    '/menu/about/suggestion': {
      title: {
        'zh-Hant': '意見反饋｜方音圖鑑',
        'zh-CN': '意见反馈｜方音图鉴',
        en: 'Feedback | Dialects Atlas',
      },
      description: {
        'zh-Hant': '跳轉github提出issue或透過知乎 AI-works 反映建議，或直接在本站內提交回饋。',
        'zh-CN': '跳转github提出issue或通过知乎 AI-works 反映建议，或直接在本站内提交反馈。',
        en: 'Open an issue on GitHub, send suggestions through Zhihu AI-works, or submit feedback directly on this site.',
      },
    },
    '/menu/about/like': {
      title: {
        'zh-Hant': '支持我們｜方音圖鑑',
        'zh-CN': '支持我们｜方音图鉴',
        en: 'Support Us | Dialects Atlas',
      },
      description: {
        'zh-Hant': '查看專案倉庫、作者的開發感悟，以及掃碼支持作者。',
        'zh-CN': '查看项目仓库、作者的开发感悟，以及扫码支持作者。',
        en: 'View the project repository and the author\'s development reflections, or scan a QR code to support the author.',
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
        'zh-Hant': '線上GIS地圖編輯器：可匯入地理資料（如行政區劃、河流等），分圖層編輯點、線、面和文字標註，並匯出 GeoJSON 或圖片。支援透過泰森多邊形（voronoi圖）繪製方言分佈圖，可使用網站資料或自訂上傳方言點資料。（需登入）',
        'zh-CN': '在线GIS地图编辑器：可导入地理数据（如行政区划、河流等），分图层编辑点、线、面和文字标注，并导出 GeoJSON 或图片。支持通过泰森多边形（voronoi图）绘制方言分布图，可使用网站数据或自定义上传方言点数据。（需登录）',
        en: 'Use an online GIS map editor to import geographic data, such as administrative divisions and rivers, edit points, lines, polygons, and text labels in layers, and export GeoJSON or images. Create dialect distribution maps with Voronoi polygons using site data or uploaded dialect locations. Sign-in required.',
      },
    },
    '/explore/manage': {
      title: {
        'zh-Hant': '字表管理｜方音圖鑑',
        'zh-CN': '字表管理｜方音图鉴',
        en: 'Table Management | Dialects Atlas',
      },
      description: {
        'zh-Hant': '管理和維護站點資料庫（僅管理員）。',
        'zh-CN': '管理和维护站点数据库（仅管理员）。',
        en: 'Manage and maintain the site database. Administrators only.',
      },
    },
    '/explore/tools/check': {
      title: {
        'zh-Hant': '字表檢查｜方音圖鑑',
        'zh-CN': '字表检查｜方音图鉴',
        en: 'Table Check | Dialects Atlas',
      },
      description: {
        'zh-Hant': '上傳方言字表，線上檢查非單字、異常 IPA 音標和缺聲調等問題，編輯修正後下載結果。（需登入）',
        'zh-CN': '上传方言字表，在线检查非单字、异常 IPA 音标和缺声调等问题，编辑修正后下载结果。（需登录）',
        en: 'Upload dialect character tables to check for non-single-character entries, unusual IPA, and missing tones online. Edit corrections and download the results. Sign-in required.',
      },
    },
    '/explore/tools/jyut2ipa': {
      title: {
        'zh-Hant': '粵拼轉 IPA｜方音圖鑑',
        'zh-CN': '粤拼转 IPA｜方音图鉴',
        en: 'Jyutping to IPA | Dialects Atlas',
      },
      description: {
        'zh-Hant': '上傳含粵拼欄的 Excel 字表，線上批量將粵語拼音轉換為 IPA 國際音標，支援自訂轉換規則、預覽並下載結果。（需登入）',
        'zh-CN': '上传含粤拼列的 Excel 字表，在线批量将粤语拼音转换为 IPA 国际音标，支持自定义转换规则、预览并下载结果。（需登录）',
        en: 'Upload an Excel character table with a Jyutping column to batch-convert Cantonese romanization to IPA online. Customize conversion rules, preview, and download results. Sign-in required.',
      },
    },
    '/explore/tools/merge': {
      title: {
        'zh-Hant': '字表合併｜方音圖鑑',
        'zh-CN': '字表合并｜方音图鉴',
        en: 'Table Merge | Dialects Atlas',
      },
      description: {
        'zh-Hant': '上傳參考表與多份方言 Excel 字表，按參考表漢字順序對齊讀音和註釋，保留一字多音並下載合併結果。（需登入）',
        'zh-CN': '上传参考表与多份方言 Excel 字表，按参考表汉字顺序对齐读音和注释，保留一字多音并下载合并结果。（需登录）',
        en: 'Upload a reference table and multiple dialect Excel tables to align readings and notes by the reference character order, preserve multiple pronunciations, and download the merged results. Sign-in required.',
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
        'zh-Hant': '在線Praat語音聲學分析：上傳音檔或直接錄音，查看基頻曲線、共振峰、頻譜圖和母音空間等，手動選取樣本後用石鋒T值法生成五度制聲調圖。（需登入）',
        'zh-CN': '在线Praat语音声学分析：上传音频或直接录音，查看基频曲线、共振峰、频谱图和元音空间等，手动选取样本后用石锋T值法生成五度制声调图。（需登录）',
        en: 'Use Praat online for speech acoustic analysis: upload or record audio to view pitch curves, formants, spectrograms, vowel space, and more. Manually select samples to generate five-level tone charts using Shi Feng\'s T-value method. Sign-in required.',
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
