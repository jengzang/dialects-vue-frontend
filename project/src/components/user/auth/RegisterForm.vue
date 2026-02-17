<template>
  <div class="register-form">
    <h3 class="form-title">
      註冊
      <button
        class="benefit-circle-btn"
        @click="$emit('showBenefits')"
        title="查看會員權益對比"
      >
        🎁
      </button>
    </h3>

    <!-- Username -->
    <FormInput
      v-model="localUsername"
      type="text"
      placeholder="用戶名"
      icon="👤"
      :error="error"
    />

    <!-- Email -->
    <FormInput
      v-model="localEmail"
      type="email"
      placeholder="郵箱"
      icon="📧"
      :error="error"
    />

    <!-- Password -->
    <FormInput
      v-model="localPassword"
      type="password"
      placeholder="密碼"
      :showPasswordToggle="true"
      :error="error"
    />

    <!-- Confirm Password -->
    <FormInput
      v-model="localConfirmPassword"
      type="password"
      placeholder="確認密碼"
      :showPasswordToggle="true"
      :error="error"
    />

    <!-- Submit Button -->
    <div class="form-row">
      <button class="btn-search" @click="handleSubmit" :disabled="loading">
        註冊
      </button>
    </div>

    <!-- Error/Success Messages -->
    <p v-if="error" class="err" v-html="error"></p>
    <p v-if="success" class="success" v-html="success"></p>

    <!-- Switch to Login -->
    <p>
      <a href="#" @click.prevent="$emit('switchToLogin')">已有帳號？登錄</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FormInput from './FormInput.vue'

defineProps({
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
  }
})

const emit = defineEmits(['submit', 'switchToLogin', 'showBenefits'])

const localUsername = ref('')
const localEmail = ref('')
const localPassword = ref('')
const localConfirmPassword = ref('')

const handleSubmit = () => {
  emit('submit', {
    username: localUsername.value,
    email: localEmail.value,
    password: localPassword.value,
    confirmPassword: localConfirmPassword.value
  })
}
</script>

<style scoped>
.register-form {
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
}

.btn-search:hover:not(:disabled) {
  background-color: #0056b3;
  transform: scale(1.04);
}

.btn-search:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
