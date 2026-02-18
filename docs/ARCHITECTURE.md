# 架構文檔

> 方音圖鑑平台的技術架構和系統設計

**文檔語言：** [English](./ARCHITECTURE.en.md) | 中文

---

## 目錄

1. [系統概覽](#系統概覽)
2. [多頁應用結構](#多頁應用結構)
3. [組件層次](#組件層次)
4. [狀態管理](#狀態管理)
5. [API 架構](#api-架構)
6. [路由系統](#路由系統)
7. [性能優化](#性能優化)

---

## 系統概覽

### 架構原則

1. **多頁應用（MPA）** - 5 個獨立入口點，更好的代碼分割
2. **功能導向組織** - 按功能分組組件
3. **集中式 API 層** - 後端通信的單一真實來源
4. **自定義狀態管理** - 無需 Vuex/Pinia 的輕量級響應式存儲
5. **漸進式增強** - 針對大數據集的性能優化

### 技術棧

**前端：**
- Vue 3.5.20（Composition API）
- Vite 7.1.3（構建工具）
- Vue Router 4（路由）

**可視化：**
- MapLibre GL 5.16（地圖）
- ECharts 5.6（圖表）
- wavesurfer.js 7.12（音頻）

**狀態與數據：**
- Vue Reactive API（狀態管理）
- opencc-js（中文轉換）
- xlsx（Excel 操作）

---

## 多頁應用結構

### 入口點

項目在 `vite.config.js` 中定義了 **5 個獨立入口點**：

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu/index.html'),
        explore: resolve(__dirname, 'explore/index.html'),
        auth: resolve(__dirname, 'auth/index.html'),
        intro: resolve(__dirname, 'intro/index.html')
      }
    }
  }
})
```

### 入口點詳情

1. **根入口 (`/`)** - 重定向到主應用
2. **Menu 入口 (`/menu`)** - 主應用界面（查詢、結果、地圖、設置）
3. **Explore 入口 (`/explore`)** - 分析和研究工具
4. **Auth 入口 (`/auth`)** - 認證頁面
5. **Intro 入口 (`/intro`)** - 信息頁面

### 動態組件加載

`MenuEntry.vue` 和 `ExploreEntry.vue` 使用基於 URL 查詢參數的動態組件加載：

```vue
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabMap = {
  query: () => import('./menu/QueryPage.vue'),
  result: () => import('./menu/ResultPage.vue'),
  map: () => import('./menu/MapPage.vue'),
  setting: () => import('./menu/SettingPage.vue')
}

const activeComponent = computed(() => {
  const tab = route.query.tab
  return tabMap[tab] || tabMap.query
})
</script>

<template>
  <component :is="activeComponent" />
</template>
```

**優勢：**
- 按標籤進行代碼分割
- 組件懶加載
- 減少初始包大小
- 更好的緩存策略

---

## 組件層次

### 目錄結構

```
src/
├── views/                      # 頁面級組件
│   ├── MenuEntry.vue           # Menu 入口（動態標籤加載）
│   ├── ExploreEntry.vue        # Explore 入口（動態標籤加載）
│   ├── menu/                   # Menu 頁面
│   └── explore/                # Explore 頁面
│
├── components/                 # 可復用組件
│   ├── query/                  # 查詢相關組件
│   ├── result/                 # 結果顯示組件
│   ├── map/                    # 地圖組件
│   ├── praat/                  # Praat 分析組件
│   └── TableAndTree/           # 表格和樹形組件
```

### 組件通信

**父子通信：**
```vue
<!-- 父組件 -->
<ChildComponent
  :prop-data="data"
  @custom-event="handleEvent"
/>

<!-- 子組件 -->
<script setup>
const props = defineProps(['propData'])
const emit = defineEmits(['customEvent'])
</script>
```

**全局狀態通信：**
```javascript
import { globalPayload, userStore } from '@/utils/store.js'

// 讀取狀態
console.log(userStore.role)

// 更新狀態
globalPayload.value = { chars: '你好', locations: ['廣州'] }
```

---

## 狀態管理

### 自定義響應式存儲系統

項目使用位於 `src/utils/store.js` 的自定義響應式存儲系統，無需 Vuex 或 Pinia。

### 存儲定義

#### 1. globalPayload
**用途：** 跨頁面查詢數據傳輸

```javascript
export const globalPayload = ref({
  chars: '',
  path_strings: [],
  group_inputs: [],
  pho_values: [],
  locations: [],
  regions: [],
  features: [],
  region_mode: 'full'
})
```

#### 2. userStore
**用途：** 用戶認證狀態

```javascript
export const userStore = reactive({
  role: 'anonymous',        // 'anonymous' | 'user' | 'admin'
  isAuthenticated: false,
  username: '',
  id: null
})
```

#### 3. mapStore
**用途：** 地圖可視化狀態

```javascript
export const mapStore = reactive({
  mode: 'query',           // 'query' | 'custom' | 'divide'
  mapData: [],
  mergedData: [],
  loading: false
})
```

#### 4. queryStore
**用途：** 查詢配置狀態

```javascript
export const queryStore = reactive({
  locations: [],
  regions: [],
  regionUsing: false
})
```

#### 5. resultCache
**用途：** 結果緩存以提高性能

```javascript
export const resultCache = reactive({
  mode: '',
  features: [],
  latestResults: []
})
```

#### 6. uiStore
**用途：** UI 狀態管理

```javascript
export const uiStore = reactive({
  activeTab: 'query',
  buttonStates: {},
  sidebarCollapsed: false
})
```

---

## API 架構

### 集中式 API 模塊系統

所有 API 函數組織在 `src/api/` 中，並通過中央樞紐（`src/api/index.js`）導出。

### API 目錄結構

```
src/api/
├── index.js                    # 中央導出樞紐
├── auth/auth.js                # 認證和令牌管理
├── query/                      # 查詢 API
│   ├── core.js                 # searchChars, searchZhongGu, searchYinWei, searchTones
│   ├── phonology.js            # getPhonologyMatrix, queryPhonology
│   ├── geo.js                  # getCoordinates
│   └── LocationAndRegion.js    # getLocations, getRegions
├── praat/                      # Praat 音頻分析 API
├── sql/                        # SQL 數據庫 API
├── user/                       # 用戶數據 API
├── tools/                      # 工具 API
└── logs/                       # 日誌 API
```

### 導入約定

**關鍵規則：** 始終從 `@/api` 導入，絕不從子目錄導入。

```javascript
// ✅ 正確
import { searchChars, getLocations, sqlQuery } from '@/api'

// ❌ 錯誤
import { searchChars } from '@/api/query/core.js'
```

**優勢：**
- 所有 API 的單一導入語句
- 易於重構 API 結構
- 整個代碼庫的一致導入模式
- 更好的 tree-shaking

---

## 路由系統

### Vue Router 配置

```javascript
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/menu?tab=query' },
    { path: '/menu', component: () => import('./views/MenuEntry.vue') },
    { path: '/explore', component: () => import('./views/ExploreEntry.vue') },
    { path: '/auth', component: () => import('./views/auth/AuthPage.vue') },
    { path: '/intro', component: () => import('./views/intro/IntroPage.vue') }
  ]
})
```

### 基於 Hash 的路由

項目使用基於 hash 的路由（`createWebHashHistory`）以兼容靜態托管：

```
https://dialects.yzup.top/#/menu?tab=query
                          ↑
                          基於 Hash 的路由
