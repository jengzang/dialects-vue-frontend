<template>
  <div>
    <!-- Loading State -->
    <div v-if="isInitLoading" class="loading-container">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ $t('auth.loading.syncData') }}</p>
    </div>

    <!-- Main Content -->
    <div v-else style="min-height: 80dvh; align-items: center; display: flex">
      <!-- Login Form -->
      <LoginForm
        v-if="mode === 'login'"
        :loading="loading"
        :error="error"
        :success="success"
        :loginMode="loginMode"
        @update:loginMode="loginMode = $event"
        @submit="handleLogin"
        @switchToRegister="setMode('register')"
        @showBenefits="showBenefitsPopup"
      />

      <!-- Register Form -->
      <RegisterForm
        v-else-if="mode === 'register'"
        :loading="loading"
        :error="error"
        :success="success"
        @submit="handleRegister"
        @switchToLogin="setMode('login')"
        @showBenefits="showBenefitsPopup"
      />

      <!-- Profile Overview -->
      <ProfileOverview
        v-else-if="mode === 'profile' && user"
        :user="user"
        :queryStats="queryStats"
        :statsExpanded="statsExpanded"
        :currentTab="currentTab"
        @goToUserData="goToUserData"
        @goToUserRegions="goToUserRegions"
        @goToModifyProfile="setMode('modifyProfile')"
        @goToSettings="goToSettings"
        @logout="logout"
        @goToAdminPanel="goToAdminPanel"
        @goToTableManager="goToTableManager"
        @toggleStats="statsExpanded = !statsExpanded"
        @switchTab="switchTab"
        @showBenefits="showBenefitsPopup"
      />

      <!-- Modify Profile Form -->
      <ModifyProfileForm
        v-else-if="mode === 'modifyProfile'"
        :user="user"
        :loading="loading"
        :error="error"
        :success="success"
        :modeType="modeType"
        @update:modeType="modeType = $event"
        @saveUsername="handleSaveUsername"
        @savePassword="handleSavePassword"
        @back="setMode('profile')"
      />
    </div>

    <!-- User Benefits Popup -->
    <UserBenefitsPopup
      :visible="showBenefits"
      @close="closeBenefitsPopup"
      @register="handleRegisterFromBenefits"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getToken,
  getRefreshToken,
  clearToken,
  initUserByToken,
  loginUser,
  registerUser,
  updateUsername,
  updatePassword,
  logoutUser,
  getUserRole,
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordMatch
} from '@/api'
import { userStore } from '@/main/store/store.js'
import { computeQueryStats } from '@/main/utils/userStats.js'
import { initOnlineTimeTracker, manualReport, stopOnlineTimeTracker } from '@/utils/user/onlineTimeTracker.js'
import { WEB_BASE } from '@/env-config.js'
import { showConfirm, showSuccess } from '@/utils/ui/message.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'

// Component imports
import LoginForm from '@/main/components/user/auth/LoginForm.vue'
import RegisterForm from '@/main/components/user/auth/RegisterForm.vue'
import ProfileOverview from '@/main/components/user/auth/ProfileOverview.vue'
import ModifyProfileForm from '@/main/components/user/auth/ModifyProfileForm.vue'
import UserBenefitsPopup from '@/main/components/user/popups/UserBenefitsPopup.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// State
const isInitLoading = ref(false)
const error = ref('')
const success = ref('')
const user = ref(null)
// 登录、注册、改名、改密码共用一套异步状态，避免页面上出现多个彼此打架的 loading 标记。
const authTask = useAsyncTask()
const loading = authTask.loading

// Login/Register state
const loginMode = ref('email') // 'email' | 'username'
const modeType = ref('username') // 'username' | 'password'
const statsExpanded = ref(false)
const showBenefits = ref(false)

// Auth 页内部视图统一由 query.view 驱动，这样刷新、回退和外部直达都能保持一致。
const { state: view, set: setAuthView } = useRouteQueryState('view', {
  defaultValue: 'login',
  parse: (value) => value || 'login',
  serialize: (value) => value,
})

