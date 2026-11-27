<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="t('auth.confirm.deactivateAccount.title')"
    :close-label="t('common.button.close')"
    @update:model-value="handleClose"
  >
    <div class="delete-account-content">
      <p class="delete-account-warning">
        {{ t('auth.confirm.deactivateAccount.message') }}
      </p>

      <span class="field-label">
        {{ t('auth.confirm.deactivateAccount.passwordLabel') }}
      </span>
      <FormInput
        v-model="password"
        type="password"
        :placeholder="t('auth.confirm.deactivateAccount.passwordPlaceholder')"
        :show-password-toggle="true"
        :error="error"
      />

      <span class="field-label">
        {{ t('auth.confirm.deactivateAccount.confirmationLabel', { phrase }) }}
      </span>
      <FormInput
        v-model="confirmation"
        type="text"
        :placeholder="t('auth.confirm.deactivateAccount.confirmationPlaceholder')"
        :error="error"
      />

      <p
        v-if="error"
        class="delete-account-error"
      >
        {{ error }}
      </p>
    </div>

    <template #footer>
      <div class="delete-account-actions">
        <button
          type="button"
          class="btn-cancel"
          :disabled="loading"
          @click="handleClose"
        >
          {{ t('auth.confirm.deactivateAccount.cancel') }}
        </button>
        <button
          type="button"
          class="btn-danger"
          :disabled="!canConfirm || loading"
          @click="handleConfirm"
        >
          {{ loading ? t('common.loading') : t('auth.confirm.deactivateAccount.confirm') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import FormInput from '@/main/components/user/auth/FormInput.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'confirm'])
const { t } = useI18n()

const password = ref('')
const confirmation = ref('')

const phrase = computed(() => t('auth.confirm.deactivateAccount.confirmationPhrase'))

const canConfirm = computed(() => (
  password.value.length > 0 && confirmation.value.trim() === phrase.value
))

watch(() => props.visible, (visible) => {
  if (visible) {
    password.value = ''
    confirmation.value = ''
  }
})

function handleClose() {
  if (props.loading) return
  emit('close')
}

function handleConfirm() {
  if (!canConfirm.value || props.loading) return
  emit('confirm', { password: password.value })
}
</script>

<style scoped lang="scss">
.delete-account-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delete-account-warning {
  margin: 0 0 4px;
  color: #b91c1c;
  font-size: var(--font-size-14);
  line-height: 1.5;
}

.field-label {
  margin-top: 4px;
  color: var(--text-primary);
  font-size: var(--font-size-14);
  font-weight: 600;
}

.delete-account-error {
  margin: 4px 0 0;
  color: #b91c1c;
  font-size: var(--font-size-14);
}

.delete-account-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  width: 100%;

  button {
    min-width: 96px;
    padding: 10px 18px;
    color: #ffffff;
    font-size: var(--font-size-14);
    font-weight: 600;
    cursor: pointer;
    border: none;
    border-radius: var(--radius-md);

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .btn-cancel {
    background-color: #6b7280;

    &:hover:not(:disabled) {
      background-color: #4b5563;
    }
  }

  .btn-danger {
    background-color: #8b0000;

    &:hover:not(:disabled) {
      background-color: #a91f1f;
    }
  }
}
</style>
