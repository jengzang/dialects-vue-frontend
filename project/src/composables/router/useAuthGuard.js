import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { userStore } from '@/main/store/store.js'
import { showWarning } from '@/utils/ui/message.js'

export function useAuthGuard(options = {}) {
  const {
    loginPath = '/auth',
    defaultRedirect = '/',
  } = options

  const route = useRoute()
  const router = useRouter()

  // 直接绑定全局用户态，让页面只关心“能不能进”，不用重复写跳转细节。
  const isAuthenticated = computed(() => userStore.isAuthenticated)

  async function requireAuth(guardOptions = {}) {
    if (isAuthenticated.value) {
      return true
    }

    const message = guardOptions.message
    const redirect = guardOptions.redirect ?? route.fullPath ?? defaultRedirect

    if (message) {
      showWarning(message)
    }

    // 把当前 fullPath 带去登录页，登录完成后可回跳到原页面。
    await router.push({
      path: loginPath,
      query: { redirect },
    })

    return false
  }

  return {
    isAuthenticated,
    requireAuth,
  }
}
