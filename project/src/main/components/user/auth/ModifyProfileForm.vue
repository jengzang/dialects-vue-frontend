<template>
  <div class="modify-profile-form">
    <h3>{{ $t('auth.modifyProfile.welcome', { username: displayUsername }) }}</h3>

    <div v-if="safeUser" class="modify-avatar-card">
      <UserAvatarEditor
        ref="avatarEditorRef"
        class="modify-avatar-preview"
        :user="safeUser"
      />

      <button
        class="avatar-edit-btn"
        type="button"
        @click="avatarEditorRef?.open()"
      >
        🎨 {{ avatarEditText }}
      </button>
    </div>

    <!-- Tab Switcher -->
    <TabSwitcher
      :tabs="tabs"
      :modelValue="modeType"
      @update:modelValue="$emit('update:modeType', $event)"
    />

    <!-- Modify Username Section -->
    <div v-if="modeType === 'username'">
      <FormInput
        v-model="localNewUsername"
        type="text"
        :placeholder="$t('auth.modifyProfile.username.placeholder')"
        icon="👤"
        :error="error"
      />
      <div class="form-row">
        <button
          class="btn-search"
          type="button"
          :disabled="loading || !safeUser"
          @click="handleSaveUsername"
        >
          {{ $t('auth.modifyProfile.username.button') }}
        </button>
      </div>
    </div>

    <!-- Modify Password Section -->
    <div v-if="modeType === 'password'">
      <FormInput
        v-model="localCurrentPassword"
        type="password"
        :placeholder="$t('auth.modifyProfile.password.currentPlaceholder')"
        :showPasswordToggle="true"
        :error="error"
      />

      <FormInput
        v-model="localNewPassword"
        type="password"
        :placeholder="$t('auth.modifyProfile.password.newPlaceholder')"
        :showPasswordToggle="true"
        :error="error"
      />

      <div class="form-row">
        <button
          class="btn-search"
          type="button"
          :disabled="loading || !safeUser"
          @click="handleSavePassword"
        >
          {{ $t('auth.modifyProfile.password.button') }}
        </button>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <p v-if="error" class="err" v-html="error"></p>
    <p v-if="success" class="success" v-html="success"></p>

    <!-- Back Button -->
    <div class="form-row form-row-back">
      <button
        class="btn-search btn-back"
        type="button"
        @click="$emit('back')"
      >
        {{ $t('auth.modifyProfile.backButton') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FormInput from './FormInput.vue'
import TabSwitcher from './TabSwitcher.vue'
import UserAvatarEditor from './UserAvatarEditor.vue'

const { t, te } = useI18n()

const props = defineProps({
  user: {
    type: Object,
    default: null
  },
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
  modeType: {
    type: String,
    default: 'username'
  }
})

const emit = defineEmits(['saveUsername', 'savePassword', 'back', 'update:modeType'])

const avatarEditorRef = ref(null)

const safeUser = computed(() => props.user)

const displayUsername = computed(() => props.user?.username || '')

const avatarEditText = computed(() => (
  te('auth.profile.avatar.editButton')
    ? t('auth.profile.avatar.editButton')
    : t('auth.profile.avatar.editOverlay')
))

const tabs = computed(() => [
  { label: '👤 ' + t('auth.modifyProfile.tabs.username'), value: 'username' },
  { label: '🔒 ' + t('auth.modifyProfile.tabs.password'), value: 'password' }
])

const localNewUsername = ref('')
const localCurrentPassword = ref('')
const localNewPassword = ref('')

const handleSaveUsername = () => {
  emit('saveUsername', { newUsername: localNewUsername.value })
}

const handleSavePassword = () => {
  emit('savePassword', {
    currentPassword: localCurrentPassword.value,
    newPassword: localNewPassword.value
  })
}
</script>

<style scoped lang="scss">
.modify-profile-form {
  padding: 12px;
  text-align: center;
}

h3 {
  margin: 0 0 16px;
  color: #1c1c1e;
  font-size: 30px;
  font-weight: 700;
}

.modify-avatar-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 16px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 22px;
  box-shadow:
    0 18px 46px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}

.modify-avatar-preview {
  flex-shrink: 0;
}

.avatar-edit-btn {
  min-height: 36px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  background: linear-gradient(135deg, #007aff, #0051d5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 10px 22px rgba(0, 122, 255, 0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 14px 30px rgba(0, 122, 255, 0.3);
  }

  &:active {
    transform: translateY(0) scale(0.985);
  }
}

.form-row {
  width: 100%;
  margin: 12px 0;
  display: flex;
  justify-content: center;
}

.form-row-back {
  margin-top: 10px;
}

.btn-search {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(0, 122, 255, 0.24);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.btn-back {
  background: linear-gradient(135deg, #b8860b, #8a5a00);

  &:hover:not(:disabled) {
    box-shadow: 0 10px 24px rgba(184, 134, 11, 0.22);
  }
}

.err,
.success {
  margin-top: 10px;
  font-size: 15px;
  font-weight: 700;
}

.err {
  color: #ff3b30;
}

.success {
  color: #34c759;
}

@media (max-width: 480px) {
  .modify-avatar-card {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .avatar-edit-btn {
    width: 100%;
  }
}

@media (max-aspect-ratio: 1/1) {
  .btn-search {
    width: 100%;
    padding: 16px;
    font-size: 18px;
  }

  .err,
  .success {
    font-size: 16px;
  }
}
</style>