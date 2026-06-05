function readQueryValue(query, key) {
  const rawValue = query?.[key]
  if (Array.isArray(rawValue)) {
    return rawValue[0] || ''
  }
  return rawValue || ''
}

function buildSections(goal, steps, tips = []) {
  const sections = [
    {
      heading: '這一頁可以做什麼',
      paragraphs: [goal],
      bullets: [],
    },
    {
      heading: '建議操作順序',
      paragraphs: [],
      bullets: steps,
    },
  ]

  if (tips.length > 0) {
    sections.push({
      heading: '使用提醒',
      paragraphs: [],
      bullets: tips,
    })
  }

  return sections
}

function createPathEntry({ key, group, title, path, summary, steps, tips = [] }) {
  return {
    key,
    group,
    title,
    summary,
    match: (currentRoute) => currentRoute.path === path,
    sections: buildSections(summary, steps, tips),
  }
}

function createQueryEntry({
  key,
  group,
  title,
  path,
  summary,
  steps,
  tips = [],
  queryResolver,
  expectedValue,
}) {
  return {
    key,
    group,
    title,
    summary,
    match: (currentRoute) => currentRoute.path === path && queryResolver(currentRoute) === expectedValue,
    sections: buildSections(summary, steps, tips),
  }
}

function normalizeAuthView(currentRoute) {
  const view = readQueryValue(currentRoute.query, 'view')

  if (view === 'register' || view === 'leaderboard' || view === 'modify') {
    return view
  }

  if (view === 'overview' || view === 'profile') {
    return 'overview'
  }

  return 'login'
}

function normalizePraatTab(currentRoute) {
  const tab = readQueryValue(currentRoute.query, 'tab')
  const validTabs = ['upload', 'results', 'vowelspace', 'pitchtone']
  return validTabs.includes(tab) ? tab : 'upload'
}

function normalizeYuBaoTab(currentRoute) {
  return readQueryValue(currentRoute.query, 'tab') === 'grammar' ? 'grammar' : 'vocabulary'
}

function normalizeCharacterTableTab(currentRoute) {
  const tab = readQueryValue(currentRoute.query, 'tab')
  const validTabs = ['zhonggu', 'shanggu', 'jingu', 'yueyun']
  return validTabs.includes(tab) ? tab : 'zhonggu'
}

