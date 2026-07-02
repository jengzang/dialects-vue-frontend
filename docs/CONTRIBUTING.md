# 貢獻與協作指南

> 方音圖鑑前端倉庫的開發、協作、模組接入與變更邊界規範

**文檔語言:** [English](./CONTRIBUTING.en.md) | 中文

> 若中英文內容暫時不一致，以本文件與維護者最新指示為準。

---

## 1. 本文件適用範圍

本文件同時適用於兩類協作工作：

1. 修改現有功能、修復錯誤、補充測試、調整文檔。
2. 新增一個新的獨立工具模組，並按現有項目模式接入主站或 Explore 區域。

如果您只是在既有頁面上修一個功能，請優先關注「通用協作總則」與「修改現有功能時的規則」。

如果您要新增一個像 `VillagesML` 一樣有獨立入口、獨立應用結構的新模組，請務必完整閱讀「新增獨立工具模組時的規則」。

---

## 2. 先理解目前倉庫結構

本倉庫不是單一純 SPA，也不是完全彼此隔離的多個子項目。請先理解當前的實際結構：

```text
repo-root/
├── docs/                       # 文檔中心（本文件所在位置）
└── project/                    # 實際前端工程
    ├── src/main/               # 主站應用
    ├── src/VillagesML/         # VillagesML 子應用
    ├── src/api/                # API 層
    ├── src/components/         # 公共組件
    ├── src/styles/             # 公共樣式
    ├── src/i18n/               # 國際化
    ├── explore/                # Explore 獨立入口
    ├── villagesML/             # VillagesML 獨立入口
    └── vite.config.js          # 多入口構建配置
```

當前前端運行時至少包含兩條主要軸線：

- `project/src/main`：主站應用。
- `project/src/VillagesML`：VillagesML 子應用。

而 `VillagesML` 目前並非「只要改自己目錄就能完全接入」的完全解耦模組。它目前同時存在以下幾層接入方式：

- `project/vite.config.js` 中的多入口配置。
- `project/villagesML/index.html` 的獨立入口。
- `project/src/VillagesML/app/router.js` 對 `/villagesML/*` 的子應用路由接管。
- `project/src/main/router.js` 中的主站橋接與兼容層。
- `project/src/main/router/exploreRoutes.js` 的 Explore 路由。
- `project/src/main/views/explore/**` 的 Explore 入口頁。
- `project/src/main/config/BarAndTabs/**` 的導航接線。

請注意：

- `/villagesML` 這類獨立路徑本身是模組的 canonical path 設計。
- 主站橋接則只是「從主站 SPA 內部跳轉到獨立子應用」的一種實現方式，並不是獨立路徑成立的前提。

因此，對於新增新模組的協作規範，不能簡單理解成「永遠只改自己的目錄」；更合理的說法是：

- 預設只在自己的模組中開發。
- 若要完成主站接入，只允許修改一小組明確白名單的共享接線文件。
- 除白名單外，不得改動其他模組與共享層。
- 未來新模組默認應保留自己的獨立 canonical path，但不默認要求增加主站橋接層。

---

## 3. 開發環境與基本工作流

### 3.1 前置要求

請確保本地至少具備：

- `Node.js >= 18`
- `npm >= 9`
- `Git`
- 能正常運行 Vue 3 / Vite 的開發環境
- 對 Vue 3 Composition API 有基礎理解

### 3.2 本地啟動

本倉庫的實際前端工程位於 `project/`，大多數安裝、運行、檢查命令都應在該目錄下執行。

```bash
git clone https://github.com/<YOUR_USERNAME>/dialects-vue-frontend.git
cd dialects-vue-frontend/project
npm install
npm run dev
```

如果您是從 fork 倉庫協作，建議額外添加上游遠端：

```bash
git remote add upstream https://github.com/jengzang/dialects-vue-frontend.git
```

### 3.3 常用檢查命令

以下命令通常在 `project/` 目錄執行：

```bash
npm run lint
npm test
npm run build
```

建議原則：

