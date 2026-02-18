# API 文檔

> 方音圖鑑平台的完整 API 參考

**文檔語言：** [English](./API.en.md) | 中文

---

## 基礎配置

### API 基礎 URL

```javascript
const BASE_URL = 'https://dialects.yzup.top/api'
```

### 環境模式

- **開發環境：** `http://127.0.0.1:5000` (npm run dev)
- **Web 模式：** `https://dialects.yzup.top` (npm run dev:web)
- **生產環境：** `https://dialects.yzup.top` (npm run build)

### 導入約定

始終從中央 API 樞紐導入：

```javascript
import { searchChars, getLocations, sqlQuery } from '@/api'
```

---

## 認證 API

### 登錄

```javascript
import { login } from '@/api'

const response = await login('username', 'password')
// 返回：{ token, user: { id, username, role } }
```

### 獲取當前用戶

```javascript
import { getCurrentUser } from '@/api'

const user = await getCurrentUser()
// 返回：{ id, username, role, email }
```

### 登出

```javascript
import { logout } from '@/api'

await logout()
```

---

## 查詢 API

### 按字查詢

```javascript
import { searchChars } from '@/api'

const results = await searchChars({
  chars: '你好',
  locations: ['廣州', '深圳'],
  regions: [],
  region_mode: 'full'
})
```

### 按中古音查詢

```javascript
import { searchZhongGu } from '@/api'

const results = await searchZhongGu({
  path_strings: ['幫_東_平', '端_東_平'],
  locations: ['廣州'],
  regions: [],
  features: ['聲母', '韻母'],
  region_mode: 'full'
})
```

### 按音位查詢

```javascript
import { searchYinWei } from '@/api'

const results = await searchYinWei({
  group_inputs: ['聲母組'],
  pho_values: ['p', 't', 'k'],
  locations: ['廣州'],
  regions: [],
  features: ['聲母'],
  region_mode: 'full'
})
```

### 按調查詢

```javascript
import { searchTones } from '@/api'

const results = await searchTones({
  locations: ['廣州', '深圳'],
  regions: [],
  region_mode: 'full'
})
```

---

## 音韻分析 API

### 獲取音韻矩陣

```javascript
import { getPhonologyMatrix } from '@/api'

const matrix = await getPhonologyMatrix(['廣州'])
```

### 獲取音節統計

```javascript
import { getFeatureCounts } from '@/api'

const counts = await getFeatureCounts(['廣州', '深圳'])
// 返回：{ "廣州": { initials: 19, finals: 53, tones: 9 }, ... }
```

### 獲取自定義分類矩陣

```javascript
import { getPhonologyClassificationMatrix } from '@/api'

const matrix = await getPhonologyClassificationMatrix({
  locations: ['廣州'],
  feature: '聲母',
  horizontal_column: '清濁',
  vertical_column: '部位',
  cell_row_column: '方式'
})
```

---

## Praat 音頻分析 API

### 上傳音頻

```javascript
import { uploadAudio } from '@/api'

const formData = new FormData()
formData.append('file', audioFile)
formData.append('mode', 'single')

const response = await uploadAudio(formData)
// 返回：{ job_id, filename, status }
```

### 開始分析

```javascript
import { startAnalysis } from '@/api'

const result = await startAnalysis('job_id', {
  f0_min: 75,
  f0_max: 500,
  formant_ceiling: 5500,
  time_step: 0.01
})
```

### 獲取分析狀態

```javascript
import { getAnalysisStatus } from '@/api'

const status = await getAnalysisStatus('job_id')
// 返回：{ job_id, status, progress, result }
```

---

## SQL 數據庫 API

### 執行 SQL 查詢

```javascript
import { sqlQuery } from '@/api'

const results = await sqlQuery(
  'SELECT * FROM phonology WHERE location = ?',
  ['廣州']
)
```

### 唯一值查詢

```javascript
import { distinctQuery } from '@/api'

const locations = await distinctQuery('phonology', 'location', {})
// 返回：["廣州", "深圳", "香港", "澳門"]
```

### 修改單行