// Derived states from view
const mode = computed(() => {
  const v = view.value
  if (v === 'leaderboard') return 'profile'
  if (v === 'overview') return 'profile'
  if (v === 'modify') return 'modifyProfile'
  return v // login, register, profile
})

const currentTab = computed(() => {
  const v = view.value
  if (v === 'leaderboard') return 'leaderboard'
  return 'overview'
})

const queryStats = computed(() => computeQueryStats(user.value))

// Helper function to change view via router
const setView = (newView) => {
  return setAuthView(newView)
}

// Convenience methods
const setMode = (newMode) => {
  if (newMode === 'modifyProfile') {
    setView('modify')
  } else {
    setView(newMode)
  }
}

const switchTab = (tab) => {
  setView(tab)
}

function extractErrorMessage(error, fallback = t('auth.validation.unknownError')) {
  const detail = error?.detail ?? error?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim()
  }

  if (detail && typeof detail === 'object' && typeof detail.message === 'string' && detail.message.trim()) {
    return detail.message.trim()
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}

function getSafeRedirectPath(path) {
  if (typeof path !== 'string') {
    return ''
  }

  // 只允许站内相对路径，避免登录后按 redirect 跳去外站或再次跳回 auth 自己。
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/auth')) {
    return ''
  }

  return path
}

const handleLogin = async (credentials) => {
  error.value = ''
  success.value = ''

  if (!validatePassword(credentials.password)) {
    error.value = t('auth.validation.passwordMinLength')
    return
  }

  await authTask.run(async () => {
    await loginUser(credentials)
    await fetchUser()
    await getUserRole()
    try {
      await initOnlineTimeTracker()
    } catch (trackerError) {
      console.error('Failed to start online time tracker after login', trackerError)
    }

    showSuccess(t('auth.messages.loginSuccess'))
    success.value = t('auth.messages.loginSuccessDetail')
    const redirectPath = getSafeRedirectPath(route.query.redirect)
    setTimeout(() => {
      if (redirectPath) {
        router.replace(redirectPath)
      } else {
        window.location.reload()
      }
    }, 1000)
  }, {
    rethrow: true
  }).catch((e) => {
    const msg = extractErrorMessage(e)
    if (msg.includes('Invalid credentials')) {
      error.value = t('auth.validation.loginFailed')
    } else {
      error.value = msg
    }
  })
}

const handleRegister = async ({ username, email, password, confirmPassword }) => {
  error.value = ''
  success.value = ''

  // Validation
  if (!validateUsername(username)) {
    error.value = t('auth.validation.usernameLength')
    return
  }

  if (!validateEmail(email)) {
    error.value = t('auth.validation.emailInvalid')
    return
  }

  if (!validatePassword(password)) {
    error.value = t('auth.validation.passwordMinLength')
    return
  }

  if (!validatePasswordMatch(password, confirmPassword)) {
    error.value = t('auth.validation.passwordMismatch')
    return
  }

  await authTask.run(async () => {
    await registerUser({ username, email, password })
    showSuccess(t('auth.messages.registerSuccess'))
    success.value = t('auth.messages.registerSuccessDetail')

    setTimeout(() => {
      setMode('login')
      error.value = ''
      success.value = ''
    }, 1000)
  }, {
    rethrow: true
  }).catch((e) => {
    const msg = extractErrorMessage(e, '')
    if (msg.includes('Username already exists')) {
      error.value = t('auth.validation.usernameExists')
    } else if (msg.includes('Email already exists')) {
      error.value = t('auth.validation.emailExists')
    } else {
      error.value = msg
    }
  })
}

const handleSaveUsername = async ({ newUsername }) => {
  error.value = ''
  success.value = ''

  if (!validateUsername(newUsername)) {
    error.value = t('auth.confirm.modifyUsername.prompt')
    return
  }

  const confirmed = await showConfirm(t('auth.confirm.modifyUsername.message', { username: newUsername }), {
    title: t('auth.confirm.modifyUsername.title'),
    confirmText: t('auth.confirm.modifyUsername.confirm'),
    cancelText: t('auth.confirm.modifyUsername.cancel')
  })

  if (!confirmed) return

  await authTask.run(async () => {
    await updateUsername(newUsername, user.value.email)
    clearToken()
    user.value = null
    success.value = t('auth.messages.usernameUpdateSuccess')

    setTimeout(() => {
      setMode('login')
      error.value = ''
      success.value = ''
    }, 2000)
  }, {
    rethrow: true
  }).catch((e) => {
    const message = extractErrorMessage(e)
    error.value = t('auth.messages.errorDetail', { detail: message })
  })
}

