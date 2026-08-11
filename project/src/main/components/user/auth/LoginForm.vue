<template>
  <div class="login-form">
    <h3 class="form-title">
      {{ $t('auth.login.title') }}
      <button
        class="glass-button auth-benefit-button"
        data-size="compact"
        @click="$emit('showBenefits')"
        :title="$t('auth.login.viewBenefits')"
      ><InlineIcon icon="🎁" /></button>
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
        :placeholder="$t('auth.login.email')"
        icon="📧"
        :error="error"
      />
      <FormInput
        v-model="localPassword"
        type="password"
        :placeholder="$t('auth.login.password')"
        :showPasswordToggle="true"
        :error="error"
      />
    </div>

    <!-- Username Login -->
    <div v-else>
      <FormInput
        v-model="localUsername"
        type="text"
        :placeholder="$t('auth.login.username')"
        icon="👤"
        :error="error"
      />
      <FormInput
        v-model="localPassword"
        type="password"
        :placeholder="$t('auth.login.password')"
        :showPasswordToggle="true"
        :error="error"
      />
    </div>

    <!-- Submit Button -->
    <div class="form-row">
      <button class="glass-button auth-submit-button" data-variant="primary" @click="handleSubmit" :disabled="loading">
        <span v-if="loading" class="ui-loading--inline" aria-hidden="true">↻</span>
        <span v-else>{{ $t('auth.login.button') }}</span>
      </button>
    </div>

    <!-- Error/Success Messages -->
    <p v-if="error" class="err" v-html="error"></p>
    <p v-if="success" class="success" v-html="success"></p>

    <!-- Switch to Register -->
    <p>
      <a href="#" @click.prevent="$emit('switchToRegister')">{{ $t('auth.login.noAccount') }}</a>
    </p>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from './FormInput.vue'
import TabSwitcher from './TabSwitcher.vue'

const { t } = useI18n()

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

const tabs = computed(() => [
  { label: '📧 ' + t('auth.login.modes.email'), value: 'email' },
  { label: '👤 ' + t('auth.login.modes.username'), value: 'username' }
])

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



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$success-green: var(--color-success);
$title-color: var(--text-primary);
$error-color: red;

.login-form {
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

  @media (max-aspect-ratio: 1/1) {
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

  @media (max-aspect-ratio: 1/1) {
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
