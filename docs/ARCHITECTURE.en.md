# Architecture Documentation

> Detailed technical architecture of the 方音圖鑑 (Chinese Dialect Atlas) platform

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Multi-Page Application (MPA) Structure](#multi-page-application-mpa-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [State Management](#state-management)
5. [API Architecture](#api-architecture)
6. [Routing System](#routing-system)
7. [Performance Optimizations](#performance-optimizations)
8. [Build Configuration](#build-configuration)

---

## System Overview

### Architecture Principles

The platform follows these core architectural principles:

1. **Multi-Page Application (MPA)** - 5 separate entry points for better code splitting
2. **Feature-based organization** - Components grouped by functionality
3. **Centralized API layer** - Single source of truth for backend communication
4. **Custom state management** - Lightweight reactive stores without Vuex/Pinia
5. **Progressive enhancement** - Performance optimizations for large datasets

### Technology Stack

**Frontend:**
- Vue 3.5.20 (Composition API)
- Vite 7.1.3 (Build tool)
- Vue Router 4 (Routing)

**Visualization:**
- MapLibre GL 5.16 (Maps)
- ECharts 5.6 (Charts)
- wavesurfer.js 7.12 (Audio)

**State & Data:**
- Vue Reactive API (State management)
- opencc-js (Chinese conversion)
- xlsx (Excel operations)

---

## Multi-Page Application (MPA) Structure

### Entry Points

The application has **5 separate entry points** defined in `vite.config.js`:

```javascript
// vite.config.js
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

### Entry Point Details

#### 1. Root Entry (`/`)
- **File:** `index.html`
- **Purpose:** Redirect to main application
- **Behavior:** Automatically redirects to `/menu?tab=query`

#### 2. Menu Entry (`/menu`)
- **File:** `menu/index.html`
- **Purpose:** Main application interface
- **Features:**
  - Query system (4 modes)
  - Results display
  - Map visualization
  - Settings and user management
- **Dynamic Loading:** Uses `MenuEntry.vue` with tab-based component loading

#### 3. Explore Entry (`/explore`)
- **File:** `explore/index.html`
- **Purpose:** Analysis and research tools
- **Features:**
  - Phonology statistics
  - Syllable counting
  - Custom phoneme classification
  - Praat audio analysis
  - Data management tools
- **Dynamic Loading:** Uses `ExploreEntry.vue` with tab-based component loading

#### 4. Auth Entry (`/auth`)
- **File:** `auth/index.html`
- **Purpose:** Authentication pages
- **Features:**
  - Login
  - Registration
  - Password reset

#### 5. Intro Entry (`/intro`)
- **File:** `intro/index.html`
- **Purpose:** Information pages
- **Features:**
  - About the project
  - Data sources
  - Privacy policy

### Dynamic Component Loading

Both `MenuEntry.vue` and `ExploreEntry.vue` use dynamic component loading based on URL query parameters:

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

**Benefits:**
- Code splitting per tab
- Lazy loading of components
- Reduced initial bundle size
- Better caching strategy

---

## Component Hierarchy

### Directory Structure

```
src/
├── views/                      # Page-level components
│   ├── MenuEntry.vue           # Menu entry with dynamic tab loading
│   ├── ExploreEntry.vue        # Explore entry with dynamic tab loading
│   ├── menu/                   # Menu pages
│   │   ├── QueryPage.vue       # Query interface
│   │   ├── ResultPage.vue      # Results display
│   │   ├── MapPage.vue         # Map visualization
│   │   ├── SettingPage.vue     # Settings
│   │   ├── AboutPage.vue       # About
│   │   ├── SourcePage.vue      # Data sources
│   │   └── PrivacyPage.vue     # Privacy policy
│   └── explore/                # Explore pages
│       ├── PhonologyPage.vue   # Phonology statistics
│       ├── Countphos.vue       # Syllable counting
│       ├── PhonologyCustom.vue # Custom classification
│       ├── Praat.vue           # Audio analysis
│       ├── CheckTool.vue       # Character table validation
│       ├── MergeTool.vue       # Table merging
│       └── Jyut2IpaTool.vue    # Jyutping to IPA
│
├── components/                 # Reusable components
│   ├── NavBar.vue              # Top navigation
│   ├── GlobalToast.vue         # Toast notifications
│   ├── GlobalConfirm.vue       # Confirmation dialogs
│   ├── UniversalTable.vue      # Generic table component
│   │
│   ├── query/                  # Query-related components
│   │   ├── LocationAndRegionInput.vue
│   │   ├── RegionSelector.vue
│   │   ├── ZhongguSelector.vue
│   │   ├── YinweiSelector.vue
│   │   └── FloatingDice.vue
│   │
│   ├── result/                 # Result display components
│   │   ├── ResultList.vue
│   │   ├── CharsAndTones.vue
│   │   ├── DataRow.vue
│   │   ├── FeaturePopup.vue
│   │   └── ValuePopup.vue
│   │
│   ├── map/                    # Map components
│   │   ├── MapLibre.vue
│   │   ├── YuBaoMap.vue
│   │   ├── CustomTab.vue
│   │   └── DivideTab.vue
│   │
│   ├── praat/                  # Praat analysis components
│   │   ├── AudioInputPanel.vue
│   │   ├── SettingsPanel.vue
│   │   ├── JobStatusPanel.vue
│   │   ├── AnalysisResultsPanel.vue
│   │   └── AudioPreviewPanel.vue
│   │
│   └── TableAndTree/           # Table and tree components
│       ├── PhonologyTable.vue
│       └── TreeView.vue
```

### Component Communication

**Parent-Child Communication:**
```vue
<!-- Parent -->
<ChildComponent
  :prop-data="data"
  @custom-event="handleEvent"
/>

<!-- Child -->
<script setup>
const props = defineProps(['propData'])
const emit = defineEmits(['customEvent'])
</script>
```

**Global State Communication:**
```javascript
import { globalPayload, userStore } from '@/utils/store.js'

// Read state
console.log(userStore.role)

// Update state
globalPayload.value = { chars: '你好', locations: ['广州'] }
```

---

## State Management

### Custom Reactive Store System

The project uses a custom reactive store system without Vuex or Pinia, located in `src/utils/store.js`.

### Store Definitions

#### 1. globalPayload
**Purpose:** Cross-page query data transfer

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

**Usage:**
- Set in QueryPage.vue when user submits query
- Read in ResultPage.vue to display results
- Read in MapPage.vue to visualize on map

#### 2. userStore
**Purpose:** User authentication state

```javascript
export const userStore = reactive({
  role: 'anonymous',        // 'anonymous' | 'user' | 'admin'
  isAuthenticated: false,
  username: '',
  id: null
})
```

**Usage:**
- Updated on login/logout
- Checked for permission-based features
- Used to display user info in NavBar

#### 3. mapStore
**Purpose:** Map visualization state

```javascript
export const mapStore = reactive({
  mode: 'query',           // 'query' | 'custom' | 'divide'
  mapData: [],
  mergedData: [],
  loading: false
})
```

**Usage:**
- Updated when query results arrive
- Read by MapLibre.vue to render markers
- Mode determines which data source to use

#### 4. queryStore
**Purpose:** Query configuration state

```javascript
export const queryStore = reactive({
  locations: [],
  regions: [],
  regionUsing: false
})
```

**Usage:**
- Stores selected locations and regions
- Persisted across page navigation
- Used to validate query limits

#### 5. resultCache
**Purpose:** Result caching for performance

```javascript
export const resultCache = reactive({
  mode: '',
  features: [],
  latestResults: []
})
```

**Usage:**
- Caches last query results
- Avoids re-fetching on page navigation
- Cleared when new query is submitted

#### 6. uiStore
**Purpose:** UI state management

```javascript
export const uiStore = reactive({
  activeTab: 'query',
  buttonStates: {},
  sidebarCollapsed: false
})
```

**Usage:**
- Tracks active tab
- Manages button loading states
- Controls sidebar visibility

### State Persistence

Some stores are persisted to localStorage:

```javascript
// Save to localStorage
watch(userStore, (newValue) => {
  localStorage.setItem('userStore', JSON.stringify(newValue))
}, { deep: true })

// Load from localStorage
const savedUserStore = localStorage.getItem('userStore')
if (savedUserStore) {
  Object.assign(userStore, JSON.parse(savedUserStore))
}
```

---

## API Architecture

### Centralized API Module System

All API functions are organized in `src/api/` and exported through a central hub (`src/api/index.js`).

### API Directory Structure

```
src/api/
├── index.js                    # Central export hub
├── auth/
│   └── auth.js                 # Authentication & token management
├── query/
│   ├── core.js                 # searchChars, searchZhongGu, searchYinWei, searchTones
│   ├── phonology.js            # getPhonologyMatrix, queryPhonology
│   ├── geo.js                  # getCoordinates
│   └── LocationAndRegion.js    # getLocations, getRegions
├── praat/
│   ├── index.js
│   └── usePraatApi.js          # Audio analysis APIs
├── sql/
│   ├── query.js                # sqlQuery, distinctQuery
│   ├── mutate.js               # mutateSingleRow, batchMutate
│   └── tree.js                 # lazyLoadTree, loadFullTree
├── tools/
│   ├── check.js                # Character table validation
│   ├── merge.js                # Table merging
│   └── jyut2ipa.js             # Jyutping to IPA conversion
├── user/
│   ├── custom.js               # getCustomData, submitCustomForm
│   └── custom-data.js          # getAllCustomData, editCustomData
└── logs/
    └── visits.js               # getTodayVisits, getTotalVisits
```

### Central Export Hub

**File:** `src/api/index.js`

```javascript
// Authentication
export * from './auth/auth.js'

// Query APIs
export * from './query/core.js'
export * from './query/phonology.js'
export * from './query/geo.js'
export * from './query/LocationAndRegion.js'

// Praat APIs
export * from './praat/index.js'

// SQL APIs
export * from './sql/query.js'
export * from './sql/mutate.js'
export * from './sql/tree.js'

// Tool APIs
export * from './tools/check.js'
export * from './tools/merge.js'
export * from './tools/jyut2ipa.js'

// User APIs
export * from './user/custom.js'
export * from './user/custom-data.js'

// Log APIs
export * from './logs/visits.js'

// Message utilities
export * from '../utils/message.js'
```

### Import Convention

**CRITICAL RULE:** Always import from `@/api`, never from subdirectories.

```javascript
// ✅ CORRECT
import { searchChars, getLocations, sqlQuery } from '@/api'

// ❌ WRONG
import { searchChars } from '@/api/query/core.js'
```

**Benefits:**
- Single import statement for all APIs
- Easy to refactor API structure
- Consistent import pattern across codebase
- Better tree-shaking

### API Function Pattern

All API functions follow this pattern:

```javascript
import { api } from './auth.js'

export async function searchChars(payload) {
  return await api('/phonology', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

### Authentication Flow

```javascript
// src/api/auth/auth.js

// Base API function with token management
export async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshToken()
    // Retry request
    return api(endpoint, options)
  }

  return response.json()
}

// Ensure user is authenticated
export async function ensureAuthenticated() {
  if (!userStore.isAuthenticated) {
    throw new Error('请先登录')
  }
}
```

---

## Routing System

### Vue Router Configuration

**File:** `src/router.js`

```javascript
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/menu?tab=query'
    },
    {
      path: '/menu',
      component: () => import('./views/MenuEntry.vue')
    },
    {
      path: '/explore',
      component: () => import('./views/ExploreEntry.vue')
    },
    {
      path: '/auth',
      component: () => import('./views/auth/AuthPage.vue')
    },
    {
      path: '/intro',
      component: () => import('./views/intro/IntroPage.vue')
    }
  ]
})

export default router
```

### Hash-based Routing

The project uses hash-based routing (`createWebHashHistory`) for compatibility with static hosting:

```
https://dialects.yzup.top/#/menu?tab=query
                          ↑
                          Hash-based route
```

**Benefits:**
- No server configuration needed
- Works with static file hosting
- Preserves query parameters
- Browser history support

### Query Parameter Navigation

Tab switching uses query parameters instead of nested routes:

```javascript
// Navigate to different tabs
router.push({ path: '/menu', query: { tab: 'query' } })
router.push({ path: '/menu', query: { tab: 'result' } })
router.push({ path: '/menu', query: { tab: 'map' } })
```

**Benefits:**
- Simpler route configuration
- Easy to add new tabs
- Preserves other query parameters
- Better for analytics tracking

---

## Performance Optimizations

### 1. Progressive Rendering

**Problem:** Large tables (6,400+ cells) block UI thread during initial render.

**Solution:** Render in chunks using `requestAnimationFrame`.

```javascript
// PhonologyTable.vue
const visibleRows = ref(15)  // Show first 15 rows immediately

onMounted(() => {
  const addMoreRows = () => {
    if (visibleRows.value < totalRows.value) {
      visibleRows.value += 10  // Add 10 rows at a time
      requestAnimationFrame(addMoreRows)
    }
  }
  requestAnimationFrame(addMoreRows)
})
```

**Result:** 50-70% faster initial render, imperceptible progressive loading.

### 2. Memoized Cell Data

**Problem:** Repeated object traversal for cell data lookups.

**Solution:** Compute Map for O(1) lookups.

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

**Result:** Eliminates repeated traversal, ~2-3MB memory for 64,000 entries.

### 3. GPU Acceleration

**Problem:** Expensive backdrop-filter recalculation on scroll (Android).

**Solution:** Isolate backdrop-filter to pseudo-elements and force GPU layers.

```css
.matrix-wrapper {
  will-change: transform;
  contain: layout style;
}

.sticky-header {
  transform: translateZ(0);  /* Force GPU layer */
  isolation: isolate;
}

.sticky-header::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);  /* Isolated to pseudo-element */
  z-index: -1;
}

.matrix-cell {
  contain: layout style paint;  /* Layout isolation */
}
```

**Result:** 80-90% smoother scrolling on Android.

### 4. Symbol Layer Rendering

**Problem:** 1000+ DOM markers cause lag.

**Solution:** Use MapLibre Symbol Layer with GeoJSON.

```javascript
// Convert to GeoJSON
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

// Add Symbol Layer
map.addLayer({
  id: 'markers',
  type: 'symbol',
  source: 'markers',
  layout: {
    'text-field': ['get', 'label'],
    'text-size': 12
  },
  paint: {
    'text-color': ['get', 'textColor']
  }
})
```

**Result:** Zero DOM elements, 90%+ performance improvement, supports 10,000+ markers.

### 5. Debounced Search

**Problem:** Excessive API calls during typing.

**Solution:** Debounce search input.

```javascript
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn((value) => {
  performSearch(value)
}, 1000)
```

### 6. KeepAlive Caching

**Problem:** Query page re-renders on navigation.

**Solution:** Use `<keep-alive>` to cache component.

```vue
<router-view v-slot="{ Component }">
  <keep-alive include="QueryPage">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

---

## Build Configuration

### Vite Configuration

**File:** `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

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
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
```

### Build Output Structure

```
dist/
├── index.html
├── menu/
│   └── index.html
├── explore/
│   └── index.html
├── auth/
│   └── index.html
├── intro/
│   └── index.html
└── assets/
    ├── index-[hash].js
    ├── menu-[hash].js
    ├── explore-[hash].js
    ├── auth-[hash].js
    ├── intro-[hash].js
    ├── vendor-[hash].js
    └── style-[hash].css
```

### Code Splitting Strategy

1. **Entry point chunks** - One per MPA entry
2. **Vendor chunk** - Shared dependencies (Vue, Vue Router, etc.)
3. **Dynamic imports** - Lazy-loaded components
4. **CSS extraction** - Separate CSS files with hashed names

---

## Summary

The architecture is designed for:
- **Scalability** - Easy to add new features and pages
- **Performance** - Optimized for large datasets and complex visualizations
- **Maintainability** - Clear separation of concerns and consistent patterns
- **Developer Experience** - Simple conventions and powerful abstractions

For more details on specific aspects, see:
- [API Documentation](./API.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Contributing Guide](./CONTRIBUTING.md)