<template>
  <div class="register-form">
    <h3 class="form-title">
      {{ $t('auth.register.title') }}
      <button
        class="glass-button auth-benefit-button"
        data-size="compact"
        @click="$emit('showBenefits')"
        :title="$t('auth.register.viewBenefits')"
      ><InlineIcon icon="🎁" /></button>
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
      <button class="glass-button auth-submit-button" data-variant="primary" @click="handleSubmit" :disabled="loading">
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
import InlineIcon from '@/components/common/InlineIcon.vue'
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

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$success-green: var(--color-success);
$title-color: var(--text-primary);
$error-color: red;
$mobile-aspect-ratio: 1;
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

.auth-submit-button {
  font-size: 17px;

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

.auth-benefit-button {
  width: 35px;
  height: 35px;
  min-height: 35px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  --glass-button-border-radius: var(--radius-full);
}
</style>