- 文檔修改：至少檢查鏈接、路徑、命令與實際結構一致。
- 單點功能修改：至少執行與本次改動直接相關的 lint / test。
- 路由、入口、構建配置、多頁應用接線變更：建議額外執行 `npm run build`。

### 3.4 分支命名建議

建議使用清晰、可審查的分支命名：

- `feature/<topic>`：新功能或新模組
- `fix/<topic>`：錯誤修復
- `refactor/<topic>`：明確批准後的重構
- `docs/<topic>`：文檔更新

### 3.5 提交訊息約定

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```text
<type>(<scope>): <subject>
```

常用類型：

- `feat`：新功能
- `fix`：錯誤修復
- `refactor`：重構
- `docs`：文檔
- `test`：測試
- `style`：格式與樣式調整
- `chore`：維護性工作
- `perf`：性能優化

示例：

```bash
feat(phonetic-toolbox): add standalone toolbox shell
fix(spatial-map): clean up duplicate layer listeners
docs(contributing): document standalone module boundaries
```

---

## 4. 通用協作總則

以下規則適用於所有協作工作，無論您是在修現有功能，還是在新增模組。

### 4.1 最小變更原則

- 優先做最小、必要、可審查的改動。
- 不要順手重構與本次任務無關的代碼。
- 不要順手改動與本次任務無關的樣式、排版、交互或文案。
- 如果一個需求可以拆成多步，請按步驟交付，不要一次混入多個不相干改動。

### 4.2 先理解現狀，再下手修改

在修改任何文件之前，請先確認：

- 這個功能目前的實際入口在哪裡。
- 是否已經有既定實現模式可複用。
- 這個文件是否屬於共享層，還是某個具體模組的私有層。
- 該目錄結構是否近期已被重組。

不要基於歷史印象、舊路徑或舊對話結論直接修改當前代碼。

### 4.3 嚴格控制變更邊界

- 若任務沒有明確要求，不要新增功能。
- 若任務沒有明確要求，不要移除功能。
- 若任務沒有明確要求，不要改變現有頁面的業務行為。
- 若任務沒有明確要求，不要調整既有公共樣式與公共組件。
- 若您認為必須越界修改，請先與維護者確認理由與風險。

### 4.4 保護中文、emoji 與編碼安全

本項目包含大量中文文案與多語言內容。請務必注意：

- 不要隨意潤色既有中文文案。
- 不要把 literal emoji 改成 Unicode escape。
- 不要只憑終端顯示亂碼就判定源文件已壞。
- 修改含中文或 emoji 的文件後，請重新檢查文件內容是否仍為正確 UTF-8。
- 若看到疑似亂碼，先比對實際文件內容與 diff，再決定是否需要恢復。

### 4.5 任何變更都要自我 Code Review

在提交前，至少要完成以下檢查：

- 查看 `git diff`，確認沒有夾帶無關改動。
- 確認沒有不必要的樣式變化。
- 確認沒有不必要的文案改寫。
- 確認沒有誤改其他模組或共享配置。
- 確認沒有引入明顯的路由、入口、i18n 或權限回歸。

### 4.6 默認技術棧

本倉庫目前的默認前端技術棧是：

- `Vue 3`
- `Composition API`
- `JavaScript`
- `SCSS`
- `Vite`

對新代碼的默認要求：

- 優先使用 `<script setup>`。
- 優先使用 Composition API。
- 樣式優先使用 `lang="scss"` 或現有 SCSS 體系。
- 默認不要在單個新模組中私自引入 `TypeScript`。

**說明：** 當前倉庫沒有完整的 TypeScript 基礎設施作為默認前提，因此若未經維護者明確批准，不要新增 `tsconfig`、`.ts` 文件或 `lang="ts"` 作為局部試點。

---

## 5. 修改現有功能時的規則

如果您本次協作只是修改已有功能，而不是新增一個新的獨立工具模組，請遵循以下規則。

### 5.1 優先在原功能邊界內修正

- 先找到該功能的實際入口與主要組件。
- 優先在原來的模組、頁面、API 文件中做最小修復。
- 不要為了修一個現有功能，順手把同類文件全部重寫。

