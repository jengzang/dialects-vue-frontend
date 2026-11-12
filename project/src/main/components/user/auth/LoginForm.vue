<template>
  <div class="login-form">
    <h3 class="form-title">
      {{ $t(recoveryOpen ? 'auth.reset.title' : 'auth.login.title') }}
      <button
        :class="[recoveryOpen ? 'action-btn' : 'glass-button', 'auth-benefit-button']"
        data-size="compact"
        @click="$emit('showBenefits')"
        :title="$t('auth.login.viewBenefits')"
      ><InlineIcon icon="🎁" /></button>
    </h3>

    <template v-if="!recoveryOpen">
    <!-- Tab Switcher -->
    <TabSwitcher
      mode="segmented"
      navigation-only
      :use-router="false"
      :aria-label="$t('auth.login.title')"
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
    <div class="auth-navigation">
      <button type="button" class="pill-btn pill-btn--success pill-btn--blur" @click="$emit('switchToRegister')">{{ $t('auth.login.noAccount') }}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
      </button>
      <button type="button" class="pill-btn pill-btn--error pill-btn--blur" data-forgot-password @click="openRecovery">{{ $t('auth.reset.entry') }}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
      </button>
    </div>
    </template>

    <template v-else>
      <template v-if="!recoveryRequest">
        <FormInput v-model="recoveryEmail" data-reset-email type="email" :placeholder="$t('auth.login.email')" />
        <FormInput v-model="recoveryPassword" data-reset-password type="password" :placeholder="$t('auth.reset.newPassword')" :show-password-toggle="true" />
        <FormInput v-model="recoveryConfirm" data-reset-confirm type="password" :placeholder="$t('auth.register.confirmPassword')" :show-password-toggle="true" />
        <div class="form-row">
          <button type="button" class="action-btn auth-submit-button" data-variant="primary" data-reset-submit :disabled="recoveryLoading" @click="submitRecovery">
            {{ $t(recoveryLoading ? 'auth.reset.submitting' : 'auth.reset.submit') }}
          </button>
        </div>
      </template>
      <template v-else>
        <p>{{ $t('auth.reset.instructions', { minutes: Math.floor(recoveryRequest.expires_in / 60) }) }}</p>
        <div class="reset-step" data-reset-step="recipient" :class="{ completed: recoveryCopied.recipient }">
          <div class="reset-step-row">
            <p><span class="reset-step-number">①</span> {{ $t('auth.reset.recipient') }} <span class="reset-important">{{ recoveryRequest.recipient }}</span></p>
            <button type="button" class="action-btn" data-reset-copy-recipient @click="copyRecovery(recoveryRequest.recipient, 'recipient')">{{ $t('auth.reset.copyRecipient') }}</button>
          </div>
        </div>
        <div class="reset-step" data-reset-step="subject" :class="{ completed: recoveryCopied.subject }">
          <div class="reset-step-row">
            <p><span class="reset-step-number">②</span> {{ $t('auth.reset.subject') }} <span class="reset-important">RESET-REQUEST</span></p>
            <button type="button" class="action-btn" data-reset-copy-subject @click="copyRecovery('RESET-REQUEST', 'subject')">{{ $t('auth.reset.copySubject') }}</button>
          </div>
          <p class="reset-important">{{ $t('auth.reset.subjectRequired') }}</p>
        </div>
        <div class="reset-step" data-reset-step="body" :class="{ completed: recoveryCopied.body }">
          <div class="reset-step-row">
            <p><span class="reset-step-number">③</span> {{ $t('auth.reset.mailBody') }}</p>
            <button type="button" class="action-btn" data-reset-copy @click="copyRecovery(recoveryMailBody, 'body')">{{ $t('auth.reset.copyBody') }}</button>
          </div>
          <textarea class="glass-field reset-mail-body reset-important" :value="recoveryMailBody" readonly rows="3" :aria-label="$t('auth.reset.mailBody')" @focus="$event.target.select()"></textarea>
        </div>
        <div class="form-row reset-actions">
          <a class="action-btn" data-reset-mailto :href="recoveryMailto">{{ $t('auth.reset.openMail') }}</a>
        </div>
        <p v-if="recoveryCopyKey" role="status">{{ $t(recoveryCopyKey) }}</p>
      </template>
      <p v-if="recoveryErrorKey" class="err" role="alert">{{ $t(recoveryErrorKey) }}</p>
      <p>{{ $t('auth.reset.appeal') }} <span class="reset-important">2639548777</span></p>
      <p class="form-row">
        <button type="button" class="pill-btn pill-btn--blur" data-reset-back :disabled="recoveryLoading" @click="closeRecovery">{{ $t('auth.reset.back') }}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
        </button>
      </p>
    </template>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from './FormInput.vue'
