// src/main.js
// ⚠️ 必须在最开头导入环境配置
import '../env-config.js'

import { createApp } from 'vue'
import { initializeNativeDownloadLinks } from '../platform/fileExport.js'
import { getCurrentRuntimePlatform } from '../platform/runtime.js'
import { initializeNativeBackPriority } from '../platform/backRegistry.js'
import { initializeNativeAudioIntake } from '../platform/audioIntake.js'
import { buildLocalePath } from '../i18n/localeRouting.js'
import App from './App.vue'
import router from './router'
import '../styles/main-entry.scss'

// 🍎 导入全局消息系统（会自动挂载到 window）
import { showError } from '../utils/ui/message.js'

// 🌐 导入 i18n 国际化
import i18n, { loadLocaleMessages } from '../i18n'
import { initSeo } from '../seo'
import { initializeUiPreferences } from '../composables/core/uiPreferences.js'
import { initializeScrollbarHover } from '../utils/ui/scrollbarHover.js'
import { bootstrapAuthSession } from '../api/auth/auth.js'
import { initializePlatformServices } from '../platform/index.js'

// 1. 導入你的組件
import PanelManager from './components/result/PanelManager.vue'

await initializePlatformServices()
await loadLocaleMessages(i18n.global.locale.value)

bootstrapAuthSession()

// 2. 創建 Vue 應用實例
const app = createApp(App)

initializeUiPreferences()
const disposeScrollbarHover = initializeScrollbarHover()
if (import.meta.hot) import.meta.hot.dispose(disposeScrollbarHover)

// 3. 使用插件 (Router, i18n)
app.use(router)
app.use(i18n)
initSeo({ router, i18n })

// 4. ★ 註冊全局組件
// 第一個參數是你在 Template 中使用的標籤名稱 (例如 <PanelManager />)
// 第二個參數是導入的組件變數
app.component('PanelManager', PanelManager)

// 5. 掛載
const disposeNativeDownloads = getCurrentRuntimePlatform().container === 'native-webview'
  ? initializeNativeDownloadLinks({ onError: error => showError(error.message) })
  : () => {}
if (import.meta.hot) import.meta.hot.dispose(disposeNativeDownloads)
const disposeNativeBack = initializeNativeBackPriority()
if (import.meta.hot) import.meta.hot.dispose(disposeNativeBack)
app.mount('#app')

initializeNativeAudioIntake(
  router,
  () => buildLocalePath(i18n.global.locale.value, '/explore/tools/praat'),
).catch(console.error)