### 5.2 不要隨意重構成熟業務邏輯

現有業務邏輯被視為已投入使用的成熟邏輯。除非任務明確要求，否則不要：

- 抽離組件
- 引入新的 composable
- 重組目錄
- 更換頁面實現策略
- 把現有 query 狀態改成 path，或反過來

如果您認為當前實現確實有問題，請先把問題、風險與替代方案說清楚，再決定是否重構。

### 5.3 公共層默認只複用，不改動

以下共享層默認只能複用，不應直接修改：

- `project/src/components/**`
- `project/src/styles/**`
- `project/src/main/config/**`
- `project/src/main/router/**`

例外情況：

- 任務本身就是修改公共層。
- 維護者已明確允許您修改某個共享文件。
- 不改共享層就無法完成需求，且您已提前說明原因。

### 5.4 修改現有頁面時的特別提醒

- `project/src/main/views/HomePage.vue` 視為 owner-maintained 文件，未經明確要求不要修改。
- 若任務與 `VillagesML` 無關，不要碰 `project/src/VillagesML/**`。
- 若任務與主站無關，不要碰 `project/src/main/**`。
- 若任務只涉及 UI 或局部交互，不要順手改 API 層與路由層。

---

## 6. 新增獨立工具模組時的規則

本節適用於新增一個類似 `VillagesML` 的新工具模組。文中會使用 `PhoneticToolbox` 作為示例名稱，但以下規則不只適用於它。

### 6.1 什麼叫「獨立工具模組」

在本倉庫中，「獨立工具模組」通常具有以下特徵：

- 有自己獨立的前端應用結構。
- 可以有自己的 `App.vue`、`main.js`、`router.js`。
- 可能需要獨立的 HTML 入口。
- 可能同時需要在主站 Explore 裡暴露一個入口頁。
- 可能需要登錄後才能使用。

這種模組不是單純在現有主站下新增一個普通頁面，而是「獨立入口 + 主站接入」的混合模式。

默認目標模型應為：

- 模組有自己的 canonical path，例如 `/villagesML`、`/PhoneticToolbox`。
- 模組有自己的 HTML 入口與子應用 router。
- 主站可以提供 Explore 入口頁或導航入口。
- 是否再額外增加主站橋接 / legacy 兼容層，由維護者決定，不作為新模組默認要求。

### 6.2 默認目錄結構

新模組請默認遵循如下結構：

```text
project/
├── <EntryName>/index.html
├── src/<ModuleName>/
│   ├── app/
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── router.js
│   ├── workspace/
│   ├── components/
│   ├── composables/
│   ├── config/
│   └── ...
└── src/api/<ModuleName>/
```

建議命名方式：

- MPA 入口目錄：`project/PhoneticToolbox/index.html`
- 模組根目錄：`project/src/PhoneticToolbox/`
- API 目錄：`project/src/api/PhoneticToolbox/`
- canonical path：`/PhoneticToolbox`

請注意大小寫一致性。不要同時出現 `PhoneticToolbox`、`phoneticToolbox`、`phonetic-toolbox` 三種不同風格混用在不該混用的位置。

現有的 `VillagesML` 出於歷史原因，入口目錄與源碼目錄存在混合大小寫：

- `project/villagesML/index.html`
- `project/src/VillagesML/`

請把它理解為既有模組的歷史約定，而不是新模組可以隨意混用大小寫的模板。新模組應遵循 owner 指定的單一命名方案，並在入口目錄、源碼目錄、API 目錄與路由 path 中保持一致。

### 6.3 預設協作模式：先模組內開發，再最小接線

新增模組時，優先採用以下協作模式：

#### 模式 A：Owner 預先接好共享外殼（推薦）

維護者先處理以下共享接線：

- `project/vite.config.js`
- `project/src/main/router/exploreRoutes.js`
- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- `project/src/main/config/BarAndTabs/SideBarConfig.js`
- `project/src/main/views/explore/**/<ModuleName>.vue`

如需兼容層，才額外處理：

- `project/src/main/router.js`

協作者則只在以下範圍工作：