import TabSwitcher from '@/components/common/TabSwitcher.vue'
import { showConfirm, showSuccess } from '@/utils/ui/message.js'
import { createPasswordResetRequest } from '@/api/auth/actions.js'

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
  { label: '📧 ' + t('auth.login.modes.email'), name: 'email' },
  { label: '👤 ' + t('auth.login.modes.username'), name: 'username' }
])

const localEmail = ref('')
const localUsername = ref('')
const localPassword = ref('')
const recoveryOpen = ref(false)
const recoveryEmail = ref('')
const recoveryPassword = ref('')
const recoveryConfirm = ref('')
const recoveryLoading = ref(false)
const recoveryRequest = ref(null)
const recoveryErrorKey = ref('')
const recoveryCopyKey = ref('')
const recoveryCopied = ref({})
const recoveryMailBody = computed(() => recoveryRequest.value ? `RESET-REQUEST: ${recoveryRequest.value.request_id}` : '')
const recoveryMailto = computed(() => recoveryRequest.value
  ? `mailto:${encodeURIComponent(recoveryRequest.value.recipient)}?subject=RESET-REQUEST&body=${encodeURIComponent(recoveryMailBody.value)}`
  : '')

async function openRecovery() {
  if (await showConfirm(t('auth.reset.explanation'), { title: t('auth.reset.title') })) {
    recoveryEmail.value = localEmail.value
    localPassword.value = ''
    recoveryOpen.value = true
  }
}

function closeRecovery() {
  recoveryOpen.value = false
  recoveryPassword.value = ''
  recoveryConfirm.value = ''
  recoveryRequest.value = null
  recoveryErrorKey.value = ''
  recoveryCopyKey.value = ''
  recoveryCopied.value = {}
}

async function submitRecovery() {
  if (recoveryLoading.value) return
  recoveryErrorKey.value = ''
  const email = recoveryEmail.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    recoveryErrorKey.value = 'auth.reset.errors.email'
    return
  }
  if (recoveryPassword.value.length < 6 || new TextEncoder().encode(recoveryPassword.value).length > 72) {
    recoveryErrorKey.value = 'auth.reset.errors.password'
    return
  }
  if (recoveryPassword.value !== recoveryConfirm.value) {
    recoveryErrorKey.value = 'auth.reset.errors.mismatch'
    return
  }
  recoveryLoading.value = true
  try {
    recoveryRequest.value = await createPasswordResetRequest({ email, newPassword: recoveryPassword.value })
    recoveryPassword.value = ''
    recoveryConfirm.value = ''
  } catch (error) {
    const codes = {
      password_reset_unavailable: 'unavailable',
      password_reset_rate_limited: 'rateLimited',
      password_reset_invalid_password: 'password'
    }
    recoveryErrorKey.value = `auth.reset.errors.${codes[error.detail?.code] || 'failed'}`
  } finally {
    recoveryLoading.value = false
  }
}

async function copyRecovery(value, step) {
  try {
    await navigator.clipboard.writeText(value)
    recoveryCopyKey.value = ''
    recoveryCopied.value[step] = true
    showSuccess(t('auth.reset.copied'))
  } catch {
    recoveryCopyKey.value = 'auth.reset.copyFailed'
  }
}

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
  min-width: 300px;
  text-align: center;
}

.form-title {
  @include flex-center;

  gap: 8px;
  margin-bottom: 16px;
  color: $title-color;
  font-size: var(--font-size-32);
  font-weight: 700;
}

.form-row {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 12px 0;
}

.reset-important {
  color: var(--color-primary);
}

.auth-navigation {
  @include flex-center;
  flex-wrap: nowrap;
  gap: 8px;
  margin: 16px 0;

  .pill-btn {
    flex-shrink: 0;
  }
}

.reset-step {
  margin-top: 16px;

  &.completed {
    .reset-step-number {
      color: var(--color-success);
    }

    .action-btn {
      background: var(--color-success);
    }
  }
}

.reset-step-row {
  @include flex-center;
  flex-wrap: wrap;
  gap: 8px 12px;

  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.reset-step-number {
  color: var(--color-primary);
  font-size: var(--font-size-24);
}

.reset-mail-body {
  width: 100%;
  margin-top: 12px;
}

.reset-actions {
  flex-wrap: wrap;
  gap: 8px;
}

.auth-submit-button {
  font-size: var(--font-size-18);

  @media (max-aspect-ratio: 1/1) {
    width: 100%;
    padding: 16px;
    font-size: var(--font-size-18);
  }
}

.err,
.success {
  margin-top: 10px;
  font-size: var(--font-size-16);
  font-weight: bold;
}

.err {
  color: $error-color;

  @media (max-aspect-ratio: 1/1) {
    font-size: var(--font-size-16);
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
  font-size: var(--font-size-20);
  line-height: 1;
  --glass-button-border-radius: var(--radius-full);
}
</style>
