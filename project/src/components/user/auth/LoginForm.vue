<template>
  <div class="login-form">
    <h3 class="form-title">
      登錄
      <button
        class="benefit-circle-btn"
        @click="$emit('showBenefits')"
        title="查看會員權益對比"
      >
        🎁
      </button>
    </h3>

    <!-- Tab Switcher -->
    <TabSwitcher
      :tabs="tabs"
      :modelValue="loginMode"
      @update:modelValue="$emit('update:loginMode', $event)"
    />

    <!-- Email Login -->
    <div v-if="loginMode === 'email'">
      <FormInput
        v-model="localEmail"
        type="email"
        placeholder="郵箱"
        icon="📧"
        :error="error"
      />
      <FormInput
        v-model="localPassword"
        type="password"
        placeholder="密碼"
        :showPasswordToggle="true"
        :error="error"
      />
    </div>

    <!-- Username Login -->
    <div v-else>
      <FormInput
        v-model="localUsername"
        type="text"
        placeholder="用戶名"
        icon="👤"
        :error="error"
      />
      <FormInput
        v-model="localPassword"
        type="password"
        placeholder="密碼"
        :showPasswordToggle="true"
        :error="error"
      />
    </div>

    <!-- Submit Button -->
    <div class="form-row">
      <button class="btn-search" @click="handleSubmit" :disabled="loading">
        <span v-if="loading" class="login-spinner"></span>
        <span v-else>登入</span>
      </button>
    </div>

    <!-- Error/Success Messages -->
    <p v-if="error" class="err" v-html="error"></p>
    <p v-if="success" class="success" v-html="success"></p>

    <!-- Switch to Register -->
    <p>
      <a href="#" @click.prevent="$emit('switchToRegister')">沒有帳號？註冊一個</a>
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import FormInput from './FormInput.vue'
import TabSwitcher from './TabSwitcher.vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  success: {
    type: String,
    default: ''
  },
  loginMode: {
    type: String,
    default: 'email'
  }
})

const emit = defineEmits(['submit', 'switchToRegister', 'update:loginMode', 'showBenefits'])

const tabs = [
  { label: '📧 使用郵箱', value: 'email' },
  { label: '👤 使用用戶名', value: 'username' }
]

const localEmail = ref('')
const localUsername = ref('')
const localPassword = ref('')

const handleSubmit = () => {
  const credentials = {
    password: localPassword.value
  }

  if (props.loginMode === 'email') {
    credentials.email = localEmail.value
  } else {
    credentials.username = localUsername.value
  }

  emit('submit', credentials)
}

// Clear password when switching modes
watch(() => props.loginMode, () => {
  localPassword.value = ''
})
</script>

<style scoped>
.login-form {
  padding: 12px;
  text-align: center;
}

.form-title {
  font-size: 30px;
  font-weight: 700;
  color: #1c1c1e;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.form-row {
  width: 100%;
  margin: 12px 0;
  display: flex;
  justify-content: center;
}

.btn-search {
  background-color: #007aff;
  color: white;
  padding: 12px 24px;
  font-size: 17px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-search:hover:not(:disabled) {
  background-color: #0056b3;
  transform: scale(1.04);
}

.btn-search:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.err {
  color: red;
  margin-top: 10px;
  font-size: 15px;
  font-weight: bold;
}

.success {
  color: #34c759;
  margin-top: 10px;
  font-size: 15px;
  font-weight: bold;
}

.benefit-circle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  padding: 0;
  border-radius: 50%;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
}

.benefit-circle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.15);
  border-color: rgba(255, 149, 0, 0.3);
}

.benefit-circle-btn:active {
  transform: translateY(0) scale(0.96);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* Mobile responsive */
@media (max-aspect-ratio: 1/1) {
  .btn-search {
    width: 100%;
    padding: 16px;
    font-size: 18px;
  }

  .err {
    font-size: 16px;
  }
}
</style>

