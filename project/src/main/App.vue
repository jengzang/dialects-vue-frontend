<!-- ✅ App.vue -->
<template>
  <!-- 🧱 動態載入 layout -->
  <component :is="layoutComponent">
    <router-view />
  </component>

  <PanelManager />

  <!-- 🍎 全局 Toast 提示 -->
  <RateLimitNotice />
  <GlobalToast />

  <!-- 🍎 全局确认对话框 -->
  <GlobalConfirm />
</template>

<script>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import IntroLayout from '../layouts/IntroLayout.vue'
import MenuLayout from '../layouts/MenuLayout.vue'
import SimpleLayout from '../layouts/SimpleLayout.vue'
import ExploreLayout from '../layouts/ExploreLayout.vue'
import GlobalToast from '../components/ToastAndHelp/GlobalToast.vue'
import GlobalConfirm from '../components/ToastAndHelp/GlobalConfirm.vue'
import RateLimitNotice from '../components/ToastAndHelp/RateLimitNotice.vue'
import PanelManager from './components/result/PanelManager.vue'
import { initOnlineTimeTracker, stopOnlineTimeTracker } from '../utils/onlineTimeTracker.js'
import { initLoginPromptTracker, stopLoginPromptTracker } from '../utils/loginPromptTracker.js'
import { getToken } from '../api/auth/auth.js'
import { stripLocaleFromPath } from '../i18n/localeRouting.js'

// // 🌉 建立 bridge 用於跨組件共享 iframe 狀態
// const nativeFrame = ref(null)
// const iframeReady = ref(false)
//
// // 💡 提供給其他組件使用的 getter
// export function getNativeBridge() {
//   return {
//     iframeReady,
//     nativeFrame
//   }
// }

export default {
  components: {
    GlobalToast,
    GlobalConfirm,
    RateLimitNotice,
    PanelManager
  },
  setup() {
    const route = useRoute()

    const layoutComponent = computed(() => {
      const normalizedPath = stripLocaleFromPath(route.path)

      // 首页使用 SimpleLayout（无 navbar）
      if (normalizedPath === '/') {
        return SimpleLayout
      }

      // intro 已不再作为现用页面入口，保留分支仅作兼容兜底
      if (normalizedPath.startsWith('/intro')) {
        return IntroLayout
      }

      // /villagesML 路由使用 SimpleLayout
      if (normalizedPath === '/villagesML' || normalizedPath.startsWith('/villagesML/')) {
        return SimpleLayout
      }

      // New canonical explore routes
      if (normalizedPath === '/explore/tools/praat') {
        return SimpleLayout
      }

      if (
        normalizedPath.startsWith('/explore/tools/') ||
        normalizedPath === '/explore/manage' ||
        normalizedPath === '/explore/yubao' ||
        normalizedPath === '/explore/char-class' ||
        normalizedPath === '/explore/yc-spoken' ||
        normalizedPath.startsWith('/explore/villages/')
      ) {
        return ExploreLayout
      }

      // Legacy /explore entry: choose layout by query.page
      if (normalizedPath === '/explore') {
        const page = route.query.page

        // Praat 页面使用 SimpleLayout（无 navbar）
        if (page === 'praat') {
          return SimpleLayout
        }

        // 其他 explore 页面使用 ExploreLayout（有 ExploreBar）
        return ExploreLayout
      }

      // 其他使用 MenuLayout（带 navbar）
      return MenuLayout
    })

    // 初始化在线时长统计
    onMounted(async () => {
      const token = getToken()
      if (token) {
        // console.log('🎯 [App.vue] 检测到用户已登录，启动在线时长统计')
        initOnlineTimeTracker()
      }
      else {
        initLoginPromptTracker()
      //   console.log('ℹ️ [App.vue] 用户未登录，不启动在线时长统计')
      }
    })

    // 组件卸载时停止统计
    onBeforeUnmount(() => {
      stopOnlineTimeTracker()
      stopLoginPromptTracker()
    })

    // // 🔁 輪詢 iframe 是否掛上 window.receiveFromVue()
    // function onIframeLoad() {
    //   console.log('📡 iframe 已加載，開始檢查 receiveFromVue...')
    //   const iframeWindow = nativeFrame.value?.contentWindow
    //   let tries = 0
    //   const interval = setInterval(() => {
    //     tries++
    //     if (iframeWindow && typeof iframeWindow.receiveFromVue === 'function') {
    //       iframeReady.value = true
    //       console.log('✅ receiveFromVue 掛載成功 🎉')
    //       clearInterval(interval)
    //     } else if (tries >= 20) {
    //       console.warn('❌ receiveFromVue 沒有出現（重試次數已滿）')
    //       clearInterval(interval)
    //     }
    //   }, 100)
    // }

    return {
      layoutComponent
    }
  }
}
</script>