```javascript
import { mutateSingleRow } from '@/api'

await mutateSingleRow('phonology', 123, {
  pronunciation: 'nei5',
  notes: '更新的讀音'
})
```

---

## 用戶數據 API

### 獲取自定義數據

```javascript
import { getCustomData } from '@/api'

const customData = await getCustomData(userId)
```

### 提交自定義表單

```javascript
import { submitCustomForm } from '@/api'

await submitCustomForm({
  location: '廣州',
  label: '我的標記',
  notes: '我的註釋'
})
```

### 編輯自定義數據

```javascript
import { editCustomData } from '@/api'

await editCustomData(id, {
  label: '更新的標籤',
  notes: '更新的註釋'
})
```

---

## 工具 API

### 檢查字表

```javascript
import { checkCharTable } from '@/api'

const report = await checkCharTable({
  chars: ['你', '好', '世', '界'],
  locations: ['廣州', '深圳']
})
// 返回：{ missing: [...], duplicates: [...], invalid: [...] }
```

### 合併表格

```javascript
import { mergeTables } from '@/api'

const merged = await mergeTables([
  { name: 'table1', data: [...] },
  { name: 'table2', data: [...] }
])
```

### 粵拼轉 IPA

```javascript
import { jyut2ipa } from '@/api'

const ipa = await jyut2ipa('nei5')
// 返回：{ jyutping: "nei5", ipa: "nei˩˧" }
```

---

## 錯誤處理

### 錯誤響應格式

```json
{
  "error": "錯誤消息",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 常見錯誤代碼

- `UNAUTHORIZED` - 需要認證
- `FORBIDDEN` - 權限不足
- `NOT_FOUND` - 資源未找到
- `VALIDATION_ERROR` - 無效的輸入數據
- `RATE_LIMIT_EXCEEDED` - 請求過多
- `SERVER_ERROR` - 內部服務器錯誤

### 錯誤處理模式

```javascript
import { searchChars, showError } from '@/api'

try {
  const results = await searchChars(payload)
  // 處理成功
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // 重定向到登錄
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    showError('請求過於頻繁，請稍後再試')
  } else {
    showError(error.message)
  }
}
```

---

## 速率限制

### 按角色限制

- **匿名用戶：** 10 請求/分鐘
- **註冊用戶：** 60 請求/分鐘
- **管理員：** 無限制

---

## 最佳實踐

1. **始終從 `@/api` 導入** - 絕不從子目錄導入
2. **使用 try-catch** - 始終將 API 調用包裝在 try-catch 塊中
3. **顯示用戶反饋** - 使用 `@/api` 中的 `showSuccess` 和 `showError`
4. **檢查認證** - 在敏感操作前使用 `ensureAuthenticated()`
5. **處理速率限制** - 為重試實現指數退避
6. **緩存響應** - 使用 `resultCache` 存儲頻繁訪問的數據
7. **驗證輸入** - 在發送到 API 前檢查 payload

---

## 完整示例：查詢流程

```javascript
import {
  searchChars,
  ensureAuthenticated,
  showSuccess,
  showError
} from '@/api'
import { globalPayload, resultCache } from '@/utils/store.js'

async function performQuery() {
  try {
    // 檢查認證
    await ensureAuthenticated()

    // 準備 payload
    const payload = {
      chars: globalPayload.value.chars,
      locations: globalPayload.value.locations,
      regions: globalPayload.value.regions,
      region_mode: globalPayload.value.region_mode
    }

    // 執行查詢
    const results = await searchChars(payload)

    // 緩存結果
    resultCache.latestResults = results
    resultCache.mode = 'chars'

    // 顯示成功
    showSuccess(`查詢成功，共 ${results.length} 條結果`)

    return results
  } catch (error) {
    showError(error.message)
    throw error
  }
}
```

---

**更多詳細信息，請參閱：**
- [架構文檔](./ARCHITECTURE.md)
- [用戶指南](./USER_GUIDE.md)
- [貢獻指南](./CONTRIBUTING.md)
- [完整英文版](./API.en.md)