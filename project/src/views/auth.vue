<template>
  <div>
    <!-- Loading State -->
    <div v-if="isInitLoading" class="init-loading-overlay">
      <div class="glass-loading-container">
        <div class="glass-spinner"></div>
        <p class="loading-text">正在同步數據...</p>
      </div>
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
import {
  api,
  getToken,
  getRefreshToken,
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
import { userStore } from '@/utils/store.js'
import { computeQueryStats } from '@/utils/userStats.js'
import { manualReport } from '@/utils/onlineTimeTracker.js'
import { WEB_BASE } from '@/env-config.js'
import { showConfirm, showSuccess } from '@/utils/message.js'

// Component imports
import LoginForm from '@/components/user/auth/LoginForm.vue'
import RegisterForm from '@/components/user/auth/RegisterForm.vue'
import ProfileOverview from '@/components/user/auth/ProfileOverview.vue'
import ModifyProfileForm from '@/components/user/auth/ModifyProfileForm.vue'
import UserBenefitsPopup from '@/components/user/UserBenefitsPopup.vue'

const router = useRouter()
const route = useRoute()

// State
const isInitLoading = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const user = ref(null)

// Login/Register state
const loginMode = ref('email') // 'email' | 'username'
const modeType = ref('username') // 'username' | 'password'
const statsExpanded = ref(false)
const showBenefits = ref(false)

// Computed - Use single 'view' parameter for all navigation
const view = computed(() => route.query.view || 'login')

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
  router.push({ query: { view: newView } })
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

const handleLogin = async (credentials) => {
  error.value = ''
  success.value = ''

  if (!validatePassword(credentials.password)) {
    error.value = '密碼不得少於 6 位'
    return
  }

  loading.value = true

  try {
    await loginUser(credentials)
    await fetchUser()
    await getUserRole()

    showSuccess('登录成功')
    success.value = '✅ 登錄成功<br>即將刷新頁面'
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (e) {
    let msg = '未知錯誤'
    if (typeof e?.message === 'string') {
      try {
        const data = JSON.parse(e.message)
        msg = data?.detail ?? e.message
      } catch {
        msg = e.message
      }
    } else if (e && typeof e === 'object' && 'detail' in e) {
      msg = e.detail
    }
    if (msg.includes('Invalid credentials')) {
      error.value = '用戶名不存在或密碼錯誤！'
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }
}

const handleRegister = async ({ username, email, password, confirmPassword }) => {
  error.value = ''
  success.value = ''

  // Validation
  if (!validateUsername(username)) {
    error.value = '用戶名長度不得少於 3 個字符或超過 50 個字符'
    return
  }

  if (!validateEmail(email)) {
    error.value = '請輸入正確的郵箱'
    return
  }

  if (!validatePassword(password)) {
    error.value = '密碼不得少於 6 位'
    return
  }

  if (!validatePasswordMatch(password, confirmPassword)) {
    error.value = '兩次輸入的密碼不一致，請重新輸入'
    return
  }

  loading.value = true

  try {
    await registerUser({ username, email, password })
    showSuccess('注册成功！请登录')
    success.value = '✅ 註冊成功，請登錄👤<br> ⏳ 一秒後將自動跳轉到登錄頁面。'

    setTimeout(() => {
      setMode('login')
      error.value = ''
      success.value = ''
    }, 1000)
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('Username already exists')) {
      error.value = '該用戶名已被佔用，請更換一個'
    } else if (msg.includes('Email already exists')) {
      error.value = '該郵箱已註冊，可直接登錄'
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }
}

const handleSaveUsername = async ({ newUsername }) => {
  error.value = ''
  success.value = ''

  if (!validateUsername(newUsername)) {
    error.value = '請輸入新的用戶名（3-50個字符）'
    return
  }

  const confirmed = await showConfirm(`確定要將用戶名修改為「${newUsername}」嗎？`, {
    title: '修改用戶名',
    confirmText: '確定修改',
    cancelText: '取消'
  })

  if (!confirmed) return

  loading.value = true

  try {
    await updateUsername(newUsername, user.value.email)
    success.value = '✅ 用戶名更新成功！<br>👤 您需重新登錄<br>⏳ 兩秒後將自動跳轉到登錄頁面。'

    setTimeout(async () => {
      setMode('profile')
      await fetchUser()
      error.value = ''
      success.value = ''
    }, 2000)
  } catch (e) {
    try {
      const errorDetails = JSON.parse(e.message)
      if (errorDetails.detail) {
        error.value = `❌ 錯誤：${errorDetails.detail}`
      } else {
        error.value = '發生未知錯誤'
      }
    } catch {
      error.value = '發生錯誤，無法解析響應'
    }
  } finally {
    loading.value = false
  }
}

const handleSavePassword = async ({ currentPassword, newPassword }) => {
  error.value = ''
  success.value = ''

  if (!currentPassword) {
    error.value = '請輸入當前密碼'
    return
  }

  if (!validatePassword(newPassword)) {
    error.value = '新密碼必須至少6個字符'
    return
  }

  const confirmed = await showConfirm('確定要修改密碼嗎？', {
    title: '修改密碼',
    confirmText: '確定修改',
    cancelText: '取消'
  })

  if (!confirmed) return

  loading.value = true

  try {
    await updatePassword({
      currentPassword,
      newPassword,
      email: user.value.email
    })
    success.value = '✅ 密碼更新成功！<br>👤 ⏳ 兩秒後將自動跳轉到個人資料頁面。'

    setTimeout(async () => {
      setMode('profile')
      await fetchUser()
      error.value = ''
      success.value = ''
    }, 2000)
  } catch (e) {
    try {
      const errorDetails = JSON.parse(e.message)
      if (errorDetails.detail) {
        error.value = `❌ 錯誤：${errorDetails.detail}`
      } else {
        error.value = '發生未知錯誤'
      }
    } catch {
      error.value = '發生錯誤，無法解析響應'
    }
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  const confirmed = await showConfirm('確定要退出登錄嗎？', {
    title: '退出確認',
    confirmText: '退出',
    cancelText: '取消'
  })

  if (!confirmed) return

  // Show loading state
  loading.value = true

  try {
    // console.log('🚪 [登出] 用户登出，先上报在线时长')
    await manualReport()

    const refreshToken = getRefreshToken()
    await logoutUser(refreshToken)

    // Clear user state
    userStore.isAuthenticated = false
    userStore.role = 'anonymous'
    userStore.id = null
    userStore.username = null
    user.value = null

    // console.log('✅ [登出] 登出完成')

    // Redirect to login page instead of reloading
    setView('login')
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchUser = async () => {
  isInitLoading.value = true
  try {
    const res = await api('/auth/me')
    userStore.id = res.id
    userStore.username = res.username
    userStore.role = res.role
    userStore.isAuthenticated = true
    user.value = res
    isInitLoading.value = false
  } catch (e) {
    userStore.isAuthenticated = false
    userStore.role = 'anonymous'
    setMode('login')
    isInitLoading.value = false
  }
}

const goToAdminPanel = () => {
  window.location.href = WEB_BASE + '/admin'
}

const goToTableManager = () => {
  router.push({ path: '/explore', query: { page: 'manage' } })
}

const goToUserData = () => {
  router.push({
    path: '/auth/data',
    query: { username: user.value.username }
  })
}

const goToUserRegions = () => {
  router.push({
    path: '/auth/regions',
    query: { username: user.value.username }
  })
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
    if (user.value) {
      setMode('profile')
    }
  }
})

watch(mode, () => {
  error.value = ''
  success.value = ''
})
</script>

<style scoped>
/* 🍎 Apple 液态玻璃风格加载动画 */

/* 初始加载遮罩 */
.init-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  z-index: 9999;
}

/* 玻璃风格加载容器 */
.glass-loading-container {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08);
  padding: 40px 60px;
  text-align: center;
  animation: glass-fade-in 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Apple 风格加载动画 */
.glass-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  margin: 0 auto 20px;
  will-change: transform;
  transform: translateZ(0);
}

.loading-text {
  color: #1c1c1e;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes glass-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 降级方案（不支持 backdrop-filter 的浏览器） */
@supports not (backdrop-filter: blur(40px)) {
  .glass-loading-container {
    background: rgba(255, 255, 255, 0.98);
  }

  .init-loading-overlay {
    background: rgba(255, 255, 255, 0.95);
  }
}
</style>