const handleSavePassword = async ({ currentPassword, newPassword, confirmNewPassword }) => {
  error.value = ''
  success.value = ''

  if (!currentPassword) {
    error.value = t('auth.confirm.modifyPassword.promptCurrent')
    return
  }

  if (!validatePassword(newPassword)) {
    error.value = t('auth.confirm.modifyPassword.promptNew')
    return
  }

  if (newPassword !== confirmNewPassword) {
    error.value = t('auth.confirm.modifyPassword.promptMismatch')
    return
  }

  const confirmed = await showConfirm(t('auth.confirm.modifyPassword.message'), {
    title: t('auth.confirm.modifyPassword.title'),
    confirmText: t('auth.confirm.modifyPassword.confirm'),
    cancelText: t('auth.confirm.modifyPassword.cancel')
  })

  if (!confirmed) return

  await authTask.run(async () => {
    await updatePassword({
      currentPassword,
      newPassword,
      email: user.value.email
    })
    clearToken()
    user.value = null
    success.value = t('auth.messages.passwordUpdateSuccess')

    setTimeout(() => {
      setMode('login')
      error.value = ''
      success.value = ''
    }, 2000)
  }, {
    rethrow: true
  }).catch((e) => {
    const message = extractErrorMessage(e)
    error.value = t('auth.messages.errorDetail', { detail: message })
  })
}

const logout = async () => {
  const confirmed = await showConfirm(t('auth.confirm.logout.message'), {
    title: t('auth.confirm.logout.title'),
    confirmText: t('auth.confirm.logout.confirm'),
    cancelText: t('auth.confirm.logout.cancel')
  })

  if (!confirmed) return

  await authTask.run(async () => {
    // console.log('🚪 [退出] 用户退出，先上报在线时长')
    await manualReport()
    stopOnlineTimeTracker({ clearPending: true })

    const refreshToken = getRefreshToken()
    await logoutUser(refreshToken)

    user.value = null

    // console.log('✅ [退出] 退出完成')

    // Redirect to login page instead of reloading
    setView('login')
  }, {
    rethrow: true
  }).catch((error) => {
    console.error(t('auth.messages.logoutFailed'), error)
  })
}

const fetchUser = async () => {
  isInitLoading.value = true
  try {
    const { user: userData } = await initUserByToken({ forceRefresh: true })
    const fallbackUser = userStore.isAuthenticated
      ? {
          id: userStore.id,
          username: userStore.username,
          role: userStore.role
        }
      : null

    if (userStore.isAuthenticated) {
      user.value = userData || fallbackUser
    } else {
      user.value = null
      setMode('login')
    }
  } catch {
    if (!userStore.isAuthenticated) {
      user.value = null
      setMode('login')
    }
  } finally {
    isInitLoading.value = false
  }
}

const goToAdminPanel = () => {
  window.location.href = WEB_BASE + '/admin'
}

const goToTableManager = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/manage'))
}

const goToUserData = () => {
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/auth/data'),
    query: { username: user.value.username }
  })
}

const goToUserRegions = () => {
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/auth/regions'),
    query: { username: user.value.username }
  })
}

const goToSettings = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/about/settings'))
}

const showBenefitsPopup = () => {
  showBenefits.value = true
}

const closeBenefitsPopup = () => {
  showBenefits.value = false
}

const handleRegisterFromBenefits = () => {
  setMode('register')
  showBenefits.value = false
}

// Lifecycle
onMounted(async () => {
  if (getToken()) {
    await fetchUser()
    if (userStore.isAuthenticated) {
      setMode('profile')
    }
  }
})

watch(mode, () => {
  error.value = ''
  success.value = ''
})
</script>

<style scoped lang="scss">
/* Loading State - 与排行榜保持一致的样式 */
.loading-container {
  text-align: center;
  padding: 40px 20px;
}

</style>
