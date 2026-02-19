# 方音圖鑑 (Chinese Dialect Atlas)

> 專業的中文方言語言學分析與地理可視化平台

[![Vue 3](https://img.shields.io/badge/Vue-3.5.20-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.3-646CFF?logo=vite)](https://vitejs.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5.16-396CB2)](https://maplibre.org/)

**線上演示：** [https://dialects.yzup.top](https://dialects.yzup.top)

**文檔語言：** [English](./docs/README.en.md) | 中文

---

## 📖 項目簡介

**方音圖鑑**是一個為語言學家、研究人員和語言愛好者設計的綜合性網絡平台，用於探索和分析中文方言音韻學。平台結合了強大的音韻查詢功能、交互式地理可視化和先進的音頻分析工具。

**目標用戶：**
- 🎓 語言學家和音韻學研究人員
- 👨‍💻 從事語言學應用開發的前端工程師
- 🔧 部署和維護人員

**核心能力：**
- 跨多個中文方言查詢音韻數據
- 在交互式地圖上可視化方言分佈
- 使用矩陣工具分析音韻模式
- 集成 Praat 處理音頻錄音
- 管理自定義方言數據和區域分區

---

## ✨ 功能特性

### 📝 音韻查詢系統
四種強大的查詢模式探索方言數據：
- **查字** - 按漢字查詢（你好、世界）
- **查中古** - 按歷史音韻學搜索（聲母、韻母、調類、韻目）
- **查音位** - 按 IPA 音位查詢（p、t、k、ŋ）
- **查調** - 按調值查找方言（55、33、21）

**[→ 用戶指南](./docs/USER_GUIDE.md)** 查看詳細說明

### 🗺️ 地理可視化
基於 MapLibre GL 的交互式地圖可視化：
- **三種地圖模式** - 街道、衛星、地形
- **支持 10,000+ 標記** - GPU 加速的 Symbol Layer 渲染
- **自動聚類** - 密集區域分組以提高性能
- **智能顏色分配** - 最大化視覺區分度算法
- **自定義標註** - 添加您自己的標記和註釋

### 🔬 音系分析工具
專業的音系研究功能：
- **音系查詢** - 聲母韻母聲調對照表，完整展示方言音系結構
- **音素分類** - 根據不同特徵項（清濁、部位、方式等）自定義查詢聲韻調
- **音節統計** - 統計所查方言點的聲韻調數目，支持多地點對比
- **中古地位** - 查看漢字的中古音地位信息，追溯歷史音韻演變

### 📚 詞彙與語法資料
豐富的詞彙和語法數據庫：
- **語保詞彙** - 語保工程 1000 詞表，涵蓋基礎詞彙
- **語保語法** - 語保工程 50 條句子語法資料
- **陽春口語詞** - 廣東陽春口語單字詞表

### 🏘️ 自然村數據
詳細的自然村地理信息：
- **廣東自然村樹狀圖** - 廣東省自然村層級結構可視化
- **全粵村情表格** - 廣東省自然村完整表格數據
- **陽春自然村** - 廣東省陽春縣自然村詳細信息（來自縣志）

### 🎙️ Praat 音頻分析
專業音頻分析集成：
- **文件上傳和錄音** - 支持 WAV/MP3 格式和直接錄音
- **共振峰分析** - F1/F2/F3 提取和元音空間可視化
- **音高追蹤** - 聲調輪廓分析和分類
- **強度測量** - 聲學能量分析
- **非阻塞 UI** - 後台處理並顯示進度

### 🛠️ 數據管理工具
強大的數據操作工具：
- **字表檢查** - 檢查數據完整性和一致性
- **表格合併** - 合併多個方言數據集
- **粵拼轉 IPA** - 將粵語拼音轉換為 IPA
- **自定義數據管理** - 用戶特定的標註和註釋
- **自定義分區** - 將地點組織成自定義分組
- **Excel 導入/導出** - 批量數據操作

---

## 🚀 技術棧

### 前端核心
- **Vue 3.5.20** - Composition API 與 `<script setup>` 語法
- **Vue Router 4** - 基於 Hash 的 MPA 架構路由
- **Vite 7.1.3** - 現代化構建工具，5 個入口點

### 可視化
- **MapLibre GL 5.16** - 高性能地圖渲染
- **ECharts 5.6** - 數據可視化和圖表
- **wavesurfer.js 7.12** - 音頻波形顯示

### 數據處理
- **opencc-js** - 繁簡體中文轉換
- **xlsx** - Excel 文件導入/導出
- **@vueuse/core** - Vue 組合式工具

### 狀態管理
- **自定義響應式存儲** - 無需 Vuex/Pinia
- **6 個全局存儲** - globalPayload、userStore、mapStore、queryStore、resultCache、uiStore

### 後端 API
- **基礎 URL：** `https://dialects.yzup.top/api`
- **認證：** 基於 JWT 令牌，自動刷新
- **端點：** 27 個按功能組織的 API 模塊

---

## 🏃 快速開始

### 環境要求
- **Node.js** >= 18
- **npm** >= 9

### 安裝

```bash
# 克隆倉庫
git clone <repository-url>

# 進入項目目錄
cd project

# 安裝依賴
npm install
```

### 開發

```bash
# 本地開發（連接到 http://127.0.0.1:5000）
npm run dev

# 使用生產 API 開發（連接到 https://dialects.yzup.top）
npm run dev:web
```

在瀏覽器中訪問 `http://localhost:5173`。

### 構建與部署

```bash
# 生產構建
npm run build

# 本地預覽生產構建
npm run preview

# 部署到服務器（Bash）
npm run deploy

# 部署到服務器（PowerShell）
npm run deploy:ps
```

---

## 📁 項目結構

```
project/
├── src/
│   ├── views/                  # 頁面組件
│   │   ├── menu/               # 主應用頁面（查詢、結果、地圖、設置）
│   │   ├── explore/            # 分析工具（音韻、統計、Praat）
│   │   ├── auth/               # 認證頁面
│   │   └── intro/              # 關於/介紹頁面
│   │
│   ├── components/             # 可復用組件
│   │   ├── query/              # 查詢相關組件
│   │   ├── map/                # 地圖可視化組件
│   │   ├── result/             # 結果顯示組件
│   │   ├── praat/              # Praat 分析組件
│   │   └── TableAndTree/       # 表格和樹形組件
│   │
│   ├── api/                    # 集中式 API 模塊
│   │   ├── auth/               # 認證和令牌管理
│   │   ├── query/              # 音韻查詢
│   │   ├── praat/              # 音頻分析
│   │   ├── sql/                # 數據庫操作
│   │   ├── user/               # 用戶數據管理
│   │   └── index.js            # 中央導出中心
│   │
│   ├── utils/                  # 工具函數
│   │   ├── store.js            # 響應式狀態管理
│   │   ├── message.js          # Toast 通知和對話框
│   │   └── constants.js        # 全局配置
│   │
│   ├── router.js               # Vue Router 配置
│   └── style.css               # 全局樣式和 CSS 變量
│
├── public/                     # 靜態資源
├── vite.config.js              # Vite MPA 配置
└── package.json                # 依賴和腳本
```

**[→ 架構文檔](./docs/ARCHITECTURE.md)** 查看詳細系統設計

---

## 🏗️ 架構概覽

### 多頁應用（MPA）
項目使用 Vite 的 MPA 構建，包含 **5 個獨立入口點**：

1. **`/` (index.html)** - 根入口，重定向到 `/menu?tab=query`
2. **`/menu` (menu/index.html)** - 主應用（查詢、結果、地圖、設置）
3. **`/explore` (explore/index.html)** - 分析工具（音韻、統計、Praat）
4. **`/auth` (auth/index.html)** - 認證頁面
5. **`/intro` (intro/index.html)** - 關於/介紹頁面

### 狀態管理
無需 Vuex/Pinia 的自定義響應式存儲系統：

```javascript
import {
  globalPayload,    // 跨頁面查詢數據
  userStore,        // { role, isAuthenticated, username, id }
  mapStore,         // { mode, mapData, mergedData, loading }
  queryStore,       // { locations, regions, regionUsing }
  resultCache,      // { mode, features, latestResults }
  uiStore           // 按鈕狀態和標籤追蹤
} from '@/utils/store.js'
```

### API 架構
集中式模塊系統 - **始終從 `@/api` 導入**：

```javascript
// ✅ 正確
import { searchChars, getLocations, sqlQuery } from '@/api'

// ❌ 錯誤
import { searchChars } from '@/api/query/core.js'
```

**[→ API 文檔](./docs/API.md)** 查看完整端點參考

---

## 🎨 設計系統

### 視覺風格
- **玻璃擬態** - 帶背景模糊的液態玻璃效果
- **流暢過渡** - 所有動畫 300ms 時長
- **高對比度** - 玻璃背景上的可讀文本
- **響應式設計** - 支持桌面、平板和移動設備

### CSS 變量

```css
--primary-color: #4a90e2;
--secondary-color: #50c878;
--accent-color: #f39c12;
--text-primary: #2c3e50;
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.8);
```

**[→ 設計系統指南](./docs/DESIGN_SYSTEM.md)** 查看完整指南

---

## 📚 使用指南

### 平台導航

方音圖鑑採用多頁應用架構，主要分為以下幾個部分：

#### 主應用 (/menu)
- **查詢** - 四種查詢模式（查字、查中古、查音位、查調）
- **結果** - 查詢結果展示，支持列表和表格視圖
- **地圖** - 地理可視化，支持查詢模式、自定義模式和分區模式
- **音系** - 音系分析工具集（音系查詢、音素分類、音節統計、中古地位）
- **詞句** - 詞彙與語法資料（語保詞彙、語保語法、陽春口語詞）
- **自然村** - 自然村地理信息（廣東自然村樹狀圖、全粵村情表格、陽春自然村）
- **工具** - 數據處理工具（字表檢查、粵拼轉IPA、字表合併、聲學分析）
- **設置** - 用戶設置和帳戶管理

#### 分析工具 (/explore)
專業的音韻分析和數據處理工具，包括音韻統計、音節統計、自定義音素表、Praat 音頻分析、表格管理等。

### 開始使用
1. 訪問 [https://dialects.yzup.top](https://dialects.yzup.top)
2. 導航到 `/menu?tab=query` 進行音韻查詢
3. 選擇查詢模式（查字、查中古、查音位或查調）
4. 輸入地點和查詢參數
5. 在列表、地圖或矩陣格式中查看結果

### 核心功能詳解

#### 1. 音韻查詢系統

**查字模式：**
```
輸入：你好
地點：廣州、深圳
→ 返回「你好」在廣州和深圳的讀音
```
適用於查詢特定漢字在不同方言點的讀音、聲母、韻母、聲調等信息。

**查中古模式：**
```
選擇：幫母（聲母）+ 東韻（韻母）+ 平聲（調類）
特徵：聲母、韻母
→ 返回中古音「幫_東_平」的現代反映
```
適用於研究中古音在現代方言中的演變規律，追溯歷史音韻變化。

**查音位模式：**
```
組別：聲母組
值：p
特徵：聲母
→ 返回所有帶 [p] 聲母的字
```
適用於音位研究，查找具有特定音位特徵的所有字。

**查調模式：**
```
地點：廣州
→ 返回聲調系統（調類和調值）
```
適用於聲調系統研究，了解方言點的完整聲調體系。

#### 2. 音系分析工具

**音系查詢：**
生成完整的聲母韻母聲調對照表，直觀展示方言點的音系結構。支持漸進式渲染，即使面對 6,400+ 單元格的大型矩陣也能流暢顯示。

**音素分類：**
根據不同的特徵項（如清濁、部位、方式等）自定義查詢聲韻調，支持多維度的音素分類研究。

**音節統計：**
統計所查方言點的聲母、韻母、聲調數目，支持多地點對比分析，幫助研究者快速了解方言音系的規模和特點。

**中古地位：**
查看漢字的中古音地位信息，包括聲母、韻母、調類、韻目等，追溯歷史音韻演變。

#### 3. 詞彙與語法資料

**語保詞彙：**
語保工程 1000 詞表，涵蓋基礎詞彙，支持按方言點查詢每個詞的讀音和用法。

**語保語法：**
語保工程 50 條句子語法資料，展示不同方言的語法特點和句式結構。

**陽春口語詞：**
廣東陽春口語單字詞表，收錄當地特色口語詞彙。

#### 4. 自然村數據

**廣東自然村樹狀圖：**
以樹狀結構展示廣東省自然村的層級關係，從省、市、縣、鎮到村的完整層級。

**全粵村情表格：**
廣東省自然村的完整表格數據，支持搜索、篩選和導出。

**陽春自然村：**
廣東省陽春縣自然村的詳細信息，數據來源於縣志，包含村名、位置、人口等信息。

#### 5. 工具箱

**字表檢查：**
檢查字表的正確性和格式，識別缺失字符、重複條目、無效 IPA 符號等問題。

**粵拼轉 IPA：**
將粵語拼音（粵拼）轉換為國際音標（IPA），支持批量轉換。

**字表合併：**
合併多個字表數據，支持不同的合併策略（並集、交集、左連接等）。

**聲學分析（Praat）：**
基於 Praat 進行專業的聲學分析，包括：
- 基頻（F0）分析和聲調輪廓提取
- 共振峰（F1/F2/F3）分析和元音空間可視化
- 強度分析和音長測量
- 支持文件上傳和直接錄音
- 非阻塞 UI，後台處理並實時顯示進度

**[→ 完整用戶指南](./docs/USER_GUIDE.md)** 包含截圖和示例

---

## 👨‍💻 開發指南

### 開發工作流
1. 從 `master` 創建功能分支
2. 遵循代碼規範進行更改
3. 使用 `npm run dev` 本地測試
4. 使用 `npm run build && npm run preview` 構建和預覽
5. 使用描述性消息提交
6. 創建拉取請求

### 代碼規範
- 使用 Composition API 與 `<script setup>`
- 所有 API 調用從 `@/api` 導入
- 使用 `@/utils/store.js` 中的響應式存儲
- 遵循現有組件模式
- 為複雜邏輯添加註釋

### 發起 API 請求

```javascript
import { searchChars, showError, showSuccess } from '@/api'

try {
  const results = await searchChars({
    chars: '你好',
    locations: ['廣州', '深圳']
  })
  showSuccess('查詢成功')
} catch (error) {
  showError(error.message)
}
```

### 使用消息系統

```javascript
import { showSuccess, showError, showConfirm } from '@/utils/message.js'

// Toast 通知
showSuccess('操作成功')
showError('操作失敗')

// 確認對話框
const confirmed = await showConfirm('確定刪除嗎？', {
  title: '刪除確認',
  confirmText: '刪除',
  cancelText: '取消'
})
```

**[→ 貢獻指南](./docs/CONTRIBUTING.md)** 查看詳細指南

---

## 🚢 部署

### 構建流程

```bash
cd project
npm run build
```

輸出：`project/dist/` 目錄，包含優化後的資源

### 部署策略
- **目標服務器：** `root@47.115.57.138:/srv/myapp/statics/`
- **方法：** 基於白名單的增量同步（rsync）
- **策略：** 僅完全替換 `assets/` 目錄，其他文件如有更改則覆蓋

### 前置要求
- 已配置 SSH 密鑰（無密碼提示）
- 已安裝 rsync
- 有生產服務器訪問權限

**[→ 部署指南](./project/DEPLOY.md)** 查看詳細說明

---

## ⚡ 性能優化

### 最近優化（2026 年 2 月）

**PhonologyTable 組件：**
- **漸進式渲染** - 前 15 行即時顯示，然後每次 10 行
- **記憶化單元格數據** - 使用計算 Map 進行 O(1) 查找
- **GPU 加速** - `will-change`、`transform: translateZ(0)`
- **背景濾鏡隔離** - Android 上流暢滾動
- **結果：** 初始渲染快 50-70%，滾動流暢度提升 80-90%

**YuBaoMap 組件：**
- **Symbol Layer 遷移** - 零 DOM 元素，GPU 渲染
- **GeoJSON 格式** - 原生 MapLibre 渲染引擎
- **自動聚類** - 密集區域分組
- **結果：** 性能提升 90%+，支持 10,000+ 標記

### 通用優化
- **表格分頁** - 大數據集每頁 50 行
- **防抖搜索** - 查詢輸入 1000ms 防抖
- **KeepAlive 緩存** - 查詢頁面緩存避免重新渲染
- **懶加載路由** - 路由組件動態導入

---

## 🌐 瀏覽器支持

**支持的瀏覽器：**
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

**注意：** 需要現代瀏覽器功能（ES6+、CSS Grid、backdrop-filter）

---

## 🔧 故障排除

### 常見問題

**構建失敗：**
- 確保 Node.js >= 18
- 清除 `node_modules` 並重新安裝：`rm -rf node_modules && npm install`
- 檢查最近更改中的語法錯誤

**API 連接錯誤：**
- 檢查網絡連接
- 驗證環境中的 API 基礎 URL
- 檢查認證令牌有效性
- 嘗試 `npm run dev:web` 使用生產 API

**地圖未加載：**
- 檢查 MapLibre GL 版本兼容性
- 驗證 GeoJSON 數據格式
- 檢查瀏覽器控制台錯誤
- 確保互聯網連接以獲取地圖瓦片

**性能問題：**
- 清除瀏覽器緩存
- 檢查大數據集（使用分頁）
- 驗證漸進式渲染已啟用
- 在不同瀏覽器上測試

---

## 🤝 貢獻

我們歡迎貢獻！請：
1. Fork 倉庫
2. 創建功能分支
3. 遵循代碼規範
4. 徹底測試
5. 提交拉取請求

**[→ 貢獻指南](./docs/CONTRIBUTING.md)** 查看詳細流程

---

## 📄 許可證與致謝

**許可證：** ISC License

**項目維護者：** jengzang

**相關倉庫：**
- 前端倉庫：[https://github.com/jengzang/dialects-vue-frontend](https://github.com/jengzang/dialects-vue-frontend)
- 後端倉庫：[https://github.com/jengzang/dialects-backend](https://github.com/jengzang/dialects-backend)
- 數據預處理倉庫：[https://github.com/jengzang/dialects-build](https://github.com/jengzang/dialects-build)

**構建工具：**
- Vue 3、Vite、MapLibre GL、ECharts、wavesurfer.js
- 來自語言學研究的中文方言數據
- Praat 音頻分析集成

**致謝：**
- 中文方言研究社區
- 開源貢獻者
- 語言學數據提供者

---

## 📞 聯繫與支持

**線上演示：** [https://dialects.yzup.top](https://dialects.yzup.top)

**GitHub 倉庫：**
- 前端：[https://github.com/jengzang/dialects-vue-frontend](https://github.com/jengzang/dialects-vue-frontend)
- 後端：[https://github.com/jengzang/dialects-backend](https://github.com/jengzang/dialects-backend)
- 數據預處理：[https://github.com/jengzang/dialects-build](https://github.com/jengzang/dialects-build)

**問題反饋：** [GitHub Issues](https://github.com/jengzang/dialects-vue-frontend/issues)

**聯繫方式：**
- 電子郵件：jengzang@outlook.com
- 知乎：[https://www.zhihu.com/people/da-shu-18-11](https://www.zhihu.com/people/da-shu-18-11)

---

## 📝 更新日誌

### v1.x 时期（原生 JavaScript，2025-09 ~ 2026-01）

#### v1.0.0 (2025-09-01)
- 🎉 項目初始化
- ✨ 基於原生js的基礎查詢功能
- ✨ 登錄、鳴謝頁面

#### v1.1.0 (2025-09-02 ~ 2025-09-04)
- ✨ 新查詢界面
- 🔧 地點分區輸入重構

#### v1.2.0 (2025-12-25 ~ 2026-01-11)
- ⚡ 輸入地點分區優化
- ✨ 中古、音位查詢界面

---

### v2.x 时期（Vue 框架重構，2026-01-13 ~ 2026-01-25）

#### v2.0.0 (2026-01-13 ~ 2026-01-16) 🎯 重大更新
- 🔄 **完全遷移到 Vue 3 框架**
- ✨ 中古、音位結果顯示界面
- ✨ 底圖設置
- ✨ 地圖顯示功能
- ✨ 陽春自然村顯示

#### v2.1.0 (2026-01-16 ~ 2026-01-22)
- ✨ 表格組件（UniversalTable）
- ✨ 表格添加、編輯、刪除功能
- ✨ 自定義添加右側面板

#### v2.2.0 (2026-01-23)
- ✨ 批量編輯功能
- ✨ SimpleLayout 佈局
- ✨ 工具頁面

---

### v3.x 时期（功能擴展期，2026-01-26 ~ 至今）

#### v3.0.0 (2026-01-26 ~ 2026-01-27) 🎯 重大更新
- 🔄 **引入工具、詞句、音系等多種功能**
- ✨ 字表工具：
  - 字表檢查
  - 字表合併
  - 粵拼轉 IPA

#### v3.1.0 (2026-01-30)
- ✨ 自然村數據展示
- ✨ 中古漢字樹狀圖
- ✨ 地圖彈窗功能
- ✨ 資料來源、隱私界面

#### v3.2.0 (2026-02-01 ~ 2026-02-03)
- ✨ 語保卡片、表格模式
- ✨ 當前字表總數顯示
- ✨ 頁面可見性在線時長記錄

#### v3.3.0 (2026-02-04 ~ 2026-02-05) 🎯 音系功能
- ✨ **音系查詢功能**
- ✨ **音節統計功能**
- ✨ **音素統計功能**
- ✨ 用戶批量數據管理
- ✨ 地名彈窗

#### v3.4.0 (2026-02-06) 🎯 語保地圖
- ✨ **語保地圖**（支持 10,000+ 標記）
- ⚡ 地圖點聚類優化
- ✨ 用戶統計增加"查音系"

#### v3.5.0 (2026-02-07 ~ 2026-02-08) 🎯 Praat 音頻分析
- ✨ **Praat 前端初步**
- ✨ 語保緩存機制
- ⚡ 全局狀態管理
- ⚡ 音系音素界面參數查詢

#### v3.6.0 (2026-02-09) 🎯 Praat 功能完善
- 🔄 **API 接口統一管理**
- ✨ Praat 功能擴展：
  - 元音空間圖
  - 元音點圖
  - 手動分段支持
  - 頻譜圖
  - 石峰 T 值法
- ⚡ Check 工具性能優化

#### v3.7.0 (2026-02-10 ~ 2026-02-12) 🎯 用戶系統
- ✨ 石峰 T 值法導出 Excel
- ✨ 元音空間提示
- ✨ **排行榜功能**
- ✨ HelpIcon 組件
- ✨ 用戶與遊客對比提示

#### v3.8.0 (2026-02-14) 🎯 組件重構
- 🔄 組件架構重構（tabsConfig 抽離）
- ✨ **ExploreBar 功能**
- ✨ **每行查聲韻調功能**

#### v3.9.0 (2026-02-15 ~ 2026-02-17) 🎯 交互優化
- ⚡ 音頻預覽交互優化
- ⚡ 元音空間界面改進（開關和 toggle）
- ✨ **用戶選擇地點填入功能**
- ✨ 選擇數量顯示（sessionStorage）
- ✨ **雙向綁定完善**（彈窗刪除輸入框內容）
- 🔄 **Auth 組件重構**

#### v3.10.0 (2026-02-18)
- ✨ **分區管理頁面**

#### v3.11.0 (2026-02-19)
- 📚 **完整的中英文文檔系統**
- 📚 詳細的功能介紹和使用指南
- 📚 架構文檔、API 文檔、設計系統文檔

---

### 版本號說明

- **v1.x**: 原生 JavaScript 實現（2025-09 ~ 2026-01）
- **v2.x**: Vue 3 框架重構（2026-01-13 ~ 2026-01-25）
- **v3.x**: 功能擴展期，引入工具、詞句、音系等（2026-01-26 ~ 至今）

### 主要功能里程碑

1. **v2.0.0** - Vue 3 框架重構
2. **v3.0.0** - 工具系統（字表檢查、合併、粵拼轉IPA）
3. **v3.3.0** - 音系分析系統（音系查詢、音節統計、音素統計）
4. **v3.4.0** - 語保地圖（10,000+ 標記支持）
5. **v3.5.0** - Praat 音頻分析
6. **v3.6.0** - API 統一管理 + Praat 功能完善
7. **v3.8.0** - ExploreBar + 每行查聲韻調
8. **v3.11.0** - 完整文檔系統

---

## 📖 完整文檔

### 中文文檔
- [架構文檔](./docs/ARCHITECTURE.md)
- [API 文檔](./docs/API.md)
- [用戶指南](./docs/USER_GUIDE.md)
- [設計系統](./docs/DESIGN_SYSTEM.md)
- [貢獻指南](./docs/CONTRIBUTING.md)

### English Documentation
- [README (English)](./docs/README.en.md)
- [Architecture](./docs/ARCHITECTURE.en.md)
- [API Reference](./docs/API.en.md)
- [User Guide](./docs/USER_GUIDE.en.md)
- [Design System](./docs/DESIGN_SYSTEM.en.md)
- [Contributing](./docs/CONTRIBUTING.en.md)

---

**用心設計，為中文方言研究而生 ❤️**