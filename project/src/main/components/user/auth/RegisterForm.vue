<template>
  <div class="register-form">
    <h3 class="form-title">
      {{ $t('auth.register.title') }}
      <button
        class="benefit-circle-btn"
        @click="$emit('showBenefits')"
        :title="$t('auth.register.viewBenefits')"
      >
        🎁
      </button>
    </h3>

    <!-- Username -->
    <FormInput
      v-model="localUsername"
      type="text"
      :placeholder="$t('auth.register.username')"
      icon="👤"
      :error="error"
    />

    <!-- Email -->
    <FormInput
      v-model="localEmail"
      type="email"
      :placeholder="$t('auth.register.email')"
      icon="📧"
      :error="error"
    />

    <!-- Password -->
    <FormInput
      v-model="localPassword"
      type="password"
      :placeholder="$t('auth.register.password')"
      :showPasswordToggle="true"
      :error="error"
    />

    <!-- Confirm Password -->
    <FormInput
      v-model="localConfirmPassword"
      type="password"
      :placeholder="$t('auth.register.confirmPassword')"
      :showPasswordToggle="true"
      :error="error"
    />

    <!-- Submit Button -->
    <div class="form-row">
      <button class="btn-search" @click="handleSubmit" :disabled="loading">
        {{ $t('auth.register.button') }}
      </button>
    </div>

    <!-- Error/Success Messages -->
    <p v-if="error" class="err" v-html="error"></p>
    <p v-if="success" class="success" v-html="success"></p>

    <!-- Switch to Login -->
    <p>
      <a href="#" @click.prevent="$emit('switchToLogin')">{{ $t('auth.register.hasAccount') }}</a>
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


$primary-blue: var(--color-primary);
$primary-blue-dark: #0056b3;
$success-green: #34c759;
$title-color: #1c1c1e;
$error-color: red;
$white: #fff;

$transition-fast: 0.2s;
$transition-medium: 0.3s;
$smooth-easing: cubic-bezier(0.25, 0.8, 0.25, 1);
$mobile-aspect-ratio: 1 / 1;

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-form {
  padding: 12px;
  text-align: center;
}

.form-title {
  @include flex-center;

  gap: 8px;
  margin-bottom: 16px;
  color: $title-color;
  font-size: 30px;
  font-weight: 700;
}

.form-row {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 12px 0;
}

.btn-search {
  padding: 12px 24px;
  color: $white;
  font-size: 17px;
  cursor: pointer;
  background-color: $primary-blue;
  border: none;
  border-radius: 8px;
  transition:
    background-color $transition-medium,
    transform $transition-fast;

  &:hover:not(:disabled) {
    background-color: $primary-blue-dark;
    transform: scale(1.04);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    width: 100%;
    padding: 16px;
    font-size: 18px;
  }
}

.err,
.success {
  margin-top: 10px;
  font-size: 15px;
  font-weight: bold;
}

.err {
  color: $error-color;

  @media (max-aspect-ratio: $mobile-aspect-ratio) {
    font-size: 16px;
  }
}

.success {
  color: $success-green;
}

.benefit-circle-btn {
  @include flex-center;

  width: 35px;
  height: 35px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  background-color: $white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all $transition-fast $smooth-easing;

  &:hover {
    background-color: $white;
    border-color: rgba(255, 149, 0, 0.3);
    box-shadow: 0 4px 12px rgba(255, 149, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    transform: translateY(0) scale(0.96);
  }
}