- `project/<EntryName>/index.html`
- `project/src/<ModuleName>/**`
- `project/src/api/<ModuleName>/**`
- `project/src/i18n/**` 的模組相關部分

#### 模式 B：協作者獲准完成整體接入

若維護者已明確授權協作者完成從模組到主站入口的整體接入，則允許修改以下白名單文件：

- `project/vite.config.js`
- `project/src/main/router/exploreRoutes.js`
- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- `project/src/main/config/BarAndTabs/SideBarConfig.js`
- `project/src/main/views/explore/**/<ModuleName>.vue`
- `project/src/i18n/**`
- `project/<EntryName>/index.html`

僅在以下情況下，才允許再修改：

- `project/src/main/router.js`

上述情況包括：

- 維護者明確要求增加主站橋接。
- 維護者明確要求保留或新增 legacy 兼容入口。
- 主站本身需要對該獨立模組增加額外的 query allowlist / sanitize 邏輯。

除上述白名單外，不得順手改其他共享區域。

### 6.4 Explore 接入規則

如果新模組需要出現在 Explore 區域，請遵循以下原則：

- 應新增一個 Explore 入口頁。
- Explore 入口頁只負責入口承接與外殼，不要把大段業務實現塞進 Explore 頁本身。
- Explore 頁應盡量對齊 `VillagesML` 現有模式。
- `HomePage` 是否新增入口，默認由維護者決定與修改。

這意味著：

- 協作者應預期要新增一個 `project/src/main/views/explore/**/<ModuleName>.vue` 類型的入口殼頁。
- 協作者不應默認修改 `project/src/main/views/HomePage.vue`。

### 6.5 路由與頁面身份規則

新增模組時請遵循以下原則：

- 模組應有自己的 canonical path，不要把模組身份只寄托在主站 query 上。
- 頁面身份優先使用 path route，而不是 query 表示整個頁面類型。
- query 只用於同一頁面內部狀態，除非維護者明確要求使用 query 驅動入口。
- 若從主站跳轉到獨立模組，默認優先採用顯式整頁跳轉，例如普通 `<a href>`、`window.location.href` 或統一的外部跳轉封裝。
- 主站 bridge 只作為兼容方案或 owner 指定方案，不作為新模組默認模板。
- 只有當主站確實保留橋接或 legacy 入口時，才需要同步檢查 `project/src/main/router.js` 裡與外部橋接、query 白名單相關的邏輯。

### 6.6 登錄與權限規則

若新模組需要登錄後才能使用，必須複用現有登錄與權限邏輯，不要自己複製一套：

- API 層：`project/src/api/auth/**`
- 導出入口：`project/src/api/auth/index.js`
- 路由守衛 composable：`project/src/composables/router/useAuthGuard.js`

請遵循以下原則：

- 不要自行重寫 token 管理。
- 不要自行重寫 session 驗證。
- 不要另做一套與主站不一致的登錄跳轉體驗。
- 需要回跳時，沿用現有 redirect 約定。

### 6.7 國際化規則

若新模組需要支持簡中 / 繁中 / 英文，請接入現有 `project/src/i18n/` 體系，而不是自建一套翻譯系統。

建議原則：

- 模組字串請使用清晰命名空間，例如 `phoneticToolbox.*`。
- 三種語言應同步補齊：`zh-CN`、`zh-Hant`、`en`。
- 如需新增新的 locale 文件，請同步更新各語言的 `index.js`。
- 若現有分類已足夠，也可以將模組字串收斂到合適的既有文件中，但仍應保持清晰的模組前綴。

當前 locale 入口示例：

- `project/src/i18n/locales/zh-CN/index.js`
- `project/src/i18n/locales/zh-Hant/index.js`
- `project/src/i18n/locales/en/index.js`

### 6.8 不得跨模組借用業務實現

新增模組時，請注意「可複用共享能力」與「不可直接耦合他模組業務」的區別：

- 可以複用公共組件、公共樣式、公共 auth、公共 i18n。
- 不要直接 import `project/src/VillagesML/**` 裡的業務實現來拼裝新模組。
- 不要把 `VillagesML` 的某個 workspace 組件直接當成新模組的內部實現。
- 若覺得某段能力值得沉澱成共享能力，請先和維護者確認，再考慮抽到公共層。