```

---

## 性能優化

### 1. 漸進式渲染

**問題：** 大型表格（6,400+ 單元格）在初始渲染時阻塞 UI 線程。

**解決方案：** 使用 `requestAnimationFrame` 分塊渲染。

```javascript
// PhonologyTable.vue
const visibleRows = ref(15)  // 立即顯示前 15 行

onMounted(() => {
  const addMoreRows = () => {
    if (visibleRows.value < totalRows.value) {
      visibleRows.value += 10  // 每次添加 10 行
      requestAnimationFrame(addMoreRows)
    }
  }
  requestAnimationFrame(addMoreRows)
})
```

**結果：** 初始渲染快 50-70%，漸進式加載不可察覺。

### 2. 記憶化單元格數據

**問題：** 重複的對象遍歷進行單元格數據查找。

**解決方案：** 計算 Map 以進行 O(1) 查找。

```javascript
const cellDataMap = computed(() => {
  const map = new Map()
  matrix.value.forEach(row => {
    const key = `${row.final}_${row.initial}_${row.tone}`
    map.set(key, row)
  })
  return map
})

const getCellData = (final, initial, tone) => {
  return cellDataMap.value.get(`${final}_${initial}_${tone}`)
}
```

### 3. GPU 加速

**問題：** 滾動時昂貴的 backdrop-filter 重新計算（Android）。

**解決方案：** 將 backdrop-filter 隔離到偽元素並強制 GPU 層。

```css
.matrix-wrapper {
  will-change: transform;
  contain: layout style;
}

.sticky-header {
  transform: translateZ(0);  /* 強制 GPU 層 */
  isolation: isolate;
}

.sticky-header::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);  /* 隔離到偽元素 */
  z-index: -1;
}
```

**結果：** Android 上滾動流暢度提升 80-90%。

### 4. Symbol Layer 渲染

**問題：** 1000+ DOM 標記導致延遲。

**解決方案：** 使用 MapLibre Symbol Layer 與 GeoJSON。

```javascript
// 轉換為 GeoJSON
const geojson = {
  type: 'FeatureCollection',
  features: mapData.map(item => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [item.lng, item.lat]
    },
    properties: {
      label: item.label,
      bgColor: item.bgColor,
      textColor: item.textColor
    }
  }))
}

// 添加 Symbol Layer
map.addLayer({
  id: 'markers',
  type: 'symbol',
  source: 'markers',
  layout: {
    'text-field': ['get', 'label'],
    'text-size': 12
  }
})
```

**結果：** 零 DOM 元素，性能提升 90%+，支持 10,000+ 標記。

---

## 構建配置

### Vite 配置

```javascript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu/index.html'),
        explore: resolve(__dirname, 'explore/index.html'),
        auth: resolve(__dirname, 'auth/index.html'),
        intro: resolve(__dirname, 'intro/index.html')
      }
    }
  }
})
```

### 構建輸出結構

```
dist/
├── index.html
├── menu/index.html
├── explore/index.html
├── auth/index.html
├── intro/index.html
└── assets/
    ├── index-[hash].js
    ├── menu-[hash].js
    ├── explore-[hash].js
    ├── vendor-[hash].js
    └── style-[hash].css
```

---

## 總結

架構設計目標：
- **可擴展性** - 易於添加新功能和頁面
- **性能** - 針對大數據集和複雜可視化進行優化
- **可維護性** - 清晰的關注點分離和一致的模式
- **開發體驗** - 簡單的約定和強大的抽象

**更多詳細信息，請參閱：**
- [API 文檔](./API.md)
- [設計系統](./DESIGN_SYSTEM.md)
- [貢獻指南](./CONTRIBUTING.md)
- [完整英文版](./ARCHITECTURE.en.md)