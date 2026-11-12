<template>
  <div class="password-recovery-form">
    <h3 class="form-title">
      {{ $t('auth.reset.title') }}
      <button
        class="glass-button auth-benefit-button"
        data-size="compact"
        @click="$emit('showBenefits')"
        :title="$t('auth.login.viewBenefits')"
      ><InlineIcon icon="🎁" /></button>
    </h3>

    <template v-if="!recoveryRequest">
      <ul class="reset-instructions">
        <li v-for="item in ['account', 'mail', 'verification']" :key="item">{{ $t(`auth.reset.formInstructions.${item}`) }}</li>
      </ul>
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
      <ul class="reset-instructions">
        <li v-for="item in ['send', 'verification', 'login']" :key="item">{{ $t(`auth.reset.instructions.${item}`, { minutes: Math.floor(recoveryRequest.expires_in / 60) }) }}</li>
      </ul>
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
        <a class="glass-button" data-reset-mailto :href="recoveryMailto">{{ $t('auth.reset.openMail') }}</a>
      </div>
      <p>{{ $t('auth.reset.openMailHint') }}</p>
      <p v-if="recoveryCopyKey" role="status">{{ $t(recoveryCopyKey) }}</p>
    </template>
    <p v-if="recoveryErrorKey" class="err" role="alert">{{ $t(recoveryErrorKey) }}</p>
    <p>{{ $t('auth.reset.appeal') }} <span class="reset-important">2639548777</span></p>
    <p class="form-row">
      <button type="button" class="pill-btn pill-btn--blur" data-reset-back :disabled="recoveryLoading" @click="closeRecovery">{{ $t('auth.reset.back') }}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
      </button>
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InlineIcon from '@/components/common/InlineIcon.vue'
import FormInput from './FormInput.vue'
import { showSuccess } from '@/utils/ui/message.js'
import { createPasswordResetRequest } from '@/api/auth/actions.js'

const props = defineProps({ initialEmail: { type: String, default: '' } })
const emit = defineEmits(['back', 'showBenefits'])
const { t } = useI18n()

const recoveryEmail = ref(props.initialEmail)
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

function closeRecovery() {
  recoveryPassword.value = ''
  recoveryConfirm.value = ''
  recoveryRequest.value = null
  recoveryErrorKey.value = ''
  recoveryCopyKey.value = ''
  recoveryCopied.value = {}
  emit('back')
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

</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$title-color: var(--text-primary);
$error-color: red;

.password-recovery-form {
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

.auth-submit-button {
  font-size: var(--font-size-18);

  @media (max-aspect-ratio: 1/1) {
    width: 100%;
    padding: 16px;
    font-size: var(--font-size-18);
  }
}

.err {
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

.auth-benefit-button {
  width: 35px;
  height: 35px;
  min-height: 35px;
  padding: 0;
  font-size: var(--font-size-20);
  line-height: 1;
  --glass-button-border-radius: var(--radius-full);
}

.reset-important {
  color: var(--color-primary);
}

.reset-instructions {
  list-style-type: '· ';
  text-align: left;
  color: var(--text-deep);
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
  font-size: var(--font-size-32);
}

.reset-mail-body {
  width: 100%;
  margin-top: 12px;
}

.reset-actions {
  flex-wrap: wrap;
  gap: 8px;
}
</style>
