# 貢獻指南

> 為方音圖鑑項目做出貢獻的指南

**文檔語言:** [English](./CONTRIBUTING.en.md) | 中文

---

## 開始貢獻

### 前置要求

在貢獻之前，請確保您擁有：
- **Node.js** >= 18
- **npm** >= 9
- **Git** 已安裝並配置
- 代碼編輯器（推薦 VS Code）
- Vue 3 和 Composition API 的基礎知識

### 設置開發環境

1. **Fork 倉庫**
   ```bash
   # 在 GitHub 上點擊 "Fork" 按鈕
   ```

2. **克隆您的 fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dialects-js-frontend.git
   cd dialects-js-frontend
   ```

3. **添加上游遠程**
   ```bash
   git remote add upstream https://github.com/jengzang/dialects-js-frontend.git
   ```

4. **安裝依賴**
   ```bash
   cd project
   npm install
   ```

5. **啟動開發服務器**
   ```bash
   npm run dev
   ```

6. **驗證設置**
   - 在瀏覽器中打開 `http://localhost:5173`
   - 檢查應用程序是否正確加載

---

## 開發工作流

### 分支策略

**主要分支:**
- `master` - 生產就緒代碼

**功能分支:**
- `feature/feature-name` - 新功能
- `fix/bug-name` - 錯誤修復
- `refactor/component-name` - 代碼重構
- `docs/topic` - 文檔更新

### 創建功能分支

```bash
# 更新您的本地 master
git checkout master
git pull upstream master

# 創建功能分支
git checkout -b feature/my-new-feature

# 進行更改並提交
git add .
git commit -m "feat: add new feature"

# 推送到您的 fork
git push origin feature/my-new-feature
```

### 提交消息約定

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

**格式:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**類型:**
- `feat` - 新功能
- `fix` - 錯誤修復
- `refactor` - 代碼重構
- `style` - 代碼樣式更改（格式化等）
- `docs` - 文檔更改
- `test` - 添加或更新測試
- `chore` - 維護任務
- `perf` - 性能改進

**示例:**
```bash
feat(query): add phoneme search functionality
fix(map): resolve marker clustering issue
refactor(api): centralize API module exports
docs(readme): update installation instructions
style(components): format code with prettier
perf(table): implement progressive rendering
```

---

## 代碼規範

### Vue 3 Composition API

**始終使用 `<script setup>` 語法:**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits(['update', 'delete'])

// 響應式狀態
const count = ref(0)

// 計算屬性
const doubleCount = computed(() => count.value * 2)

// 生命週期鉤子
onMounted(() => {
  console.log('Component mounted')
})

// 方法
function handleClick() {
  emit('update', count.value)
}
</script>

<template>
  <div>{{ doubleCount }}</div>
</template>

<style scoped>
/* 組件樣式 */
</style>
```

### 命名約定

**組件:**
- PascalCase：`PhonologyTable.vue`、`NavBar.vue`
- 描述性名稱：`AudioInputPanel.vue` 而不是 `Input.vue`

**文件:**
- 組件：PascalCase
- 工具：camelCase（`store.js`、`message.js`）
- 常量：UPPER_SNAKE_CASE（`API_BASE_URL`）

**變量:**
- camelCase：`userData`、`isLoading`
- 布爾值：以 `is`、`has`、`should` 為前綴
- 數組：複數名稱（`locations`、`results`）

**函數:**
- camelCase：`fetchData()`、`handleClick()`
- 事件處理器：以 `handle` 或 `on` 為前綴
- 異步函數：使用 `async/await`

### 代碼格式化

**縮進:**
- 2 個空格（不使用製表符）
- 所有文件保持一致

**行長度:**
- 最大 100 個字符
- 邏輯地斷開長行

**引號:**
- 字符串使用單引號：`'hello'`
- 插值使用模板字面量：`` `Hello ${name}` ``

**分號:**
- 可選但保持一致
- 項目使用分號

### 導入順序

```javascript
// 1. Vue 核心
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 2. 外部庫
import { useDebounceFn } from '@vueuse/core'

// 3. 內部 API（始終從 @/api）
import { searchChars, showSuccess, showError } from '@/api'

// 4. 內部工具
import { globalPayload, userStore } from '@/utils/store.js'

// 5. 組件
import NavBar from '@/components/NavBar.vue'
import ResultList from '@/components/result/ResultList.vue'
```

### API 導入約定

**關鍵：** 始終從 `@/api` 導入，絕不從子目錄導入。

```javascript
// ✅ 正確
import { searchChars, getLocations, sqlQuery } from '@/api'

// ❌ 錯誤
import { searchChars } from '@/api/query/core.js'
import { getLocations } from '@/api/query/LocationAndRegion.js'
```

---

## 組件指南

### 組件結構

```vue
<script setup>
// 1. 導入
import { ref } from 'vue'

// 2. Props
const props = defineProps({
  // ...
})

// 3. Emits
const emit = defineEmits(['event'])