---

## 7. 推薦複用的公共能力

新增功能或新增模組時，請優先複用現有公共能力，而不是重新造一套。

### 7.1 強烈推薦複用

| 用途 | 建議複用 | 說明 |
| --- | --- | --- |
| 模組級導航 | `project/src/components/bar/CommonBar.vue` + `project/src/components/bar/commonBarNavigation.js` | 若新模組有多個一級頁籤，或有「主頁籤 + 子頁」結構，請優先使用這套方案。 |
| 局部頁內 tabs | `project/src/components/common/TabsContainer.vue` | 適合單頁內部的小型 tab 切換，不建議當整個獨立模組的主導航外殼。 |
| 模態框 | `project/src/components/common/AppModal.vue` | 新彈窗優先複用，不要每個模組各自寫一套 modal shell。 |
| 消息提示 / 確認框 | `project/src/utils/message.js` | 請優先使用 `showSuccess`、`showError`、`showWarning`、`showInfo`、`showConfirm`，不要直接使用 `alert` / `confirm`。 |
| 下拉選擇 | `project/src/components/selector/**` | 優先複用現有單選、多選、簡化選擇器。 |
| 登錄校驗 | `project/src/api/auth/**` + `project/src/composables/router/useAuthGuard.js` | 權限與登錄跳轉務必複用。 |

### 7.2 可以參考，但不要默認當成穩定公共基礎設施

以下目錄下的組件雖然可能具有一定複用價值，但它們更偏主站業務組件，而非穩定共享基礎件：

- `project/src/main/components/**`

對這些組件的建議是：

- 可以參考其實現方式。
- 可以在自己的模組中封裝一層本地 wrapper。
- 不要默認把它們視為跨模組穩定依賴。
- 不要在未經批准的情況下直接改動它們來適配新模組。

### 7.3 公共樣式複用原則

可以複用現有樣式體系，例如：

- `project/src/styles/global/**`
- `project/src/styles/main/**`
- `project/src/styles/villagesml/**`

但請遵守以下邊界：

- 允許複用現有 tokens、utilities、glass / loading / scrollbar 等樣式基礎。
- 不允許未經批准直接修改公共樣式文件。
- 若現有公共樣式不足，優先在自己模組內追加局部樣式，不要直接回寫公共層。

---

## 8. 明確禁止或高風險的改動

除非維護者明確要求，否則不要做以下事情：

- 修改 `project/src/main/views/HomePage.vue`
- 修改與當前任務無關的其他獨立模組目錄
- 修改 `project/src/VillagesML/**` 來支撐一個本來屬於新模組的需求
- 修改 `project/src/components/**` 以配合單一新模組
- 修改 `project/src/styles/**` 以配合單一新模組
- 在單個新模組中私自引入 TypeScript
- 直接複製 `VillagesML` 的整套業務實現再重命名成新模組
- 以「順手整理一下」為由改動路由、導航、配置或共享樣式

如果您認為某個共享改動確實必要，請先提交理由，說明：

- 為什麼不能只在模組內解決
- 風險在哪裡
- 會影響哪些現有頁面
- 如何保證回歸風險可控

---

## 9. Vue / JavaScript 代碼規範

### 9.1 組件寫法

新組件默認使用 `<script setup>`：

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit'])

const keyword = ref('')
const filteredItems = computed(() => {
  return props.items.filter(item => item.label.includes(keyword.value))
})

function handleSubmit() {
  emit('submit', keyword.value)
}

onMounted(() => {
  // init
})
</script>
```

### 9.2 命名規範

- 組件文件：PascalCase，如 `PhonologyTable.vue`
- 工具 / composable / store：camelCase，如 `message.js`、`useAuthGuard.js`
- 變量：camelCase
- 布爾值：`is*`、`has*`、`should*`
- 數組：使用複數名詞
- 事件處理函數：`handle*` 或 `on*`

### 9.3 導入規範

請保持導入順序清晰：

1. Vue 核心
2. 第三方庫
3. 內部 API
4. 內部工具與 composable
5. 本地組件

示例：

```javascript
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useDebounceFn } from '@vueuse/core'

