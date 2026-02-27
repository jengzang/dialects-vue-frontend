<!-- ✅ App.vue -->
<template>
  <!-- 🧱 動態載入 layout -->
    <component :is="layoutComponent" />

  <PanelManager />

  <!-- 🍎 全局 Toast 提示 -->
  <GlobalToast />

  <!-- 🍎 全局确认对话框 -->
  <GlobalConfirm />
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import IntroLayout from './layouts/IntroLayout.vue'
import MenuLayout from './layouts/MenuLayout.vue'
import SimpleLayout from './layouts/SimpleLayout.vue'
import ExploreLayout from './layouts/ExploreLayout.vue'
import GlobalToast from './components/ToastAndHelp/GlobalToast.vue'
import GlobalConfirm from './components/ToastAndHelp/GlobalConfirm.vue'
import PanelManager from './components/result/PanelManager.vue'
import { initOnlineTimeTracker, stopOnlineTimeTracker } from './utils/onlineTimeTracker.js'
import { getToken, initUserByToken } from './api/auth/auth.js'

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
    PanelManager
  },
  setup() {
    const route = useRoute()

    const layoutComponent = computed(() => {
      // intro 开头的路由使用 IntroLayout
      if (route.path.startsWith('/intro')) {
        return IntroLayout
      }

      // /villagesML 路由使用 SimpleLayout
      if (route.path === '/villagesML') {
        return SimpleLayout
      }

      // /explore 路由：根据 page 参数选择 Layout
      if (route.path === '/explore') {
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
      // 🆕 统一初始化用户认证状态
      await initUserByToken()

      const token = getToken()
      if (token) {
        // console.log('🎯 [App.vue] 检测到用户已登录，启动在线时长统计')
        initOnlineTimeTracker()
      }
      // else {
      //   console.log('ℹ️ [App.vue] 用户未登录，不启动在线时长统计')
      // }
    })

    // 组件卸载时停止统计
    onBeforeUnmount(() => {
      stopOnlineTimeTracker()
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