// 4. 響應式狀態
const state = ref(null)

// 5. 計算屬性
const computed = computed(() => {})

// 6. 方法
function method() {}

// 7. 生命週期鉤子
onMounted(() => {})

// 8. 監聽器
watch(state, () => {})
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped>
/* 樣式 */
</style>
```

### Props 定義

```javascript
// 好 - 帶驗證
const props = defineProps({
  data: {
    type: Array,
    required: true,
    validator: (value) => value.length > 0
  },
  mode: {
    type: String,
    default: 'list',
    validator: (value) => ['list', 'grid'].includes(value)
  }
})

// 壞 - 無驗證
const props = defineProps(['data', 'mode'])
```

### 事件命名

```javascript
// 好 - kebab-case
emit('update-data', newData)
emit('item-selected', item)

// 壞 - camelCase
emit('updateData', newData)
emit('itemSelected', item)
```

### 作用域樣式

```vue
<style scoped>
/* 使用設計系統中的 CSS 變量 */
.component {
  color: var(--text-primary);
  background: var(--glass-bg);
  padding: var(--spacing-md);
}

/* 除非必要，避免深度選擇器 */
:deep(.child-component) {
  /* 僅在需要樣式化子組件時使用 */
}
</style>
```

---

## API 指南

### 創建新的 API 函數

**位置:** `src/api/<category>/<file>.js`

**模式:**
```javascript
import { api } from '../auth/auth.js'

/**
 * 跨方言搜索字符
 * @param {Object} payload - 查詢 payload
 * @param {string} payload.chars - 要搜索的字符
 * @param {string[]} payload.locations - 地點名稱
 * @returns {Promise<Array>} 查詢結果
 */
export async function searchChars(payload) {
  return await api('/phonology', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

**從中央樞紐導出:**
```javascript
// src/api/index.js
export * from './query/core.js'
```

---

## 測試

### 手動測試清單

在提交 PR 之前，測試：

- [ ] 功能按預期工作
- [ ] 無控制台錯誤
- [ ] 在移動設備、平板、桌面上響應
- [ ] 在 Chrome、Firefox、Safari 中工作
- [ ] 鍵盤導航工作
- [ ] 加載狀態正確顯示
- [ ] 錯誤狀態優雅處理
- [ ] 無性能回歸

---

## Pull Request 流程

### 提交之前

1. **更新您的分支**
   ```bash
   git checkout master
   git pull upstream master
   git checkout feature/my-feature
   git rebase master
   ```

2. **徹底測試**
   - 運行 `npm run dev` 並手動測試
   - 檢查控制台錯誤
   - 在不同瀏覽器上測試

3. **審查您的更改**
   ```bash
   git diff master
   ```

4. **使用清晰的消息提交**
   ```bash
   git commit -m "feat(query): add phoneme search"
   ```

### 創建 Pull Request

1. **推送到您的 fork**
   ```bash
   git push origin feature/my-feature
   ```

2. **在 GitHub 上打開 PR**
   - 轉到您在 GitHub 上的 fork
   - 點擊 "New Pull Request"
   - 選擇您的功能分支
   - 填寫 PR 模板

---

## 問題指南

### 報告錯誤

**使用錯誤報告模板:**

```markdown
## 錯誤描述
清楚描述錯誤

## 重現步驟
1. 轉到 '...'
2. 點擊 '...'
3. 看到錯誤

## 預期行為
應該發生什麼

## 實際行為
實際發生了什麼

## 環境
- 瀏覽器：Chrome 120
- 操作系統：Windows 11
- 版本：1.2.0

## 截圖
（如果適用）
```

### 功能請求

**使用功能請求模板:**

```markdown
## 功能描述
清楚描述功能

## 用例
為什麼需要這個功能？

## 建議的解決方案
它應該如何工作？

## 考慮的替代方案
您考慮過的其他方法

## 附加上下文
任何其他信息
```

---

## 社區

### 行為準則

- 尊重和包容
- 歡迎新人
- 提供建設性反饋
- 專注於代碼，而不是個人
- 假設善意

### 獲取幫助

- **文檔：** 檢查 [README.md](../README.md)、[ARCHITECTURE.md](./ARCHITECTURE.md)、[API.md](./API.md)
- **問題：** 首先搜索現有問題
- **討論：** 使用 GitHub Discussions 提問
- **電子郵件：** 聯繫維護者處理敏感問題

---

## 其他資源

- [Vue 3 文檔](https://vuejs.org/)
- [Vite 文檔](https://vitejs.dev/)
- [MapLibre GL 文檔](https://maplibre.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**感謝您的貢獻！🎉**

您的貢獻幫助使中文方言研究對每個人都更加可及。

**更多詳細信息，請參閱：**
- [架構文檔](./ARCHITECTURE.md)
- [API 文檔](./API.md)
- [設計系統](./DESIGN_SYSTEM.md)
- [完整英文版](./CONTRIBUTING.en.md)
