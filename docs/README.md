# 方音圖鑑文檔中心

> 完整的項目文檔、架構說明與協作指南

**文檔語言：** [English](./README.en.md) | 中文

---

## 維護補充（2026-04）

本頁保留文檔索引功能，以下補充用於對齊當前代碼結構與閱讀順序：

- 倉庫根目錄以文檔與協作資料為主，實際前端工程位於 `project/`
- 當前前端是「主站應用 + VillagesML 子應用 + 共用基礎層」的混合結構：
  - `project/src/main`：主站應用
  - `project/src/VillagesML`：VillagesML 子應用
  - `project/src/api`、`project/src/i18n`、`project/src/layouts`、`project/src/components`、`project/src/styles`、`project/src/utils`：兩側共用的基礎設施層
- 當前入口語義建議按下面理解：
  - `/menu/*`：主站核心功能頁
  - `/explore/*`：主站工具頁與 Explore 入口頁
  - `/explore/villages/ml`：主站中的 VillagesML 入口殼頁 / gateway
  - `/villagesML/*`：VillagesML 子應用的 canonical path
  - `/menu?tab=...`、`/explore?page=...`：仍保留的 legacy 兼容入口，會在入口層轉譯到 path 路由
- 目前優先按現狀維護的文檔入口是：
  - 根目錄 [README](../README.md)
  - [架構文檔](./ARCHITECTURE.md)
  - [貢獻指南](./CONTRIBUTING.md)
  - [VillagesML 專題文檔](./VillagesML/FEATURE_OVERVIEW.md)
  - [三端構建與驗證指南](./PLATFORM_BUILD.md)
  - [部署說明](../project/DEPLOY.md)
  - [i18n 說明](../project/src/i18n/README.md)

---

## 文檔導航

### 核心文檔

#### [架構文檔](./ARCHITECTURE.md)
說明當前前端的真實運行結構與分層：
- `main` 主站與 `VillagesML` 子應用的分工
- 多入口構建模型
- path 路由、bridge 與 legacy 兼容層
- 狀態管理、API 分層與樣式入口
- 當前關鍵目錄與文件地圖

#### [API 文檔](./API.md)
整理主要 API 分層與使用方式：
- 認證 API
- 主站查詢 / 地理 / SQL / 工具 API
- Praat 音頻分析 API
- VillagesML 專屬分析 API
- 公共導出入口與模塊劃分

#### [用戶指南](./USER_GUIDE.md)
面向實際使用者的功能說明：
- 主站查詢與結果頁使用方式
- 地圖與分析工具
- Praat 音頻分析
- 數據管理工具
- Explore 與 VillagesML 的入口方式

#### [設計系統](./DESIGN_SYSTEM.md)
視覺規範與前端復用層說明：
- 全局 token 與樣式分層
- 佈局外殼與導航欄模式
- 公共組件與選擇器
- 主站與 VillagesML 的樣式邊界

#### [貢獻指南](./CONTRIBUTING.md)
協作者應優先閱讀的規範文檔：
- 通用協作邊界與代碼審查要求
- 修改現有功能時的規則
- 新增獨立工具模組時的接入規範
- 公共組件、公共樣式與 auth / i18n 的複用約定
- 提交前檢查清單與交付說明建議

#### [三端構建與驗證指南](./PLATFORM_BUILD.md)
說明 Web、iOS、Android 三端構建與腳本化驗證方式：
- `project/` 下的前端構建命令
- 倉庫根目錄 `android/`、`ios/` 原生工程位置
- `verify:platform:*` 驗證命令與平台依賴
- native dist prune / audit 與 Web-only 資源邊界

### 專題文檔

#### [VillagesML 功能總覽](./VillagesML/FEATURE_OVERVIEW.md)
面向 VillagesML 模塊的功能與 API 總覽。

#### [VillagesML 使用指南](./VillagesML/USER_GUIDE.md)
面向 VillagesML 使用者的操作說明。

---

## 多語言文檔

### 中文文檔
- [架構文檔](./ARCHITECTURE.md)
- [API 文檔](./API.md)
- [用戶指南](./USER_GUIDE.md)
- [設計系統](./DESIGN_SYSTEM.md)
- [貢獻指南](./CONTRIBUTING.md)
- [三端構建與驗證指南](./PLATFORM_BUILD.md)

### English Documentation
- [Documentation Index](./README.en.md)
- [Architecture](./ARCHITECTURE.en.md)
- [API Reference](./API.en.md)
- [User Guide](./USER_GUIDE.en.md)
- [Design System](./DESIGN_SYSTEM.en.md)
- [Contributing](./CONTRIBUTING.en.md)

---

## 快速鏈接

- [主 README](../README.md) - 項目概覽與啟動方式
- [三端構建與驗證指南](./PLATFORM_BUILD.md) - Web / iOS / Android 構建與驗證命令
- [部署指南](../project/DEPLOY.md) - 生產環境部署說明
- [i18n 說明](../project/src/i18n/README.md) - 多語系結構與維護說明
- [VillagesML 功能總覽](./VillagesML/FEATURE_OVERVIEW.md) - VillagesML 專題入口

---

## 文檔結構

```text
docs/
├── README.md
├── README.en.md
├── PLATFORM_BUILD.md
├── ARCHITECTURE.md
├── ARCHITECTURE.en.md
├── API.md
├── API.en.md
├── USER_GUIDE.md
├── USER_GUIDE.en.md
├── DESIGN_SYSTEM.md
├── DESIGN_SYSTEM.en.md
├── CONTRIBUTING.md
├── CONTRIBUTING.en.md
└── VillagesML/
    ├── FEATURE_OVERVIEW.md
    └── USER_GUIDE.md
```

---

## 使用建議

### 對於終端用戶
1. 從 [用戶指南](./USER_GUIDE.md) 開始。
2. 如果您主要使用自然村分析功能，直接閱讀 [VillagesML 使用指南](./VillagesML/USER_GUIDE.md)。
3. 遇到入口或頁面跳轉問題時，優先查看用戶指南中的最新路徑說明。

### 對於開發者
1. 先閱讀 [架構文檔](./ARCHITECTURE.md) 了解當前真實結構。
2. 再閱讀 [貢獻指南](./CONTRIBUTING.md) 確認協作邊界與接入方式。
3. 如果工作範圍在 `project/src/VillagesML`，請同步閱讀 [VillagesML 功能總覽](./VillagesML/FEATURE_OVERVIEW.md)。
4. 修改 API 或共享樣式前，請交叉查看 [API 文檔](./API.md) 與 [設計系統](./DESIGN_SYSTEM.md)。

### 對於部署與維護人員
1. 查看主 [README](../README.md) 的啟動與部署說明。
2. 閱讀 [部署指南](../project/DEPLOY.md)。
3. 如需排查入口或路由問題，優先參考 [架構文檔](./ARCHITECTURE.md) 中的多入口與 bridge 說明。

---

## 文檔更新原則

- 中文文檔作為主要維護版本，英文文檔以中文文檔為準進行同步。
- 若代碼結構發生變化，應先修正 `README / ARCHITECTURE / CONTRIBUTING`，再補 `API / USER_GUIDE / DESIGN_SYSTEM`。
- 若新增獨立模組，應至少同步更新索引頁、架構文檔與貢獻指南。

---

## 獲取幫助

- **GitHub Issues：** 提交問題報告
- **項目維護者：** 就結構、協作或接線邊界進行確認
- **線上演示：** [https://dialects.yzup.top](https://dialects.yzup.top)

---

**感謝您使用方音圖鑑。**