import { getToken } from '@/api'

import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { showError } from '@/utils/message.js'

import CommonBar from '@/components/bar/CommonBar.vue'
```

### 9.4 API 導入原則

新增模組時請保持 API 層邊界清晰：

- 與模組直接相關的 API 請放入 `project/src/api/<ModuleName>/`。
- 權限與登錄相關邏輯請複用 `project/src/api/auth/`。
- 若要做 API 聚合導出，請在模組自己的 API 入口文件中完成，不要把模組私有 API 混進無關聚合文件。

---

## 10. 文檔、路由、配置與樣式的特殊提醒

### 10.1 文檔更新要求

若本次協作更改了以下內容，請同步考慮文檔是否需要更新：

- 多入口結構
- 模組接入方式
- 路由結構
- i18n 文件組織方式
- auth 使用方式
- 公共組件使用方式

### 10.2 路由與兼容性

- 若任務涉及主路由、Explore 路由、外部橋接，請先理解現有兼容策略。
- 不要假定主站與 `VillagesML` 的路由耦合方式保持不變。
- 若新增模組需要兼容歷史入口，應先與維護者確認兼容方案。

### 10.3 配置規則

- 不要把原本拆分良好的配置重新塞回單一巨型文件。
- 不要為單一模組需求污染無關配置。
- 調整配置前，請先確認該配置是否已有分目錄組織。

### 10.4 樣式與視覺邊界

- 若任務不是明確的視覺改版，請不要順手改整體視覺風格。
- 彈窗頭部、工具欄、頁面骨架等高復用 UI 模式若需調整，請先確認是否會波及全站。
- 不要把單個新模組的臨時視覺需求回寫成全局公共樣式。

---

## 11. 提交前檢查清單

在提交代碼前，請至少完成以下檢查：

### 11.1 變更範圍

- 已查看 `git diff`
- 已確認沒有夾帶無關改動
- 已確認沒有誤改其他模組
- 已確認沒有無意的 UI / 樣式 / 文案改動

### 11.2 代碼與結構

- 新代碼遵循 `Composition API + JavaScript + SCSS`
- 沒有私自引入 TypeScript
- 沒有直接耦合 `VillagesML` 私有業務實現
- 新模組路徑、API 路徑、入口命名保持一致

### 11.3 國際化與文字

- 中文內容未被意外改寫
- emoji 未被轉義或損壞
- 若啟用 i18n，三種語言已同步補齊
- 文件編碼正常，未引入亂碼

### 11.4 驗證

- 已執行與本次改動相稱的檢查命令
- 重大接線或構建改動已考慮 `npm run build`
- 文檔中的命令、路徑、文件名與實際工程一致

---

## 12. Pull Request / 交付說明建議

提交 PR 或交付變更時，建議在說明中至少回答以下問題：

1. 這次改了什麼。
2. 為什麼要這樣改。
3. 影響範圍是什麼。
4. 有沒有動共享接線文件。
5. 驗證做了哪些。
6. 是否有已知限制或後續步驟。

如果本次工作是新增獨立模組，請額外說明：

- 模組主目錄在哪裡。
- API 目錄在哪裡。
- 是否已完成 Explore 接入。
- 是否需要登錄。
- 是否已完成 i18n 接入。
- 是否需要維護者補首頁入口或其他 owner-managed 接線。

---

## 13. 給協作者的最後提醒

對這個倉庫來說，最重要的不是「多做一點」，而是「做對、做穩、做在邊界內」。

請始終記住：

- 優先理解當前結構，再下手修改。
- 優先複用已有公共能力，不要重造輪子。
- 優先在模組內解決，不要污染共享層。
- 新增模組時，預設只改自己的模組；若需接主站，只動白名單共享文件。
- `HomePage`、其他模組、公共組件、公共樣式都不是可以隨手修改的地方。

若您無法確定某個變更是否越界，請先停下來與維護者確認。