export const tutorialContentEntries = [
  createQueryEntry({
    key: 'auth-login',
    group: '賬戶與自定義',
    title: '登錄',
    path: '/auth',
    expectedValue: 'login',
    queryResolver: normalizeAuthView,
    summary: '用已有帳號登錄，之後可以打開個人資料、我的數據與自定義分區。',
    steps: [
      '按需要切換郵箱登錄或用戶名登錄。',
      '輸入帳號與密碼後提交。',
      '若是從受保護頁面跳來，登錄成功後會返回原來頁面。'
    ],
    tips: [
      '如果只是想先看看權益，可以直接打開會員權益彈窗。',
      '看見錯誤提示時，先檢查帳號類型和密碼長度。'
    ],
  }),
  createQueryEntry({
    key: 'auth-register',
    group: '賬戶與自定義',
    title: '註冊',
    path: '/auth',
    expectedValue: 'register',
    queryResolver: normalizeAuthView,
    summary: '建立新帳號，之後就能保存自己的資料、地點和分區配置。',
    steps: [
      '先填寫用戶名、郵箱與密碼。',
      '再次確認密碼一致後提交。',
      '註冊成功後會自動切回登錄頁。'
    ],
    tips: [
      '用戶名、郵箱與密碼都會先走前端校驗。',
      '如果提示已存在，請直接改用其他用戶名或郵箱。'
    ],
  }),
  createQueryEntry({
    key: 'auth-overview',
    group: '賬戶與自定義',
    title: '賬戶總覽',
    path: '/auth',
    expectedValue: 'overview',
    queryResolver: normalizeAuthView,
    summary: '查看自己的帳號概況、查詢統計，並進入我的數據、我的分區與更多工具入口。',
    steps: [
      '先看頁面上方的個人資訊和統計卡片。',
      '再按需要跳去我的數據或自定義分區。',
      '需要修改帳號資料時，從這裡進入修改資料頁。'
    ],
    tips: [
      '排行榜和概覽共用這個頁面殼，只是內部 tab 不同。',
      '如果有管理權限，這裡也會出現管理入口。'
    ],
  }),
  createQueryEntry({
    key: 'auth-leaderboard',
    group: '賬戶與自定義',
    title: '貢獻排行',
    path: '/auth',
    expectedValue: 'leaderboard',
    queryResolver: normalizeAuthView,
    summary: '查看當前帳號相關的排行榜區塊，了解自己的查詢與使用表現。',
    steps: [
      '先切到排行榜 tab。',
      '查看榜單卡片和排名資訊。',
      '需要返回個人資訊時，再切回概覽。'
    ],
    tips: [
      '排行榜屬於個人中心內部視圖，不是獨立路由頁。',
      '如果尚未登錄，會先被帶回登錄流程。'
    ],
  }),
  createQueryEntry({
    key: 'auth-modify',
    group: '賬戶與自定義',
    title: '修改資料',
    path: '/auth',
    expectedValue: 'modify',
    queryResolver: normalizeAuthView,
    summary: '在同一個帳號頁裡修改用戶名或密碼，提交前會先做確認。',
    steps: [
      '先選擇要修改用戶名還是密碼。',
      '填好新值後確認提交。',
      '修改成功後會回到個人概覽。'
    ],
    tips: [
      '密碼修改會要求填寫當前密碼。',
      '這裡的確認框屬於保護操作，看到確認提示屬正常。'
    ],
  }),
  createPathEntry({
    key: 'auth-data',
    group: '賬戶與自定義',
    title: '我的數據',
    path: '/auth/data',
    summary: '管理你自己上傳或整理的資料記錄，支援查看、編輯、匯入與提交。',
    steps: [
      '先看表格裡現有資料與欄位。',
      '再按需要新增、批量匯入或逐條修改。',
      '提交前先檢查地點、特徵和值是否完整。'
    ],
    tips: [
      '這裡是自定義繪圖和個人資料工具的重要資料來源。',
      '如果欄位含中文與符號，提交前最好再核對一次格式。'
    ],
  }),
  createPathEntry({
    key: 'auth-regions',
    group: '賬戶與自定義',
    title: '自定義分區',
    path: '/auth/regions',
    summary: '建立和管理自己的地理分區，之後可以在查詢、地圖和個人資料流程裡復用。',
    steps: [
      '先查看已有分區列表。',
      '新增或編輯分區名稱與包含地點。',
      '保存後回到需要使用分區的頁面重新選擇。'
    ],
    tips: [
      '自定義分區主要服務你自己的工作流，不會直接改公共數據。',
      '命名時盡量用自己能辨認的語義。'
    ],
  }),
  createPathEntry({
    key: 'menu-query-char',
    group: '主站查詢',
    title: '查字',
    path: '/menu/query/char',
    summary: '直接輸入漢字，查看不同地點的字音與對應資料。',
    steps: [
      '先輸入要查的漢字。',
      '再補充地點或分區限制。',
      '最後運行查詢並在結果頁查看輸出。'
    ],
    tips: [
      '查字頁最適合從字形直接反查讀音。',
      '如果字太多，先縮小地點範圍會更容易讀結果。'
    ],
  }),
  createPathEntry({
    key: 'menu-query-zhonggu',
    group: '主站查詢',
    title: '查中古',
    path: '/menu/query/zhonggu',
    summary: '用中古音條件做檢索，按地點整理聲母、韻母、聲調等查詢結果。',
    steps: [
      '先挑卡片、鍵名和鍵值條件。',
      '再補充分區或具體地點。',
      '運行後到結果頁或地圖頁看輸出。'
    ],
    tips: [
      '這一頁適合從中古地位反查現代方言表現。',
      '如果條件很多，先從少量條件開始更容易判斷結果是否合理。'
    ],
  }),
  createPathEntry({
    key: 'menu-query-yinwei',
    group: '主站查詢',
    title: '查音位',
    path: '/menu/query/yinwei',
    summary: '根據音位或音值反查對應的中古來源與分佈情況。',
    steps: [
      '先選擇需要分析的類型與條件。',
      '再輸入或選擇音位內容。',
      '運行後結合結果表與地圖一起看。'
    ],
    tips: [
      '這一頁常用來回答某個音值在不同地點來自哪些中古類別。',
      '若輸入無效，先看頁面本身的輸入提示。'
    ],
  }),
  createPathEntry({
    key: 'menu-query-tone',
    group: '主站查詢',
    title: '查調類',
    path: '/menu/query/tone',
    summary: '集中查看調值與調類資料，快速比較不同地點的聲調表現。',
    steps: [
      '先選擇要查的地點或分區。',
      '再運行查詢。',
      '到結果裡對照調類名稱、顏色與具體值。'
    ],
    tips: [
      '如果結果太散，先縮小地理範圍。',
      '調值與調類要分開看：一個是數值，一個是分類。'
    ],
  }),
  createPathEntry({
    key: 'menu-compare-char',
    group: '主站比較',
    title: '比較漢字',
    path: '/menu/compare/char',
    summary: '對兩組漢字做並排比較，觀察它們在不同地點的差異。',
    steps: [
      '先分別填入兩組漢字。',
      '再選比較的特徵類型。',
      '運行後到結果與地圖觀察差異。'
    ],
    tips: [
      '兩組比較最好保持同一個觀察角度，方便讀圖。',
      '比較前先確認地點限制一致。'
    ],
  }),
  createPathEntry({
    key: 'menu-compare-zhonggu',
    group: '主站比較',
    title: '比較中古',
    path: '/menu/compare/zhonggu',
    summary: '把兩組中古條件放在一起比較，看它們在各地讀音分佈上的差異。',
    steps: [
      '先在中央條件區組裝一條中古條件。',
      '分別加入組 1 和組 2。',
      '選好地點後運行比較。'
    ],
    tips: [
      '兩組條件的加入按鈕是核心操作，先確認別加反了。',
      '這一頁適合觀察兩組條件的地理分化。'
    ],
  }),
  createPathEntry({
    key: 'menu-compare-tone',
    group: '主站比較',
    title: '比較調類',
    path: '/menu/compare/tone',
    summary: '在同一張輸出裡比較兩個調類的差異，適合快速看聲調分佈。',
    steps: [
      '先勾選兩個要比較的調類。',
      '再設定地點或分區。',
      '運行後到結果和地圖對讀。'
    ],
    tips: [
      '這一頁一次只適合比較兩個調類。',
      '如果按鈕不可用，多半是還沒選滿兩個類別。'
    ],
  }),
  createPathEntry({
    key: 'menu-map-view',
    group: '主站地圖',
    title: '地圖總覽',
    path: '/menu/map/view',
    summary: '以地圖方式查看當前查詢或比較結果，並按特徵切換視圖。',
    steps: [
      '先確保前面已經有查詢或比較結果。',
      '在地圖頁選擇特徵或查看當前比較對象。',
      '結合圖例、彈窗與地點資料閱讀結果。'
    ],
    tips: [
      '地圖頁本身不生產數據，主要是讀現有結果。',
      '如果圖上沒有內容，先回前一頁確認是否真的有結果。'
    ],
  }),
  createPathEntry({
    key: 'menu-map-divide',
    group: '主站地圖',
    title: '地圖分區',
    path: '/menu/map/divide',
    summary: '按地圖方式查看和調整分區相關資訊，適合做區域層面的閱讀。',
    steps: [
      '先切到分區頁籤。',
      '選擇需要看的分區層級或區域。',
      '結合主地圖看整體邊界與範圍。'
    ],
    tips: [
      '分區視圖更偏整體格局，不是逐條資料輸入頁。',
      '切換層級後要等地圖重新整理。'
    ],
  }),
  createPathEntry({
    key: 'menu-map-custom',
    group: '主站地圖',
    title: '自定義繪圖',
    path: '/menu/map/custom',
    summary: '把自己的資料、地點與特徵疊加到地圖上，做個人化繪圖與展示。',
    steps: [
      '先登錄並準備好自己的資料。',
      '在頁面裡輸入地點、特徵和值。',
      '添加單條或批量資料後，再切回地圖查看。'
    ],
    tips: [
      '頁面裡已經有詳細說明彈窗，這裡適合當總索引。',
      '自定義資料的格式越整齊，後續繪圖越穩。'
    ],
  }),
  createPathEntry({
    key: 'menu-pho-matrix',
    group: '主站音系',
    title: '音系矩陣',
    path: '/menu/pho/matrix',
    summary: '用矩陣方式查看聲韻調對應關係，適合做整體音系閱讀。',
    steps: [
      '先選地點與特徵。',
      '再切換需要看的行列配置。',
      '從矩陣點位進一步打開詳情。'
    ],
    tips: [
      '矩陣頁適合先看整體格局，再鑽到細節。',
      '若矩陣內容太密，先換更小的地點範圍。'
    ],
  }),
  createPathEntry({
    key: 'menu-pho-custom',
    group: '主站音系',
    title: '音系自定義',
    path: '/menu/pho/custom',
    summary: '按自己的觀察維度組裝音系視圖，適合做定向分析。',
    steps: [
      '先挑地點與觀察目標。',
      '再調整頁內自定義配置。',
      '最後對照輸出和明細彈窗。'
    ],
    tips: [
      '這一頁更偏分析工作台，設定越清楚越好。',
      '遇到空結果時，先縮回更基礎的配置。'
    ],
  }),
  createPathEntry({
    key: 'menu-pho-count',
    group: '主站音系',
    title: '音類統計',
    path: '/menu/pho/count',
    summary: '統計指定音類或條件在各地的出現情況，適合做分佈概覽。',
    steps: [
      '先設定地點與條件。',
      '運行後查看統計輸出。',
      '需要時再打開明細彈窗看具體地點。'
    ],
    tips: [
      '這一頁更重視數量和分佈，不是逐字閱讀。',
      '彈窗裡會列出對應地點，方便回查。'
    ],
  }),
  createPathEntry({
    key: 'menu-pho-evolution',
    group: '主站音系',
    title: '音變演化',
    path: '/menu/pho/evolution',
    summary: '聚焦音變流程與演化關係，適合看聲韻調如何從來源走到現代形式。',
    steps: [
      '先選好地點與關注的音變條件。',
      '再查看演化圖、統計或明細區。',
      '必要時配合其他音系頁交叉驗證。'
    ],
    tips: [
      '如果輸出較複雜，先從少量條件開始。',
      '這一頁更適合帶著問題來看，而不是盲掃全部輸出。'
    ],
  }),
  createPathEntry({
    key: 'menu-result',
    group: '支援與資源',
    title: '結果頁',
    path: '/menu/result',
    summary: '匯總展示前面查詢或比較產生的結果，方便集中閱讀與再跳轉。',
    steps: [
      '先確認前面的查詢已經成功運行。',
      '在這裡按卡片、表格或子模塊閱讀結果。',
      '需要地圖時再切回地圖頁。'
    ],
    tips: [
      '結果頁是主站很多流程的匯合點。',
      '看不懂時先回原始查詢頁確認輸入條件。'
    ],
  }),
  createPathEntry({
    key: 'menu-about-intro',
    group: '支援與資源',
    title: '項目簡介',
    path: '/menu/about/intro',
    summary: '快速了解這個站點能做什麼、資料大致來自哪裡，以及整體定位。',
    steps: [
      '先看功能概覽。',
      '再讀後面的感想與致謝。',
      '想真正上手時，返回你要用的功能頁。'
    ],
    tips: [
      '這一頁偏介紹，不是操作入口。',
      '第一次使用主站時可以先看一遍。'
    ],
  }),
  createPathEntry({
    key: 'menu-about-suggestion',
    group: '支援與資源',
    title: '反饋建議',
    path: '/menu/about/suggestion',
    summary: '集中放置意見回饋入口，方便把前端或資料問題分別提交。',
    steps: [
      '先判斷問題更偏前端還是資料。',
      '點對應連結進 issue 頁。',
      '提交時盡量附上頁面、條件與截圖。'
    ],
    tips: [
      '描述越具體，後續越容易排查。',
      '如果是查詢結果問題，最好帶上你當時的條件。'
    ],
  }),
  createPathEntry({
    key: 'menu-about-like',
    group: '支援與資源',
    title: '支持作者',
    path: '/menu/about/like',
    summary: '查看相關項目、追蹤方式與支持入口，也能打開統一的支持彈窗。',
    steps: [
      '先看相關項目卡片。',
      '需要支持時打開支持彈窗。',
      '完成後回到主功能頁繼續使用。'
    ],
    tips: [
      '這裡的支持彈窗與首頁等入口共用同一套組件。',
      '如果只是想了解作者其他項目，直接看卡片區即可。'
    ],
  }),
  createPathEntry({
    key: 'menu-about-settings',
    group: '支援與資源',
    title: '項目設置',
    path: '/menu/about/settings',
    summary: '切換語言、字表等全站偏好設定，會影響後續主站使用體驗。',
    steps: [
      '先選擇語言。',
      '再按需要切換字表。',
      '返回功能頁確認顯示是否符合預期。'
    ],
    tips: [
      '這裡的設置屬於全站偏好，不只是當前頁。',
      '切換字表後，部分查詢頁的可用內容也會變。'
    ],
  }),
  createPathEntry({
    key: 'menu-source',
    group: '支援與資源',
    title: '數據來源',
    path: '/menu/source',
    summary: '集中查看資料規模、來源與引用基礎，方便了解站點內容背景。',
    steps: [
      '先看總體統計。',
      '再閱讀主要數據來源。',
      '需要引用時可回到這裡核對來源信息。'
    ],
    tips: [
      '這一頁偏資料背景，不是操作頁。',
      '做正式引用前仍建議二次核對。'
    ],
  }),
  createPathEntry({
    key: 'menu-privacy',
    group: '支援與資源',
    title: '隱私說明',
    path: '/menu/privacy',
    summary: '查看站點的隱私政策與使用說明，了解資料與帳號資訊如何處理。',
    steps: [
      '先看總體說明。',
      '再按需要閱讀引用與隱私條款。',
      '有帳號相關顧慮時，這裡是最直接的解釋頁。'
    ],
    tips: [
      '這一頁屬於靜態說明頁，不會改變功能狀態。',
      '遇到帳號或資料疑問時，可先回這裡確認。'
    ],
  }),
  createPathEntry({
    key: 'menu-tools',
    group: '支援與資源',
    title: '工具入口',
    path: '/menu/tools',
    summary: '查看工具類資源入口，從主站跳轉到更專門的工具流程。',
    steps: [
      '先看各工具卡片。',
      '按需求選一個入口。',
      '若工具需要登錄或前置資料，先補齊再用。'
    ],
    tips: [
      '這一頁更像總入口頁，不承擔具體操作。',
      '不確定去哪裡時，可以先從這裡找。'
    ],
  }),
  createPathEntry({
    key: 'menu-words',
    group: '支援與資源',
    title: '詞彙資源',
    path: '/menu/words',
    summary: '查看與詞彙相關的入口與資源，方便切去詞彙型內容。',
    steps: [
      '先看頁面上的資源分類。',
      '再按主題選擇後續入口。',
      '進入具體頁面後再做細讀。'
    ],
    tips: [
      '詞彙資源頁本身偏導航，不是最終分析頁。',
      '如果你要找的是口語或語保內容，也可以轉去 explore 相關頁。'
    ],
  }),
  createPathEntry({
    key: 'menu-villages',
    group: '支援與資源',
    title: '村落資源',
    path: '/menu/villages',
    summary: '整理與村落資料相關的入口，方便跳去不同的村落探索頁。',
    steps: [
      '先看有哪些村落相關模塊。',
      '選一個入口進入 explore 的具體頁。',
      '在具體頁再做篩選或查看地圖。'
    ],
    tips: [
      '這一頁主要做導航，不是具體數據表。',
      '如果你要看廣東自然村或陽春村落，通常會再跳到 explore。'
    ],
  }),
  createPathEntry({
    key: 'menu-cluster',
    group: '支援與資源',
    title: '方言聚類',
    path: '/menu/cluster',
    summary: '進入聚類分析相關視圖，從更宏觀的角度看方言之間的關係。',
    steps: [
      '先看聚類頁提供的視圖。',
      '再按當前資料狀態閱讀聚類結果。',
      '需要交叉驗證時回到查詢、結果或地圖頁。'
    ],
    tips: [
      '聚類頁更適合在已有分析目標時使用。',
      '如果輸出較抽象，最好搭配其他頁面一起理解。'
    ],
  }),
  createPathEntry({
    key: 'explore-check',
    group: 'Explore 工具',
    title: '數據檢查',
    path: '/explore/tools/check',
    summary: '檢查資料格式與內容問題，適合在整理個人資料或批量處理前後使用。',
    steps: [
      '先導入或貼入要檢查的資料。',
      '查看錯誤與提示分類。',
      '按頁內說明修正後再重新檢查。'
    ],
    tips: [
      '這一頁本身已內建詳細幫助彈窗。',
      '如果是批量處理，最好先保留原始資料備份。'
    ],
  }),
  createPathEntry({
    key: 'explore-jyut2ipa',
    group: 'Explore 工具',
    title: '粵拼轉 IPA',
    path: '/explore/tools/jyut2ipa',
    summary: '把粵拼內容轉成 IPA，適合做發音記號轉換與校對。',
    steps: [
      '先輸入原始粵拼。',
      '查看轉換結果。',
      '需要時再複製或回填到其他流程。'
    ],
    tips: [
      '轉換工具適合做輔助，不一定能代替人工校訂。',
      '遇到特殊記法時，建議人工再核對一次。'
    ],
  }),
  createPathEntry({
    key: 'explore-merge',
    group: 'Explore 工具',
    title: '數據合併',
    path: '/explore/tools/merge',
    summary: '把多份資料合併到一起，方便後續清洗、檢查和導入。',
    steps: [
      '先準備主表與補充表。',
      '在頁內查看比對結果。',
      '確認後再下載或採用合併結果。'
    ],
    tips: [
      '合併前先明確主表和補充表角色。',
      '資料量大時，先做小範圍試合併更穩。'
    ],
  }),
  createPathEntry({
    key: 'explore-manage',
    group: 'Explore 工具',
    title: '表格管理',
    path: '/explore/manage',
    summary: '集中管理表格與後台型資料操作，適合進階整理流程。',
    steps: [
      '先確認你有對應權限。',
      '選擇要管理的表或資料源。',
      '操作完成後再回主流程驗證結果。'
    ],
    tips: [
      '這一頁更接近管理工作台，不建議隨手批量改。',
      '重要操作前最好先確認資料備份。'
    ],
  }),
  createQueryEntry({
    key: 'explore-praat-upload',
    group: 'Praat 分析',
    title: 'Praat 上傳',
    path: '/explore/tools/praat',
    expectedValue: 'upload',
    queryResolver: normalizePraatTab,
    summary: '上傳音訊、設定分析模式與參數，為後面的 Praat 分析做準備。',
    steps: [
      '先上傳音訊或切分片段。',
      '再打開設定側欄檢查模式與參數。',
      '確認後開始分析。'
    ],
    tips: [
      '如果結果頁籤還不可用，通常是因為分析還沒完成。',
      '音訊預覽浮窗只是在前置階段幫你檢查素材。'
    ],
  }),
  createQueryEntry({
    key: 'explore-praat-results',
    group: 'Praat 分析',
    title: 'Praat 結果',
    path: '/explore/tools/praat',
    expectedValue: 'results',
    queryResolver: normalizePraatTab,
    summary: '查看分析任務的狀態與結果輸出，是 Praat 流程的核心閱讀頁。',
    steps: [
      '先確認任務已完成或至少有可讀狀態。',
      '查看結果面板裡的分析輸出。',
      '需要更細的聲學視圖時，再切去後面的頁籤。'
    ],
    tips: [
      '結果頁會在分析未完成時顯示狀態面板。',
      '沒有結果時，先回上一步看是否真的提交成功。'
    ],
  }),
  createQueryEntry({
    key: 'explore-praat-vowelspace',
    group: 'Praat 分析',
    title: 'Praat 元音圖',
    path: '/explore/tools/praat',
    expectedValue: 'vowelspace',
    queryResolver: normalizePraatTab,
    summary: '用更直觀的元音空間視圖查看 Praat 分析結果。',
    steps: [
      '先確保前面已經拿到可用的 formant 結果。',
      '切到元音圖頁讀取分佈。',
      '必要時再回結果頁交叉檢查原始輸出。'
    ],
    tips: [
      '沒有 formant 資料時，這個頁籤會不可用。',
      '看圖時最好結合具體樣本理解。'
    ],
  }),
  createQueryEntry({
    key: 'explore-praat-pitchtone',
    group: 'Praat 分析',
    title: 'Praat 音高圖',
    path: '/explore/tools/praat',
    expectedValue: 'pitchtone',
    queryResolver: normalizePraatTab,
    summary: '把 Praat 分析得到的音高相關結果轉成更直觀的圖形閱讀。',
    steps: [
      '先確認前面結果已生成音高資料。',
      '切到音高圖頁觀察走勢。',
      '需要時再回結果頁看對應的數據細節。'
    ],
    tips: [
      '這個頁籤也是依賴前面分析結果，不是獨立輸入頁。',
      '如果頁籤灰掉，先回上游檢查任務結果。'
    ],
  }),
  createQueryEntry({
    key: 'explore-yubao-vocabulary',
    group: 'Explore 資源',
    title: '語保詞彙',
    path: '/explore/yubao',
    expectedValue: 'vocabulary',
    queryResolver: normalizeYuBaoTab,
    summary: '查看語保相關的詞彙資料與檢索內容。',
    steps: [
      '先看當前詞彙頁籤的資料表。',
      '按需要篩選與檢索。',
      '需要語法資料時再切換另一個頁籤。'
    ],
    tips: [
      '這個頁面主要看語保詞彙，不是主站查詢結果頁。',
      '切頁籤後會記住你最後看的子頁。'
    ],
  }),
  createQueryEntry({
    key: 'explore-yubao-grammar',
    group: 'Explore 資源',
    title: '語保語法',
    path: '/explore/yubao',
    expectedValue: 'grammar',
    queryResolver: normalizeYuBaoTab,
    summary: '查看語保資料裡的語法條目與相關整理內容。',
    steps: [
      '先切到語法頁籤。',
      '再閱讀條目與說明。',
      '需要對照詞彙時可切回另一頁。'
    ],
    tips: [
      '語法與詞彙共用同一條 explore 路由，只靠 query.tab 區分。',
      '如果直接打開沒有 tab，預設會落在詞彙。'
    ],
  }),
  createQueryEntry({
    key: 'explore-char-class-zhonggu',
    group: 'Explore 資源',
    title: '字表·中古',
    path: '/explore/char-class',
    expectedValue: 'zhonggu',
    queryResolver: normalizeCharacterTableTab,
    summary: '查看字表分類裡的中古分頁，適合做來源或字表對照。',
    steps: [
      '先確認當前在中古頁籤。',
      '閱讀表格與層級內容。',
      '需要時切去其他年代頁籤對照。'
    ],
    tips: [
      '字表頁更偏資料瀏覽與對照。',
      '不同年代頁籤的資料口徑不完全相同。'
    ],
  }),
  createQueryEntry({
    key: 'explore-char-class-shanggu',
    group: 'Explore 資源',
    title: '字表·上古',
    path: '/explore/char-class',
    expectedValue: 'shanggu',
    queryResolver: normalizeCharacterTableTab,
    summary: '查看字表分類裡的上古分頁，適合做歷時層面的字表對照。',
    steps: [
      '切到上古頁籤。',
      '查看表格與分層內容。',
      '需要時與中古或近古頁對照。'
    ],
    tips: [
      '這類頁面更適合做資料查考，不是主站查詢輸出。',
      '直接打開無 tab 時會先回中古頁。'
    ],
  }),
  createQueryEntry({
    key: 'explore-char-class-jingu',
    group: 'Explore 資源',
    title: '字表·近古',
    path: '/explore/char-class',
    expectedValue: 'jingu',
    queryResolver: normalizeCharacterTableTab,
    summary: '查看字表分類裡的近古分頁，方便做年代層對照。',
    steps: [
      '切到近古頁籤。',
      '閱讀分類表格。',
      '必要時與其他頁籤交叉看。'
    ],
    tips: [
      '不同頁籤是同一路由下的內部狀態。',
      '如果表格太多，先縮小當前查看範圍。'
    ],
  }),
  createQueryEntry({
    key: 'explore-char-class-yueyun',
    group: 'Explore 資源',
    title: '字表·切韻',
    path: '/explore/char-class',
    expectedValue: 'yueyun',
    queryResolver: normalizeCharacterTableTab,
    summary: '查看字表分類裡的切韻分頁，適合做切韻系統相關對照。',
    steps: [
      '切到切韻頁籤。',
      '查看分類與對應內容。',
      '需要時再回其他年代頁核對。'
    ],
    tips: [
      '切韻頁適合做特定字表層面的查考。',
      '這裡更偏資料資源閱讀，不是互動分析頁。'
    ],
  }),
  createPathEntry({
    key: 'explore-yc-spoken',
    group: 'Explore 資源',
    title: '陽春口語',
    path: '/explore/yc-spoken',
    summary: '查看陽春口語相關內容與資料，屬於 explore 的專門資源頁。',
    steps: [
      '先看頁面提供的資料內容。',
      '按需要做閱讀與篩選。',
      '如需回到主站分析，再切回其他入口。'
    ],
    tips: [
      '這類資源頁更適合深讀某一個子題。',
      '和主站查詢結果頁的節奏不同。'
    ],
  }),
  createPathEntry({
    key: 'explore-villages-gd',
    group: 'Explore 村落',
    title: '廣東自然村',
    path: '/explore/villages/gd',
    summary: '查看廣東自然村相關的樹狀資料與地圖入口。',
    steps: [
      '先在左側或頁面主區找村落條目。',
      '按需要打開詳情或地圖彈窗。',
      '再根據資料回到其他流程做分析。'
    ],
    tips: [
      '這一頁更偏村落資料瀏覽。',
      '彈出的地圖視圖適合快速定位。'
    ],
  }),
  createPathEntry({
    key: 'explore-villages-table',
    group: 'Explore 村落',
    title: '自然村表格',
    path: '/explore/villages/table',
    summary: '以表格方式查看自然村資料，適合按欄位快速掃描。',
    steps: [
      '先瀏覽表格欄位。',
      '再做排序、查找或閱讀。',
      '需要地圖定位時可切去其他村落頁。'
    ],
    tips: [
      '表格頁適合快速找資料，不一定適合空間閱讀。',
      '看不清範圍時，回到地圖型頁面更直觀。'
    ],
  }),
  createPathEntry({
    key: 'explore-villages-yc',
    group: 'Explore 村落',
    title: '陽春村落',
    path: '/explore/villages/yc',
    summary: '查看陽春村落相關資料與結構，方便聚焦本地範圍。',
    steps: [
      '先看頁面提供的村落列表或內容塊。',
      '再按需要查看具體資料。',
      '若要和更大範圍對比，可切回其他村落頁。'
    ],
    tips: [
      '這一頁和廣東自然村頁互補，一個更聚焦本地。',
      '閱讀前先確認自己要看的就是陽春範圍。'
    ],
  }),
]
